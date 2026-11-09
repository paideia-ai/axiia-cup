"""Validate committed posters, QR contents, pixel reproduction and local links."""

import argparse
import hashlib
import io
import json
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

from PIL import Image, ImageChops
import zxingcpp


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def decoded(image):
    return [r.text for r in zxingcpp.read_barcodes(image.convert('RGB'))]


def verify(package):
    manifest = json.loads((package / 'manifest.json').read_text(encoding='utf-8'))
    for relative, expected in manifest['file_sha256'].items():
        path = package / relative
        if not path.is_file() or sha256(path) != expected:
            raise ValueError(f'Asset hash mismatch: {relative}')
    qr_path = package / manifest['qr_png']
    qr = Image.open(qr_path).convert('RGB')
    url = manifest['qr_url']
    if url not in decoded(qr):
        raise ValueError('Source QR URL mismatch.')
    ET.parse(package / manifest['qr_svg'])

    posters = []
    for item in manifest['posters']:
        layout_path = package / item['layout']
        layout = json.loads(layout_path.read_text(encoding='utf-8'))
        if layout['copy'] != manifest['copy'] or layout['qr_url'] != url:
            raise ValueError(f'Campaign copy or URL mismatch: {item["id"]}')
        if sha256((layout_path.parent / layout['qr_source']).resolve()) != sha256(qr_path):
            raise ValueError('Layout references a different QR asset.')
        base = Image.open(package / item['base']).convert('RGB')
        final = Image.open(package / item['final']).convert('RGB')
        expected_size = (layout['canvas']['width'], layout['canvas']['height'])
        if base.size != expected_size or final.size != expected_size:
            raise ValueError(f'Canvas mismatch: {item["id"]}')
        left, top, right, bottom = layout['qr_box']
        side = layout['qr_side']
        if right - left != side or bottom - top != side or side % 41:
            raise ValueError('Invalid QR geometry.')
        if not (0 <= left < right <= base.width and 0 <= top < bottom <= base.height):
            raise ValueError('QR box exceeds the canvas.')
        if base.crop((left, top, right, bottom)).convert('L').getextrema()[0] < 220:
            raise ValueError('QR overlaps existing artwork or text.')
        rebuilt = base.copy()
        rebuilt.paste(qr.resize((side, side), Image.Resampling.NEAREST), (left, top))
        if ImageChops.difference(rebuilt, final).getbbox() is not None:
            raise ValueError(f'Poster differs from base plus QR: {item["id"]}')
        scaled = final.resize((474, round(final.height * 474 / final.width)), Image.Resampling.LANCZOS)
        compressed = io.BytesIO()
        final.save(compressed, format='JPEG', quality=85)
        compressed.seek(0)
        if any(url not in decoded(image) for image in [final, scaled, Image.open(compressed)]):
            raise ValueError(f'QR scan failed: {item["id"]}')
        posters.append({
            'id': item['id'], 'final': item['final'], 'canvas': list(final.size),
            'qr_box': layout['qr_box'], 'qr_side': side, 'decoded_url': url,
            'sha256': sha256(package / item['final']),
            'checks': {'pixel_reproduction': True, 'full_scan': True, 'width_474_scan': True, 'jpeg_quality_85_scan': True},
        })

    link_count = 0
    for path in package.rglob('*.md'):
        text = path.read_text(encoding='utf-8')
        for match in re.finditer(r'\]\(([^\s)]+)\)', text):
            target = match.group(1)
            parsed = urlsplit(target)
            if parsed.scheme or target.startswith('#'):
                continue
            if not (path.parent / unquote(parsed.path)).resolve().exists():
                raise ValueError(f'Broken local link in {path.name}: {target}')
            link_count += 1
    return {'status': 'passed', 'copy': manifest['copy'], 'qr_url': url, 'posters': posters, 'local_links_checked': link_count}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    result = verify(Path(__file__).resolve().parent.parent)
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(json.dumps(result, ensure_ascii=True, indent=2))


if __name__ == '__main__':
    main()
