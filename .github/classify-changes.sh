#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: .github/classify-changes.sh

Classifies the current GitHub Actions event by which lane it touches.
Outputs the following GitHub Actions outputs when GITHUB_OUTPUT is set:
  - docs_only=true|false
  - v2_web_changed=true|false
  - v2_scenarios_changed=true|false

Docs-only means every changed file is either:
  - under docs/
  - or a root-level Markdown file such as README.md / AGENTS.md / CLAUDE.md

The lanes are independent. v2_scenarios_changed covers v2/scenarios (the scenario
scripts prompt engineers author, checked with deno and shipped through the admin
API). v2_web_changed covers the rest of v2/ (the Swift-server frontend, built with
deno and deployed to axiia-cup-2-web, plus its deploy assets and README).

A non-docs change outside v2/ — deploy host-ops, scripts, workflows — belongs to
no build lane and sets neither flag. The Check job passes on that, since there is
nothing left in this repository to build from it.

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

is_v2_scenarios_path() {
  [[ "$1" == v2/scenarios/* ]]
}

is_v2_path() {
  [[ "$1" == v2/* ]]
}

if [[ ${#files[@]} -eq 0 ]]; then
  docs_only=false
  v2_web_changed=true
  v2_scenarios_changed=false
  echo "No changed files detected; building v2 web to stay safe." >&2
else
  docs_only=true
  v2_web_changed=false
  v2_scenarios_changed=false
  echo "Changed files:" >&2
  for file in "${files[@]}"; do
    echo " - ${file}" >&2
    if is_docs_only_path "$file"; then
      continue
    fi
    docs_only=false
    if is_v2_scenarios_path "$file"; then
      v2_scenarios_changed=true
    elif is_v2_path "$file"; then
      v2_web_changed=true
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
emit v2_web_changed "$v2_web_changed"
emit v2_scenarios_changed "$v2_scenarios_changed"
