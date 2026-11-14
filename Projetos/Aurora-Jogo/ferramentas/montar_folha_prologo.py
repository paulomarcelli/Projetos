"""Monta a folha de sprites do Prólogo com a arte gerada no Figma (arte/figma/recortes → arte/sprites/prologo_folha.*).

Uso (na pasta Aurora-Jogo): python3 ferramentas/montar_folha_prologo.py

- Cada peça é redimensionada para a altura que terá no mundo do jogo (px) × RESOLUCAO (nitidez com zoom e tela 2×).
- Soldado: os quadros vêm de duas folhas com escalas diferentes. A escala é medida pelo CORPO (do topo do elmo aos pés),
  sem a lança, para andar e parar saírem do mesmo tamanho.
- O JSON guarda, para cada peça, o retângulo na folha e a âncora (pés: centro dos pixels da base), em px da folha.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
REC = RAIZ / 'arte/figma/recortes'
SAIDA = RAIZ / 'arte/sprites'
RESOLUCAO = 1.6          # px da folha por px do mundo
LARGURA_FOLHA = 4096
SOLDADO_CORPO = 236      # do topo do elmo aos pés, no mundo

# nome: (arquivo, altura no mundo); altura None = soldado (medido pelo corpo)
PECAS = {
    **{f'soldado_andando_{i}': (f'aurora_soldado_andando_0{i + 1}.png', None) for i in range(8) if i != 6},   # o 7º saiu sem a lança
    **{f'soldado_parado_{i}': (f'aurora_soldado_parado_0{i + 1}.png', None) for i in range(6)},
    'ilaria': ('ilaria.png', 232), 'elias': ('elias.png', 158), 'convidada_vinho': ('convidada_vinho.png', 222),
    'convidado_lorde': ('convidado_lorde.png', 236), 'convidada_idosa': ('convidada_idosa.png', 214), 'musico': ('musico.png', 218),
    'caius': ('caius.png', 246), 'carneiro': ('carneiro.png', 262), 'luvas_brancas': ('luvas_brancas.png', 238),
    'ilaria_ajoelhada': ('ilaria_ajoelhada.png', 160), 'bram': ('bram.png', 250),
    'cortina': ('cortina.png', 530), 'coluna': ('coluna.png', 800), 'mesa': ('mesa.png', 122),
    'banco': ('banco.png', 112), 'altar': ('altar.png', 152), 'castical': ('castical.png', 128),
}


def corpo(a):
    """altura do topo do elmo (primeira linha com mais de 45 px opacos: a lança é fina) até os pés"""
    larg = (a[..., 3] > 128).sum(axis=1)
    linhas = np.nonzero(larg > 45)[0]
    return linhas.max() - linhas.min()


def ancora(a):
    base = np.nonzero((a[..., 3] > 128).any(axis=1))[0].max()
    faixa = a[max(0, base - int(a.shape[0] * 0.06)):base + 1, :, 3] > 128
    xs = np.nonzero(faixa.any(axis=0))[0]
    return float((xs.min() + xs.max()) / 2), float(base + 1)


def main():
    pecas = []
    for nome, (arq, altura) in PECAS.items():
        im = Image.open(REC / arq).convert('RGBA')
        a = np.asarray(im)
        escala = (SOLDADO_CORPO / corpo(a) if altura is None else altura / im.height) * RESOLUCAO
        im = im.resize((max(1, round(im.width * escala)), max(1, round(im.height * escala))), Image.LANCZOS)
        pecas.append((nome, im))
    # empacota em prateleiras (as mais altas primeiro)
    pecas.sort(key=lambda p: -p[1].height)
    x = y = alt = 0
    pos = {}
    for nome, im in pecas:
        if x + im.width > LARGURA_FOLHA:
            x, y, alt = 0, y + alt + 2, 0
        pos[nome] = (x, y)
        x += im.width + 2
        alt = max(alt, im.height)
    altura_folha = y + alt
    assert altura_folha <= 4096, f'folha alta demais: {altura_folha}'
    folha = Image.new('RGBA', (LARGURA_FOLHA, altura_folha))
    meta = {'resolucao': RESOLUCAO, 'pecas': {}}
    for nome, im in pecas:
        px, py = pos[nome]
        folha.paste(im, (px, py))
        ax, ay = ancora(np.asarray(im))
        meta['pecas'][nome] = {'quadro': [px, py, im.width, im.height], 'ancora': [round(ax, 1), round(ay, 1)]}
    folha.save(SAIDA / 'prologo_folha.png', optimize=True)
    (SAIDA / 'prologo_folha.json').write_text(json.dumps(meta, ensure_ascii=False, indent=1))
    print('prologo_folha.png', folha.size, len(pecas), 'peças')


if __name__ == '__main__':
    main()
