#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./_lib.sh
source "${SCRIPT_DIR}/_lib.sh"

usage() {
  cat <<'EOF'
Usage: deploy/smoke-check.sh [--mode prod|dev] [env-file]

Smoke tests the deployed stack by checking:
- /health
- /api/meta
- /
- /dashboard
- admin login

Default mode is prod, which uses deploy/production.env.
Dev mode uses deploy/development.env unless you pass an explicit env file.
By default it targets http://127.0.0.1:${WEB_HOST_PORT}.
Override the target with BASE_URL, for example:
  BASE_URL=https://axiia-cup.isofucius.cn deploy/smoke-check.sh /srv/axiia-cup/shared/config/production.env
EOF
}

DEPLOY_MODE="${DEPLOY_MODE:-prod}"

while [[ $# -gt 0 ]]; do
  case "${1:-}" in
    -h|--help)
      usage
      exit 0
      ;;
    --mode)
      DEPLOY_MODE="${2:-}"
      shift 2
      ;;
    *)
      break
      ;;
  esac
done

load_env_file "$@"
validate_runtime_env
ensure_http_tools

BASE_URL="${BASE_URL:-$(default_base_url)}"
LOGIN_PAYLOAD="$(printf '{"email":"%s","password":"%s"}' \
  "admin@paideia.uno" \
  "axiia-cup")"

fetch_with_retry() {
  local url="$1"
  local attempts="${2:-10}"
  local delay="${3:-2}"
  local attempt
  local body

  for ((attempt = 1; attempt <= attempts; attempt += 1)); do
    if body="$(curl -fsS "${url}" 2>/dev/null)"; then
      printf '%s' "${body}"
      return 0
    fi

    sleep "${delay}"
  done

  die "Timed out fetching ${url}"
}

post_with_retry() {
  local url="$1"
  local payload="$2"
  local attempts="${3:-10}"
  local delay="${4:-2}"
  local attempt
  local body

  for ((attempt = 1; attempt <= attempts; attempt += 1)); do
    if body="$(curl -fsS "${url}" \
      -H 'Content-Type: application/json' \
      -d "${payload}" 2>/dev/null)"; then
      printf '%s' "${body}"
      return 0
    fi

    sleep "${delay}"
  done

  die "Timed out posting to ${url}"
}

check_contains() {
  local label="$1"
  local body="$2"
  local needle="$3"
  [[ "${body}" == *"${needle}"* ]] ||
    die "${label} did not contain expected content: ${needle}"
}

note "Smoke checking ${BASE_URL}"

health="$(fetch_with_retry "${BASE_URL}/health")"
check_contains "/health" "${health}" '"ok":true'

meta="$(fetch_with_retry "${BASE_URL}/api/meta")"
check_contains "/api/meta" "${meta}" '"models":'
check_contains "/api/meta" "${meta}" '"scenarios":['
[[ "${meta}" != *'"scenarios":[]'* ]] ||
  die "/api/meta returned no scenarios; seed.ts may not have been run"

home_html="$(fetch_with_retry "${BASE_URL}/")"
check_contains "/" "${home_html}" '<div id="root"></div>'

dashboard_html="$(fetch_with_retry "${BASE_URL}/dashboard")"
check_contains "/dashboard" "${dashboard_html}" '<div id="root"></div>'

login_response="$(post_with_retry "${BASE_URL}/api/auth/login" "${LOGIN_PAYLOAD}")"
check_contains "/api/auth/login" "${login_response}" '"token":"'
check_contains "/api/auth/login" "${login_response}" '"isAdmin":true'

note "Smoke checks passed"
