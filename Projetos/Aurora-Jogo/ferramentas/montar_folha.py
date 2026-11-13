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

# Altura da cabeça medida em cada pose original (px, da ponta da tiara ao queixo)
POSES = {
    'correndo':  {'arquivo': 'aurora_correndo.png',      'cabeca': 155, 'ancora': 'pes'},
    'ataque':    {'arquivo': 'aurora_ataque_lamina.png', 'cabeca': 160, 'ancora': 'pes'},
    'pulo':      {'arquivo': 'aurora_pulo.png',          'cabeca': 196, 'ancora': 'pes'},
    'vitoria':   {'arquivo': 'aurora_vitoria.png',       'cabeca': 200, 'ancora': 'pes'},
    'cambalhota': {'arquivo': 'aurora_cambalhota.png',   'cabeca': 223, 'ancora': 'centro'},
}


def carregar(nome):
    p = POSES[nome]
    img = Image.open(RECORTES / p['arquivo']).convert('RGBA')
    s = CABECA_ALVO / p['cabeca']
    return img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)


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


def celula(img, ancora='pes', dx=0, dy=0):
    c = Image.new('RGBA', (CEL, CEL), (0, 0, 0, 0))
    if ancora == 'pes':
        x = round(CEL / 2 - centro_dos_pes(img)) + dx
        y = BASE - img.height + dy
    else:
        x = (CEL - img.width) // 2 + dx
        y = (CEL - img.height) // 2 + dy
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
    corr, atq, pulo, vit, camb = (carregar(n) for n in ['correndo', 'ataque', 'pulo', 'vitoria', 'cambalhota'])
    anims = {}
    # PROVISÓRIA: uma só pose de corrida; o balanço dá vida até chegarem os quadros reais
    anims['correndo_provisorio'] = {'fps': 10, 'loop': True, 'quadros': [
        celula(corr), celula(esticar(corr, 1.02, 0.97)), celula(corr, dy=-6), celula(esticar(corr, 0.99, 1.02), dy=-3)]}
    anims['ataque_lamina'] = {'fps': 14, 'loop': False, 'quadros': [
        celula(esticar(atq, 0.96, 1.03), dx=-10), celula(atq), celula(atq, dx=6), celula(atq, dx=6)]}
    anims['pulo'] = {'fps': 12, 'loop': False, 'quadros': [
        celula(esticar(pulo, 1.08, 0.90)), celula(esticar(pulo, 0.94, 1.07)), celula(pulo)]}
    anims['cambalhota'] = {'fps': 16, 'loop': True, 'quadros': [
        celula(camb.rotate(-ang, resample=Image.BICUBIC, expand=True), 'centro') for ang in range(0, 360, 45)]}
    anims['dano'] = {'fps': 12, 'loop': False, 'quadros': [
        celula(silhueta(corr, (255, 255, 255, 255)), dx=-8), celula(tingir(corr, (230, 60, 70), 0.35), dx=-6),
        celula(silhueta(corr, (255, 255, 255, 255)), dx=-4), celula(corr, dx=-2)]}
    anims['vitoria'] = {'fps': 8, 'loop': True, 'quadros': [
        celula(vit), celula(esticar(vit, 1.03, 0.97)), celula(vit, dy=-10), celula(vit, dy=-4)]}
    return anims


def salvar(anims):
    colunas = max(len(a['quadros']) for a in anims.values())
    folha = Image.new('RGBA', (colunas * CEL, len(anims) * CEL), (0, 0, 0, 0))
    meta = {'celula': CEL, 'ancora': 'centro inferior (pés) em y=%d; cambalhota no centro' % BASE, 'animacoes': {}}
    for lin, (nome, a) in enumerate(anims.items()):
        regs = []
        for col, q in enumerate(a['quadros']):
            folha.paste(q, (col * CEL, lin * CEL), q)
            regs.append([col * CEL, lin * CEL, CEL, CEL])
        meta['animacoes'][nome] = {'fps': a['fps'], 'loop': a['loop'], 'quadros': regs}
    folha.save(SAIDA / 'aurora_folha.png', optimize=True)
    (SAIDA / 'aurora_folha.json').write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding='utf-8')
    return folha, meta


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
    previas(anims)
    print('folha', folha.size, '| animações:', {k: len(v['quadros']) for k, v in anims.items()})
