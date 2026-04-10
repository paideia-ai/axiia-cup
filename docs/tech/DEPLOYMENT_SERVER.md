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
AXIIA_ADMIN_EMAIL=admin@example.com
AXIIA_ADMIN_PASSWORD=<strong-initial-password>
AXIIA_ADMIN_NAME=管理员
PORT=3001
WORKER_CONCURRENCY=8
AXIIA_DB_PATH=/data/axiia.db
AXIIA_DATA_DIR=/srv/axiia-cup/shared/data
WEB_HOST_PORT=8200
VITE_API_URL=
```

Notes:

- `JWT_SECRET` is required. The API now fails at startup if it is missing.
- `SILICONFLOW_API_KEY` is required. The API now fails at startup if it is missing.
- `LANGFUSE_SECRET_KEY`, `LANGFUSE_PUBLIC_KEY`, and `LANGFUSE_BASE_URL` are optional. Leave all three blank unless you want tracing.
- Leave `VITE_API_URL` empty to use same-origin `/api` requests through the web container.
- `AXIIA_DATA_DIR` must point to a persistent host path, not a temporary directory.
- `AXIIA_DATA_DIR` should live outside the repo checkout so you do not accidentally bind a stale local database into production.

## 5. Scripted Flow

The repository now includes three deployment helper scripts:

- `deploy/deploy-master.sh` — local machine entrypoint; syncs a committed Git snapshot to the server and triggers remote scripts
- `deploy/bootstrap-server.sh` — first deployment on a fresh server
- `deploy/deploy.sh` — normal day-to-day redeploys
- `deploy/smoke-check.sh` — smoke tests against the local port or an external base URL

These scripts do **not** install Docker, nginx/Angie, or Certbot for you. They assume the prerequisites from section 1 are already satisfied and that the repo is already present on the server.

Typical order on a fresh server:

1. Install Docker / Compose and the host reverse proxy.
2. Clone the repo into `/srv/axiia-cup/current`.
3. Create and edit `/srv/axiia-cup/shared/config/production.env`.
4. Run:

```bash
cd /srv/axiia-cup/current
./deploy/bootstrap-server.sh /srv/axiia-cup/shared/config/production.env
```

5. Install the reverse proxy config and obtain TLS.
6. Point DNS at the server.
7. Re-run smoke checks against the public domain:

```bash
cd /srv/axiia-cup/current
BASE_URL=https://cup.axiia.ai \
  ./deploy/smoke-check.sh /srv/axiia-cup/shared/config/production.env
```

If you prefer to drive the flow from your local machine instead of SSHing in manually, use:

```bash
cd /path/to/local/axiia-cup
./deploy/deploy-master.sh
./deploy/deploy-master.sh --host ubuntu@cup-server --bootstrap --local-env ./deploy/production.env
./deploy/deploy-master.sh --host ubuntu@cup-server --ref origin/master
./deploy/deploy-master.sh --host ubuntu@cup-server --base-url https://cup.axiia.ai
```

`deploy-master.sh` syncs a committed Git snapshot from your local repo to the remote checkout path, optionally uploads a local env file to the remote env path, and then runs the remote scripts there. By default it deploys `origin/master`, so uncommitted local changes are not published unless you commit them and point `--ref` at that commit.

## 6. Build And Start

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
- `api` health is `healthy`
- `web` is `Up`
- `web` is listening on `127.0.0.1:8200`

If `api` is restarting instead of becoming healthy, check `docker compose logs api` before proceeding. The usual causes are missing secrets or mounting an unexpected old SQLite file into `/data`.

## 7. Seed Initial Scenario

The app can start with an empty database, but the product is not useful until at least one scenario is seeded.

Run:

```bash
docker compose \
  --env-file /srv/axiia-cup/shared/config/production.env \
  -f deploy/docker-compose.prod.yml \
  exec -T api bun run ./apps/api/src/db/seed.ts
```

This should seed the default `shangyang-court` scenario.

It also ensures an initial admin account exists using these environment variables:

- `AXIIA_ADMIN_EMAIL`
- `AXIIA_ADMIN_PASSWORD`
- `AXIIA_ADMIN_NAME`

If you leave them unset, the fallback account is:

- email: `admin@paideia.uno`
- password: `axiia-cup`

Do not rely on the fallback credentials on a real server.

## 8. Local Host Smoke Checks

Before touching DNS or reverse proxy, verify the host-local port:

```bash
curl http://127.0.0.1:8200/health
curl http://127.0.0.1:8200/api/meta
curl http://127.0.0.1:8200/
curl http://127.0.0.1:8200/dashboard
curl http://127.0.0.1:8200/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"<strong-initial-password>"}'
```

Expected results:

- `/health` returns JSON with `"ok": true`
- `/api/meta` returns models and at least one scenario
- `/` returns the SPA HTML
- `/dashboard` also returns the SPA HTML because SPA fallback is enabled
- the login request returns a JWT and an admin user object

The equivalent scripted check is:

```bash
cd /srv/axiia-cup/current
./deploy/smoke-check.sh /srv/axiia-cup/shared/config/production.env
```

## 9. Host Reverse Proxy

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

## 10. DNS Cutover

In the DNS provider panel, add:

- Type: `A`
- Host: `cup`
- Value: `<server-public-ip>`

Initial recommendation:

- Keep the record as plain DNS first
- Do not enable CDN/proxy mode until the first external validation is complete

## 11. External Validation

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

## 12. Rollback

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

## 13. Daily Deploy

For an ordinary release on an existing server:

1. Update the repo checkout:

```bash
cd /srv/axiia-cup/current
git pull
```

2. Redeploy:

```bash
cd /srv/axiia-cup/current
./deploy/deploy.sh /srv/axiia-cup/shared/config/production.env
```

3. If you need to verify the public domain after DNS / TLS changes:

```bash
cd /srv/axiia-cup/current
BASE_URL=https://cup.axiia.ai \
  ./deploy/smoke-check.sh /srv/axiia-cup/shared/config/production.env
```

If you intentionally want to re-run the default bootstrap seed during a deploy, use:

```bash
cd /srv/axiia-cup/current
./deploy/deploy.sh --seed /srv/axiia-cup/shared/config/production.env
```

The equivalent local-machine command is:

```bash
cd /path/to/local/axiia-cup
./deploy/deploy-master.sh
./deploy/deploy-master.sh --host ubuntu@cup-server --local-env ./deploy/production.env
```

And if you also want a public-domain smoke check:

```bash
cd /path/to/local/axiia-cup
./deploy/deploy-master.sh --host ubuntu@cup-server --base-url https://cup.axiia.ai
```

## 14. Logs And Diagnostics

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

## 15. Operational Notes

- This deployment is intentionally single-machine and SQLite-backed.
- Run only one `api` instance unless the worker model is redesigned.
- The current default registration code is `axiia_cup` unless overridden by env or admin setting.
- Do not commit `production.env`.
- Rotate `JWT_SECRET` and `SILICONFLOW_API_KEY` through the server config, not through the repository.

## 16. Backup

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
