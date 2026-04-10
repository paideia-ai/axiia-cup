#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

usage() {
  cat <<'EOF'
Usage:
  deploy/deploy-master.sh [options]

Canonical local-to-remote deploy entrypoint. Runs on your local machine and:
1. creates a committed snapshot from a Git ref
2. syncs that snapshot to the remote server with rsync
3. optionally uploads a local production env file
4. builds remotely, enables write lock, waits for running work to drain
5. runs the remote bootstrap/deploy script
6. optionally runs a public smoke check

Options:
  --host <user@server>         SSH target. Default: anna@120.55.38.143
  --ref <git-ref>              Git ref to deploy. Default: origin/master
  --remote-dir <path>          Remote repo checkout path
                               Default: /srv/axiia-cup/current
  --remote-env <path>          Remote production env file
                               Default: /srv/axiia-cup/shared/config/production.env
  --local-env <path>           Optional local env file to upload to --remote-env
  --base-url <url>             Public URL for post-deploy smoke check.
                               Default: https://axiia-cup.isofucius.cn
  --bootstrap                  Run bootstrap-server.sh instead of deploy.sh
  --seed                       Pass --seed to deploy.sh
  --reset-data                 Stop containers, delete SQLite files, then bootstrap
  --skip-external-check        Skip the final public smoke check
  -h, --help                   Show this help

Examples:
  deploy/deploy-master.sh
  deploy/deploy-master.sh --host ubuntu@cup-server
  deploy/deploy-master.sh --host ubuntu@cup-server --ref origin/master
  deploy/deploy-master.sh --host ubuntu@cup-server --bootstrap --local-env ./deploy/production.env
  deploy/deploy-master.sh --host ubuntu@cup-server --base-url https://cup.axiia.ai
EOF
}

note() {
  printf '[deploy-master] %s\n' "$*"
}

die() {
  printf '[deploy-master] error: %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

wait_for_url() {
  local url="$1"
  local attempts="${2:-30}"
  local delay="${3:-2}"
  local attempt

  for ((attempt = 1; attempt <= attempts; attempt += 1)); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi

    sleep "${delay}"
  done

  die "Timed out waiting for ${url}"
}

HOST="${DEPLOY_HOST:-anna@120.55.38.143}"
REF="${DEPLOY_REF:-origin/master}"
REMOTE_DIR="${DEPLOY_APP_DIR:-/srv/axiia-cup/current}"
REMOTE_ENV="${DEPLOY_ENV_FILE:-/srv/axiia-cup/shared/config/production.env}"
LOCAL_ENV=""
BASE_URL="${DEPLOY_BASE_URL:-https://axiia-cup.isofucius.cn}"
BOOTSTRAP=0
WITH_SEED=0
RESET_DATA=0
SKIP_EXTERNAL_CHECK=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      HOST="${2:-}"
      shift 2
      ;;
    --ref)
      REF="${2:-}"
      shift 2
      ;;
    --remote-dir)
      REMOTE_DIR="${2:-}"
      shift 2
      ;;
    --remote-env)
      REMOTE_ENV="${2:-}"
      shift 2
      ;;
    --local-env)
      LOCAL_ENV="${2:-}"
      shift 2
      ;;
    --base-url)
      BASE_URL="${2:-}"
      shift 2
      ;;
    --bootstrap)
      BOOTSTRAP=1
      shift
      ;;
    --seed)
      WITH_SEED=1
      shift
      ;;
    --reset-data)
      RESET_DATA=1
      shift
      ;;
    --skip-external-check)
      SKIP_EXTERNAL_CHECK=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
done

if [[ -n "${LOCAL_ENV}" && ! -f "${LOCAL_ENV}" ]]; then
  die "Local env file not found: ${LOCAL_ENV}"
fi

if [[ "${BOOTSTRAP}" -eq 1 && "${WITH_SEED}" -eq 1 ]]; then
  die "--seed is redundant with --bootstrap"
fi

require_cmd git
require_cmd rsync
require_cmd ssh
require_cmd tar
require_cmd curl

note "Fetching remotes"
git fetch --all --prune --quiet

DEPLOY_SHA="$(git rev-parse --verify "${REF}^{commit}")" ||
  die "Git ref not found: ${REF}"
SHORT_SHA="$(git rev-parse --short "${DEPLOY_SHA}")"
SUBJECT="$(git log -1 --format=%s "${DEPLOY_SHA}")"

ARCHIVE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/axiia-deploy.XXXXXX")"
cleanup() {
  rm -rf "${ARCHIVE_DIR}"
}
trap cleanup EXIT

note "Preparing snapshot for ${REF} (${SHORT_SHA} ${SUBJECT})"
git archive "${DEPLOY_SHA}" | tar -xf - -C "${ARCHIVE_DIR}"

note "Ensuring remote paths exist"
ssh "${HOST}" "mkdir -p \"${REMOTE_DIR}\" \"$(dirname "${REMOTE_ENV}")\""

if [[ -n "${LOCAL_ENV}" ]]; then
  note "Uploading env file to ${HOST}:${REMOTE_ENV}"
  rsync -az "${LOCAL_ENV}" "${HOST}:${REMOTE_ENV}"
fi

note "Syncing snapshot to ${HOST}:${REMOTE_DIR}"
rsync -az --delete \
  --exclude '.git/' \
  "${ARCHIVE_DIR}/" "${HOST}:${REMOTE_DIR}/"

note "Running remote deploy orchestration"
ssh "${HOST}" bash -s -- \
  "${REMOTE_DIR}" "${REMOTE_ENV}" "${BOOTSTRAP}" "${WITH_SEED}" "${RESET_DATA}" <<'EOF'
set -euo pipefail

remote_dir="$1"
remote_env="$2"
bootstrap="$3"
with_seed="$4"
reset_data="$5"

die() {
  printf '[deploy-master] error: %s\n' "$*" >&2
  exit 1
}

require_remote_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command on remote host: $1"
}

test -f "${remote_env}" || die "Remote env file not found: ${remote_env}"

set -a
# shellcheck disable=SC1090
source "${remote_env}"
set +a

data_dir="${AXIIA_DATA_DIR%/}/api"
db_file="${data_dir}/axiia.db"
compose_file="${remote_dir}/deploy/docker-compose.prod.yml"
compose_cmd=(sudo docker compose --env-file "${remote_env}" -f "${compose_file}")

set_write_lock() {
  local locked="$1"

  sudo python3 - "${db_file}" "${locked}" <<'PY'
import sqlite3
import sys

db_path = sys.argv[1]
locked = sys.argv[2]

conn = sqlite3.connect(db_path)
conn.execute(
    """
    INSERT INTO appSettings(key, value)
    VALUES ('writeLock', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
    """,
    (locked,),
)
conn.commit()
conn.close()
PY
}

count_active_tasks() {
  sudo python3 - "${db_file}" <<'PY'
import sqlite3
import sys

db_path = sys.argv[1]
conn = sqlite3.connect(db_path)
match_count = conn.execute(
    "SELECT COUNT(*) FROM matches WHERE status IN ('queued', 'running', 'judging')"
).fetchone()[0]
playground_count = conn.execute(
    "SELECT COUNT(*) FROM playground_runs WHERE status IN ('queued', 'running')"
).fetchone()[0]
conn.close()
print(f"{match_count} {playground_count}")
PY
}

wait_for_active_tasks_to_drain() {
  local attempts="${1:-30}"
  local delay="${2:-10}"
  local attempt
  local match_count
  local playground_count

  for ((attempt = 1; attempt <= attempts; attempt += 1)); do
    read -r match_count playground_count < <(count_active_tasks)

    if [[ "${match_count}" == "0" && "${playground_count}" == "0" ]]; then
      return 0
    fi

    printf '[deploy-master] waiting for active tasks to drain (matches=%s playground_runs=%s, attempt %s/%s)\n' \
      "${match_count}" "${playground_count}" "${attempt}" "${attempts}"
    sleep "${delay}"
  done

  die "Active tasks are still running; aborting deploy"
}

unlock_write_lock() {
  if [[ -f "${db_file}" ]]; then
    set_write_lock 0 || true
  fi
}

cd "${remote_dir}"
chmod +x deploy/*.sh
require_remote_cmd docker
require_remote_cmd python3

printf '[deploy-master] building images on remote host\n'
"${compose_cmd[@]}" build

if [[ -f "${db_file}" ]]; then
  printf '[deploy-master] enabling write lock\n'
  set_write_lock 1
  trap unlock_write_lock EXIT
  wait_for_active_tasks_to_drain 30 10
else
  printf '[deploy-master] database not found at %s; skipping write lock\n' "${db_file}"
fi

if [[ "${reset_data}" == "1" ]]; then
  printf '[deploy-master] resetting SQLite data\n'
  "${compose_cmd[@]}" down
  sudo rm -f \
    "${data_dir}/axiia.db" \
    "${data_dir}/axiia.db-shm" \
    "${data_dir}/axiia.db-wal"
  bootstrap="1"
fi

if [[ "${bootstrap}" == "1" ]]; then
  ./deploy/bootstrap-server.sh --skip-build "${remote_env}"
else
  if [[ "${with_seed}" == "1" ]]; then
    ./deploy/deploy.sh --skip-build --seed "${remote_env}"
  else
    ./deploy/deploy.sh --skip-build "${remote_env}"
  fi
fi
EOF

if [[ "${SKIP_EXTERNAL_CHECK}" -eq 0 && -n "${BASE_URL}" ]]; then
  if [[ -n "${LOCAL_ENV}" ]]; then
    note "Running public smoke check against ${BASE_URL}"
    BASE_URL="${BASE_URL}" "${REPO_ROOT}/deploy/smoke-check.sh" "${LOCAL_ENV}"
  else
    note "Running lightweight public smoke check against ${BASE_URL}"
    wait_for_url "${BASE_URL}/health"
    wait_for_url "${BASE_URL}/api/meta"
  fi
fi

printf '\n'
note "Deploy complete"
note "Ref: ${REF}"
note "Commit: ${SHORT_SHA}"
note "Title: ${SUBJECT}"
if [[ "${RESET_DATA}" -eq 1 ]]; then
  note "Mode: reset-data"
elif [[ "${BOOTSTRAP}" -eq 1 ]]; then
  note "Mode: bootstrap"
else
  note "Mode: standard"
fi
