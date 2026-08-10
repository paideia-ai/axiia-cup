# v3 Mock 前端 — 决定与假设记录

> 本文记录实现 `v3-mock/` 时做出的所有决定（decision）与假设（assumption）。
> 规格依据：`/home/ubuntu/axiia-cup-uiux/UI-Doc-v3.4.md`（引用形如 (#n) / (A5) / (W4)；v3.3 期的条目按当时文档理解）。
> 配套文档：`BACKEND_REQUIREMENTS.md`（需要后端支持的点）、`SPEC_ISSUES.md`（实现中发现的规格问题）。
> 最新变更见文末「v3.4 per-side 重构（2026-08-05）」。

## 技术栈与工程

| # | 决定 | 理由 |
|---|------|------|
| T1 | 全新独立应用 `v3-mock/`，不改 `v2/web` 任何代码 | 用户要求；后端不可改，直接改 v2 会做出功能残缺的前端 |
| T2 | npm + Vite 7 + React 19 + react-router-dom 7 + Tailwind v4 | 与 v2 同栈便于日后迁移；本机没有 bun/deno，只有 node 22 + npm |
| T3 | 不用组件库（v2 用 @base-ui-components rc 版），自写轻量 UI 套件 `src/components/ui.tsx` | 减少依赖风险；mock 不需要无障碍级组件库 |
| T4 | 视觉语言沿用 v2（暗色、CSS 变量、Satoshi/Noto Sans SC、橙红 accent） | 「参考 v2」的最直接落点；v3 原型 (`v3-prototypes/`) 同为暗色系 |
| T5 | 单文件单例 store（`useSyncExternalStore`）+ localStorage 持久化，无后端调用 | 纯 mock；刷新不丢进度，便于演示完整闭环 |
| T6 | 假对局引擎：定时器逐轮吐出预写台词、每两轮生成一条裁判 OS、终局生成问询/判决 | 模拟异步 worker 与实况观看（#9），台词按场景预写以保证演示可读性 |

## 对规格的解读（假设）

| # | 假设 | 依据/风险 |
|---|------|-----------|
| S1 | 「进行中的对战」条在**所有登录页面**顶部渲染（shell 内），空时隐藏 | A1 说「派发处可见」，A5 说条出现在派发处；但条要「可留可走」且跨页面持续存在，全局渲染最省事。若严格按「仅派发处」，应只在 D/DA/EA 显示 → 待确认 |
| S2 | OS 面板「从 agent 呼出」实现为 EA 页与 E 保存成功态的「选择对手」按钮，打开 Modal（桌面居中/移动底部弹层） | A5 决定 (e)；E→(保存)→OS 的主路径用 `/agents/:id?os=1` 跳转承接 |
| S3 | 观战（A5「侧抽屉可观战」）简化为点条上卡片直接进战报页（FA 本身有实况态） | FA 是唯一对局视图（#27），侧抽屉与 FA 实况重复；mock 不再做第二套观战 UI |
| S4 | 简化版 DA（#11，W4 待设计）自行设计为：场景名 + 一句话 + 短背景 + **仅己方**角色卡 + 裁判一句话 + 时长 | W4 尚无设计产出，mock 给出一个可评审的具体形态 |
| S5 | Express 首战「只写一方」（#8）实现为：MCQ 只出预设执方的题；另一方提示词存空串 | 规格没说未填一方如何存储；空串最简单。后端语义见 BACKEND_REQUIREMENTS |
| S6 | 首战对局轮数用低轮数（6 轮） | A3 指标口径提到「低轮数快速首战是候选手段」；mock 采纳以缩短演示 |
| S7 | 首战让新手小胜（判决偏置） | 纯 mock 演示决定，非规格；真实系统由「最容易的 NPC」自然达成 |
| S8 | 「PVP 顶尖玩家」tab 在天梯未建时按**近期锦标赛战绩**排序 | W11 明确此排序待定；mock 需要一个排序，选了最有依据的一种，UI 上标注为临时 |
| S9 | 自动匹配 tab：mock 随机从同场景公开版本中选对手 | W11 待设计；按钮与文案（计分、影响天梯）按规格 A5/A6 呈现 |
| S10 | 参赛版本迁移「默认最新」（C4）实现为：若未显式改标，保存新版本时自动跟到最新 | #33 + C4 回填语义的前端演绎 |
| S11 | 版本 diff（EA 所有者视图）只展示备注与长度变化，不做逐行 diff | mock 范围裁剪；受限可见性（#20）已体现 |
| S12 | debug mode 是**会话级全局开关**（store.debugMode），任何观众可开 | A7「debug mode 本身任何观众可开」；作用域规格未说明，选全局 |
| S13 | 己方 OS trace / 裁判 trace 用预写文本模拟 thinking trace | 模型真实 trace 需后端（见 BACKEND_REQUIREMENTS） |
| S14 | 每日上限触顶（#52）：按钮可点 → 点击后 inline 提示「今日次数已用完（N/N），明天再来」→ 不入队 | 严格按 #52 已定行为实现 |
| S15 | 被挑战通知（#29）用种子数据演示（「墨白向你发起了友谊赛」），mock 不真正生成对方视角对局 | 单人 mock 无真实第二玩家 |
| S16 | 「赛事运行期间阻挡全部试炼」（#47）做成设置页里的演示开关 | 真实系统应是运营配置（文件+CLI #44）；前端只需能呈现被阻挡态 |
| S17 | 通知「持久保存」「离线保存」由 localStorage 承担 | mock 等价物 |
| S18 | 登录/注册纯 mock：任意输入均可登录演示账号；注册必须填邀请码（非空校验） | B2 邮箱+OTP 流程（DESIGN_SPEC §2）不在 v3.3 规格正文，mock 从简 |
| S19 | 字数上限「按汉字或英文词计」（#14）实现为：每个 CJK 字符计 1 + 每个连续拉丁/数字串计 1 | 规格未给混排精确算法，见 SPEC_ISSUES |
| S20 | MCQ deck schema 按 W1 草案精神自拟简化版（逐题喂方、单/多选、fragment 拼装） | W1 草案在 uiux 仓库 drafts/，mock 用最小可用子集 |
| S21 | 模型清单（#13）：Kimi K2.5 / DeepSeek V3.2 / GLM-5 / Qwen3 Max | 取自主仓 CLAUDE.md 支持的 lab-direct provider；仅 mock 展示用 |
| S22 | 场景内容（4 个场景、NPC、台词、计分维度数值）全部为 mock 自拟 | §C1 明确场景内容不属规格；取材于仓库既有场景（商鞅、凤仪亭）+ DESIGN_SPEC 提到的咳嗽场景 + 新场景占位（电车难题，用于演示 #54 新场景曝光） |
| S23 | 天梯 GP tab 展示种子数据 + W11 待定注记 | A6 已定约束（初始 0/空、按玩家×场景）在文案中体现 |
| S24 | 移动端：顶部导航折叠为底部 tab 栏（沿 v2 模式）；OS 面板为底部弹层；条横向滚动 | A5 移动端要求 |
| S25 | 首战战报完成态内嵌「三种构建模式已解锁」卡，三个 tab 深链到正常构建器对应模式 | #12「首战结束后展示三个模式 tab」的落地形态（规格没说 tab 展示在哪，选了战报内） |
| S26 | D 列表基础排序＝数据定义顺序；新场景固定插第 2 位 | 规格未定义基础排序（见 SPEC_ISSUES #19） |
| S27 | 回放只重演对话 + 裁判 OS，判决区暂隐 | 「全部内容从 0 到终局」的范围解读（见 SPEC_ISSUES #21） |
| S28 | 顶尖玩家 tab 跨场景的挑战按钮禁用并注明 | 对局需同场景（见 SPEC_ISSUES #22） |
| S29 | MCQ 二次编辑按 fragment 文本匹配反推勾选（有损） | 版本只存纯文本（见 SPEC_ISSUES #24） |
| S30 | 演示种子即已登录状态（琢玉），登录页保留完整流程演示 | 降低演示成本；「重置演示数据」在设置页 |
| S31 | 计分 PVP 的天梯 mock：首场后从 1000 基线起算，胜 +25 / 平 0 / 负 −15；打完发 ③自动匹配结果通知并重排天梯 | W11 分数模型未设计；「初始 0/空」满足（打计分 PVP 前 ladderScore=null，不由 PVE 播种） |
| S32 | PVP 每日限次（#46）与并发上限已在 mock 执行；拒绝文案自拟（「PVP 每日限次已用完（N/N）…」「同时进行的对战已达上限…」） | 规格只说可配置，未给触发文案 |
| S33 | 白名单示范对局未登录可看：/matches/demo-* 用极简公开壳渲染（B1） | 其余对局仍需登录；受限三项本就不出现在战报 |
| S34 | EA 入口补全（EA-4）：战报参战卡「查看该智能体」、G 页玩家名可点（有公开 agent 记录时）、NPC 侧进 NPC 聚合视图（B3） | mock 只为墨白种了公开 agent；其他外部玩家名不可点 |
| S35 | 首战判决偏置跟随发起人执方（不再固定偏 A） | 新手预设执方可配置（#10），偏置须跟着走 |
| S36 | 每日计数跨日自动清零（battlesDate 按浏览器本地日期） | 「明天再来」需要能兑现；时区口径见 SPEC_ISSUES #25 |

## 页面 ↔ 规格映射

| 规格页面 | 路由 | 文件 |
|----------|------|------|
| A 首页 (B1) | `/` | `src/pages/landing.tsx` |
| B 登录 (B2) | `/login` | `src/pages/login.tsx` |
| C 注册 (B2) | `/register` | `src/pages/register.tsx` |
| D 场景选择 (A4) | `/scenarios` | `src/pages/scenarios.tsx` |
| DA 场景介绍 (A4) | `/scenarios/:id` | `src/pages/scenario-detail.tsx` |
| E 构建器 (A2) | `/scenarios/:id/build` | `src/pages/builder.tsx` |
| 快速通道 (A3) | `/express` `/express/build` | `src/pages/express.tsx` |
| OS 选择对手 (A5) | （面板，非页面） | `src/components/os-panel.tsx` |
| 进行中的对战条 (A1/A5) | （全局组件） | `src/components/ongoing-bar.tsx` |
| FA 战报 (A7) | `/matches/:id` | `src/pages/match.tsx` |
| EA 智能体视图 (B3) | `/agents/:id` | `src/pages/agent-view.tsx` |
| G 排名中心 (B4) | `/rankings` | `src/pages/rankings.tsx` |
| I 通知 (B5) | `/notifications` | `src/pages/notifications.tsx` |
| K 设置 (B6) | `/settings` | `src/pages/settings.tsx` |
| L 对战历史 (B7) | `/history` | `src/pages/history.tsx` |

## v3.4 per-side 重构（2026-08-05）

> 依据 UI-Doc-v3.4.md「v3.3 → v3.4（per-side 反转）」#55–#64。推翻「一 agent＝两方」：
> **agent 属于场景的一侧；版本＝单侧提示词 + 模型；战绩天然单侧。**

### 模型层变化

| 变化点 | 旧（v3.3 mock） | 新（v3.4） |
|--------|----------------|-----------|
| `Agent` | 无侧 | `side: Side`（#55）；`tournamentVersionId` 语义变为「该侧的参赛版本」（#58） |
| `AgentVersion` | `promptA/promptB` | 单 `prompt: string`（#55/#57） |
| `AgentVersion.record` | `{A:{wins,losses}, B:{…}}` | 单 `{wins, losses}`——agent 即一侧（#55/#63） |
| `MatchKind` | 4 种 | + `'hotseat'`（自打，#61） |
| `dispatch()` | 收 `mySide` 参数 | 执方由所选 agent 隐含（#62）；新增 hotseat 对手 `opponent.myVersion` |
| `PublicVersionRef` | 无侧 | + `side`——约战/匹配按对侧过滤（#62） |
| localStorage | `…-state-v2` | `…-state-v3`（形状变了，旧存档直接丢弃；规格 v3.4 称「无迁移」） |

### 决定与解读

| # | 决定 | 依据/备注 |
|---|------|-----------|
| D16 | **版本迭代永不受 #59 引导门限制**——门只在「新建 agent」时校验（`store.canCreateAgent`），`saveVersion` 无任何门 | #59 原文括注「解读待确认」；本 mock 按 D16 解读实现 |
| V1 | 同侧第二个 agent 引导门（#59）按「**现存** agent」计（不含已删；0 版本的空 agent 也算「有」）；两侧都有后不再限制 | 「已建过」的时态规格未定，见 SPEC_ISSUES P4 |
| V2 | 引导门文案（mock 自拟）：「想再建一个商鞅？先创建一个甘龙——两边都要会写才是真本事。」＋『先创建{对侧}』CTA（切换新建侧） | #59 要求引导 UI，未给文案 |
| V3 | EA 展示名（#63）格式：`侧角色名「自起名」· 场景名`（如「商鞅「铁腕变法」· 商鞅变法」）；侧角色短名＝场景侧名去括注（「商鞅（变法派）」→「商鞅」） | #63 例子「商鞅 X · 商鞅变法」的 X 视为自起名；精确格式待确认（SPEC_ISSUES P4） |
| V4 | 双侧完成度徽章（#64）落点：EA、构建器「保存到哪个智能体」卡、DA 右列「准备好了？」卡、G 锦标赛 tab（对当前用户）；「✓」＝该侧有 ≥1 个 agent，参赛资格另按「双侧各有参赛版本标记」（#58）判定（`store.entryReadiness`） | #64「处处」的具体落点自选 |
| V5 | hotseat（#61）做成 OS 面板第二个 tab「自打（hotseat）」：不受 PVP 解锁门槛；对侧多 agent 时用下拉选择打哪个（含版本）；无对侧 agent 时显示创建引导；对局 kind=`hotseat`，不计天梯、不算 NPC 门槛、计入发起人每日上限 | v3.3 mock 原本没有 hotseat（v2 遗产）；本次按 #61 转正补建 |
| V6 | hotseat 战绩：两侧版本各记一笔胜/负（都是自己的 agent）；通知/历史/进行条按「A 侧胜 / B 侧胜」报，不说「你赢了」 | #61 未定义战绩语义；按 #55「战绩天然按侧」推导 |
| V7 | 「切到对侧」（#62）＝OS 面板头部按钮：有对侧 agent → 切到第一个（agent 下拉可精确选）；没有 → 变成「去创建对侧」链接（进构建器并预选侧 `?side=Y`） | #62/#64 |
| V8 | PVP 约战对侧校验（#62）在 store 层做（新错误 `wrong-side`），OS 面板同时预过滤：按 id 输入同侧版本给出明确提示；顶尖玩家 tab 同侧的挑战按钮禁用并注明 | 服务器侧校验是真实系统要求（BACKEND_REQUIREMENTS C0-1'/C0-2'） |
| V9 | 首战（#57）＝创建一个单侧 agent（侧来自新手预设），不再有「另一方空串」的半满版本；首战战报完成卡新增「去创建对侧（{角色}）」CTA（#59/#64） | 取代 v3.3 决定 S5 |
| V10 | 构建器新建 agent 需选侧（A/B 按钮，角色名标注）；`?side=A|B` 深链预选（所有「去创建对侧」CTA 使用）；MCQ deck / 元提示词 / 直写均只出当前侧 | #57/#62 |
| V11 | 种子数据：琢玉在商鞅变法有 A 侧「铁腕变法」（2 版）+ B 侧「老成谋国」（1 版，均标参赛版本 → 参赛资格 ✓）；在御前咳嗽案只有 A 侧「时间线卫士」→ 建第 2 个侍酒官触发 #59 引导门、EA 显示 御医 ✗；外部玩家公开版本全部标侧（墨白=商鞅 A、疏影=甘龙 B、青梧=吕布 A、止水=李儒 B） | 让新规则在演示态可见 |
| V12 | 排名/天梯文案按 #64 校正：天梯卡明示「按玩家 × 场景（不按智能体、不按侧）」；G 锦标赛 tab 增加 #58 参赛门槛说明 + 当前用户双侧就绪徽章 | #64/#58 |
| V13 | PVE 解锁门槛（#60）无需改逻辑：`npcsBeaten` 本就按（玩家,场景）记录、不分侧；仅改文案「任一侧的胜利都算」 | 验证过 store 不按侧过滤 |
| V14 | 版本 diff 提示改为单侧字数差；EA 版本卡战绩列改为「战绩（执X · 角色）：n 胜 m 负」 | #63「#35 简化」 |

### 修正 #65/#66（2026-08-05 追加，已上线 /v3-4）

> **#65**：PVP 门槛改为**按侧**——每侧各赢 ≥N 场 PVE（N 可配置，默认 1/侧），取代 #60「任一侧都算」（V13 作废）。
> **#66**：PVP 约战改为**双侧成对**——一次约战产生两场（正：我A vs 他B / 反：他A vs 我B），双方都须双侧齐备（关闭原 Q6/SPEC_ISSUES #30）。hotseat 与 PVE 不变（仍单场）。

| # | 决定 | 依据/备注 |
|---|------|-----------|
| V15 | `PlayerScenarioProgress.npcsBeaten` 重构为 `{ A: string[]; B: string[] }`——胜利按「我执的侧」归因；门槛判定＝每侧 distinct NPC 数 ≥ `CONFIG.pvpUnlockPerSideWins`（默认 1；N=1 时与「赢 ≥1 场」等价，口径问题见 SPEC_ISSUES #36）。旧知识点 `pvpUnlockDistinctNpcs` 删除 | #65 |
| V16 | 门槛进度 UI 统一为按侧徽章「商鞅 1/1 ✓ · 甘龙 0/1」：OS 面板锁定条、DA 右列门槛卡、D 卡片脚注；解锁通知/种子通知文案同步改写 | #65 |
| V17 | 种子门槛状态：商鞅变法 A/B 各 1 胜 → 已解锁；御前咳嗽案只有 A 侧 1 胜 → 锁定态显示「御医 0/1」（与该场景只有单侧 agent 的引导门演示叠加） | #65 反例可见 |
| V18 | `store.dispatchPairedPvp`：一次创建 2 个 Match（共享 `challengeId`，`challengeLeg` 1/2）；正＝我A vs 他B、反＝他A vs 我B；`dispatch` 保留给 PVE/hotseat（单场，challengeId=null）。约战单位从「对手版本」改为「对手玩家」（`publicPlayersFor` 按玩家分组双侧公开版本） | #66 |
| V19 | **Q7 解读（待确认）**：每日/PVP 计数对发起人记 **2 场**；剩余配额或并发名额不足 2 场时**整对拒绝**（不拆单） | #66 括注 Q7；SPEC_ISSUES #32 |
| V20 | OS 面板 PVP 三个 tab 重构：共用「我的双侧出战阵容」选择器（每侧一个 agent+version picker，默认参赛版本★/最新版）；我方未双侧齐备 → tab 内引导卡「PVP 约战需双方双侧齐备」+ 分侧创建 CTA；对手列表按玩家显示双侧（单侧玩家禁用并注明「对方未双侧齐备」）；按 id ＝解析到玩家、id 只固定其所属侧版本（另一侧取最新公开版）；自动匹配也成对（W11 未定，mock 推及——SPEC_ISSUES #33） | #66 |
| V21 | 配对可见性：ongoing-bar / 历史行 / 战报头部加「约战①/②」徽章；战报头部互链「查看另一场」；两场结果**不聚合**（独立通知/战绩/天梯分——SPEC_ISSUES #34）；被挑战方为**一条合并通知**（种子 n-1 演示；SPEC_ISSUES #37） | #66 |
| V22 | localStorage key v3→v4（npcsBeaten/Match 形状又变，旧演示存档丢弃）；公开版本种子补齐：墨白（商鞅）+「守旧之问」（甘龙）双侧齐备、青梧双侧齐备，疏影/止水保持单侧作拒绝演示 | — |

> **2026-08-05 追记**：Q4（版本迭代不受引导门限）、Q5（展示名＝侧角色名「自起名」· 场景）、Q7（一次约战按场计占发起人 2 次，配额不足整对拒绝）均已由 Yihan 确认——本文件相应「待确认」标记视为已解决。

### 修正 #67–#73 + fixture 真实化（2026-08-05 第三批，已上线 /v3-4）

> Part 1：七条 UI/结构修正。Part 2：Yihan 要求 fixture 参照**原始真实实现**的数据形态重做
> （赛后问询/隐藏目标/系统模板——Vivian 反馈原 mock 看不出赛后问询是干什么的）。

**fixture 实际参照源（主仓只读）：**
- `apps/api/src/db/seed.ts`：`agentPromptTemplate`（#68 系统角色模板的形态与占位符）、`examinationQuestionTemplate`（赛后问询＝秘密猜测「对方三条请求中哪条是真目标」）、`scorerPrompt`（计分规则：真请求被准 +0.5 / 假请求被准 −0.25 / 真目标被识破 −1）、roleA/BRequests（SR1-3/GR1-3 原文照搬进商鞅场景数据）
- `docs/competition/mock-runs/option-f.json`：商鞅对话台词改写自该真实模拟对局（谈判弧线：军功爵 → 封地过渡 → 十年之约 → 诛心一问）
- `apps/api/src/engine/core.ts`：流程锚定（对话 → examination → scoring）
- （v2/scenarios/shangyang-court/script.js 查阅过，形态与 seed.ts 一致）

| # | 决定 | 备注 |
|---|------|------|
| V23 | **#67** 首战卡沉底为「旅程卡」（三格：通往下一轮 →｜解锁对侧｜通往 PVP →），顶部只留一个滚动锚点按钮「首战完成 · 下一步在页尾」 | **视觉待评审**——卡片式三格 + 方向性关键词为 mock 初版，非最终视觉 |
| V24 | **#68** 编辑器旁固定注「你只需编写策略；比赛时系统会自动把它与角色模板合并」+ 可折叠只读模板（「仅供查看，无需在策略中重复」）。预览把 {{roleName}}/{{requests}} 等占位符按当前侧实填，{{strategy}} 标注为「你的策略会填进这里」；4 个场景各配 `agentPromptTemplate`（商鞅为 legacy 原文精简，其余仿写） | 编辑器标签从「提示词」改为「策略」 |
| V25 | **#69** 完成态顺序重排：结果+判词置顶（先于完整对话）→ 对话 → 赛后问询 → 隐藏目标五步 → 计分推导。`MatchResult.hiddenGoalReveal`（散文）→ `hiddenGoals: {A,B}` 五步结构（真目标 id+内容 / 是否获准 / 对手猜了哪条 / 是否被识破 / 得分变化明细）。问询与五步由同一 `goalFactsFor(match, side)` 派生，保证互相印证 | 数据源＝场景新增 `requests`（一真两假语义） |
| V26 | **#69 补充**：mock 的计分推导表仍是 0-10 加权维度分（v3.3 形态），真实 scorer 是 ±1.5 事件分——「隐藏目标」维度的判定说明如实引用五步事实并注明「表内分数为归一化展示」；两套口径并存的问题上报 SPEC_ISSUES #38 | — |
| V27 | **#70** EA 版本卡增「编辑此版本」→ 构建器 `?agent=&version=`（既有入口），旁注「保存会另存为新版本」 | 不做就地编辑 |
| V28 | **#71** 战报参战卡链接分级：我的一侧＝醒目按钮「← 我的智能体（名）」；对手（玩家）＝低调文字「查看对手智能体」；PVE NPC 不给链接（原 NPC 聚合视图入口从 FA 移除，页面本身保留） | 对手无公开 agent 记录（仅公开版本 id）时无链接——mock 数据限制 |
| V29 | **#72** 进行中的对战条：仅派发处渲染（路由白名单：DA `/scenarios/:id`、E `/build`、EA `/agents/:id`、`/my-agents`、`/express*`）——取代 v3.3 决定 S1 的全局渲染；空则隐藏；折叠开关持久（localStorage `ongoing-collapsed`）；条头加「全部历史」链接（历史页从一级导航移除后的入口） | 白名单是 mock 解读，见 SPEC_ISSUES #39 |
| V30 | **#72 顶栏减噪**：高度 16→12、导航去底色只变字色、铃铛未读数字气泡 → 小圆点（数量进 tooltip/aria）、退出降为 ghost | — |
| V31 | **#73** 新一级导航「我的智能体」`/my-agents`：按场景分组，组头双侧完成度徽章 + 参赛资格文案 + 缺侧创建 CTA；每行快捷入口 查看(EA)/编辑(构建器载入最新版)/出战(就地弹 OS 面板)。D 场景卡的智能体清单撤下，只留「我的智能体（n）→」小链接。导航＝场景 · 我的智能体 · 排名（+铃铛=通知、头像=设置） | 「出战」在本页直接开 OS 面板，不跳 EA |
| V32 | fixture 商鞅场景数据改为 legacy 真实语义：`hiddenInfoTruthConfig`＝无隐藏信息/一真两假请求、`postGameInquiry`＝逐项裁决+秘密猜测+策略评估、`judgePrompt` 融入「不得用现代词汇」约束；其余三场景请求清单为仿写（id 风格 CR/YR/LR/RR/UR/DR） | §C1 场景内容本就 mock 自拟，但形态对齐真实 schema |
| V33 | **V-5 修复**：终局一条裁判 OS 强制收束——文本不再「我还需再听」，倾向与最终判决同源对齐（`computeBreakdown` 提取为 genResult/终局 OS 共用）；平局时收束为「胜负系于问询」 | — |
| V34 | localStorage key v4→v5（MatchResult/Scenario 形状又变，旧演示存档丢弃） | — |
| V35 | **R1 评审补**（多人设评审 Round 1，见 uiux 仓 rfc/ks-fix-multi-persona-review.md）：① `Match.finishedAt` 落库，「刚完成」卡 15 分钟自动过期 + 单卡 × 清除（localStorage `ongoing-dismissed`，历史页不受影响）——空态自动隐藏真正可达；② 历史页入口补位：我的智能体页头 +「设置 · 我的 agents」卡头「全部对战历史」（原先唯一入口在对战条内，条隐藏即断路）；③ `participant.refId` 契约统一＝agent id（约战对手侧原误写 versionId → 「查看对手智能体」在真实派发的 PVP 局永不渲染）；`PublicVersionRef` 增 `agentId`，公开玩家（墨白B/疏影/止水/青梧×2）补齐 agent 档案，demo 局 refId 修正 | 旧存档无 finishedAt → 按已过期处理，无需 bump storage key；my-agents eyebrow 去重（迭代中枢） |
| V36 | **标记系统**（参照 /v3-prototypes 的「标记」交互）：右下角开关 / M 键；开启后自动扫描按钮/链接/输入/标题/卡片（+手标 `data-mark` 优先）生成可复制定位码「页面码/文字slug#序号」（如 `EA/编辑此版本#2`）；右下角**常驻页面身份角标**（页面码+中文名+路径+分支标签）——人工截图自然携带页面身份。两个分支（主线 + ks版）同步加装 | 自动 slug 取自文字/aria-label 前 10 字，同页重复取序号；无需逐元素手标 |
| V37 | **#74/#75 并入主线**（Yihan ✅ 08-07）：#74 历史回一级导航（场景·我的智能体·排名·历史，修订 #73）；#75 EA 页头「编辑」按钮（出战旁，修订 #70，版本卡「编辑此版本」保留）。两条均源自 ks 原图纠偏，先行实现于 feat/v3.4-ks-image-mock（437cf2b），本次手工搬 delta 合入主线 | ks版分支冻结留档 |
| V38 | **debug 定夺落地（08-10，/debug-mode-align B1–B5 + #80）**：B1 回放中隐藏 debug 层（维持代码行为，SPEC_ISSUES #15 闭环）；B2 traceKind 徽标上线（`Match.traceKind`，native=deepseek/kimi 系、generated=其余，TraceBlock 标「原生/生成」）；B3 受限三样维持 tooltip；B4 开关文案统一「调试模式」（正式名等 W5）；B5 旧局空态不做（真实版不保留旧数据——Yihan）。**#80：NPC 即官方运行**——NPC 侧 trace 归官方层、debug 公开（原「NPC 侧无 trace」表述废止，tick 现对 NPC 也生成 trace） | 旧存档无 traceKind → 徽标回退「生成」 |
