"""Desenha a montagem do boneco (arte/boneco/montagem.json) para conferir posições."""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parent.parent
m = json.loads((RAIZ / 'arte/boneco/montagem.json').read_text())
W, H = m['tela']
img = Image.new('RGBA', (W, H), (42, 35, 80, 255))
for p in m['pecas']:
    peca = Image.open(RAIZ / 'arte/boneco/partes' / (p['nome'] + '.png')).convert('RGBA')
    if p.get('rot'):
        peca = peca.rotate(p['rot'], resample=Image.BICUBIC, expand=True)
    if p.get('espelhar'):
        peca = peca.transpose(Image.FLIP_LEFT_RIGHT)
    img.alpha_composite(peca, (int(p['x']), int(p['y'])))
if '--grade' in sys.argv:
    d = ImageDraw.Draw(img)
    for x in range(0, W, 20):
        d.line([(x, 0), (x, H)], fill=(255, 255, 255, 40 if x % 100 else 110))
    for y in range(0, H, 20):
        d.line([(0, y), (W, y)], fill=(255, 255, 255, 40 if y % 100 else 110))
saida = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'montagem.png'
img.resize((W * 2, H * 2), Image.LANCZOS).save(saida)
