"""Recorta arte gerada sobre fundo verde (chroma key #00FF00) e separa as peças.

Uso (na pasta Aurora-Jogo):
  python3 ferramentas/recortar_verde.py FOLHA.png --saida PASTA --nomes a,b,c      # separa as peças (linha a linha, da esquerda p/ direita)
  python3 ferramentas/recortar_verde.py FOLHA.png --saida PASTA --inteira NOME     # só tira o verde (camada de fundo)

- Verde = canal G bem acima de R e B. A borda ganha alfa parcial e perde o tom verde (despill), para não sobrar halo.
- Peças pequenas (gravetos, flocos soltos) se juntam à peça cujo retângulo está mais perto.
"""
import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from recortar import componentes  # noqa: E402


def tirar_verde(caminho):
    rgb = np.asarray(Image.open(caminho).convert('RGB')).astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    excesso = g - np.maximum(r, b)                       # quanto o verde passa dos outros canais
    alpha = np.clip(1.0 - (excesso - 40) / 90.0, 0, 1)   # >130 = fundo; <40 = opaco
    # despill: na borda, o verde não pode passar do maior dos outros dois canais
    g2 = np.where(excesso > 0, np.maximum(r, b) + np.clip(excesso, 0, 12), g)
    cor = np.dstack([r, g2, b])
    return np.dstack([cor, alpha * 255]).clip(0, 255).astype(np.uint8)


def pecas(rgba, n_min_frac=0.01):
    rot, areas = componentes(rgba[..., 3] > 128)
    maior = areas[1:].max()
    grandes = [i for i in range(1, len(areas)) if areas[i] >= maior * n_min_frac]
    pequenas = [i for i in range(1, len(areas)) if 30 <= areas[i] < maior * n_min_frac]
    caixa = {}
    for i in grandes + pequenas:
        ys, xs = np.nonzero(rot == i)
        caixa[i] = [xs.min(), ys.min(), xs.max() + 1, ys.max() + 1]
    dono = {i: i for i in grandes}
    for i in pequenas:
        x0, y0, x1, y1 = caixa[i]; cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        def dist(j):
            a0, b0, a1, b1 = caixa[j]
            return max(a0 - cx, 0, cx - a1) + max(b0 - cy, 0, cy - b1)
        dono[i] = min(grandes, key=dist)
    saida = []
    for i in grandes:
        membros = [k for k, d in dono.items() if d == i]
        m = np.isin(rot, membros)
        x0 = min(caixa[k][0] for k in membros); y0 = min(caixa[k][1] for k in membros)
        x1 = max(caixa[k][2] for k in membros); y1 = max(caixa[k][3] for k in membros)
        img = rgba[y0:y1, x0:x1].copy()
        # mantém a borda suave (alfa parcial) perto da peça, apaga o que é de outras peças
        perto = m[y0:y1, x0:x1]
        from recortar import dilatar
        img[..., 3] = np.where(dilatar(perto, 2), img[..., 3], 0)
        saida.append(((y0 + y1) / 2, x0, img))
    altura = rgba.shape[0]
    saida.sort(key=lambda p: (round(p[0] / (altura / 2.2)), p[1]))
    return [p[2] for p in saida]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('folha'); ap.add_argument('--saida', required=True)
    ap.add_argument('--nomes'); ap.add_argument('--inteira')
    a = ap.parse_args()
    rgba = tirar_verde(a.folha)
    out = Path(a.saida); out.mkdir(parents=True, exist_ok=True)
    if a.inteira:
        Image.fromarray(rgba).save(out / f'{a.inteira}.png'); print(a.inteira, rgba.shape[1::-1]); return
    nomes = a.nomes.split(',')
    lista = pecas(rgba)
    if len(lista) != len(nomes):
        print(f'atenção: {len(lista)} peças encontradas, {len(nomes)} nomes')
    for nome, img in zip(nomes, lista):
        Image.fromarray(img).save(out / f'{nome}.png'); print(nome, img.shape[1], 'x', img.shape[0])


if __name__ == '__main__':
    main()
