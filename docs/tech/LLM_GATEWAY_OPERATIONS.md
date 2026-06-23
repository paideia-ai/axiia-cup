# LLM Gateway Operations

This document describes the production topology for evaluation models
(`OpenAI` / `Anthropic`) and the safer SSH tunnel setup used by the China
worker.

## 1. Purpose

The app has two different LLM traffic classes:

- Submission / player dialogue traffic: still goes to `SiliconFlow`
- Evaluation traffic: judge + scorer can go to `OpenAI` or `Anthropic`

The production app runs on the China worker. Evaluation providers are reached
through a US-hosted proxy so the China worker does not store real upstream
provider keys.

## 2. Current Production Topology

Current live topology:

```text
China API container
  -> http://host.docker.internal:33100
  -> SSH tunnel bound to Docker bridge IP on cup-worker
  -> US host 127.0.0.1:3100
  -> llm-gateway
  -> OpenAI / Anthropic
```

Machines:

- China worker: `anna@cup-worker.isofucius.cn`
- US host: `anna@reliablesite.tuna-miaplacidus.ts.net`

Important detail:

- Production does **not** currently depend on a public gateway domain
- Production keeps the proxy reachable from the China container, but the tunnel
  should not bind to `0.0.0.0`

## 3. Why SSH Tunnel Instead Of Public Domain

The public-domain version would look like this:

```text
China API container
  -> https://gateway.example.com/...
  -> US host gateway
  -> OpenAI / Anthropic
```

That is simpler in theory, but it depends on:

- DNS resolving to the correct host
- the correct public IP
- TLS / proxy routing staying aligned
- the China worker being able to reach that public route reliably

The SSH tunnel version avoids those external dependencies.

Operational tradeoff:

- Public domain: simpler mental model, more DNS / routing risk
- SSH tunnel: one extra moving part, but much more controllable

## 4. Production Runtime Components

### 4.1 US host

The US host runs the proxy container from:

- [deploy/openai-proxy/server.mjs](../../deploy/openai-proxy/server.mjs)
- [deploy/openai-proxy/docker-compose.yml](../../deploy/openai-proxy/docker-compose.yml)

The container listens on:

- `127.0.0.1:3100`

It exposes:

- `/health`
- `/openai/v1/chat/completions`
- `/anthropic/v1/messages`

It stores the real upstream keys:

- `OPENAI_UPSTREAM_API_KEY`
- `ANTHROPIC_UPSTREAM_API_KEY`

### 4.2 China worker

The China worker currently uses a long-running `ssh -L` process under the `anna` user.
It is **not** currently managed by a user-level systemd service.

Verified live command shape:

```bash
/usr/bin/ssh -NT -g \
  -i /home/anna/.ssh/axiia_us_gateway \
  -o BatchMode=yes \
  -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -o StrictHostKeyChecking=yes \
  -o UserKnownHostsFile=/home/anna/.ssh/known_hosts \
  -L 0.0.0.0:33100:127.0.0.1:3100 \
  anna@104.238.220.76
```

Operational notes:

- the tunnel currently binds `0.0.0.0:33100`
- if this process dies, evaluation-model traffic fails
- the checked-in service example is still useful as reference, but it does **not** match the current live production setup exactly

Reference files in this repo:

- [deploy/start-us-gateway-tunnel.sh](../../deploy/start-us-gateway-tunnel.sh)
- [deploy/axiia-us-gateway-tunnel.service.example](../../deploy/axiia-us-gateway-tunnel.service.example)

### 4.3 API container

The API container does **not** talk to the US host directly.
It talks to the host machine through:

- `http://host.docker.internal:33100`

The compose file therefore includes:

- `extra_hosts: ["host.docker.internal:host-gateway"]`

See:

- [deploy/docker-compose.prod.yml](../../deploy/docker-compose.prod.yml)

## 5. Environment Variable Matrix

### 5.1 US host proxy env

File on US host:

- `/home/anna/openai-proxy/.env`

Recommended env:

```env
HOST_PORT=3100
PORT=3100

# Shared gateway token used by the China worker for both providers.
GATEWAY_SHARED_TOKEN=<random gateway token>

# Real upstream provider keys live only here.
OPENAI_UPSTREAM_API_KEY=<real OpenAI key>
ANTHROPIC_UPSTREAM_API_KEY=<real Anthropic key>
OPENAI_UPSTREAM_BASE_URL=https://api.openai.com
ANTHROPIC_UPSTREAM_BASE_URL=https://api.anthropic.com
ANTHROPIC_VERSION=2023-06-01
```

Rules:

- Real upstream keys live only on the US host
- China worker must not store these upstream keys
- The proxy is intentionally narrow: it only forwards OpenAI `chat/completions`
  and Anthropic `messages`
- Request body limit and timeout are fixed in code to keep the setup simple

### 5.2 China worker production env

File on China worker:

- `/srv/axiia-cup/shared/config/production.env`

Required there for evaluation traffic:

```env
OPENAI_BASE_URL=http://host.docker.internal:33100/openai/v1
OPENAI_API_KEY=<same as GATEWAY_SHARED_TOKEN>
ANTHROPIC_BASE_URL=http://host.docker.internal:33100/anthropic
ANTHROPIC_API_KEY=<same as GATEWAY_SHARED_TOKEN>
ANTHROPIC_VERSION=2023-06-01
```

Also still required:

```env
SILICONFLOW_API_KEY=<real SiliconFlow key>
JWT_SECRET=<real JWT secret>
```

Rules:

- `OPENAI_API_KEY` on China is not a real OpenAI key
- `ANTHROPIC_API_KEY` on China is not a real Anthropic key
- Both should be set to the same shared gateway token

### 5.3 Local development env

File in local repo:

- `.env`

For normal local development you have two choices.

Choice A: direct provider access

```env
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=<real OpenAI key>
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_API_KEY=<real Anthropic key>
ANTHROPIC_VERSION=2023-06-01
```

Choice B: mimic production through a local proxy or tunnel

```env
OPENAI_BASE_URL=http://127.0.0.1:33100/openai/v1
OPENAI_API_KEY=<shared gateway token>
ANTHROPIC_BASE_URL=http://127.0.0.1:33100/anthropic
ANTHROPIC_API_KEY=<same shared gateway token>
ANTHROPIC_VERSION=2023-06-01
```

## 6. Do You Need The Proxy Locally?

Usually: **no**.

If you are running the app locally on your own machine and your machine can
directly access OpenAI / Anthropic, the proxy is unnecessary.

Use the proxy locally only if:

- you want to reproduce production exactly
- your local network also cannot reach OpenAI / Anthropic directly
- you want local code to avoid holding real upstream keys

Default recommendation:

- local dev: call providers directly
- production: use the US proxy

## 7. Do You Need To Run A Local Deploy Script?

Usually: **no**.

For normal local development:

```bash
bun run dev
```

That is enough.

You do **not** need to run:

- `deploy/deploy.sh`
- `deploy/bootstrap-server.sh`

Those are server deployment scripts, not normal local dev scripts.

Only use the deploy scripts if you intentionally want to simulate the production
Docker deployment on a local Linux box.

## 8. Admin Scenario Model Selection

Judge models are configured per scenario in the admin UI. Scorer models are still
stored for legacy/fallback scenarios, but existing built-in scenarios use
programmatic scoring.

The admin scenario edit page now has two separate fields:

- `裁判模型`
- `计分模型` (disabled when the scenario uses programmatic scoring)

See:

- [apps/web/src/pages/admin-scenario-edit.tsx](../../apps/web/src/pages/admin-scenario-edit.tsx)

Runtime usage:

- Judgment reads `scenario.judgeModel`
- Built-in programmatic scenarios compute scores in-process
- Fallback scoring for unsupported scenarios reads `scenario.scorerModel`

See:

- [apps/api/src/engine/core.ts](../../apps/api/src/engine/core.ts)
- [apps/api/src/engine/core.ts](../../apps/api/src/engine/core.ts)

## 9. Deployment Checklist

### 9.1 US host

Proxy status checks:

```bash
ssh anna@reliablesite.tuna-miaplacidus.ts.net
cd /home/anna/openai-proxy
sudo docker compose --env-file .env ps
curl http://127.0.0.1:3100/health
```

Rebuild proxy:

```bash
ssh anna@reliablesite.tuna-miaplacidus.ts.net
cd /home/anna/openai-proxy
sudo docker compose --env-file .env up -d --build
```

### 9.2 China worker

Current live production tunnel management is a long-running `ssh -L` process under `anna`, not a user-level systemd service.

Quick status checks:

```bash
ssh anna@cup-worker.isofucius.cn
ps -ef | grep '33100:127.0.0.1:3100' | grep -v grep
ss -ltnp | grep 33100
curl http://127.0.0.1:33100/health
```

Current manual restart pattern:

```bash
ssh anna@cup-worker.isofucius.cn
ssh -NT -g -L 0.0.0.0:33100:127.0.0.1:3100 anna@104.238.220.76
```

Reference only: the repo also contains `deploy/start-us-gateway-tunnel.sh` and `deploy/axiia-us-gateway-tunnel.service.example`, but those describe a cleaner future/alternate setup rather than the exact live production wiring.

App deploy:

```bash
ssh anna@cup-worker.isofucius.cn
cd /srv/axiia-cup/current
./deploy/deploy.sh /srv/axiia-cup/shared/config/production.env
```

Fast restart after env-only changes:

```bash
ssh anna@cup-worker.isofucius.cn
cd /srv/axiia-cup/current
./deploy/deploy.sh --skip-build /srv/axiia-cup/shared/config/production.env
```

## 10. Troubleshooting

### 10.1 `host.docker.internal` not reachable from API container

Check:

```bash
docker inspect deploy-api-1 --format '{{json .HostConfig.ExtraHosts}}'
```

Expected:

```text
["host.docker.internal:host-gateway"]
```

### 10.2 Tunnel is up but provider requests fail

Check host-side tunnel first:

```bash
BIND_IP=$(docker network inspect bridge --format '{{(index .IPAM.Config 0).Gateway}}')
curl "http://${BIND_IP}:33100/health"
```

Then check from inside the container:

```bash
docker exec deploy-api-1 bun -e "fetch('http://host.docker.internal:33100/health').then(r => console.log(r.status))"
```

### 10.3 Proxy rejects a request path

The proxy now only forwards a narrow allowlist by default:

- OpenAI: `/v1/chat/completions`
- Anthropic: `/v1/messages`

If a new model integration needs a different endpoint, update
[deploy/openai-proxy/server.mjs](../../deploy/openai-proxy/server.mjs)
and redeploy the US proxy.

### 10.4 Proxy returns decompression errors

The proxy strips upstream compression headers when forwarding decoded payloads.
That logic lives in:

- [deploy/openai-proxy/server.mjs](../../deploy/openai-proxy/server.mjs)

### 10.5 Old server confusion

The active China worker is:

- `cup-worker.isofucius.cn`

The old host:

- `120.55.38.143`

should not be used for current production operations.
