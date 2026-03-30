# Axiia Cup

按 [DESIGN_SPEC](./docs/competition/DESIGN_SPEC.md) 重构中的新前端/后端骨架。

## Workspace

- `apps/web`: React Router v7 SPA + Vite + Tailwind v4
- `apps/api`: Hono + Bun API 骨架
- `apps/cli`: Commander.js 管理 CLI 骨架
- `packages/shared`: Zod schema 与共享类型

## Run

```bash
bun install
bun run dev:web
bun run dev:api
```

`index.html` 和 `app.html` 暂时保留在仓库根目录，作为旧页面结构与视觉参考，不参与新应用构建。
