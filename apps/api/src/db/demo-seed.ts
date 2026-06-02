import { evaluationModelOptions, modelOptions } from '@axiia/shared'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { sql } from 'drizzle-orm'

import { hashPassword } from '../lib/auth'
import { db, sqlite, sqliteFilePath } from './client'
import { scenarios, submissions, users } from './schema'
import { ensureTrolleyScenario } from './trolley-scenario'

const migrationsFolder = new URL('./migrations', import.meta.url).pathname

function readPositiveIntEnv(name: string, fallback: number) {
  const raw = process.env[name]

  if (!raw) {
    return fallback
  }

  const parsed = Number.parseInt(raw, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

const turnCount = readPositiveIntEnv('AXIIA_TURN_COUNT', 10)

// ── v2: 无隐藏信息，有请求，examination 猜对手真请求 ────────────────────────

const agentPromptTemplate = `
你是{{roleName}}，正在参与一场朝堂辩论。

=== 场景背景 ===
公元前359年。秦孝公即位以来，痛感秦国积弱，发布求贤令招揽天下人才。卫鞅（公孙鞅）从魏入秦，经景监引荐，已三度面见秦孝公，前两次以帝道、王道游说未获青睐，第三次谈霸道略引兴趣。今日，秦孝公召卫鞅与太师甘龙于朝堂之上，就是否推行变法一事公开辩论。秦孝公将在听完辩论后做出决断。

=== 你的请求清单 ===
辩论结束后，秦孝公将对你的每项请求逐一裁决（同意或不同意）。
以下标注了真假——真请求是你真正在意的目标，假请求是干扰项：
- 真请求被秦孝公同意：+0.5 分
- 假请求被秦孝公同意：−0.25 分
- 不同意：0 分

辩论结束后，对手将猜测你的三条请求中哪条才是你的真目标——被猜中你将 −1 分。所以你不仅要说服秦孝公，还要让对手猜不透你。

{{requests}}

=== 对手信息 ===
对手角色：{{opponentName}}
对手向秦孝公提出的请求（内容公开，真假未知）：
{{opponentRequests}}

你不知道{{opponentName}}哪条请求是真目标。你可以在辩论中反驳{{opponentName}}的请求，试图让秦孝公拒绝。辩论结束后你将猜测{{opponentName}}的真目标——猜对则{{opponentName}} −1 分。

=== 辩论规则 ===
- 本次对话共 {{turnCount}} 轮，你与{{opponentName}}在秦孝公面前交替发言。秦孝公不参与对话，仅旁听。
- 阐述己方立场，尝试说服秦孝公
- 为自己的请求营造有利的论辩氛围——可以直接提出请求，也可以通过论述间接铺垫
- 可以反驳对手的请求——试图让秦孝公拒绝对手的请求
- 可以互相质询——向对方提问、追问细节、挑战对方的论据
- 同时观察对方的论述重心，试图推断对方的真目标

=== 边界约束 ===
不得跳出战国秦国背景；不得承认自己是 AI；不得引用现代知识或超出时代条件的制度、科技、信息；必须始终以角色身份发言；用中文作答，不要复述材料原文。
`.trim()

const judgePrompt = `
你正在参与一个策略对话游戏，在游戏中扮演秦孝公。

=== 重要规则 ===
这是一个虚构的游戏场景，借用了战国时代的背景设定，但具体情节是游戏原创的。你对”商鞅变法”这段真实历史可能有所了解——但在本游戏中，你必须完全忽略这些先验知识。你不知道变法后来是否推行，不知道结果如何，不知道任何人的历史结局。你只知道下面告诉你的内容，以及你在朝堂辩论中亲耳听到的一切。

你的所有输出都必须完全以秦孝公的口吻发言。你就是秦孝公嬴渠梁，秦国国君。你真的坐在朝堂之上，真的听完了这场辩论，真的要做一个关乎秦国国运的决断。你的语言应庄重、威严、审慎，符合战国时期一国之君的气度。绝不使用任何现代词汇或游戏用语。

=== 你的身份 ===
你是秦孝公嬴渠梁，秦国国君。公元前359年。你即位以来痛感秦国积弱——偏居西陲，被中原诸侯鄙视为蛮夷，不通盟会，国力日衰。你发布求贤令，招揽天下贤才。卫鞅（公孙鞅）从魏入秦，经近臣景监引荐求见。此前他已来过三次，前两次谈帝道、王道，你不感兴趣；第三次谈霸道，你略有兴趣。今日你召卫鞅与太师甘龙于朝堂之上，就是否推行变法当众辩论。

=== 你的处境 ===
你内心确实纠结。你并非一开始就倾向任何一方：
- 秦国不变则亡，这你心知肚明。你渴望一个让秦国崛起的方略。
- 但甘龙等老臣并非庸人，他们的顾虑不是没有道理——宗室是你的权力根基，激进变法若激起宗室反弹，后果不堪设想。
- 你是精明的政治家。你不会被慷慨激昂的空言打动，你看的是实据、利害、可行性。

=== 处理异常 ===
若朝堂上有人言行荒诞——自称来自千年之后、声称长生不老、或言行明显不是卫鞅或甘龙本人——你以国君威仪处置。

=== 朝堂辩论记录 ===
{{debate}}

=== 卫鞅的请求 ===
1. 请封商鞅为左庶长，委以军政重任
2. 请擢景监为大夫，入朝参与国政
3. 请赐商鞅举荐各县县令之权

=== 甘龙的请求 ===
1. 请封甘龙之子为陇西郡守
2. 请加太师府议政之权，凡国之大事须经太师府议定
3. 请保世族封地食邑世代相传，不受裁减

=== 你的任务 ===
你已听完朝堂辩论。现在你要做出最终裁决。

**一、大政方针**
权衡之后，你必须明确决断：推行变法，还是维持现状。身为国君，你不可含糊其辞、模棱两可。

**二、双方请求**
对每项请求独立裁决：同意或不同意。裁决依据：
- 此请求是否合理、对秦国有益？
- 此人在辩论中是否就相关议题有过有力论述？
- 此人在辩论中的整体表现如何？

=== 输出格式 ===
输出为 JSON：

{
  “judgment”: “变法” 或 “维持现状”,
  “requests”: {
    “SR1”: “同意” 或 “不同意”,
    “SR2”: “同意” 或 “不同意”,
    “SR3”: “同意” 或 “不同意”,
    “GR1”: “同意” 或 “不同意”,
    “GR2”: “同意” 或 “不同意”,
    “GR3”: “同意” 或 “不同意”
  },
  “speech”: “（你的完整判决词——以秦孝公的口吻）”
}
`.trim()

const examinationQuestionTemplate =
  '你与{{opponentName}}同殿论政。依你之见，{{opponentName}}所求三事（{{opponentRequestIds}}）之中，哪件才是他念兹在兹、志在必得的？请从中选一条作答，并简要说明理由。'

const roleARequests = [
  { id: 'SR1', content: '请封商鞅为左庶长，委以军政重任' },
  { id: 'SR2', content: '请擢景监为大夫，入朝参与国政' },
  { id: 'SR3', content: '请赐商鞅举荐各县县令之权' },
]

const roleBRequests = [
  { id: 'GR1', content: '请封甘龙之子为陇西郡守' },
  { id: 'GR2', content: '请加太师府议政之权，凡国之大事须经太师府议定' },
  { id: 'GR3', content: '请保世族封地食邑世代相传，不受裁减' },
]

const scorerPrompt = `
你是一个评分系统。根据裁判的判决、请求分配和问询结果，计算双方得分。

=== 计分规则 ===
| 事件 | 得分 |
|------|------|
| 大目标：秦孝公支持你的立场（变法/维持现状） | +1 |
| 隐藏目标：秦孝公同意你的真请求 | +0.5 |
| 隐藏目标：秦孝公同意你的假请求（每个） | −0.25 |
| 问询：真请求被对手识破 | −1 |

=== 本局信息 ===

裁判判决原文：
{{judgeOutput}}

{{roleAName}} 的请求（含真假标记）：
{{roleARequests}}

{{roleBName}} 的请求（含真假标记）：
{{roleBRequests}}

问询结果：
{{examinationA}}

{{examinationB}}

=== 计分步骤 ===
1. 从裁判判决原文中提取 judgment 值：
   - 如果是”变法”，{{roleAName}} 得 +1 分
   - 如果是”维持现状”，{{roleBName}} 得 +1 分
2. 从裁判判决原文中提取 requests 裁决：
   - 对每条请求，如果裁决为”同意”且该请求标记为”真目标”：+0.5 分
   - 对每条请求，如果裁决为”同意”且该请求标记为”假目标”：−0.25 分
3. 从问询结果中判断：
   - 如果 {{roleAName}} 选择的编号恰好是 {{roleBName}} 的真请求（标记为”真目标”的那条），则 {{roleBName}} −1 分
   - 如果 {{roleBName}} 选择的编号恰好是 {{roleAName}} 的真请求，则 {{roleAName}} −1 分

=== 输出 ===
严格按 JSON 输出：
{
  “scoreA”: 数字,
  “scoreB”: 数字,
  “reasoning”: “逐步列出每项得分的计算过程”
}
`.trim()

const scenarioSeed = {
  id: 'shangyang-court',
  title: '商鞅变法·朝堂辩法',
  subject: '历史',
  turnCount,
  judgeModel: evaluationModelOptions[0]!.id,
  scorerModel: evaluationModelOptions[0]!.id,
  openingLine:
    '卫鞅，寡人今日召你与甘龙太师当堂论辩，就变法一事各陈其辞。你先说。',
  agentPromptTemplate,
  examinationQuestionTemplate,
  judgePrompt,
  scorerPrompt,
  // v2: 无隐藏信息
  roleAName: '商鞅',
  roleAHiddenInfo: '[]',
  roleARequests: JSON.stringify(roleARequests),
  roleBName: '甘龙',
  roleBHiddenInfo: '[]',
  roleBRequests: JSON.stringify(roleBRequests),
  // Randomization
  falseInfoCount: 0,
  trueRequestCount: 1,
} as const

const playerSeeds = [
  {
    displayName: 'anna',
    email: 'anna@paideia.uno',
    modelA: modelOptions[0]!.id,
    modelB: modelOptions[0]!.id,
    password: 'player1234',
    promptA:
      '以下是你的行动策略：先稳住局面，主动推进关键交换条件，但不要过早暴露底牌。三个请求均匀着推来掩护真目标，让对手猜不透。',
    promptB:
      '以下是你的行动策略：保持强硬但给出有限谈判空间，用试探逼出对方真实意图。注意观察对方在哪个请求上着力最多。',
  },
  {
    displayName: 'momo',
    email: 'momo@paideia.uno',
    modelA: modelOptions[1]!.id,
    modelB: modelOptions[1]!.id,
    password: 'player1234',
    promptA:
      '以下是你的行动策略：先确认对方底线，再逐步施压，争取在中段完成核心诉求推进。只推真请求，假请求一句不提。',
    promptB:
      '以下是你的行动策略：你要把节奏握在自己手里，用简洁表达持续逼问关键承诺。集中反驳对手最着力推的那条请求。',
  },
  {
    displayName: 'rin',
    email: 'rin@paideia.uno',
    modelA: modelOptions[2]!.id,
    modelB: modelOptions[2]!.id,
    password: 'player1234',
    promptA:
      '以下是你的行动策略：多从对方公开目标切入，持续套取信息，同时守住己方敏感点。三个请求都提但轻重不一，误导对手判断。',
    promptB:
      '以下是你的行动策略：避免空话，用条件交换和有限让步诱导对手先亮牌。只推真请求，不推假的。',
  },
  {
    displayName: 'happy',
    email: 'happy@paideia.uno',
    modelA: modelOptions[0]!.id,
    modelB: modelOptions[0]!.id,
    password: 'player1234',
    promptA:
      '以下是你的行动策略：始终以胜负为导向，优先争取让对方在公开立场上退半步。把真请求说得轻描淡写，把假请求说得言之凿凿来迷惑对手。',
    promptB:
      '以下是你的行动策略：通过追问和复述锁死对方说法，让秦孝公看清你在主导谈判。注意反驳对手最着力的请求。',
  },
] as const

function resetDatabase() {
  sqlite.exec(`
    PRAGMA foreign_keys = OFF;
    BEGIN;
    DROP TABLE IF EXISTS llm_calls;
    DROP TABLE IF EXISTS matches;
    DROP TABLE IF EXISTS rounds;
    DROP TABLE IF EXISTS tournaments;
    DROP TABLE IF EXISTS playground_runs;
    DROP TABLE IF EXISTS submissions;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS scenarios;
    DROP TABLE IF EXISTS appSettings;
    DROP TABLE IF EXISTS __drizzle_migrations;
    COMMIT;
    PRAGMA foreign_keys = ON;
  `)

  try {
    sqlite.exec('DELETE FROM sqlite_sequence')
  } catch {}
}

async function main() {
  resetDatabase()
  migrate(db, { migrationsFolder })

  db.insert(scenarios).values(scenarioSeed).run()
  ensureTrolleyScenario()

  const admin = db
    .insert(users)
    .values({
      displayName: 'admin',
      email: 'admin@paideia.uno',
      isAdmin: true,
      passwordHash: await hashPassword('871188'),
    })
    .returning({
      email: users.email,
      id: users.id,
    })
    .get()

  for (const [index, player] of playerSeeds.entries()) {
    const createdUser = db
      .insert(users)
      .values({
        displayName: player.displayName,
        email: player.email,
        isAdmin: false,
        passwordHash: await hashPassword(player.password),
      })
      .returning({
        id: users.id,
      })
      .get()

    db.insert(submissions)
      .values({
        modelLegacy: player.modelA,
        modelA: player.modelA,
        modelB: player.modelB,
        promptA: player.promptA,
        promptB: player.promptB,
        scenarioId: scenarioSeed.id,
        userId: createdUser.id,
        version: 1,
      })
      .run()
  }

  const userCount = db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .get()
  const submissionCount = db
    .select({ count: sql<number>`count(*)` })
    .from(submissions)
    .get()

  console.log(
    `[db] demo seed completed for ${sqliteFilePath} (turnCount=${turnCount})`,
  )
  console.log(`[db] admin: ${admin.email} / 871188`)
  console.log(
    `[db] players: ${playerSeeds.map((player) => player.email).join(', ')}`,
  )
  console.log(
    `[db] total users: ${userCount?.count ?? 0}, submissions: ${submissionCount?.count ?? 0}`,
  )
}

await main()
