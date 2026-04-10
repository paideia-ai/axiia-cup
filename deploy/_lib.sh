#!/usr/bin/env bash
set -euo pipefail

DEPLOY_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${DEPLOY_DIR}/.." && pwd)"
COMPOSE_FILE="${REPO_ROOT}/deploy/docker-compose.prod.yml"

note() {
  printf '[deploy] %s\n' "$*"
}

die() {
  printf '[deploy] error: %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

resolve_env_file() {
  if [[ $# -gt 1 ]]; then
    die "Expected at most one argument: [env-file]"
  fi

  if [[ $# -eq 1 ]]; then
    printf '%s\n' "$1"
    return
  fi

  if [[ -n "${ENV_FILE:-}" ]]; then
    printf '%s\n' "${ENV_FILE}"
    return
  fi

  printf '%s\n' "${REPO_ROOT}/deploy/production.env"
}

load_env_file() {
  ENV_FILE="$(resolve_env_file "$@")"
  [[ -f "${ENV_FILE}" ]] || die "Env file not found: ${ENV_FILE}"

  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
}

require_env() {
  local name="$1"
  [[ -n "${!name:-}" ]] || die "${name} must be set in ${ENV_FILE}"
}

require_env_not_placeholder() {
  local name="$1"
  local placeholder="$2"
  [[ "${!name:-}" != "${placeholder}" ]] ||
    die "${name} still uses the template placeholder in ${ENV_FILE}"
}

validate_runtime_env() {
  require_env CORS_ORIGIN
  require_env JWT_SECRET
  require_env SILICONFLOW_API_KEY
  require_env REGISTRATION_CODE
  require_env AXIIA_ADMIN_EMAIL
  require_env AXIIA_ADMIN_PASSWORD
  require_env AXIIA_ADMIN_NAME
  require_env AXIIA_DATA_DIR
  require_env WEB_HOST_PORT

  require_env_not_placeholder JWT_SECRET "replace-with-a-long-random-secret"
  require_env_not_placeholder SILICONFLOW_API_KEY "replace-with-your-siliconflow-key"
  require_env_not_placeholder AXIIA_ADMIN_PASSWORD "change-me-before-first-login"

  [[ "${AXIIA_DATA_DIR}" = /* ]] ||
    die "AXIIA_DATA_DIR must be an absolute path, got: ${AXIIA_DATA_DIR}"
  [[ "${WEB_HOST_PORT}" =~ ^[0-9]+$ ]] ||
    die "WEB_HOST_PORT must be numeric, got: ${WEB_HOST_PORT}"
}

ensure_docker_ready() {
  require_cmd docker
  docker info >/dev/null 2>&1 ||
    die "Docker daemon is not reachable"
}

ensure_http_tools() {
  require_cmd curl
}

ensure_data_dir() {
  mkdir -p "${AXIIA_DATA_DIR%/}/api" ||
    die "Failed to create ${AXIIA_DATA_DIR%/}/api"
}

compose() {
  local args=(docker compose)

  if [[ -n "${COMPOSE_PROJECT_NAME:-}" ]]; then
    args+=(-p "${COMPOSE_PROJECT_NAME}")
  fi

  args+=(--env-file "${ENV_FILE}" -f "${COMPOSE_FILE}")
  "${args[@]}" "$@"
}

json_escape() {
  local value="${1-}"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  value="${value//$'\n'/\\n}"
  value="${value//$'\r'/\\r}"
  value="${value//$'\t'/\\t}"
  printf '%s' "${value}"
}

default_base_url() {
  printf '%s\n' "http://127.0.0.1:${WEB_HOST_PORT}"
}
