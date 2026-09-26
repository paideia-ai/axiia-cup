# Neutral portrait preview

The selected design uses 80px square neutral portraits in all five scenarios. On
desktop, dialogue uses a left identity column with the name below the image. On
mobile and in the narrower Judge OS column, the identity appears above the
full-width body. Inquiry and named judge verdict headers also show 80px
portraits. Existing text, colors, accent bars, chart and tab interactions
remain.

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
