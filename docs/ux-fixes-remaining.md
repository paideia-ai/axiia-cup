# UX Fixes — Remaining Work

已完成的 9 个 fix 在 `feat/ux-fixes` 分支。以下是未实现的部分。

---

## Fix 1: Landing Page 放真实对局（P2）

**内容：** 把 Landing 的三步抽象说明替换为一段精选对局的高亮回放（3-4 轮精彩对话 + 裁判判词摘要 + 最终比分）。

**为什么没做：** 需要从现有对局中选一场精彩的（推荐 match #347 Kurt vs Tachi），提取 3-4 轮关键对话，硬编码为静态内容。涉及新组件 + 内容策划。

**实现思路：**
- 在 `landing-page.tsx` 的 steps section 上方或替换 steps section
- 新建 `FeaturedMatch` 组件，展示精选对话片段
- 数据硬编码，不需要 API 调用
- 需要设计对话气泡的视觉样式（商鞅/甘龙双方 + 裁判判词）

**工作量：** ~2-3 小时

---

## Fix 2b: 工坊"快速上手"卡片（P1）

**内容：** 在提示词编辑区上方加一个可关闭的引导卡片，用 7 行文字概括游戏核心机制。

**为什么没做：** 需要新建可关闭组件（dismissible card），用 localStorage 记住关闭状态，首次用户才显示。约 50 行新组件。

**实现思路：**
- 新建 `QuickStartCard` 组件
- `localStorage.getItem('axiia-quickstart-dismissed')` 控制显示/隐藏
- 放在 `ScenarioDetail.tsx` 的 CardHeader 和 form 之间
- 包含"查看一场示例对局 →"链接（依赖 Fix 5b 的 match ID 选定）

**工作量：** ~1 小时

---

## Fix 2c: 裁判 prompt 摘要（P2）

**内容：** 裁判 accordion 折叠时显示一句话摘要："裁判是秦孝公，倾向甘龙一方，看重实据和可行性"，展开后才显示完整 prompt。

**为什么没做：** Fix 2a（折叠 accordion）已经缓解了 80% 的问题。摘要文字需要从 scenario 数据中提取或硬编码，当前 accordion 组件不支持折叠状态下的 subtitle。

**实现思路：**
- 给 `AccordionItem` 组件增加 `subtitle` prop
- 裁判 section 传入摘要文字
- 摘要文字可以硬编码（当前只有一个场景），或从 scenario 数据新增字段

**工作量：** ~30 分钟（如果硬编码摘要）

---

## Fix 4: 计分示例（P2）

**内容：** 在计分规则 accordion 底部加一个真实对局的计分拆解示例。

**为什么没做：** 需要选取一场真实对局数据，手动编写计分分解步骤。内容是静态的，但需要确认用哪场对局。

**实现思路：**
- 在 `ScenarioDetail.tsx` 的 `score-rules` AccordionItem 内部，scoring rules 下方追加
- 用 match #347 的数据（Kurt 商鞅 0.5 vs Tachi 甘龙 -0.25）
- 纯 JSX 静态内容，无需 API

**工作量：** ~30 分钟

---

## Fix 5b: 示例对局入口（P1）

**内容：** 在工坊页、Dashboard 空状态、Landing 页三个位置添加"查看示例对局"链接，指向一场精选 match detail 页。

**为什么没做：** 需要确定精选对局的 match ID。生产环境 match ID 与开发环境不同，需要一个稳定的引用方式（硬编码 ID 或新增"featured match" API）。

**实现思路：**
- 选定一个 match ID（推荐 #347）
- 在三个位置各加一个 `<Link to="/matches/347">`
- Dashboard 空状态已有框架（Fix 6 已实现），加一个链接即可
- 工坊页可放在 Quick Start Card 内（依赖 Fix 2b）

**工作量：** ~15 分钟（确定 ID 后）

---

## Fix 5c: Playground 试跑（P3）

**内容：** 允许用户保存提示词后立即跑一局测试对局（对手用默认 prompt），在前端实时看到效果。

**为什么没做：** 需要后端支持：创建 playground match、调用 LLM、返回结果。这是一个完整的新功能，不是 UX 修补。

**注意：** 当前已有 Playground 功能（`/playground/:submissionId`），版本历史中有"前往试炼场"按钮。此 fix 的意思是在首次保存后更主动地引导用户去试炼场，而非新建功能。

**实现思路：**
- 首次保存成功后，toast 中增加"前往试炼场"链接
- 或在保存成功后自动跳转到 playground 页面

**工作量：** ~15 分钟（如果只做引导链接）
