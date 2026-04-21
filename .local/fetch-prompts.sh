#!/usr/bin/env bash
# Fetch the latest submission (including promptA / promptB) for every
# participant of a given scenario in Axiia Cup production.
#
# Requires: .local/prod.env (AXIIA_API_URL + AXIIA_AUTH_TOKEN for an admin).
#
# Output: .local/prod-prompts/<scenario>/
#   - players.json        raw players list
#   - submissions.json    array of {user, submission} with promptA/B/modelA/B
#   - users/<id>-<name>.json    one file per user

set -euo pipefail

SCENARIO="${1:-shangyang-court}"
REPO_ROOT="/Users/yihan/LocalYihan/paideia/axiia-cup"
ENV_FILE="$REPO_ROOT/.local/prod.env"
OUT_DIR="$REPO_ROOT/.local/prod-prompts/$SCENARIO"

# shellcheck source=/dev/null
source "$ENV_FILE"

mkdir -p "$OUT_DIR/users"

# 1. Grab the players list via CLI
cd "$REPO_ROOT/apps/cli"
bun run ./src/index.ts players --scenario "$SCENARIO" > "$OUT_DIR/players.json"

COUNT=$(jq -r '.count' "$OUT_DIR/players.json")
echo "Found $COUNT participants for $SCENARIO" >&2

# 2. For each participant, fetch their latest submission via admin impersonation
: > "$OUT_DIR/submissions.jsonl"

jq -c '.items[]' "$OUT_DIR/players.json" | while read -r row; do
  USER_ID=$(jq -r '.user.id' <<<"$row")
  DISPLAY_NAME=$(jq -r '.user.displayName' <<<"$row")
  EMAIL=$(jq -r '.user.email' <<<"$row")
  SUB_ID=$(jq -r '.submission.id' <<<"$row")
  EXPECTED_VERSION=$(jq -r '.submission.version' <<<"$row")

  # Sanitize name for filename
  SAFE_NAME=$(printf '%s' "$DISPLAY_NAME" | tr -c 'A-Za-z0-9_-' '_' | sed 's/__*/_/g')

  RESP=$(curl -sS \
    -H "Authorization: Bearer $AXIIA_AUTH_TOKEN" \
    "$AXIIA_API_URL/api/submissions/my/$SCENARIO?asUserId=$USER_ID")

  # API returns submissions ordered by version DESC. Pick the one with id = SUB_ID
  # (falls back to the first entry if no exact match — shouldn't happen).
  LATEST=$(jq --argjson sid "$SUB_ID" 'map(select(.id == $sid)) | .[0] // .[0]' <<<"$RESP")

  if [[ "$LATEST" == "null" || -z "$LATEST" ]]; then
    echo "  ! no submission for user $USER_ID ($DISPLAY_NAME)" >&2
    continue
  fi

  # Merge user meta onto the submission
  MERGED=$(jq -n \
    --arg email "$EMAIL" \
    --arg display "$DISPLAY_NAME" \
    --argjson uid "$USER_ID" \
    --argjson sub "$LATEST" \
    '{user: {id: $uid, displayName: $display, email: $email}, submission: $sub}')

  printf '%s\n' "$MERGED" >> "$OUT_DIR/submissions.jsonl"
  printf '%s\n' "$MERGED" | jq '.' > "$OUT_DIR/users/${USER_ID}-${SAFE_NAME}.json"

  VER=$(jq -r '.submission.version' <<<"$MERGED")
  echo "  - user $USER_ID ($DISPLAY_NAME) -> submission $SUB_ID v$VER" >&2
done

# 3. Also write a combined JSON array for convenience
jq -s '.' "$OUT_DIR/submissions.jsonl" > "$OUT_DIR/submissions.json"

echo "Done. Output at: $OUT_DIR" >&2
