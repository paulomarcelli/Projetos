"""Separa os quadros de uma folha de sprites gerada por IA (fundo branco, quadros soltos).

Uso: python3 ferramentas/fatiar_folha.py FOLHA.webp --nomes parada:5,correndo:8 --saida arte/sprites/recortes

- Recorta o fundo com o mesmo método de ferramentas/recortar.py.
- Cada personagem vira uma peça; pedaços menores (arco, mecha de cabelo) se juntam à peça mais próxima.
- Ordena por linha (de cima para baixo) e, em cada linha, da esquerda para a direita.
- Mantém a escala da folha: todos os quadros saem no mesmo tamanho relativo.
"""
import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from recortar import componentes, mascara_fundo, dilatar  # noqa: E402


def recorte_completo(caminho):
    rgb = np.asarray(Image.open(caminho).convert('RGB')).astype(np.float32)
    # folhas têm quadros pequenos: áreas brancas fechadas menores também são fundo
    fundo = mascara_fundo(rgb.astype(np.uint8), fracao_buraco=0.00022)
    alpha = np.where(fundo, 0.0, 1.0)
    faixa = dilatar(fundo, 2) & ~fundo
    alpha = np.where(faixa, np.minimum(alpha, np.clip((252.0 - rgb.min(axis=2)) / 100.0, 0, 1)), alpha)
    a = np.maximum(alpha, 1e-3)[..., None]
    cor = np.where((alpha > 0)[..., None], np.clip((rgb - (1 - a) * 255.0) / a, 0, 255), 0)
    return cor, alpha


def fatiar(caminho, linhas):
    cor, alpha = recorte_completo(caminho)
    rot, areas = componentes(alpha > 0.5)
    maior = areas[1:].max()
    ids = np.arange(len(areas))
    principais = [i for i in ids[1:] if areas[i] >= maior * 0.25]
    pequenos = [i for i in ids[1:] if maior * 0.003 <= areas[i] < maior * 0.25]

    def caixa(m):
        ys, xs = np.nonzero(m)
        return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1

    caixas = {i: caixa(rot == i) for i in principais}
    dono = {i: i for i in principais}
    for i in pequenos:  # junta ao personagem cujo retângulo está mais perto
        x0, y0, x1, y1 = caixa(rot == i)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        def dist(j):
            a0, b0, a1, b1 = caixas[j]
            return max(a0 - cx, 0, cx - a1) + max(b0 - cy, 0, cy - b1)
        perto = min(principais, key=dist)
        if dist(perto) < 25:
            dono[i] = perto

    # ordena: agrupa em linhas pelo centro vertical, depois por x
    centros = sorted(principais, key=lambda j: (caixas[j][1] + caixas[j][3]) / 2)
    grupos, atual = [], [centros[0]]
    for j in centros[1:]:
        yc = (caixas[j][1] + caixas[j][3]) / 2
        yref = np.mean([(caixas[k][1] + caixas[k][3]) / 2 for k in atual])
        (atual.append(j) if abs(yc - yref) < 120 else (grupos.append(atual), atual := [j]))
    grupos.append(atual)
    ordem = [sorted(g, key=lambda j: caixas[j][0]) for g in grupos]

    contagem = [n for _, n in linhas]
    if [len(g) for g in ordem] != contagem:
        if len(linhas) == 1:
            # plano B: quadros encostados (cabelo ou flecha tocando o vizinho). Corta nos vales
            # de menor tinta perto de onde cada divisão deveria estar.
            return fatiar_por_vales(cor, alpha, linhas[0])
        raise SystemExit(f'{caminho}: esperava {contagem} quadros por linha, encontrei {[len(g) for g in ordem]}')

    quadros = []
    for (nome, _), grupo in zip(linhas, ordem):
        for n, j in enumerate(grupo, 1):
            m = np.isin(rot, [k for k, d in dono.items() if d == j])
            m = m | ((alpha > 0) & (alpha <= 0.5) & dilatar(m, 2))
            a = np.where(m, alpha, 0.0)
            img = Image.fromarray(np.dstack([cor, a * 255]).astype(np.uint8), 'RGBA')
            quadros.append((f'{nome}_{n:02d}', img.crop(img.getbbox())))
    return quadros


def fatiar_por_vales(cor, alpha, linha):
    nome, n = linha
    ys, xs = np.nonzero(alpha > 0.5)
    x0, x1 = xs.min(), xs.max() + 1
    perfil = (alpha > 0.5).sum(axis=0).astype(float)
    largura = (x1 - x0) / n
    cortes = [x0]
    for k in range(1, n):
        alvo = int(x0 + k * largura)
        janela = range(max(alvo - int(largura * 0.25), x0), min(alvo + int(largura * 0.25), x1))
        cortes.append(min(janela, key=lambda x: perfil[x]))
    cortes.append(x1)
    quadros = []
    for i in range(n):
        a = np.zeros_like(alpha)
        a[:, cortes[i]:cortes[i + 1]] = alpha[:, cortes[i]:cortes[i + 1]]
        img = Image.fromarray(np.dstack([cor, a * 255]).astype(np.uint8), 'RGBA')
        quadros.append((f'{nome}_{i + 1:02d}', img.crop(img.getbbox())))
    print(f'(plano B: cortes em x = {cortes})')
    return quadros


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('folha')
    ap.add_argument('--nomes', required=True, help='linhas no formato nome:quantidade,nome:quantidade')
    ap.add_argument('--saida', required=True)
    args = ap.parse_args()
    linhas = [(p.split(':')[0], int(p.split(':')[1])) for p in args.nomes.split(',')]
    saida = Path(args.saida); saida.mkdir(parents=True, exist_ok=True)
    for nome, img in fatiar(args.folha, linhas):
        img.save(saida / f'aurora_{nome}.png')
        print(f'aurora_{nome}.png {img.size[0]}x{img.size[1]}')


if __name__ == '__main__':
    main()
