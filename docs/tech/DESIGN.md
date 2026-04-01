# Design System — Axiia Cup

## Product Context

- **What this is:** AI 智能体对抗赛平台，选手编写提示词打造智能体参加人文学科辩论
- **Who it's for:** 中国高中与大学学生
- **Space/industry:** AI 教育竞赛
- **Project type:** Web app (competition platform)
- **Language:** 中文为主，界面全中文

## Aesthetic Direction

- **Direction:** Clean Dashboard — 简洁电竞仪表盘风格，暗色调为主
- **Decoration level:** Minimal — 无装饰，数据和功能说话
- **Mood:** 干净、专注、竞技感。像一个简化版的电竞数据面板。
- **Reference sites:** Lichess dark mode, Linear (简洁工具感), op.gg (电竞数据)
- **Anti-patterns:** 不用纸质纹理、不用衬线字体、不用水墨元素、不用过度装饰

## Typography

- **Display/Hero:** Satoshi — 几何无衬线，干净有力，竞技感
- **Body (English):** Satoshi — 统一字体栈，简化
- **Body (Chinese):** Noto Sans SC (思源黑体) — 标准 CJK 字体
- **Data/Tables:** Geist Mono — 等宽字体，数据展示
- **Code:** Geist Mono
- **Loading:** `family=Noto+Sans+SC:wght@400;500;600;700` + Satoshi via Fontshare CDN
- **Scale:**
  - Hero: 48px / 3rem
  - H1: 32px / 2rem
  - H2: 24px / 1.5rem
  - H3: 18px / 1.125rem
  - Body: 14px / 0.875rem
  - Small: 13px / 0.8125rem
  - Caption: 12px / 0.75rem
  - Mono: 13px / 0.8125rem

## Color

- **Approach:** Dark-first, restrained — 暗底 + 单一强调色
- **Background:** #0C0C0C — 纯暗底
- **Surface:** #161616 — 卡片、面板
- **Elevated:** #1E1E1E — 弹出层、活跃区域
- **Primary Text:** #E8E8E8
- **Secondary Text:** #888888
- **Muted Text:** #555555
- **Accent (朱砂红):** #E04A2F — 在暗底上更亮的朱砂红
- **Accent Hover:** #F25A3F
- **Accent Subtle:** rgba(224, 74, 47, 0.12)
- **Border:** #2A2A2A
- **Border Light:** #222222
- **Semantic:**
  - Success: #34D399
  - Warning: #FBBF24
  - Error: #F87171
  - Info: #60A5FA
- **Light mode (optional toggle):**
  - Background: #FFFFFF
  - Surface: #F5F5F5
  - Elevated: #FFFFFF
  - Primary Text: #111111
  - Secondary: #666666
  - Accent: #C23B22
  - Borders: #E5E5E5 / #EEEEEE

## Spacing

- **Base unit:** 4px
- **Density:** Compact — 仪表盘密度，信息优先
- **Scale:** 2xs(2px) xs(4px) sm(8px) md(12px) lg(16px) xl(24px) 2xl(32px) 3xl(48px)

## Layout

- **Approach:** Grid-disciplined — 纯网格，无编辑排版
- **Grid:** 12 columns, responsive
  - Desktop (>1200px): 12col, max-width 1280px
  - Tablet (768-1200px): 8col
  - Mobile (<768px): 4col
- **Max content width:** 1280px
- **Border radius:** sm: 4px, md: 6px, lg: 8px, full: 9999px

## Motion

- **Approach:** Minimal-functional — 快速、无弹跳
- **Easing:** ease-out for all
- **Duration:** micro(80ms) short(150ms) medium(200ms)
- **Usage:** hover 状态变化、页面切换淡入。无华丽动画。

## Key Screen Names (中文)

| Screen        | 中文名称   | Primary Action         |
| ------------- | ---------- | ---------------------- |
| Registration  | 注册       | 邮箱 + OTP 注册        |
| Dashboard     | 控制台     | 查看对战状态与历史     |
| Agent Builder | 智能体工坊 | 编写提示词 + 选择模型  |
| Playground    | 试炼场     | 测试提示词效果         |
| Leaderboard   | 排行榜     | 查看排名与胜率         |
| Match Result  | 对战结果   | 查看回合记录与裁判判定 |

## UI Terminology (中文)

| English            | 中文              |
| ------------------ | ----------------- |
| Submit             | 提交参赛          |
| System Prompt      | 策略提示词        |
| Win Rate           | 胜率              |
| Match              | 对局              |
| Turn               | 回合              |
| Judge Verdict      | 裁判判定          |
| Victory            | 胜出              |
| Defeat             | 落败              |
| Running            | 对战中            |
| Queued             | 排队中            |
| Role A / Role B    | 角色A / 角色B     |
| Scenario           | 场景              |
| Word limit         | 字数限制 (1000字) |
| Test in Playground | 在试炼场测试      |
| View Transcript    | 查看对话记录      |
| Anonymous player   | 选手 [4位数字]    |

## Decisions Log

| Date       | Decision               | Rationale                                    |
| ---------- | ---------------------- | -------------------------------------------- |
| 2026-03-29 | 初始设计系统创建       | 基于竞品研究与产品定位                       |
| 2026-03-29 | v2: 改为暗色仪表盘风格 | 用户反馈：偏好电竞仪表盘风格而非学术刊物风格 |
| 2026-03-29 | Satoshi 替换 Fraunces  | 几何无衬线更符合仪表盘风格                   |
| 2026-03-29 | 暗色模式优先           | 电竞/竞技平台标准                            |
| 2026-03-29 | 4px 基准间距           | 仪表盘需要更紧凑的布局                       |
| 2026-03-29 | 保留朱砂红强调色       | 在暗底上更醒目，保持文化锚点                 |
