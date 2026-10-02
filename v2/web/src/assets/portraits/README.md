# Ten-emotion role portraits

These 29 portraits are 256 × 256 WebP files, downsampled with Pillow's Lanczos
filter from the approved 1254 × 1254 PNGs in
`docs/scenario-portraits/expressions/*/*-neutral.png`.

The largest normal platform portrait is 80 CSS pixels; 256 pixels covers that
size at 3× device pixel ratio. The composition and aspect ratio are unchanged.
Downsampling reduces detail; lossless WebP encoding preserves the resized RGB
pixels exactly. No artwork was regenerated.

Reproduce from the repository root (Python 3 + Pillow with WebP support):

```sh
python3 docs/scenario-portraits/emotions/optimize.py
```

The script reads originals from pinned Git revision
`304815fedfd027091b5d434f10a1268771ae0792`, also optimizes the nine-emotion set,
and verifies decoded pixels against each resized image. Source/output hashes,
dimensions, byte counts and encoder versions are recorded in
`docs/scenario-portraits/emotions/optimization.json`.

Vite imports these files from `role-portrait.ts`, so hashed portrait URLs work
with the existing Docker build without copying the docs tree.

## Emotion set

The 261 expressions come from PR #272's original-art revision
`304815fedfd027091b5d434f10a1268771ae0792`. Each is encoded as lossless WebP at
**1254×1254**, with pixel-for-pixel RGB equality verified during import. The
later 256×256 optimization in that PR is intentionally not used by this branch:
the live-avatar requirement retains original-resolution artwork.

Rebuild the expression assets from the repository root:

```sh
python3 v2/web/scripts/import-emotion-portraits.py
```

This requires Pillow and the pinned commit in the local Git object database. It
makes no generation or API calls. It verifies each source hash against the
original manifest, dimensions, and decoded output pixels.

| Category | Filename suffix |
| -------- | --------------- |
| E01      | neutral         |
| E02      | resolute        |
| E03      | wary            |
| E04      | hesitant        |
| E05      | anxious         |
| E06      | angry           |
| E07      | scornful        |
| E08      | sad             |
| E09      | caring          |
| E10      | moved           |

Only asset URLs enter the JavaScript bundle. Images are fetched separately; the
currently visible speaker's set is warmed while generation is in flight.
