# 法律场景包

本目录最初收纳十个可作为第四场景候选的法律类双人游戏规格。现已选择第 2 个方向继续开发：[`02-harbor-murder-jury.md`](./02-harbor-murder-jury.md) 已重写为《码头疑云：七号仓命案》的完整游戏规格；其余九个文件仍是候选概念稿。

候选包中多个早期方案采用 [`court-room-bench.md`](../../scratchpad/legal-scenario/court-room-bench.md) 的确定性法庭 benchmark 思路：表层是自然语言法律材料，底层以隐藏约束和程序化 verifier 判胜。这个思路**不再用于第 2 个场景**；《码头疑云》的胜负只由两名玩家陪审员和九名 NPC 陪审员的最终简单多数票决定。

| 序号 | 文件 | 建议场景 ID | 法律主题 | 玩法差异 | 程序化确定性判决 |
|------|------|-------------|----------|----------|------------------|
| 1 | `01-trade-secret-injunction.md` | `legal-trade-secret-injunction` | 商业秘密临时禁令 | 禁令要件 + 救济方案设计 | 是 |
| 2 | **`02-harbor-murder-jury.md`** | `legal-harbor-murder-jury` | 刑事陪审团定罪 | **已选：11 人陪审团、5 轮说服、预设行动** | **否；11 人多数票** |
| 3 | `03-algorithmic-bail-hearing.md` | `legal-algorithmic-bail` | 算法保释听证 | 风险条件包 + 程序正义 | 是 |
| 4 | `04-ma-reps-arbitration.md` | `legal-ma-reps-arbitration` | 并购陈述保证仲裁 | 合同解释 + 损害计算 | 是 |
| 5 | `05-patent-claim-construction.md` | `legal-patent-markman` | 专利权利要求解释 | 技术术语构造 + 侵权路径 | 是 |
| 6 | `06-data-breach-class-certification.md` | `legal-data-breach-class` | 数据泄露集体诉讼认证 | 类成员共性 + 损害模型 | 是 |
| 7 | `07-curfew-constitutional-injunction.md` | `legal-curfew-injunction` | 宪法紧急禁令 | 权利衡量 + 救济边界 | 否 |
| 8 | `08-bankruptcy-plan-confirmation.md` | `legal-bankruptcy-plan` | 破产重整确认 | 债权组别 + 重整方案谈判 | 是 |
| 9 | `09-port-expropriation-arbitration.md` | `legal-port-expropriation` | 国际投资仲裁 | 主权监管 vs 间接征收 | 否 |
| 10 | `10-voir-dire-jury-selection.md` | `legal-voir-dire` | 陪审团遴选 | 问询、回避与陪审团构成 | 是 |

## 候选包的原始共同约束

- 全部场景都是双人对抗：玩家甲和玩家乙分别控制一个法律立场的智能体。
- 除已经重写的第 2 个场景外，早期候选通常让双方在 8 到 12 轮内完成对抗，并在最后输出结构化请求、事实认定或策略选择。第 2 个场景固定为 5 轮，每轮包含两名玩家和最多三名 NPC 的公开发言。
- 程序化确定性场景不让 LLM 主观决定胜负。LLM 可以负责叙事、归纳或格式化，但胜负由隐藏实例、约束权重和提交 JSON 的 verifier 计算。
- 第 2 个场景不属于上述程序化 verifier 类型：NPC 的自然语言判断会形成真实票数，但计票与 6/11 胜负边界仍由脚本确定执行。
- 每个场景都避免单纯换皮：法律领域、争点结构、玩家目标、信息隐藏方式和得分重点均不同。
