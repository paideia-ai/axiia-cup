"""Build reviewable expression prompts from the original portrait identities.

This script makes no API calls. Existing generation records are preserved.
Run from any directory: python docs/scenario-portraits/expressions/prepare.py
"""

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
original = json.loads((ROOT / "manifest.json").read_text())
design = json.loads((ROOT / "expression-design.json").read_text())
output = ROOT / "expressions" / "manifest.json"
previous = json.loads(output.read_text()) if output.exists() else {}
existing = {item["key"]: item for item in previous.get("assets", [])}
states = {"assertive": "积极／进攻", "neutral": "中性", "defensive": "轻微退缩／防御"}

STYLE = """Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one of three expression variants.
Input image 1: identity and pixel-art style reference. Preserve this exact person's facial structure, age, hair, headwear, facial hair, glasses if present, clothing and period. Do not copy the reference's expression or pose; use the specified state below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. Background is part of the image: do not remove it, do not make a transparent cutout, no transparent pixels.
Composition: consistent head-and-upper-chest bust at the same camera distance across all three states. Keep the entire headwear inside the frame. Leave enough lower-frame space for the specified shoulder/forearm gesture. Hands when requested stay below the face and are simple readable pixel clusters. Expression, head angle, shoulders and gesture must all communicate the state unmistakably at small avatar size.
Identity description below includes the original baseline temperament; the explicit state direction overrides all baseline facial-expression wording.
"""
AVOID = """
Constraints: retain recognizable identity and costume from the reference. Only expression, gaze, head angle, shoulders and arm gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat symbol or motion lines. No collage or three-panel sheet: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Defensive means a clearly visible but slight flinch or guarded withdrawal, not sobbing, injury or comic panic. Assertive means active conviction appropriate to the role, not indiscriminate rage. 1024x1024 PNG preferred.
"""

assets = []
lines = ["# 三状态角色像素头像提示词", "",
         "29 个角色 × 3 种状态，共 87 条独立提示词。内置 ImageGen 每条单独生成，原头像作为身份与风格参考。", "",
         "`assertive`＝积极／进攻；`neutral`＝中性倾听；`defensive`＝轻微退缩／防御。积极不等于微笑，防御不等于认输；表情不决定陪审员投票或案件真相。", "",
         "场景触发是根据脚本写出的美术演绎，不代表新增剧情、固定剧情走向或程序触发规则。纪川全部为生前形象。", "",
         "[图片总览](expressions/README.md) · [机器可读提示词与生成记录](expressions/manifest.json) · [逐角色设计依据](expression-design.json) · [原始单头像提示词](ORIGINAL-PROMPTS.md)", ""]
for c in original["characters"]:
    assert set(design[c["id"]]) == set(states)
    lines += [f"## {c['scene']} · {c['name']}", "", f"场景依据：`{c['source_script']}`；身份参考：[{c['file']}]({c['file']})。", ""]
    for state, label in states.items():
        context, direction = design[c["id"]][state]
        prompt = (STYLE + "Subject identity: " + c["subject"] + "\n"
                  + "Narrative motivation (for expression only, do not draw the scene): " + context + "\n"
                  + "Required state: " + state + " / " + label + ".\n"
                  + "Face AND body direction: " + direction + "\n" + AVOID)
        key = f"{c['scenario']}/{c['id']}/{state}"
        asset = {"key": key, "scenario": c["scenario"], "character_id": c["id"],
                 "name": c["name"], "scene": c["scene"], "state": state,
                 "source_script": c["source_script"], "reference": "../" + c["file"],
                 "file": f"{c['scenario']}/{c['id']}-{state}.png",
                 "context": context, "direction": direction, "prompt": prompt,
                 "status": "pending"}
        old = existing.get(key, {})
        if old.get("prompt") == prompt:
            for field in ("status", "width", "height", "sha256", "generation_source", "error", "visual_review"):
                if field in old:
                    asset[field] = old[field]
        assets.append(asset)
        lines += [f"### {label} (`{state}`)", "", context, "", "```text", prompt.strip(), "```", ""]

revision = previous.get("revision") or subprocess.check_output(
    ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
manifest = {"repository": original["repository"], "revision": revision,
            "generator": "Built-in ImageGen / image_gen.imagegen",
            "character_count": len(original["characters"]), "count": len(assets),
            "states": states, "path_base": "docs/scenario-portraits/expressions",
            "appearance_note": original["appearance_note"],
            "context_note": "场景触发为美术演绎，不新增剧本事实；神情不编码有罪、无罪或固定投票。纪川为生前形象。",
            "assets": assets}
output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
(ROOT / "PROMPTS.md").write_text("\n".join(lines))

generated_count = sum(a["status"] == "generated" for a in assets)
gallery = ["# 三状态角色头像", "", "每行同一角色，依次为积极／进攻、中性、轻微退缩／防御。", "",
           f"共 {len(original['characters'])} 个角色、{len(assets)} 张独立图片；已生成 {generated_count}/{len(assets)} 张。", "",
           "原头像仅作为身份与风格参考；此目录保存新生成的独立 PNG。", "",
           "[完整提示词](../PROMPTS.md) · [生成记录](manifest.json) · [角色设计依据](../expression-design.json)", "",
           "[浏览器画廊](index.html)：将此目录连同图片下载后，在浏览器打开 `index.html`；支持搜索角色或场景，点击图片查看原图。", "",
           "神情与姿态均随状态变化；未接入前端或部署。美术触发条件不改写场景规则。", ""]
for scene in dict.fromkeys(c["scene"] for c in original["characters"]):
    gallery += [f"## {scene}", "", "| 角色 | 积极／进攻 | 中性 | 轻微退缩／防御 |", "| --- | --- | --- | --- |"]
    for c in original["characters"]:
        if c["scene"] != scene:
            continue
        cells = []
        for state, label in states.items():
            path = f"{c['scenario']}/{c['id']}-{state}.png"
            cells.append(f'<a href="{path}"><img src="{path}" alt="{c["name"]}：{label}" width="160" height="160" /></a>')
        gallery.append("| " + c["name"] + " | " + " | ".join(cells) + " |")
    gallery += [""]
(ROOT / "expressions" / "README.md").write_text("\n".join(gallery))
print(f"Prepared {len(assets)} prompts for {len(original['characters'])} characters.")
