# Axiia Cup

选手编写策略提示词，打造 AI 智能体，在人文学科场景中进行对抗性对话比赛。

## Workspace

- `apps/web` — React Router v7 SPA + Vite + Tailwind v4 + shadcn/ui
- `apps/api` — Hono + Bun + SQLite (Drizzle)
- `apps/cli` — Commander.js 管理 CLI
- `packages/shared` — Zod schema 与共享类型

## Quick Start

```bash
bun install
bun run dev          # 同时启动 web + api
```

## Docs

- [设计规范](docs/competition/DESIGN_SPEC.md) — 产品规则与决策（唯一标准文档）
- [技术架构](docs/tech/ARCHITECTURE.md) — 技术栈、数据模型、部署方案
- [设计系统](docs/tech/DESIGN.md) — 视觉风格、字体、配色
