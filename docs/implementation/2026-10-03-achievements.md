# Account achievements implementation

Baseline: axiia-cup d60bf3e; axiia-cup-v2 864543e. User approved all 31
remaining achievements, removing blank-prompt. Bounty means the initiator's
claimed win refund.

## Delivery sequence

1. Backend: immutable participant snapshots; committed settlement/claim events;
   ordered, restartable projection; unique account unlocks and notification
   links; authenticated catalogue and cursor-based events. Additive migrations
   preserve existing data.
2. Rules: all 31, fixed five-scenario/twelve-role manifest, structured verdict
   adapters, successful inference interval union, UTC+8 daily claims/losses,
   strict prompt eligibility. Version evidence and deterministic completion
   order.
3. Frontend: account card; gold/silver/bronze centre with redacted locked slots;
   global text-only toast linking to a new tab; notifications; original
   achievement cue using existing sound settings; account-scoped reconnect and
   cross-tab deduplication.
4. Verification: Store/Server/Actors contracts, migrations, frontend
   formatting/lint/types/unit/browser tests and real-server end-to-end journey.
   Local preview uses the built product and isolated data, never production
   credentials.
5. Delivery: rebase on current main, commit/push both codex/achievements
   branches, open linked PRs; keep local preview running and report its URL and
   reproducible seed instructions.

## Product contracts

All 31 enabled; no locked titles, descriptions, artwork URLs, flavour text or
progress in the authenticated response. Unlock records survive notification
deletion. Popup title + optional flavour only, six seconds, pause on
focus/hover, new-tab anchor. Account card navigates in the existing tab. Mobile
popup clears bottom navigation. Historical backfill is silent and uses only
supported evidence. Browser startup establishes a cursor without replaying old
unlocks; reconnect within a session resumes from the durable cursor. Award truth
is server-owned.

## Reproduce the local preview

Build the companion backend using its documented Bazel workflow, then from
`v2/web` run `bash e2e/run-achievements-preview.sh`. Set `AXIIA_SERVER_REPO` if
the backend checkout is not the sibling `axiia-cup-v2-achievements`. The
launcher creates an isolated temporary database, seeds through the actual
admin/player APIs, builds the canonical frontend and serves it at
`http://localhost:6248`. The backend listens only on `127.0.0.1:8127`.

Local-only accounts use password `achievement-preview-2026`:
`achievements@axiia.test` has earned gold/silver/bronze examples;
`fresh@axiia.test` starts with 31 hidden slots; `opponent@axiia.test` supplies
real defending versions. The registration code is `ACHIEVEMENT-PREVIEW`.

The production frontend and achievement backend are unchanged for this preview.
Only scenario execution is deterministic and model-free, so completing a match
does not need provider credentials or incur inference costs. These local scripts
preserve canonical scenario metadata and return explicit local-test verdicts;
they are never uploaded to production. Model-generated dialogue and the
30-minute achievement are covered by separate backend contracts rather than
simulated by UI fixtures.

Run the real browser acceptance journey with
`deno run -A npm:@playwright/test test --config playwright.achievements.config.ts`
while the preview is running. It creates a fresh account, verifies locked API
redaction, wins a real stored match, receives the toast, opens the centre in a
new tab, verifies the notification, claims the actual point refund, and confirms
achievement persistence after clearing notifications and reloading. It also
checks the mobile viewport for horizontal overflow.

Verification on 2026-10-03: the canonical frontend passed formatting, lint, both
TypeScript checks, 414 unit tests and 258 Storybook browser tests. The companion
backend passed 440 Store/Actors/Server/CLI tests and its Bazel executable build.
The real local-server Playwright journey passed, including refund-triggered
bounty and persistence. Desktop and 390px browser inspection found loaded
artwork, no page errors, no error overlay and no horizontal overflow.
