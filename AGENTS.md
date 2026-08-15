# Repository guidance

Instructions for coding agents working with code in this repository.

## Authoritative docs

- Product/design decisions: `docs/competition/DESIGN_SPEC.md`
- Current CI/CD and production operations: `docs/tech/CI_CD_OPERATIONS.md`
- Server bootstrap and manual Docker Compose fallback: `docs/tech/DEPLOYMENT_SERVER.md`
- LLM gateway topology and provider routing: `docs/tech/LLM_GATEWAY_OPERATIONS.md`

## Notes for agents

- Treat `docs/tech/CI_CD_OPERATIONS.md` as the canonical reference for the **current** production deploy path.
- Treat `docs/tech/DEPLOYMENT_SERVER.md` as bootstrap/manual-fallback guidance, not the standard release path.
- Historical product/design docs (`PRD_v1`, `SPEC_v2`, etc.) are reference only.
- Historical docs may describe older infrastructure choices; prefer the current ops doc when they conflict.

## Commands

```bash
# Development
bun install                    # install dependencies
bun run dev                    # start web + api in parallel
bun run dev:api                # API only (localhost:3001)
bun run dev:web                # Web only (localhost:5173)
bun run dev:cli                # CLI watch mode

# Database
bun run --filter @axiia/api db:migrate    # run Drizzle migrations
bun run --filter @axiia/api db:seed:demo  # seed demo data

# Quality
bun run fmt:check              # oxfmt format check (apps + packages only)
bun run fmt                    # oxfmt auto-fix
bun run lint                   # oxlint via turbo
bun run typecheck              # tsc --noEmit via turbo
bun run build                  # build all packages

# Tests (Bun native test runner, only apps/api has tests)
cd apps/api && bun test                    # all tests
cd apps/api && bun test src/engine/swiss.test.ts   # single file
```

## Architecture

Monorepo (Turborepo + Bun workspaces) with four packages:

- **apps/api** — Hono + Bun backend. SQLite via Drizzle ORM. DB-backed async worker for match execution.
- **apps/web** — React Router v7 SPA + Vite + Tailwind v4 + shadcn/ui.
- **apps/cli** — Commander.js admin CLI for tournament operations (`axiia start`, `axiia next-round`, `axiia leaderboard`, etc.).
- **packages/shared** — Zod schemas + constants shared across all packages. Import as `@axiia/shared`.

### API structure

Routes are mounted in `apps/api/src/index.ts` via `app.route()`:
- `src/routes/` — auth, scenarios, submissions, playground, tournaments, stats, admin-settings, admin-users
- `src/middleware/` — `requireAuth` (checks JWT + disabled status) and `requireAdmin` Hono middleware
- `src/engine/core.ts` — Match execution: dialogue phase → judge QA rounds → scoring
- `src/engine/swiss.ts` — Swiss pairing algorithm (sort by wins, avoid repeat pairings)
- `src/engine/llm.ts` — SiliconFlow API (OpenAI-compatible) for Chinese LLM models
- `src/engine/worker.ts` — Polling worker (5s interval, configurable concurrency, lease tokens)
- `src/lib/settings.ts` — App settings helpers (registration code stored in DB, falls back to env var)
- `src/db/schema.ts` — Drizzle schema (users, scenarios, submissions, tournaments, rounds, matches, playgroundRuns, appSettings)
- `src/db/migrations/` — SQL migrations run by Drizzle migrator

### Web structure

- `src/app-router.tsx` — All route definitions (public: `/login`, `/register`; protected: `/dashboard`, `/scenarios/:id`, `/playground/:submissionId`, `/leaderboard`, `/matches/:id`, `/settings`, `/admin`)
- `src/context/auth.tsx` — Auth context (JWT token, user state)
- `src/pages/` — Page components
- `src/components/layout/app-shell.tsx` — Authenticated layout shell

### Key patterns

- **Shared types first**: API contracts defined as Zod schemas in `packages/shared`, used for both validation and TypeScript inference.
- **DB as queue**: Matches processed by polling `status` column, no external queue. Worker uses lease tokens to prevent concurrent execution.
- **JSON in SQLite**: Transcripts (dialogue, judge QA) stored as stringified JSON text columns.
- **Match flow**: Each player pair plays 2 matches (swapped roles). Each match: N dialogue turns → judge asks questions to both agents → judge scores → winner determined.

## Production host preflight

Before using or proposing SSH access to `cup-worker`, read Minsheng's private
orientation in full:

- Private repo: `paideia-ai/axiia-cup-uiux`
- File: `private-docs/cup-worker-orientation.md`
- GitHub: <https://github.com/paideia-ai/axiia-cup-uiux/blob/main/private-docs/cup-worker-orientation.md>
- Sibling checkout, when available: `../axiia-cup-uiux/private-docs/cup-worker-orientation.md`

Reading it is mandatory before any task that would connect to the host or inspect,
change, deploy, restart, back up, restore, or troubleshoot its production services,
containers, nginx configuration, files under `/srv`, databases, on-host logs,
secrets, or deploy webhook. It is also mandatory when a task depends on correctly
distinguishing the current product services from the legacy stacks on that host.

It is not required for local development, local tests, code-only changes, docs,
PR review, or CI/log investigation that does not access `cup-worker`. Reading the
orientation is a safety preflight, not authorization to operate production. Treat
its operational state as time-sensitive, verify current state before acting, keep
all host details private, and never copy host secrets into code, commits, logs,
issues, PRs, or chat.

## Deployment

- **Current production release path**: GitHub Actions -> Aliyun ACR -> server-local deploy webhook (`release/*` tags trigger production deploys)
- **Manual fallback**: `./deploy/deploy.sh /srv/axiia-cup/shared/config/production.env` on the production host
- **Canonical ops doc**: `docs/tech/CI_CD_OPERATIONS.md`
- Database file at `$AXIIA_DB_PATH` or default `apps/api/axiia.db`

## Environment Variables

- `AXIIA_DB_PATH` — SQLite database path (API)
- `SILICONFLOW_API_KEY` — LLM API key (API)
- `DEEPSEEK_API_KEY` — DeepSeek official API key, used for `deepseek` provider models via the Anthropic-compatible endpoint (API)
- `MOONSHOT_API_KEY` / `ZHIPU_API_KEY` / `MINIMAX_API_KEY` / `DASHSCOPE_API_KEY` — lab-direct OpenAI-compatible provider keys (Kimi / GLM / MiniMax / Qwen); each has an optional `*_BASE_URL` override (API)
- `JWT_SECRET` — JWT signing secret (API)
- `REGISTRATION_CODE` — Fallback registration code if not set in DB (default `axiia_cup`; DB value takes priority)
- `AXIIA_API_URL` — API base URL for CLI (default `http://localhost:3001`)
- `AXIIA_ADMIN_TOKEN` — Admin bearer token for CLI
- `WORKER_CONCURRENCY` — Worker max concurrent jobs (API, default 8)
