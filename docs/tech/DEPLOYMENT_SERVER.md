# Axiia Cup Server Deployment Checklist

This document is the operational checklist for deploying Axiia Cup onto a single Linux server with Docker Compose and a host-level reverse proxy such as Angie or nginx.

The deployment target assumed here is:

- Public domain: `cup.axiia.ai`
- Host-level reverse proxy: Angie or nginx
- App runtime: Docker Compose
- App topology: `web` container + `api` container
- Database: SQLite on a persistent host volume

## 1. Prerequisites

The server must already have:

- Docker Engine
- Docker Compose v2
- A reverse proxy on the host, typically Angie or nginx
- A DNS-managed domain that can point `cup.axiia.ai` to the server

Recommended verification commands:

```bash
docker --version
docker compose version
sudo angie -v || sudo nginx -v
```

## 2. Directory Layout

Recommended server-side layout:

```bash
/srv/axiia-cup/
  current/                  # checked-out repo
  shared/
    config/
      production.env
    data/
      api/
```

Create it with:

```bash
sudo mkdir -p /srv/axiia-cup/shared/config
sudo mkdir -p /srv/axiia-cup/shared/data/api
sudo chown -R "$USER":"$USER" /srv/axiia-cup
```

## 3. Copy Code To Server

Clone or sync the repository into:

```bash
/srv/axiia-cup/current
```

Example:

```bash
git clone <repo-url> /srv/axiia-cup/current
cd /srv/axiia-cup/current
```

## 4. Production Environment File

Start from the template:

```bash
cp deploy/production.env.example /srv/axiia-cup/shared/config/production.env
```

Edit `/srv/axiia-cup/shared/config/production.env` and set at least:

```env
CORS_ORIGIN=https://cup.axiia.ai
JWT_SECRET=<long-random-secret>
SILICONFLOW_API_KEY=<real-key>
REGISTRATION_CODE=axiia_cup
PORT=3001
ENABLE_WORKER=true
WORKER_CONCURRENCY=8
AXIIA_DB_PATH=/data/axiia.db
AXIIA_DATA_DIR=/srv/axiia-cup/shared/data
WEB_HOST_PORT=8200
VITE_API_URL=
```

Notes:

- `JWT_SECRET` is required. The API now fails at startup if it is missing.
- `SILICONFLOW_API_KEY` is required. The API now fails at startup if it is missing.
- Leave `VITE_API_URL` empty to use same-origin `/api` requests through the web container.
- `AXIIA_DATA_DIR` must point to a persistent host path, not a temporary directory.

## 5. Build And Start

From the repo root:

```bash
cd /srv/axiia-cup/current

docker compose \
  --env-file /srv/axiia-cup/shared/config/production.env \
  -f deploy/docker-compose.prod.yml \
  up -d --build
```

Check status:

```bash
docker compose \
  --env-file /srv/axiia-cup/shared/config/production.env \
  -f deploy/docker-compose.prod.yml \
  ps
```

Expected result:

- `api` is `Up`
- `web` is `Up`
- `web` is listening on `127.0.0.1:8200`

## 6. Seed Initial Scenario

The app can start with an empty database, but the product is not useful until at least one scenario is seeded.

Run:

```bash
docker compose \
  --env-file /srv/axiia-cup/shared/config/production.env \
  -f deploy/docker-compose.prod.yml \
  exec -T api bun run ./apps/api/src/db/seed.ts
```

This should seed the default `shangyang-court` scenario.

## 7. Local Host Smoke Checks

Before touching DNS or reverse proxy, verify the host-local port:

```bash
curl http://127.0.0.1:8200/health
curl http://127.0.0.1:8200/api/meta
curl http://127.0.0.1:8200/
curl http://127.0.0.1:8200/dashboard
```

Expected results:

- `/health` returns JSON with `"ok": true`
- `/api/meta` returns models and at least one scenario
- `/` returns the SPA HTML
- `/dashboard` also returns the SPA HTML because SPA fallback is enabled

## 8. Host Reverse Proxy

### 8a. Obtain TLS Certificate

The example Angie config requires a Let's Encrypt certificate. Install Certbot and issue the certificate before activating the config.

For Angie:

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d cup.axiia.ai
```

If Angie is already running on port 80, stop it first or use the webroot plugin with a temp config.

The certificate will be written to `/etc/letsencrypt/live/cup.axiia.ai/`.

Set up auto-renewal:

```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

Or add a cron entry: `0 3 * * * certbot renew --quiet && systemctl reload angie`

### 8b. Install Reverse Proxy Config

Use the example config in:

```text
deploy/angie.cup.axiia.ai.conf
```

This config redirects HTTP → HTTPS and proxies HTTPS traffic to the web container on `127.0.0.1:8200`.

Typical Angie location on the server:

```bash
sudo cp deploy/angie.cup.axiia.ai.conf /etc/angie/http.d/cup.axiia.ai.conf
sudo angie -t
sudo systemctl reload angie
```

If the server uses nginx instead, adapt the same config shape and run:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

The reverse proxy should forward:

- `cup.axiia.ai/*` -> `http://127.0.0.1:8200` (HTTPS termination at this layer)

## 9. DNS Cutover

In the DNS provider panel, add:

- Type: `A`
- Host: `cup`
- Value: `<server-public-ip>`

Initial recommendation:

- Keep the record as plain DNS first
- Do not enable CDN/proxy mode until the first external validation is complete

## 10. External Validation

After DNS propagates:

```bash
curl https://cup.axiia.ai/health
curl https://cup.axiia.ai/api/meta
```

Open in a browser and verify:

- Landing page loads
- Register page loads
- Login page loads
- Scenario data is visible

## 11. Rollback

If deployment breaks after a new release:

1. Restore the previous repo version in `/srv/axiia-cup/current`
2. Re-run compose with the same production env file
3. Verify `/health` and `/api/meta`

Example:

```bash
cd /srv/axiia-cup/current
git checkout <previous-good-commit>

docker compose \
  --env-file /srv/axiia-cup/shared/config/production.env \
  -f deploy/docker-compose.prod.yml \
  up -d --build
```

Rollback does not remove the SQLite database because it is mounted from the host.

## 12. Logs And Diagnostics

Useful commands:

```bash
docker compose \
  --env-file /srv/axiia-cup/shared/config/production.env \
  -f deploy/docker-compose.prod.yml \
  logs --tail=100 api web
```

```bash
docker compose \
  --env-file /srv/axiia-cup/shared/config/production.env \
  -f deploy/docker-compose.prod.yml \
  ps
```

```bash
ls -la /srv/axiia-cup/shared/data/api
```

## 13. Operational Notes

- This deployment is intentionally single-machine and SQLite-backed.
- Run only one `api` instance unless the worker model is redesigned.
- The current default registration code is `axiia_cup` unless overridden by env or admin setting.
- Do not commit `production.env`.
- Rotate `JWT_SECRET` and `SILICONFLOW_API_KEY` through the server config, not through the repository.

## 14. Backup

The SQLite database is a WAL-mode database. Do **not** use plain `cp` on a live database — it can produce corrupt backups if a write is in progress.

Use the `.backup` command instead:

```bash
sqlite3 /srv/axiia-cup/shared/data/api/axiia.db \
  ".backup /srv/axiia-cup/shared/data/api/backups/axiia.$(date +%Y%m%d).db"
```

Create the backup directory first:

```bash
mkdir -p /srv/axiia-cup/shared/data/api/backups
```

Suggested cron entry (runs at 2am daily):

```cron
0 2 * * * sqlite3 /srv/axiia-cup/shared/data/api/axiia.db ".backup /srv/axiia-cup/shared/data/api/backups/axiia.$(date +\%Y\%m\%d).db"
```

Rotate old backups to avoid disk fill:

```bash
find /srv/axiia-cup/shared/data/api/backups -name "*.db" -mtime +30 -delete
```
