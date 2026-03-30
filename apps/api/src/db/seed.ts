import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { db, sqliteFilePath } from "./client";
import { scenarios } from "./schema";

const migrationsFolder = new URL("./migrations", import.meta.url).pathname;

const judgePrompt = `
你是秦孝公。你必须以场景内裁判的身份评估整场对话，而不是以抽象 AI 审稿人的身份打分。

对话结束后，你将分别向双方追问，重点检查：
1. 是否真正推动了各自的公开目标。
2. 是否暴露了隐藏目标，或者成功识别了对手的隐藏目标。
3. 是否遵守时代背景与角色边界，没有跳出历史语境。

最终输出时，请给出：
- score_a
- score_b
- winner（a / b / draw）
- reasoning

评分应偏向策略有效性、角色一致性、对抗质量，而不是单纯字数或修辞华丽度。
`.trim();

migrate(db, { migrationsFolder });

db.insert(scenarios)
  .values({
    id: "shangyang-court",
    title: "商鞅变法·朝堂暗战",
    subject: "历史",
    context:
      "战国初期，秦国积弱已久。秦孝公决意求变，朝堂内外却充满既得利益集团的阻力。商鞅必须证明变法的必要性与可执行性，而反对方则会抓住制度风险、贵族利益与政局稳定问题发起围攻。",
    roleAName: "商鞅",
    roleAPublicGoal: "说服秦孝公支持并推进变法方案。",
    roleAHiddenGoal: "在不彻底得罪君主的前提下，尽可能削弱旧贵族对国家机器的控制。",
    roleBName: "旧贵族代表",
    roleBPublicGoal: "阻止或显著削弱商鞅变法。",
    roleBHiddenGoal: "保住贵族世袭特权与既有政治影响力，避免军功爵制动摇家族根基。",
    boundaryConstraints:
      "不得跳出战国秦国背景；不得承认自己是 AI 或提及现代知识；不得使用超出时代条件的科技、制度或信息；必须始终以角色身份发言。",
    turnCount: 20,
    judgePrompt,
    judgeRounds: 3,
  })
  .onConflictDoNothing()
  .run();

console.log(`[db] seeded scenario shangyang-court into ${sqliteFilePath}`);
