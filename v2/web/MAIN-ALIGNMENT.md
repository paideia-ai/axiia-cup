# 前端基线核对与克制版 Demo

## 已核对的基线

2026-09-09 执行 `git fetch origin main`，最新 main 为 `28cf870`（#169，Keso My
Agent low-high-low flow）。 之前的美化 demo 基于 `02bf7f5`，其产品代码祖先为
`68dac84`，确实未包含 main 后续的 #167 和 #169。旧 demo 的独立界面不能代表当前
main。

本 worktree：`/home/kesou/axiia-cup-frontend-main-demo-20260909`。
分支：`codex/frontend-main-demo-20260909`，直接从 `28cf870` 创建。

随后按用户要求同步尚未合并的
[PR #170](https://github.com/paideia-ai/axiia-cup/pull/170) （`40c7dcc`）：所有
AppShell 页面统一为 1040px 最大宽度，包含页头、正文与页脚。 只应用该 PR
的一处宽度规则，未提交或合并 PR。

## 发现的差异与对齐方式

| 范围                         | 旧 demo 的问题                                                               | 当前处理                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 我的智能体、主页、构建器     | 使用 `src/demo` 的独立组件，未使用 #169 合并后的产品组件                     | 直接挂载 main 的 `MyAgentsPage`、`AgentViewPage`、`BuilderPage`                   |
| 新建与版本操作               | 旧 demo 自己维护创建、保存、参赛与对比流程                                   | 使用 main 的浮层、版本列表、更多菜单和请求流程；演示适配层仅提供本地 DTO          |
| 构建器                       | 没有产品实现里的草稿暂存、恢复、跨智能体隔离等完整流程                       | 使用 main 的构建器，路由按 agentId 设置 key，与 main 一致                         |
| 场景详情                     | 旧 demo 的 `showLiveProgress=false` 隐藏了门槛与统计，且简化了已有智能体选择 | 使用 main 整个 `ScenarioDetailPage`，包含当前库存状态、门槛、统计、入口和错误反馈 |
| 战报                         | 缺少 #169 的首战后引导文案及创建对侧后的主页落点更新                         | 使用 main 的 `MatchDetailPage`                                                    |
| 导航与宽度                   | 独立 demo 统一为 1040px，没有使用最新产品外壳                                | 使用 main 的 `AppShell` 并同步 PR #170，所有页面最大宽度统一为 1040px             |
| 场景目录、排名、积分榜、历史 | 与 main 的对应页面代码一致，但原 demo 的外壳不同                             | 同样直接复用 main 页面与外壳                                                      |
| 页面滚动                     | 未包含 main #167 的全局修复                                                  | 原样保留 main 的 styles.css 和滚动恢复实现                                        |

`src/pages`、`src/api`、`src/scenarios` 保持 main 原样； `src/styles.css`
随后统一了正文、`font-sans` 和中文等宽内容的字体回退，见下面说明。
`src/components` 仅有与 PR #170 完全一致的 AppShell 宽度改动。 其他新增代码只在
demo 入口、样式覆盖和合成数据适配层。 不复制旧 demo
的智能体、构建器、场景详情或导航组件。

## 本次样式约束

- 字体修正：正文与 `font-sans` 共用 Satoshi / Noto Sans SC 字体栈，并明确指定
  苹方、微软雅黑、文泉驿等中文无衬线回退；编号和代码保留等宽字体，补齐中文回退，
  去掉原默认列表中的 Courier
  类回退。远程字体不可用时也不依赖浏览器选择中文字体。

- 取消上一版新增的橙色卡片顶线、双色角色装饰线、大面积暖棕色面板。
- 使用中性深灰背景、细灰边框和轻微悬停反馈。
- 主标题 26px、卡片标题 20px；手机分别 24px / 19px。
- 主要调整文字对比度、行高、内边距、表格数字对齐，保留 main 的内容与布局顺序。
- 原有参赛选中态、角色识别线和必要按钮颜色是 main 自带的功能标识，保持原样。
- 对照页两侧均使用 main + PR #170 的 1040px 宽度；左侧为原样式，右侧为克制版。
  两侧运行完全相同的页面组件和示例数据。

## 浏览

- 新 demo：`http://localhost:5198/demo.html#/scenarios`
- main + PR #170 对照：`http://localhost:5198/style-review.html`
- main + PR #170
  原样式：`http://localhost:5198/demo.html?style=original#/scenarios`
- 智能体主页：`#/agents/163`，构建器：`#/agents/163/build`
- 原来的 5196 预览保留在旧 worktree，不是此次交付地址。

## 数据边界

### 真实账户预览（5200）

用户要求增加可登录的预览后，新增独立入口 `http://localhost:5200/my-agents`。
它运行原有 `src/main.tsx`、完整产品路由和 AuthProvider，仅加载克制版样式。 保留
PR #170 的 1040px 宽度；不加载任何示例 API 或合成数据。

通过原有 Vite `/v1` 同源代理连接正式 API，登录使用原有邮箱密码或手机号流程，
会话使用 HttpOnly cookie。凭据由用户直接在页面输入，无需交给开发者。
此入口的保存、参赛、发起对战等操作会作用于真实账户。

已验证正式 API 经代理返回未登录的 401 JSON、受保护页面跳转登录并保留返回地址、
邮箱与手机号入口显示正常、未加载示例 API 模块且无浏览器异常。
类型检查、入口与配置
lint、独立预览构建通过。未代用户登录，真实会话需用户在页面完成登录。

```bash
AXIIA_PROXY_TARGET=https://axiia-cup-2.isofucius.cn deno run -A npm:vite --config vite.account-preview.config.ts
```

### 公开快照演示（5198 / 5199 / Vercel）

用户要求尽量使用真实数据后，改用 2026-09-09 17:51 UTC 正式 API 快照。
原始数据来自当日页面宽度验收时的已认证采集；导出时逐个验证 manifest 中的
SHA-256。 公开文件为
`src/demo/public-snapshot.json`，采集时间、来源和响应哈希记录在 provenance 中。
这是一份历史快照，不代表实时线上状态。

- 5 个场景：真实统计、门槛和预设列表。
- 22 个智能体、22 个版本：保留真实编号、模型、创建时间、参赛标记和胜负统计。
- 29 场已结束对战详情，覆盖全部 5 个场景；保留对话、事件、判决和分数。 其中 28
  场已评分、1 场已结束但未评分，保留真实状态。原历史列表有 146 场，此 demo
  只展示已经收录完整详情的 29 场，页面底部明确标注。
- 2 个真实锦标赛及积分榜；不再编造赛事、选手胜率或轮次。
- 账户名称匿名化，账户 UUID 替换为 demo 标识，不导出联系方式、凭据。
- 私人策略替换成明确标注的示例文本，版本 options 不公开；战报 turn
  内思考轨迹剔除。 正文对话和评分不会为了美化而重写。

原有浏览器内模拟 API 继续支持创建、草稿、保存和参赛版本切换，修改只写入本机
localStorage。更新后的存储键与旧合成数据隔离，避免旧数据覆盖真实快照。
未收录的接口和真实对战操作返回演示错误，不连接后端。

重新导出（原始采集目录不得提交或上传）：

```bash
node tests/demo/export-public-snapshot.mjs /path/to/private-api-capture
deno fmt src/demo/public-snapshot.json
```

## 验证

- 真实快照更新后重新通过 27 组页面尺寸对照及创建、保存、参赛版本、回放交互检查。
- 全部 29 场战报在桌面和手机共 58 组检查通过：无横向溢出、运行时错误，
  已结束但未评分的状态也与原始响应一致。
- 将导出数据逐项对照原始响应：场景数据、版本元信息、排名分数、对话正文一致；
  私人策略全文和 turn 思考轨迹未进入公开快照。
- 字体检查覆盖 4 个页面、桌面/手机、远程字体可用/不可用，共 16 组； Chromium
  实际渲染字体未出现 serif、Times、Courier 或宋体回退。

- 相对 main，产品代码有 PR #170 的 AppShell 宽度改动，以及后续 `styles.css`
  字体栈修正；业务组件、API 和场景代码未修改。
- 以下 27 组内容与交互对照是同步宽度前的验收记录；本次宽度专项检查另行记录。
- PR #170 同步后：9 个页面 × 1440 / 1280 / 1024 / 768 / 390px，共 45
  组宽度检查通过。 页头、正文和页脚均为 1040px
  最大宽度；无页面横向溢出、可见内容溢出或运行时异常
  （不计原有新建按钮图标内部的装饰性加号偏移）。对照页两侧也已核实采用相同宽度。
  构建、改动文件格式检查与 AppShell lint 通过，结果与截图位于
  `/tmp/axiia-pr170-width/`。
- TypeScript 检查、demo lint、Vite demo 构建通过。
- 9 个页面 × 1440 / 768 / 390 三种宽度，共 27
  组浏览器对照通过：正文、元素顺序、链接和语义属性一致，无横向溢出，场景卡片无额外顶线。
- 三种宽度均验证新建智能体、编辑并保存版本、返回主页、切换参赛版本、预设与 AI
  辅助弹窗以及战报回放；无页面异常或真实 `/v1` 网络请求。
- axe 检查未增加违规节点；仍存在 main
  原有的战报图表嵌套交互、战报与构建器部分对比度问题，因此不声称全部无障碍检查通过。
- 浏览器截图和完整检查结果位于 `/tmp/axiia-main-aligned-demo/`；复现脚本为
  `tests/demo/main-alignment-smoke.mjs`。

## 复现

在本 worktree 的 `v2/web`：

```bash
deno install --frozen
deno task typecheck
deno lint src/demo
deno run -A npm:vite --config vite.demo.config.ts
deno run -A npm:vite build --config vite.demo.config.ts
deno run -A npm:vite preview --config vite.demo.config.ts --port 5199 --host 0.0.0.0
node tests/demo/main-alignment-smoke.mjs
```

## 分享与部署

源码分支：`codex/frontend-main-demo-20260909`。 用户已授权提交、推送此分支，并将
demo 部署到 Vercel。

公开部署仅上传 `build/demo`
中的静态构建产物，包含匿名化的真实数据快照及左右对照页面。 账户预览
`build/account-preview` 和正式 API 代理不包含在公开 demo 中。 首页和
`/demo.html#/scenarios` 打开示例页面；`/style-review.html` 打开左右对照。

重新发布时，先运行上面的 demo 构建命令，将 `build/demo` 复制到独立发布目录，
再对该目录运行 `vercel deploy --prod --yes`。不要直接部署整个仓库。

后端、数据库、场景脚本未修改；本分支尚未合并到 main。
