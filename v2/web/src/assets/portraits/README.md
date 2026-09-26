# Neutral role portraits

Source: `docs/scenario-portraits/expressions/*/*-neutral.png` at `5f181ca`. All
29 assets are lossless WebP encodings of the original PNGs, with identical RGB
pixels and dimensions. No expression, crop or drawing has changed.

Reproduce from the repository root with Pillow:

```python
from pathlib import Path
from PIL import Image

source = Path('docs/scenario-portraits/expressions')
for path in sorted(source.glob('*/*-neutral.png')):
    output = Path('v2/web/src/assets/portraits') / path.relative_to(source).with_suffix('.webp')
    output.parent.mkdir(parents=True, exist_ok=True)
    original = Image.open(path).convert('RGB')
    original.save(output, format='WEBP', lossless=True, method=6)
    assert Image.open(output).convert('RGB').tobytes() == original.tobytes()
```

Vite imports these files from `role-portrait.ts`, so hashed portrait URLs work
with the existing Docker build without copying the docs tree.
