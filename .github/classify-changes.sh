#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: .github/classify-changes.sh

Classifies the current GitHub Actions event by which stack it touches.
Outputs the following GitHub Actions outputs when GITHUB_OUTPUT is set:
  - docs_only=true|false
  - legacy_changed=true|false
  - v2_changed=true|false

Docs-only means every changed file is either:
  - under docs/
  - or a root-level Markdown file such as README.md / AGENTS.md / CLAUDE.md

The two stacks are independent: v2_changed covers v2/ (the Swift-server frontend,
built with deno and deployed to axiia-cup-2-web), legacy_changed covers every
other non-docs file (the bun API and web). A commit can set both.

Jobs gate on these flags rather than the workflow using paths-ignore: the branch
ruleset requires the `Check` context, and a workflow skipped by a path filter
never reports it, which blocks the PR forever.
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

is_v2_path() {
  [[ "$1" == v2/* ]]
}

if [[ ${#files[@]} -eq 0 ]]; then
  docs_only=false
  legacy_changed=true
  v2_changed=false
  echo "No changed files detected; building the legacy stack to stay safe." >&2
else
  docs_only=true
  legacy_changed=false
  v2_changed=false
  echo "Changed files:" >&2
  for file in "${files[@]}"; do
    echo " - ${file}" >&2
    if is_docs_only_path "$file"; then
      continue
    fi
    docs_only=false
    if is_v2_path "$file"; then
      v2_changed=true
    else
      legacy_changed=true
    fi
  done
fi

emit() {
  echo "$1=$2"
  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    echo "$1=$2" >> "$GITHUB_OUTPUT"
  fi
}

emit docs_only "$docs_only"
emit legacy_changed "$legacy_changed"
emit v2_changed "$v2_changed"
