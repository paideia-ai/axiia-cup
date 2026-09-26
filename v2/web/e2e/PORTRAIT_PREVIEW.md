# Neutral portrait preview

The selected design uses square neutral portraits in all five scenarios: 80px at
desktop widths (900px and above), and 48px below 900px. On desktop, dialogue
uses a left identity column with the name below the image. On mobile and in the
narrower Judge OS column, the identity appears above the full-width body.
Inquiry and named judge verdict headers follow the same responsive sizes.
Existing text, colors, accent bars and tab interactions remain. On mobile, the
full-match trend appears at the very end, after hidden goals/scoring or the
final verdict. Desktop keeps the trend at the top of the right column. Trend
navigation still selects the matching Trolley case and focuses its Judge OS.

From `v2/web`:

```sh
deno task preview:portraits
```

Open <http://localhost:6035/> for all five complete historical match pages:
Shangyang #144, Honnoji #120, Trolley #122, Fengyi #123 and Harbor #145. The
server serves production assets unchanged, with local read-only historical API
fixtures. No HTML or CSS is injected. Writes are rejected; there is no
production API proxy. Account state and data differ from the deployed platform.

Portraits resolve actual match roles and canonical historical aliases for
Honnoji. No portrait is guessed from an unresolved faction. Images are
decorative beside text names; reserved dimensions avoid loading shifts. Unknown
or failed images disappear.

Neutral artwork is losslessly encoded as WebP in `src/assets/portraits` and
ships inside the existing web Docker context. Original dimensions and RGB pixels
are preserved; source PNGs remain in `docs/scenario-portraits/expressions`.

Not merged or deployed.
