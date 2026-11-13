"""Extrai cada parte solta de uma folha de partes (fundo branco), ignorando linhas divisórias.

Uso: python3 ferramentas/extrair_partes.py arte/poses-originais/folha_partes.webp --saida arte/boneco/partes-brutas

Salva parte_NN.png (ordem: de cima para baixo, da esquerda para a direita) e um índice JSON com a
posição de cada parte na folha, para a gente dar nome a cada uma depois.
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from fatiar_folha import recorte_completo  # noqa: E402
from recortar import componentes, dilatar  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('folha')
    ap.add_argument('--saida', required=True)
    ap.add_argument('--area-min', type=int, default=150)
    args = ap.parse_args()
    cor, alpha = recorte_completo(args.folha)
    rot, areas = componentes(alpha > 0.5)
    pecas = []
    for i in range(1, len(areas)):
        if areas[i] < args.area_min:
            continue
        ys, xs = np.nonzero(rot == i)
        x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
        if (y1 - y0) <= 6 and (x1 - x0) > 150:      # linha divisória
            continue
        pecas.append((i, x0, y0, x1, y1))
    # ordena por faixas de altura (linhas do desenho) e depois por x
    pecas.sort(key=lambda p: ((p[2] + p[4]) / 2) // 90 * 10000 + p[1])
    saida = Path(args.saida); saida.mkdir(parents=True, exist_ok=True)
    indice = []
    for n, (i, x0, y0, x1, y1) in enumerate(pecas, 1):
        m = rot == i
        m = m | ((alpha > 0) & (alpha <= 0.5) & dilatar(m, 2))
        a = np.where(m, alpha, 0.0)
        img = Image.fromarray(np.dstack([cor, a * 255]).astype(np.uint8), 'RGBA').crop((x0, y0, x1, y1))
        nome = f'parte_{n:02d}.png'
        img.save(saida / nome)
        indice.append({'arquivo': nome, 'x': int(x0), 'y': int(y0), 'largura': int(x1 - x0), 'altura': int(y1 - y0)})
    (saida / 'indice.json').write_text(json.dumps(indice, indent=1), encoding='utf-8')
    print(len(indice), 'partes')


if __name__ == '__main__':
    main()
