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

For local development, use the repo root `.env` as the single source of truth and run commands from the repo root:

```bash
bun run dev
bun run dev:api
bun run db:migrate
bun run db:seed:demo
```

Avoid maintaining a separate `apps/api/.env`, or the API and workspace commands can drift.

## CLI

The admin CLI lives in `apps/cli`.

```bash
bun run ./apps/cli/src/index.ts --help
```

For CLI authentication, remote API usage, user and playground operations, and non-interactive scenario editing, see [CLI Guide](docs/tech/CLI.md).

## Production Deployment

Production deployment assets live in `deploy/`.

- `deploy/docker-compose.prod.yml` runs the `web` and `api` services
- `deploy/Dockerfile.web` builds the Vite SPA and serves it with nginx
- `deploy/Dockerfile.api` builds the Bun API and runs DB migrations on startup
- `deploy/nginx.web.conf` provides SPA fallback and proxies `/api` and `/health`
- `deploy/angie.cup.axiia.ai.conf` is an example host-level reverse proxy for `cup.axiia.ai`
- `deploy/deploy-master.sh` runs on your local machine and pushes a committed Git snapshot to a remote server over `ssh + rsync`
- `deploy/bootstrap-server.sh` bootstraps a fresh server after prerequisites are in place
- `deploy/deploy.sh` handles day-to-day redeploys
- `deploy/smoke-check.sh` verifies health, SPA fallback, seeded data, and admin login

Typical single-server deployment flow:

```bash
cp deploy/production.env.example deploy/production.env
# edit deploy/production.env

docker compose --env-file deploy/production.env -f deploy/docker-compose.prod.yml build
docker compose --env-file deploy/production.env -f deploy/docker-compose.prod.yml up -d
docker compose --env-file deploy/production.env -f deploy/docker-compose.prod.yml exec api bun run ./apps/api/src/db/seed.ts
```

`seed.ts` also creates the initial admin account from `AXIIA_ADMIN_EMAIL`,
`AXIIA_ADMIN_PASSWORD`, and `AXIIA_ADMIN_NAME`.

Scripted flow on a server:

```bash
./deploy/bootstrap-server.sh /srv/axiia-cup/shared/config/production.env
./deploy/deploy.sh /srv/axiia-cup/shared/config/production.env
BASE_URL=https://cup.axiia.ai ./deploy/smoke-check.sh /srv/axiia-cup/shared/config/production.env
```

Scripted flow from your local machine:

```bash
./deploy/deploy-master.sh
./deploy/deploy-master.sh --host ubuntu@cup-server --bootstrap --local-env ./deploy/production.env
./deploy/deploy-master.sh --host ubuntu@cup-server --local-env ./deploy/production.env
./deploy/deploy-master.sh --host ubuntu@cup-server --ref origin/master
./deploy/deploy-master.sh --host ubuntu@cup-server --base-url https://cup.axiia.ai
```

In this repository, `./deploy/deploy-master.sh` with no arguments deploys
`origin/master` to the default production host and then runs the public smoke
check. Use `--ref HEAD` if you intentionally want to deploy your current local
commit instead.

The web container listens on `127.0.0.1:${WEB_HOST_PORT}` and is intended to sit behind a host-level reverse proxy such as Angie or nginx.

For production, point `AXIIA_DATA_DIR` at a persistent host path outside the
repo checkout. Leave `LANGFUSE_*` blank unless you actually want telemetry.

## Docs

- [Design Spec](docs/competition/DESIGN_SPEC.md) — product rules and decisions
- [Architecture](docs/tech/ARCHITECTURE.md) — technical stack, data model, and deployment notes
- [CLI Guide](docs/tech/CLI.md) — CLI usage, remote API setup, and scenario editing workflow
- [Server Deployment Checklist](docs/tech/DEPLOYMENT_SERVER.md) — step-by-step single-server production rollout
- [Design System](docs/tech/DESIGN.md) — visual direction, typography, and color
