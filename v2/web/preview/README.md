# 智能体归档预览（2026-09-17）

本预览使用真实页面组件和独立演示 API，不连接线上账户。演示状态在 API
进程中保存，刷新页面后仍保留，重启演示 API 后重置。

实现计划：

1. 保持删除空智能体；已有保存版本改为归档盒图标和归档动作。
2. 设置页增加归档列表入口，支持加载、错误、空态、恢复反馈。
3. 服务端持久化隐藏状态；保留全部版本、草稿、战绩、参赛与对局关联。
4. 验证往返流程、失败处理、权限、持久化、数据库增量迁移、手机布局。

启动（从 `v2/web`，两个终端）：

```sh
deno run -A preview/agent-archive-api.ts
AXIIA_PROXY_TARGET=http://127.0.0.1:8197 deno task dev --host 0.0.0.0 --port 5217 --strictPort
```

打开 `http://localhost:5217/agents/101`，从右上角更多菜单归档，再进入 设置 →
已归档的智能体 → 恢复。`/agents/103` 是可删除的空智能体；
`/settings/archived-agents` 初始包含一份已归档示例。

浏览器验证：`node preview/check-archive.mjs`。脚本检查桌面/手机、归档、刷新、
设置入口、恢复、旧版本保留和空智能体菜单，将截图写入忽略的
`preview/screenshots/`。

产品后端改动见
[axiia-cup-v2 PR #65](https://github.com/paideia-ai/axiia-cup-v2/pull/65)。已有数据库通过原有
`axiia migrate --apply` 增加默认值为 false 的 `agents.is_archived`
列；前端上线前 须先提供归档接口。真实后端与此演示 API 相互独立。

验证结果：前端格式、lint、应用/测试类型检查、257 项单测、8 项相关页面交互、
生产构建及桌面/手机浏览器流程通过。后端 AxiiaStoreTests（96）、AxiiaServerTests
（160）和 AxiiaContractTests（6）全部通过，含迁移、持久化、历史数据和权限检查。
后端本机验证临时移除了锁文件中不可访问、已无直接声明的 `tca26` 残留 pin，并使用
`--lockfile_mode=off`；验证后已逐字恢复原 `Package.resolved`，没有提交依赖变更。
