# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Authoritative Design Document

**`docs/competition/DESIGN_SPEC.md`** is the single source of truth for all Axiia Cup design decisions, rules, and specifications (Chinese). Historical docs (PRD_v1, SPEC_v2, etc.) are reference only.

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
- `src/routes/` — auth, scenarios, submissions, playground, tournaments, stats
- `src/middleware/` — `requireAuth` and `requireAdmin` Hono middleware
- `src/engine/core.ts` — Match execution: dialogue phase → judge QA rounds → scoring
- `src/engine/swiss.ts` — Swiss pairing algorithm (sort by wins, avoid repeat pairings)
- `src/engine/llm.ts` — SiliconFlow API (OpenAI-compatible) for Chinese LLM models
- `src/engine/worker.ts` — Polling worker (5s interval, max 4 concurrent matches, lease tokens)
- `src/db/schema.ts` — Drizzle schema (users, scenarios, submissions, tournaments, rounds, matches, playgroundRuns)
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

## Deployment

- **Fly.io**: `fly deploy` (CI via `.github/workflows/fly-deploy.yml`)
- **Static demo**: Vercel (axiia-cup.vercel.app)
- Database file at `$AXIIA_DB_PATH` or default `apps/api/axiia.db`

## Environment Variables

- `AXIIA_DB_PATH` — SQLite database path (API)
- `SILICONFLOW_API_KEY` — LLM API key (API)
- `JWT_SECRET` — JWT signing secret (API)
- `AXIIA_API_URL` — API base URL for CLI (default `http://localhost:3001`)
- `AXIIA_ADMIN_TOKEN` — Admin bearer token for CLI
