"""Separa quadros cujos arcos/lâminas se cruzam: acha o CORPO de cada quadro (partes grossas, sem arco nem lâmina),
agrupa em N corpos pela posição x e espalha a partir deles ao mesmo tempo, pixel a pixel, só por dentro do desenho
(Voronoi geodésico). Cada traço fino fica com o corpo que chega a ele primeiro pelo próprio traço.

Uso: python3 ferramentas/fatiar_por_corpos.py FOLHA.png NOME N SAIDA [--buraco 0.0012]
"""
import argparse
import sys
from collections import deque
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
import fatiar_folha as F  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('folha'); ap.add_argument('nome'); ap.add_argument('n', type=int); ap.add_argument('saida')
    ap.add_argument('--buraco', type=float, default=0.0012); ap.add_argument('--grosso', type=int, default=31)
    a = ap.parse_args()
    F.BURACO = a.buraco
    cor, alpha = F.recorte_completo(a.folha)
    op = alpha > 0.5
    corpo = cv2.morphologyEx(op.astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (a.grosso, a.grosso)))
    n, rot, est, cen = cv2.connectedComponentsWithStats(corpo, 8)
    maior = est[1:, cv2.CC_STAT_AREA].max()
    pecas = [i for i in range(1, n) if est[i, cv2.CC_STAT_AREA] > maior * 0.15]   # só troncos e pernas, não mãos soltas
    # agrupa as peças de corpo em N quadros pelos maiores vãos em x
    xs = sorted(pecas, key=lambda i: cen[i][0])
    vaos = sorted(range(len(xs) - 1), key=lambda k: -(cen[xs[k + 1]][0] - cen[xs[k]][0]))[:a.n - 1]
    grupo, g = {}, 0
    for k, i in enumerate(xs):
        grupo[i] = g
        if k in vaos:
            g += 1
    dono = np.full(op.shape, -1, np.int32)
    fila = deque()
    for i in pecas:
        ys, xx = np.nonzero(rot == i)
        dono[ys, xx] = grupo[i]
        fila.extend(zip(ys.tolist(), xx.tolist()))
    H, W = op.shape
    while fila:
        y, x = fila.popleft()
        d = dono[y, x]
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1), (y - 1, x - 1), (y - 1, x + 1), (y + 1, x - 1), (y + 1, x + 1)):
            if 0 <= ny < H and 0 <= nx < W and op[ny, nx] and dono[ny, nx] < 0:
                dono[ny, nx] = d
                fila.append((ny, nx))
    # a borda semitransparente vai com o pixel opaco mais perto
    borda = (alpha > 0) & (dono < 0)
    if borda.any():
        _, idx = cv2.distanceTransformWithLabels((dono < 0).astype(np.uint8), cv2.DIST_L2, 3, labelType=cv2.DIST_LABEL_PIXEL)
        ys, xx = np.nonzero(dono >= 0)
        rotulo = np.zeros(idx.max() + 1, np.int32) - 1
        rotulo[idx[ys, xx]] = dono[ys, xx]
        dono = np.where(borda, rotulo[idx], dono)
    saida = Path(a.saida); saida.mkdir(parents=True, exist_ok=True)
    for g in range(a.n):
        m = dono == g
        ys, xx = np.nonzero(m)
        r = np.dstack([cor, alpha * 255 * m]).clip(0, 255).astype(np.uint8)[ys.min():ys.max() + 1, xx.min():xx.max() + 1]
        Image.fromarray(r).save(saida / f'aurora_{a.nome}_{g + 1:02d}.png')
        print(f'aurora_{a.nome}_{g + 1:02d}.png {r.shape[1]}x{r.shape[0]}')


if __name__ == '__main__':
    main()
