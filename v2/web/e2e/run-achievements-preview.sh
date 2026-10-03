#!/usr/bin/env bash
set -euo pipefail
WEB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_REPO="${AXIIA_SERVER_REPO:-$WEB_DIR/../../../axiia-cup-v2-achievements}"
AXIIA_BIN="${AXIIA_BIN:-$SERVER_REPO/.bazel/bin/packages/axiia/axiia}"
[ -x "$AXIIA_BIN" ] || { echo 'Build the backend with Bazel first, or set AXIIA_BIN.' >&2; exit 1; }
PREVIEW_DATA="$(mktemp -d /tmp/axiia-achievements-preview.XXXXXX)"
API_PORT="${AXIIA_PREVIEW_API_PORT:-8127}"
WEB_PORT="${AXIIA_PREVIEW_WEB_PORT:-6248}"
export AXIIA_DB_PATH="$PREVIEW_DATA/axiia.sqlite"
export AXIIA_OBJECT_FS_ROOT="$PREVIEW_DATA/objects"
export AXIIA_ELEVATION_SECRET='local-achievement-preview-secret-2026-only'
export AXIIA_LISTEN_HOST='127.0.0.1'
export AXIIA_LISTEN_PORT="$API_PORT"
export AXIIA_ALLOWED_ORIGINS="http://localhost:$WEB_PORT,http://127.0.0.1:$WEB_PORT"
export AXIIA_COOKIE_SECURE=false
export AXIIA_PVE_REQUIRED_WINS=0
export AXIIA_DAILY_POINT_RUNS=100
export AXIIA_OPPONENT_DAILY_CHALLENGE_LIMIT=100
export AXIIA_PROXY_TARGET="http://127.0.0.1:$API_PORT"
mkdir -p "$AXIIA_OBJECT_FS_ROOT"
"$AXIIA_BIN" serve > "$PREVIEW_DATA/server.log" 2>&1 &
API_PID=$!
WEB_PID=''
trap 'kill "$API_PID" ${WEB_PID:+"$WEB_PID"} 2>/dev/null || true' EXIT
for _ in $(seq 1 120); do
  [ "$(curl -s -o /dev/null -w '%{http_code}' "$AXIIA_PROXY_TARGET/v1/auth/me" || true)" = 401 ] && break
  sleep 0.25
done
for attempt in $(seq 1 6); do
  if "$AXIIA_BIN" admin mint --email admin@axiia.test --name Admin --password adminpw-123456 > "$PREVIEW_DATA/admin.txt" 2> "$PREVIEW_DATA/admin-error.txt"; then break; fi
  [ "$attempt" -lt 6 ] || { cat "$PREVIEW_DATA/admin-error.txt" >&2; exit 1; }
  sleep 1
done
PREVIEW_TOTP="$(sed -n 's/^TOTP secret: //p' "$PREVIEW_DATA/admin.txt")"
cd "$WEB_DIR"
deno run -A e2e/seed-achievements.ts "$AXIIA_PROXY_TARGET" admin@axiia.test adminpw-123456 "$PREVIEW_TOTP"
deno task build > "$PREVIEW_DATA/build.log" 2>&1
deno run -A npm:vite preview --host 0.0.0.0 --port "$WEB_PORT" --strictPort > "$PREVIEW_DATA/web.log" 2>&1 &
WEB_PID=$!
printf 'Preview: http://localhost:%s/settings/achievements\nData and logs: %s\n' "$WEB_PORT" "$PREVIEW_DATA"
wait "$WEB_PID"
