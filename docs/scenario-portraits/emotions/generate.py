"""Generate pending emotion portraits with the Codex CLI built-in image tool.

Each asset runs one non-interactive `codex exec` session with the character's
neutral portrait attached as input image 1 and the manifest prompt passed
verbatim. Codex saves the image under $CODEX_HOME/generated_images/<thread>/;
this script copies it to the asset path and records the result in
manifest.json. Run prepare.py first; rerun prepare.py afterwards to refresh
README.md and index.html.

This script makes image-generation calls through the local Codex login.

  python generate.py                      # every pending asset
  python generate.py --only shangyang ganlong --emotions angry sad
  python generate.py --concurrency 4 --force
"""

import argparse
import datetime
import hashlib
import json
import os
import shutil
import struct
import subprocess
import tempfile
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

HERE = Path(__file__).resolve().parent
MANIFEST = HERE / "manifest.json"
CODEX_HOME = Path(os.environ.get("CODEX_HOME", Path.home() / ".codex"))
WRAPPER = """Use your built-in image generation tool exactly once to create the image described in <image_prompt>. Use the attached image as the input reference image for this generation (identity, style, framing). Pass the image prompt to the tool verbatim; do not shorten, translate or rewrite it. Do not run shell commands, do not read or write files, do not ask questions. When the image has been generated, reply with the single word DONE.

<image_prompt>
{prompt}
</image_prompt>
"""
lock = threading.Lock()


def png_size(path):
    with open(path, "rb") as f:
        head = f.read(24)
    if head[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not a PNG")
    return struct.unpack(">II", head[16:24])


def update(key, **fields):
    with lock:
        manifest = json.loads(MANIFEST.read_text())
        for asset in manifest["assets"]:
            if asset["key"] == key:
                asset.update(fields)
                for name, value in list(asset.items()):
                    if value is None:
                        del asset[name]
        tmp = MANIFEST.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
        tmp.replace(MANIFEST)


def run_once(asset, workdir, timeout):
    ref = (HERE / asset["reference"]).resolve()
    cmd = ["codex", "exec", "--json", "--ephemeral", "--skip-git-repo-check",
           "-s", "read-only", "--disable", "hooks",
           "-c", 'model_reasoning_effort="low"', "-C", str(workdir), "-i", str(ref), "-"]
    proc = subprocess.run(cmd, input=WRAPPER.format(prompt=asset["prompt"].strip()),
                          capture_output=True, text=True, timeout=timeout)
    thread_id, messages, errors = None, [], []
    for line in proc.stdout.splitlines():
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        if event.get("type") == "thread.started":
            thread_id = event.get("thread_id")
        elif event.get("type") in ("error", "turn.failed"):
            errors.append(json.dumps(event, ensure_ascii=False)[:500])
        item = event.get("item") or {}
        if item.get("type") == "agent_message":
            messages.append(item.get("text", "")[:300])
    images = sorted((CODEX_HOME / "generated_images" / thread_id).glob("*.png"),
                    key=lambda p: p.stat().st_mtime) if thread_id else []
    detail = "; ".join(errors + messages[-1:] + [proc.stderr.strip()[-300:]] if not images else [])
    return thread_id, images, detail


def generate(asset, args):
    target = HERE / asset["file"]
    target.parent.mkdir(parents=True, exist_ok=True)
    last = ""
    for attempt in range(1, args.retries + 2):
        with tempfile.TemporaryDirectory(prefix="emotion-gen-") as workdir:
            try:
                thread_id, images, detail = run_once(asset, workdir, args.timeout)
            except subprocess.TimeoutExpired:
                thread_id, images, detail = None, [], f"timeout after {args.timeout}s"
        if images:
            shutil.copyfile(images[-1], target)
            width, height = png_size(target)
            update(asset["key"], status="generated", width=width, height=height,
                   sha256=hashlib.sha256(target.read_bytes()).hexdigest(),
                   generation_source=f"codex-thread:{thread_id}",
                   generated_at=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
                   attempts=attempt, error=None)
            return asset["key"], True, f"{width}x{height} (attempt {attempt})"
        last = detail or "no image produced"
        if any(word in last.lower() for word in ("rate limit", "429", "usage limit", "too many")):
            time.sleep(90)
        else:
            time.sleep(5)
    update(asset["key"], status="failed", error=last[:500], attempts=args.retries + 1)
    return asset["key"], False, last


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", nargs="*", help="character or scenario ids")
    parser.add_argument("--emotions", nargs="*", help="emotion slugs")
    parser.add_argument("--concurrency", type=int, default=4)
    parser.add_argument("--retries", type=int, default=2)
    parser.add_argument("--timeout", type=int, default=600)
    parser.add_argument("--force", action="store_true", help="regenerate generated assets too")
    args = parser.parse_args()

    assets = json.loads(MANIFEST.read_text())["assets"]
    todo = [a for a in assets
            if (args.force or a["status"] != "generated")
            and (not args.only or a["character_id"] in args.only or a["scenario"] in args.only)
            and (not args.emotions or a["emotion"] in args.emotions)]
    print(f"{len(todo)} assets to generate with concurrency {args.concurrency}", flush=True)
    ok = 0
    started = time.time()
    with ThreadPoolExecutor(max_workers=args.concurrency) as pool:
        futures = [pool.submit(generate, a, args) for a in todo]
        for n, future in enumerate(as_completed(futures), 1):
            key, success, note = future.result()
            ok += success
            print(f"[{n}/{len(todo)}] {'OK ' if success else 'FAIL'} {key} {note} "
                  f"({int(time.time() - started)}s)", flush=True)
    print(f"done: {ok}/{len(todo)} generated", flush=True)


if __name__ == "__main__":
    main()
