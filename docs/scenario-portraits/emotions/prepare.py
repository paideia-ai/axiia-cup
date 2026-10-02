"""Build the nine-emotion portrait prompts, manifest, README and gallery.

The neutral portrait (E01) is the approved one in ../expressions and is reused
as-is; this script prepares the other nine categories for every character.
It makes no API calls. Existing generation records are preserved when the
prompt is unchanged.

Run from any directory: python docs/scenario-portraits/emotions/prepare.py
"""

import html
import json
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
REPO = ROOT.parent.parent
original = json.loads((ROOT / "manifest.json").read_text())
design = json.loads((HERE / "emotion-design.json").read_text())
categories = {
    c["id"]: c for c in json.loads((REPO / design["source_categories"]).read_text())
}
output = HERE / "manifest.json"
previous = json.loads(output.read_text()) if output.exists() else {}
existing = {item["key"]: item for item in previous.get("assets", [])}
emotions = design["emotions"]
neutral = design["neutral"]

STYLE = """Use case: stylized-concept.
Asset type: ONE standalone square AXIIA CUP dialogue portrait, one frame of a ten-emotion expression set for this character.
Input image 1: this character's approved NEUTRAL portrait from the same set. It is the master reference for identity, costume, pixel-art style, palette, frame and camera. The new image must look like a sibling frame from the same sprite sheet: same person (facial structure, age, hair, headwear, facial hair, glasses if present), same clothing and period, same restrained monochrome palette, same thin black square frame and flat off-white background, same head-and-upper-chest crop at the same camera distance. Do not copy the neutral expression or pose; replace them with the emotion specified below.
Style: early-1990s strategy-game monochrome pixel art, coarse clearly square pixel clusters, approximately 64x64 logical-pixel appearance enlarged with nearest-neighbor. Restrained near-black, dark grey, light grey and warm off-white palette. Fully OPAQUE flat warm off-white (#f5f3eb) background filling every space around the character, including outside a thin black square pixel frame inset about 3%, matching the reference. No transparent pixels.
Composition: keep the entire headwear inside the frame. Hands, when requested, stay below the face as simple readable pixel clusters inside the frame. Brows, eyes, mouth, head angle, shoulders and gesture must all communicate the emotion unmistakably at small avatar size (about 64 px on screen), clearly distinguishable from the other emotions of the set.
Identity description below includes the original baseline temperament; the explicit emotion direction overrides all baseline facial-expression wording.
"""
AVOID = """
Constraints: retain the recognizable identity and costume of the reference. Only expression, gaze, head angle, shoulders and arm/hand gesture change. No extra people, props, weapons, scenery, text, lettering, watermark, speech bubble, emoji, sweat drops, anger marks, tear streams, hearts, sparkles or motion lines: the face and body alone carry the emotion. No collage, sprite sheet or multi-panel layout: output exactly ONE square portrait. No photographic rendering, smooth painting, gradients, antialiasing or fine noisy detail. Keep the character's dignity: no comic exaggeration or chibi distortion. 1024x1024 PNG preferred.
"""
KEEP = ("status", "width", "height", "sha256", "generation_source", "generated_at",
        "attempts", "error", "visual_review", "file", "original")


def build_prompt(character, emotion, context):
    return (STYLE
            + "Subject identity: " + character["subject"] + "\n"
            + f"Required emotion: {emotion['en']} ({emotion['zh']}) — {emotion['gloss']}\n"
            + "Narrative motivation (for expression only, do not draw the scene): " + context + "\n"
            + "Face AND body direction: " + emotion["direction"] + "\n"
            + ("Avoid for this emotion: " + emotion["avoid"] + "\n" if emotion.get("avoid") else "")
            + AVOID)


def neutral_file(character):
    return f"../expressions/{character['scenario']}/{character['id']}-neutral.png"


assets = []
missing = []
prompts_md = [
    "# 九类情绪像素头像提示词", "",
    "E01 中性沿用 `../expressions/` 中已定稿的 neutral 头像；其余九类（E02—E10）依据 "
    f"[Astra 十类情绪定义](../../../{design['source_categories'].removeprefix('docs/')})"
    " 为每个角色各写一条提示词，并以该角色的 neutral 头像作为身份、风格与构图参考。", "",
    "场景动机是美术演绎，只用于表情，不新增剧情事实；神情不编码陪审员投票、案件真相或固定结局。纪川均为生前形象。", "",
]
for c in original["characters"]:
    contexts = design["characters"].get(c["id"])
    if not contexts:
        missing.append(c["id"])
        continue
    assert set(contexts) == {e["slug"] for e in emotions}, c["id"]
    prompts_md += [f"## {c['scene']} · {c['name']}", "",
                   f"场景依据：`{c['source_script']}`；参考图：[{c['id']}-neutral.png]({neutral_file(c)})。", ""]
    for e in emotions:
        prompt = build_prompt(c, e, contexts[e["slug"]])
        key = f"{c['scenario']}/{c['id']}/{e['slug']}"
        asset = {"key": key, "scenario": c["scenario"], "character_id": c["id"],
                 "name": c["name"], "scene": c["scene"],
                 "category_id": e["category_id"], "emotion": e["slug"], "label": e["zh"],
                 "source_script": c["source_script"], "reference": neutral_file(c),
                 "file": f"{c['scenario']}/{c['id']}-{e['slug']}.png",
                 "context": contexts[e["slug"]], "prompt": prompt, "status": "pending"}
        old = existing.get(key, {})
        if old.get("prompt") == prompt:
            for field in KEEP:
                if field in old:
                    asset[field] = old[field]
        assets.append(asset)
        prompts_md += [f"### {e['category_id']} {e['zh']} (`{e['slug']}`)", "",
                       contexts[e["slug"]], "", "```text", prompt.strip(), "```", ""]

revision = previous.get("revision") or subprocess.check_output(
    ["git", "rev-parse", "HEAD"], cwd=HERE, text=True).strip()
manifest = {
    "repository": original["repository"], "revision": revision,
    "generator": "Codex CLI built-in image generation (image_gen), neutral portrait attached as input image 1",
    "annotation_batch": design["annotation_batch"],
    "source_categories": design["source_categories"],
    "character_count": len({a["character_id"] for a in assets}), "count": len(assets),
    "neutral": {**neutral, "file_pattern": "../expressions/{scenario}/{character_id}-neutral.png"},
    "emotions": {e["slug"]: {"category_id": e["category_id"], "zh": e["zh"], "en": e["en"]} for e in emotions},
    "path_base": "docs/scenario-portraits/emotions",
    "appearance_note": original["appearance_note"],
    "context_note": "场景动机为美术演绎，不新增剧本事实；神情不编码有罪、无罪或固定投票。纪川为生前形象。",
    "assets": assets,
}
if "optimization" in previous:
    manifest["optimization"] = previous["optimization"]
# Only rewrite when something changed, so a gallery refresh during a
# generate.py run cannot clobber records it has just written.
if manifest != previous:
    output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
(HERE / "PROMPTS.md").write_text("\n".join(prompts_md))

# ---- README (markdown overview) -------------------------------------------
characters = [c for c in original["characters"] if c["id"] in design["characters"]]
by_key = {a["key"]: a for a in assets}
done = sum(a["status"] == "generated" for a in assets)
columns = [neutral] + emotions
readme = ["# 十类情绪角色头像", "",
          f"共 {len(characters)} 个角色；每个角色 1 张沿用的中性头像 + 9 张新生成的情绪头像。"
          f"新生成 {done}/{len(assets)} 张。", "",
          "情绪类别来自 Astra 标注批次 `" + design["annotation_batch"] + "`；`category_id` 只对该批次有效，文件名使用语义 slug。", "",
          "[浏览器画廊](index.html) · [完整提示词](PROMPTS.md) · [生成记录](manifest.json) · [情绪与角色设计](emotion-design.json)", ""]
if "optimization" in manifest:
    readme += ["**平台尺寸优化：**九类表情图已用 Pillow / Lanczos 缩小为 256×256，再以无损 WebP 编码。"
               "缩小会减少细节；无损指编码精确保留缩小后的像素。未重新生成美术。"
               "中性列仍引用原始参考图；平台中性素材也已缩小。", "",
               "运行 `python3 docs/scenario-portraits/emotions/optimize.py` 可从固定 Git 版本重建，"
               "再运行 `prepare.py` 更新画廊。[逐图尺寸、哈希与体积](optimization.json)。", ""]
for r in design.get("revisions", []):
    readme += [f"**{r['date']} 修订：**{r['change']}", ""]
readme += ["| slug | ID | 类别 |", "| --- | --- | --- |"]
readme += [f"| `{e['slug']}` | {e['category_id']} | {e['zh']} |" for e in columns]
readme.append("")
for scene in dict.fromkeys(c["scene"] for c in characters):
    readme += [f"## {scene}", "",
               "| 角色 | " + " | ".join(e["zh"] for e in columns) + " |",
               "| --- |" + " --- |" * len(columns)]
    for c in characters:
        if c["scene"] != scene:
            continue
        cells = [f'<img src="{neutral_file(c)}" alt="{c["name"]}：{neutral["zh"]}" width="96" height="96" />']
        for e in emotions:
            a = by_key[f"{c['scenario']}/{c['id']}/{e['slug']}"]
            cells.append(f'<img src="{a["file"]}" alt="{c["name"]}：{e["zh"]}" width="96" height="96" />'
                         if a["status"] == "generated" else "（未生成）")
        readme.append(f"| {c['name']} | " + " | ".join(cells) + " |")
    readme.append("")
(HERE / "README.md").write_text("\n".join(readme))

# ---- index.html (local preview gallery) -----------------------------------
esc = html.escape
rows = []
toc = []
for scene in dict.fromkeys(c["scene"] for c in characters):
    sid = next(c["scenario"] for c in characters if c["scene"] == scene)
    toc.append(f'<a href="#{sid}">{esc(scene)}</a>')
    rows.append(f'<tbody data-scene="{sid}"><tr class="scene-row"><th colspan="{len(columns) + 1}" id="{sid}">{esc(scene)}</th></tr>')
    for c in characters:
        if c["scene"] != scene:
            continue
        cells = []
        n_src = neutral_file(c)
        cells.append(f'<td><a href="{n_src}"><img src="{n_src}" alt="{esc(c["name"])} · {esc(neutral["zh"])}" '
                     f'title="{esc(neutral["zh"])}（沿用）" loading="lazy" width="1254" height="1254"></a></td>')
        for e in emotions:
            a = by_key[f"{c['scenario']}/{c['id']}/{e['slug']}"]
            tip = f"{e['category_id']} {e['zh']}：{a['context']}"
            # Every cell points at its target file; missing files fall back to a
            # placeholder in the browser, so a reload shows progress mid-run.
            cells.append(f'<td title="{esc(tip)}"><a href="{a["file"]}"><img src="{a["file"]}" alt="{esc(c["name"])} · {esc(e["zh"])}" '
                         f'loading="lazy" width="{a.get("width", 1254)}" height="{a.get("height", 1254)}" onerror="missing(this)"></a></td>')
        rows.append(f'<tr data-name="{esc(c["name"] + " " + c["scene"] + " " + c["id"])}"><th scope="row">{esc(c["name"])}</th>{"".join(cells)}</tr>')
    rows.append("</tbody>")

legend = "".join(
    f'<tr><td><code>{e["slug"]}</code></td><td>{e["category_id"]}</td><td>{esc(e["zh"])}</td>'
    f'<td>{esc(categories[e["category_id"]]["definition"])}</td></tr>' for e in columns)
header_cells = f'<th scope="col">中性<br><small>{neutral["category_id"]} · 沿用</small></th>' + "".join(
    f'<th scope="col">{esc(e["zh"])}<br><small>{e["category_id"]}</small></th>' for e in emotions)

page = f"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>十类情绪头像</title>
<style>
body{{margin:0;background:#fff;color:#1a1a1a;font:15px/1.6 Verdana,Arial,"PingFang SC","Microsoft YaHei",sans-serif}}
main{{max-width:1320px;margin:0 auto;padding:20px 16px 40px}}
h1{{font-size:22px;margin:0 0 6px}} h2{{font-size:17px;margin:28px 0 8px}}
p{{margin:6px 0;max-width:72em}} a{{color:#1a0dab}} a:hover{{color:#660099}}
a:focus-visible,select:focus-visible,input:focus-visible{{outline:2px solid #1a0dab;outline-offset:2px}}
hr{{border:0;border-top:1px solid #ccc;margin:18px 0}}
.controls{{display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;margin:10px 0}}
.controls label{{font-size:14px}} input[type=search]{{font:inherit;padding:3px 6px;width:14em;max-width:100%}}
select{{font:inherit}}
.wrap{{overflow-x:auto;border:1px solid #ccc}}
table.grid{{border-collapse:collapse;min-width:100%}}
.grid th,.grid td{{border:1px solid #ddd;padding:3px;text-align:center;vertical-align:middle}}
.grid thead th{{position:sticky;top:0;background:#f4f4f4;font-size:12px;font-weight:bold;line-height:1.3;z-index:1}}
.grid thead th small{{font-weight:normal;color:#555}}
.grid thead th:first-child{{left:0;z-index:2}}
.grid tbody th[scope=row]{{position:sticky;left:0;z-index:1;font-size:13px;white-space:nowrap;text-align:left;padding:3px 8px;background:#fafafa}}
.grid .scene-row th{{text-align:left;background:#eee;font-size:14px;padding:6px 8px}}
.grid img{{display:block;width:var(--size,96px);height:auto;image-rendering:pixelated}}
.grid .pending{{display:flex;align-items:center;justify-content:center;width:var(--size,96px);height:var(--size,96px);color:#888;font-size:12px;background:#f4f4f4}}
table.legend{{border-collapse:collapse;font-size:13px;margin:6px 0}}
.legend td,.legend th{{border:1px solid #ddd;padding:3px 8px;text-align:left;vertical-align:top}}
tr[hidden],tbody[hidden]{{display:none}}
footer{{font-size:13px;color:#555;margin-top:18px}}
</style>
<script>
function missing(img){{var s=document.createElement('span');s.className='pending';s.textContent='未生成';img.parentNode.replaceWith(s)}}
</script>
</head>
<body>
<main>
<h1>十类情绪角色头像 · 本地预览</h1>
<p>{len(characters)} 个角色 × 10 种情绪。第一列「中性」沿用已定稿的 neutral 头像；其余九列为本轮新生成（<span id="done">{done}</span>/{len(assets)} 张已生成{'' if done == len(assets) else '；生成过程中刷新页面即可看到新图'}）。每行同一角色，列为同一情绪。点击任意头像打开原图；鼠标停留可看场景动机。</p>
<p>类别定义来自 Astra 标注批次 <code>{design['annotation_batch']}</code>。场景动机是美术演绎，不新增剧情事实，也不暗示投票或案件真相；纪川为生前形象。</p>
<p>跳转：{' · '.join(toc)} · <a href="#legend">类别定义</a> · <a href="PROMPTS.md">提示词</a> · <a href="manifest.json">生成记录</a></p>
{'<p>表情图已程序化缩小为 256×256 无损 WebP（Lanczos）；没有重新生成美术。<a href="optimization.json">压缩记录</a>。中性列沿用原始参考图。</p>' if 'optimization' in manifest else ''}
<div class="controls">
<label>显示尺寸
<select id="size">
<option value="32">32 px</option><option value="48">48 px</option><option value="72">72 px</option><option value="80" selected>80 px（平台最大）</option><option value="96">96 px</option><option value="128">128 px</option><option value="256">256 px</option>
</select></label>
<label>场景
<select id="scene"><option value="">全部</option>{''.join(f'<option value="{c}">{esc(s)}</option>' for s, c in dict.fromkeys((c["scene"], c["scenario"]) for c in characters))}</select></label>
<label>角色 <input id="q" type="search" placeholder="搜索角色" aria-label="搜索角色"></label>
</div>
<div class="wrap">
<table class="grid" id="grid">
<thead><tr><th scope="col">角色</th>{header_cells}</tr></thead>
{''.join(rows)}
</table>
</div>
<h2 id="legend">类别定义</h2>
<table class="legend"><thead><tr><th>slug</th><th>ID</th><th>类别</th><th>定义</th></tr></thead><tbody>{legend}</tbody></table>
<footer>生成：Codex CLI 内置 image_gen，每张以该角色 neutral 头像为输入参考图。数据：<a href="manifest.json">manifest.json</a>。</footer>
</main>
<script>
(function(){{
  var grid=document.getElementById('grid'),size=document.getElementById('size'),scene=document.getElementById('scene'),q=document.getElementById('q');
  function apply(){{
    grid.style.setProperty('--size',size.value+'px');
    var s=scene.value,t=q.value.trim().toLowerCase();
    grid.querySelectorAll('tbody').forEach(function(b){{
      var any=false;
      b.querySelectorAll('tr[data-name]').forEach(function(r){{
        var ok=(!s||b.dataset.scene===s)&&(!t||r.dataset.name.toLowerCase().indexOf(t)>=0);
        r.hidden=!ok; any=any||ok;
      }});
      b.hidden=!any;
    }});
  }}
  [size,scene].forEach(function(el){{el.addEventListener('change',apply)}});
  q.addEventListener('input',apply);
  apply();
  if(window.fetch)fetch('manifest.json',{{cache:'no-store'}}).then(function(r){{return r.json()}}).then(function(m){{
    document.getElementById('done').textContent=m.assets.filter(function(a){{return a.status==='generated'}}).length;
  }}).catch(function(){{}});
}})();
</script>
</body>
</html>
"""
(HERE / "index.html").write_text(page)

print(f"Prepared {len(assets)} prompts for {len(characters)} characters; generated {done}.")
if missing:
    print("No emotion contexts yet for: " + ", ".join(missing))
