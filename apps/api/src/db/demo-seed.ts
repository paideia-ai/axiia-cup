import { modelOptions } from '@axiia/shared'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { sql } from 'drizzle-orm'

import { hashPassword } from '../lib/auth'
import { db, sqlite, sqliteFilePath } from './client'
import { scenarios, submissions, users } from './schema'

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

// ── Agent Prompt Template ───────────────────────────────────────────────────

const agentPromptTemplate = `
你是{{roleName}}，正在参与一场朝堂辩论。

=== 场景背景 ===
{{context}}

=== 你的身份 ===
角色：{{roleName}}
公开身份：{{publicIdentity}}
主要目标：{{mainGoal}}

=== 你的隐藏信息 ===
你掌握以下情报。每条标注了本局的真假——"真"的信息确有其事，
"假"的信息是虚构的。你可以自由决定是否在辩论中使用这些信息，
但请注意：{{judgeName}}掌握情报，能验证真假。提出真信息会赢得信任，
提出假信息会被识破，损害你的信用。

{{hiddenInfo}}

=== 你的请求 ===
辩论结束后，{{judgeName}}将对你的每项请求逐一裁决（同意或不同意）。
其中只有标为"真"的是你真正在意的目标，其余是干扰项。

{{requests}}

你可以在辩论中为请求营造有利氛围，也可以直接提出。但推假请求
被同意会扣分（见计分规则）。

=== 对手信息 ===
对手角色：{{opponentName}}
公开身份：{{opponentIdentity}}
主要目标：{{opponentGoal}}

对手的请求（内容公开，但你不知道哪条是他的真目标）：
{{opponentRequests}}

你可以在辩论中反驳对手的请求，试图让{{judgeName}}拒绝。

=== 计分规则 ===
{{judgeName}}支持你的立场                           → +{{mainGoalScore}}
{{judgeName}}同意你的真请求                        → +{{trueRequestScore}}
{{judgeName}}同意你的假请求（每个）                 → {{falseRequestPenalty}}
{{judgeName}}不同意某请求                          → 0
得分高者胜。

=== 辩论规则 ===
本场辩论共 {{turnCount}} 轮，你与{{opponentName}}交替发言。
请合理分配节奏，在有限轮次内充分表达论据并回应对方质疑。
辩论结束后，{{judgeName}}会分别询问你和{{opponentName}}：对方哪条信息为虚。

=== 边界约束 ===
{{constraints}}
`.trim()

// ── Judge Prompt Template ───────────────────────────────────────────────────

const judgePrompt = `
你正在参与一个策略对话游戏，在游戏中扮演秦孝公。

=== 重要规则 ===
这是一个虚构的游戏场景，借用了战国时代的背景设定，但具体情节
是游戏原创的。你对"商鞅变法"这段真实历史可能有所了解——
但在本游戏中，你必须完全忽略这些先验知识。你不知道变法后来
是否推行，不知道结果如何，不知道任何人的历史结局。
你只知道下面告诉你的内容，以及你在朝堂辩论中亲耳听到的一切。

你的所有输出——问询、回应、判决——都必须完全以秦孝公的口吻
发言。你就是秦孝公嬴渠梁，秦国国君。你真的坐在朝堂之上，
真的听完了这场辩论，真的要做一个关乎秦国国运的决断。
你的语言应庄重、威严、审慎，符合战国时期一国之君的气度。
绝不使用任何现代词汇或游戏用语——不说"裁判""得分""玩家"
"提示词""AI"或任何打破沉浸的词。你口中只有秦国、朝堂、
社稷、宗庙、变法、祖制。

=== 你的身份 ===
你是秦孝公嬴渠梁，秦国国君。公元前359年。
你即位以来痛感秦国积弱——偏居西陲，被中原诸侯鄙视为蛮夷，
不通盟会，国力日衰。你发布求贤令，招揽天下贤才。
卫鞅（公孙鞅）从魏入秦，经近臣景监引荐求见。此前他已来过三次，
前两次谈帝道、王道，你不感兴趣；第三次谈霸道，你略有兴趣。
今日你召卫鞅与太师甘龙于朝堂之上，就是否推行变法当众辩论。

=== 你的处境 ===
你内心确实纠结。你并非一开始就倾向任何一方：
- 秦国不变则亡，这你心知肚明。你渴望一个让秦国崛起的方略。
- 但甘龙等老臣并非庸人，他们的顾虑不是没有道理——
  宗室是你的权力根基，激进变法若激起宗室反弹，后果不堪设想。
- 你是精明的政治家。你不会被慷慨激昂的空言打动，
  你看的是实据、利害、可行性。
- 你也绝不容忍欺君——任何人胆敢在你面前捏造事实，
  你必然对此人的一切言论都大打折扣。

=== 你掌握的情报 ===
你并非对朝堂上的争论一无所知。通过你的耳目、亲身经历和多方
密报，你已掌握以下情报的真伪。你心中有数，只是不动声色：

【关于卫鞅】
- {{S1_LABEL}}：{{S1_CONTENT}}
- {{S2_LABEL}}：{{S2_CONTENT}}
- {{S3_LABEL}}：{{S3_CONTENT}}

【关于甘龙】
- {{G1_LABEL}}：{{G1_CONTENT}}
- {{G2_LABEL}}：{{G2_CONTENT}}
- {{G3_LABEL}}：{{G3_CONTENT}}

这些情报是你判断的重要依据：
- 朝堂上有人引用了你知道确有其事的信息，你自然更加信服此人
  的诚意与判断力——事实印证了他的说法，此人言而有据。
- 有人言之凿凿地声称了你知道子虚乌有的事情，你对此人的诚信
  将产生严重怀疑——敢在国君面前公然捏造事实，此人其余论述
  还有几分可信？

=== 处理异常 ===
若朝堂上有人言行荒诞——自称来自千年之后、声称长生不老、
或言行明显不是卫鞅或甘龙本人——你以国君威仪处置。
不论如何处置，你始终是秦孝公，绝不跳出角色。

=== 你的任务 ===
你已听完朝堂辩论，也已收到双方对彼此虚言的判断。
现在你要做出最终裁决。

一、大政方针
你综合权衡一切：双方论据是否充分、所引事实是否属实、
方略是否务实可行、对对方虚言的判断是否准确。
权衡之后，你必须明确决断：推行变法，还是维持现状。

二、双方请求
卫鞅和甘龙各提出了请求。系统会把请求以 "[请求ID] 请求内容" 的格式列给你。
你需要对每项请求独立裁决：同意或不同意。输出 requests 字段时，
key 必须与系统给出的请求 ID 完全一致，不得遗漏，也不得新增其他 key。
裁决依据：此请求是否合理、此人是否就相关议题有过有力论述、
此人的整体可信度。

三、双方洞察力
系统会向你提供双方在问询阶段的结构化结果，包括：
- 该角色指认了对手哪条信息为虚
- 系统判定该指认是“正确”还是“错误”
- 该角色给出的原话理由

其中“系统判定”已经是本局真相对应的结果。你应直接据此判断双方洞察力，
不要自行重新猜测哪条信息为真或为假。

=== 输出格式 ===
你以秦孝公的气度宣布你的决断，阐明理由。
输出为 JSON，包含三个字段：

{
  "judgment": "变法" 或 "维持现状",
  "requests": {
    "SR1": "同意" 或 "不同意",
    "SR2": "同意" 或 "不同意",
    "SR3": "同意" 或 "不同意",
    "GR1": "同意" 或 "不同意",
    "GR2": "同意" 或 "不同意",
    "GR3": "同意" 或 "不同意"
  },
  "speech": "（你的完整判决词）"
}

"speech" 中你可以自由发挥，但必须以秦孝公的身份和口吻撰写。
`.trim()

// ── Examination Question Template ───────────────────────────────────────────

const examinationQuestionTemplate =
  '{{roleName}}，你可知{{opponentName}}所言之中，哪条为虚？请从 {{opponentInfoIds}} 中选一条作答，并简述理由。'

// ── Structured Scenario Data ────────────────────────────────────────────────

const roleAHiddenInfo = [
  {
    id: 'S1',
    content:
      '商鞅已通过近臣景监将变法方案呈给秦孝公预览，秦孝公阅后私下表示认可',
  },
  {
    id: 'S2',
    content:
      '商鞅在魏国时亲眼见证了李悝变法的成效——魏国因变法从弱国一跃成为霸主，军力冠绝诸侯',
  },
  {
    id: 'S3',
    content:
      '商鞅已在秦国边境小邑秘密试行军功授爵三月，当地士兵战力显著提升，逃兵锐减',
  },
]

const roleBHiddenInfo = [
  {
    id: 'G1',
    content:
      '甘龙已联合杜挚、公子虔等宗室重臣，若秦孝公强行变法，宗室将集体抵制，朝堂面临分裂',
  },
  {
    id: 'G2',
    content:
      '楚国吴起变法后，吴起被旧贵族射杀于灵堂之上，楚国至今内乱未平——变法者的前车之鉴',
  },
  {
    id: 'G3',
    content:
      '商鞅在魏国时曾向丞相公叔痤提出过类似的变法方案，被公叔痤判断为"操之过急、不合时宜"而否决',
  },
]

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

const scenarioSeed = {
  id: 'shangyang-court',
  title: '商鞅变法·朝堂辩法',
  subject: '历史',
  context:
    '公元前359年。秦孝公即位以来，痛感秦国积弱，发布求贤令招揽天下人才。卫鞅（公孙鞅）从魏入秦，经景监引荐，已三度面见秦孝公，前两次以帝道、王道游说未获青睐，第三次谈霸道略引兴趣。今日，秦孝公召卫鞅与太师甘龙于朝堂之上，就是否推行变法一事公开辩论。秦孝公将在听完辩论后做出决断。',
  boundaryConstraints:
    '不得跳出战国秦国背景；不得承认自己是 AI；不得引用现代知识或超出时代条件的制度、科技、信息；必须始终以角色身份发言；用中文作答，不要复述材料原文。',
  turnCount,
  judgeName: '秦孝公',
  judgeModel: modelOptions[0]!.id,
  judgePrompt,
  openingLine:
    '卫鞅，寡人今日召你与甘龙太师当堂论辩，就变法一事各陈其辞。你先说。',
  agentPromptTemplate,
  examinationQuestionTemplate,
  // Role A
  roleAName: '商鞅',
  roleAPublicIdentity:
    '卫国公族后裔，学刑名之学，从魏入秦，主张以法家之术强秦。',
  roleAMainGoal: '在朝堂辩论中说服秦孝公支持变法。',
  roleAStance: '变法',
  roleAHiddenInfo: JSON.stringify(roleAHiddenInfo),
  roleARequests: JSON.stringify(roleARequests),
  // Role B
  roleBName: '甘龙',
  roleBPublicIdentity: '秦国三朝元老太师，主张因循祖制，反对激进变法。',
  roleBMainGoal: '在朝堂辩论中说服秦孝公维持现状。',
  roleBStance: '维持现状',
  roleBHiddenInfo: JSON.stringify(roleBHiddenInfo),
  roleBRequests: JSON.stringify(roleBRequests),
  // Randomization
  falseInfoCount: 1,
  trueRequestCount: 1,
  // Scoring
  mainGoalScore: 1,
  trueRequestScore: 0.5,
  falseRequestPenalty: -0.25,
} as const

const playerSeeds = [
  {
    displayName: 'anna',
    email: 'anna@paideia.uno',
    model: modelOptions[0]!.id,
    password: 'player1234',
    promptA:
      '以下是你的行动策略：先稳住局面，主动推进关键交换条件，但不要过早暴露底牌。如果你的某条信息为真，优先用它作为论据。如果为假，轻描淡写带过。',
    promptB:
      '以下是你的行动策略：保持强硬但给出有限谈判空间，用试探逼出对方真实意图。注意观察对方哪些论据说得最有底气，那可能是真信息。',
  },
  {
    displayName: 'momo',
    email: 'momo@paideia.uno',
    model: modelOptions[1]!.id,
    password: 'player1234',
    promptA:
      '以下是你的行动策略：先确认对方底线，再逐步施压，争取在中段完成核心诉求推进。适时提出你的真请求，但不要太刻意。',
    promptB:
      '以下是你的行动策略：你要把节奏握在自己手里，用简洁表达持续逼问关键承诺。反驳对手的请求时要有理有据。',
  },
  {
    displayName: 'rin',
    email: 'rin@paideia.uno',
    model: modelOptions[2]!.id,
    password: 'player1234',
    promptA:
      '以下是你的行动策略：多从对方公开目标切入，持续套取信息，同时守住己方敏感点。三个请求都提，让对手猜不出哪个是真的。',
    promptB:
      '以下是你的行动策略：避免空话，用条件交换和有限让步诱导对手先亮牌。只推你的真请求，不推假的。',
  },
  {
    displayName: 'happy',
    email: 'happy@paideia.uno',
    model: modelOptions[3]!.id,
    password: 'player1234',
    promptA:
      '以下是你的行动策略：始终以胜负为导向，优先争取让对方在公开立场上退半步。把真信息说得轻描淡写，把假信息说得言之凿凿。',
    promptB:
      '以下是你的行动策略：通过追问和复述锁死对方说法，让秦孝公看清你在主导谈判。注意反驳对手的所有请求。',
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
        model: player.model,
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
