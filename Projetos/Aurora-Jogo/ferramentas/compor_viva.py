"""Monta as texturas da Aurora parada (alta resolução) a partir da base e das variações do Gemini.

As variações são a mesma imagem com só os olhos ou só a mão mudados. Aqui:
1. Recorta o fundo de cada uma (mesmo método de ferramentas/recortar.py).
2. Acha onde cada variação difere da base (olhos em cima, mão embaixo) e cria máscaras suaves.
3. Gera as combinações olhos × mão e recorta todas no mesmo retângulo.
Uso: python3 ferramentas/compor_viva.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

from recortar import recortar  # noqa: E402  (mesmo diretório)

RAIZ = Path(__file__).resolve().parent.parent
ORIG = RAIZ / 'arte/viva-original'
SAIDA = RAIZ / 'jogo/assets/viva'
FONTES = {'base': '19.webp', 'olhos_semi': '20.webp', 'mao_fechada': '22.webp'}


def rgba_sem_corte(caminho):
    """recortar() devolve a imagem já cortada; aqui precisamos dela no tamanho original."""
    img = Image.open(caminho).convert('RGB')
    from recortar import mascara_fundo, dilatar
    rgb = np.asarray(img).astype(np.float32)
    fundo = mascara_fundo(rgb.astype(np.uint8))
    alpha = np.where(fundo, 0.0, 1.0)
    faixa = dilatar(fundo, 2) & ~fundo
    alpha = np.where(faixa, np.minimum(alpha, np.clip((252.0 - rgb.min(axis=2)) / 100.0, 0, 1)), alpha)
    a = np.maximum(alpha, 1e-3)[..., None]
    cor = np.where((alpha > 0)[..., None], np.clip((rgb - (1 - a) * 255.0) / a, 0, 255), 0)
    return np.dstack([cor, alpha * 255]).astype(np.float32), np.asarray(img).astype(int)


def mascara_diferenca(rgb_a, rgb_b, caixa, folga=8, suavizar=5):
    x0, y0, x1, y1 = caixa
    d = np.abs(rgb_a - rgb_b).sum(axis=2) > 60
    m = np.zeros(d.shape, bool)
    m[y0:y1, x0:x1] = d[y0:y1, x0:x1]
    img = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(folga * 2 + 1))
    img = img.filter(ImageFilter.GaussianBlur(suavizar))
    return np.asarray(img).astype(np.float32)[..., None] / 255.0


def main():
    camadas, rgbs = {}, {}
    for nome, arq in FONTES.items():
        camadas[nome], rgbs[nome] = rgba_sem_corte(ORIG / arq)
    m_olhos = mascara_diferenca(rgbs['base'], rgbs['olhos_semi'], (300, 120, 500, 300))
    m_mao = mascara_diferenca(rgbs['base'], rgbs['mao_fechada'], (200, 480, 360, 660))
    combos = {}
    for olhos in ('abertos', 'semi'):
        for mao in ('aberta', 'fechada'):
            img = camadas['base'].copy()
            if olhos == 'semi':
                img = img * (1 - m_olhos) + camadas['olhos_semi'] * m_olhos
            if mao == 'fechada':
                img = img * (1 - m_mao) + camadas['mao_fechada'] * m_mao
            combos[f'olhos_{olhos}_mao_{mao}'] = img
    # mesmo retângulo para todas (união do que é visível)
    alfa = np.max([c[..., 3] for c in combos.values()], axis=0)
    ys, xs = np.nonzero(alfa > 8)
    x0, y0, x1, y1 = int(xs.min()) - 4, int(ys.min()) - 4, int(xs.max()) + 5, int(ys.max()) + 5
    SAIDA.mkdir(parents=True, exist_ok=True)
    for nome, c in combos.items():
        Image.fromarray(np.clip(c, 0, 255).astype(np.uint8), 'RGBA').crop((x0, y0, x1, y1)).save(SAIDA / f'aurora_{nome}.png')
    a = alfa[y0:y1, x0:x1]
    pernas = a[int(a.shape[0] * 0.78):, :]
    pes_x = float((pernas.sum(axis=0) * np.arange(a.shape[1])).sum() / pernas.sum())
    # regiões (em px da imagem cortada) usadas na deformação; medidas na base original
    off = lambda x, y: [x - x0, y - y0]
    meta = {
        'largura': int(x1 - x0), 'altura': int(y1 - y0), 'pes': [round(pes_x, 1), int(y1 - y0 - 6)],
        'pescoco_y': off(0, 275)[1], 'ombro_y': off(0, 300)[1], 'cintura_y': off(0, 455)[1],
        'cabelo': off(160, 110) + off(330, 520), 'tranca': off(385, 170) + off(465, 410),
        'peito': off(300, 290) + off(480, 420), 'cabeca_topo': off(0, 60)[1],
        'texturas': sorted(combos),
    }
    (SAIDA / 'aurora_viva.json').write_text(json.dumps(meta, indent=1), encoding='utf-8')
    print('recorte', (x0, y0, x1, y1), meta['largura'], 'x', meta['altura'], '| pés x', round(pes_x, 1))


if __name__ == '__main__':
    import sys
    sys.path.insert(0, str(Path(__file__).parent))
    main()
