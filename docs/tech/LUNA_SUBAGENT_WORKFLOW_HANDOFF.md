# Luna Subagent Workflow — cross-server handoff

## Purpose and current state

The user wants several fresh sessions on another server to test whether the
workflow follows its specification and completes 20 full games per session. This
is a handoff for the receiving setup/review agent, not an instruction to resume
any previous experiment.

- Remote repository: https://github.com/paideia-ai/axiia-cup
- Remote branch: `luna-subagent-workflow`
- Starting main commit: `1e5ee9c09f10b49f65f3aab0bc174413ec653893`.
- [PR #171](https://github.com/paideia-ai/axiia-cup/pull/171) is merged. The
  workflow implementation comes directly from that main commit.
- This branch adds handoff and validation artifacts only. No scenario, runtime,
  prompt, or GitHub Actions configuration changes were made for this transfer.
- No new live game batch was run during this handoff.

Everything needed to prepare new trials is committed here. Do not depend on the
previous machine's paths, agent memory, ignored files, or private repositories.

## Read these artifacts

Paths are relative to the repository root:

- `AGENTS.md`: repository instructions.
- `docs/tech/LEGAL_HARBOR_LUNA_WORKFLOW.md`: authoritative operating procedure,
  shared launch prompt, recovery policy, and completion audit.
- `docs/tech/LEGAL_HARBOR_WORKFLOW_FAILURE_REVIEW.md`: historical failure
  analysis and limits of the evidence. Do not treat it as a new live validation.
- `docs/tech/luna-subagent-workflow-evidence/README.md`: current baseline,
  reproducible checks, and what was deliberately not transferred.
- `tools/harbor-luna/`: five runtime modules and three test files.

Refer to those artifacts rather than inventing a second procedure.

## Next actions on the receiving server

1. Check out this remote branch in a clean dedicated checkout. Record
   `git rev-parse HEAD`. Do not overwrite an existing dirty checkout.
2. Read the artifacts above and run the local checks in the evidence README.
   Verify its SHA-256 manifest from the repository root.
3. Confirm Node.js 22+ and a local Codex session runtime with readable
   root/child JSONL logs. The implementation reads `CODEX_THREAD_ID` and
   `CODEX_HOME/sessions` (default: the user's `.codex/sessions`). These must
   identify the real current runtime; do not fabricate IDs or logs. The runtime
   must expose the subagent tools and requested model/effort controls. A Git
   checkout alone does not supply them.
4. Prepare the launch prompt from the workflow document, substituting this
   server's absolute checkout path. Have all comparison sessions use the same
   checkout, revision, and manifest script SHA. Use the workflow's
   `--expected-script-sha` option at initialization to enforce that baseline.
5. The intended comparison is one fresh root per controller model (Sol, Terra,
   Luna), each with its own 20-game batch. The user selects controller effort.
   The role actors remain fresh Luna/medium regardless of controller model. The
   user opens those sessions; do not turn this setup agent into a
   multi-controller supervisor or launch all batches as its child agents.
6. Each test root follows the workflow's read-only `locate` before `init`, and
   uses a unique non-existing local run directory. Do not spawn readiness or
   warmup children. After initialization, use only that batch's private runner.
   Do not update the shared checkout during the comparison.
7. When the user requests review, inspect the new server's run artifacts and
   actual session logs. Report whole-game completion, live-audit status,
   repairs/retries, premature finals, and genuine blockers separately. A partial
   run is not a passing 20-game trial.

For this handoff, prepare the environment and prompts first. Starting model
games requires the user's execution request in each dedicated test session.

## Decisions to preserve

- Repair ordinary orchestration/transport faults and continue the same batch. Do
  not silently relax provenance checks or change game semantics to finish.
- User explicitly declined adding GitHub-triggered automatic tests. Keep the
  local tests: they also support validation of self-repairs.
- Do not promise uninterrupted execution after the host process has stopped.
  Branch transfer starts new trials; it is not migration of an old root.
- Preserve all declared games and failures. Do not reroll based on verdicts,
  hide pre-runs, replace seeds, or claim checks that are unobservable.
- Keep new raw logs and run artifacts local/private. This is a public
  repository. A later request to publish evidence requires a scoped, redacted
  export.
- No production access, deployment, paid provider API calls, background
  supervisor, or cross-root takeover is part of this transfer.

## Suggested skills

Use the receiving environment's skill mechanism if these skills are available;
the workflow itself does not require installing them.

- `handoff`: use when handing this work to another session. It was used to
  produce this document, with the user's explicit remote-branch requirement
  overriding its usual temporary-directory-only destination.
- `openai-docs`: use only if Codex runtime configuration, tool support, or
  session-resume behavior needs investigation on the receiving server.

Do not assume the old machine's skill files are present. Missing optional skills
must not be mistaken for missing workflow runtime modules.
