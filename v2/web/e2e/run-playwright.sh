#!/usr/bin/env bash
set -euo pipefail

WEB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$WEB_DIR/../.." && pwd)"
SERVER_REPO="${AXIIA_SERVER_REPO:-$(cd "$REPO_ROOT/.." && pwd)/axiia-cup-v2}"
E2E_WORK="$(mktemp -d "${TMPDIR:-/tmp}/axiia-playwright.XXXXXX")"
API_PORT="${AXIIA_E2E_API_PORT:-$((20000 + RANDOM % 15000))}"
WEB_PORT="${AXIIA_E2E_WEB_PORT:-$((40000 + RANDOM % 15000))}"
ORIGIN="http://127.0.0.1:$WEB_PORT"
API_PID=""
WEB_PID=""

cleanup() {
  local status=$?
  [ -n "$WEB_PID" ] && kill "$WEB_PID" 2>/dev/null || true
  [ -n "$API_PID" ] && kill "$API_PID" 2>/dev/null || true
  if [ "$status" -eq 0 ]; then
    rm -rf "$E2E_WORK"
  else
    printf 'Real-server test artifacts preserved at %s\n' "$E2E_WORK" >&2
  fi
  return "$status"
}
trap cleanup EXIT

fail() {
  printf 'Real-server bootstrap failed: %s\n' "$1" >&2
  exit 1
}

[ -d "$SERVER_REPO/packages/axiia" ] ||
  fail "Swift server repo not found at $SERVER_REPO; set AXIIA_SERVER_REPO"

AXIIA_BIN="${AXIIA_BIN:-}"
if [ -z "$AXIIA_BIN" ]; then
  command -v swift >/dev/null 2>&1 ||
    fail 'Swift 6.3 is not on PATH; install it or provide AXIIA_BIN'
  command -v clang >/dev/null 2>&1 ||
    fail 'Clang is not on PATH; the Swift Bazel toolchain requires it'
  command -v rsync >/dev/null 2>&1 ||
    fail 'rsync is required to create an isolated server build copy'
  [ -f /usr/include/sqlite3.h ] ||
    fail 'sqlite3.h is missing; install libsqlite3-dev or provide AXIIA_BIN'

  SERVER_BUILD_REPO="$E2E_WORK/server-src"
  mkdir -p "$SERVER_BUILD_REPO"
  rsync -a \
    --exclude='.git' \
    --exclude='.bazel' \
    --exclude='bazel/umbrella/.build' \
    "$SERVER_REPO/" "$SERVER_BUILD_REPO/"
  printf 'Generating the Swift server Bazel graph...\n'
  (cd "$SERVER_BUILD_REPO" && deno task generate-manifests) >"$E2E_WORK/manifests.log" 2>&1 || {
    cat "$E2E_WORK/manifests.log"
    fail 'manifest generation failed'
  }
  deno run -A --no-config "$WEB_DIR/e2e/prepare-server-copy.ts" \
    "$SERVER_BUILD_REPO/bazel/umbrella/Package.resolved"

  if command -v bazel >/dev/null 2>&1; then
    BAZEL=(bazel)
  else
    BAZEL=(deno run -A --no-config npm:@bazel/bazelisk@1.28.1)
  fi
  printf 'Building the real Swift server...\n'
  (cd "$SERVER_BUILD_REPO" && CC=clang USE_BAZEL_VERSION=9.1.0 \
    "${BAZEL[@]}" build "--action_env=PATH=$PATH" //packages/axiia:axiia) \
    >"$E2E_WORK/bazel.log" 2>&1 || {
      tail -200 "$E2E_WORK/bazel.log"
      fail 'Swift server build failed'
    }
  AXIIA_BIN="$SERVER_BUILD_REPO/.bazel/bin/packages/axiia/axiia"
fi
[ -x "$AXIIA_BIN" ] || fail "axiia binary is not executable: $AXIIA_BIN"

mkdir -p "$E2E_WORK/objects"
export AXIIA_DB_PATH="$E2E_WORK/axiia.sqlite"
export AXIIA_LOCK_PATH="$E2E_WORK/axiia.lock"
export AXIIA_OBJECT_FS_ROOT="$E2E_WORK/objects"
export AXIIA_ELEVATION_SECRET='playwright-elevation-secret-at-least-32-bytes'
export AXIIA_ADMIN_ISSUER='axiia-playwright'
export AXIIA_LISTEN_HOST='127.0.0.1'
export AXIIA_LISTEN_PORT="$API_PORT"
export AXIIA_ALLOWED_ORIGINS="$ORIGIN"
export AXIIA_COOKIE_SECURE='false'
export AXIIA_PVE_REQUIRED_WINS='1'
export AXIIA_DAILY_BATTLE_LIMIT='20'
export AXIIA_PVP_DAILY_LIMIT='10'
export AXIIA_CONCURRENCY_LIMIT='10'

"$AXIIA_BIN" serve >"$E2E_WORK/server.log" 2>&1 &
API_PID=$!
API_STATUS=''
for _ in $(seq 1 120); do
  API_STATUS="$(curl -s -o /dev/null -w '%{http_code}' \
    "http://127.0.0.1:$API_PORT/v1/auth/me" || true)"
  [ "$API_STATUS" = '401' ] && break
  sleep 0.25
done
[ "$API_STATUS" = '401' ] || {
  cat "$E2E_WORK/server.log"
  fail 'Swift server did not become ready'
}

MINT="$($AXIIA_BIN admin mint \
  --email admin@axiia.test \
  --name Admin \
  --password 'adminpw-123456')"
TOTP_SECRET="$(printf '%s\n' "$MINT" | sed -n 's/^TOTP secret: //p')"
[ -n "$TOTP_SECRET" ] || fail 'admin mint did not return a TOTP secret'

SEED="$(deno run -A --no-config "$WEB_DIR/e2e/seed-dev.ts" \
  "http://127.0.0.1:$API_PORT" \
  admin@axiia.test \
  'adminpw-123456' \
  "$TOTP_SECRET" \
  'CUP2026')" || {
    fail 'opponent fixture seed failed'
  }
REGISTRATION_CODE="$(printf '%s' "$SEED" |
  sed -n 's/.*"registrationCode":"\([^"]*\)".*/\1/p')"
SCENARIO_ID="$(printf '%s' "$SEED" |
  sed -n 's/.*"scenarioID":"\([^"]*\)".*/\1/p')"
[ -n "$REGISTRATION_CODE" ] || fail 'seed did not return a registration code'
[ -n "$SCENARIO_ID" ] || fail 'seed did not return a scenario id'

(cd "$WEB_DIR" && \
  AXIIA_PROXY_TARGET="http://127.0.0.1:$API_PORT" \
  deno run -A npm:vite --host 127.0.0.1 --port "$WEB_PORT" \
    >"$E2E_WORK/vite.log" 2>&1) &
WEB_PID=$!
WEB_STATUS=''
for _ in $(seq 1 120); do
  WEB_STATUS="$(curl -s -o /dev/null -w '%{http_code}' "$ORIGIN/" || true)"
  [ "$WEB_STATUS" = '200' ] && break
  sleep 0.25
done
[ "$WEB_STATUS" = '200' ] || {
  cat "$E2E_WORK/vite.log"
  fail 'Vite did not become ready'
}

printf 'Running Playwright against Swift %s and web %s\n' "$API_PORT" "$WEB_PORT"
AXIIA_BASE_URL="$ORIGIN" \
AXIIA_REGISTRATION_CODE="$REGISTRATION_CODE" \
AXIIA_SCENARIO_ID="$SCENARIO_ID" \
  deno task --config "$WEB_DIR/deno.json" test:e2e
