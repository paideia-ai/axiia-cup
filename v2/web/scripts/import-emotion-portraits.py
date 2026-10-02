"""Copy PR #272's optimized portraits into the frontend without re-encoding."""

import hashlib
import json
import shutil
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
ART = REPO / "docs/scenario-portraits/emotions"
DESTINATION = REPO / "v2/web/src/assets/portraits"


def import_assets():
    manifest = json.loads((ART / "manifest.json").read_text())
    assert manifest["annotation_batch"] == "20260927_a66847a8"
    assert len(manifest["assets"]) == 261
    total = 0
    for asset in manifest["assets"]:
        source = ART / asset["file"]
        assert source.suffix == ".webp", asset["key"]
        assert (asset["width"], asset["height"]) == (256, 256), asset["key"]
        data = source.read_bytes()
        assert hashlib.sha256(data).hexdigest() == asset["sha256"], asset["key"]
        target = DESTINATION / asset["file"]
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
        total += len(data)
    print(f"Copied 261 optimized portraits: {total:,} bytes; unchanged WebP files.")


if __name__ == "__main__":
    import_assets()
