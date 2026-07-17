#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: bash .local/deploy-master.sh [options]

Deploy a committed Git ref to the production server using rsync + Docker Compose.
By default, this deploys origin/main and preserves existing SQLite data.

Options:
  --ref <git-ref>              Git ref to deploy. Default: origin/main
  --host <ssh-target>          SSH target. Default: anna@120.55.38.143
  --app-dir <remote-path>      Remote app dir. Default: /srv/axiia-cup/current
  --env-file <remote-path>     Remote production env file.
                               Default: /srv/axiia-cup/shared/config/production.env
  --data-dir <remote-path>     Remote SQLite dir. Default: /srv/axiia-cup/shared/data/api
  --compose-file <path>        Compose file path relative to app dir.
                               Default: deploy/docker-compose.prod.yml
  --domain <domain>            Public domain for external smoke checks.
                               Default: axiia-cup.isofucius.cn
  --reset-data                 Drop SQLite data files and re-seed after deploy.
  --skip-external-check        Skip the final HTTPS smoke check against the public domain.
  -h, --help                   Show this help text.
EOF
}

require_cmd() {
  local cmd=$1
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd" >&2
    exit 1
  fi
}

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)

REF="${DEPLOY_REF:-origin/main}"
HOST="${DEPLOY_HOST:-anna@120.55.38.143}"
APP_DIR="${DEPLOY_APP_DIR:-/srv/axiia-cup/current}"
ENV_FILE="${DEPLOY_ENV_FILE:-/srv/axiia-cup/shared/config/production.env}"
DATA_DIR="${DEPLOY_DATA_DIR:-/srv/axiia-cup/shared/data/api}"
COMPOSE_FILE="${DEPLOY_COMPOSE_FILE:-deploy/docker-compose.prod.yml}"
DOMAIN="${DEPLOY_DOMAIN:-axiia-cup.isofucius.cn}"
RESET_DATA=0
SKIP_EXTERNAL_CHECK=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --ref)
      REF=$2
      shift 2
      ;;
    --host)
      HOST=$2
      shift 2
      ;;
    --app-dir)
      APP_DIR=$2
      shift 2
      ;;
    --env-file)
      ENV_FILE=$2
      shift 2
      ;;
    --data-dir)
      DATA_DIR=$2
      shift 2
      ;;
    --compose-file)
      COMPOSE_FILE=$2
      shift 2
      ;;
    --domain)
      DOMAIN=$2
      shift 2
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
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

require_cmd git
require_cmd rsync
require_cmd ssh
require_cmd tar
require_cmd curl

wait_for_url() {
  local url=$1
  local attempts=${2:-30}
  local delay=${3:-2}
  local attempt

  for ((attempt = 1; attempt <= attempts; attempt += 1)); do
    if curl -fsS "$url" >/dev/null; then
      return 0
    fi

    sleep "$delay"
  done

  echo "Timed out waiting for $url" >&2
  return 1
}

cd "$ROOT_DIR"

echo "Fetching remotes..."
git fetch --all --prune --quiet

DEPLOY_SHA=$(git rev-parse --verify "${REF}^{commit}")
SHORT_SHA=$(git rev-parse --short "$DEPLOY_SHA")
SUBJECT=$(git log -1 --format=%s "$DEPLOY_SHA")

ARCHIVE_DIR=$(mktemp -d "${TMPDIR:-/tmp}/axiia-deploy.XXXXXX")
cleanup() {
  rm -rf "$ARCHIVE_DIR"
}
trap cleanup EXIT

echo "Preparing deployment snapshot for $SHORT_SHA ($SUBJECT)..."
git archive "$DEPLOY_SHA" | tar -xf - -C "$ARCHIVE_DIR"

echo "Syncing files to $HOST:$APP_DIR ..."
ssh "$HOST" "mkdir -p '$APP_DIR'"
rsync -az --delete "$ARCHIVE_DIR"/ "$HOST:$APP_DIR/"

echo "Building and updating containers on $HOST ..."
ssh "$HOST" bash -s -- \
  "$APP_DIR" \
  "$ENV_FILE" \
  "$DATA_DIR" \
  "$COMPOSE_FILE" \
  "$RESET_DATA" \
  <<'REMOTE'
set -euo pipefail

app_dir=$1
env_file=$2
data_dir=$3
compose_file=$4
reset_data=$5
db_file="$data_dir/axiia.db"

compose_cmd=(sudo docker compose --env-file "$env_file" -f "$compose_file")

wait_for_url() {
  local url=$1
  local attempts=${2:-30}
  local delay=${3:-2}
  local attempt

  for ((attempt = 1; attempt <= attempts; attempt += 1)); do
    if curl -fsS "$url" >/dev/null; then
      return 0
    fi

    sleep "$delay"
  done

  echo "Timed out waiting for $url" >&2
  return 1
}

require_remote_cmd() {
  local cmd=$1
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command on remote host: $cmd" >&2
    exit 1
  fi
}

set_write_lock() {
  local locked=$1

  sudo python3 - "$db_file" "$locked" <<'PY'
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
  sudo python3 - "$db_file" <<'PY'
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
  local attempts=${1:-30}
  local delay=${2:-10}
  local attempt
  local match_count
  local playground_count

  for ((attempt = 1; attempt <= attempts; attempt += 1)); do
    read -r match_count playground_count < <(count_active_tasks)

    if [[ "$match_count" == "0" && "$playground_count" == "0" ]]; then
      return 0
    fi

    echo "Waiting for active tasks to drain (matches=$match_count playground_runs=$playground_count, attempt $attempt/$attempts)..."
    sleep "$delay"
  done

  echo "Active tasks are still running after $((attempts * delay)) seconds; aborting deploy." >&2
  return 1
}

unlock_write_lock() {
  if [[ -f "$db_file" ]]; then
    set_write_lock 0 || true
  fi
}

cd "$app_dir"
require_remote_cmd python3

echo "Building images before enabling write lock..."
"${compose_cmd[@]}" build

if [[ -f "$db_file" ]]; then
  echo "Enabling write lock..."
  set_write_lock 1
  trap unlock_write_lock EXIT

  wait_for_active_tasks_to_drain 30 10
else
  echo "SQLite database not found at $db_file; skipping write lock and active-task drain."
fi

if [[ "$reset_data" == "1" ]]; then
  echo "Resetting SQLite data..."
  "${compose_cmd[@]}" down
  sudo rm -f \
    "$data_dir/axiia.db" \
    "$data_dir/axiia.db-shm" \
    "$data_dir/axiia.db-wal"
  "${compose_cmd[@]}" up -d
  "${compose_cmd[@]}" exec -T api bun run ./apps/api/src/db/seed.ts
else
  "${compose_cmd[@]}" up -d
fi

"${compose_cmd[@]}" ps
wait_for_url http://127.0.0.1:8200/health
wait_for_url http://127.0.0.1:8200/api/meta
REMOTE

if [[ "$SKIP_EXTERNAL_CHECK" == "0" ]]; then
  echo "Running external smoke checks against https://$DOMAIN ..."
  wait_for_url "https://$DOMAIN/health"
  wait_for_url "https://$DOMAIN/api/meta"
fi

echo
echo "Deploy complete."
echo "Ref:    $REF"
echo "Commit: $SHORT_SHA"
echo "Title:  $SUBJECT"
if [[ "$RESET_DATA" == "1" ]]; then
  echo "Mode:   reset-data (SQLite recreated and re-seeded)"
else
  echo "Mode:   preserve-data"
fi
