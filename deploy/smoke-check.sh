#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./_lib.sh
source "${SCRIPT_DIR}/_lib.sh"

usage() {
  cat <<'EOF'
Usage: deploy/smoke-check.sh [env-file]

Smoke tests the deployed stack by checking:
- /health
- /api/meta
- /
- /dashboard
- admin login

By default it targets http://127.0.0.1:${WEB_HOST_PORT}.
Override the target with BASE_URL, for example:
  BASE_URL=https://cup.axiia.ai deploy/smoke-check.sh /srv/axiia-cup/shared/config/production.env
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

load_env_file "$@"
validate_runtime_env
ensure_http_tools

BASE_URL="${BASE_URL:-$(default_base_url)}"
LOGIN_PAYLOAD="$(printf '{"email":"%s","password":"%s"}' \
  "$(json_escape "${AXIIA_ADMIN_EMAIL}")" \
  "$(json_escape "${AXIIA_ADMIN_PASSWORD}")")"

check_contains() {
  local label="$1"
  local body="$2"
  local needle="$3"
  [[ "${body}" == *"${needle}"* ]] ||
    die "${label} did not contain expected content: ${needle}"
}

note "Smoke checking ${BASE_URL}"

health="$(curl -fsS "${BASE_URL}/health")"
check_contains "/health" "${health}" '"ok":true'

meta="$(curl -fsS "${BASE_URL}/api/meta")"
check_contains "/api/meta" "${meta}" '"models":'
check_contains "/api/meta" "${meta}" '"scenarios":['
[[ "${meta}" != *'"scenarios":[]'* ]] ||
  die "/api/meta returned no scenarios; seed.ts may not have been run"

home_html="$(curl -fsS "${BASE_URL}/")"
check_contains "/" "${home_html}" '<div id="root"></div>'

dashboard_html="$(curl -fsS "${BASE_URL}/dashboard")"
check_contains "/dashboard" "${dashboard_html}" '<div id="root"></div>'

login_response="$(curl -fsS "${BASE_URL}/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "${LOGIN_PAYLOAD}")"
check_contains "/api/auth/login" "${login_response}" '"token":"'
check_contains "/api/auth/login" "${login_response}" '"isAdmin":true'

note "Smoke checks passed"
