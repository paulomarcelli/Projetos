#!/usr/bin/env python3
"""Recorta a folha da sombra de névoa (Gemini) em quadros com transparência e monta a folha do jogo.

A sombra é fumaça: o recorte normal (ferramentas/recortar.py) apaga tudo que é claro e a névoa some.
Aqui a transparência vem da distância até o branco ("desmistura" do fundo branco):
  alfa = distância da cor até o branco / LIMIAR   e   cor = (cor - (1 - alfa)·branco) / alfa
e o miolo do corpo (buracos fechados, como o brilho dos olhos) fica opaco nos quadros sólidos.

Folha de entrada: 2 linhas, 4 quadros andando em cima e 3 de dano/morte embaixo (a última quase só névoa).
Uso (na pasta Aurora-Jogo):
  python3 ferramentas/fatiar_sombra.py arte/poses-originais/folha_sombra.png
Saídas: arte/sprites/sombra/sombra_folha.png e sombra_folha.json (+ prévia sobre o fundo do jogo).
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / 'arte/sprites/sombra'
LIMIAR = 90        # distância até o branco a partir da qual o pixel é opaco
ALTURA_ALVO = 96   # altura do corpo andando no jogo (px); a caixa de colisão tem 70
CEL = 256          # célula na resolução original (o jogo reduz com a escala do JSON: fica nítida em telas 2x)
LINHAS = [('andar', 4), ('morrer', 3)]
SOLIDOS = {'andar_01', 'andar_02', 'andar_03', 'andar_04', 'morrer_01'}


def desmisturar(rgb):
    dist = 255.0 - rgb.min(axis=2)
    a = np.clip(dist / LIMIAR, 0, 1)
    a = np.where(dist < 6, 0, a)  # ruído de compressão do branco
    aa = np.maximum(a, 1e-3)[..., None]
    cor = np.clip((rgb - (1 - aa) * 255.0) / aa, 0, 255)
    return cor, a


def colunas(a, n):
    """Divide uma linha em n quadros pelos vãos vazios mais largos entre eles."""
    perfil = (a > 0.05).sum(axis=0)
    vazio = perfil == 0
    vaos, x = [], 0
    while x < len(vazio):
        if vazio[x]:
            x0 = x
            while x < len(vazio) and vazio[x]:
                x += 1
            if x0 > 0 and x < len(vazio):
                vaos.append((x - x0, (x0 + x) // 2))
        x += 1
    cortes = sorted(c for _, c in sorted(vaos, reverse=True)[:n - 1])
    return [0] + cortes + [a.shape[1]]


def main(caminho):
    rgb = np.asarray(Image.open(caminho).convert('RGB')).astype(np.float32)
    cor, alfa = desmisturar(rgb)
    h = alfa.shape[0]
    perfil_y = (alfa > 0.05).sum(axis=1)
    meio = h // 4 + int(np.argmin(perfil_y[h // 4: 3 * h // 4]))  # linha vazia entre as duas fileiras
    quadros = []
    for (nome, n), (y0, y1) in zip(LINHAS, [(0, meio), (meio, h)]):
        a_l, c_l = alfa[y0:y1], cor[y0:y1]
        cortes = colunas(a_l, n)
        for i in range(n):
            a = a_l[:, cortes[i]:cortes[i + 1]].copy()
            c = c_l[:, cortes[i]:cortes[i + 1]]
            # tira pontinhos soltos muito pequenos
            rot, k = ndimage.label(a > 0.05)
            if k:
                areas = ndimage.sum(np.ones_like(rot), rot, index=np.arange(1, k + 1))
                a[np.isin(rot, np.nonzero(areas < 6)[0] + 1)] = 0
            q = f'{nome}_{i + 1:02d}'
            if q in SOLIDOS:
                # só os vãos com cor (brilho lilás dos olhos); vão branco entre mechas da cauda é fundo
                rgb_q = rgb[y0:y1, cortes[i]:cortes[i + 1]]
                colorido = (rgb_q.max(axis=2) - rgb_q.min(axis=2)) > 20
                buraco = ndimage.binary_fill_holes(a > 0.6) & ~(a > 0.6) & colorido
                a = np.maximum(a, buraco.astype(float))
            img = Image.fromarray(np.dstack([c, a * 255]).astype(np.uint8), 'RGBA')
            quadros.append((q, img))
    # escala do jogo (a mesma para todos), pela altura do 1º quadro andando
    bbox0 = quadros[0][1].getbbox()
    s = ALTURA_ALVO / (bbox0[3] - bbox0[1])
    SAIDA.mkdir(parents=True, exist_ok=True)
    folha = Image.new('RGBA', (CEL * 4, CEL * 2), (0, 0, 0, 0))
    meta = {'celula': CEL, 'escala': round(s, 4), 'ancora': 'centro da célula = centro do miolo do corpo', 'animacoes': {}}
    # centro de referência: centro da caixa de cada quadro (a névoa da cauda puxa para trás, então usa o
    # centro do miolo opaco)
    for j, (q, img) in enumerate(quadros):
        img = img.crop(img.getbbox())
        a = np.asarray(img.getchannel('A'), dtype=float) / 255
        miolo = a > 0.85 if (a > 0.85).sum() > 50 else a > 0.2
        ys, xs = np.nonzero(miolo)
        cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
        x, y = (j % 4) * CEL, (j // 4) * CEL
        folha.alpha_composite(img, (int(round(x + CEL / 2 - cx)), int(round(y + CEL / 2 - cy))))
        nome = q.split('_')[0]
        meta['animacoes'].setdefault(nome, []).append([x, y, CEL, CEL])
    folha.save(SAIDA / 'sombra_folha.png', optimize=True)
    (SAIDA / 'sombra_folha.json').write_text(json.dumps(meta, indent=2), encoding='utf-8')
    previa = Image.new('RGBA', folha.size, (42, 35, 80, 255)); previa.alpha_composite(folha)
    previa.convert('RGB').save(SAIDA / 'previa.png')
    print('sombra:', folha.size, {k: len(v) for k, v in meta['animacoes'].items()}, f'escala {s:.3f}')


if __name__ == '__main__':
    main(sys.argv[1])
