"""Monta a folha de sprites da Aurora criança (Prólogo) a partir dos recortes c_*.

Uso: python3 ferramentas/montar_folha_crianca.py

- O Gemini desenhou a menina com quase 6 cabeças de altura; se a cabeça ficasse igual à da adulta, ela teria o
  mesmo tamanho da Aurora adulta. Por isso a escala é definida pela ALTURA EM PÉ (~70% da adulta) e cada folha
  é igualada às outras pela altura da cabeça medida com régua (tiara/cabelo ao queixo).
- Reaproveita o alinhamento pelos pés e o empacotamento em 8 colunas de ferramentas/montar_folha.py.
- Saídas: arte/sprites/crianca_folha.png, crianca_folha.json e prévias GIF em arte/sprites/previas/crianca_*.gif.
"""
import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from montar_folha import BASE, CEL, COLUNAS, celula  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
RECORTES = RAIZ / 'arte/sprites/recortes'
SAIDA = RAIZ / 'arte/sprites'

ALTURA_EM_PE = 225          # px na célula (a adulta tem ~314): a menina fica com ~70% da altura
ALTURA_PARADA_ORIGINAL = 641  # altura do quadro c_parada_01 recortado
CABECA_PARADA = 110          # cabeça medida em c_parada_01
CABECA_ALVO = CABECA_PARADA * ALTURA_EM_PE / ALTURA_PARADA_ORIGINAL   # ≈ 38,6 px
CABECA_POR_GRUPO = {'parada': 110, 'correndo1': 112, 'correndo2': 115, 'furtiva': 118, 'escondida': 165, 'pulo': 110}


def abrir(grupo, n):
    img = Image.open(RECORTES / f'aurora_c_{grupo}_{n:02d}.png').convert('RGBA')
    s = CABECA_ALVO / CABECA_POR_GRUPO[grupo]
    return img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)


def montar():
    p = [abrir('parada', i) for i in range(1, 4)]
    corr = [abrir('correndo1', i) for i in range(1, 5)] + [abrir('correndo2', i) for i in range(1, 5)]
    furt = [abrir('furtiva', i) for i in range(1, 5)]
    esc = [abrir('escondida', i) for i in range(1, 4)]
    pulo = [abrir('pulo', i) for i in range(1, 5)]
    return {
        'parada': {'fps': 4, 'loop': True, 'quadros': [celula(q) for q in [p[0], p[1], p[2], p[1]]]},
        'correndo': {'fps': 12, 'loop': True, 'quadros': [celula(q, 'tronco') for q in corr]},
        'furtiva': {'fps': 6, 'loop': True, 'quadros': [celula(q, 'tronco') for q in furt]},
        'escondida': {'fps': 2, 'loop': True, 'quadros': [celula(q, 'caixa') for q in [esc[0], esc[0], esc[1], esc[0]]]},
        'escondida_medo': {'fps': 2, 'loop': True, 'quadros': [celula(esc[2], 'caixa')]},
        'pulo': {'fps': 12, 'loop': False, 'quadros': [celula(q, 'tronco') for q in pulo[:3]]},
        'queda': {'fps': 8, 'loop': True, 'quadros': [celula(pulo[3], 'tronco')]},
        'aterrissar': {'fps': 12, 'loop': False, 'quadros': [celula(pulo[0], 'tronco'), celula(p[0])]},
    }


def salvar(anims):
    total = sum(len(a['quadros']) for a in anims.values())
    linhas = -(-total // COLUNAS)
    folha = Image.new('RGBA', (COLUNAS * CEL, linhas * CEL), (0, 0, 0, 0))
    meta = {'celula': CEL, 'base': BASE, 'altura_em_pe': ALTURA_EM_PE, 'animacoes': {}}
    i = 0
    for nome, a in anims.items():
        regs = []
        for q in a['quadros']:
            x, y = (i % COLUNAS) * CEL, (i // COLUNAS) * CEL
            folha.paste(q, (x, y), q)
            regs.append([x, y, CEL, CEL]); i += 1
        meta['animacoes'][nome] = {'fps': a['fps'], 'loop': a['loop'], 'quadros': regs}
    folha.save(SAIDA / 'crianca_folha.png', optimize=True)
    (SAIDA / 'crianca_folha.json').write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding='utf-8')
    pasta = SAIDA / 'previas'; pasta.mkdir(exist_ok=True)
    for nome, a in anims.items():
        qs = []
        for q in a['quadros']:
            f = Image.new('RGBA', (CEL, CEL), (42, 35, 80, 255)); f.alpha_composite(q); qs.append(f.convert('RGB'))
        qs[0].save(pasta / f'crianca_{nome}.gif', save_all=True, append_images=qs[1:], duration=int(1000 / a['fps']), loop=0)
    return folha


if __name__ == '__main__':
    f = salvar(montar())
    print('folha', f.size, '| cabeça alvo', round(CABECA_ALVO, 1))
