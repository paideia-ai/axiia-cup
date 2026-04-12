# US LLM Gateway

This service runs on the US host and relays evaluation-model traffic for the
China worker without storing real upstream provider keys on the China side.

It exposes:

- `/health`
- `/openai/v1/chat/completions` -> OpenAI upstream
- `/anthropic/v1/messages` -> Anthropic upstream

The container is intended to listen only on `127.0.0.1:3100` and, if needed,
sit behind Angie or Tailscale-only ingress.

## Security defaults

- The container is published only on `127.0.0.1:${HOST_PORT:-3100}`
- The proxy uses a single `GATEWAY_SHARED_TOKEN`
- The proxy only forwards the two endpoints the app actually uses
- The proxy enforces a fixed request-body limit and upstream timeout
- The container runs as the unprivileged `node` user with a read-only root fs

## Environment

```env
HOST_PORT=3100
PORT=3100

# Shared gateway token used by the China worker for both providers.
GATEWAY_SHARED_TOKEN=replace-with-a-random-gateway-token

# Real upstream provider keys stay on the US host only.
OPENAI_UPSTREAM_API_KEY=replace-with-openai-key
ANTHROPIC_UPSTREAM_API_KEY=replace-with-anthropic-key
OPENAI_UPSTREAM_BASE_URL=https://api.openai.com
ANTHROPIC_UPSTREAM_BASE_URL=https://api.anthropic.com
ANTHROPIC_VERSION=2023-06-01
```

## Start

```bash
cd deploy/openai-proxy
docker compose up -d --build
```

## Angie reverse proxy

Example Angie location blocks:

```nginx
server {
    listen 443 ssl http2;
    server_name llm-gateway.example.com;

    location /health {
        proxy_pass http://127.0.0.1:3100/health;
    }

    location /openai/ {
        proxy_pass http://127.0.0.1:3100/openai/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /anthropic/ {
        proxy_pass http://127.0.0.1:3100/anthropic/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

## China worker env

Point the China worker at this gateway with gateway tokens, not real provider
keys:

```env
OPENAI_BASE_URL=https://llm-gateway.example.com/openai/v1
OPENAI_API_KEY=<same as GATEWAY_SHARED_TOKEN>
ANTHROPIC_BASE_URL=https://llm-gateway.example.com/anthropic
ANTHROPIC_API_KEY=<same as GATEWAY_SHARED_TOKEN>
ANTHROPIC_VERSION=2023-06-01
```

If both servers are on the same tailnet, prefer the private `.ts.net` hostname
and keep any reverse proxy bound to the tailnet interface only.
