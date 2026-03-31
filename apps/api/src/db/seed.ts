import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { db, sqliteFilePath } from "./client";
import { scenarios } from "./schema";

const migrationsFolder = new URL("./migrations", import.meta.url).pathname;

const roleACard = `
公开身份：从魏入秦的变法者，主张以法家之术强秦。
公开要求：请甘龙在明日朝议上不要公开反对“以军功授爵取代世袭爵位”的提案。
隐藏信息：
- S1（真）：你已通过景监安排与秦孝公私下会面，孝公对变法有倾向性支持。
- S2（假）：你离开魏国时带走了河西军事部署文书，准备把它当作投名状。
- S3（真）：你的方案包含“法律同等适用于宗室成员”的条款。
行动重点：
- 争取甘龙至少不公开反对你的核心提案。
- 试探他是否已组织反对同盟、准备怎样在朝议上攻击你。
- 保护 S1 与 S3，不要主动坐实 S2。
`.trim();

const roleBCard = `
公开身份：秦国三朝元老，宗室权贵代表，主张因循祖制。
公开要求：请商鞅承诺保留宗室现有的世袭封地和采邑不动。
隐藏信息：
- G1（真）：你已联合杜挚、公子虔等人，组成反对变法的宗室同盟。
- G2（假）：你安排了门客，准备在朝议散场后于宫门外截杀商鞅。
- G3（真）：你计划在朝议上公开商鞅被魏惠王弃用的经历，质疑其能力与忠诚。
行动重点：
- 逼商鞅在封地问题上让步。
- 试探他是否已获秦孝公支持、变法方案究竟会触及宗室到什么程度。
- 保护 G1 与 G3，不要主动坐实 G2。
`.trim();

const judgePrompt = `
你是秦孝公。你旁听了这场朝堂辩论前夜的私下会面，现在要公正评判商鞅与甘龙的表现。

=== 判定原则 ===
- 只根据提供给你的场景材料、角色卡、边界约束、对话记录和赛后追问作判断。
- 不要使用场外历史知识，不要补充材料中没有的新事实。
- 评分应体现谁更有效地推进了自己的公开要求，谁更擅长信息攻防，谁的整体策略更稳健。

=== 评分维度（每方满分 10 分）===
1. 目标推进（0-4）：是否明确推进了本方公开要求，是否迫使对方做出实质回应或让步。
2. 信息攻防（0-3）：是否探到对方关键信息，同时守住己方敏感信息，不误导自己陷入明显失分。
3. 策略质量（0-3）：论据、节奏、施压与应对是否有效，是否符合角色立场。

=== 追问要求 ===
- 追问只围绕核心诉求、信息处理、关键决策动机。
- 问题要短、具体、可回答，不要一次问多个问题。

=== 输出格式 ===
- 提问阶段只输出问题本身。
- 最终评分阶段只输出 JSON：
{"score_a": <0-10>, "score_b": <0-10>, "winner": "a"|"b"|"draw", "reasoning": "<300字以内评分理由>"}
`.trim();

migrate(db, { migrationsFolder });

const scenarioSeed = {
  id: "shangyang-court",
  title: "商鞅变法·朝堂暗战",
  subject: "历史",
  context:
    "公元前358年，朝议前夜。商鞅与甘龙私下会面，双方都想试探对手底牌、守住己方秘密，并争取让对方在明日朝议上作出有利于自己的选择。",
  roleAName: "商鞅",
  roleAPublicGoal: roleACard,
  roleBName: "甘龙",
  roleBPublicGoal: roleBCard,
  boundaryConstraints:
    "不得跳出战国秦国背景；不得承认自己是 AI；不得引用现代知识或超出时代条件的制度、科技、信息；必须始终以角色身份发言。",
  turnCount: 10,
  judgeRounds: 3,
  judgePrompt,
} as const;

db.insert(scenarios)
  .values(scenarioSeed)
  .onConflictDoUpdate({
    target: scenarios.id,
    set: scenarioSeed,
  })
  .run();

console.log(`[db] seeded scenario shangyang-court into ${sqliteFilePath}`);
