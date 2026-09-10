# Sound preview

The complete current-frontend journey is published at
<https://axiia-sound-journey-demo.vercel.app/> (local preview:
<http://localhost:5214/journey-demo.html>). See `journey/README.md` for the
builder → agent home → dispatch → live win → reward flow and incorporated
typing-feedback session. The standalone audition below remains available.

Open <http://localhost:5188/sound-demo.html> while the preview server is
running.

From `v2/web`, restart it with:

```sh
deno install --frozen
deno task dev --host 0.0.0.0 --port 5188 --strictPort
```

The standalone HTML entry is a development preview, separate from the production
router and authentication. It makes no API calls. Its edited prompt, versions,
six streamed responses, and ending are simulated; editing the prompt does not
change the fixed dialogue. It is not included in the normal production build.

The user confirmed palette 1, 清透轻点. Opening the demo now applies that
selection, including when an earlier audition left a different palette in
storage. The previous ten-palette picker and its standalone smoke script are
retained as historical comparison code, not mounted on the current page.

The reward uses the exact **B · 原速 · 收高频** WAV selected from session
`01a08aa3-7398-7fa2-b7c1-224e32a64388`, copied unchanged from that session's
`src/demos/rewards/assets/coin7-B.wav`. All previous candidates from this
worktree, their synthesis code, and their generation scripts were deleted. A
SHA-256 regression check ensures the selected file is preserved exactly.

B is a processed Balatro coin7 sample at original speed, with a 4.2 kHz low-pass
filter, boundary fades, and level matching from the source audition. It is
stereo 44.1 kHz PCM, 15,613 frames (about 354 ms). It is not an original Axiia
recording. See `public/sounds/ATTRIBUTION.md` for provenance and file identity.

The simulated **领取奖励** action grants 120 points from 1,000 to 1,120: 60
points at 20 ms, then 120 at 80 ms. Repeated clicks cannot claim twice. Reset
starts a fresh audition. Muting does not affect the point animation. No claim
API, real wallet, or actual reward is implemented or called. A production
integration must await an authoritative, idempotent claim response before
awarding points and playing the payout cue.

The selected WAV is prefetched from the same origin and decoded after a user
gesture. Loading failure does not block the points grant, substitute another
sound, or replay a late cue. An explicit audition can retry loading.

The model-response cue is now a 65 ms low, dry tap with a 6 ms soft attack and
no high ringing partials. Its RMS target is 0.032 (previously 0.06). The three
slight pitch variations are centered on 245–253 Hz rather than 720–814 Hz. It
remains optional and plays once per completed visible response, not per token.

Use **体验完整流程** for the full sequence, or save a version and dispatch it
manually. **每次模型回复时播放** enables the optional response ticks. The
right-hand play buttons audition each cue, including the response cue when
automatic ticks are disabled. Master mute still applies. The save and battle
buttons also play a quiet 45 ms hover cue and a stronger 110 ms click cue. Hover
sounds require an initial user click to unlock browser audio; use any audition
button first. Hover is limited to one cue per entry, with a 250 ms repeat guard.
Click cues are immediate and separate from server-confirmed save/dispatch
sounds. Disabled buttons stay silent. Reset and abort cancel pending timers and
sound playback. Preferences persist locally and synchronize across tabs.

The other UI cues are original, generated once into Web Audio buffers by
`lib/sound.ts`. The confirmed 清透轻点 palette uses clean plucked tones with
softened attacks and harmonic partials. Per listening feedback, all noise
layers, friction sweeps, and saturation have been removed; dispatch is a short
ascending two-note cue. These synthesized UI cues do not depend on asset
loading.

The same provider and controls are wired into the app's builder save, PVE/PVP
and express dispatch, and watched-match SSE paths. Dialogue completion ticks
require a visible generation observed in the current stream; historical turns,
token deltas, repair generations, and failed-match termination stay silent.

The broader plan's cross-route match tracker, structured-action completion
classification, and full account-session lifecycle handling remain follow-up
work. The demo supports finishing while switching between its own tabs; the real
app currently receives match completion only while its match page is open.
Background notifications are not implemented. The standalone journey demo is
published on Vercel, with source on `codex/sound-effects-20260910`; the product
application was not deployed.

## Verification

- Frontend format, lint, application and test typechecks, and production build.
- 197 unit tests, including buffer amplitudes and event deduplication.
- 15 existing affected Storybook tests plus the new save/dispatch/abort demo
  test.
- Chromium playback checks assert actual audio buffer starts and a running
  AudioContext after a user gesture. They cover four auditions, the full run
  with ticks off/on, muting mid-run, no backlog on unmute, abort, and persisted
  preferences. The full run produces 3 cues by default and 9 with ticks enabled.
- Automated WCAG A/AA checks pass for the preview; responsive screenshots and
  page-overflow checks cover 320, 390, 768, and 1400 pixels. The app header and
  Settings were also inspected at 320, 390, and 1280 pixels with a mocked
  account.
- Reward browser checks cover the single selected B, audition without points,
  one payout despite repeated clicks, mute without backlog, reset, asset loading
  failure and retry, responsive layout, and automated accessibility.
- Safari/iOS and Firefox audio behavior, and subjective listening on physical
  speakers/headphones, have not been verified.

Run the browser checks with the dev server active:

```sh
node tests/demo/sound-demo-smoke.mjs
node tests/demo/sound-buttons-smoke.mjs
node tests/demo/reward-sounds-smoke.mjs
```

Screenshots and playback evidence are written to `/tmp/axiia-sound-demo-checks`.
