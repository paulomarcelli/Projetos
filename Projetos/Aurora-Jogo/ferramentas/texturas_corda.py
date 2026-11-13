"""Gera as texturas "deitadas" das tranças e mechas para as cordas deformáveis do jogo.

Uma corda (MeshRope) estica a textura ao longo dos pontos, da esquerda para a direita;
as tranças são desenhadas em pé, então giramos 90°: o topo da trança vira a ponta esquerda.
Uso: python3 ferramentas/texturas_corda.py
"""
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
PARTES = RAIZ / 'arte/boneco/partes'
for nome in ['tranca_esquerda', 'tranca_direita', 'mecha_1', 'mecha_2']:
    img = Image.open(PARTES / f'{nome}.png').convert('RGBA')
    img.rotate(90, expand=True).save(PARTES / f'{nome}_corda.png')
    print(nome, '->', img.rotate(90, expand=True).size)
