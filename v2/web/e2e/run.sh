#!/usr/bin/env bash
# Offline end-to-end test for axiia-web v2 against the real `axiia` Swift server.
#
# Boots the binary on a temp space + filesystem object store, mints a registration
# code (via faithful HTTP as a TOTP-elevated admin — scenarios and presets come
# from the binary catalog), starts the vite dev server proxying /v1 to it
# (same-origin so cookies + CSRF work), and drives a headless browser through:
# signup → catalog → scenario → build agent → save version (lands on the EA
# agent home) → logout. The match/LLM segment is env-gated on DEEPSEEK_API_KEY:
# present → dispatch a real PvE match and watch
# the tier-1 live stream; absent → skip, exercising the match-list state instead.
#
# Requirements on PATH: bazel (or AXIIA_BIN set), deno, node, agent-browser.
set -euo pipefail

WEB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$WEB_DIR/../.." && pwd)"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/axiia-e2e.XXXXXX")"
SHOTS="$WORK/shots"; mkdir -p "$SHOTS" "$WORK/obj"
# Random high ports by default so a stray dev serve/vite can't satisfy the
# readiness probe and mask a bind failure; override for a pinned run if needed.
PORT_API="${AXIIA_E2E_API_PORT:-$((20000 + RANDOM % 20000))}"
PORT_WEB="${AXIIA_E2E_WEB_PORT:-$((40000 + RANDOM % 20000))}"
ORIGIN="http://localhost:$PORT_WEB"
export AGENT_BROWSER_SESSION="axiia-e2e-$$"

SERVE_PID=""; VITE_PID=""
cleanup() {
  local code=$?
  agent-browser close >/dev/null 2>&1 || true
  [ -n "$VITE_PID" ] && kill "$VITE_PID" 2>/dev/null || true
  [ -n "$SERVE_PID" ] && kill "$SERVE_PID" 2>/dev/null || true
  # Keep the work dir (serve.log, vite.log, screenshots) on failure — it is the
  # only forensic trail exactly when it is needed.
  if [ "$code" -eq 0 ]; then
    sleep 1; rm -rf "$WORK" 2>/dev/null || true
  else
    printf '\nWORK preserved for debugging: %s\n' "$WORK" >&2
  fi
  return "$code"
}
trap cleanup EXIT

step() { printf '\n=== %s ===\n' "$1"; }
fail() { printf 'E2E FAIL: %s\n' "$1" >&2; exit 1; }
assert_contains() { case "$1" in *"$2"*) :;; *) fail "expected '$2' in: $1";; esac; }

# ── Binary ──────────────────────────────────────────────────────────────────
AXIIA_BIN="${AXIIA_BIN:-}"
if [ -z "$AXIIA_BIN" ]; then
  step "build axiia binary"
  (cd "$REPO_ROOT" && bazel build //packages/axiia:axiia >/dev/null)
  AXIIA_BIN="$REPO_ROOT/.bazel/bin/packages/axiia/axiia"
fi
[ -x "$AXIIA_BIN" ] || fail "axiia binary not found at $AXIIA_BIN"

export AXIIA_DB_PATH="$WORK/axiia.sqlite"
export AXIIA_LOCK_PATH="$WORK/axiia.lock"
export AXIIA_OBJECT_FS_ROOT="$WORK/obj"
export AXIIA_ELEVATION_SECRET="e2e-elevation-secret-at-least-32-bytes-long"
export AXIIA_ADMIN_ISSUER="axiia"
export AXIIA_LISTEN_HOST="127.0.0.1"
export AXIIA_LISTEN_PORT="$PORT_API"
export AXIIA_ALLOWED_ORIGINS="$ORIGIN"
export AXIIA_PVE_REQUIRED_WINS="1"

# ── Admin mint (offline; possession-of-db is root) ──────────────────────────
step "mint admin"
MINT="$("$AXIIA_BIN" admin mint --email admin@axiia.test --name Admin --password 'adminpw-123456')"
TOTP_SECRET="$(printf '%s\n' "$MINT" | sed -n 's/^TOTP secret: //p')"
[ -n "$TOTP_SECRET" ] || fail "could not parse TOTP secret from admin mint"
echo "minted admin, totp secret captured"

# ── Serve ───────────────────────────────────────────────────────────────────
# The live-match segment needs DEEPSEEK_API_KEY: the preset opponent, the player
# agent and the judge all run DeepSeek models via the official API, so one key
# covers the whole match. Absent, the match segment is skipped.
LLM_KEY="${DEEPSEEK_API_KEY:-}"
step "start axiia serve${LLM_KEY:+ (with DeepSeek key → live matches)}"
"$AXIIA_BIN" serve >"$WORK/serve.log" 2>&1 &
SERVE_PID=$!
for _ in $(seq 1 60); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT_API/v1/auth/me" || true)"
  [ "$code" = "401" ] && break
  sleep 0.5
done
[ "$code" = "401" ] || { cat "$WORK/serve.log"; fail "serve did not become ready"; }
echo "serve ready on :$PORT_API"

# ── Seed (login → TOTP elevate → registration code) ─────────────────────────
step "seed via admin HTTP"
SEED="$(deno run -A --no-config "$WEB_DIR/e2e/setup.ts" \
  "http://127.0.0.1:$PORT_API" admin@axiia.test 'adminpw-123456' "$TOTP_SECRET")"
echo "seeded: $SEED"
CODE="$(printf '%s' "$SEED" | sed -n 's/.*"registrationCode":"\([^"]*\)".*/\1/p')"
[ -n "$CODE" ] || fail "no registration code from setup"
# The scenario under test is whatever the binary catalog lists first — the e2e
# never hardcodes a scenario id.
SCENARIO_ID="$(printf '%s' "$SEED" | sed -n 's/.*"scenarioID":"\([^"]*\)".*/\1/p')"
SCENARIO_TITLE="$(printf '%s' "$SEED" | sed -n 's/.*"scenarioTitle":"\([^"]*\)".*/\1/p')"
[ -n "$SCENARIO_ID" ] || fail "no scenario id from setup"

# ── Vite dev server (proxies /v1 → axiia, same-origin) ──────────────────────
# The package is deliberately not a root Deno-workspace member, so `deno install`
# refuses in place. Mirror the Bazel deno rule: materialize the package in an
# isolated dir (its own deno.json becomes the workspace root) and install honoring
# the committed deno.lock (--frozen) — no npm, no unpinned fetch. Vite itself runs
# under node, not `deno task dev`: deno's node-compat crashes proxying the bell SSE
# stream on client disconnect (Uncaught Interrupted), killing the dev server.
step "start vite"
APP="$WORK/app"; mkdir -p "$APP"
cp -RL "$WEB_DIR/." "$APP/" 2>/dev/null || true
rm -rf "$APP/node_modules" "$APP/build" "$APP/.react-router" "$APP/BUILD.bazel"
( cd "$APP" && deno install --frozen ) >"$WORK/deno-install.log" 2>&1 || { cat "$WORK/deno-install.log"; fail "deno install --frozen failed"; }
[ -x "$APP/node_modules/.bin/vite" ] || fail "deno install did not materialize node_modules/.bin/vite"
( cd "$APP" && AXIIA_PROXY_TARGET="http://127.0.0.1:$PORT_API" \
  ./node_modules/.bin/vite --host 127.0.0.1 --port "$PORT_WEB" >"$WORK/vite.log" 2>&1 ) &
VITE_PID=$!
for _ in $(seq 1 60); do
  curl -s -o /dev/null "$ORIGIN/" && break || sleep 0.5
done
curl -s -o /dev/null "$ORIGIN/" || { cat "$WORK/vite.log"; fail "vite did not start"; }
echo "vite ready on :$PORT_WEB"

# ── Browser flow ────────────────────────────────────────────────────────────
# Alarm-guard every browser call so a stray locator wait can never hang the run;
# drive via real clicks on stable selectors (submit buttons + data-testid) — the
# accessibility-locator commands (find role/text) proved flaky under repetition.
ab() { perl -e 'alarm 40; exec @ARGV' agent-browser "$@"; }
has_session() { [ "$(ab cookies get 2>/dev/null | grep -c axiia_session)" -ge 1 ]; }
# The submit click returns before the async signup/login fetch commits Set-Cookie;
# poll rather than race a fixed sleep.
await_session() { for _ in $(seq 1 30); do has_session && return 0; sleep 0.5; done; return 1; }
await_no_session() { for _ in $(seq 1 30); do has_session || return 0; sleep 0.5; done; return 1; }
# Dev-mode routes compile on first visit; poll for content rather than race a sleep.
wait_text() { for _ in $(seq 1 40); do case "$(ab get text body 2>/dev/null)" in *"$1"*) return 0;; esac; sleep 0.5; done; return 1; }

step "browser: landing"
ab open "$ORIGIN/" >/dev/null
assert_contains "$(ab get title)" "Axiia Cup"
ab screenshot "$SHOTS/01-landing.png" >/dev/null

step "browser: signup"
ab open "$ORIGIN/register" >/dev/null
for _ in $(seq 1 40); do ab is visible 'input[name=code]' >/dev/null 2>&1 && break; sleep 0.5; done
ab fill 'input[name=code]' "$CODE" >/dev/null
ab fill 'input[name=displayName]' '博弈者' >/dev/null
ab fill 'input[name=email]' 'browser@axiia.test' >/dev/null
ab fill 'input[name=password]' 'browserpw-123456' >/dev/null
ab screenshot "$SHOTS/02-register.png" >/dev/null
ab click 'button[type=submit]' >/dev/null
await_session || fail "no session cookie after signup"

step "browser: catalog → scenario"
ab open "$ORIGIN/scenarios" >/dev/null
wait_text "$SCENARIO_TITLE" || fail "catalog did not render the catalog scenario"
ab screenshot "$SHOTS/03-catalog.png" >/dev/null
ab click "[data-testid=scenario-$SCENARIO_ID]" >/dev/null
wait_text "构建智能体" || fail "scenario detail did not render"
assert_contains "$(ab get url)" "/scenarios/$SCENARIO_ID"
ab screenshot "$SHOTS/04-scenario.png" >/dev/null

step "browser: build agent for side A"
ab click '[data-testid=build-agent]' >/dev/null
wait_text "智能体构建器" || fail "builder did not render"
assert_contains "$(ab get url)" "/agents/"

step "browser: write prompt + save version (lands on EA agent home)"
ab fill 'textarea' '你是甲方。坚定主张地契副本的效力，逐条反驳乙方。' >/dev/null; sleep 1
ab click '[data-testid=save-version]' >/dev/null
# Saving navigates to the EA agent home (/agents/:id), which lists the version.
wait_text "版本（1）" || fail "EA agent home did not render the saved version"
case "$(ab get url)" in *"/build"*) fail "still on builder after save";; esac
ab screenshot "$SHOTS/05-agent-home.png" >/dev/null

# ── Env-gated LLM match segment ─────────────────────────────────────────────
if [ -n "$LLM_KEY" ]; then
  step "browser: dispatch PvE match + watch tier-1 stream (LLM key present)"
  # 出战 opens the OS dispatch panel (EA/E split moved dispatch off the builder).
  ab click '[data-testid=open-os-panel]' >/dev/null
  wait_text "选择预设对手" || fail "OS panel did not open"
  # Pick the opponent preset (base-ui Select): open the trigger, choose the option.
  ab eval "[...document.querySelectorAll('button')].find(b=>b.textContent.includes('选择预设对手'))?.click()" >/dev/null; sleep 1
  ab eval "document.querySelector('[role=option]')?.click()" >/dev/null; sleep 1
  ab click '[data-testid=dispatch-match]' >/dev/null; sleep 2
  MURL="$(ab get url)"
  assert_contains "$MURL" "/matches/"
  # Poll the live match page until a turn or verdict renders; assert the break
  # condition actually fired so a broken key can't pass on the page header alone.
  rendered=""
  for _ in $(seq 1 180); do
    body="$(ab get text 'body')"
    case "$body" in *"第 1 条"*|*"胜方"*|*"终局裁决"*) rendered=1; break;; esac
    sleep 1
  done
  ab screenshot "$SHOTS/07-match.png" >/dev/null
  [ -n "$rendered" ] || fail "live match never rendered a turn/verdict (LLM key present)"
  echo "match segment rendered live turns"
else
  step "browser: match-list UI (no LLM key — skipping live dispatch)"
  ab open "$ORIGIN/matches" >/dev/null
  wait_text "历史" || fail "match list did not render"
  ab screenshot "$SHOTS/07-matches-empty.png" >/dev/null
  echo "match-list state exercised (LLM segment skipped)"
fi

step "browser: logout"
ab open "$ORIGIN/scenarios" >/dev/null
for _ in $(seq 1 40); do ab is visible '[data-testid=logout]' >/dev/null 2>&1 && break; sleep 0.5; done
ab click '[data-testid=logout]' >/dev/null
await_no_session || fail "session cookie survived logout"
me_status="$(ab eval "fetch('/v1/auth/me',{credentials:'include'}).then(r=>r.status)")"
assert_contains "$me_status" "401"
ab screenshot "$SHOTS/06-logged-out.png" >/dev/null

printf '\nE2E PASS — screenshots in %s\n' "$SHOTS"
# Keep the shots out of the auto-cleaned WORK dir if the caller wants them.
if [ -n "${AXIIA_E2E_SHOT_DIR:-}" ]; then mkdir -p "$AXIIA_E2E_SHOT_DIR"; cp "$SHOTS"/* "$AXIIA_E2E_SHOT_DIR"/ 2>/dev/null || true; fi
