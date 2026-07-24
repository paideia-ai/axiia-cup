# 法律场景候选包

本目录收纳十个可作为第四场景候选的法律类双人游戏规格。每个文件都是一个独立 spec doc，结构参考现有的 `电车难题-双人游戏.md`、`本能寺之变-双人游戏.md` 和 `商鞅变法-双人游戏.md`。

其中至少半数场景明确采用 `docs/competition/scratchpad/court-room-bench.md` 中的确定性法庭 benchmark 思路：表层是自然语言法律材料，中层是论证图或事实变量，底层是加权约束系统，最终由程序化 verifier 依据隐藏约束和结构化提交确定胜负。

| 序号 | 文件 | 建议场景 ID | 法律主题 | 玩法差异 | 程序化确定性判决 |
|------|------|-------------|----------|----------|------------------|
| 1 | `01-trade-secret-injunction.md` | `legal-trade-secret-injunction` | 商业秘密临时禁令 | 禁令要件 + 救济方案设计 | 是 |
| 2 | `02-harbor-murder-jury.md` | `legal-harbor-murder-jury` | 刑事陪审团定罪 | 排除合理怀疑 + 替代叙事 | 是 |
| 3 | `03-algorithmic-bail-hearing.md` | `legal-algorithmic-bail` | 算法保释听证 | 风险条件包 + 程序正义 | 是 |
| 4 | `04-ma-reps-arbitration.md` | `legal-ma-reps-arbitration` | 并购陈述保证仲裁 | 合同解释 + 损害计算 | 是 |
| 5 | `05-patent-claim-construction.md` | `legal-patent-markman` | 专利权利要求解释 | 技术术语构造 + 侵权路径 | 是 |
| 6 | `06-data-breach-class-certification.md` | `legal-data-breach-class` | 数据泄露集体诉讼认证 | 类成员共性 + 损害模型 | 是 |
| 7 | `07-curfew-constitutional-injunction.md` | `legal-curfew-injunction` | 宪法紧急禁令 | 权利衡量 + 救济边界 | 否 |
| 8 | `08-bankruptcy-plan-confirmation.md` | `legal-bankruptcy-plan` | 破产重整确认 | 债权组别 + 重整方案谈判 | 是 |
| 9 | `09-port-expropriation-arbitration.md` | `legal-port-expropriation` | 国际投资仲裁 | 主权监管 vs 间接征收 | 否 |
| 10 | `10-voir-dire-jury-selection.md` | `legal-voir-dire` | 陪审团遴选 | 问询、回避与陪审团构成 | 是 |

## 共同设计约束

- 全部场景都是双人对抗：玩家甲和玩家乙分别控制一个法律立场的智能体。
- 全部场景都能让双方在 8 到 12 轮内完成主要对抗，并在最后输出结构化请求、事实认定或策略选择。
- 程序化确定性场景不让 LLM 主观决定胜负。LLM 可以负责叙事、归纳或格式化，但胜负由隐藏实例、约束权重和提交 JSON 的 verifier 计算。
- 非程序化确定性场景保留现有商鞅、本能寺式的沉浸裁判和隐藏请求玩法，用于测试法律说服、救济设计、身份扮演和策略伪装。
- 每个场景都避免单纯换皮：法律领域、争点结构、玩家目标、信息隐藏方式和得分重点均不同。
