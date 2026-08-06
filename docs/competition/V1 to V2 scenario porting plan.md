# V1 to V2 Scenario Porting Plan

> 状态：场景产品决策与 script-only porting 已完成，待 PR review；本能寺平台侧四角色支持由 coworker 负责，不属于本 PR
>
> 范围：`honnoji-decision`、`shangyang-court`、`trolley-problem`
>
> PR 边界：只提交三个 scenario scripts、这份决策记录及其 production prompt 基线；不提交 local runner、`.local`、runner logs、Web/Swift/server 或其他平台改动

## 1. 目标

这份文件是 V1 到 V2 场景移植的决策记录。

本文件记录 V1 production 与 V2 的差异、逐项产品决定，以及按照这些决定完成的 script-only implementation。三个场景的 porting 已获授权并完成；剩余平台工作继续由 coworker 负责。

## 2. 相关材料

- [V2 三个场景的玩家提示词模板](prompts/v2-player-prompt-templates.md)
- [V1 production PvE preset prompts 快照](prompts/v1-production-pve-preset-prompts.md)
- [V1 production Judge Prompts 快照](prompts/v1-production-judge-prompts.md)
- [产品设计规范](DESIGN_SPEC.md)

V1 prompt 的最终比较基线必须来自 V1 live production 数据或已经验证的 production 历史导出，不能仅以本地 seed 或旧代码代替。

## 3. 修改边界

本次由当前执行者负责的 implementation 代码修改权限仅限：

- `v2/scenarios/scenarios/honnoji-decision/script.js`
- `v2/scenarios/scenarios/shangyang-court/script.js`
- `v2/scenarios/scenarios/trolley-problem/script.js`

本能寺仍必须完整恢复 V1 四角色选择：玩家能在每个阵营的两个角色中任选一个，并与另一阵营的任意角色对战；PvE preset 也必须携带并使用所属角色。实现这项能力所需的 Swift contract/server、V2 Web builder、DTO/type mirror、持久化和 match binding 修改由 coworker 负责，不由本 PR 修改。

本次实现只修改三个 scripts，并通过现有 `game.side(side).options.role` contract 读取角色选择；同时兼容 production canonical role ID、V2 UI 短 key 和旧 slot params。不得用 prompt 文本或 label 猜测普通玩家的角色，也不得修改 Swift、Web、server、runtime、programmatic scorer、数据库、tools、tests、CI/CD 或其他 implementation 文件。

### 3.1 本能寺平台依赖与 coworker 交接

Coworker 负责的平台实现至少需要满足以下行为契约。相关平台改动独立于本次 scenario porting PR；本 PR 只消费已经由 main 提供的 role options contract：

- 场景详情向 builder 暴露 A/B 两方各自的两个 canonical role options。
- 玩家选择的 role option 与 prompt/model 一起保存，并冻结在具体 version；修改当前选择不得改变旧 version 或旧 match。
- PvP dispatch 把双方各自的 role option 固化到 match participant；A 方任意角色可与 B 方任意角色配对。
- 每条 PvE preset 携带自己的 canonical role option，并在 dispatch 时固化到对应 participant。
- Scenario runtime 的 `game.side('a'|'b')` 向 script 暴露已固化的 canonical role option ID；script 不从 prompt 内容反推。
- Timeline、match detail 和结果页使用实际入局角色名，不固定显示默认长宗我部/细川组合。
- 旧的、没有 role option 的 V2 version/match 必须有明确兼容策略；建议旧 A 默认 `chosokabe`、旧 B 默认 `hosokawa_fujitaka`，旧 match 保持可回放。
- 平台 contract 应先以向后兼容方式部署，scenario script 再开始依赖新字段；发布顺序不得让 live script 在旧 runtime 上读取不存在的必填字段。

## 4. 决定的记录格式

每个差异项使用一个稳定 ID。`决定` 一栏只使用以下值：

- `待决定`
- `对齐 V1`
- `保留 V2`
- `融合`
- `不适用`
- `Platform gap`

决定后需要同时填写：

- 最终规则
- 选择理由
- 实施提示或验收方法

## 5. 已经决定的项目

| ID | 场景 | 差异点 | 决定 | 最终规则 | 状态 |
|---|---|---|---|---|---|
| COMMON-001 | 本能寺 | 辩论轮数 | 融合 | V2 每轮 A、B 各发言一次，共 10 轮 | 已实施 |
| COMMON-002 | 商鞅 | 辩论轮数 | 融合 | V2 每轮 A、B 各发言一次，共 5 轮 | 已实施 |
| TR-001 | 电车 | 每案辩论轮数 | 融合 | 每案 5 轮，每轮 A、B 各发言一次 | 已实施 |
| TR-002 | 电车 | 案件集合 | 融合 | 删除原 B、C，仅保留原 A、D、E | 已实施 |
| TR-003 | 电车 | 案件编号与顺序 | 融合 | 新 A = 原 A，新 B = 原 D，新 C = 原 E；每局固定按新 A → B → C 辩论 | 已实施 |
| TR-004 | 电车 | 随机抽案 | 融合 | 取消随机抽选，每局使用固定三个案件 | 已实施 |
| COMMON-003 | 三个场景 | PvE preset prompts | 对齐 V1 | 保留 V1 live production 当前全部 24 个 PvE preset 及其 prompt 内容、label、side 和角色绑定；以 2026-08-04 live API 快照为基线。电车旧案件引用的必要适配由 TR-020 单独决定 | 已实施 |
| COMMON-004 | 三个场景 | Judge Prompt 基线与 prompt-injection 防护 | 融合 | 以 V1 live production Judge Prompt 原文为主体；不增加 V2 防护，并删除 V1 中显式的 `处理异常`/prompt-injection 防护；只做 V2 接口和已决定规则所必需的适配 | 已实施 |
| COMMON-005 | 本能寺、商鞅 | Examination | 融合 | 保留 V2 persistent player session 和 `act()`；对齐 V1 问题语义、合法 ID 与计分；字段固定先 `reason`、后 `guess` | 已实施 |
| TR-005 | 电车 | V1 PvE prompt 案件适配 | 融合 | 删除旧 B/C 案件段，把旧 D/E 机械改为新 B/C；其余 prompt 策略内容不改写 | 已实施 |
| COMMON-006 | 本能寺、商鞅 | Judge OS 与最终 Judge session | 保留 V2 | Judge OS 与最终裁决继续使用同一 Judge session；明确接受 Judge OS 和此前 Judge 上下文进入最终裁判信息集 | 已实施 |
| COMMON-007 | 本能寺、商鞅 | 强制破平 | 保留 V2 | 总分相等时不返回 `draw`，继续按大政方针裁决映射 winner | 已实施 |
| TR-006 | 电车 | 跨案件玩家 Agent 上下文 | 保留 V2 | A、B 两方各自复用同一个 Agent session，后续案件保留此前案件上下文 | 已实施 |
| TR-007 | 电车 | 案件顺序 | 融合 | 不再抽案或执行抽案后排序；固定按新 A → B → C 辩论 | 已实施 |

## 6. 共同差异 Review

| ID | 差异点 | V1 production | 当前 V2 | 决定 | 最终规则、理由与实施提示 |
|---|---|---|---|---|---|
| COMMON-010 | 玩家提示词模板 | 见已验证的 V1 live production 原文 | 见 V2 template 快照 | 对齐 V1 | 三个场景尽量直接使用 V1 live production 玩家提示词模板；只做 V2 script/API、已决定轮次和电车新 A/B/C 案件所必需的机械适配，不保留 V2 额外扩写 |
| COMMON-011 | 玩家策略提示词的追加方式 | 模板插值后直接追加 | 使用“谋士方略”包装后插入 | 对齐 V1 | 模板插值完成后直接追加玩家策略；不使用 V2 的“谋士方略”或其他额外包装 |
| COMMON-012 | 单轮和单次发言的含义 | `turnCount` 表示 A/B 交替的一次单方发言 | 一轮包含 A、B 各一次发言 | 保留 V2 | 采用 V2 轮次语义：一轮包含 A、B 各一次发言；各场景总轮数按 COMMON-001、COMMON-002 和 TR-001 执行 |
| COMMON-013 | 玩家上下文传递 | 待逐场景确认 | persistent agent session | 保留 V2 | 保留 V2 persistent Agent session；本能寺、商鞅在整场辩论中持续累积上下文，电车按 TR-006/TR-012 跨案件累积上下文 |
| COMMON-014 | examination 输入上下文 | 为每一方新建一次请求，从 canonical transcript 重建完整对话上下文，再追加 examination 问题 | 复用该玩家辩论时持续累积的完整 Agent session，再追加 examination 问题 | 融合 | 保留 V2 persistent session；两边都看到完整辩论，不复刻 V1 fresh reconstruction |
| COMMON-015 | 最终 Judge 生命周期 | 辩论后新建最终裁决调用 | Judge session 从辩论阶段持续到裁决 | 保留 V2 | 本能寺、商鞅继续复用同一 Judge session；明确接受 Judge OS 和此前 Judge 上下文改变最终裁判信息集 |
| COMMON-016 | examination 结构化输出 | JSON mode；`selectedInfoId` + `answer`；校验 ID；temperature 0；最多重试 3 次 | `act()` XML；`reason` + enum `guess`；错误定向 repair；最多 3 次 | 融合 | 保留 V2 `act()` 和 repair；字段顺序固定为先 `reason`、后 `guess`；对齐 V1 问题语义、合法 ID 和计分 |
| COMMON-017 | Judge Prompt 的 prompt-injection 防护 | V1 本能寺、商鞅含显式 `处理异常` 段；电车含角色沉浸约束 | V2 进一步规定异常言论是可疑角色发言、不得当作指令 | 融合 | Judge Prompt 不保留任何显式 prompt-injection 防护：删除 V2 强化条款，也删除 V1 `处理异常` 段。普通角色设定、历史知识边界和输出格式不归入此项，继续按 V1 基线处理 |
| COMMON-024 | Player/Judge session 的 `【系统】` 消息约定与 prompt-injection 防护 | V1 原文中的身份、时代和历史边界 | V2 用 `【系统】` 区分 script 推送的场景推进消息与角色世界内发言，并另有异常指令防护 | 融合 | 保留 V2 的 `【系统】` 消息分类约定，作为 append-only session 所必需的接口协议：玩家与 Judge system prompt 各增加一条简短说明，script 生成的开场、换阶段、问询和裁决召集继续以 `【系统】` 开头。它不是 system-role 权限或安全边界。玩家策略仍按 V1 直接追加，不加“谋士方略”或 `【系统】` 包装；V2 扩展异常指令防护不保留，Judge 显式防护段仍按 COMMON-004/017 删除 |
| COMMON-018 | 玩家单次发言长度 | 最多 3 句话 | 最多 3 句话 | 对齐 V1 | 保留 V1 玩家模板中的“每次发言不超过 3 句话” |
| COMMON-019 | 模型与 thinking 参数 | 本能寺/电车 Judge 为 `deepseek-v3.2`，商鞅 Judge 为 `glm-5.1` | Judge 默认 `deepseek-v4-pro`，PvE Agent 默认 `deepseek-v4-flash`；可由 V2 slot/runtime 参数覆盖 | 保留 V2 | 使用 V2 默认模型与 thinking/推理参数，不恢复 V1 production 的旧模型配置；继续保留 slot 参数覆盖能力 |
| COMMON-020 | 平局语义 | request-game scorer 可返回 `draw` | 本能寺、商鞅按大政方针破平 | 保留 V2 | 强制破平；总分相等时由 Judge 的大政方针裁决决定 winner，不返回 `draw` |
| COMMON-021 | timeline stages/channels | V1 展示结构 | V2 分阶段、分 channel | 保留 V2 | 使用 V2 的 timeline stages、channels 和当前展示语义，包括 Judge OS 所在的 `judge-aside` 展示 |
| COMMON-022 | verdict/score 结构化事件 | V1 contract | V2 script events | 保留 V2 | 使用 V2 script 的 verdict、score 及其他结构化事件 contract；只在事件内容中承载已决定的 V1 规则和 prompt 结果 |
| COMMON-023 | 错误、重试与 repair 行为 | V1 engine 行为 | V2 runtime 行为 | 保留 V2 | 使用 V2 runtime 当前的错误传播、重试和 `act()` repair 行为；不在 scenario scripts 中复刻 V1 engine 的调用控制 |

## 7. 本能寺 Review

| ID | 差异点 | V1 production | 当前 V2 | 决定 | 最终规则、理由与实施提示 |
|---|---|---|---|---|---|
| HN-010 | Agent Template 原文 | 见已验证的 live production 原文 | 见 V2 template 快照 | 对齐 V1 | 按 COMMON-010 使用 V1 原文主体，仅作必要的 V2 接口与轮次语义适配 |
| HN-011 | 角色 key、名称和 role option ID | `chosokabe` / `yoshiaki_envoy`；`hosokawa_fujitaka` / `akechi_ashigaru`；显示名称见 production row | V2 使用缩写 key，且长宗我部显示名称不同 | 对齐 V1 | 角色 key、显示名称、请求归属均机械对齐 V1 production；为已有 V2 slot params 保留旧缩写 key 作为兼容 alias，不改变 production canonical ID |
| HN-012 | 角色身份和背景信息 | 见 V1 live production Agent Template | V2 有扩展背景与角色说明 | 对齐 V1 | 使用 V1 Agent Template 中的角色身份和背景，不保留 V2 额外扩写；动态角色插值只做接口适配 |
| HN-013 | 请求 ID、内容与真假请求分配 | 每个入局角色三项 production 请求；每方随机抽取一个真请求 | V2 script 内定义并随机选择真请求 | 对齐 V1 | 请求 ID、原文、角色归属及每方一个真请求的 journaled 随机抽取均对齐 V1 production |
| HN-014 | 识破真请求扣分 | `-0.75` | `-0.75` | 对齐 V1 | 保持 `-0.75`；按 V1 规则在对手猜中时从被识破方扣分，V2 `act()` 只替代结构化输出接口 |
| HN-015 | Judge Prompt | 见 live production 快照 | V2 新 prompt | 融合 | 直接使用 V1 原文主体；删除 `=== 处理异常 ===` 段；仅适配 V2 `act()` 输出、动态角色/请求及其他已决定规则 |
| HN-016 | 光秀 Judge OS/心声 | 无 | 有，辩论中生成 | 保留 V2 | 保留 Judge OS；使用 HN-015 决定的 Judge Prompt 基线，并按 COMMON-021 在 timeline 展示 |
| HN-017 | Judge OS 可见性 | 不适用 | timeline 展示 | 保留 V2 | 按 COMMON-021 保留当前 `judge-aside` timeline 展示 |
| HN-018 | `judgeFocus` 角色专属评判说明 | V1 Judge Prompt 含四个角色各自的简洁评判重点 | V2 将每个角色的评判说明扩写 | 对齐 V1 | 使用 V1 Judge Prompt 中四段 production 原文，不保留 V2 扩写内容 |
| HN-019 | 角色组合 `pairingNote` | 无 | V2 额外加入角色组合说明 | 对齐 V1 | 删除 V2 `pairingNote`；角色组合只通过 V1 原有的四段角色评判重点影响 Judge |
| HN-020 | Judge OS 是否进入最终 Judge 上下文 | 不适用 | 同一 Judge session，进入 | 保留 V2 | 保持进入，并接受它改变最终 Judge 的信息集 |
| HN-021 | examination 流程 | fresh request 重建完整 transcript；JSON `selectedInfoId`/`answer` | 复用完整玩家 session；屏退问询；XML `reason`/`guess` | 融合 | 保留 V2 session 与 `act()`；先 `reason` 后 `guess`；核心问题、合法 ID 和计分对齐 V1 |
| HN-022 | 最终裁决字段和 winner 映射 | V1 JSON/scorer 字段语义与计分，可返回 `draw` | V2 `act()`、plain-JS 计分、结构化事件，并按大政方针强制破平 | 融合 | 请求裁决、真假请求、识破扣分和大政方针得分按 V1；结构化输出、事件和错误处理按 V2；总分相同时按已决定的大政方针映射 winner，不返回 `draw` |
| HN-023 | PvE presets | 8 条；4 个 role option 各 2 条，并由 preset 的 `roleOptionId` 绑定角色 | V2 script 4 条，仅覆盖长宗我部与细川角色；当前 preset contract 不暴露角色 ID | 对齐 V1 | 使用 live 快照中的 8 条 prompt 原文和 label：四国棋眼/四国急使 → `chosokabe`；旧幕空号/鞆浦执笔 → `yoshiaki_envoy`；畏祸亲家/幽斋残局 → `hosokawa_fujitaka`；惊惶足轻/阵中耳目 → `akechi_ashigaru`。每条 preset 必须把所属角色带入 match，使用该角色的名称、请求和 Judge 评判重点；不得仅靠默认角色运行 |
| HN-024 | per-player role option 选择与任意跨阵营配对 | V1 每位 submission 在所属阵营的两个角色中任选一个；A 方任意角色可对战 B 方任意角色，preset 同样携带 `roleOptionId` | V2 当前只在 script slot params 中选择角色，builder/version/side binding 没有 per-player `roleOptionId` | 对齐 V1 | 必须完整恢复 V1 行为：A 方可选 `chosokabe` 或 `yoshiaki_envoy`，B 方可选 `hosokawa_fujitaka` 或 `akechi_ashigaru`；任何 A/B 组合均可 PvP/PvE。角色选择随玩家 version 和 match participant 固化并暴露给 script，不能用 prompt 文本猜测。平台侧由 coworker 按 3.1 节实现；当前执行者只负责 script 消费该 contract 及角色相关场景逻辑 |

## 8. 商鞅变法 Review

| ID | 差异点 | V1 production | 当前 V2 | 决定 | 最终规则、理由与实施提示 |
|---|---|---|---|---|---|
| SY-010 | Agent Template 原文 | 见已验证的 live production 原文 | 见 V2 template 快照 | 对齐 V1 | 按 COMMON-010 使用 V1 原文主体，仅作必要的 V2 接口与轮次语义适配 |
| SY-011 | 角色身份和背景信息 | 见 V1 live production Agent Template | V2 有扩展背景 | 对齐 V1 | 使用 V1 Agent Template 中的角色身份和背景，不保留 V2 额外扩写 |
| SY-012 | 请求 ID、内容与真假请求分配 | `SR1` 为“请授商鞅督察宗室之权，王公犯法皆得论处”；`GR1` 为“请以世族子弟统领宫禁宿卫”；其余请求见 production 快照 | V2 改写了 `SR1`、`GR1`，并在 script 内随机选择真请求 | 对齐 V1 | 请求 ID、请求原文和每方随机抽取一个真请求的规则均对齐 V1 live production；恢复 V1 的 `SR1`、`GR1`，其余相同请求保持不变 |
| SY-013 | 识破真请求扣分 | `-1` | `-0.75` | 对齐 V1 | 对方正确猜中真请求时，被识破方扣 `1` 分；恢复 V1 的 `-1`，不保留 V2 的 `-0.75` |
| SY-014 | Judge Prompt | 见 live production 快照 | V2 新 prompt | 融合 | 直接使用 V1 原文主体；删除 `=== 处理异常 ===` 段；仅适配 V2 `act()` 输出及其他已决定规则 |
| SY-015 | Judge OS Prompt | V1 使用一份独立的 production Judge OS system prompt | V2 Judge OS 与最终裁决共用同一 Judge session/system prompt，每轮另加简短 OS 指令 | 融合 | 不再套用 V1 独立 Judge OS system prompt。Judge session 使用以 V1 final Judge Prompt 为主体、仅作必要 V2 适配的 system prompt；每轮通过简短 V2 指令生成 OS。该 session 延续到最终裁决 |
| SY-016 | Judge OS 输入窗口 | 只看刚结束的一组 A/B 发言 | 累积读取之前辩论 | 保留 V2 | 保留同一 session 的累积上下文，并接受它改变后续 OS 与最终 Judge 的信息集 |
| SY-017 | Judge OS session | 每次独立 sidecar | 与最终 Judge 共用 session | 保留 V2 | 暂时保留同一 session，并接受累积 Judge 上下文影响最终裁决 |
| SY-018 | Judge OS 阻塞和失败语义 | non-blocking、best-effort | 当前流程阻塞 | 保留 V2 | 按 COMMON-023 保留 V2 runtime 当前的阻塞、错误传播和失败语义；不在 script 中仿造 V1 non-blocking/best-effort 调用 |
| SY-019 | Judge OS 是否进入最终裁决 | 不进入 | 进入同一 Judge session | 保留 V2 | 保持进入，并接受它改变最终 Judge 的信息集 |
| SY-020 | examination 流程 | fresh request 重建完整 transcript；JSON `selectedInfoId`/`answer` | 复用完整玩家 session；屏退问询；XML `reason`/`guess` | 融合 | 保留 V2 session 与 `act()`；先 `reason` 后 `guess`；问题语义、合法 ID 和计分对齐 V1，不保留改变目标含义的改写 |
| SY-021 | 平局和 winner | 平分返回 `draw` | 大政方针破平 | 保留 V2 | 保留强制破平；总分相等时按“变法/维持现状”映射 winner |
| SY-022 | PvE presets | 12 条：商鞅 6 条、甘龙 6 条 | V2 script 4 条 | 对齐 V1 | 使用 live 快照中的 12 条 prompt 原文、label 和 side |

## 9. 电车难题 Review

| ID | 差异点 | V1 production | 当前 V2 | 决定 | 最终规则、理由与实施提示 |
|---|---|---|---|---|---|
| TR-010 | Agent Template 原文 | 见已验证的 live production 原文 | 见 V2 template 快照 | 对齐 V1 | 按 COMMON-010 使用 V1 原文主体；只机械适配固定新 A/B/C、每案 5 轮和 V2 接口 |
| TR-011 | 三个案件是否在开局全部公开 | V1 Agent Template 在开局列出本局案件 | 全部写入初始 player prompt | 对齐 V1 | 固定的新 A/B/C 三案继续在开局全部写入玩家提示词 |
| TR-012 | 每案玩家上下文 | 每案重置，只看当前案 transcript | 同一 A/B session 跨案累积 | 保留 V2 | A、B 两方分别复用同一个 Agent session；后续案件保留此前案件上下文 |
| TR-013 | 每案 Judge 上下文 | 最终收到按案件分段的完整 transcript | 同一 Judge session 跨案累积收到三个案件的 announcement 与发言 | 保留 V2 | 保留 V2 persistent Judge session；Judge 在最终裁决时仍拥有三个案件各自的完整记录，案件边界由 announcement/channel 保持 |
| TR-014 | Judge Prompt | 见 live production 快照 | V2 新 prompt 与评判维度 | 融合 | 直接使用 V1 原文主体；不增加 prompt-injection 防护；只适配固定 A/B/C 案件、V2 `act()` 输出及其他已决定规则 |
| TR-015 | 案件独立性的 prompt 约束 | Judge 必须根据每案设定和该案独立辩论记录裁决 | V2 prompt 同样要求逐案独立，但 Agent/Judge session 跨案 | 对齐 V1 | 使用 V1 Judge Prompt 的案件独立性原文；跨案 session 按 TR-012/TR-013 保留 V2，但不得把其他案件的发言视为当前案件已经完成的论证 |
| TR-016 | 立场名称和辩手名称 | 奕仁/武仁；一人侧/五人侧 | 奕仁/武仁；一人侧/五人侧 | 对齐 V1 | 名称完全一致，保持 V1 production 原值 |
| TR-017 | 最终逐案裁决 schema | JSON `judgments` + `winner` + `speech`，案件 ID 为动态字段 | V2 `act()` 动态 enum fields + script 计算 winner | 融合 | 保留 V2 `act()` 作为必要接口适配；逐案字段只能返回“一人侧”或“五人侧”，并由 script 依 V1 多数规则确定 winner；`speech` 保留完整逐案理由 |
| TR-018 | 胜利条件 | 三案多数 | 三案多数 | 对齐 V1 | 三案中获得至少两案的一方胜出；三案且每案强制二选一，因此无平局。异常结构化输出按 COMMON-023 的 V2 repair/失败行为处理 |
| TR-019 | PvE presets | 4 条：一人侧初级/高级、五人侧初级/高级 | V2 script 4 条，但 prompt 和 label 不同 | 对齐 V1 | 保留 live 快照中的 4 个 preset、label、side 和策略内容；案件引用是否机械适配见 TR-020 |
| TR-020 | 旧 PvE prompt 的案件引用 | 高级 prompts 引用旧 A–E，包括已删除的 B/C，并把自动驾驶、缸中之脑称为 D/E | 当前案件是原 A、D、E，并重新编号为 A、B、C | 融合 | 做机械适配：删除旧 B/C 案件段，把旧 D/E 改为新 B/C；不得改写其余策略内容 |
| TR-021 | 抽案后排序 | V1 从旧 B–E 随机抽两个，并保留抽取顺序 | 旧 V2 抽取后按题库顺序排序 | 不适用 | 当前已取消抽案；固定案件为新 A/B/C，辩论顺序固定为 A → B → C |

## 10. Review 与实施顺序

1. 三个场景的 Agent Template。
2. 三个场景的 Judge Prompt。
3. 本能寺与商鞅的 Judge OS。
4. 发言次数、speaker sequence 和上下文边界。
5. examination、结构化输出和最终 Judge 生命周期。
6. 请求、角色、案件、随机性和 PvE presets。
7. 计分、平局、winner 和公开结果。
8. prompt-injection 防护及其他 V2 设计。
9. Platform gaps 和 script-only 近似方案。
10. 全表复核并明确授权 implementation。

## 11. 实施授权记录

开始最终 porting 所需的条件均已满足：

- Review 表中没有未解释的 `待决定` 项。
- 三个场景的 V1 production 基线来自 2026-08-04 live API 快照及已验证的 production prompt 历史。
- 所有 `融合` 项均已写明最终规则。
- Platform gap 已明确交由 coworker 处理，且不进入本 PR。
- 用户已明确授权按照本文件中的决定开始 implementation。

## 12. 最终验收记录

Script-only implementation 已完成：

- `honnoji-decision/script.js`：阵营名称改为“主张杀信长 / 主张不杀信长”；对齐 V1 四角色、请求、8 条 PvE presets、Agent/Judge prompts、examination 与计分；保留 V2 Judge OS、session、timeline、结构化输出与强制破平。
- `shangyang-court/script.js`：对齐 V1 请求、12 条 PvE presets、Agent/Judge prompts、examination 和 `-1` 识破扣分；保留 V2 Judge OS、session、timeline、结构化输出与强制破平。
- `trolley-problem/script.js`：固定使用新 A/B/C 三案，每案 5 轮；对齐 V1 prompts 与 4 条 PvE presets，并机械适配旧 D/E 为新 B/C；保留 V2 跨案 session、timeline 和结构化输出。
- PR 不包含 local runner、`.local`、runner logs 或任何 Web/Swift/server 改动。
- 静态验证通过：`deno task validate`、`deno task fmt`、`deno task lint` 和 `git diff --check` 均成功。
- 平台侧边界：本能寺 per-player 四角色 UI、持久化与 match binding 由 coworker 的独立改动提供；本 PR 只消费 `options.role`，平台端到端行为不属于本 PR 的实现或验收范围。
