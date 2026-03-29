# Design System — Axiia Cup

## Product Context
- **What this is:** AI 智能体对抗赛平台，选手编写提示词打造智能体参加人文学科辩论
- **Who it's for:** 中国高中与大学学生
- **Space/industry:** AI 教育竞赛，介于学术与电竞之间的第三条路线
- **Project type:** Web app (competition platform)
- **Language:** 中文为主，界面全中文

## Aesthetic Direction
- **Direction:** Editorial/Magazine — 学术刊物风格
- **Decoration level:** Intentional — 纸质纹理、细线分隔符、偶尔的水墨书法元素
- **Mood:** 锐利、沉稳、智识性但不沉闷。像一本会跑 AI 比赛的文学杂志。
- **Reference sites:** Lichess (功能性棋类平台), The Browser Company (现代但有性格), Monocle (编辑排版)
- **Anti-patterns:** 不用紫色渐变、不用电竞暗黑风、不用三栏图标网格、不用居中泡泡布局

## Typography
- **Display/Hero:** Fraunces — 光学尺寸衬线体，有温度和性格，在满是无衬线的 AI 竞赛空间中独树一帜
- **Body (English):** Instrument Sans — 干净、现代、优秀的可读性
- **Body (Chinese):** Noto Sans SC (思源黑体) — 标准 CJK 字体，与 Instrument Sans 风格统一
- **Data/Tables:** Geist Mono — 等宽字体，用于排行榜数字、提示词编辑器、数据展示
- **Code:** Geist Mono
- **Loading:** Google Fonts CDN (`family=Fraunces:opsz,wght@9..144,300..800&family=Instrument+Sans:wght@400..700&family=Noto+Sans+SC:wght@400..700`)
- **Scale:**
  - Hero: 72px / 4.5rem
  - H1: 42px / 2.625rem
  - H2: 28px / 1.75rem
  - H3: 22px / 1.375rem
  - Body: 16px / 1rem
  - Small: 14px / 0.875rem
  - Caption: 13px / 0.8125rem
  - Micro: 12px / 0.75rem
  - Mono: 14px / 0.875rem

## Color
- **Approach:** Restrained — 单一强调色 + 暖中性色
- **Background:** #FAFAF7 — 暖白，像优质纸张
- **Surface:** #F2F1EC — 面板、侧边栏背景
- **Elevated:** #FFFFFF — 卡片、弹出层
- **Primary Text:** #1A1A1A — 近墨黑
- **Secondary Text:** #5C5C5C
- **Muted Text:** #8A8A8A
- **Accent (朱砂红):** #C23B22 — 来自中国印章传统，在暖中性色上极具视觉冲击
- **Accent Hover:** #A83220
- **Accent Light:** #FDF0EE
- **Border:** #E0DED8
- **Border Light:** #EBE9E4
- **Semantic:**
  - Success: #2D7A4F
  - Warning: #B8860B
  - Error: #C23B22
  - Info: #3B6EA5
- **Dark mode strategy:**
  - Background: #141413
  - Surface: #1E1E1C
  - Elevated: #282826
  - Primary Text: #EDEDEB
  - Secondary: #A8A8A3
  - Accent: #E0553E (提亮10-15%)
  - Borders: #333330 / #2A2A28
  - Semantic badges: 降低饱和度，深底浅字

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable — 不像仪表盘那样密集，也不像营销页那样空旷
- **Scale:** 2xs(2px) xs(4px) sm(8px) md(16px) lg(24px) xl(32px) 2xl(48px) 3xl(64px)

## Layout
- **Approach:** Hybrid — 应用页面用网格规范，着陆页/营销页用编辑排版
- **Grid:** 12 columns, responsive
  - Desktop (>1200px): 12col, max-width 1200px
  - Tablet (768-1200px): 8col
  - Mobile (<768px): 4col
- **Max content width:** 1200px
- **Border radius:** sm: 4px, md: 8px, lg: 12px, full: 9999px (badges/pills)

## Motion
- **Approach:** Minimal-functional — 仅服务于理解的过渡动画
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms)
- **Usage:** 页面过渡、卡片悬停状态、对战结果揭晓。无弹跳动画。

## Key Screen Names (中文)
| Screen | 中文名称 | Primary Action |
|--------|---------|----------------|
| Registration | 注册 | 手机号 + 微信注册 |
| Dashboard | 控制台 | 查看对战状态与历史 |
| Agent Builder | 智能体工坊 | 编写提示词 + 选择模型 |
| Playground | 试炼场 | 测试提示词效果 |
| Leaderboard | 排行榜 | 查看排名与胜率 |
| Match Result | 对战结果 | 查看回合记录与裁判判定 |

## UI Terminology (中文)
| English | 中文 |
|---------|------|
| Submit | 提交参赛 |
| System Prompt | 系统提示词 |
| Win Rate | 胜率 |
| Match | 对局 |
| Turn | 回合 |
| Judge Verdict | 裁判判定 |
| Victory | 胜出 |
| Defeat | 落败 |
| Running | 对战中 |
| Queued | 排队中 |
| Role A / Role B | 角色A / 角色B |
| Scenario | 场景 |
| Word limit | 字数限制 (1000字) |
| Test in Playground | 在试炼场测试 |
| View Transcript | 查看对话记录 |
| Anonymous player | 选手 [4位数字] |

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-29 | 初始设计系统创建 | 基于竞品研究 (AgentX, Toornament, Devpost) 与产品定位分析 |
| 2026-03-29 | Fraunces 衬线标题字体 | 在无衬线主导的 AI 竞赛空间中差异化，传达学术气质 |
| 2026-03-29 | 朱砂红 #C23B22 强调色 | 锚定中国文化语境（印章传统），避开泛滥的蓝紫色 |
| 2026-03-29 | 浅色模式优先 | 传达"清晰与智识"而非"电竞与游戏" |
| 2026-03-29 | Noto Sans SC 中文正文 | 标准 CJK 字体，可从 Google Fonts 加载，与 Instrument Sans 风格统一 |
| 2026-03-29 | 字数限制改为 1000 字 | 中文按字符计数，300词对中文约等于1000字 |
