# 历史 bar：方案 10 正式接入

## 已确认的界面

- 编号与场景在左，双方像素头像及身份在中，单行状态在最右。
- 人物色带铺满 bar 高度；普通桌面行约 62px。手机保留右侧状态，双方上下排列。
- 场景和「你」标记统一中性色；「你」贴在对应头像上。
- 人物区域胜绿负红并保留「胜／负」文字；没有勾叉。
- 个人结果为「你（角色名） 胜／负」；旁观为中性色「角色名 胜」。
- 双方都是自己时显示「左右互搏」，包括明确平局；不增加第二行。
- 排队、进行中、未计分保留黄色时钟。
- 已结束且已计分时，只有 `a` / `b` / `draw`
  是有效结果；其余值及缺失值显示红色「对局异常」，不标人物胜负。
- 小字红色从平台红提亮少量，保证深色背景上的文字对比度；不修改全局颜色。

## 前后端核对

基线：前端 `9b3b99e`；后端 `axiia-cup-v2` 的 `174eaf5`。

后端 `AxiiaDomain/Sources/Types.swift` 的 `MatchWinner` 明确为 a/b/draw。
`AxiiaServer/Sources/Mapping.swift` 的 `matchSummary` 透传状态和结果，
`participantDTO` 根据请求者计算 `isMine` 并提供 agent/version/preset/role 引用。
`MatchRoutes.swift` 的列表查询读取钉住的场景版本、实际 speakers 和该用户的
viewed 状态。 这些字段足够实施本次设计；后端无需修改，也没有迁移或部署依赖。

列表没有详情级 error 字段。遵循用户决定，已结束但未计分仍显示「未计分」， 不能凭
winner 缺失将这种记录改成异常。

## 实施分工

1. `lib/history-result.ts` 集中处理优先级、当前用户视角和异常值。
2. `components/history/history-bar.tsx` 读取角色快照，复用
   roleIdentity/rolePortrait。 未知角色用中性头像，缺失身份不冒充
   NPC，不额外逐行请求 API。
3. `pages/matches.tsx` 仅替换行组件，保留筛选、分页、约战分组和查询缓存。
   原生战报链接覆盖空白处；自己的智能体、对手身份及 NPC 身份链接为独立锚点。
4. 测试覆盖结果矩阵、旧数据、角色快照、未读回执、链接、筛选、响应式和对比度。

## 最终预览

在 `v2/web` 运行：

- `deno task preview:history`：<http://localhost:5187/matches?mine=0>。 混合样例
  API，免登录；含五场景、旧场景、左右互搏、旁观、NPC、异常、未读和历史双场。
  样例战报只有用于导航检查的概要，不包含真实对话；样例数据不代表线上记录。
- `deno task preview:history:live`：<http://localhost:5189/matches>。
  同一正式构建，通过本地代理连接平台 API，使用者自行登录真实账号。
  这是正式应用的完整功能，操作使用真实账号数据。

两个入口均逐字节提供正常 `deno task build` 产物，没有 HTML 注入、样式覆盖、
预览专用 React 分支或 MSW。数据来源不同，但行组件、应用壳、交互及资源完全相同。
实际线上内容取决于登录用户和当时的接口响应；不能保证与固定样例的记录、顺序相同。
