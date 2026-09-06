# 测试模式（test mode）

给产品里的每个 UI/UX 部件一个稳定的标记，开启后能看到它对应 spec v4
的哪些条款、两轮人测手册的哪些步骤，并能按手册逐步做人测、把结果直接记进看板。

- **开启**：任意页面 URL 加 `?tm=1`（会记住；`?tm=0` 或右下角药丸的 ✕
  关闭）。关着时零成本：只有一次 localStorage 读取，代码与数据都在独立的 lazy
  chunk 里。
- **药丸**（右下角）：标记（显示/隐藏徽标）· 导测 · 清单 · 身份 · ✕。
- **徽标**：每个 `data-tm` 部件左上角一个青色小标签
  `E.save-button 3 规 · 2 旅`；点开弹层 → 规格条款（→
  `/spec-v4#U02-C09`）、规格锚（→ `/v3-4-spec#…`）、旅程步骤（→
  手册；「在导测里打开」）。灰色虚线「未映射」=
  登记了但没有条款可对（就是规格的缺口）。
- **清单**：本页所有部件 + 本页所有规格条款，✓ 已对应 / ○ 无部件对应。
- **导测**：选一条旅程，每步「做什么 / 应该看到 / 规格 /
  已知问题」，聚光对应部件，点「看到了 ✓ / 不对 ✗ / 跳过
  →」；第一次点会问名字和口令（与看板同一套）。每次确认按这一步的条款各写一条
  `ss:<条款>` 记录（带 build SHA 与步骤号），备注写成留言，进度存在本机。

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

写看板的端点与匿名 key 是构建期环境变量，不进仓库：`VITE_TM_BOARD_URL` 与
`VITE_TM_BOARD_ANON_KEY`（本地写进 `v2/web/.env`，镜像由 CI 用同名 secret 经
`TM_BOARD_URL` / `TM_BOARD_ANON_KEY` build-arg 传入）。两个缺一，导测就是只读：
点确认只报「看板未配置」，其余功能照常。

## 数据

`data/spec-index.json`（条款索引）、`data/journeys.json`（两轮手册的 88 步）由
uiux 仓 `spec-v4/` 生成（脚本见 axiia-cup-uiux 的 spec-v4/tools，或本机
scratchpad 的 gen-tm-data.mjs）；规格或手册改了要重生成。`data/e2e-signals.json`
只作映射线索，不进 bundle。
