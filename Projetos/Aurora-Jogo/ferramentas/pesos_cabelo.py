#!/usr/bin/env python3
"""Gera os "pesos do cabelo": quanto cada ponto do desenho pode se mexer com o vento.

Antes, o cabelo era deformado por caixas retangulares, e o corpo que caía dentro da caixa (costas, ombreira,
peito embaixo das tranças) balançava junto. Agora o peso vem do próprio desenho:
  - cabelo = pixel opaco, quase sem saturação e claro (o prateado do cabelo); armadura, pele e roupa são saturadas;
  - corpo = todo o resto que é opaco; o peso é zero no corpo e sobe aos poucos conforme se afasta dele;
  - o fundo transparente em volta do cabelo também ganha peso, para o cabelo poder "ocupar" esse espaço ao balançar.

Saídas (PNG, um canal por tipo de cabelo):
  jogo/assets/viva/aurora_viva_cabelo.png   R = cabelo solto, G = tranças (Aurora parada, mesma resolução / 2)
  arte/sprites/aurora_folha_cabelo.png      R = cabelo (folha de sprites inteira, em 1/4 da resolução)
  arte/sprites/aurora_folha_corpo.png       folha sem o cabelo que balança (camada fixa do jogo)
  arte/sprites/aurora_folha_mecha.png       só o cabelo que balança, 1/2 da resolução (camada da malha)

Uso (na pasta Aurora-Jogo):  python3 ferramentas/pesos_cabelo.py [aurora|crianca|sentar]   (sem nada: aurora)
"""
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent


def suave(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def mascara_cabelo(rgba, area_min, tirar_metal=True):
    """Cabelo: opaco, saturação baixa e valor médio/alto. Fecha os traços pretos de dentro e tira sobras."""
    a = rgba[..., 3] > 128
    hsv = cv2.cvtColor(np.ascontiguousarray(rgba[..., :3]), cv2.COLOR_RGB2HSV).astype(np.float32)
    h, s, v = hsv[..., 0] * 2, hsv[..., 1] / 255, hsv[..., 2] / 255
    # o prata da armadura puxa para o azul (matiz 170–265°); o cabelo puxa para o rosa/lilás
    metal = (h > 170) & (h < 265) & (s > 0.035)
    cab = (a & (s < 0.17) & (v > 0.36) & (~metal if tirar_metal else True)).astype(np.uint8)
    k = max(3, int(round(min(rgba.shape[:2]) * 0.008)) | 1)
    cab = cv2.morphologyEx(cab, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))) & a
    n, rot, est, _ = cv2.connectedComponentsWithStats(cab, 8)
    limpo = np.zeros_like(cab)
    for i in range(1, n):
        if est[i, cv2.CC_STAT_AREA] >= area_min:
            limpo[rot == i] = 1
    return limpo.astype(bool), a


def pesos(rgba, folga_px, borda_px, area_min, ate_y=None):
    """Peso 0..1: zero no corpo, sobe com a distância ao corpo; inclui o fundo perto do cabelo."""
    cab, opaco = mascara_cabelo(rgba, area_min)
    if ate_y is not None:  # cabelo só da cabeça até a cintura (embaixo há grevas e o arco, também prateados)
        cab[int(ate_y):] = False
    corpo = opaco & ~cab
    dist = cv2.distanceTransform((~corpo).astype(np.uint8), cv2.DIST_L2, 5)
    kk = int(folga_px) * 2 + 1
    perto = cv2.dilate(cab.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kk, kk))).astype(bool)
    regiao = (perto & ~corpo).astype(np.float32)
    w = regiao * suave(1.5, borda_px, dist)
    return cv2.GaussianBlur(w, (0, 0), max(1.0, borda_px * 0.25)), cab


def pesos_pela_raiz(rgba, cel, sem_branco=True, tirar_metal=True):
    """Variante para desenhos em que o cabelo cai rente ao corpo (Aurora criança, sentar do Figma): o peso cresce
    da raiz (alto da cabeça, peso 0) para as pontas, só no cabelo ATRÁS da cabeça (os desenhos olham para a direita),
    e cai perto do corpo só um pouco (as mechas das costas, coladas no vestido, ainda balançam).
    sem_branco: tira o branco quase puro (capinha de pele, pele branca) que tem a mesma cor do cabelo."""
    a = rgba[..., 3] > 128
    if not a.any():
        return np.zeros(rgba.shape[:2], np.float32)
    cab, opaco = mascara_cabelo(rgba, area_min=cel * cel * 0.002, tirar_metal=tirar_metal)
    if sem_branco:
        hsv = cv2.cvtColor(np.ascontiguousarray(rgba[..., :3]), cv2.COLOR_RGB2HSV).astype(np.float32)
        branco = (hsv[..., 1] / 255 < 0.05) & (hsv[..., 2] / 255 > 0.86)
        branco = cv2.dilate(branco.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
        cab &= ~branco
    ys = np.nonzero(a.any(axis=1))[0]
    topo, base = ys[0], ys[-1]
    alt = base - topo
    faixa = a[topo:topo + max(2, int(alt * 0.12))]
    cx = np.nonzero(faixa)[1].mean()                   # meio da cabeça
    H, W = a.shape
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    desce = np.clip((yy - (topo + alt * 0.10)) / (alt * 0.42), 0, 1) ** 1.1
    atras = suave(cx + cel * 0.02, cx - cel * 0.10, xx)     # 1 atrás da cabeça, 0 na frente (rosto)
    corpo = opaco & ~cab
    dist = cv2.distanceTransform((~corpo).astype(np.uint8), cv2.DIST_L2, 5)
    perto = cv2.dilate(cab.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (int(cel * 0.05) * 2 + 1,) * 2)).astype(bool)
    regiao = (perto & ~corpo).astype(np.float32)
    w = regiao * desce * atras * (0.35 + 0.65 * suave(1.0, cel * 0.03, dist))
    w = cv2.GaussianBlur(w, (0, 0), max(1.0, cel * 0.008))
    nz = w[w > 0.02]
    m = np.percentile(nz, 90) if nz.size > 50 else w.max()
    return np.clip(w * (0.9 / m), 0, 1) if m > 0.02 else w        # cada quadro com as pontas soltas de verdade


def viva():
    pasta = RAIZ / 'jogo/assets/viva'
    meta = json.loads((pasta / 'aurora_viva.json').read_text(encoding='utf-8'))
    rgba = np.array(Image.open(pasta / 'aurora_olhos_abertos_mao_aberta.png').convert('RGBA'))
    h, w = rgba.shape[:2]
    peso, cab = pesos(rgba, folga_px=w * 0.06, borda_px=w * 0.045, area_min=w * h * 0.0015, ate_y=meta['cabelo'][3] + 15)
    # tranças = cabelo dentro da caixa das tranças (na frente do peito); o resto é cabelo solto
    x0, y0, x1, y1 = meta['tranca']
    tr = np.zeros_like(peso)
    tr[y0:y1, x0:x1] = 1
    tr = cv2.GaussianBlur(tr, (0, 0), 6)
    # nas tranças a borda até o corpo é curta (elas ficam em cima do peito): peso próprio, menor
    peso_t, _ = pesos(rgba, folga_px=w * 0.02, borda_px=w * 0.02, area_min=w * h * 0.0015, ate_y=meta['tranca'][3] + 10)
    solto = peso * (1 - tr)
    tranca = peso_t * tr
    img = np.zeros((h, w, 3), np.uint8)
    img[..., 0] = np.clip(solto * 255, 0, 255)
    img[..., 1] = np.clip(tranca * 255, 0, 255)
    Image.fromarray(img).resize((w // 2, h // 2), Image.BILINEAR).save(pasta / 'aurora_viva_cabelo.png')
    print('viva:', pasta / 'aurora_viva_cabelo.png', f'cabelo {cab.mean():.1%} da imagem')


def quadros_da_folha(meta):
    """retângulos dos quadros: folhas de animação (animacoes) ou de peças (pecas)"""
    if 'animacoes' in meta:
        return [q for a in meta['animacoes'].values() for q in a['quadros']]
    return [p['quadro'] for p in meta['pecas'].values()]


def folha(nome='aurora', ate=0.6, pela_raiz=False, tirar_metal=True):
    """nome: aurora (adulta), crianca (Prólogo) ou sentar (Figma). ate: até que fração da altura há cabelo."""
    meta = json.loads((RAIZ / f'arte/sprites/{nome}_folha.json').read_text(encoding='utf-8'))
    sheet = np.array(Image.open(RAIZ / f'arte/sprites/{nome}_folha.png').convert('RGBA'))
    saida = np.zeros(sheet.shape[:2], np.float32)
    cel = meta['celula'] if isinstance(meta['celula'], int) else meta['celula'][1]
    for x, y, w, h in quadros_da_folha(meta):
        rgba = sheet[y:y + h, x:x + w]
        if rgba[..., 3].max() == 0:
            continue
        ys = np.nonzero(rgba[..., 3].max(axis=1) > 128)[0]
        topo, base = ys[0], ys[-1]
        if pela_raiz:
            p = pesos_pela_raiz(rgba, cel, tirar_metal=tirar_metal)
            p[int(topo + (base - topo) * ate):] = 0
        else:
            p, _ = pesos(rgba, folga_px=cel * 0.05, borda_px=cel * 0.04, area_min=cel * cel * 0.002,
                         ate_y=topo + (base - topo) * ate)
        saida[y:y + h, x:x + w] = np.maximum(saida[y:y + h, x:x + w], p)
    H, W = saida.shape
    img = np.zeros((H, W, 3), np.uint8)
    img[..., 0] = np.clip(saida * 255, 0, 255)
    Image.fromarray(img).resize((W // 4, H // 4), Image.BILINEAR).save(RAIZ / f'arte/sprites/{nome}_folha_cabelo.png')
    print('folha:', RAIZ / f'arte/sprites/{nome}_folha_cabelo.png')
    camadas(sheet, saida, nome)


LIMIAR_MECHA = 0.12   # peso a partir do qual o pixel de cabelo vai para a camada que balança


def camadas(sheet, peso, nome='aurora'):
    """Separa a folha em duas camadas para o jogo (o corpo nunca é deformado pela malha do cabelo):
      aurora_folha_corpo.png  folha inteira SEM o cabelo que balança (imagem fixa, por cima)
      aurora_folha_mecha.png  só o cabelo que balança, em meia resolução (malha deformada, por baixo do corpo);
                              alargado ~6 px para dentro do corpo, para não abrir fresta quando o cabelo se move
    """
    a = sheet[..., 3].astype(np.float32) / 255
    # decisão sobre o peso suavizado (o limiar num campo ruidoso deixava pontinhos soltos na camada fixa)
    mecha = (cv2.GaussianBlur(peso, (0, 0), 2.0) > LIMIAR_MECHA) & (a > 0)
    # o contorno escuro e a borda semitransparente do cabelo não são "prateado opaco" (ficam fora da máscara):
    # vão junto com a mecha que contornam. Contornos do corpo encostados no cabelo também entram, mas o peso
    # deles é ~0 (estão no corpo) e eles não se movem.
    v = sheet[..., :3].max(axis=2)
    borda = ((v < 110) | (a < 0.95)) & (a > 0)
    perto = cv2.dilate(mecha.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))).astype(bool)
    mecha = mecha | (perto & borda)
    # borda suave de 1 px entre as camadas (a soma das duas cobre o desenho original)
    m_suave = cv2.GaussianBlur(mecha.astype(np.float32), (0, 0), 0.7)
    corpo = sheet.copy()
    corpo[..., 3] = np.clip(a * (1 - m_suave) * 255, 0, 255).astype(np.uint8)
    corpo[corpo[..., 3] == 0, :3] = 0
    Image.fromarray(corpo).save(RAIZ / f'arte/sprites/{nome}_folha_corpo.png', optimize=True)
    largo = cv2.dilate(mecha.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))).astype(bool)
    cab = sheet.copy()
    cab[..., 3] = np.where(largo, sheet[..., 3], 0)
    cab[cab[..., 3] == 0, :3] = 0
    H, W = a.shape
    Image.fromarray(cab).resize((W // 2, H // 2), Image.LANCZOS).save(RAIZ / f'arte/sprites/{nome}_folha_mecha.png', optimize=True)
    print('camadas: aurora_folha_corpo.png (fixa) + aurora_folha_mecha.png (cabelo, 1/2)')


if __name__ == '__main__':
    import sys
    qual = sys.argv[1] if len(sys.argv) > 1 else 'aurora'
    if qual == 'aurora':
        viva()
        folha('aurora')
    elif qual == 'crianca':
        folha('crianca', ate=0.66, pela_raiz=True, tirar_metal=False)   # criança: sem armadura; o prata do cabelo puxa para o azul
    elif qual == 'sentar':
        folha('sentar', ate=0.8, pela_raiz=True)       # sentar na fogueira (Figma)
