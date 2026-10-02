"""Import PR #272's original-resolution artwork; requires Pillow, never calls AI."""

import hashlib
import io
import json
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parents[3]
SOURCE = "304815fedfd027091b5d434f10a1268771ae0792"
ART = "docs/scenario-portraits/emotions"
DESTINATION = REPO / "v2/web/src/assets/portraits"


def source_file(path):
    return subprocess.check_output(["git", "show", f"{SOURCE}:{path}"], cwd=REPO)


def import_asset(asset):
    data = source_file(f"{ART}/{asset['file']}")
    assert hashlib.sha256(data).hexdigest() == asset["sha256"], asset["key"]
    with Image.open(io.BytesIO(data)) as source:
        original = source.convert("RGB")
    assert original.size == (1254, 1254), asset["key"]
    target = DESTINATION / Path(asset["file"]).with_suffix(".webp")
    target.parent.mkdir(parents=True, exist_ok=True)
    original.save(target, format="WEBP", lossless=True, method=6)
    with Image.open(target) as result:
        assert result.size == original.size, asset["key"]
        assert result.convert("RGB").tobytes() == original.tobytes(), asset["key"]
    return target.stat().st_size


if __name__ == "__main__":
    manifest = json.loads(source_file(f"{ART}/manifest.json"))
    assert manifest["annotation_batch"] == "20260927_a66847a8"
    assert len(manifest["assets"]) == 261
    with ThreadPoolExecutor(max_workers=4) as pool:
        sizes = list(pool.map(import_asset, manifest["assets"]))
    print(f"Imported {len(sizes)} originals: {sum(sizes):,} bytes; identical RGB pixels.")
