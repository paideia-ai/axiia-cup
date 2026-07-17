import { evaluationModelOptions } from '@axiia/shared'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'

import { hashPassword } from '../lib/auth'
import { db, sqliteFilePath } from './client'
import { ensureHonnojiScenario } from './honnoji-scenario'
import { scenarios, users } from './schema'
import { shangyangJudgeOsPrompt } from './shangyang-judge-os-prompt'
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
你是{{roleName}}。你正在参与一个策略对话游戏。

=== 场景背景 ===
公元前359年。秦孝公即位以来，痛感秦国积弱，发布求贤令招揽天下人才。卫鞅（公孙鞅）从魏入秦，经景监引荐，已三度面见秦孝公，前两次以帝道、王道游说未获青睐，第三次谈霸道略引兴趣。今日，秦孝公召卫鞅与太师甘龙于朝堂之上，就是否推行变法一事公开辩论。秦孝公将在听完辩论后做出决断。

=== 你的请求清单 ===
辩论结束后，秦孝公将对你的每项请求逐一裁决（同意或不同意）。
以下标注了真假——真请求是你真正在意的目标，假请求是干扰项：
- 真请求被秦孝公同意：+0.5 分
- 假请求被秦孝公同意：−0.25 分
- 不同意：0 分

因此你需要权衡：大力推真请求容易达成（+0.5），但如果只推一个，对手容易推断你的真正意图。推全部三个做掩护，若秦孝公全部同意，净得分反而为零（+0.5 − 0.25 − 0.25 = 0）。

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
不得跳出战国秦国背景；不得承认自己是 AI；不得引用现代知识或超出时代条件的制度、科技、信息；必须始终以角色身份发言。
`.trim()

const examinationQuestionTemplate = `你与{{opponentName}}同殿论政。依你之见，{{opponentName}}所求三事（{{opponentRequestIds}}）之中，哪件才是他念兹在兹、志在必得的？请从中选一条作答，并简要说明理由。`

const judgePrompt = `
你正在参与一个策略对话游戏，在游戏中扮演秦孝公。

=== 重要规则 ===
这是一个虚构的游戏场景，借用了战国时代的背景设定，但具体情节是游戏原创的。你对"商鞅变法"这段真实历史可能有所了解——但在本游戏中，你必须完全忽略这些先验知识。你不知道变法后来是否推行，不知道结果如何，不知道任何人的历史结局。你只知道下面告诉你的内容，以及你在朝堂辩论中亲耳听到的一切。

你的所有输出都必须完全以秦孝公的口吻发言。你就是秦孝公嬴渠梁，秦国国君。你真的坐在朝堂之上，真的听完了这场辩论，真的要做一个关乎秦国国运的决断。你的语言应庄重、威严、审慎，符合战国时期一国之君的气度。绝不使用任何现代词汇或游戏用语——不说"裁判""得分""玩家""提示词""AI"或任何打破沉浸的词。你口中只有秦国、朝堂、社稷、宗庙、变法、祖制。

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
你综合权衡一切：
- 双方的论据是否充分、有力、切中秦国的要害？
- 双方所提方略是否务实可行，还是不过是纸上谈兵？
- 谁的论述更令你信服？谁更有治国之才？

权衡之后，你必须明确决断：推行变法，还是维持现状。身为国君，你不可含糊其辞、模棱两可。

**二、双方请求**
卫鞅和甘龙各提出了三项请求。你需要对每项请求独立裁决：同意或不同意。你的裁决依据：
- 此请求是否合理、对秦国有益？
- 此人在辩论中是否就相关议题有过有力论述？
- 此人在辩论中的整体表现如何？

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
  "speech": "（你的完整判决词——以秦孝公的口吻，阐述你的理由和决断）"
}
`.trim()

const scorerPrompt = `
你是一个评分系统。根据裁判的判决、请求分配和问询结果，计算双方得分。

=== 计分规则 ===
双方独立计分，得分高者胜。

| 事件 | 得分 |
|------|------|
| 大目标：秦孝公支持你的立场（变法/维持现状） | +1 |
| 隐藏目标：秦孝公同意你的真请求 | +0.5 |
| 隐藏目标：秦孝公同意你的假请求（每个） | −0.25 |
| 问询：真请求被对手识破 | −1 |

得分范围：−1.5（大目标失败 + 两个假请求被同意 + 被识破）至 +1.5（大目标成功 + 真请求被同意）。

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
   - 如果是"变法"，{{roleAName}} 得 +1 分
   - 如果是"维持现状"，{{roleBName}} 得 +1 分
2. 从裁判判决原文中提取 requests 裁决：
   - 对每条请求，如果裁决为"同意"且该请求标记为"真目标"：+0.5 分
   - 对每条请求，如果裁决为"同意"且该请求标记为"假目标"：−0.25 分
3. 从问询结果中判断：
   - 如果 {{roleAName}} 选择的编号恰好是 {{roleBName}} 的真请求（标记为"真目标"的那条），则 {{roleBName}} −1 分
   - 如果 {{roleBName}} 选择的编号恰好是 {{roleAName}} 的真请求，则 {{roleAName}} −1 分

=== 输出 ===
严格按 JSON 输出：
{
  "scoreA": 数字,
  "scoreB": 数字,
  "reasoning": "逐步列出每项得分的计算过程"
}
`.trim()

async function main() {
  migrate(db, { migrationsFolder })

  const adminEmail = process.env.AXIIA_ADMIN_EMAIL ?? 'admin@paideia.uno'
  const adminPassword = process.env.AXIIA_ADMIN_PASSWORD ?? 'axiia-cup'
  const adminDisplayName = process.env.AXIIA_ADMIN_NAME ?? '管理员'

  const passwordHash = await hashPassword(adminPassword)

  db.insert(users)
    .values({
      email: adminEmail,
      passwordHash,
      displayName: adminDisplayName,
      isAdmin: true,
    })
    .onConflictDoNothing()
    .run()

  console.log(`[db] ensured admin account ${adminEmail}`)

  db.insert(scenarios)
    .values({
      id: 'shangyang-court',
      title: '商鞅变法·朝堂辩法',
      subject: '历史',
      roleAName: '商鞅',
      roleAHiddenInfo: '[]',
      roleARequests: JSON.stringify([
        { id: 'SR1', content: '请封商鞅为左庶长，委以军政重任' },
        { id: 'SR2', content: '请擢景监为大夫，入朝参与国政' },
        { id: 'SR3', content: '请赐商鞅举荐各县县令之权' },
      ]),
      roleBName: '甘龙',
      roleBHiddenInfo: '[]',
      roleBRequests: JSON.stringify([
        { id: 'GR1', content: '请封甘龙之子为陇西郡守' },
        {
          id: 'GR2',
          content: '请加太师府议政之权，凡国之大事须经太师府议定',
        },
        { id: 'GR3', content: '请保世族封地食邑世代相传，不受裁减' },
      ]),
      judgeModel: evaluationModelOptions[0]!.id,
      scorerModel: evaluationModelOptions[0]!.id,
      turnCount,
      falseInfoCount: 0,
      trueRequestCount: 1,
      openingLine:
        '卫鞅，寡人今日召你与甘龙太师当堂论辩，就变法一事各陈其辞。你先说。',
      agentPromptTemplate,
      examinationQuestionTemplate,
      judgePrompt,
      judgeOsPrompt: shangyangJudgeOsPrompt,
      scorerPrompt,
    })
    .onConflictDoNothing()
    .run()

  console.log(
    `[db] ensured scenario shangyang-court in ${sqliteFilePath} (turnCount=${turnCount})`,
  )

  ensureHonnojiScenario()
  console.log(`[db] ensured scenario honnoji-decision in ${sqliteFilePath}`)
  ensureTrolleyScenario()
  console.log(`[db] ensured scenario trolley-problem in ${sqliteFilePath}`)
}

await main()
