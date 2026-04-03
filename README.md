# Axiia Cup

Entrants write strategy prompts to build AI agents that compete in adversarial dialogue matches set in humanities-themed scenarios.

## Workspace

- `apps/web` — React Router v7 SPA + Vite + Tailwind v4 + shadcn/ui
- `apps/api` — Hono + Bun + SQLite (Drizzle)
- `apps/cli` — Commander.js admin CLI
- `packages/shared` — Zod schemas and shared types

## Quick Start

```bash
cp .env.example .env
# Fill in SILICONFLOW_API_KEY and JWT_SECRET in .env
bun install
bun run dev
```

If you run backend-only commands from `apps/api`, first copy `apps/api/.env.example` to `apps/api/.env`.

## Production Deployment

Production deployment assets live in `deploy/`.

- `deploy/docker-compose.prod.yml` runs the `web` and `api` services
- `deploy/Dockerfile.web` builds the Vite SPA and serves it with nginx
- `deploy/Dockerfile.api` builds the Bun API and runs DB migrations on startup
- `deploy/nginx.web.conf` provides SPA fallback and proxies `/api` and `/health`
- `deploy/angie.cup.axiia.ai.conf` is an example host-level reverse proxy for `cup.axiia.ai`

Typical single-server deployment flow:

```bash
cp deploy/production.env.example deploy/production.env
# edit deploy/production.env

docker compose --env-file deploy/production.env -f deploy/docker-compose.prod.yml build
docker compose --env-file deploy/production.env -f deploy/docker-compose.prod.yml up -d
docker compose --env-file deploy/production.env -f deploy/docker-compose.prod.yml exec api bun run ./apps/api/src/db/seed.ts
```

The web container listens on `127.0.0.1:${WEB_HOST_PORT}` and is intended to sit behind a host-level reverse proxy such as Angie or nginx.

## Docs

- [Design Spec](docs/competition/DESIGN_SPEC.md) — product rules and decisions
- [Architecture](docs/tech/ARCHITECTURE.md) — technical stack, data model, and deployment notes
- [Server Deployment Checklist](docs/tech/DEPLOYMENT_SERVER.md) — step-by-step single-server production rollout
- [Design System](docs/tech/DESIGN.md) — visual direction, typography, and color
