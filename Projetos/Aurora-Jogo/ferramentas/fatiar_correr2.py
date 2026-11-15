"""Recorta a folha da corrida da Aurora adulta (arte/figma/aurora_nova/correr2.png) quadro a quadro.

Uso (na pasta Aurora-Jogo):  python3 ferramentas/fatiar_correr2.py

A folha veio do Figma em DUAS fileiras: referência em pé + 4 quadros em cima e 3 quadros embaixo. Dois problemas
faziam a Aurora "diminuir ao correr":
  1. a bota da frente do 2º quadro encosta no elmo do quadro de baixo; o recorte antigo deu as botas ao quadro de
     baixo (um pedaço de bota aparecia acima da cabeça dela) e o 2º quadro ficava sem os pés, enterrado no chão;
  2. o gerador desenhou a fileira de baixo ~17% menor que a de cima (cabeça, corpo, tudo).
Aqui: (1) as duas figuras encostadas são separadas por uma linha traçada à mão (`BEIRA_DA_BOTA`) só na região do
toque, e o pedaço do elmo que a bota cobria é remendado com o elmo de outro quadro; (2) a fileira de baixo é ampliada (`ESCALA_DE_BAIXO`) para a cabeça ficar do tamanho da de cima.
Saída: arte/figma/aurora_nova/recortes/aurora_correr_01..08.png (01 = referência; ordem do ciclo de corrida).
"""
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
import fatiar_folha as F  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
FOLHA = RAIZ / 'arte/figma/aurora_nova/correr2.png'
SAIDA = RAIZ / 'arte/figma/aurora_nova/recortes'

# região onde a bota do quadro de cima cobre o elmo do quadro de baixo (px da folha)
TOQUE = (425, 405, 535, 475)          # x0, y0, x1, y1
BOTA_DE_TRAS = (255, 405, 335, 495)   # a outra bota do quadro de cima, que desce até a fileira de baixo
# beira esquerda da bota dentro de TOQUE (x, y a partir do canto da região), de cima para baixo
BEIRA_DA_BOTA = [(19, 0), (41, 29), (52, 34), (61, 36), (66, 39), (70, 46), (71, 52), (69, 60), (69, 70)]
LINHA_DE_BAIXO = 405                  # acima disso, tudo da peça grudada é do quadro de cima
# a fileira de baixo veio menor: cabeça (da tiara ao queixo) com 32 px contra 38 px na de cima, e corpo na mesma proporção
ESCALA_DE_BAIXO = 1.19


def main():
    F.BURACO = 0.00011                                   # apaga também os vãos brancos pequenos entre as pernas
    cor, alpha = F.recorte_completo(str(FOLHA))
    rgb = cor.astype(np.uint8)
    op = alpha > 0.5
    n, rot, est, cen = cv2.connectedComponentsWithStats(op.astype(np.uint8), 8)
    grandes = [i for i in range(1, n) if est[i, cv2.CC_STAT_AREA] > 3000]
    assert len(grandes) == 7, f'esperava 7 peças grandes (uma delas com 2 quadros grudados), achei {len(grandes)}'
    grudada = max(grandes, key=lambda i: est[i, cv2.CC_STAT_HEIGHT])
    dono = np.full(op.shape, -1, np.int32)
    for k, i in enumerate(grandes):
        if i != grudada:
            dono[rot == i] = k
    # separa a peça grudada: 100 = quadro de cima, 101 = quadro de baixo
    ys, xs = np.nonzero(rot == grudada)
    cima = ys < LINHA_DE_BAIXO
    x0, y0, x1, y1 = BOTA_DE_TRAS
    cima |= (xs >= x0) & (xs < x1) & (ys >= y0) & (ys < y1)
    dono[ys, xs] = np.where(cima, 100, 101)
    # na região do toque a separação é uma linha traçada à mão pela beira esquerda da bota (cano, tornozelo, pé):
    # à direita dela é a bota do quadro de cima; à esquerda, o elmo, o cabelo e o rosto do quadro de baixo.
    # (Por cor não dá: o contorno dos dois é o mesmo marrom escuro e o elmo passa na frente do tornozelo.)
    x0, y0, x1, y1 = TOQUE
    dentro = rot[y0:y1, x0:x1] == grudada
    lado = np.zeros(dentro.shape, np.uint8)
    cv2.fillPoly(lado, [np.array(BEIRA_DA_BOTA + [(x1 - x0, y1 - y0), (x1 - x0, 0)], np.int32)], 1)
    de_cima = dentro & (lado > 0)
    sub = dono[y0:y1, x0:x1]
    sub[dentro] = np.where(de_cima[dentro], 100, 101)
    # a bota cobria um pedaço do elmo do quadro de baixo: remenda com o elmo do último quadro da mesma fileira
    # (mesma cabeça de perfil), alinhado pela tiara
    ultimo = max((i for i in grandes if i != grudada and cen[i][1] > 330), key=lambda i: cen[i][0])
    ux, uy, uw, uh = est[ultimo, :4]
    cinza = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    molde = cinza[448:470, 440:478]                                    # tiara e pedra do quadro de baixo (px da folha)
    busca = cinza[uy:uy + 110, ux:ux + uw]
    res = cv2.matchTemplate(busca, molde, cv2.TM_CCOEFF_NORMED)
    _, nota, _, (bx, by) = cv2.minMaxLoc(res)
    dx, dy = ux + bx - 440, uy + by - 448
    assert nota > 0.6, f'não achei a tiara no último quadro (nota {nota:.2f})'
    rgb_baixo, alpha_baixo, remendo = rgb.copy(), alpha.copy(), np.zeros(op.shape, bool)
    yy, xx = np.nonzero(de_cima)
    yy, xx = yy + y0, xx + x0
    ok = (rot[yy + dy, xx + dx] == ultimo)
    rgb_baixo[yy[ok], xx[ok]] = rgb[yy[ok] + dy, xx[ok] + dx]
    alpha_baixo[yy[ok], xx[ok]] = alpha[yy[ok] + dy, xx[ok] + dx]
    remendo[yy[ok], xx[ok]] = True
    # pecinhas soltas e bordas semitransparentes vão com o quadro mais perto
    falta = (alpha > 0) & (dono < 0)
    if falta.any():
        _, idx = cv2.distanceTransformWithLabels((dono < 0).astype(np.uint8), cv2.DIST_L2, 3, labelType=cv2.DIST_LABEL_PIXEL)
        ys2, xs2 = np.nonzero(dono >= 0)
        rotulo = np.full(idx.max() + 1, -1, np.int32)
        rotulo[idx[ys2, xs2]] = dono[ys2, xs2]
        dono[falta] = rotulo[idx[falta]]

    def recorte(d):
        m = dono == d
        cores, al = rgb, alpha
        if d == 101:
            m, cores, al = m | remendo, rgb_baixo, alpha_baixo
        # só a maior peça de cada quadro e o que encosta nela (ilhas que sobram da separação somem)
        k2, r2, e2, _ = cv2.connectedComponentsWithStats((m & (al > 0.5)).astype(np.uint8), 8)
        if k2 > 2:
            maior = 1 + int(np.argmax(e2[1:, cv2.CC_STAT_AREA]))
            m &= cv2.dilate((r2 == maior).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
        ys3, xs3 = np.nonzero(m)
        a, b_, c, e = xs3.min(), ys3.min(), xs3.max() + 1, ys3.max() + 1
        out = np.dstack([cores[b_:e, a:c], (al[b_:e, a:c] * m[b_:e, a:c] * 255).astype(np.uint8)])
        return out, (a + c) / 2, (b_ + e) / 2

    quadros = [recorte(d) for d in sorted(set(dono[dono >= 0].tolist()))]
    # ordem do ciclo: fileira de cima da esquerda para a direita, depois a de baixo
    cima_ = sorted([q for q in quadros if q[2] < 330], key=lambda q: q[1])
    baixo_ = sorted([q for q in quadros if q[2] >= 330], key=lambda q: q[1])
    assert len(cima_) == 5 and len(baixo_) == 3, (len(cima_), len(baixo_))
    ordem = [(q[0], 1.0) for q in cima_] + [(q[0], ESCALA_DE_BAIXO) for q in baixo_]
    SAIDA.mkdir(parents=True, exist_ok=True)
    for i, (q, s) in enumerate(ordem, 1):
        im = Image.fromarray(q, 'RGBA')
        if s != 1.0:
            im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        im.save(SAIDA / f'aurora_correr_{i:02d}.png')
        print(f'aurora_correr_{i:02d}.png  escala {s:.2f}  tamanho {im.size}')


if __name__ == '__main__':
    main()
