# Complete frontend sound journey

Published demo: <https://axiia-sound-journey-demo.vercel.app/>.

Local preview: <http://localhost:5214/journey-demo.html>.

```sh
cd v2/web
deno task dev --host 0.0.0.0 --port 5214 --strictPort
```

## Flow

1. Start in the actual agent builder for 本能寺之变, 止战派「先问归路」. Edit
   the prompt with the selected elastic underline caret and soft typing sound.
   Existing help, copy, role/model, note and template controls remain.
2. Click 保存并返回主页. The actual builder saves an immutable local version,
   plays its confirmation cue, and routes to the actual agent home.
3. Click 出战 on the saved version. The existing opponent panel opens with that
   version selected. Choose the preset opponent and click 发起对战.
4. The actual match page opens and consumes a local SSE stream. Six simulated
   dialogue turns arrive over 15 seconds; each visible completed response plays
   the selected 65 ms cue. The match finishes with our side winning, playing the
   finish sound and showing the existing completed report.
5. Click 领取奖励 in the result card. The local mock endpoint credits 120 points
   once and plays the exact selected B · 原速 · 收高频 file. Repeated requests
   and page reloads neither grant twice nor replay the sound.
6. 重新体验 clears the demo fixture and draft journal, returning to the builder.

## Frontend identity and incorporated session

This worktree was fast-forwarded to remote main `e6de29f` on 2026-09-10 without
committing the preview edits. Deployed HTML/CSS/JS at
`https://axiia-cup-2-web.isofucius.cn/agents/101/build` were rendered in
Chromium with intercepted illustrative account data; its footer reported the
same full SHA `e6de29fa83a797593f1743709e7a942fcd0ae9c8`. This verifies shipped
UI identity, not a real user's account data. The deployed-builder screenshot is
`/tmp/sound-journey-deployed-builder.png`.

The final product of session `01a08acd-b96b-7512-93ee-9aebd8d69e30` is
incorporated from `/home/kesou/axiia-cup-typing-caret-preview-20260910/v2/web`:

- `src/demo/typing/audio.ts`, `feedback.ts` and `typing.css` preserve that
  session's selected synthesis, caret behavior and prompt-workspace treatment.
- `typing-feedback.tsx` extracts its builder attachment and portal controls. The
  one integration change makes the global sound mute and volume apply to typing
  as well; the selected typing volume/mute controls remain.
- Chinese preedit is silent with a native caret, commit sounds once, paste
  sounds once, selection and scrolling remain native, undo/navigation are
  silent, and reduced motion/forced colors retain their fallback behavior.

Pages are imported, not copied or redrawn: `BuilderPage`, `AgentViewPage`,
`OsPanel`, `MatchDetailPage`, `AppShell`, plus supporting inventory/settings
pages. MatchDetailPage has one optional `resultAction` slot, unused by the
normal app. The reward component mounts there only when a finished result is
visible; it is hidden during replay. The small local-demo notice and response
sound switch sit above the page content. Hash routing preserves browser
back/forward and refresh without replacing the production router.

Reward playback is boosted 3x relative to the other cues at the default 25%
volume (75% playback gain), capped at unity to retain headroom.

Reward B is copied byte-for-byte from the user-selected
`01a08aa3-7398-7fa2-b7c1-224e32a64388` session. See
`public/sounds/ATTRIBUTION.md` and `src/lib/reward-sounds.test.ts`.

## Demo boundary

All `/v1/*` requests are intercepted locally by MSW before React mounts. Model
outputs, victory, account identity and points are fixtures; edited prompts do
not determine the scripted dialogue. Version prompt/model/role/note data do flow
through save, agent home and the selected dispatch snapshot. Builder and match
state persist in sessionStorage for the tab. There are no model calls, real
wallet writes or production API mutations. The sample reward endpoint is
`/v1/demo/rewards/:id`, not a claim that the backend implements rewards.

The broader production integration gaps described in `src/demo/README.md`,
including tracking completion after leaving a match, remain unchanged.

## Validation

```sh
node tests/demo/journey-typing-smoke.mjs
node tests/demo/journey-smoke.mjs
deno task test:unit
deno task fmt
deno task lint
deno task typecheck
deno task typecheck:tests
deno task build
deno run -A npm:vite build --config vite.journey-demo.config.ts
git diff --check
```

Typing smoke covers the source session's IME, selection, scroll, paste, undo,
fixed preferences, mute, reduced motion, help, role template and save/return
behavior at 320–1440 px. Journey smoke checks actual audio buffer starts for
save, hover/click, dispatch, six replies, finish and selected stereo reward B;
version carry-through; duplicate-claim defense; reload and reset; and local MSW
responses. Screenshots are under `/tmp/journey-*`.

Accessibility checks require no findings in the added reward region and no new
page findings. The unchanged production participant return link has a known
color-contrast finding (`.hover\\:opacity-90`, match-detail.tsx); the test
records that explicit baseline rather than altering an unrelated existing style.
Physical OS IMEs, Safari/Firefox and subjective listening have not been
verified. The standalone static demo was published to Vercel on 2026-09-10.
The source is maintained on `codex/sound-effects-20260910`; the product
application was not deployed.

Deployment: `dpl_EgUGojfuKJEcUtTy5wAUUZz8QN81`, project
`axiia-sound-journey-demo`. Staged assets are in
`/tmp/axiia-sound-journey-demo`; this directory contains only built HTML/JS/CSS,
the mock worker, the selected reward WAV, and public scenario images.

To run the full flow against the published demo:

```sh
JOURNEY_DEMO_URL=https://axiia-sound-journey-demo.vercel.app/ node tests/demo/journey-smoke.mjs
```
