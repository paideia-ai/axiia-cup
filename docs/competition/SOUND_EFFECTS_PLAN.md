# Sound effects plan

Status: design proposal with a local interactive demo now implemented. See
`v2/web/src/demo/README.md` for the delivered scope, validation, and remaining
production integration work. The confirmed base palette is 清透轻点, using
original synthesized audio buffers. The selected reward is the exact B sample,
原速 · 收高频, from session `01a08aa3-7398-7fa2-b7c1-224e32a64388`; all prior
reward candidates in this worktree were removed. Model replies now use a lower,
quieter 65 ms tap. The reward preview simulates a claim without a real points API.
Baseline: remote `main` at `e6de29f`, fetched 2026-09-10.
The full frontend journey is implemented locally; see
`v2/web/src/demo/journey/README.md`.
Worktree: `/home/kesou/axiia-cup-sound-effects-20260910`.
Branch: `codex/sound-effects-20260910`.

## Experience

Make the loop of editing, committing a strategy, launching a game, and seeing
its result feel satisfying. Use Slay the Spire and Balatro as references for
short, tactile, precisely timed feedback. Create an original family of sounds:
clean plucked tones, a little tonal warmth, and very short tails. Listening
feedback rejected radio-like noise and friction: omit noise layers and sweeps,
and soften each note attack.

| Moment | Proposed sound | Trigger |
| --- | --- | --- |
| Prompt version saved | A crisp stamp with a warm two-note glint, 150–250 ms | Server confirms creation of an immutable version |
| Game dispatched | Two clean ascending notes, 200–350 ms | Server accepts dispatch and returns the match ID |
| Model response completed | A low, dry 65 ms tap with three subtle variants | A newly completed, user-visible model response in the live match being watched |
| Run finished | A small resolving chord, 450–700 ms | A tracked live match reaches successful completion |

These are initial audition targets, to be adjusted by listening in context.
Saving and finishing should feel rewarding; output ticks should sit underneath
reading. Completion sounds the same for wins and losses: the reward is for
finishing the experiment. A failed or aborted run must not play this cue.

Draft autosaves stay silent. Streamed tokens, hidden reasoning, repair calls,
navigation and opening historical reports stay silent. Per the follow-up request,
the save and battle buttons now have a quiet hover cue and a stronger click cue;
other buttons retain their existing silent behavior. Historical
replay stays silent in the first release.

## Controls and defaults

- Propose milestone sounds enabled at a low starting volume (roughly 25%), with
  a persistent speaker toggle beside the existing header controls.
- Add a compact Sound section to Settings: master enable, volume, model-response
  ticks, and buttons to audition each cue. Response ticks default off; interpret
  the requested “mutable” as independently muteable.
- Store preferences in localStorage and synchronize them across tabs. Storage
  errors must not prevent using the app. Preserve visual success/error feedback.
- Play only in the foreground tab in the first release. Consume events received
  while muted or hidden; never play a backlog on unmute or return. Background
  completion alerts would be a separate optional feature.
- Controls need keyboard access, visible focus, accessible names, and a clear
  on/off state. Reuse the current layout and component styles.

## Implementation map

1. **Shared playback service and provider.** Add `src/lib/sound.ts` and
   `src/context/sound.tsx`, mounted above route content. Use one lazy Web Audio
   context, decoded short audio buffers, and a master gain control. Create or
   resume the context synchronously during the relevant click/key gesture,
   before awaiting the save or dispatch request. Playback occurs only after
   success. Audio loading, decoding, or autoplay failures must never reject a
   business action; skip unavailable cues without replaying them later.
2. **Assets and audition.** Put original or appropriately licensed assets under
   `v2/web/public/sounds/`, with source/license records. Start with one coherent
   palette and a Storybook audition surface that plays the full four-step loop.
   Use prepared samples for the tactile character. Aim for less than 150 KB of
   compressed shipped audio; preload after interaction without blocking the UI.
3. **Save and dispatch.** Emit save success from `pages/builder.tsx` after
   `builder.save` succeeds. Cover PVE and PVP success in `components/os-panel.tsx`
   and the express auto-dispatch path in the builder. Retain existing stale
   request/unmount guards. Key save events by agent/version and dispatch events
   by returned match ID. On a fast express save-and-launch, sequence the two
   short cues cleanly without delaying navigation. If dispatch fails after save,
   only the save cue plays.
4. **Response completion.** Extend `api/sse.ts` with an explicit event observer
   instead of triggering audio from rendered rows or token state. The current
   stream has `turnCompleted`, `verdictRecorded`, `matchFinished`, and
   `matchFailed`; `done` covers both success and failure. Use a shared classifier
   for visible model-response turns, verified against each scenario's existing
   transcript fixtures. Generic timeline events and verdict bookkeeping must
   not create duplicate response cues. Private inference completion is outside
   the first-release definition of “model output.”
5. **Freshness and deduplication.** Initial streams start at `afterTurn=-1` and
   can replay committed history. Establish a baseline from the initial match
   detail, and only audition output completions associated with live response
   activity after observation begins. On reconnect, suppress backlog turns;
   missing a tick is preferable to sounding a history burst. Deduplicate by
   match ID and transcript sequence in provider-owned state so rerenders and
   route remounts do not repeat sounds. Limit response ticks to one per 300 ms;
   discard excess ticks. A finish cue takes priority over response ticks.
6. **Completion across routes.** Keep a session registry of games launched here
   or first observed as running. Use `matchFinished` for immediate completion
   on the watched match, with the same deduplication registry for all sources.
   Extract the existing 30-second match-list polling from `battle-strip.tsx`
   into a shared provider to observe owned running games while users edit or
   navigate elsewhere. Preserve the strip's display rules. Polling completion
   may be up to 30 seconds late. Baseline initial finished rows silently; filter
   owned games using `initiatorIsMe`, since the API may expose other users' games.
   Confirm success from match detail when a list transition is ambiguous;
   `finished` alone does not prove successful completion. Do not infer completion
   from the bell's unread count: its stream contains no match identity.
7. **Controls.** Wire the header toggle and Settings to the shared provider.
   Scope tracked games to the signed-in account and clear them on logout. Apply
   foreground ownership and cross-tab deduplication to prevent duplicate cues.

Browser audio requires user-gesture handling; follow the
[MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)
and [autoplay guidance](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay).
Mobile suspension/background playback is not a guaranteed notification channel.

## Delivery and verification

1. Build the audition surface first, including a realistic sequence with several
   response ticks, so timbre and repetition can be judged together.
2. Add the service, controls, successful-save and dispatch cues.
3. Add live response filtering and successful completion, including the shared
   cross-route tracker. Frontend contracts appear sufficient; confirm fixture
   semantics during implementation before claiming every event is covered.
4. Verify event counts for successful/failed saves, autosave, PVE/PVP/express,
   express partial failure, historical load, reconnect, route remount, hidden
   tabs, mute/unmute, multiple tabs, and successful/failed match termination.
   Include the race where a match finishes between the initial fetch and SSE
   connection, plus duplicate completion from SSE and polling.
5. Run frontend fmt, lint, typechecks, focused unit and Storybook interaction
   tests, build, and `git diff --check`. Check Chrome, Firefox, Safari/iOS gesture
   behavior and responsive controls. Listen on headphones and phone speakers;
   automated playback assertions cannot establish sound quality.

The initial implementation target was a local preview for listening and
interaction review. The implemented demo and its validation notes are documented
in `v2/web/src/demo/journey/README.md`; the standalone demo is published on
Vercel, with source on `codex/sound-effects-20260910`.
