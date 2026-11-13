#!/usr/bin/env python3
"""Tira a franja branca das bordas dos sprites (sobra do fundo branco do Gemini).

Os pixels meio transparentes da borda guardam um pouco do branco do fundo: sobre o céu escuro do jogo eles
viram um contorno claro e pontilhado, que deixa a Aurora com cara de "pixelada". Aqui:
  1. a cor de cada pixel da borda (alfa < 250) é trocada pela cor do interior mais próximo (descontaminação);
  2. a borda é afinada em ~1 px e suavizada, para o contorno ficar liso.

Uso (na pasta Aurora-Jogo), depois do montar_folha.py:
  python3 ferramentas/limpar_bordas.py arte/sprites/aurora_folha.png
"""
import sys

import cv2
import numpy as np
from PIL import Image


def limpar(caminho):
    im = np.array(Image.open(caminho).convert('RGBA')).astype(np.float32)
    rgb, a = im[..., :3], im[..., 3]
    dentro = (a >= 250).astype(np.uint8)
    # cor do interior mais próximo: espalha as cores do miolo para a borda (média ponderada num raio pequeno)
    peso = dentro.astype(np.float32)
    soma = cv2.GaussianBlur(rgb * peso[..., None], (0, 0), 2.0)
    norma = cv2.GaussianBlur(peso, (0, 0), 2.0)[..., None]
    espalhada = np.where(norma > 1e-3, soma / np.maximum(norma, 1e-3), rgb)
    borda = (a > 0) & (a < 250)
    rgb[borda] = espalhada[borda]
    # afina ~1 px a borda semitransparente e alisa o contorno
    a2 = cv2.erode(a, np.ones((2, 2), np.uint8))
    a2 = cv2.GaussianBlur(a2, (0, 0), 0.6)
    a2 = np.where(a >= 250, np.maximum(a2, 250), a2)
    out = np.dstack([rgb, np.clip(a2, 0, 255)]).astype(np.uint8)
    out[out[..., 3] == 0, :3] = 0
    Image.fromarray(out).save(caminho)
    print('bordas limpas:', caminho)


if __name__ == '__main__':
    for c in sys.argv[1:]:
        limpar(c)
