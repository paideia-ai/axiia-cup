#!/usr/bin/env bash
# Compose the full analysis prompt (instructions + scenario + 17 participants)
# and run it in parallel through gemini -p and codex exec.
#
# Outputs:
#   .local/prod-prompts/shangyang-court/analysis/FULL_PROMPT.md
#   .local/prod-prompts/shangyang-court/analysis/gemini.out.md
#   .local/prod-prompts/shangyang-court/analysis/codex.out.md

set -euo pipefail

REPO_ROOT="/Users/yihan/LocalYihan/paideia/axiia-cup"
BASE="$REPO_ROOT/.local/prod-prompts/shangyang-court"
ANALYSIS="$BASE/analysis"

PROMPT_HEADER="$ANALYSIS/ANALYSIS_PROMPT.md"
SUBMISSIONS="$BASE/submissions.json"
FULL_PROMPT="$ANALYSIS/FULL_PROMPT.md"
GEMINI_OUT="$ANALYSIS/gemini.out.md"
CODEX_OUT="$ANALYSIS/codex.out.md"

# 1. Compose the full prompt: header + markdown-formatted participants
{
  cat "$PROMPT_HEADER"
  echo
  jq -r '
    .[]
    | "### user-\(.user.id) — \(.user.displayName)\n"
      + "- version: v\(.submission.version)\n"
      + "- models: \(.submission.modelA) / \(.submission.modelB)\n"
      + "- submittedAt: \(.submission.createdAt)\n\n"
      + "**promptA (as 商鞅):**\n```\n\(.submission.promptA)\n```\n\n"
      + "**promptB (as 甘龙):**\n```\n\(.submission.promptB)\n```\n"
  ' "$SUBMISSIONS"
} > "$FULL_PROMPT"

WC=$(wc -c < "$FULL_PROMPT")
echo "Composed prompt: $FULL_PROMPT ($WC bytes)" >&2

# 2. Run gemini and codex in parallel, each writing to their own output file
echo "Starting gemini..." >&2
(
  gemini -p "$(cat "$FULL_PROMPT")" > "$GEMINI_OUT" 2>"$ANALYSIS/gemini.err.log"
  echo "  gemini: done ($(wc -c < "$GEMINI_OUT") bytes)" >&2
) &
GEMINI_PID=$!

echo "Starting codex exec..." >&2
(
  codex exec - < "$FULL_PROMPT" > "$CODEX_OUT" 2>"$ANALYSIS/codex.err.log"
  echo "  codex: done ($(wc -c < "$CODEX_OUT") bytes)" >&2
) &
CODEX_PID=$!

wait "$GEMINI_PID" "$CODEX_PID"

echo "Both done." >&2
echo "  gemini → $GEMINI_OUT" >&2
echo "  codex  → $CODEX_OUT" >&2
