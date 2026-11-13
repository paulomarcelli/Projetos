"""Monta a folha de sprites da Aurora a partir dos recortes (arte/sprites/recortes).

Uso: python3 ferramentas/montar_folha.py

- Iguala a escala pela altura da cabeça medida em cada pose (as imagens do Gemini vêm em escalas diferentes).
- Alinha todos os quadros pelos pés (base no centro inferior) numa célula fixa de 384x384.
- Gera quadros extras por código (respiração, elasticidade, giro, piscada de dano).
- Saídas: aurora_folha.png, aurora_folha.json, aurora_spriteframes.tres (Godot 4) e prévias GIF.
"""
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance

RAIZ = Path(__file__).resolve().parent.parent
RECORTES = RAIZ / 'arte/sprites/recortes'
SAIDA = RAIZ / 'arte/sprites'
CEL = 384            # tamanho da célula
BASE = CEL - 12      # linha dos pés
CABECA_ALVO = 70     # altura da cabeça (tiara ao queixo) no jogo, em px

# Altura da cabeça (px, ponta da asa da tiara ao queixo) medida com régua em cada fonte original.
# Imagens soltas (primeiro lote):
POSES = {
    'ataque':     {'arquivo': 'aurora_ataque_lamina.png', 'cabeca': 173},
    'vitoria':    {'arquivo': 'aurora_vitoria.png',       'cabeca': 175},
    'cambalhota': {'arquivo': 'aurora_cambalhota.png',    'cabeca': 230},
}
# Folhas do Gemini (fatiadas por ferramentas/fatiar_folha.py), na mesma escala entre si.
# Cabeça medida na pose parada: ponta da asa da tiara ao queixo ≈ 56 px.
CABECA_FOLHAS = 56
QUADROS = {
    'parada':   [f'aurora_parada_{i:02d}.png' for i in range(1, 6)],
    'correndo': [f'aurora_correndo_{i:02d}.png' for i in range(1, 9)],
    'pulo':     [f'aurora_pulo_{i:02d}.png' for i in range(1, 6)],
    'esquiva':  [f'aurora_esquiva_{i:02d}.png' for i in range(1, 5)],
    # arco v2 (rodada 2): pegada fechada no punho, cabelo jogado sobre o ombro, mais de perfil
    'arco_preparar': [f'aurora_arco2_preparar_{i:02d}.png' for i in range(1, 5)],
    'arco_atirar':   [f'aurora_arco2_atirar_{i:02d}.png' for i in range(1, 5)],
    'sentar':  [f'aurora_sentar_{i:02d}.png' for i in range(1, 5)],    # fatiado com --separar 3
    'sentada': [f'aurora_sentada_{i:02d}.png' for i in range(1, 4)],
    # golpe de lâmina (folha G): guarda, passo com a lâmina à frente, passo armando, estocada longa
    'lamina':  [f'aurora_lamina_{i:02d}.png' for i in range(1, 5)],   # --separar 7 e 2 correções --dar
    # dano (folha I): impacto, cambaleia para trás, recupera o equilíbrio
    'dano':    [f'aurora_dano_{i:02d}.png' for i in range(1, 4)],
    # volta à guarda depois do golpe (folha H): recolhe a lâmina, fica em guarda
    'guarda':  [f'aurora_guarda_{i:02d}.png' for i in range(1, 3)],
}
# Folhas em outras escalas (cabeça medida com régua, ponta da asa da tiara ao queixo):
CABECA_POR_GRUPO = {'arco_preparar': 93, 'arco_atirar': 93, 'sentar': 103, 'sentada': 148, 'lamina': 95, 'dano': 95, 'guarda': 130}
COLUNAS = 8          # quadros por linha na folha (as animações seguem em sequência)
FLECHA_COMPRIMENTO = 150  # px no jogo, igual à flecha que a Aurora segura no arco


def abrir(arquivo, cabeca):
    img = Image.open(RECORTES / arquivo).convert('RGBA')
    s = CABECA_ALVO / cabeca
    return img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)


def carregar(nome):
    return abrir(POSES[nome]['arquivo'], POSES[nome]['cabeca'])


def quadros(nome):
    return [abrir(a, CABECA_POR_GRUPO.get(nome, CABECA_FOLHAS)) for a in QUADROS[nome]]


def centro_dos_pes(img):
    """x médio (ponderado pela opacidade) da faixa das pernas, 72% a 100% da altura.

    Usar só os pés falha na corrida (só o pé da frente toca o chão) e o corpo inteiro
    falha no ataque (o rastro do golpe puxa o centro para a frente).
    """
    import numpy as np
    a = np.asarray(img.getchannel('A'), dtype=float)[int(img.height * 0.72):, :]
    if a.sum() == 0:
        return img.width / 2
    return float((a.sum(axis=0) * np.arange(a.shape[1])).sum() / a.sum())


def media_x(img, ini, fim):
    """x médio ponderado pela opacidade numa faixa de altura (frações de 0 a 1)."""
    import numpy as np
    a = np.asarray(img.getchannel('A'), dtype=float)[int(img.height * ini):int(img.height * fim), :]
    if a.sum() == 0:
        return img.width / 2
    return float((a.sum(axis=0) * np.arange(a.shape[1])).sum() / a.sum())


def celula(img, ancora='pes', dx=0, dy=0):
    """Coloca o quadro na célula com a base nos pés (y = BASE), ou centralizado ('centro')."""
    c = Image.new('RGBA', (CEL, CEL), (0, 0, 0, 0))
    if ancora == 'centro':
        x, y = (CEL - img.width) // 2 + dx, (CEL - img.height) // 2 + dy
    else:
        cx = {'pes': lambda: centro_dos_pes(img),
              'tronco': lambda: media_x(img, 0.20, 0.55),
              'caixa': lambda: img.width / 2}[ancora]()
        x, y = round(CEL / 2 - cx) + dx, BASE - img.height + dy
    c.paste(img, (x, y), img)
    return c


def esticar(img, sx, sy):
    return img.resize((max(1, round(img.width * sx)), max(1, round(img.height * sy))), Image.LANCZOS)


def silhueta(img, cor):
    s = Image.new('RGBA', img.size, cor)
    s.putalpha(img.getchannel('A'))
    return s


def tingir(img, cor, forca):
    base = img.convert('RGB')
    t = Image.blend(base, Image.new('RGB', img.size, cor), forca)
    t.putalpha(img.getchannel('A'))
    return t


def montar_animacoes():
    atq, vit, camb = (carregar(n) for n in ['ataque', 'vitoria', 'cambalhota'])
    parada, corr, pulo, esq, arco1, arco2, sentar, sentada, lamina, dano, guarda = (quadros(n) for n in [
        'parada', 'correndo', 'pulo', 'esquiva', 'arco_preparar', 'arco_atirar', 'sentar', 'sentada', 'lamina', 'dano',
        'guarda'])
    anims = {}
    # vai e volta (1-2-3-4-5-4-3-2) para a respiração não "pular" ao recomeçar
    anims['parada'] = {'fps': 6, 'loop': True, 'quadros': [celula(q) for q in parada + parada[3:0:-1]]}
    anims['correndo'] = {'fps': 12, 'loop': True, 'quadros': [celula(q, 'tronco') for q in corr]}
    anims['pulo'] = {'fps': 12, 'loop': False, 'quadros': [celula(q, 'tronco') for q in pulo[:3]]}
    anims['queda'] = {'fps': 8, 'loop': True, 'quadros': [celula(pulo[3], 'tronco')]}
    anims['aterrissar'] = {'fps': 12, 'loop': False, 'quadros': [celula(pulo[4], 'tronco'), celula(parada[0])]}
    anims['esquiva'] = {'fps': 14, 'loop': False, 'quadros': [celula(q, 'caixa') for q in esq]}
    anims['arco_preparar'] = {'fps': 10, 'loop': False, 'quadros': [celula(q) for q in arco1]}
    # segura a mira um quadro a mais antes de soltar
    anims['arco_atirar'] = {'fps': 12, 'loop': False, 'quadros': [celula(q) for q in [arco2[0], arco2[1], arco2[1], arco2[2], arco2[3]]]}
    # fogueira: senta (uma vez), fica sentada respirando e piscando, levanta (sentar ao contrário).
    # Alinhadas pelo tronco: os arcos deitados no chão puxariam o centro dos pés para o lado.
    sen = [celula(q, 'tronco') for q in sentar]
    anims['sentar'] = {'fps': 6, 'loop': False, 'quadros': sen}
    s1, s2, s3 = (celula(q, 'tronco') for q in sentada)
    anims['sentada'] = {'fps': 3, 'loop': True, 'quadros': [s1, s1, s2, s2, s2, s1, s1, s2, s2, s2, s1, s3]}
    anims['levantar'] = {'fps': 7, 'loop': False, 'quadros': sen[::-1]}
    # alinhado pelo tronco: o avanço do corpo é feito no jogo (corpo.vx), a estocada segura um quadro a mais
    l1, l2, l3, l4 = (celula(q, 'tronco') for q in lamina)
    anims['ataque_lamina'] = {'fps': 14, 'loop': False, 'quadros': [l1, l2, l3, l4, l4]}
    g1, g2 = (celula(q, 'tronco') for q in guarda)
    anims['lamina_guarda'] = {'fps': 6, 'loop': False, 'quadros': [g1, g2, g2]}
    anims['cambalhota'] = {'fps': 16, 'loop': True, 'quadros': [
        celula(camb.rotate(-ang, resample=Image.BICUBIC, expand=True), 'centro') for ang in range(0, 360, 45)]}
    # 3 quadros em 0,33 s (a ação dano dura 0,34 s no jogo); clarão, recuo e faíscas são feitos por código
    anims['dano'] = {'fps': 9, 'loop': False, 'quadros': [celula(q, 'tronco') for q in dano]}
    anims['vitoria'] = {'fps': 8, 'loop': True, 'quadros': [
        celula(vit), celula(esticar(vit, 1.03, 0.97)), celula(vit, dy=-10), celula(vit, dy=-4)]}
    return anims


def salvar(anims):
    # o mesmo quadro usado de novo (vai e volta, levantar = sentar ao contrário) ocupa uma célula só
    unicos = list({id(q): q for a in anims.values() for q in a['quadros']}.values())
    linhas = -(-len(unicos) // COLUNAS)
    folha = Image.new('RGBA', (COLUNAS * CEL, linhas * CEL), (0, 0, 0, 0))
    meta = {'celula': CEL, 'ancora': 'centro inferior (pés) em y=%d; cambalhota no centro' % BASE, 'animacoes': {}}
    lugar = {}
    for i, q in enumerate(unicos):
        x, y = (i % COLUNAS) * CEL, (i // COLUNAS) * CEL
        folha.paste(q, (x, y), q)
        lugar[id(q)] = [x, y, CEL, CEL]
    for nome, a in anims.items():
        regs = [lugar[id(q)] for q in a['quadros']]
        meta['animacoes'][nome] = {'fps': a['fps'], 'loop': a['loop'], 'quadros': regs}
    folha.save(SAIDA / 'aurora_folha.png', optimize=True)
    (SAIDA / 'aurora_folha.json').write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding='utf-8')
    return folha, meta


def salvar_flechas():
    """Flecha como sprite separado (projétil), na escala da flecha que a Aurora segura."""
    pasta = SAIDA / 'flecha'; pasta.mkdir(exist_ok=True)
    base = Image.open(RECORTES / 'aurora_flecha_01.png').convert('RGBA')
    s = FLECHA_COMPRIMENTO / base.width
    for n, nome in enumerate(['flecha_voando', 'flecha_voando_rastro', 'flecha_cravada'], 1):
        img = Image.open(RECORTES / f'aurora_flecha_{n:02d}.png').convert('RGBA')
        img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS).save(pasta / f'{nome}.png')


def godot_tres(meta):
    subs, linhas_anim, i = [], [], 0
    for nome, a in meta['animacoes'].items():
        refs = []
        for (x, y, w, h) in a['quadros']:
            i += 1
            subs.append(f'[sub_resource type="AtlasTexture" id="AtlasTexture_{i}"]\natlas = ExtResource("1_folha")\nregion = Rect2({x}, {y}, {w}, {h})\n')
            refs.append(f'{{\n"duration": 1.0,\n"texture": SubResource("AtlasTexture_{i}")\n}}')
        linhas_anim.append('{\n"frames": [' + ', '.join(refs) + f'],\n"loop": {"true" if a["loop"] else "false"},\n"name": &"{nome}",\n"speed": {float(a["fps"])}\n}}')
    texto = (f'[gd_resource type="SpriteFrames" load_steps={i + 2} format=3]\n\n'
             '[ext_resource type="Texture2D" path="res://arte/sprites/aurora_folha.png" id="1_folha"]\n\n'
             + '\n'.join(subs) + '\n[resource]\nanimations = [' + ', '.join(linhas_anim) + ']\n')
    (SAIDA / 'aurora_spriteframes.tres').write_text(texto, encoding='utf-8')


def previas(anims):
    pasta = SAIDA / 'previas'; pasta.mkdir(exist_ok=True)
    fundo = (42, 35, 80, 255)  # índigo do jogo
    for nome, a in anims.items():
        qs = []
        for q in a['quadros']:
            f = Image.new('RGBA', (CEL, CEL), fundo); f.alpha_composite(q)
            qs.append(f.convert('RGB'))
        qs[0].save(pasta / f'{nome}.gif', save_all=True, append_images=qs[1:], duration=int(1000 / a['fps']), loop=0, disposal=2)


if __name__ == '__main__':
    anims = montar_animacoes()
    folha, meta = salvar(anims)
    godot_tres(meta)
    salvar_flechas()
    previas(anims)
    print('folha', folha.size, '| animações:', {k: len(v['quadros']) for k, v in anims.items()})
