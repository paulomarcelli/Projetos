"""Monta a folha da Aurora adulta NOVA (redesenhada no Figma) no mesmo formato da antiga (arte/sprites/aurora_folha.*).

Uso (na pasta Aurora-Jogo):
  python3 ferramentas/montar_folha_nova.py          # folha + json
  python3 ferramentas/pesos_cabelo.py aurora_nova    # camadas corpo/mecha e pesos do cabelo

Recortes em arte/figma/aurora_nova/recortes/aurora_<grupo>_NN.png (fatiar_folha.py; corrida e sentar, que vieram em
duas fileiras, separados por peças). Toda folha do Figma começa com uma pose de REFERÊNCIA em pé (quadro 1): a escala
da folha inteira sai dela (altura da cabeça aos pés = ALTURA_EM_PE), então todas as folhas ficam do mesmo tamanho.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
import montar_folha as MF  # noqa: E402
from montar_folha import COLUNAS, celula, esticar  # noqa: E402

# célula maior que a antiga (384): o arco erguido e a lâmina esticada não cabiam
MF.CEL, MF.BASE = 512, 500
CEL, BASE = MF.CEL, MF.BASE

RAIZ = Path(__file__).resolve().parent.parent
REC = RAIZ / 'arte/figma/aurora_nova/recortes'
SAIDA = RAIZ / 'arte/sprites'
ALTURA_EM_PE = 314          # px da célula (igual à Aurora antiga: o jogo usa ALTURA_QUADRO = 314)


def altura_corpo(img):
    """da cabeça aos pés, ignorando pontas finas (arco e lâmina acima da cabeça)"""
    a = np.asarray(img)[..., 3] > 128
    larg = a.sum(axis=1)
    linhas = np.nonzero(larg > a.shape[1] * 0.12)[0]
    return linhas.max() - linhas.min()


def grupo(nome):
    fs = sorted(REC.glob(f'aurora_{nome}_*.png'))
    ims = [Image.open(f).convert('RGBA') for f in fs]
    s = ALTURA_EM_PE / altura_corpo(ims[0])
    return [im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS) for im in ims]


def montar_animacoes():
    P = grupo('parada'); C = grupo('correr'); U = grupo('pulo'); E = grupo('esquiva')
    A = grupo('arcoA'); B = grupo('arcoB'); L = grupo('lamina'); D = grupo('dano'); S = grupo('sentar')
    t = lambda q: celula(q, 'tronco')          # noqa: E731
    an = {}
    p1, p2, p3, p4, vit = t(P[0]), t(P[1]), t(P[2]), t(P[3]), t(P[4])
    # respira (neutra → inspira → expira) e pisca no fim do ciclo
    an['parada'] = {'fps': 5, 'loop': True, 'quadros': [p1, p1, p2, p2, p3, p3, p2, p2, p1, p1, p2, p2, p3, p3, p2, p4]}
    an['correndo'] = {'fps': 12, 'loop': True, 'quadros': [t(q) for q in C[1:]]}
    an['pulo'] = {'fps': 10, 'loop': False, 'quadros': [t(U[2]), t(U[3])]}
    an['queda'] = {'fps': 8, 'loop': True, 'quadros': [t(U[4])]}
    an['aterrissar'] = {'fps': 12, 'loop': False, 'quadros': [t(U[5]), p1]}
    an['esquiva'] = {'fps': 14, 'loop': False, 'quadros': [t(E[1]), celula(E[2], 'caixa'), t(E[3]), t(E[4])]}
    an['arco_preparar'] = {'fps': 12, 'loop': False, 'quadros': [t(q) for q in A]}
    b2, b3, b4, b5 = (t(q) for q in B[1:])
    an['arco_atirar'] = {'fps': 12, 'loop': False, 'quadros': [b2, b3, b3, b4, b5]}   # índice 3 = soltura
    l2, l3, l4, l5, l6 = (t(q) for q in L[1:])
    an['ataque_lamina'] = {'fps': 14, 'loop': False, 'quadros': [l2, l3, l4, l5, l5]}
    an['lamina_guarda'] = {'fps': 6, 'loop': False, 'quadros': [l6, l2, l2]}
    an['dano'] = {'fps': 9, 'loop': False, 'quadros': [t(q) for q in D[1:]]}
    an['vitoria'] = {'fps': 8, 'loop': True, 'quadros': [vit, celula(esticar(P[4], 1.03, 0.97), 'tronco'),
                                                         celula(P[4], 'tronco', dy=-10), celula(P[4], 'tronco', dy=-4)]}
    bola = E[2]
    an['cambalhota'] = {'fps': 16, 'loop': True, 'quadros': [
        celula(bola.rotate(-ang, resample=Image.BICUBIC, expand=True), 'centro') for ang in range(0, 360, 45)]}
    sen = [t(q) for q in S[:4]]                         # em pé, dobrando, agachada, sentada
    an['sentar'] = {'fps': 6, 'loop': False, 'quadros': sen}
    aberta, fechada, pensa, expira = (t(q) for q in S[4:8])
    # sentar.js usa os índices 0 (normal), 2 (pensativa) e 11 (olhos fechados)
    an['sentada'] = {'fps': 3, 'loop': True, 'quadros': [aberta, aberta, pensa, aberta, aberta, expira, aberta, aberta,
                                                         expira, aberta, aberta, fechada]}
    an['levantar'] = {'fps': 7, 'loop': False, 'quadros': sen[::-1]}
    # parada, de vez em quando: mexe os dedos (abre, fecha, estica) e, com vento forte, prende a mecha atrás da orelha
    G = grupo('gesto'); Hc = grupo('cabelo')
    g2, g3, g4, g5 = (t(q) for q in G[1:])          # começa e termina na própria pose parada (folha ≤ 64 quadros = 4096 px)
    an['gesto'] = {'fps': 5, 'loop': False, 'quadros': [p1, g2, g3, g3, g4, g5, p1]}
    h2, h3, h4, h5 = (t(q) for q in Hc[1:])
    an['arrumar_cabelo'] = {'fps': 6, 'loop': False, 'quadros': [p1, h2, h2, h3, h4, h4, h5, p1]}
    return an


def salvar(anims):
    unicos = list({id(q): q for a in anims.values() for q in a['quadros']}.values())
    linhas = -(-len(unicos) // COLUNAS)
    folha = Image.new('RGBA', (COLUNAS * CEL, linhas * CEL), (0, 0, 0, 0))
    meta = {'celula': CEL, 'base': BASE, 'ancora': 'centro inferior (pés) em y=%d; cambalhota no centro' % BASE,
            'versao': 'figma (Aurora redesenhada)', 'animacoes': {}}
    lugar = {}
    for i, q in enumerate(unicos):
        x, y = (i % COLUNAS) * CEL, (i // COLUNAS) * CEL
        folha.paste(q, (x, y), q)
        lugar[id(q)] = [x, y, CEL, CEL]
    for nome, a in anims.items():
        meta['animacoes'][nome] = {'fps': a['fps'], 'loop': a['loop'], 'quadros': [lugar[id(q)] for q in a['quadros']]}
    assert folha.height <= 4096, f'folha com {folha.height} px de altura: placas de vídeo aceitam até 4096'
    folha.save(SAIDA / 'aurora_folha.png', optimize=True)
    (SAIDA / 'aurora_folha.json').write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding='utf-8')
    print('aurora_folha.png', folha.size, len(unicos), 'quadros únicos')


if __name__ == '__main__':
    salvar(montar_animacoes())
