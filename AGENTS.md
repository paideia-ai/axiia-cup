# Repository guidance

Instructions for coding agents working with code in this repository.

## What is here

This repository holds the **v2** lanes of Axiia Cup — the frontend and the
scenario scripts for the Swift `axiia` server. The server itself lives in the
private `axiia-cup-v2` repository; nothing in this tree builds or runs it.

The legacy v1 bun/turbo stack (`apps/api`, `apps/web`, `apps/cli`,
`packages/shared`) was removed on 2026-09-06. Production cut over to the Swift
server on 2026-09-02; the v1 database is backed up on the host at
`/srv/axiia-cup/backups/axiia-v1-prod-20260902.db.gz`. Docs under `docs/` that
describe the bun API, its CLI, or its deploy path are historical.

| Lane | Path | Toolchain | Ships as |
| --- | --- | --- | --- |
| Frontend | `v2/web` | deno 2.9.1 + vite | ACR image `apps/axiia-web2:<sha>` → `axiia-cup-2-web.isofucius.cn` |
| Scenarios | `v2/scenarios` | deno 2.9.1 | admin API upload |
| Tournament ops | `v2/tournament-ops` | deno 2.9.1 | `.github/workflows/tournament-ops.yml` |
| Host ops | `deploy/` | shell / docker | US LLM gateway + tunnel, Ubuntu host bootstrap |

Start with [`v2/README.md`](v2/README.md). It is the authoritative guide for
both v2 lanes.

## Commands

You need deno 2.9.1 and nothing else. There is no root package manager, no
workspace, and no build at the repository root.

```bash
# Frontend
cd v2/web
deno install --frozen
AXIIA_PROXY_TARGET=https://axiia-cup-2.isofucius.cn deno task dev

deno task fmt              # --check; `deno fmt .` fixes
deno task lint
deno task typecheck
deno task typecheck:tests
deno task test:unit        # deterministic Vitest contracts
deno task test:storybook   # stateful stories in Chromium, axe-gated
deno task build

# Scenarios
cd v2/scenarios
deno task validate         # typecheck + meta extraction over every scenario
deno task fmt
deno task lint
```

`deno task test:e2e:real` builds and boots the sibling Swift server; it needs a
Swift 6.3 toolchain and is not part of CI.

## CI

`.github/classify-changes.sh` decides which lane a commit touches and emits
`docs_only`, `v2_web_changed`, `v2_scenarios_changed`. Jobs in `ci.yml` and
`build.yml` gate on those flags rather than on `paths-ignore`, because the
branch ruleset requires the `Check` context and a path-skipped workflow never
reports it. A non-docs change outside `v2/` sets no lane flag and `Check`
passes on it.

See [`docs/tech/CI_CD_OPERATIONS.md`](docs/tech/CI_CD_OPERATIONS.md) for the
full pipeline.

## Authoritative docs

- Current CI/CD and deploy path: `docs/tech/CI_CD_OPERATIONS.md`
- v2 lanes, dev loop, deployment: `v2/README.md`
- Scenario authoring: `v2/scenarios/SKILL.md`
- US LLM gateway and tunnel: `docs/tech/LLM_GATEWAY_OPERATIONS.md`
- Host routing and the deployed server: `docs/deployment.md` in the sibling
  `axiia-cup-2` repository — canonical, not mirrored here
- Product/design decisions: `docs/competition/DESIGN_SPEC.md`

Everything else under `docs/` — `ARCHITECTURE.md`, `CLI.md`,
`DEPLOYMENT_SERVER.md`, `SPEC_v2.md`, the `PRD_v1`/`SPEC_v2` lineage — is
reference only and describes the retired v1 stack. Prefer the current ops doc
when they conflict.

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
