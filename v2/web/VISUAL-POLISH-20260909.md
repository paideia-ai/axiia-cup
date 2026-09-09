# Demo visual polish — 2026-09-09

This worktree copies the current demo from
`/home/kesou/axiia-cup-agent-ux-minimal`, including its 36 uncommitted files, on
baseline commit `68dac84a05af613c93714990801789fb1769cafe`. The source worktree
is not edited. The copy includes the anchored creation popover and mobile
creation sheet.

Run from `v2/web`:

```bash
deno run -A npm:vite --config vite.demo.config.ts
```

Open <http://localhost:5190/demo.html#/my-agents>. Port 5190 keeps this demo's
browser storage separate from the original demo. The sample inventory is copied
from the source files; existing browser-only edits on the original port are not
transferred.

Changes:

- Inventory, home, and builder share a 1040 px maximum container. A stable
  desktop scrollbar gutter prevents horizontal shifts between short and long
  pages.
- Scenario cards keep their outer borders. Ordinary agent rows have transparent
  borders, a faint background, and a hover state. Entry rows keep orange
  borders.
- Strategy text is brighter and uses 15 px type with more line spacing.
  Secondary and muted text use distinct, readable gray tones.
- Role groups use separators and more space between groups; editor labels sit
  closer to their input. Large card shadows are removed.
- Role badges use neutral outlines and green checks for ready roles. The overall
  entry status keeps its green color. Mobile headings align the role badges and
  status below the title.
- Role group spacing is reduced while retaining the separator. Creation, note,
  and modal surfaces share the original demo's updated background, border,
  corner radius, shadow, and close button styles. Mobile creation remains a
  bottom sheet and notes retain their compact layout.
- The model dropdown uses left-aligned names, right-aligned selection checks,
  inset rows, and the shared overlay surface. It stays anchored to the field and
  retains the same model choices, draft persistence, and saved model IDs.

The visual stylesheet is imported only by the demo entry. Existing demo
interactions and scenario data are retained.

To create the static deployment, run the Vite build command below. Deploy only
the contents of `build/demo` to Vercel or Cloudflare Pages. The build includes
`index.html` for the site root and `demo.html` for existing links. Both use hash
routes, so deep links and refreshes need no server-side routing. No backend, API
keys, or environment files are needed. Each visitor starts with the demo
inventory and keeps edits in their own browser; battles remain simulated.

Validation commands:

```bash
deno task typecheck
deno lint src/demo src/components/version-list.tsx
deno fmt --check src/demo src/components/version-list.tsx tests/demo demo.html vite.demo.config.ts VISUAL-POLISH-20260909.md
deno run -A npm:vite build --config vite.demo.config.ts
for test in tests/demo/*-smoke.mjs; do node "$test" || exit 1; done
deno test tests/demo/prompt-diff.test.ts
```

Functional parity review against the original demo:

- Compared all source files and public assets. The remaining differences are
  presentation: container widths, JSX grouping, CSS imports, colors, spacing,
  shadows, model dropdown presentation, and attributes used by visual styles.
  Route and state logic, sample data, scenario content, version operations, and
  builder tools are retained.
- The creation panel, note popover, and modal components match the original
  demo's latest files exactly.
- Both demos use the same 10 browser smoke scripts; only the preview port and
  screenshot paths differ. They cover agent creation/rename/deletion, entry
  selection, version copy/expansion/comparison, battle configuration, draft
  persistence and limits, models/notes/timestamps, all four Honnoji presets,
  MCQ/meta tools, scene pages, and responsive navigation.
- Browser data remains separate by port. Feature parity does not transfer drafts
  or other edits already stored in the original demo's browser storage.
