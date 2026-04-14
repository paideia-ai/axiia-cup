# Axiia Cup CI/CD and Production Operations

_Last verified: 2026-04-14._

This document describes the **current** production deployment path for Axiia Cup.
It is the canonical reference for:

- GitHub Actions CI
- image build and push to Aliyun ACR
- tag-triggered production deploys
- rollback procedure
- production host topology
- secret/config storage locations

For first-time server bootstrap and manual Docker Compose operations, also see
[DEPLOYMENT_SERVER.md](DEPLOYMENT_SERVER.md).

## Verification sources

This document was checked against:

- `.github/workflows/ci.yml`
- `.github/workflows/build.yml`
- `.github/workflows/deploy.yml`
- live GitHub branch protection for `master`
- live production server files:
  - `/srv/axiia-cup/deploy-webhook/server.py`
  - `axiia-deploy-webhook.service`
- live production process state for the LLM gateway tunnel

## 1. Current production topology

### 1.1 App host

Primary production host:

- `cup-worker.isofucius.cn`
- public IP: `116.62.32.22`
- SSH: `root` or `anna`

Public domains:

- `axiia-cup.isofucius.cn` — primary
- `axiia-cup-2.isofucius.cn` — preview/canary alias to the same server and app

Historical note:

- `120.55.38.143` is **not** the current cup worker.
- It is the bastion / root-domain host and should not be treated as the Axiia Cup production app host.

### 1.2 Reverse proxy and containers

Current app shape on `cup-worker`:

- nginx listens on port `80`
- nginx proxies app traffic to `127.0.0.1:8200`
- Docker Compose runs two containers:
  - `api`
  - `web`

Persistent data and config paths:

- repo checkout: `/srv/axiia-cup/current`
- app env: `/srv/axiia-cup/shared/config/production.env`
- SQLite data root: `/srv/axiia-cup/shared/data`
- SQLite DB: `/srv/axiia-cup/shared/data/api/axiia.db`

### 1.3 Deploy webhook

Standard production deploys are handled by a server-local webhook service:

- script: `/srv/axiia-cup/deploy-webhook/server.py`
- systemd unit: `axiia-deploy-webhook.service`
- bind address: `127.0.0.1:9900`
- public route: `https://axiia-cup.isofucius.cn/_deploy`
- nginx proxies `/_deploy` to the webhook service

The webhook is **not** implemented in this repository. It is a server-local operational component.

## 2. Branch protection

Current `master` protection was verified live from GitHub.

- required status check: `Check`
- strict status checks: enabled
- required linear history: enabled
- force pushes: disabled
- deletions: disabled
- `enforce_admins`: `false`

Operationally, this means normal changes should land via PR and squash/linear history, but admins are not forced through the same protection gate.

## 3. Standard release and deploy flow

### 3.1 CI on `master` and PRs

Workflow: `.github/workflows/ci.yml`

Triggers:

- push to `master`
- pull request targeting `master`

Checks run:

- `bun install --frozen-lockfile`
- `bun run fmt:check`
- `bun run lint`
- `bun run typecheck`
- `bun run build`
- `cd apps/api && bun test`

### 3.2 Image build and push

Workflow: `.github/workflows/build.yml`

Triggers:

- push to `master`
- manual `workflow_dispatch`

What it does:

- authenticates GitHub Actions to Aliyun via OIDC
- logs into Aliyun ACR
- builds and pushes two images tagged by commit SHA

Registry details:

- registry: `second-acr-registry.cn-hangzhou.cr.aliyuncs.com`
- instance ID: `cri-qvdxmkdj3dh8s2oe`
- namespace: `apps`
- repos:
  - `axiia-cup-api`
  - `axiia-cup-web`

Image tags:

- `second-acr-registry.cn-hangzhou.cr.aliyuncs.com/apps/axiia-cup-api:<commit-sha>`
- `second-acr-registry.cn-hangzhou.cr.aliyuncs.com/apps/axiia-cup-web:<commit-sha>`

### 3.3 Production deploy

Workflow: `.github/workflows/deploy.yml`

Trigger:

- push of a tag matching `release/*`

Canonical release procedure:

```bash
git tag release/2026-04-14.1
git push origin release/2026-04-14.1
```

Deploy sequence:

1. `master` already contains the commit.
2. Build workflow has pushed images for that commit SHA to ACR.
3. Deploy workflow resolves the commit SHA for the pushed release tag.
4. Deploy workflow signs a short-lived JWT using `DEPLOY_WEBHOOK_SECRET`.
5. Deploy workflow POSTs to `https://axiia-cup.isofucius.cn/_deploy`.
6. The webhook server:
   - verifies the JWT with `WEBHOOK_SECRET`
   - logs into ACR with the local Aliyun CLI
   - pulls the `api` and `web` images for that SHA
   - runs Docker Compose with `deploy/docker-compose.acr.yml`

### 3.4 What the webhook actually runs

The live webhook server currently:

- reads app env from `/srv/axiia-cup/shared/config/production.env`
- reads webhook secret from `/srv/axiia-cup/shared/config/deploy-webhook.env`
- sets:
  - `API_IMAGE=<acr-api-image>:<sha>`
  - `WEB_IMAGE=<acr-web-image>:<sha>`
- runs:

```bash
docker compose -f /srv/axiia-cup/current/deploy/docker-compose.acr.yml \
  --env-file /srv/axiia-cup/shared/config/production.env \
  up -d --remove-orphans
```

## 4. Manual fallback deploy path

The shell scripts in `deploy/` still matter, but they are now **manual fallback / bootstrap paths**, not the normal production release mechanism.

Useful manual commands on the production host:

```bash
cd /srv/axiia-cup/current
./deploy/deploy.sh /srv/axiia-cup/shared/config/production.env
```

Fast restart after env-only changes:

```bash
cd /srv/axiia-cup/current
./deploy/deploy.sh --skip-build /srv/axiia-cup/shared/config/production.env
```

First-time bootstrap on a fresh host:

```bash
cd /srv/axiia-cup/current
./deploy/bootstrap-server.sh /srv/axiia-cup/shared/config/production.env
```

Important distinction:

- `deploy/docker-compose.prod.yml` uses local builds
- `deploy/docker-compose.acr.yml` uses prebuilt ACR images
- the webhook deploy path uses `docker-compose.acr.yml`

## 5. Rollback

Rollback is done by deploying an older commit SHA via a new release tag.

Option A: tag an older commit directly

```bash
git tag release/2026-04-14.2 <older-commit-sha>
git push origin release/2026-04-14.2
```

Option B: re-tag a known-good prior release

```bash
git tag release/2026-04-14.2 release/2026-04-13.1^{}
git push origin release/2026-04-14.2
```

Constraint:

- the target commit's images must already exist in ACR
- in practice this means the commit must previously have been built from `master`

## 6. Secret and config inventory

This section records **where** secrets live, not their values.

| Item | Location | Notes |
| --- | --- | --- |
| `JWT_SECRET` | `cup-worker:/srv/axiia-cup/shared/config/production.env` | app auth signing/verification |
| `DEPLOY_WEBHOOK_SECRET` | GitHub Actions secret | used by deploy workflow to sign JWT |
| `WEBHOOK_SECRET` | `cup-worker:/srv/axiia-cup/shared/config/deploy-webhook.env` | must match GitHub `DEPLOY_WEBHOOK_SECRET` |
| `SILICONFLOW_API_KEY` | `cup-worker:/srv/axiia-cup/shared/config/production.env` | player/submission LLM traffic |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` on China worker | `cup-worker:/srv/axiia-cup/shared/config/production.env` | gateway tokens, not real provider keys |
| real OpenAI / Anthropic keys | US host `104.238.220.76`, in the llm-gateway deployment env | never store on the China worker |
| `GATEWAY_SHARED_TOKEN` | US host gateway deployment env (see `docs/tech/LLM_GATEWAY_OPERATIONS.md`) | value reused as China worker `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` |
| Aliyun OIDC trust | Aliyun RAM role `githubactions-axiiacup` trusting `acs:ram::1805039414054707:oidc-provider/GitHub` | keyless GitHub Actions auth to ACR |
| Aliyun CLI auth on server | `cup-worker:~/.aliyun/config.json` | lets webhook fetch temporary ACR auth |

## 7. LLM gateway tunnel: current live state

Current live production uses a long-running `ssh -L` process under `anna`, not a systemd-managed tunnel service.

Verified live command shape:

```bash
/usr/bin/ssh -NT -g \
  -i /home/anna/.ssh/axiia_us_gateway \
  -L 0.0.0.0:33100:127.0.0.1:3100 \
  anna@104.238.220.76
```

Operational consequences:

- if this process dies, evaluation-model traffic fails
- `33100` is currently bound on `0.0.0.0`, not only on the Docker bridge IP
- `deploy/start-us-gateway-tunnel.sh` and `deploy/axiia-us-gateway-tunnel.service.example` are useful references, but they do **not** describe the current live production mechanism exactly

Quick checks:

```bash
ps -ef | grep '33100:127.0.0.1:3100' | grep -v grep
ss -ltnp | grep 33100
curl http://127.0.0.1:33100/health
```

Current manual restart pattern:

```bash
ssh -NT -g -L 0.0.0.0:33100:127.0.0.1:3100 anna@104.238.220.76
```

## 8. Troubleshooting

### 8.1 Deploy webhook failed

Check webhook logs:

```bash
journalctl -u axiia-deploy-webhook -n 50 --no-pager
```

Check service state:

```bash
systemctl status axiia-deploy-webhook.service --no-pager
```

### 8.2 ACR auth failed on server

```bash
aliyun cr GetAuthorizationToken --InstanceId cri-qvdxmkdj3dh8s2oe
```

### 8.3 Webhook secret mismatch

Compare the configured value source locations:

- GitHub repo secret: `DEPLOY_WEBHOOK_SECRET`
- server file: `/srv/axiia-cup/shared/config/deploy-webhook.env`

### 8.4 Compose state on the app host

```bash
docker compose \
  --env-file /srv/axiia-cup/shared/config/production.env \
  -f /srv/axiia-cup/current/deploy/docker-compose.acr.yml \
  ps
```

```bash
docker compose \
  --env-file /srv/axiia-cup/shared/config/production.env \
  -f /srv/axiia-cup/current/deploy/docker-compose.acr.yml \
  logs --tail=100 api web
```

## 9. Related docs

- [DEPLOYMENT_SERVER.md](DEPLOYMENT_SERVER.md) — server bootstrap and manual Docker Compose fallback
- [LLM_GATEWAY_OPERATIONS.md](LLM_GATEWAY_OPERATIONS.md) — gateway topology and provider-routing notes
- [CLI.md](CLI.md) — admin CLI usage
