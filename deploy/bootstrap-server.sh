#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./_lib.sh
source "${SCRIPT_DIR}/_lib.sh"

usage() {
  cat <<'EOF'
Usage: deploy/bootstrap-server.sh [--skip-build] [env-file]

Initial server bootstrap for a fresh deployment:
1. validates the production env file
2. ensures the persistent data directory exists
3. builds and starts the production compose stack
4. seeds the default scenario and bootstrap admin
5. runs smoke checks against the local web port

The env file defaults to deploy/production.env.
Override the compose project name with COMPOSE_PROJECT_NAME if needed.
`--skip-build` is intended for higher-level orchestration scripts that already
ran `docker compose build`.
EOF
}

SKIP_BUILD=0

case "${1:-}" in
  -h|--help)
    usage
    exit 0
    ;;
  --skip-build)
    SKIP_BUILD=1
    shift
    ;;
esac

load_env_file "$@"
validate_runtime_env
ensure_docker_ready
ensure_http_tools
ensure_data_dir

note "Using env file: ${ENV_FILE}"
note "Ensuring containers are up"
if [[ "${SKIP_BUILD}" -eq 1 ]]; then
  compose up -d
else
  compose up -d --build
fi

note "Seeding default admin account and scenario"
compose exec -T api bun run ./apps/api/src/db/seed.ts

note "Running smoke checks"
"${SCRIPT_DIR}/smoke-check.sh" "${ENV_FILE}"

note "Bootstrap complete"
note "Next: install the host reverse proxy config, obtain TLS, and point DNS at the server"
