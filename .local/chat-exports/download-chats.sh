#!/bin/bash
# Download all chat messages from a Lark group with pagination
# Usage: ./download-chats.sh <chat_id> <output_file>

set -euo pipefail

CHAT_ID="$1"
OUTPUT="$2"
PAGE_TOKEN=""
PAGE=0
ALL_MESSAGES="[]"

echo "Downloading messages from chat: $CHAT_ID"

while true; do
  PAGE=$((PAGE + 1))
  echo "  Fetching page $PAGE..."

  if [ -z "$PAGE_TOKEN" ]; then
    RESULT=$(lark-cli im +chat-messages-list --chat-id "$CHAT_ID" --as bot --sort asc --page-size 50 --format json 2>&1)
  else
    RESULT=$(lark-cli im +chat-messages-list --chat-id "$CHAT_ID" --as bot --sort asc --page-size 50 --page-token "$PAGE_TOKEN" --format json 2>&1)
  fi

  # Check if request succeeded
  OK=$(echo "$RESULT" | jq -r '.ok')
  if [ "$OK" != "true" ]; then
    echo "  ERROR on page $PAGE: $RESULT"
    break
  fi

  # Extract messages from this page (field is .data.messages or .data.items)
  MESSAGES=$(echo "$RESULT" | jq '.data.messages // .data.items // []')
  COUNT=$(echo "$MESSAGES" | jq 'length')
  echo "  Got $COUNT messages on page $PAGE"

  # Merge into accumulated array
  ALL_MESSAGES=$(echo "$ALL_MESSAGES" "$MESSAGES" | jq -s '.[0] + .[1]')

  # Check for more pages
  HAS_MORE=$(echo "$RESULT" | jq -r '.data.has_more')
  if [ "$HAS_MORE" != "true" ]; then
    echo "  No more pages."
    break
  fi

  PAGE_TOKEN=$(echo "$RESULT" | jq -r '.data.page_token')

  # Safety: avoid infinite loop
  if [ $PAGE -gt 200 ]; then
    echo "  WARNING: Hit 200 page limit, stopping."
    break
  fi
done

TOTAL=$(echo "$ALL_MESSAGES" | jq 'length')
echo "Total messages downloaded: $TOTAL"

# Write to file
echo "$ALL_MESSAGES" | jq '.' > "$OUTPUT"
echo "Saved to $OUTPUT"
