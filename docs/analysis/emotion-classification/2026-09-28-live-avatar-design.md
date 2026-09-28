# Live emotion portraits and timed playback

Date: 2026-09-28. This document records the agreed implementation, replacing the
earlier global-neutral proposal.

## User-visible behavior

1. A generating reply retains the neutral portrait and the existing thinking /
   “正在斟酌措辞…” placeholder. Its text deltas are buffered.
2. The accepted complete **human-visible output** is classified once. Reasoning
   traces, rejected attempts, tool instructions and private control decisions
   are excluded.
3. At completion, allow up to 200 ms for JEV and the selected original portrait
   to become ready. When both are ready, switch portrait and start text playback
   together.
4. Otherwise start playback with neutral at the deadline. Accept a late portrait
   within 1 second of completion; do not restart or accelerate playback. After
   that, this output stays neutral in the current viewing session. A server
   classification received after its deadline is durably unavailable and stays
   neutral on reload too.
5. Each output has independent state. A provider outage never resets portraits
   already selected for other outputs.
6. Replay the original text chunk intervals, measured from the first text chunk.
   Do not replay initial reasoning time. No full-text button and no long-text
   acceleration. When a provider supplies only a complete text snapshot, show
   that snapshot after the gate; there is no measured streaming cadence to
   replay.
7. Keep all portrait files at their original resolution. Missing expressions
   fall back to the character's neutral asset. Current assets contain neutral
   portraits only.

## Timing and perceived latency

LLM generation, classification and browser playback have separate lifecycles.
The server continues subsequent turns without waiting for JEV or browser
playback. Sequential visible replies retain their order; ballots delivered
together can replay concurrently, and private chat messages retain their
sequence.

Whole-output classification necessarily delays the first visible text until
generation completes. The 200 ms budget is additional classification waiting,
not a bound on this initial delay. Playback can overlap later generation, so
ordinary serial turns usually produce a relatively stable viewing lag. This does
not guarantee that every match is only a few seconds slower: parallel
production, slow networks, and unusually long replies can create a queue. We do
not speed up text to hide that queue.

## Backend contract (sibling axiia-cup-v2)

- Preserve a stable `outputRef` on accepted say/act replies, timeline turns,
  verdicts and explicitly published event messages.
- Save cumulative UTF-16 text offsets and elapsed milliseconds from provider
  text chunks. Structured acts project offsets onto their visible fields.
- `ActSpec.emotionFields` explicitly declares visible fields; it does not alter
  model instructions or session context. Old scripts remain compatible.
- Atomically enqueue classification with the accepted journal entry. Journal
  retries do not enqueue a second output. Affordance-only replies and malformed
  attempts are not jobs.
- A bounded background worker calls TypeSafe `/v1/systemone` with model
  `jev-1.13.0` and the frozen `astra-emotion10-en-v1` prompt. Only E01–E10 are
  accepted. Never impose a frequency quota.
- Each job has a 1 second deadline measured from the accepted-output
  transaction, including queue time. Store settlement is conditional and
  terminal: late or invalid results become unavailable. A short provider
  cooldown limits repeated failures without modifying previous results.
- Match detail includes an emotion snapshot and playback metadata. An
  authenticated `/v1/matches/:id/emotions` SSE stream sends snapshots
  independently of the ordinary match stream, so final classification can arrive
  after match completion. Subscription precedes the initial read; reconnect
  fetches current durable state.
- The snapshot includes only output references present in the readable timeline
  or verdicts. Unpublished private acts cannot leak through the emotion
  endpoint. Match visibility follows existing authorization.
- `AXIIA_JEV_API_KEY` enables the feature. No credential reaches the browser.
  Without configuration, existing live streaming stays enabled.

A private reply may be classified before its containing conversation is published.
A durable ready result present on the first display remains valid; it receives a
local 200 ms image gate and at most 1 second for decoding. This does not reopen
an expired pending classification or a previously neutral-locked output.

## Frontend

A match-scoped playback store survives row remounts and transcript refreshes. It
owns release times, serial ordering, image readiness, terminal neutral decisions
and chunk positions. Hooks subscribe to individual output state; the match page
subscribes only to whether playback remains pending. Finishing the backend does
not prematurely replace ongoing playback with the finished report.

`OutputBoundary` shares a single presentation state between portrait and body.
It wraps ordinary dialogue, judge asides, verdicts, inquiries, public jury
speech, private messages and individual ballots. Structured values reveal
according to their position in the visible projection; translated labels wait
for their source value.

Original assets are decoded ahead of use for visible characters. Naming
convention:

```
src/assets/portraits/<scenario>/<character>-<emotion>.webp
```

Emotion suffixes: `neutral`, `conviction`, `doubt`, `confusion`, `fear`,
`anger`, `contempt`, `sadness`, `affection`, `relief`, corresponding to E01–E10.
Vite fingerprints the original files. No derivative thumbnails are generated.

Historical rows open with complete text. Existing terminal classifications
remain usable. No retrospective classification of old matches occurs. Existing
historical match replay controls are separate from new live chunk playback.

## Verification and preview

The deterministic playback tests cover the 200 ms gate, early synchronized
start, late update, 1 second cutoff, slow image decoding, replay cadence, serial
ordering, stale snapshots, provider failure isolation and historical reloads.
Backend tests cover provider request/response shape, visible-field projection,
idempotent enqueue, durable expiry and authorization.

Build the isolated product-component preview with
`deno task preview:emotion:build` in `v2/web`. It offers 80 ms, 650 ms, 1400 ms
and unavailable provider cases. It uses the actual playback components and
neutral original art; the category readout belongs only to the preview, not the
product UI.

## Rollout

Backend, scenario and frontend changes are coordinated across two repositories.
Deploy backend support and configure the key, then upload the new
content-addressed scenarios and deploy the frontend. Existing matches stay
pinned to their original scripts. Add the finished expression originals under
the naming convention above when available. Production deployment and live
provider credentials are outside this code-only delivery; the cloud preview uses
simulated classifications.
