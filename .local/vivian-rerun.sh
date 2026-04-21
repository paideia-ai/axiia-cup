#!/bin/bash
# Vivian(78) vs all 6 opponents, both roles, 1 match per round
# Round 1-6: Vivian as 商鞅(sub_a), opponent as 甘龙(sub_b)
# Round 7-12: opponent as 商鞅(sub_a), Vivian as 甘龙(sub_b)

set -euo pipefail

API="https://cup-dev-114514.isofucius.cn"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlzQWRtaW4iOnRydWUsImlhdCI6MTc3NjIzMzA4MywiZXhwIjoxNzc2ODM3ODgzfQ.5MDKELeHewaQOSanLUjqPQCR4akG9IiwJy5_7P-cWD0"
TID=12
VIVIAN=78
OPPONENTS=(177 193 165 103 167 171)
NAMES=("Kurt" "yisiliu" "Ariana" "kesou" "Meryl马" "260410")
POLL_INTERVAL=8

auth_header="Authorization: Bearer $TOKEN"

create_round() {
  local sub_a=$1 sub_b=$2
  curl -s -X POST "$API/api/admin/tournaments/$TID/create-round" \
    -H "$auth_header" \
    -H "Content-Type: application/json" \
    -d "{\"pairs\":[[$sub_a,$sub_b]]}"
}

poll_round() {
  local round_num=$1
  while true; do
    local data
    data=$(curl -s "$API/api/tournaments/$TID" -H "$auth_header")
    local status
    status=$(echo "$data" | jq -r ".rounds[] | select(.roundNumber == $round_num) | .status")
    if [ "$status" = "done" ]; then
      break
    fi
    sleep "$POLL_INTERVAL"
  done
}

echo "=== Vivian Rerun: Tournament $TID ==="
echo ""

# Rounds 1-6: Vivian as 商鞅 (sub_a)
for i in "${!OPPONENTS[@]}"; do
  round=$((i + 1))
  opp=${OPPONENTS[$i]}
  name=${NAMES[$i]}
  echo "Round $round: Vivian(商鞅) vs $name(甘龙) [$VIVIAN vs $opp]"
  result=$(create_round $VIVIAN $opp)
  error=$(echo "$result" | jq -r '.error // empty')
  if [ -n "$error" ]; then
    echo "  ERROR: $error"
    exit 1
  fi
  echo "  Created, polling..."
  poll_round "$round"
  echo "  Done!"
done

# Rounds 7-12: Vivian as 甘龙 (sub_b)
for i in "${!OPPONENTS[@]}"; do
  round=$((i + 7))
  opp=${OPPONENTS[$i]}
  name=${NAMES[$i]}
  echo "Round $round: $name(商鞅) vs Vivian(甘龙) [$opp vs $VIVIAN]"
  result=$(create_round $opp $VIVIAN)
  error=$(echo "$result" | jq -r '.error // empty')
  if [ -n "$error" ]; then
    echo "  ERROR: $error"
    exit 1
  fi
  echo "  Created, polling..."
  poll_round "$round"
  echo "  Done!"
done

echo ""
echo "=== All 12 matches complete ==="
echo ""

# Fetch final results
echo "Fetching match results..."
DATA=$(curl -s "$API/api/tournaments/$TID" -H "$auth_header")
echo "$DATA" | jq '[.rounds[] | .matches[] | {
  round: .roundId,
  subA: .subAId,
  subB: .subBId,
  winner: .winner,
  scoreA: .scoreA,
  scoreB: .scoreB
}]'
