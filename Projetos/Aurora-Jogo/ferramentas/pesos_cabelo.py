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

Uso (na pasta Aurora-Jogo):  python3 ferramentas/pesos_cabelo.py
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


def mascara_cabelo(rgba, area_min):
    """Cabelo: opaco, saturação baixa e valor médio/alto. Fecha os traços pretos de dentro e tira sobras."""
    a = rgba[..., 3] > 128
    hsv = cv2.cvtColor(np.ascontiguousarray(rgba[..., :3]), cv2.COLOR_RGB2HSV).astype(np.float32)
    h, s, v = hsv[..., 0] * 2, hsv[..., 1] / 255, hsv[..., 2] / 255
    # o prata da armadura puxa para o azul (matiz 170–265°); o cabelo puxa para o rosa/lilás
    metal = (h > 170) & (h < 265) & (s > 0.035)
    cab = (a & (s < 0.17) & (v > 0.36) & ~metal).astype(np.uint8)
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


def folha():
    meta = json.loads((RAIZ / 'arte/sprites/aurora_folha.json').read_text(encoding='utf-8'))
    sheet = np.array(Image.open(RAIZ / 'arte/sprites/aurora_folha.png').convert('RGBA'))
    saida = np.zeros(sheet.shape[:2], np.float32)
    cel = meta['celula']
    for anim in meta['animacoes'].values():
        for x, y, w, h in anim['quadros']:
            rgba = sheet[y:y + h, x:x + w]
            if rgba[..., 3].max() == 0:
                continue
            ys = np.nonzero(rgba[..., 3].max(axis=1) > 128)[0]
            topo, base = ys[0], ys[-1]
            p, _ = pesos(rgba, folga_px=cel * 0.05, borda_px=cel * 0.04, area_min=cel * cel * 0.002,
                         ate_y=topo + (base - topo) * 0.6)
            saida[y:y + h, x:x + w] = np.maximum(saida[y:y + h, x:x + w], p)
    H, W = saida.shape
    img = np.zeros((H, W, 3), np.uint8)
    img[..., 0] = np.clip(saida * 255, 0, 255)
    Image.fromarray(img).resize((W // 4, H // 4), Image.BILINEAR).save(RAIZ / 'arte/sprites/aurora_folha_cabelo.png')
    print('folha:', RAIZ / 'arte/sprites/aurora_folha_cabelo.png')


if __name__ == '__main__':
    viva()
    folha()
