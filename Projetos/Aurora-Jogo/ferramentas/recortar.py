"""Recorta o fundo branco das poses da Aurora (geradas por IA) e salva PNG com transparência.

Uso: python3 ferramentas/recortar.py arte/poses-originais/*.webp --saida arte/sprites/recortes

1. Fundo = pixels quase brancos e sem cor ligados à borda (o branco dos olhos fica).
2. Borda suave: pixels claros na fronteira viram semitransparentes, sem halo branco.
3. Remove pedaços soltos pequenos (estrelinhas, linhas de movimento).
"""
import argparse
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

AREA_FRACAO_BURACO = 0.0006  # área branca fechada maior que 0,06% da imagem é fundo


def mascara_fundo(rgb, fracao_buraco=None, limiar=232, espalho=24):
    """limiar/espalho: quão branco e cinza um pixel precisa ser para contar como fundo (estrito: 247/8, para toalhas creme)."""
    h, w, _ = rgb.shape
    mn, mx = rgb.min(axis=2), rgb.max(axis=2)
    candidato = (mn >= limiar) & ((mx - mn) <= espalho)
    fundo = np.zeros((h, w), bool)
    fila = deque()
    for x in range(w):
        for y in (0, h - 1):
            if candidato[y, x] and not fundo[y, x]:
                fundo[y, x] = True; fila.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if candidato[y, x] and not fundo[y, x]:
                fundo[y, x] = True; fila.append((y, x))
    while fila:
        y, x = fila.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and candidato[ny, nx] and not fundo[ny, nx]:
                fundo[ny, nx] = True; fila.append((ny, nx))
    # áreas brancas fechadas grandes (ex.: entre o arco e a corda) também são fundo;
    # as pequenas (brilho dos olhos, reflexos) ficam
    rot, areas = componentes(candidato & ~fundo)
    grande = areas >= max(120, (fracao_buraco or AREA_FRACAO_BURACO) * h * w)
    grande[0] = False
    return fundo | grande[rot]


def dilatar(m, r):
    out = m.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            out |= np.roll(np.roll(m, dy, 0), dx, 1)
    return out


def componentes(opaco):
    """Rotula regiões conectadas (8 vizinhos). Devolve rótulos e áreas."""
    h, w = opaco.shape
    rot = np.zeros((h, w), np.int32)
    areas = [0]
    atual = 0
    for y0, x0 in zip(*np.nonzero(opaco)):
        if rot[y0, x0]:
            continue
        atual += 1; area = 0
        rot[y0, x0] = atual; fila = deque([(y0, x0)])
        while fila:
            y, x = fila.popleft(); area += 1
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and opaco[ny, nx] and not rot[ny, nx]:
                        rot[ny, nx] = atual; fila.append((ny, nx))
        areas.append(area)
    return rot, np.array(areas)


def recortar(caminho):
    rgb = np.asarray(Image.open(caminho).convert('RGB')).astype(np.float32)
    fundo = mascara_fundo(rgb.astype(np.uint8))
    alpha = np.where(fundo, 0.0, 1.0)

    # borda suave: faixa de 2 px fora do fundo; quanto mais clara, mais transparente
    faixa = dilatar(fundo, 2) & ~fundo
    claro = rgb.min(axis=2)
    a_borda = np.clip((252.0 - claro) / 100.0, 0.0, 1.0)
    alpha = np.where(faixa, np.minimum(alpha, a_borda), alpha)
    # remove a mistura com o branco nas bordas (descontaminação de cor)
    a = np.maximum(alpha, 1e-3)[..., None]
    cor = np.clip((rgb - (1 - a) * 255.0) / a, 0, 255)
    cor = np.where((alpha > 0)[..., None], cor, 0)

    # pedaços soltos pequenos saem
    rot, areas = componentes(alpha > 0.5)
    maior = areas[1:].max()
    manter = np.zeros(len(areas), bool)
    manter[1:] = areas[1:] >= maior * 0.02
    alpha = np.where(manter[rot] | (alpha <= 0.5) & dilatar(manter[rot], 2), alpha, 0.0)

    img = Image.fromarray(np.dstack([cor, alpha * 255]).astype(np.uint8), 'RGBA')
    return img.crop(img.getbbox())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('entradas', nargs='+')
    ap.add_argument('--saida', required=True)
    args = ap.parse_args()
    saida = Path(args.saida); saida.mkdir(parents=True, exist_ok=True)
    for e in args.entradas:
        img = recortar(e)
        destino = saida / (Path(e).stem + '.png')
        img.save(destino)
        print(f'{destino.name}: {img.size[0]}x{img.size[1]}')


if __name__ == '__main__':
    main()
