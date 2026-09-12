# 测试模式（test mode）

给产品里的每个 UI/UX 部件一个稳定的标记，开启后能看到它对应 spec v4
的哪些条款、历史两轮人测手册和当前 A3/A4/A6/B3/A5
固定版本交接的哪些步骤，并能按手册逐步做人测、把结果直接记进看板。

- **开启**：任意页面 URL 加 `?tm=1`（会记住；`?tm=0` 或右下角药丸的 ✕
  关闭）。手册可再带
  `tmJourney=<旅程 id>&tmStep=<步骤 id>`，即使先经过登录页也会
  回到原产品网址并自动展开指定步骤。关着时零成本：只有一次 localStorage
  读取，代码与数据都在独立的 lazy chunk 里。
- **药丸**（右下角）：标记（显示/隐藏徽标）· 导测 · 清单 · 身份 · ✕。
- **徽标**：每个 `data-tm` 部件左上角一个青色小标签
  `E.save-button 3 规 · 2 旅`；点开弹层 → 规格条款（→
  `/spec-v4#U02-C09`）、规格锚（→ `/v3-4-spec#…`）、旅程步骤（→
  手册；「在导测里打开」）。灰色虚线「未映射」=
  登记了但没有条款可对（就是规格的缺口）。
- **清单**：本页所有部件 + 本页所有规格条款，✓ 已对应 / ○ 无部件对应。
- **导测**：优先列出 A3/A4/A6/B3/A5 的 10 条当前交接旅程（49 步、68
  个条款版本），再保留历史两轮。固定版本步骤逐项显示 URL、
  精确操作、预期、条款版本和截图文件名。`appBaseUrl`
  自动取当前被测站点；稳定业务 ID
  已按旅程和登录角色预填，互斥账号状态不会再共用一个
  `ownerAgentId`。每个起始/辅助网址都单独解析；产品内网址在当前标签切换且导测保持打开，
  外部网址才另开标签。导测会显示当前产品昵称和登录邮箱，并按昵称给出角色切换提示；昵称不是账号
  校验，测试者须按 `axiia-cup-product`
  群账号包核对页面显示的登录邮箱。测试者的本机改写按旅程
  隔离。账号别名可以公开显示；密码、cookie 和 token 不进入 Test Mode。标为
  `refresh-required` 的可变状态不预填旧 ID，必须按本轮 fixture manifest
  刷新，只保存在当前浏览器会话。`a3FreshAgentId`、`a3FirstMatchId` 和
  `a5HotseatActiveMatchId` 只能在本轮生成后粘贴，或从对应
  `/agents/:id[/build]`、`/matches/:id`
  页面捕获，并且只保存在当前浏览器会话。状态徽章区分“ID
  已预填”“开测前刷新状态”和 “已知实现缺口”；U10-C14 从场景页取证，绝不拼造 NPC
  ID。截图区列出的是包含 `.png` 的准确必交文件名，并深链到
  `/spec-v4-reviewed-human-test#<HV-step-id>` 完成图片提交；Test Mode
  本身的结果按钮不上传图片。 点「看到了 ✓ / 不对 ✗ / 跳过
  →」后，每条条款各写一条 `ss:<条款>` 记录；当前固定版本记录额外带
  `clauseVersion`，步骤记录同时带完整
  `versionPins`。本机进度也按现行版本过滤，旧版本或缺失版本的确认不会算作已完成。备注写成留言，进度存在本机。

## 加新部件 / 改映射

1. 组件上
   `{...tm('E.save-button')}`（`import { tm } from '../testmode/mark'`）。id =
   `<页面代号>.<slug>`，代号见 `types.ts`。
2. 在 `registry/<页面组>.ts` 登记：`label` 人话名、`clauses`
   直接体现的条款、`anchors`、`journeys` 发生在它上面的旅程步骤、`note` /
   `when`。旅程步骤的落点在 `STEPS_*`（route + marker）。
3. `deno task tm:check`：标记 ↔ 登记一一对应、条款 / 步骤 id 存在。CI 的
   `test:unit` 也跑它。

## 看板凭据

看板身份独立于产品登录：名字必须填写实际执行人的飞书显示名，不能使用 fixture
账号昵称； “看板口令”不是产品账号密码，也不会自动读取或保存产品账号密码。

写看板的端点与匿名 key 是构建期环境变量，不进仓库：`VITE_TM_BOARD_URL` 与
`VITE_TM_BOARD_ANON_KEY`（本地写进 `v2/web/.env`，镜像由 CI 用同名 secret 经
`TM_BOARD_URL` / `TM_BOARD_ANON_KEY` build-arg 传入）。两个缺一，导测就是只读：
点确认只报「看板未配置」，其余功能照常。

## 数据

`data/spec-index.json`（条款索引）、`data/journeys.json`（历史两轮手册的 88
步）由 uiux 仓 `spec-v4/` 生成（脚本见 axiia-cup-uiux 的 spec-v4/tools，或本机
scratchpad 的
gen-tm-data.mjs）；规格或手册改了要重生成。当前固定版本交接单独维护在
`data/b3-a5-journeys.ts`，其 5 条旅程 / 21 步 / 28 条 clause-version pin 必须与
uiux 仓的 `spec-v4/sources/verification-journeys.json`
同步。`data/e2e-signals.json` 只作映射线索，不进 bundle。`U05-C11` 与 `U05-C12`
当前默认取版规则互相冲突，
即使各自规范句已确认，也必须留在交接集外直至冲突解决。

Vivian A3/A4/A6 的 5 条旅程、28 步、40 个固定版本来自
`data/vivian-a3-a4-a6.json`，该快照由 `scripts/sync-vivian-testmode.ts` 从 UIUX
的 `spec-v4/sources/verification-vivian-rest.json` 生成，并记录源内容 SHA-256。
`data/reviewed-journeys.ts`
把两组当前旅程合并；单元检查还断言这些旅程确实进入产品 `JOURNEYS` / `STEPS`
和标记登记表。同步时可传入明确源路径；`--check` 只验证，不写文件。

再次执行会消耗初始状态的 A3/A6
旅程前，先领取新的已准备账号包或确认账号已重新准备，
再在该旅程点击「开始新一轮」并重填当前 ID。按钮只清理本机该旅程的运行时 ID
与本机进度，不重置服务端账号、不删除共享看板结果；同一轮普通角色切换不需要重开。
