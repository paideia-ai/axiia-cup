"""Reproduce 256px portraits from pinned originals; never calls image generation.

Requires Pillow with WebP support. Run from any directory with Python 3.
Original PNGs remain recoverable from SOURCE_REVISION in Git. Output hashes,
source hashes, dimensions and byte counts are written to optimization.json.
"""

import hashlib
import io
import json
import subprocess
from pathlib import Path

from PIL import Image, __version__ as pillow_version, features

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
SOURCE_REVISION = "304815fedfd027091b5d434f10a1268771ae0792"
SIZE = (256, 256)


def original(path):
    return subprocess.check_output(
        ["git", "show", f"{SOURCE_REVISION}:{path}"], cwd=REPO
    )


def sha(data):
    return hashlib.sha256(data).hexdigest()


def convert(source, target, *, previous=None):
    data = original(source)
    image = Image.open(io.BytesIO(data))
    image.load()
    if image.size != (1254, 1254):
        raise ValueError(f"Unexpected source dimensions: {source}: {image.size}")
    image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
    small = image.resize(SIZE, Image.Resampling.LANCZOS)
    encoded = io.BytesIO()
    small.save(encoded, format="WEBP", lossless=True, method=6, exact=True)
    result = encoded.getvalue()
    decoded = Image.open(io.BytesIO(result)).convert(small.mode)
    if decoded.size != SIZE or decoded.tobytes() != small.tobytes():
        raise ValueError(f"Lossless round-trip failed: {target}")
    dest = REPO / target
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(result)
    return {
        "source_file": source,
        "source_sha256": sha(data),
        "source_width": image.width,
        "source_height": image.height,
        "source_bytes": len(data),
        "file": target,
        "sha256": sha(result),
        "width": SIZE[0],
        "height": SIZE[1],
        "bytes": len(result),
        "previous_bytes": len(original(previous)) if previous else len(data),
    }


def main():
    if not features.check("webp"):
        raise RuntimeError("Pillow needs WebP support")
    manifest_path = HERE / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    records = []
    source_prefix = HERE.relative_to(REPO).as_posix()
    for asset in manifest["assets"]:
        source = f"{source_prefix}/{asset['scenario']}/{asset['character_id']}-{asset['emotion']}.png"
        target = str(Path(source).with_suffix(".webp"))
        record = convert(source, target)
        records.append({"kind": "emotion", "key": asset["key"], **record})
        asset.update(file=str(Path(target).relative_to(source_prefix)),
                     width=256, height=256, sha256=record["sha256"])
        asset["original"] = {
            "revision": SOURCE_REVISION, "file": source,
            "width": record["source_width"], "height": record["source_height"],
            "bytes": record["source_bytes"], "sha256": record["source_sha256"],
        }
        # Delete only the corresponding pinned original, after round-trip validation.
        png = REPO / source
        if png.exists():
            if sha(png.read_bytes()) != record["source_sha256"]:
                raise ValueError(f"Refusing to delete modified source: {source}")
            png.unlink()
    characters = json.loads((HERE.parent / "manifest.json").read_text())["characters"]
    for character in characters:
        name = f"{character['scenario']}/{character['id']}-neutral"
        source = f"docs/scenario-portraits/expressions/{name}.png"
        target = f"v2/web/src/assets/portraits/{name}.webp"
        records.append({"kind": "neutral", "key": name,
                        **convert(source, target, previous=target)})
    optimization = {
        "source_revision": SOURCE_REVISION,
        "width": 256, "height": 256, "resampling": "LANCZOS",
        "encoding": "WebP lossless", "method": 6,
        "pillow_version": pillow_version,
        "libwebp_version": features.version("webp"),
        "note": "Downsampling reduces detail; encoding preserves the resized pixels exactly.",
    }
    manifest["optimization"] = optimization
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    totals = {}
    for kind in ("emotion", "neutral"):
        group = [r for r in records if r["kind"] == kind]
        totals[kind] = {
            "count": len(group),
            "before_bytes": sum(r["previous_bytes"] for r in group),
            "after_bytes": sum(r["bytes"] for r in group),
            "max_bytes": max(r["bytes"] for r in group),
        }
    (HERE / "optimization.json").write_text(json.dumps(
        {**optimization, "totals": totals, "assets": records},
        ensure_ascii=False, indent=2,
    ) + "\n")
    print(json.dumps(totals, indent=2))


if __name__ == "__main__":
    main()
