"""Separa os quadros de uma folha de sprites gerada por IA (fundo branco, quadros soltos).

Uso: python3 ferramentas/fatiar_folha.py FOLHA.webp --nomes parada:5,correndo:8 --saida arte/sprites/recortes

- Recorta o fundo com o mesmo método de ferramentas/recortar.py.
- Cada personagem vira uma peça; pedaços menores (arco, mecha de cabelo) se juntam à peça mais próxima.
- Ordena por linha (de cima para baixo) e, em cada linha, da esquerda para a direita.
- Mantém a escala da folha: todos os quadros saem no mesmo tamanho relativo.
- --separar N (plano C): quando quadros se tocam por ligações finas (corda do arco, arco deitado no chão
  encostando no vizinho), afina a máscara N px para romper as ligações, acha as peças e devolve cada pixel
  à peça mais próxima. Use quando o plano B cortar pedaços de um quadro para dentro do outro.
"""
import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from recortar import componentes, mascara_fundo, dilatar  # noqa: E402


BURACO = 0.00022
ESTRITO = False   # --fundo-estrito: só o branco quase puro é fundo (toalhas e panos creme ou brancos acinzentados ficam)   # área branca fechada maior que esta fração da imagem também é fundo (vão entre arco e corda)


def recorte_completo(caminho):
    rgb = np.asarray(Image.open(caminho).convert('RGB')).astype(np.float32)
    # folhas têm quadros pequenos: áreas brancas fechadas menores também são fundo.
    # Com --manter-brancos (BURACO = 1) nada fechado é apagado: para roupas brancas (capinha de pele, meias).
    fundo = mascara_fundo(rgb.astype(np.uint8), fracao_buraco=BURACO, **({'limiar': 247, 'espalho': 8} if ESTRITO else {}))
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


def fatiar_separando(cor, alpha, linhas, raio, dar=()):
    import cv2
    from scipy import ndimage
    opaco = alpha > 0.5
    fino = cv2.erode(opaco.astype(np.uint8), np.ones((2 * raio + 1, 2 * raio + 1), np.uint8)) > 0
    rot, n = ndimage.label(fino, structure=np.ones((3, 3)))
    areas = ndimage.sum(np.ones_like(rot), rot, index=np.arange(1, n + 1))
    total = sum(q for _, q in linhas)
    principais = list(np.argsort(areas)[::-1][:total] + 1)
    # cada pixel visível vai para a peça principal mais próxima
    so_principais = np.isin(rot, principais)
    _, (iy, ix) = ndimage.distance_transform_edt(~so_principais, return_indices=True)
    dono = np.where(alpha > 0, rot[iy, ix], 0)
    caixas = {j: ndimage.find_objects((dono == j).astype(np.int32))[0] for j in principais}
    cy = {j: (caixas[j][0].start + caixas[j][0].stop) / 2 for j in principais}
    ordem, resto = [], sorted(principais, key=lambda j: cy[j])
    for _, q in linhas:  # linhas de cima para baixo, cada uma da esquerda para a direita
        ordem.append(sorted(resto[:q], key=lambda j: caixas[j][1].start)); resto = resto[q:]
    # correções manuais: um retângulo da folha (x0,y0,x1,y1) passa a ser do quadro N (1, 2, … na ordem de saída)
    em_ordem = [j for g in ordem for j in g]
    for (x0, y0, x1, y1), n_q in dar:
        caixa = dono[y0:y1, x0:x1]
        caixa[alpha[y0:y1, x0:x1] > 0] = em_ordem[n_q - 1]
    quadros = []
    for (nome, _), grupo in zip(linhas, ordem):
        for k, j in enumerate(grupo, 1):
            a = np.where(dono == j, alpha, 0.0)
            img = Image.fromarray(np.dstack([cor, a * 255]).astype(np.uint8), 'RGBA')
            quadros.append((f'{nome}_{k:02d}', img.crop(img.getbbox())))
    print(f'(plano C: máscara afinada {raio} px)')
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
    ap.add_argument('--manter-brancos', action='store_true',
                    help='não apaga áreas brancas fechadas (roupa branca); só o branco ligado à borda é fundo')
    ap.add_argument('--buraco', type=float, default=None, help='área branca fechada (fração da folha) a partir da qual vira fundo; ex.: 0.0025 apaga o vão do arco e mantém listras brancas')
    ap.add_argument('--fundo-estrito', action='store_true', help='só o branco quase puro é fundo (panos creme)')
    ap.add_argument('--separar', type=int, default=0, help='plano C: afina a máscara N px para separar quadros que se tocam')
    ap.add_argument('--dar', action='append', default=[], metavar='x0,y0,x1,y1:N',
                    help='com --separar: o retângulo da folha passa a ser do quadro N (ex.: ponta de lâmina encostada no vizinho)')
    args = ap.parse_args()
    global BURACO, ESTRITO
    ESTRITO = args.fundo_estrito
    if args.manter_brancos:
        BURACO = 1.0
    if args.buraco is not None:
        BURACO = args.buraco
    linhas = [(p.split(':')[0], int(p.split(':')[1])) for p in args.nomes.split(',')]
    saida = Path(args.saida); saida.mkdir(parents=True, exist_ok=True)
    if args.separar:
        cor, alpha = recorte_completo(args.folha)
        dar = [(tuple(int(v) for v in r.split(':')[0].split(',')), int(r.split(':')[1])) for r in args.dar]
        lista = fatiar_separando(cor, alpha, linhas, args.separar, dar)
    else:
        lista = fatiar(args.folha, linhas)
    for nome, img in lista:
        img.save(saida / f'aurora_{nome}.png')
        print(f'aurora_{nome}.png {img.size[0]}x{img.size[1]}')


if __name__ == '__main__':
    main()
