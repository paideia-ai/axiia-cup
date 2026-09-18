# 版本对局查询预览

实现：战绩和保存时间放在版本号、编号、模型右侧；窄屏自然换行。 战绩文字（如“2 战
1 胜”）为无下划线链接，进入 `/matches?version=<id>`。 历史页按双方参战版本 ID
筛选，在分组前过滤；场景和所有权筛选继续生效。
版本筛选可单独清除；刷新、打开战报再返回时保留 URL 条件。

查询包含进行中的对局；版本卡上的胜场统计仍由原接口提供，只统计已计分对局。
只处理历史接口本来允许当前用户查看的记录，不扩大访问权限。

预览使用实际页面组件和 MSW 演示数据，不连接线上账户。v1 有一场败局， v2
有一胜一负及一场进行中的对局，v3 没有对局。所有写操作均拒绝。

从 `v2/web` 执行：

```sh
deno run -A npm:vite --config preview/version-history/vite.config.ts --port 5238
deno run -A npm:vite build --config preview/version-history/vite.config.ts
deno task test:storybook src/pages/version-history.stories.tsx src/pages/matches.stories.tsx src/pages/agent-surfaces.stories.tsx
```

部署静态预览时，将 SPA 路由回退到 `index.html`；保留 public 中的
`mockServiceWorker.js`。
