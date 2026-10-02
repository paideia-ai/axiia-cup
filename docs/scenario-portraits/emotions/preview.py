"""Build a standalone, read-only portrait comparison: python3 preview.py OUTPUT.

Uses pinned original bytes from Git and existing optimized files. No image
generation, production services or credentials are involved.
"""

import html
import io
import json
import shutil
import sys
from pathlib import Path

from PIL import Image

from optimize import HERE, REPO, original


def main():
    output = Path(sys.argv[1]).resolve()
    output.mkdir(parents=True, exist_ok=True)
    report = json.loads((HERE / "optimization.json").read_text())
    manifest = json.loads((HERE / "manifest.json").read_text())
    characters = json.loads((HERE.parent / "manifest.json").read_text())["characters"]
    assets = {}
    for record in report["assets"]:
        path = Path(record["file"])
        relative = Path("optimized") / record["kind"] / path.parent.name / path.name
        target = output / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(REPO / path, target)
        assets[record["key"]] = (relative.as_posix(), record)

    examples = [
        "fengyiting-real/diaochan/caring",
        "fengyiting-real/dongzhuo/angry",
        "honnoji-decision/ashigaru/hesitant",
        "legal-harbor-murder-jury/chen-lan/sad",
        "fengyiting-real/lvbu/moved",
        "shangyang-court/shangyang/resolute",
        "trolley-problem/yiren/anxious",
        "honnoji-decision/chosokabe-envoy-neutral",
    ]
    labels = {a["key"]: f'{a["name"]} · {a["label"]}' for a in manifest["assets"]}
    labels.update({f'{c["scenario"]}/{c["id"]}-neutral': c["name"] + " · 中性" for c in characters})
    rows = []
    for index, key in enumerate(examples):
        selected, record = assets[key]
        data = original(record["source_file"])
        sample_dir = output / "samples"
        sample_dir.mkdir(exist_ok=True)
        source = f"samples/{index}-original.png"
        nearest = f"samples/{index}-nearest.webp"
        (output / source).write_bytes(data)
        image = Image.open(io.BytesIO(data)).convert("RGB")
        image.resize((256, 256), Image.Resampling.NEAREST).save(
            output / nearest, format="WEBP", lossless=True, method=6
        )
        cells = []
        for path in (source, nearest, selected):
            size = (output / path).stat().st_size / 1000
            cells.append(f'<td><a href="{path}"><img src="{path}" '
                         f'alt="{html.escape(labels[key])}" width="80" height="80"></a>'
                         f'<small>{size:.1f} kB</small></td>')
        rows.append(f'<tr><th scope="row">{html.escape(labels[key])}</th>{"".join(cells)}</tr>')

    gallery = []
    columns = [("neutral", "中性")] + [(k, v["zh"]) for k, v in manifest["emotions"].items()]
    for character in characters:
        prefix = f'{character["scenario"]}/{character["id"]}'
        cells = []
        for slug, label in columns:
            key = prefix + ("-neutral" if slug == "neutral" else "/" + slug)
            src, _ = assets[key]
            cells.append(f'<td><a href="{src}"><img src="{src}" loading="lazy" '
                         f'alt="{html.escape(character["name"] + " · " + label)}" width="80" height="80"></a></td>')
        gallery.append(f'<tr><th scope="row">{html.escape(character["name"])}</th>{"".join(cells)}</tr>')

    totals = []
    for kind, title in [("emotion", "PR 新增表情"), ("neutral", "平台中性头像")]:
        group = report["totals"][kind]
        reduction = (1 - group["after_bytes"] / group["before_bytes"]) * 100
        totals.append(f'<tr><th scope="row">{title}</th><td>{group["count"]}</td>'
                      f'<td>{group["before_bytes"] / 1e6:.2f} MB</td>'
                      f'<td>{group["after_bytes"] / 1e6:.2f} MB</td><td>{reduction:.2f}%</td></tr>')
    (output / "optimization.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    page = '''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Axiia Cup 头像压缩对比 · PR #272</title>
<style>
body{background:white;color:#171717;font:15px/1.65 Verdana,Arial,sans-serif;margin:20px auto;padding:0 16px;max-width:1080px}
h1{font-size:23px}h2{font-size:18px;margin-top:30px}a{color:#164b9b;text-decoration:underline}a:hover{color:#72317d}
a:focus-visible,select:focus-visible{outline:2px solid #164b9b;outline-offset:3px}
table{border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}
thead{background:#f4f4f4}.scroll{overflow:auto;max-width:100%;margin:12px 0}
.portraits img{display:block;width:var(--size,80px);height:var(--size,80px);object-fit:contain;image-rendering:pixelated}
.portraits td{vertical-align:top}.portraits th{font-size:13px;min-width:90px}small{display:block;color:#555;white-space:nowrap}
select{font:inherit}hr{border:0;border-top:1px solid #ccc;margin:24px 0}p{max-width:75em}
</style></head><body>
<h1>Axiia Cup 头像压缩对比</h1>
<p>PR #272 · 2026-10-02。正式方案：1254×1254 → <strong>256×256，Lanczos 缩小 + 无损 WebP</strong>。
全部沿用现有图片，无 AI 重新生成，无裁切。缩小会减少细节；编码精确保留缩小后的像素。</p>
<p><a href="#comparison">样张对比</a> · <a href="#gallery">全部 290 张</a> · <a href="optimization.json">逐图体积与校验记录</a> ·
<a href="https://github.com/paideia-ai/axiia-cup/pull/272">PR #272</a></p>
<p>平台最大头像为 80 CSS 像素，256px 可覆盖 3× 屏幕所需的 240px。下图使用平台的 pixelated 显示方式。
默认按 80px 检查，也可切换到移动端尺寸或放大查看。点击图片打开对应文件。</p>
<div class="scroll"><table><caption>文件体积（十进制 MB）</caption><thead><tr><th>图片集</th><th>张数</th><th>处理前</th><th>处理后</th><th>减少</th></tr></thead><tbody>''' + "".join(totals) + '''</tbody></table></div>
<p>中性头像的处理前体积按平台已有 WebP 统计；表情图按原始 PNG 统计。原始 PNG 留有独立备份和 Git 来源，未清理历史。</p>
<label for="size">显示尺寸：</label> <select id="size"><option>32</option><option>48</option><option>72</option><option selected>80</option><option>160</option><option>240</option><option>256</option></select> CSS px
<span id="density"></span>
<h2 id="comparison">样张：原图 / 最近邻 / Lanczos</h2>
<p>观察眼睛、嘴角、胡须及眼镜细线。最近邻保留硬边，但本批样张的细线更容易出现碎点；Lanczos 的细节更连贯，选为正式版本。</p>
<div class="scroll" tabindex="0" role="region" aria-label="算法对比，可横向滚动"><table class="portraits"><thead><tr><th>角色与表情</th><th>原图 1254px</th><th>最近邻 256px</th><th>Lanczos 256px · 已采用</th></tr></thead><tbody>''' + "".join(rows) + '''</tbody></table></div>
<h2 id="gallery">全部 290 张优化头像</h2><p>29 个角色，每人 1 张中性 + 9 张表情。此表全部为正式的 256px WebP。</p>
<div class="scroll" tabindex="0" role="region" aria-label="完整头像表，可横向滚动"><table class="portraits"><thead><tr><th>角色</th>''' + "".join(f'<th>{label}</th>' for _, label in columns) + '''</tr></thead><tbody>''' + "".join(gallery) + '''</tbody></table></div>
<hr><p>来源：main <code>b4c442f</code> 的头像尺寸定义；原图固定于 <code>304815f</code>。
每张输出已验证可解码、256×256、哈希一致，且 WebP 解码像素与缩小结果完全相同。</p>
<script>
const size=document.getElementById('size');
size.addEventListener('change',()=>document.body.style.setProperty('--size',size.value+'px'));
document.getElementById('density').textContent='（当前设备像素比：'+window.devicePixelRatio+'）';
</script></body></html>'''
    (output / "index.html").write_text(page)
    print(f"Built comparison with {len(assets)} optimized portraits and {len(examples)} samples: {output}")


if __name__ == "__main__":
    main()
