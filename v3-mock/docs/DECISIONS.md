# v3.3 Mock 前端 — 决定与假设记录

> 本文记录实现 `v3-mock/` 时做出的所有决定（decision）与假设（assumption）。
> 规格依据：`/home/ubuntu/axiia-cup-uiux/UI-Doc-v3.3.md`（引用形如 (#n) / (A5) / (W4)）。
> 配套文档：`BACKEND_REQUIREMENTS.md`（需要后端支持的点）、`SPEC_ISSUES.md`（实现中发现的规格问题）。

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
