"""Paste an existing QR using the approved layout, then verify the final PNG."""

import argparse
import hashlib
import io
import json
from pathlib import Path

from PIL import Image, ImageChops
import zxingcpp


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def decoded(image):
    return [r.text for r in zxingcpp.read_barcodes(image.convert('RGB'))]


def main():
    package = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('base', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--layout', type=Path, default=package / 'layouts' / 'portrait.json')
    args = parser.parse_args()
    source_path = args.base.resolve()
    output_path = args.output.resolve()
    report_path = output_path.with_name(output_path.name + '.verification.json')
    if output_path.exists() or report_path.exists():
        raise FileExistsError('Choose a new output filename.')

    layout_path = args.layout.resolve()
    config = json.loads(layout_path.read_text(encoding='utf-8'))
    qr_path = (layout_path.parent / config['qr_source']).resolve()
    source_hash, qr_hash = digest(source_path), digest(qr_path)
    with Image.open(source_path) as original:
        if 'A' in original.getbands() and original.getchannel('A').getextrema() != (255, 255):
            raise ValueError('Base poster must be opaque.')
        source = original.convert('RGB')
    expected_size = (config['canvas']['width'], config['canvas']['height'])
    if source.size != expected_size:
        raise ValueError(f'Base size {source.size} does not match layout {expected_size}.')

    box = tuple(config['qr_box'])
    left, top, right, bottom = box
    side = config['qr_side']
    if not (0 <= left < right <= source.width and 0 <= top < bottom <= source.height):
        raise ValueError('QR rectangle is outside the canvas.')
    if right - left != side or bottom - top != side:
        raise ValueError('QR rectangle must match qr_side.')
    modules = config['qr_total_modules_including_quiet_zone']
    if side % modules:
        raise ValueError('QR side must use an integer number of pixels per module.')
    if source.crop(box).convert('L').getextrema()[0] < 220:
        raise ValueError('Reserved QR region contains visible artwork or text.')

    qr = Image.open(qr_path).convert('RGB')
    url = config['qr_url']
    if url not in decoded(qr):
        raise ValueError('Source QR does not encode the configured URL.')
    output = source.copy()
    output.paste(qr.resize((side, side), Image.Resampling.NEAREST), (left, top))

    if url not in decoded(output):
        raise ValueError('Final poster QR could not be decoded.')
    scaled_size = (474, round(source.height * 474 / source.width))
    if url not in decoded(output.resize(scaled_size, Image.Resampling.LANCZOS)):
        raise ValueError('QR failed the reduced-size scan.')
    compressed = io.BytesIO()
    output.save(compressed, format='JPEG', quality=85)
    compressed.seek(0)
    if url not in decoded(Image.open(compressed)):
        raise ValueError('QR failed the JPEG quality 85 scan.')

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output.save(output_path, dpi=(300, 300))
    with Image.open(output_path) as saved_file:
        saved = saved_file.convert('RGB')
    difference = ImageChops.difference(source, saved)
    difference.paste((0, 0, 0), box)
    if difference.getbbox() is not None:
        raise ValueError('Pixels outside the QR area changed.')
    if url not in decoded(saved):
        raise ValueError('Saved PNG could not be decoded.')
    if digest(source_path) != source_hash or digest(qr_path) != qr_hash:
        raise ValueError('An input file changed unexpectedly.')

    report = {
        'source': str(source_path), 'source_sha256': source_hash,
        'qr_source': str(qr_path), 'qr_source_sha256': qr_hash,
        'layout': str(layout_path), 'layout_sha256': digest(layout_path),
        'output': str(output_path), 'output_sha256': digest(output_path),
        'canvas': list(source.size), 'qr_box': list(box), 'qr_side': side,
        'qr_module_size_px': side // modules, 'decoded_url': url,
        'checks': {
            'outside_qr_pixels_unchanged': True, 'inputs_unchanged': True,
            'full_poster_decoded': True, 'width_474px_decoded': True,
            'jpeg_quality_85_decoded': True,
        },
    }
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8', newline='\n')
    print(json.dumps(report, ensure_ascii=True, indent=2))


if __name__ == '__main__':
    main()
