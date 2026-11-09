"""Generate the real campaign QR as PNG and SVG."""

import argparse
import json
from pathlib import Path

import qrcode
import qrcode.image.svg
import zxingcpp
from PIL import Image


def main():
    package = Path(__file__).resolve().parent.parent
    manifest = json.loads((package / 'manifest.json').read_text(encoding='utf-8'))
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default=manifest['qr_url'])
    parser.add_argument('--png', type=Path, required=True)
    parser.add_argument('--svg', type=Path, required=True)
    args = parser.parse_args()
    if args.png.exists() or args.svg.exists():
        raise FileExistsError('Choose new output filenames.')
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=32, border=4)
    qr.add_data(args.url)
    qr.make(fit=True)
    args.png.parent.mkdir(parents=True, exist_ok=True)
    args.svg.parent.mkdir(parents=True, exist_ok=True)
    qr.make_image(fill_color='black', back_color='white').convert('RGB').save(args.png)
    qr.make_image(image_factory=qrcode.image.svg.SvgPathFillImage).save(args.svg)
    result = zxingcpp.read_barcode(Image.open(args.png).convert('RGB'))
    if result is None or result.text != args.url:
        raise ValueError('Generated QR does not decode to the requested URL.')
    print(json.dumps({'url': result.text, 'version': qr.version, 'modules_with_quiet_zone': len(qr.get_matrix())}))


if __name__ == '__main__':
    main()
