# LLM Gateway Operations

This document describes the US LLM gateway (`OpenAI` / `Anthropic`) and the SSH
tunnel that reaches it from the China worker. The gateway sources live in this
repository under `deploy/openai-proxy/`; the gateway and tunnel themselves run
on hosts, not from CI.

## 1. Purpose

The gateway exists so that a China-hosted app can reach OpenAI and Anthropic
without storing real upstream provider keys on the China side. The China worker
holds only a shared gateway token; the real keys live on the US host.

**Who uses it today.** The v1 bun API was the gateway's client, and v1 is gone
(cut over 2026-09-02, deleted from this repository 2026-09-06). The Swift
`axiia` server that replaced it takes provider keys directly — `ModelResolver`
reads `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`,
`DASHSCOPE_API_KEY`, `MOONSHOT_API_KEY`, `MINIMAX_API_KEY`, `ZHIPU_API_KEY` and
nothing else. There is no base-URL override in its configuration, so it **cannot
be pointed at this gateway**, and its `beta.env` (documented in the sibling
`axiia-cup-2` repository at `docs/deployment.md`) sets no gateway variables. The
shipped scenarios and the player-selectable roster reach DeepSeek, Moonshot,
Zhipu and MiniMax, all directly reachable from China.

So the gateway and its tunnel are currently **host infrastructure without a
product client in this repository**. Before changing or retiring either, verify
on the host what still calls port `33100` — do not assume it is unused, and do
not assume the server uses it.

## 2. Topology

```text
client
  -> http://host-gateway-ip:33100
  -> SSH tunnel on cup-worker
  -> US host 127.0.0.1:3100
  -> llm-gateway
  -> OpenAI / Anthropic
```

Machines:

- China worker: `anna@cup-worker.isofucius.cn`
- US host: `anna@reliablesite.tuna-miaplacidus.ts.net`

Important detail:

- This path does **not** depend on a public gateway domain
- The tunnel should not bind to `0.0.0.0` (it currently does; see §4.2)

## 3. Why SSH Tunnel Instead Of Public Domain

The public-domain version would look like this:

```text
client
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

## 4. Runtime Components

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

The China worker uses a long-running `ssh -L` process under the `anna` user.
It is **not** managed by a user-level systemd service.

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

- the tunnel binds `0.0.0.0:33100`, which is wider than intended
- the checked-in service example is a cleaner reference, but does **not** match
  the live wiring exactly

Reference files in this repo:

- [deploy/start-us-gateway-tunnel.sh](../../deploy/start-us-gateway-tunnel.sh)
- [deploy/axiia-us-gateway-tunnel.service.example](../../deploy/axiia-us-gateway-tunnel.service.example)

## 5. Environment

### 5.1 US host proxy env

File on US host:

- `/home/anna/openai-proxy/.env`

```env
HOST_PORT=3100
PORT=3100

# Shared gateway token used by any China-side client, for both providers.
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
- No China-side config should hold these upstream keys
- The proxy is intentionally narrow: it only forwards OpenAI `chat/completions`
  and Anthropic `messages`
- Request body limit and timeout are fixed in code to keep the setup simple

### 5.2 Client side

A client reaches the gateway by pointing its OpenAI/Anthropic base URLs at the
tunnel and using `GATEWAY_SHARED_TOKEN` as the API key for both:

```env
OPENAI_BASE_URL=http://<tunnel host>:33100/openai/v1
OPENAI_API_KEY=<same as GATEWAY_SHARED_TOKEN>
ANTHROPIC_BASE_URL=http://<tunnel host>:33100/anthropic
ANTHROPIC_API_KEY=<same as GATEWAY_SHARED_TOKEN>
ANTHROPIC_VERSION=2023-06-01
```

The current Swift server exposes no such base-URL settings, so this shape has no
consumer in the deployed stack today. Server configuration is documented in the
sibling `axiia-cup-2` repository at `docs/deployment.md`.

For local development against OpenAI/Anthropic, call the providers directly. Use
the gateway locally only to reproduce the production path, or when your network
cannot reach the providers.

## 6. Operations

### 6.1 US host

Proxy status:

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

### 6.2 China worker

Tunnel status:

```bash
ssh anna@cup-worker.isofucius.cn
ps -ef | grep '33100:127.0.0.1:3100' | grep -v grep
ss -ltnp | grep 33100
curl http://127.0.0.1:33100/health
```

Manual restart:

```bash
ssh anna@cup-worker.isofucius.cn
ssh -NT -g -L 0.0.0.0:33100:127.0.0.1:3100 anna@104.238.220.76
```

App deploys on this host are unrelated to the tunnel; see
`docs/tech/CI_CD_OPERATIONS.md` for what this repository deploys, and the
sibling `axiia-cup-2` `docs/deployment.md` for the server.

## 7. Troubleshooting

### 7.1 Tunnel is up but requests fail

Check the host side of the tunnel:

```bash
BIND_IP=$(docker network inspect bridge --format '{{(index .IPAM.Config 0).Gateway}}')
curl "http://${BIND_IP}:33100/health"
```

If that answers and a containerised client still fails, the container cannot
reach the bridge gateway address — check that client's network configuration on
the host.

### 7.2 Proxy rejects a request path

The proxy forwards a narrow allowlist:

- OpenAI: `/v1/chat/completions`
- Anthropic: `/v1/messages`

If a new model integration needs a different endpoint, update
[deploy/openai-proxy/server.mjs](../../deploy/openai-proxy/server.mjs)
and redeploy the US proxy.

### 7.3 Proxy returns decompression errors

The proxy strips upstream compression headers when forwarding decoded payloads.
That logic lives in:

- [deploy/openai-proxy/server.mjs](../../deploy/openai-proxy/server.mjs)

### 7.4 Old server confusion

The active China worker is:

- `cup-worker.isofucius.cn`

The old host:

- `120.55.38.143`

should not be used for current production operations.
