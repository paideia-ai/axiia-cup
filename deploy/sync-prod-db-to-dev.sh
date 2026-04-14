#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: deploy/sync-prod-db-to-dev.sh [options]

Refresh the dev SQLite database from the current production database safely:
1. creates a consistent backup from the production DB using Python's sqlite3 backup API
2. writes the backup to a temporary dev DB file
3. sanitizes active worker/job state in the copied DB
4. atomically replaces the dev DB file
5. removes leftover -wal / -shm files for the dev DB

Options:
  --prod-env <path>           Production env file.
                              Default: /srv/axiia-cup/shared/config/production.env
  --dev-env <path>            Dev env file.
                              Default: /srv/axiia-cup/shared/config/development.env
  --note <message>            Note written into reset error fields.
  -h, --help                  Show this help text.
EOF
}

note() {
  printf '[sync-prod-db-to-dev] %s\n' "$*"
}

die() {
  printf '[sync-prod-db-to-dev] error: %s\n' "$*" >&2
  exit 1
}

PROD_ENV="${PROD_ENV_FILE:-/srv/axiia-cup/shared/config/production.env}"
DEV_ENV="${DEV_ENV_FILE:-/srv/axiia-cup/shared/config/development.env}"
RESET_NOTE="Refreshed from production snapshot for dev redeploy"

while [[ $# -gt 0 ]]; do
  case "${1:-}" in
    --prod-env)
      PROD_ENV="${2:-}"
      shift 2
      ;;
    --dev-env)
      DEV_ENV="${2:-}"
      shift 2
      ;;
    --note)
      RESET_NOTE="${2:-}"
      shift 2
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

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

load_env_var_from_file() {
  local env_file="$1"
  local var_name="$2"

  [[ -f "$env_file" ]] || die "Env file not found: $env_file"

  python3 - "$env_file" "$var_name" <<'PY'
import sys
from pathlib import Path

env_path = Path(sys.argv[1])
var_name = sys.argv[2]

for raw_line in env_path.read_text().splitlines():
    line = raw_line.strip()
    if not line or line.startswith('#') or '=' not in line:
        continue
    key, value = line.split('=', 1)
    if key == var_name:
        print(value)
        raise SystemExit(0)

raise SystemExit(1)
PY
}

require_cmd python3

PROD_DATA_DIR="$(load_env_var_from_file "$PROD_ENV" AXIIA_DATA_DIR || true)"
DEV_DATA_DIR="$(load_env_var_from_file "$DEV_ENV" AXIIA_DATA_DIR || true)"

[[ -n "$PROD_DATA_DIR" ]] || die "AXIIA_DATA_DIR missing in $PROD_ENV"
[[ -n "$DEV_DATA_DIR" ]] || die "AXIIA_DATA_DIR missing in $DEV_ENV"
[[ "$PROD_DATA_DIR" = /* ]] || die "Production AXIIA_DATA_DIR must be absolute: $PROD_DATA_DIR"
[[ "$DEV_DATA_DIR" = /* ]] || die "Dev AXIIA_DATA_DIR must be absolute: $DEV_DATA_DIR"

PROD_DB="${PROD_DATA_DIR%/}/api/axiia.db"
DEV_DB_DIR="${DEV_DATA_DIR%/}/api"
DEV_DB="${DEV_DB_DIR}/axiia.db"
TMP_DB="${DEV_DB}.tmp"

[[ -f "$PROD_DB" ]] || die "Production DB not found: $PROD_DB"
mkdir -p "$DEV_DB_DIR"

note "Creating consistent backup from $PROD_DB"
python3 - "$PROD_DB" "$TMP_DB" <<'PY'
import pathlib
import sqlite3
import sys

src_path = pathlib.Path(sys.argv[1])
dst_path = pathlib.Path(sys.argv[2])

if not src_path.is_file():
    raise SystemExit(f"Source DB not found: {src_path}")

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

note "Sanitizing copied DB state for dev"
python3 - "$TMP_DB" "$RESET_NOTE" <<'PY'
import sqlite3
import sys
from datetime import datetime, timezone

path = sys.argv[1]
reset_note = sys.argv[2]
now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')

conn = sqlite3.connect(path)
try:
    conn.execute("PRAGMA foreign_keys = ON")

    conn.execute(
        """
        INSERT INTO appSettings(key, value)
        VALUES ('writeLock', '0')
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
        """
    )

    conn.execute(
        """
        UPDATE matches
        SET status = 'error',
            error = CASE
              WHEN error IS NULL OR error = '' THEN ?
              ELSE error || ' | ' || ?
            END,
            lease_token = NULL,
            finished_at = COALESCE(finished_at, ?),
            updated_at = ?
        WHERE status IN ('queued', 'running', 'judging')
        """,
        (reset_note, reset_note, now, now),
    )

    conn.execute(
        """
        UPDATE playground_runs
        SET status = 'error',
            error = CASE
              WHEN error IS NULL OR error = '' THEN ?
              ELSE error || ' | ' || ?
            END,
            lease_token = NULL,
            finished_at = COALESCE(finished_at, ?),
            updated_at = ?
        WHERE status IN ('queued', 'running')
        """,
        (reset_note, reset_note, now, now),
    )

    conn.execute(
        """
        UPDATE rounds
        SET status = 'done'
        WHERE status IN ('pairing', 'running')
        """
    )

    conn.execute(
        """
        UPDATE tournaments
        SET status = 'terminated'
        WHERE status = 'running'
        """
    )

    conn.commit()
finally:
    conn.close()
PY

note "Replacing dev DB at $DEV_DB"
mv "$TMP_DB" "$DEV_DB"
rm -f "${DEV_DB}-wal" "${DEV_DB}-shm"

note "Dev DB refresh complete"
