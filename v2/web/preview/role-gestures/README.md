# Portrait role creation preview

Only concept 7 is retained. The standalone ten-concept gallery has been removed.

This worktree uses current main `0d65e5f` and the real product pages, with the
portrait chooser connected to the shared creation action. The role-binding API,
new-agent identity and builder behavior are carried over from the earlier local
character branch. No other design variants are bundled.

Backend dependency:
[axiia-cup-v2#75](https://github.com/paideia-ai/axiia-cup-v2/pull/75).
Coordinate both releases; merging the frontend alone cannot persist the selected
character. The preview serves the production build HTML, JS and CSS unchanged;
only its outer device frame, local login and local API proxy are preview
helpers.

- Desktop: <http://localhost:5263/__preview/desktop>
- Phone frame: <http://localhost:5263/__preview/mobile>
- Direct scene: <http://localhost:5263/__preview/open?view=scenario>
- Direct inventory: <http://localhost:5263/__preview/open?view=inventory>
- Direct agent: <http://localhost:5263/__preview/open?view=agent>

Build with `deno task build`, then serve with
`deno run -A e2e/preview-role-portraits.ts` from `v2/web`. The preview proxy
connects only to the local Swift backend on 8199, running with an independent
SQLite copy at `/tmp/axiia-portrait-role-preview-state/axiia.sqlite`. Creation,
naming, role binding and saved strategies use actual local API calls. Match
dispatch is disabled. This is not deployed and does not use production data.

The two portraits open horizontally on desktop, as a paired shelf next to an
edge, and vertically below 768px. A phone control near a viewport boundary
scrolls into view before unfolding. The same component covers both factions and
all three creation entries: scene, inventory, and agent home. Choices are
portaled to avoid clipping by existing scroll containers; there is no backdrop
or modal.

Keep existing page widths, gutters, buttons and navigation. Use existing neutral
portrait assets with the printed frame cropped out, muted idle artwork and an
accent underline for selection. Only direction arrows remain visible; gesture
instructions remain available to screen readers. Click or Enter can reveal
accessible choices; drag and release creates directly. Return to center, move
away, Escape, scroll, blur and pointer interruption cancel.

Verified locally: format, lint, app/test typechecks, production build, all 341
unit checks, 185 Storybook checks, 76 human-fixture checks, 74
navigation/creation checks, and `git diff --check`. Real Chromium mouse and CDP
touch checks covered both factions at all three entry points, cancel, single
creation, rename/reload, role-bound strategy save, keyboard and click fallbacks.
Layout and chooser axe checks passed at 1440, 1024, 768, 390 and 320px. Windows
localhost requests returned 200 for both preview wrappers. Existing product-wide
accessibility was not audited.

The rewards suite has an existing local failure in the reward-claim sound check
(missing 354 Hz cue), reproduced at untouched main `0d65e5f`. The other 40
rewards checks pass. This is not a clean all-green test result.
