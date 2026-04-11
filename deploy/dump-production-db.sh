#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

usage() {
  cat <<'EOF'
Usage:
  deploy/dump-production-db.sh [options]

Runs on your local machine and pulls a consistent backup of the production
SQLite database:
1. connects to the remote host over ssh
2. reads AXIIA_DATA_DIR from the remote production env file
3. creates a remote SQLite backup with Python's sqlite3 backup API
4. downloads that backup to your local machine with rsync
5. removes the remote temporary backup unless --keep-remote is set

Options:
  --host <user@server>         SSH target. Default: anna@cup-worker.isofucius.cn
  --remote-env <path>          Remote production env file
                               Default: /srv/axiia-cup/shared/config/production.env
  --remote-tmp-dir <path>      Remote temp directory for the backup file
                               Default: /tmp
  --output <path>              Exact local file path to write
  --output-dir <path>          Local directory when --output is omitted
                               Default: ./tmp/prod-db-dumps
  --keep-remote                Keep the remote temporary backup file
  -h, --help                   Show this help

Examples:
  deploy/dump-production-db.sh
  deploy/dump-production-db.sh --host ubuntu@cup-server
  deploy/dump-production-db.sh --output /tmp/axiia-prod.db
EOF
}

note() {
  printf '[dump-production-db] %s\n' "$*"
}

die() {
  printf '[dump-production-db] error: %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

HOST="${DEPLOY_HOST:-anna@cup-worker.isofucius.cn}"
REMOTE_ENV="${DEPLOY_ENV_FILE:-/srv/axiia-cup/shared/config/production.env}"
REMOTE_TMP_DIR="${DEPLOY_REMOTE_TMP_DIR:-/tmp}"
OUTPUT_PATH=""
OUTPUT_DIR="${DB_DUMP_DIR:-${REPO_ROOT}/tmp/prod-db-dumps}"
KEEP_REMOTE=0

while [[ $# -gt 0 ]]; do
  case "${1:-}" in
    --host)
      HOST="${2:-}"
      shift 2
      ;;
    --remote-env)
      REMOTE_ENV="${2:-}"
      shift 2
      ;;
    --remote-tmp-dir)
      REMOTE_TMP_DIR="${2:-}"
      shift 2
      ;;
    --output)
      OUTPUT_PATH="${2:-}"
      shift 2
      ;;
    --output-dir)
      OUTPUT_DIR="${2:-}"
      shift 2
      ;;
    --keep-remote)
      KEEP_REMOTE=1
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

require_cmd ssh
require_cmd rsync

umask 077

timestamp="$(date -u '+%Y%m%dT%H%M%SZ')"
host_slug="$(printf '%s' "${HOST##*@}" | tr -cs 'A-Za-z0-9._-' '-')"
default_filename="axiia-prod.${host_slug}.${timestamp}.db"

if [[ -z "${OUTPUT_PATH}" ]]; then
  mkdir -p "${OUTPUT_DIR}"
  OUTPUT_PATH="${OUTPUT_DIR%/}/${default_filename}"
else
  mkdir -p "$(dirname -- "${OUTPUT_PATH}")"
fi

REMOTE_TMP_PATH="${REMOTE_TMP_DIR%/}/${default_filename}"

note "Creating remote backup on ${HOST}:${REMOTE_TMP_PATH}"
ssh "${HOST}" bash -s -- "${REMOTE_ENV}" "${REMOTE_TMP_PATH}" <<'EOF'
set -euo pipefail

remote_env="$1"
remote_tmp_path="$2"

die() {
  printf '[dump-production-db] error: %s\n' "$*" >&2
  exit 1
}

require_remote_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command on remote host: $1"
}

test -f "${remote_env}" || die "Remote env file not found: ${remote_env}"
require_remote_cmd python3

set -a
# shellcheck disable=SC1090
source "${remote_env}"
set +a

[[ -n "${AXIIA_DATA_DIR:-}" ]] || die "AXIIA_DATA_DIR must be set in ${remote_env}"

db_file="${AXIIA_DATA_DIR%/}/api/axiia.db"
test -f "${db_file}" || die "Remote DB not found: ${db_file}"

mkdir -p "$(dirname -- "${remote_tmp_path}")"

python3 - "${db_file}" "${remote_tmp_path}" <<'PY'
import pathlib
import sqlite3
import sys

src_path = pathlib.Path(sys.argv[1])
dst_path = pathlib.Path(sys.argv[2])

if not src_path.is_file():
    raise SystemExit(f"Remote DB not found: {src_path}")

dst_path.parent.mkdir(parents=True, exist_ok=True)
if dst_path.exists():
    dst_path.unlink()

src = sqlite3.connect(f"file:{src_path}?mode=ro", uri=True)
dst = sqlite3.connect(str(dst_path))

try:
    src.backup(dst)
finally:
    dst.close()
    src.close()
PY
EOF

note "Downloading backup to ${OUTPUT_PATH}"
rsync -az "${HOST}:${REMOTE_TMP_PATH}" "${OUTPUT_PATH}"
chmod 600 "${OUTPUT_PATH}"

if [[ "${KEEP_REMOTE}" -eq 0 ]]; then
  note "Removing remote temporary backup"
  ssh "${HOST}" "rm -f \"${REMOTE_TMP_PATH}\""
else
  note "Keeping remote temporary backup at ${HOST}:${REMOTE_TMP_PATH}"
fi

note "Dump complete: ${OUTPUT_PATH}"
