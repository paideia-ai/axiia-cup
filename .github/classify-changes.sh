#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: .github/classify-changes.sh

Classifies the current GitHub Actions event as docs-only or not.
Outputs the following GitHub Actions outputs when GITHUB_OUTPUT is set:
  - docs_only=true|false

Docs-only means every changed file is either:
  - under docs/
  - or a root-level Markdown file such as README.md / AGENTS.md / CLAUDE.md
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

require_env() {
  local name="$1"
  [[ -n "${!name:-}" ]] || {
    echo "Missing required environment variable: ${name}" >&2
    exit 1
  }
}

is_docs_only_path() {
  local path="$1"

  case "$path" in
    docs/*)
      return 0
      ;;
    *.md)
      [[ "$path" != */* ]]
      return
      ;;
    *)
      return 1
      ;;
  esac
}

collect_changed_files() {
  local event_name="$1"
  local before_sha="$2"
  local after_sha="$3"
  local pr_base_sha="$4"
  local pr_head_sha="$5"

  if [[ "$event_name" == "pull_request" ]]; then
    git diff --name-only -z "$pr_base_sha" "$pr_head_sha"
    return
  fi

  if [[ -n "$before_sha" && "$before_sha" != "0000000000000000000000000000000000000000" ]]; then
    git diff --name-only -z "$before_sha" "$after_sha"
    return
  fi

  if git rev-parse --verify "${after_sha}^" >/dev/null 2>&1; then
    git diff --name-only -z "${after_sha}^" "$after_sha"
    return
  fi

  git ls-tree --name-only -r -z "$after_sha"
}

require_env GITHUB_EVENT_NAME
require_env GITHUB_SHA

BEFORE_SHA="${GITHUB_EVENT_BEFORE:-}"
PR_BASE_SHA="${GITHUB_PR_BASE_SHA:-}"
PR_HEAD_SHA="${GITHUB_PR_HEAD_SHA:-}"

mapfile -d '' files < <(
  collect_changed_files \
    "$GITHUB_EVENT_NAME" \
    "$BEFORE_SHA" \
    "$GITHUB_SHA" \
    "$PR_BASE_SHA" \
    "$PR_HEAD_SHA"
)

if [[ ${#files[@]} -eq 0 ]]; then
  docs_only=false
  echo "No changed files detected; defaulting to docs_only=false." >&2
else
  docs_only=true
  echo "Changed files:" >&2
  for file in "${files[@]}"; do
    echo " - ${file}" >&2
    if ! is_docs_only_path "$file"; then
      docs_only=false
    fi
  done
fi

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  echo "docs_only=${docs_only}" >> "$GITHUB_OUTPUT"
fi

echo "docs_only=${docs_only}"
