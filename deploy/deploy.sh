#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./_lib.sh
source "${SCRIPT_DIR}/_lib.sh"

usage() {
  cat <<'EOF'
Usage: deploy/deploy.sh [--mode prod|dev] [--skip-build] [--seed] [env-file]

Daily deployment helper:
1. validates the selected runtime env file
2. rebuilds and restarts the selected compose stack
3. optionally re-runs seed.ts
4. runs smoke checks against the local web port

Default mode is prod, which uses deploy/production.env.
Dev mode uses deploy/development.env unless you pass an explicit env file.

Use --seed only if you intentionally want to ensure the default scenario and
bootstrap admin exist.
`--skip-build` is intended for higher-level orchestration scripts that already
ran `docker compose build`.
EOF
}

DEPLOY_MODE="${DEPLOY_MODE:-prod}"
SKIP_BUILD=0
WITH_SEED=0

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
    --skip-build)
      SKIP_BUILD=1
      shift
      ;;
    --seed)
      WITH_SEED=1
      shift
      ;;
    *)
      break
      ;;
  esac
done

load_env_file "$@"
validate_runtime_env
ensure_docker_ready
ensure_http_tools
ensure_data_dir

note "Using mode: ${DEPLOY_MODE}"
note "Using env file: ${ENV_FILE}"
note "Rebuilding and restarting containers"
if [[ "${SKIP_BUILD}" -eq 1 ]]; then
  compose up -d
else
  compose up -d --build
fi

if [[ "${WITH_SEED}" -eq 1 ]]; then
  note "Re-running seed.ts"
  compose exec -T api bun run ./apps/api/src/db/seed.ts
fi

note "Running smoke checks"
DEPLOY_MODE="${DEPLOY_MODE}" "${SCRIPT_DIR}/smoke-check.sh" "${ENV_FILE}"

note "Deploy complete"
