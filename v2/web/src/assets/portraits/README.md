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

The additional 261 expression portraits are copied byte-for-byte from
`docs/scenario-portraits/emotions/*/*.webp`, also at 256×256. Run
`python3 v2/web/scripts/import-emotion-portraits.py` after updating that set; it
validates each manifest hash and copies the optimized files without resizing or
re-encoding. All 290 frontend assets now match PR #272's optimized outputs.

E01–E10 map to `neutral`, `resolute`, `wary`, `hesitant`, `anxious`, `angry`,
`scornful`, `sad`, `caring`, and `moved`. Only their URLs enter JavaScript; the
currently generating speaker's set is warmed at low priority and the selected
expression receives high fetch priority.
