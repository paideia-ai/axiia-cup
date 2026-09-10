# Terra / Sol v3 failure review — 2026-09-09

This is an evidence summary, not a completed batch audit or a native-run claim.
Inspection used root transcripts, frozen contracts, append-only ledgers, and
read-only replay of accepted replies through each batch's frozen engine. Neither
batch was resumed or modified during diagnosis or the subsequent repository fix.

## Observed state

|                             | Terra                 | Sol                 |
| --------------------------- | --------------------- | ------------------- |
| Root configuration          | gpt-5.6-terra / high  | gpt-5.6-sol / xhigh |
| Complete games on replay    | 9 / 20 (001–008, 010) | 16 / 20 (001–016)   |
| Partially played            | 009, 011, 012         | 017, 018, 019       |
| Accepted reply records      | 822                   | 1,561               |
| Registered tool repairs     | 4                     | 6                   |
| Recorded execution failures | 1                     | 4                   |
| Whole-batch live audit      | Not completed         | Not completed       |

Both used the frozen script SHA
`eff7e92e5b1e7411b43babaf4377f9b688439474034a18667b7681ec7553d568`. Contract,
script, and ledger hash checks passed at inspection. This does not make
same-account local artifacts an independent tamperproof authority.

Raw transcripts and run artifacts are retained privately by the operator. This
public summary omits account paths and session identifiers; those artifacts are
not included in the repository. Counts below describe that inspection, not a
publicly reproducible audit of the private sessions.

## Failures and the changes they justify

| Evidence                                                                                                                                                                                       | Cause / boundary                                                                                                                                                       | v3.1 response                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Terra had 45 `task_complete` events; 26 final replies only said it was continuing. First final was at 2026-09-08 05:27 UTC after one completed game.                                           | Progress text was sent as a final answer. Subsequent work required user input or goal continuation.                                                                    | Explicit final-answer gate; `mustContinue` and `successFinalAllowed` in machine output; report premature controller finals separately. These fields cannot force a model to remain active.                                                      |
| Terra's root repeatedly extracted only `toSpawn.map(x => x.spawn)` (transcript line 12462). Game 009's extra-call issue surfaced to the controller only at 02:11 UTC.                          | Output filtering discarded `outcomes` and `action`.                                                                                                                    | Compact default step response retains blockers. A repair/inspection state returns no dispatches. Workflow forbids filtering fields or hiding subprocess session IDs.                                                                            |
| A child final and its terminal event flushed between separate reads.                                                                                                                           | Completion detection raced with logging.                                                                                                                               | Re-read/import the original actor before classifying recovery; never regenerate for this race.                                                                                                                                                  |
| Child discovery depended on filesystem mtime.                                                                                                                                                  | Copied/flushed log timestamps could hide an exact matching child.                                                                                                      | Identify by immutable metadata; still verify parent, path, UUID, and creation time.                                                                                                                                                             |
| Both batches encountered disappearing children / missing terminal records. Sol also lost a spawn acknowledgement.                                                                              | The runtime can stop between dispatch, acknowledgement, reply, and completion.                                                                                         | Separate lifecycle recovery paths with two later unfiltered registry observations; no timeout-only rerolls; preserve original finals; reject late contradictory execution during live audit. Registry absence is not proof of OS-process death. |
| Terra's last proposed no-op repair matched arbitrary code inside `text(...)`. A nested extra tool call also matched.                                                                           | A compatibility patch weakened provenance checks. The patch was not registered.                                                                                        | Literal-only bounded no-op parser, exact output matching, and immutable baseline guard tests run against candidate tools.                                                                                                                       |
| Sol's last root call was `step` at 2026-09-09 03:10:41 UTC (line 25091). The ledger imported three replies and reserved three tasks at 03:10:57, but no root tool result or dispatch followed. | The root execution/return path stopped after durable local progress. No success final or normal completion was recorded. The session process was absent at inspection. | Every step writes a ledger-bound checkpoint; repeat step after resuming the same root. It reconstructs reservations and imports, not cached instructions.                                                                                       |
| Terra retained a dead-process lock; its last repair was unregistered.                                                                                                                          | Abrupt process termination can skip cleanup.                                                                                                                           | Automatically archive only provably dead, same-host, same-root locks; never steal a live/foreign/unknown lock. Tool-version registration still applies.                                                                                         |
| Sol reached roughly 3,200 root tool calls and seven compactions.                                                                                                                               | A long per-reply orchestration chain has many interruption points.                                                                                                     | Keep complete actor inputs on disk, concise controller output, durable resume instructions, and no progress-only finals. Do not reduce actor isolation or the declared sample to shorten the run.                                               |

## What is NOT established

- Neither record proves that OpenAI deliberately shut the session down.
- Sol's available final runtime checks did not show a context-limit hit or a
  quota-limit marker. They do not identify the exact external termination cause.
- Passing synthetic tests is not evidence that Sol or Terra has now completed a
  fresh compliant 20-game run. That remains the next live validation.
- No retry is justified by an unwanted verdict, elapsed time alone, or an opaque
  encrypted prompt. Observable input/identity/reply checks remain mandatory.

## Remaining reliability limit

The runner cannot call collaboration tools or restart a dead Codex host by
itself. Self-repair works while a controller is running. An external host/user
must resume the original session after a process-level interruption. A new root
would change the declared experiment and needs a separately authorized
migration. Do not silently add a second controller, a background Codex process,
a scheduler, paid provider calls, or automatic cross-session takeover to satisfy
persistence.

The OpenAI Docs check confirmed that `codex resume SESSION_ID` continues an
existing interactive session; it is distinct from `fork`, which creates a new
chat. No automatic restart was installed. See the
[official CLI reference](https://learn.chatgpt.com/docs/developer-commands?surface=cli#codex-resume).

## Validation of this revision

- `node --test --test-reporter=spec tools/harbor-luna/*.test.mjs`: 58 passed,
  zero failures/skips. Includes a synthetic 20-game scheduler run; these are not
  new Luna games and do not establish a live 20-game completion rate.
- `deno lint tools/harbor-luna` and formatting checks passed.
- A deliberately weakened candidate verifier plus rewritten candidate tests was
  rejected by the frozen guard suite. The successful prior revision remained
  registered; failure did not silently adopt the candidate.
- Read-only checks using the new verifier accepted the existing original Luna
  replies from Terra's `game_009_a_13_0` and Sol's `game_016_b_8_0`. These are
  the real extra-`true` cases, not synthetic substitutes. No reply was
  regenerated or imported into either run.
- Engine SHA remains
  `953bbfe9b172c4c10aa926013e322c4aed0f98fb110dd95a6ecda050a9dcf8a5`; script SHA
  remains the value above. Existing run directories and their private tools were
  not updated. No new model run or external supervisor was started during
  implementation validation. This historical script SHA does not pin the
  repository's current scenario; each new batch freezes its selected checkout.
