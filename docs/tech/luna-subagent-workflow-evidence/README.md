# Handoff validation evidence

This directory records local software validation for the cross-server handoff.
It contains no live model outputs or account logs.

## Baseline

- Base: main commit `1e5ee9c09f10b49f65f3aab0bc174413ec653893`.
- Workflow: v3.1, as merged in PR #171.
- Environment used here: Linux, Node.js v22.22.2, Deno 2.9.1.
- Exact scenario, runtime, and test hashes: [SHA256SUMS](SHA256SUMS).
- Full captured test output: [node-tests.txt](node-tests.txt).
- Result: 58 passed; 0 failed, cancelled, skipped, or todo.
- Deno lint, formatting checks, and Git whitespace checks also passed.

The tests include synthetic scheduling and real-script engine fixtures. They do
not dispatch Luna, consume model API calls, or demonstrate a new 20-game live
completion. Future sessions must produce their own evidence.

## Reproduce from repository root

Node.js 22+ is required for the workflow and its tests. No npm install, provider
credentials, Swift server, database, or frontend setup is required for these
local checks. Deno is only needed for the lint/format checks below.

```bash
sha256sum -c docs/tech/luna-subagent-workflow-evidence/SHA256SUMS
node --test --test-reporter=spec tools/harbor-luna/*.test.mjs
deno lint tools/harbor-luna
deno fmt --check tools/harbor-luna docs/tech/LEGAL_HARBOR_LUNA_WORKFLOW.md docs/tech/LEGAL_HARBOR_WORKFLOW_FAILURE_REVIEW.md
git diff --check
```

The manifest describes this handoff baseline, not a security boundary. If source
hashes differ, investigate before starting a comparison; do not silently update
the manifest to conceal a different baseline.

## Historical evidence boundary

See [the failure review](../LEGAL_HARBOR_WORKFLOW_FAILURE_REVIEW.md) for the
earlier Terra/Sol observations and their corresponding regression fixes. Their
historical scenario SHA differs from this branch's current-main script SHA. Do
not copy the historical hash into a new initialization command or compare those
game outcomes as if the scenarios were identical.

The branch preserves that redacted summary, runnable regression fixtures,
current hashes, and this test output. It intentionally does not contain raw
root/child transcripts, old run directories, personal paths, or credentials. The
receiving server can reproduce software tests and conduct new trials, but cannot
independently re-audit those old private sessions from this branch alone. No
claims about fraudulent behavior or the exact external shutdown cause were
established by the available evidence.
