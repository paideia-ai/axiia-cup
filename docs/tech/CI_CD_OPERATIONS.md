# Axiia Cup CI/CD Operations

_Last verified: 2026-09-06 against the workflow files in this repository._

This document describes the **current** CI and deploy path for what this
repository ships. Everything here is derived from `.github/`; host-side state
(nginx, containers, the webhook service) is authoritative on `cup-worker`, not
here — verify it live before acting on it. The host layout the deploy lands on
is documented in the sibling `axiia-cup-2` repository at `docs/deployment.md`;
this repository keeps no snapshot of it.

Production cut over to the Swift `axiia` server on 2026-09-02, and the legacy v1
bun stack was deleted from this repository on 2026-09-06; the final v1 database
is backed up on the host at
`/srv/axiia-cup/backups/axiia-v1-prod-20260902.db.gz`.

## 1. What this repository ships

| Lane | Source | Built by | Delivered by |
| --- | --- | --- | --- |
| v2 web | `v2/web`, `v2/deploy` | `build_v2_web` | `deploy_v2_web` → webhook `target: web2` |
| v2 scenarios | `v2/scenarios` | — | `deploy_v2_scenarios` → admin API push |
| tournament ops | `v2/tournament-ops` | — | `workflow_dispatch` only |

The Swift server binary is **not** built here. It lives in the private
`axiia-cup-v2` repository and is deployed separately.

## 2. Change classification

`.github/classify-changes.sh` runs first in both `ci.yml` and `build.yml` and
emits three GitHub Actions outputs:

- `docs_only` — every changed file is under `docs/` or is a root-level Markdown
  file (`README.md`, `AGENTS.md`, `CLAUDE.md`)
- `v2_scenarios_changed` — something under `v2/scenarios/`
- `v2_web_changed` — something else under `v2/`

A non-docs change outside `v2/` — `scripts/`, the workflows themselves — sets
**no** lane flag. There is nothing left in this repository to
build from such a change, so `Check` passes on it explicitly.

If the classifier sees no changed files at all it sets `v2_web_changed=true` to
stay safe.

Jobs gate on these flags rather than on workflow-level `paths-ignore`: the
branch ruleset requires the `Check` context, and a workflow skipped by a path
filter never reports that context, which would block the PR forever.

## 3. CI — `.github/workflows/ci.yml`

Triggers: push to `main`, pull request targeting `main`.

Jobs:

- `classify`
- `v2 web` — runs when `v2_web_changed`; `deno install --frozen`, then
  `deno task fmt` / `lint` / `typecheck` / `typecheck:tests` / `test:unit`,
  then Chromium install and `test:storybook`, then `build`
- `v2 scenarios` — runs when `v2_scenarios_changed`; `deno task validate`,
  `fmt`, `lint`
- `Check` — `if: always()`, the single required status context

`Check` fails if a lane flag is set and that lane's job did not succeed. It
passes on a docs-only change, and on a change that touches no lane.

Toolchain: deno 2.9.1 everywhere. No bun, no node, no root install step.

## 4. Build and deploy — `.github/workflows/build.yml`

Triggers: push to `main`, manual `workflow_dispatch` (which forces both v2 lanes
on).

### 4.1 `build_v2_web`

Runs when `v2_web_changed`. Authenticates to Aliyun via OIDC (RAM role
`githubactions-axiiacup`, provider `acs:ram::1805039414054707:oidc-provider/GitHub`),
logs into ACR, and builds `v2/deploy/Dockerfile.web` with repository root as the
build context:

- registry: `second-acr-registry.cn-hangzhou.cr.aliyuncs.com`
- instance: `cri-qvdxmkdj3dh8s2oe`
- image: `apps/axiia-web2:<commit-sha>`
- build arg `COMMIT_SHA` is inlined by vite as `VITE_COMMIT_SHA` for the footer
  build stamp

The Dockerfile is two-stage: deno builds the SPA, nginx 1.27-alpine serves
`/app/build/client` with `v2/deploy/nginx.conf`.

Images are tagged by commit sha only. There is no release tag flow any more.

### 4.2 `deploy_v2_web`

Runs on push to `main` when `build_v2_web` succeeded. Signs a short-lived HS256
JWT with `DEPLOY_WEBHOOK_SECRET` carrying `{tag: <sha>, target: "web2", repo}`,
`POST`s it to `https://axiia-cup.isofucius.cn/_deploy`, expects `202` with a
`deploymentId`, then polls `GET /_deploy/status?id=<id>` every 5s for up to 120
attempts until `success` or `failed`.

The webhook pulls `apps/axiia-web2:<sha>` and restarts the web2 container.
Concurrency group `axiia-web2-deploy`, cancel-in-progress.

### 4.3 `deploy_v2_scenarios`

Runs on push to `main` when `v2_scenarios_changed`. No stored token: it requests
a GitHub OIDC assertion for audience `AXIIA_BASE_URL`, exchanges it at
`POST $AXIIA_BASE_URL/v1/auth/federated` for a short-lived access token, and
runs `deno task push` from `v2/scenarios`. The server's federation policy trusts
the exact workflow subject, so only `main` can publish scenarios.

Concurrency group `axiia-scenarios-deploy`, **not** cancel-in-progress.

## 5. Tournament ops — `.github/workflows/tournament-ops.yml`

`workflow_dispatch` only. One operator verb per dispatch (or `auto` for the
whole lifecycle) against the axiia server, again authenticated by OIDC
assertion — `v2/tournament-ops/run.ts` exchanges and re-exchanges the token
itself because a round can outlive the ten-minute token. Concurrency group
`axiia-tournament-ops`, never cancelled. See `v2/tournament-ops/README.md`.

## 6. Branch protection

- required status check: `Check`
- strict status checks: enabled
- required linear history: enabled
- force pushes and deletions: disabled
- `enforce_admins`: `false`

Land changes via PR with squash merge.

## 7. Secret and config inventory

Where secrets live, not their values.

| Item | Location | Notes |
| --- | --- | --- |
| `DEPLOY_WEBHOOK_SECRET` | GitHub Actions secret | signs the `target: web2` deploy JWT |
| `WEBHOOK_SECRET` | `cup-worker:/srv/axiia-cup/shared/config/deploy-webhook.env` | must match the GitHub secret |
| `AXIIA_BASE_URL` | GitHub Actions repository variable | audience and target for both OIDC exchanges |
| Aliyun OIDC trust | RAM role `githubactions-axiiacup` | keyless Actions auth to ACR |
| Aliyun CLI auth on server | `cup-worker:~/.aliyun/config.json` | lets the webhook fetch temporary ACR auth |

Nothing in `v2/web` holds a secret: the SPA is static and every credential lives
server-side.

## 8. Retired: the US LLM gateway

The US LLM gateway proxy and its SSH tunnel (host port `33100`) were removed
from this repository on 2026-09-06, together with the v1 stack that was their
only client. The tunnel may still be running on `cup-worker` and needs manual
retirement; nothing in the Swift server can reach it, since the server resolves
models from provider keys alone and exposes no base-URL override.

## 9. Troubleshooting

Deploy webhook:

```bash
journalctl -u axiia-deploy-webhook -n 50 --no-pager
systemctl status axiia-deploy-webhook.service --no-pager
```

ACR auth on the server:

```bash
aliyun cr GetAuthorizationToken --InstanceId cri-qvdxmkdj3dh8s2oe
```

Webhook secret mismatch — compare the GitHub secret `DEPLOY_WEBHOOK_SECRET`
against `cup-worker:/srv/axiia-cup/shared/config/deploy-webhook.env`.

Scenario push refused — the federated exchange returns no `accessToken` when the
server's federation policy does not name this workflow subject. Check the policy
on the server, not the workflow.

## 10. Related docs

- [`../../v2/README.md`](../../v2/README.md) — the v2 lanes, dev loop, and what
  deploys where
- [DEPLOYMENT_SERVER.md](DEPLOYMENT_SERVER.md) and [CLI.md](CLI.md) —
  **historical**; they describe the retired v1 bun stack
