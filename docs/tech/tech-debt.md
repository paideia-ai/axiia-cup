# Tech Debt

Tracked shortcuts we knowingly took and intend to fix later. Each entry: what,
why it's debt, and the clean fix.

---

## TD-1 · Hard-coded default preset opponent (Playground)

**Where:** `apps/web/src/pages/Playground.tsx` —
`DEFAULT_PRESET_LABEL_BY_SCENARIO`.

**What:** When the Playground opens in preset mode, the default opponent is
chosen by matching a hard-coded label substring per scenario
(`shangyang-court` → `曾公`, i.e. `2-yis-曾公`). Falls back to the first preset
in the API list if no match.

**Why it's debt:**
- Couples the frontend to a specific preset's label text. Renaming the preset
  (or editing it in the admin UI) silently breaks the default.
- The "which preset is the canonical default" decision lives in code, not data,
  so non-engineers can't change it.
- Doesn't generalize — every new scenario needs a code edit to get a sensible
  default opponent.

**Clean fix:** Add an `isDefault` boolean column to the `preset_opponents`
table (one default per scenario, enforced in the admin update path). The
`/preset-opponents` API returns it; the Playground selects the default-flagged
preset, falling back to first-in-list. Admin UI gets a "set as default" toggle.

**Context:** Introduced 2026-05-29 as a quick UI fix (preset selector was
opening empty instead of defaulting to the calibrated `2-yis-曾公` opponent).
Hard-coding was chosen deliberately over a migration to keep the fix small.
