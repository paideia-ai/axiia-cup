"""Build the local review document from shipped artwork and the current catalog."""
import html
import json
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]
PUBLIC = ROOT / 'public'
ART = REPO / 'v2/web/public/achievements'
items = json.loads((ROOT / 'catalog.json').read_text())
assert len(items) == 31 and len({item['id'] for item in items}) == 31
assert all(item['id'] != 'blank-prompt' for item in items)
PUBLIC.mkdir(exist_ok=True)
(PUBLIC / 'icons').mkdir(exist_ok=True)
rows = []
for item in items:
    assert all(item[key].strip() for key in ('title', 'flavor', 'description', 'rule'))
    shutil.copy2(ART / f"{item['id']}.webp", PUBLIC / 'icons' / f"{item['id']}.webp")
    e = {key: html.escape(str(value)) for key, value in item.items()}
    rows.append(f'''<article id="{e['id']}"><img src="icons/{e['id']}.webp" alt="{e['title']}成就图标" width="96" height="96" loading="lazy"><div><h2>{e['title']}</h2><p>{e['tier']} · {e['mode']}</p><p>{e['description']}</p><p><i>{e['flavor']}</i></p><details><summary>判定规则</summary><p>{e['rule']}</p><p>{e['evidence']}</p></details></div></article>''')
page = '''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Axiia Cup 成就系统设计</title><style>body{max-width:850px;margin:32px auto;padding:0 18px;background:white;color:#202020;font:16px/1.7 Arial,sans-serif}h1{font-size:26px}h2{font-size:19px;margin:0}a,summary{color:#164ba0}a{text-decoration:underline}a:focus-visible,summary:focus-visible{outline:2px solid #164ba0;outline-offset:4px}article{display:flex;gap:20px;border-top:1px solid #ddd;padding:22px 0}article img{flex-shrink:0}p{margin:8px 0}summary{cursor:pointer}@media(max-width:520px){article{gap:12px}article img{width:64px;height:64px}}</style></head><body><h1>Axiia Cup 成就系统设计</h1><p>2026-10-03 · 31 项成就。本文展示全部规则，供实施审阅；实际平台会隐藏未获得的成就。</p><p><a href="catalog.json">结构化清单</a> · <a href="DESIGN.md">设计说明</a> · <a href="achievement-design.zip">下载文案与图标</a></p><nav aria-label="目录">__TOC__</nav><main>__ROWS__</main></body></html>'''
page = page.replace('__TOC__', ' · '.join(f'<a href="#{html.escape(item["id"])}">{html.escape(item["title"])}</a>' for item in items)).replace('__ROWS__', ''.join(rows))
(PUBLIC / 'index.html').write_text(page)
for name in ('catalog.json', 'DESIGN.md', 'prompts.json'):
    shutil.copy2(ROOT / name, PUBLIC / name)
with zipfile.ZipFile(PUBLIC / 'achievement-design.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for name in ('catalog.json', 'DESIGN.md', 'prompts.json'):
        archive.write(PUBLIC / name, name)
    for item in items:
        archive.write(PUBLIC / 'icons' / f"{item['id']}.webp", f"icons/{item['id']}.webp")
print(f'Built review document for {len(items)} achievements.')
