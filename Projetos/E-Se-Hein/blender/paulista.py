"""Avenida Paulista inventada por código: a avenida reta de ~3 km no espigão, com a ciclovia vermelha no canteiro
central, calçadas largas com árvores, torres dos dois lados, as torres de antena de TV e um prédio suspenso por um
pórtico vermelho. Cheia (carros, ônibus, ciclistas e pedestres) ou vazia, de dia, no fim da tarde ou anos depois.

Eixo x: ao longo da avenida (a câmera olha para +x). y: atravessa a avenida (y > 0 à esquerda da câmera). z: altura.
"""
import math
import random

import bmesh
import bpy
from mathutils import Vector

import comum as c

# ------------------------------------------------------------------------------------------------ medidas (m)
X0, X1 = -700.0, 2800.0          # trecho modelado da avenida
CANTEIRO = 2.2                   # meia largura do canteiro com a ciclovia
PISTA = 13.4                     # 4 faixas de 3,35 m por sentido
CALCADA = 9.0
BORDA = CANTEIRO + PISTA         # meio-fio
LOTE = BORDA + CALCADA           # começo dos lotes
TRAVESSAS = [-420.0, -60.0, 330.0, 760.0, 1180.0, 1640.0, 2150.0]
LARG_TRAVESSA = 14.0

# Câmera de drone (Figma v2: 180 m, lente 28 mm; o horizonte perto de y 480 pede ~18° de inclinação).
CAM_POS = Vector((-330.0, -6.0, 180.0))
CAM_ALVO = Vector((260.0, 0.0, 0.0))
VOCE = Vector((92.0, -6.0, 0.0))  # no meio da pista da direita


def montar(sc, tempo, plano, args):
    random.seed(19)
    vazia = plano.get("vazia", False)
    eventos = {e["o"] for e in plano.get("eventos", [])}
    mats = materiais()

    ceu, sol, fundo = c.ceu_e_sol(sc, elevacao=24.0, azimute=110.0, forca_ceu=0.85, forca_sol=3.4)
    sc.view_settings.exposure = -0.9
    chao(mats, tempo, plano)
    predios(mats, tempo, plano)
    torres_de_tv(mats)
    portico_vermelho(mats)
    arvores(mats, tempo, plano)
    postes_e_letreiros(mats, tempo, plano)
    voce(mats)
    if not vazia:
        multidao(mats, tempo, plano)
    if "mato_cresce" in eventos:  # anos depois: sem energia e vidro sujo
        mato(mats, tempo)
        valor(mats["fachada"], "janelas_acesas").default_value = 0.0
        valor(mats["fachada"], "sujo").default_value = 1.0
    if "chuva" in eventos:
        chuva(sc, mats, tempo)

    # Sol e luz ao longo do plano.
    ev = tempo.evento("sol_desce")
    if ev:
        a, b = ev
        c.posicionar_sol(ceu, sol, 24.0, 110.0, quadro=a)
        c.posicionar_sol(ceu, sol, -1.5, 96.0, quadro=b)
        c.chave(sol.data, "energy", [(a, 3.4), (b - 20, 1.0), (b, 0.0)])
        c.chave(fundo.inputs["Strength"], "default_value", [(a, 0.85), (b, 0.85), (b + 40, 0.5)])
        # o céu saturado do dia vira uma faixa rosa forte no pôr do sol: a saturação volta para perto do natural
        hs = sc.world.node_tree.nodes["satura_ceu"].inputs["Saturation"]
        c.chave(hs, "default_value", [(a, 1.45), (b, 1.1)])
        c.chave(sc.view_settings, "exposure", [(a, -0.9), (b, 0.6), (b + 40, 1.0)])
        c.animar_valor(valor(bpy.data.materials["fachada"], "janelas_acesas"), [(a, 0.06), (b, 0.7)])
        neblina = bpy.data.node_groups["Neblina"]
        cor = neblina.nodes["cor"]
        c.chave(cor.outputs[0], "default_value", [(a, c.rgba("#C9D6E3")), (b, c.rgba("#5B6A8C")), (b + 40, c.rgba("#2A3550"))])
    ev = tempo.evento("chuva")
    if ev:
        a, _ = ev
        c.chave(sol.data, "energy", [(a, 3.4), (a + 30, 0.5)])
        c.chave(fundo.inputs["Strength"], "default_value", [(a, 0.85), (a + 30, 0.4)])
        cor = bpy.data.node_groups["Neblina"].nodes["cor"]
        c.chave(cor.outputs[0], "default_value", [(a, c.rgba("#C9D6E3")), (a + 30, c.rgba("#8E99A6"))])
        dist = bpy.data.node_groups["Neblina"].nodes["dist"]
        c.chave(dist.outputs[0], "default_value", [(a, 1500.0), (a + 30, 650.0)])

    # Câmera: um movimento lento e linear por plano.
    mov = plano.get("movimento", {})
    cam = c.camera_drone(sc, CAM_POS, CAM_ALVO)
    frente = (CAM_ALVO - CAM_POS).normalized()
    frente_h = Vector((frente.x, frente.y, 0)).normalized()
    fim = CAM_POS - frente_h * mov.get("recua", 0) + frente_h * mov.get("avanca", 0) + Vector((0, 0, mov.get("sobe", 0)))
    alvo_fim = CAM_ALVO - frente_h * mov.get("recua", 0) * 0.6 + frente_h * mov.get("avanca", 0)
    c.mirar(cam, CAM_POS, CAM_ALVO, quadro=1)
    c.mirar(cam, fim, alvo_fim, quadro=tempo.quadros)
    c.linear(cam)
    return {"camera": cam, "voce": VOCE + Vector((0, 0, 2.2))}


# ------------------------------------------------------------------------------------------------ materiais
def grupo_neblina():
    if "Neblina" in bpy.data.node_groups:
        return bpy.data.node_groups["Neblina"]
    g = bpy.data.node_groups.new("Neblina", "ShaderNodeTree")
    g.interface.new_socket("Shader", in_out="INPUT", socket_type="NodeSocketShader")
    g.interface.new_socket("Shader", in_out="OUTPUT", socket_type="NodeSocketShader")
    N = g.nodes
    ent, sai = N.new("NodeGroupInput"), N.new("NodeGroupOutput")
    cam = N.new("ShaderNodeCameraData")
    dist = N.new("ShaderNodeValue")
    dist.name = "dist"
    dist.outputs[0].default_value = 1500.0
    div = N.new("ShaderNodeMath"); div.operation = "DIVIDE"
    g.links.new(cam.outputs["View Distance"], div.inputs[0]); g.links.new(dist.outputs[0], div.inputs[1])
    pot = N.new("ShaderNodeMath"); pot.operation = "POWER"; pot.inputs[1].default_value = 1.35
    g.links.new(div.outputs[0], pot.inputs[0])
    neg = N.new("ShaderNodeMath"); neg.operation = "MULTIPLY"; neg.inputs[1].default_value = -1.0
    g.links.new(pot.outputs[0], neg.inputs[0])
    ex = N.new("ShaderNodeMath"); ex.operation = "EXPONENT"
    g.links.new(neg.outputs[0], ex.inputs[0])
    fac = N.new("ShaderNodeMath"); fac.operation = "SUBTRACT"; fac.use_clamp = True; fac.inputs[0].default_value = 1.0
    g.links.new(ex.outputs[0], fac.inputs[1])
    cor = N.new("ShaderNodeRGB"); cor.name = "cor"
    cor.outputs[0].default_value = c.rgba("#C9D6E3")
    em = N.new("ShaderNodeEmission")
    g.links.new(cor.outputs[0], em.inputs["Color"])
    mx = N.new("ShaderNodeMixShader")
    g.links.new(fac.outputs[0], mx.inputs[0])
    g.links.new(ent.outputs[0], mx.inputs[1])
    g.links.new(em.outputs[0], mx.inputs[2])
    g.links.new(mx.outputs[0], sai.inputs[0])
    return g


def finalizar(n, bsdf_out):
    g = n.add("ShaderNodeGroup")
    g.node_tree = grupo_neblina()
    n.link(bsdf_out, g.inputs[0])
    n.link(g.outputs[0], n.saida.inputs["Surface"])


def mat_simples(nome, cor, rough=0.7, metal=0.0, emissao=None, forca=0.0, neblina=True):
    m = bpy.data.materials.new(nome)
    n = c.Nos(m)
    b = n.principled(c.rgba(cor), rough, metal, c.rgba(emissao) if emissao else None, forca if emissao else None)
    if neblina:
        finalizar(n, b.outputs[0])
    else:
        n.link(b.outputs[0], n.saida.inputs["Surface"])
    return m


def mat_paleta(nome, cores, rough=0.5, metal=0.0, coat=0.0):
    """Cor sorteada por objeto (Object Info > Random) numa paleta: carros, roupas, ônibus."""
    m = bpy.data.materials.new(nome)
    n = c.Nos(m)
    info = n.add("ShaderNodeObjectInfo")
    rampa = n.add("ShaderNodeValToRGB")
    rampa.color_ramp.interpolation = "CONSTANT"
    els = rampa.color_ramp.elements
    while len(els) < len(cores):
        els.new(0.5)
    for i, cor in enumerate(cores):
        els[i].position = i / len(cores)
        els[i].color = c.rgba(cor)
    n.link(info.outputs["Random"], rampa.inputs[0])
    b = n.principled(None, rough, metal)
    n.link(rampa.outputs[0], b.inputs["Base Color"])
    if coat:
        b.inputs["Coat Weight"].default_value = coat
    finalizar(n, b.outputs[0])
    return m


def materiais():
    M = {}
    grupo_neblina()

    # Asfalto: ruído fino, rachaduras (Voronoi) e molhado, cada um com um controle animável.
    m = bpy.data.materials.new("asfalto")
    n = c.Nos(m)
    pos = n.geo()["Position"]
    r1 = n.ruido(pos, 0.9, 6, 0.6)[0]
    r2 = n.ruido(pos, 0.05, 3, 0.5)[0]
    base = n.mix_cor(n.math("MULTIPLY", r1, 0.6), c.rgba("#2B2D30"), c.rgba("#45474A"))
    base = n.mix_cor(n.math("MULTIPLY", r2, 0.35), base, c.rgba("#3A3631"))
    vor = n.add("ShaderNodeTexVoronoi", feature="DISTANCE_TO_EDGE")
    vor.inputs["Scale"].default_value = 0.35
    w = n.add("ShaderNodeTexNoise"); w.inputs["Scale"].default_value = 0.6
    n.link(pos, w.inputs["Vector"])
    distorc = n.add("ShaderNodeVectorMath", operation="ADD")
    n.link(pos, distorc.inputs[0])
    n.link(w.outputs["Color"], distorc.inputs[1])
    n.link(distorc.outputs[0], vor.inputs["Vector"])
    trinca = n.math("LESS_THAN", vor.outputs["Distance"], 0.035)
    rachar = n.val(0.0, "rachar")
    trinca = n.math("MULTIPLY", trinca, rachar)
    mato_v = n.val(0.0, "mato")
    cor_trinca = n.mix_cor(mato_v, c.rgba("#0E0F10"), c.rgba("#3F5A22"))
    base = n.mix_cor(trinca, base, cor_trinca)
    molhado = n.val(0.0, "molhado")
    rough = n.mix_float(molhado, 0.88, 0.18)
    base = n.mix_cor(n.math("MULTIPLY", molhado, 0.45), base, c.rgba("#151617"))
    b = n.principled(None, rough)
    n.link(base, b.inputs["Base Color"])
    finalizar(n, b.outputs[0])
    M["asfalto"] = m

    # Calçada: placas claras com juntas.
    m = bpy.data.materials.new("calcada")
    n = c.Nos(m)
    pos = n.geo()["Position"]
    tij = n.add("ShaderNodeTexBrick")
    tij.inputs["Scale"].default_value = 0.8
    tij.inputs["Mortar Size"].default_value = 0.02
    tij.inputs["Color1"].default_value = c.rgba("#B9B5AE")
    tij.inputs["Color2"].default_value = c.rgba("#A7A39C")
    tij.inputs["Mortar"].default_value = c.rgba("#77736D")
    n.link(pos, tij.inputs["Vector"])
    sujo = n.ruido(pos, 0.12, 4, 0.55)[0]
    cor = n.mix_cor(n.math("MULTIPLY", sujo, 0.4), tij.outputs["Color"], c.rgba("#8A857C"))
    mato_c = n.val(0.0, "mato")
    cor = n.mix_cor(n.math("MULTIPLY", n.math("MULTIPLY", tij.outputs["Fac"], 4.0, clamp=True), mato_c), cor, c.rgba("#4C6A2A"))
    b = n.principled(None, 0.8)
    n.link(cor, b.inputs["Base Color"])
    finalizar(n, b.outputs[0])
    M["calcada"] = m

    M["ciclovia"] = mat_simples("ciclovia", "#9C3B33", 0.8)
    M["faixa"] = mat_simples("faixa", "#C9C7C0", 0.7)
    M["meiofio"] = mat_simples("meiofio", "#9E9A92", 0.85)
    M["canteiro"] = mat_simples("canteiro", "#4E5E35", 0.9)
    M["praca"] = mat_simples("praca", "#B3ADA3", 0.85)

    # Fachada: grade de janelas por posição no mundo, cor por prédio (atributo 'rnd'), janelas acesas fixas
    # (aparecem quando escurece), quebradas e manchas de umidade animáveis.
    m = bpy.data.materials.new("fachada")
    n = c.Nos(m)
    g = n.geo()
    pos, normal = g["Position"], g["Normal"]
    px, py, pz = n.sep(pos)
    nx, ny, nz = n.sep(normal)
    rnd = n.atributo("rnd")[2]
    # u: coordenada horizontal ao longo da face (x para faces que olham em y, y para faces que olham em x).
    ax = n.math("GREATER_THAN", n.math("ABSOLUTE", ny), n.math("ABSOLUTE", nx))
    u = n.mix_float(ax, py, px)
    larg = n.mix_float(rnd, 2.2, 3.4)
    alt = n.mix_float(n.math("FRACT", n.math("MULTIPLY", rnd, 7.0)), 3.1, 3.6)
    cu = n.math("DIVIDE", u, larg)
    cv = n.math("DIVIDE", pz, alt)
    fu = n.math("FRACT", cu)
    fv = n.math("FRACT", cv)
    # Três tipos de prédio: pele de vidro (quase tudo vidro), janela em faixa contínua e janela recortada.
    tipo = n.math("FRACT", n.math("MULTIPLY", rnd, 3.0))
    vidro_todo = n.math("LESS_THAN", tipo, 0.3)
    faixa_cont = n.math("MULTIPLY", n.math("GREATER_THAN", tipo, 0.62), n.math("LESS_THAN", tipo, 0.85))
    abertura = n.mix_float(n.math("FRACT", n.math("MULTIPLY", rnd, 13.0)), 0.5, 0.8)
    abertura = n.mix_float(n.math("MAXIMUM", vidro_todo, faixa_cont), abertura, 0.97)
    meia_v = n.mix_float(vidro_todo, 0.26, 0.44)
    jan_u = n.math("LESS_THAN", n.math("ABSOLUTE", n.math("SUBTRACT", fu, 0.5)), n.math("MULTIPLY", abertura, 0.5))
    jan_v = n.math("LESS_THAN", n.math("ABSOLUTE", n.math("SUBTRACT", fv, 0.55)), meia_v)
    parede_vert = n.math("LESS_THAN", n.math("ABSOLUTE", nz), 0.5)
    janela = n.math("MULTIPLY", n.math("MULTIPLY", jan_u, jan_v), parede_vert)
    janela = n.math("MULTIPLY", janela, n.math("GREATER_THAN", pz, 4.0))
    # Sofia, 21/11: andar térreo (lojas), coroamento sem janela no topo e pilares a cada poucas colunas nos prédios de
    # janela recortada. 'base' e 'topo' são a altura do chão e do teto de cada caixa (atributos por face).
    base_a = n.atributo("base")[2]
    topo_a = n.atributo("topo")[2]
    tem_topo = n.math("GREATER_THAN", topo_a, 1.0)
    acima = n.math("SUBTRACT", pz, base_a)
    janela = n.math("MULTIPLY", janela, n.math("GREATER_THAN", acima, 5.5))
    alt_coroa = n.mix_float(n.math("FRACT", n.math("MULTIPLY", rnd, 11.0)), 1.8, 5.5)
    coroa = n.math("MULTIPLY", n.math("GREATER_THAN", pz, n.math("SUBTRACT", topo_a, alt_coroa)), tem_topo)
    coroa = n.math("MULTIPLY", coroa, parede_vert)
    janela = n.math("MULTIPLY", janela, n.math("SUBTRACT", 1.0, coroa))
    recortada = n.math("MULTIPLY", n.math("GREATER_THAN", tipo, 0.3), n.math("LESS_THAN", tipo, 0.62))
    passo_pilar = n.math("FLOOR", n.mix_float(n.math("FRACT", n.math("MULTIPLY", rnd, 17.0)), 3.0, 7.0))
    pilar = n.math("LESS_THAN", n.math("FLOORED_MODULO", n.math("FLOOR", cu), passo_pilar), 0.5)
    janela = n.math("MULTIPLY", janela, n.math("SUBTRACT", 1.0, n.math("MULTIPLY", pilar, recortada)))
    terreo = n.math("MULTIPLY", n.math("MULTIPLY", n.math("LESS_THAN", acima, 5.0), tem_topo), parede_vert)
    # célula da janela para sorteios
    cel = n.add("ShaderNodeCombineXYZ")
    n.link(n.math("FLOOR", cu), cel.inputs[0])
    n.link(n.math("FLOOR", cv), cel.inputs[1])
    n.link(n.math("MULTIPLY", rnd, 97.0), cel.inputs[2])
    ruido_cel = n.add("ShaderNodeTexWhiteNoise", noise_dimensions="3D")
    n.link(cel.outputs[0], ruido_cel.inputs["Vector"])
    sorteio = ruido_cel.outputs["Value"]
    ruido_cel2 = n.add("ShaderNodeTexWhiteNoise", noise_dimensions="4D")
    n.link(cel.outputs[0], ruido_cel2.inputs["Vector"])
    ruido_cel2.inputs["W"].default_value = 3.7
    sorteio2 = ruido_cel2.outputs["Value"]
    # tom do andar: cada andar sai um pouco diferente (reforma, pintura, persiana)
    andar = n.add("ShaderNodeCombineXYZ")
    n.link(n.math("FLOOR", cv), andar.inputs[0])
    n.link(n.math("MULTIPLY", rnd, 53.0), andar.inputs[1])
    ruido_andar = n.add("ShaderNodeTexWhiteNoise", noise_dimensions="3D")
    n.link(andar.outputs[0], ruido_andar.inputs["Vector"])
    tom_andar = n.math("ADD", 0.9, n.math("MULTIPLY", ruido_andar.outputs["Value"], 0.18))
    # paleta de parede
    paleta = ["#A9A196", "#7D7770", "#5C5853", "#B59F84", "#4A4E55", "#C4BDB2", "#6E5D4E", "#2E3238", "#8F8A80"]
    cor_predio = c.rampa_paleta(n, rnd, paleta)
    sujeira = n.ruido(pos, 0.08, 5, 0.6)[0]
    parede = n.mix_cor(n.math("MULTIPLY", sujeira, 0.35), cor_predio, c.rgba("#55524D"))
    escorrido = n.add("ShaderNodeVectorMath", operation="MULTIPLY")  # sujeira que escorre das janelas
    n.link(pos, escorrido.inputs[0])
    escorrido.inputs[1].default_value = (0.9, 0.9, 0.06)
    escorre = n.math("GREATER_THAN", n.ruido(escorrido.outputs[0], 0.6, 3, 0.5)[0], 0.58)
    parede = n.mix_cor(n.math("MULTIPLY", escorre, 0.22), parede, c.rgba("#3E3B37"))
    parede_v = n.add("ShaderNodeMix", data_type="RGBA", blend_type="MULTIPLY")
    pv = {s.identifier: s for s in parede_v.inputs}
    pv["Factor_Float"].default_value = 1.0
    n.link(parede, pv["A_Color"])
    cinza = n.add("ShaderNodeCombineColor")
    for i in range(3):
        n.link(tom_andar, cinza.inputs[i])
    n.link(cinza.outputs[0], pv["B_Color"])
    parede = next(s for s in parede_v.outputs if s.identifier == "Result_Color")
    cor_coroa = n.mix_cor(n.math("GREATER_THAN", n.math("FRACT", n.math("MULTIPLY", rnd, 19.0)), 0.5),
                          c.rgba("#3A3D40"), c.rgba("#B7B1A6"))
    parede = n.mix_cor(n.math("MULTIPLY", coroa, 0.7), parede, cor_coroa)
    parede = n.mix_cor(terreo, parede, c.rgba("#1E2226"))
    manchas_v = n.val(0.0, "manchas")
    esticado = n.add("ShaderNodeVectorMath", operation="MULTIPLY")  # manchas escorridas na vertical
    n.link(pos, esticado.inputs[0])
    esticado.inputs[1].default_value = (1.0, 1.0, 0.12)
    mancha = n.math("MULTIPLY", n.math("GREATER_THAN", n.ruido(esticado.outputs[0], 0.09, 6, 0.65)[0], 0.5), manchas_v)
    parede = n.mix_cor(n.math("MULTIPLY", mancha, 0.85), parede, c.rgba("#24221F"))
    # Telhado: laje escura com manta, concreto e impermeabilização clara, sorteados por prédio, com manchas de água.
    telhado = n.math("GREATER_THAN", nz, 0.5)
    cor_laje = c.rampa_paleta(n, n.math("FRACT", n.math("MULTIPLY", rnd, 23.0)),
                              ["#2F2E2B", "#45423D", "#292826", "#55524B", "#3A3733", "#615D55", "#373A3C", "#4A4741"])
    mancha_laje = n.ruido(pos, 0.11, 4, 0.6)[0]
    cor_laje = n.mix_cor(n.math("MULTIPLY", n.math("GREATER_THAN", mancha_laje, 0.52), 0.45), cor_laje, c.rgba("#2A2926"))
    junta = n.add("ShaderNodeTexBrick")  # placas da laje, vistas só de perto
    junta.inputs["Scale"].default_value = 0.16
    junta.inputs["Mortar Size"].default_value = 0.03
    junta.inputs["Color1"].default_value = (1, 1, 1, 1)
    junta.inputs["Color2"].default_value = (0.9, 0.9, 0.9, 1)
    junta.inputs["Mortar"].default_value = (0.7, 0.7, 0.7, 1)
    n.link(pos, junta.inputs["Vector"])
    laje_m = n.add("ShaderNodeMix", data_type="RGBA", blend_type="MULTIPLY")
    lm = {s.identifier: s for s in laje_m.inputs}
    lm["Factor_Float"].default_value = 1.0
    n.link(cor_laje, lm["A_Color"])
    n.link(junta.outputs["Color"], lm["B_Color"])
    cor_laje = next(s for s in laje_m.outputs if s.identifier == "Result_Color")
    parede = n.mix_cor(telhado, parede, cor_laje)
    # Vidro: reflete o céu (metal com o tom do vidro), com cada painel um pouco torto (tom e aspereza por janela).
    tom_vidro = c.rampa_paleta(n, n.math("FRACT", n.math("MULTIPLY", rnd, 5.0)),
                               ["#4F6273", "#3E4A52", "#55606A", "#2C3238", "#4C5A50", "#5A5248"])
    vidro_cor = n.mix_cor(n.math("MULTIPLY", sorteio2, 0.5), tom_vidro, c.rgba("#2A3038"))
    cortina = n.math("GREATER_THAN", sorteio2, n.math("SUBTRACT", 1.0, n.math("MULTIPLY", recortada, 0.35)))
    vidro_cor = n.mix_cor(n.math("MULTIPLY", cortina, 0.8), vidro_cor, c.rgba("#A69C8C"))
    sujo_v = n.val(0.0, "sujo")  # anos depois: vidro sujo e opaco, e a janela quebrada aparece preta por contraste
    vidro_cor = n.mix_cor(n.math("MULTIPLY", sujo_v, 0.85), vidro_cor, c.rgba("#5E6660"))
    quebradas_v = n.val(0.0, "quebradas")
    quebrada = n.math("MULTIPLY", n.math("GREATER_THAN", sorteio, n.math("SUBTRACT", 1.0, n.math("MULTIPLY", quebradas_v, 0.38))), quebradas_v)
    vidro_cor = n.mix_cor(quebrada, vidro_cor, c.rgba("#050505"))
    cor = n.mix_cor(janela, parede, vidro_cor)
    rough_vidro = n.math("ADD", 0.03, n.math("MULTIPLY", sorteio2, 0.09))
    rough_vidro = n.mix_float(cortina, rough_vidro, 0.35)
    rough = n.mix_float(janela, 0.85, n.mix_float(quebrada, n.mix_float(sujo_v, rough_vidro, 0.6), 1.0))
    metal = n.math("MULTIPLY", janela, n.math("SUBTRACT", 1.0, quebrada))
    metal = n.math("MULTIPLY", metal, n.math("SUBTRACT", 1.0, n.math("MULTIPLY", cortina, 0.6)))
    metal = n.math("MULTIPLY", metal, n.math("SUBTRACT", 1.0, n.math("MULTIPLY", sujo_v, 0.7)))
    b = n.principled(None, rough)
    n.link(cor, b.inputs["Base Color"])
    n.link(metal, b.inputs["Metallic"])
    acesa = n.math("MULTIPLY", janela, n.math("GREATER_THAN", sorteio, 0.9))
    acesa = n.math("MULTIPLY", acesa, n.math("SUBTRACT", 1.0, quebrada))
    luz_v = n.val(0.06, "janelas_acesas")  # de dia a luz de dentro quase não aparece
    tom = n.mix_cor(n.math("FRACT", n.math("MULTIPLY", sorteio, 17.0)), c.rgba("#FFD7A0"), c.rgba("#E6EEFF"))
    n.link(tom, b.inputs["Emission Color"])
    n.link(n.math("MULTIPLY", n.math("MULTIPLY", acesa, luz_v), 1.6), b.inputs["Emission Strength"])
    finalizar(n, b.outputs[0])
    M["fachada"] = m

    M["copa"] = mat_copa("copa", ["#2F4A22", "#3B5A28", "#2A4220", "#4A6230", "#26401E", "#5A6A2E"])
    M["tronco"] = mat_simples("tronco", "#3E342B", 0.9)
    M["carro"] = mat_paleta("carro", ["#E9E9E7", "#E9E9E7", "#B9BCBF", "#B9BCBF", "#7E8287", "#1E2023", "#1E2023",
                                      "#24324A", "#8A1E1E", "#E9E9E7"], 0.3, 0.6, 1.0)
    M["vidro"] = mat_simples("vidro", "#101418", 0.15, 0.6)
    M["onibus"] = mat_paleta("onibus", ["#D9DCDD", "#C8CED2", "#2F5E8C", "#D9DCDD"], 0.4, 0.2, 0.6)
    M["roupa"] = mat_paleta("roupa", ["#2E3440", "#F2F2F0", "#A33B3B", "#3D5F8A", "#4F6B4A", "#1B1B1B", "#8C6E5A",
                                      "#C7C2BA", "#6C4C7A", "#2B4A6F"], 0.8)
    M["pele"] = mat_paleta("pele", ["#8D5A3B", "#C69072", "#5A3A28", "#E0B497", "#A06A4A"], 0.6)
    M["voce"] = mat_simples("voce", "#FFD21F", 0.6, emissao="#FFD21F", forca=0.8)
    # Sofia, 21/11: de perto (supermercado) a camiseta é tecido, sem brilho próprio; o brilho fica só no plano de drone.
    m = bpy.data.materials.new("voce_perto")
    n = c.Nos(m)
    b = n.principled(c.rgba("#FFD21F"), 0.85)
    b.inputs["Sheen Weight"].default_value = 0.4
    rel = n.add("ShaderNodeBump")
    rel.inputs["Strength"].default_value = 0.25
    n.link(n.ruido(n.geo()["Position"], 60.0, 2, 0.5)[0], rel.inputs["Height"])
    n.link(rel.outputs[0], b.inputs["Normal"])
    finalizar(n, b.outputs[0])
    M["voce_perto"] = m
    M["calca_voce"] = mat_simples("calca_voce", "#23272E", 0.9)
    M["calca"] = mat_paleta("calca", ["#23272E", "#2E3A52", "#3B3F44", "#1C1C1E", "#6B5E4B", "#2F3B4C", "#4A4F57"], 0.9)
    M["cabelo"] = mat_paleta("cabelo", ["#1A1410", "#2B1E15", "#0E0D0C", "#4A3524", "#6B4E33", "#1A1410"], 0.55)
    M["sapato"] = mat_paleta("sapato", ["#1C1C1C", "#E8E6E0", "#3A2E24", "#555A60", "#E8E6E0"], 0.6)
    M["metal"] = mat_simples("metal", "#3A3D40", 0.5, 0.7)
    M["lampada"] = mat_simples("lampada", "#2A2A2A", 0.4, emissao="#FFC58A", forca=0.0)
    M["vermelho"] = mat_simples("vermelho", "#B0261E", 0.6)
    M["torre_branca"] = mat_simples("torre_branca", "#E8E6E2", 0.6, 0.3)
    M["torre_verm"] = mat_simples("torre_verm", "#C0392B", 0.6, 0.3)
    M["mato"] = mat_paleta("mato", ["#5E7F2E", "#6E8F3A", "#4F6B26", "#7A8F3E"], 0.9)
    m = bpy.data.materials.new("chuva")
    n = c.Nos(m)
    tr = n.add("ShaderNodeBsdfTransparent")
    em = n.add("ShaderNodeEmission")
    em.inputs["Color"].default_value = c.rgba("#DDE6EE")
    em.inputs["Strength"].default_value = 0.5
    mx = n.add("ShaderNodeMixShader")
    mx.inputs[0].default_value = 0.22
    n.link(tr.outputs[0], mx.inputs[1])
    n.link(em.outputs[0], mx.inputs[2])
    n.link(mx.outputs[0], n.saida.inputs["Surface"])
    M["chuva"] = m
    return M


def valor(mat, nome):
    return mat.node_tree.nodes[nome].outputs[0]


# ------------------------------------------------------------------------------------------------ chão
def fora_das_travessas(x, folga=0.0):
    return all(abs(x - t) > LARG_TRAVESSA / 2 + folga for t in TRAVESSAS)


def chao(M, tempo, plano):
    bm = bmesh.new()
    # 0 asfalto, 1 calçada, 2 ciclovia, 3 faixas, 4 meio-fio, 5 canteiro, 6 praça
    c.plano_chao(bm, X0, -BORDA, X1, BORDA, 0.0, 0)
    for s in (1, -1):
        for xa, xb in _segmentos():
            c.plano_chao(bm, xa, s * BORDA, xb, s * LOTE, 0.18, 1) if s > 0 else c.plano_chao(bm, xa, s * LOTE, xb, s * BORDA, 0.18, 1)
            c.caixa(bm, ((xa + xb) / 2, s * (BORDA + 0.15), 0.09), (xb - xa, 0.3, 0.18), 4)
    # canteiro com a ciclovia vermelha no meio
    c.caixa(bm, ((X0 + X1) / 2, 0, 0.1), (X1 - X0, 2 * CANTEIRO, 0.2), 5)
    c.caixa(bm, ((X0 + X1) / 2, 0, 0.21), (X1 - X0, 2 * CANTEIRO - 1.0, 0.02), 2)
    # travessas (asfalto) e faixas de pedestre
    for t in TRAVESSAS:
        for s in (1, -1):
            c.plano_chao(bm, t - LARG_TRAVESSA / 2, min(s * BORDA, s * 1600), t + LARG_TRAVESSA / 2, max(s * BORDA, s * 1600), 0.0, 0)
        for xf in (t - LARG_TRAVESSA / 2 - 3.2, t + LARG_TRAVESSA / 2 + 3.2):
            y = -BORDA + 0.8
            while y < BORDA - 0.8:
                if abs(y) > CANTEIRO + 0.2:
                    c.caixa(bm, (xf, y + 0.25, 0.02), (4.0, 0.5, 0.02), 3)
                y += 1.0
    # marcas das faixas (tracejadas) e linhas de borda
    x = X0
    while x < X1:
        if fora_das_travessas(x, 8):
            for s in (1, -1):
                for k in (1, 2, 3):
                    c.caixa(bm, (x + 1.5, s * (CANTEIRO + 3.35 * k), 0.015), (3.0, 0.12, 0.015), 3)
        x += 12.0
    for s in (1, -1):
        c.caixa(bm, ((X0 + X1) / 2, s * (CANTEIRO + 0.4), 0.015), (X1 - X0, 0.15, 0.015), 3)
    o = c.objeto("chao", bm, [M["asfalto"], M["calcada"], M["ciclovia"], M["faixa"], M["meiofio"], M["canteiro"], M["praca"]])
    # o chão de fora (quarteirões ao longe), descendo do espigão
    bm = bmesh.new()
    # Sofia, 21/11: o chão vai até 30 km. Antes acabava em 6 km e o céu aparecia por baixo do horizonte, lendo
    # como um mar; agora a névoa fecha o horizonte sobre o chão.
    ys = [-30000, -3000, -1500, -800, -400, -200, -70, 70, 200, 400, 800, 1500, 3000, 30000]
    linhas = []
    for y in ys:
        linhas.append([bm.verts.new((x, y, base_z(max(-3000, min(3000, y))) - 0.05)) for x in (-3000, 30000)])
    for i in range(len(ys) - 1):
        a, b = linhas[i], linhas[i + 1]
        bm.faces.new((a[0], a[1], b[1], b[0]))
    c.objeto("chao_longe", bm, [M["praca"]])

    for ev, nome, alvo in (("asfalto_racha", "rachar", 1.0), ("mato_cresce", "mato", 1.0)):
        e = tempo.evento(ev)
        if e:
            c.animar_valor(valor(M["asfalto"], nome), [(e[0], 0.0), (e[1], alvo)])
    e = tempo.evento("mato_cresce")
    if e:
        c.animar_valor(valor(M["calcada"], "mato"), [(e[0], 0.0), (e[1], 0.55)])
    e = tempo.evento("chuva")
    if e:
        c.animar_valor(valor(M["asfalto"], "molhado"), [(e[0], 0.0), (e[0] + 45, 1.0)])
    e = tempo.evento("janelas_quebram")
    if e:
        c.animar_valor(valor(M["fachada"], "quebradas"), [(e[0], 0.0), (e[1], 1.0)])
    e = tempo.evento("predios_mancham")
    if e:
        c.animar_valor(valor(M["fachada"], "manchas"), [(e[0], 0.0), (e[1], 1.0)])
    return o


def _segmentos():
    xs = [X0] + [v for t in TRAVESSAS for v in (t - LARG_TRAVESSA / 2, t + LARG_TRAVESSA / 2)] + [X1]
    return [(xs[i], xs[i + 1]) for i in range(0, len(xs), 2)]


# ------------------------------------------------------------------------------------------------ prédios
def base_z(y):
    """A avenida corre no alto do espigão: o terreno desce para os dois lados (cerca de 4 m a cada 100 m)."""
    return -max(0.0, abs(y) - 70.0) * 0.04


def atributos_predio(me, rnds, bases, topos):
    """rnd (cor e tipo), base e topo (m) por face, lidos pela fachada para térreo, coroamento e janelas."""
    c.atributo_por_face(me, "rnd", rnds)
    c.atributo_por_face(me, "base", bases)
    c.atributo_por_face(me, "topo", topos)


def predios(M, tempo, plano):
    bm = bmesh.new()
    rnds, bases, topos = [], [], []
    caixas = []  # (cx, cy, w, d, z do teto, rnd, nível) para os telhados
    nivel = ["frente"]

    def predio(cx, cy, w, d, h, r):
        z0 = base_z(cy) - 1.5
        n = c.caixa_rapida(bm, (cx, cy, z0 + (h + 1.5) / 2), (w, d, h + 1.5))  # rápida: ~7 mil caixas
        res = None
        rnds.extend([r] * n)
        bases.extend([z0 + 1.5] * n)
        topos.extend([z0 + h + 1.5] * n)
        caixas.append((cx, cy, w, d, z0 + h + 1.5, r, nivel[0]))
        return res

    # Frente da avenida: torres altas, com embasamento e às vezes um volume em cima.
    for s in (1, -1):
        x = X0
        while x < X1:
            w = random.uniform(24, 52)
            if not fora_das_travessas(x + w / 2, w / 2 + 2):
                x += 6
                continue
            d = random.uniform(26, 44)
            h = random.choices([random.uniform(60, 110), random.uniform(90, 150), random.uniform(28, 50)], [0.45, 0.4, 0.15])[0]
            r = random.random()
            cy = s * (LOTE + 1.5 + d / 2)
            predio(x + w / 2, cy, w - 3, d, h, r)
            if random.random() < 0.45:
                predio(x + w / 2, cy + s * random.uniform(-3, 3), (w - 3) * 0.6, d * 0.6, h + random.uniform(8, 25), r)
            if random.random() < 0.7:
                # (antes: um cubo de 6 m com janelas; agora a casa de máquinas sai em telhados(), com caixa d'água)
                random.uniform(-4, 4)  # mantém a sequência do sorteio: o layout aprovado não muda
            x += w
        # segunda e terceira fileiras
        nivel[0] = "fila"
        for fila, (y0, y1, hmin, hmax) in enumerate(((75, 120, 25, 110), (125, 175, 15, 80))):
            x = X0
            while x < X1 + 400:
                w = random.uniform(22, 50)
                if fora_das_travessas(x + w / 2, w / 2 + 2):
                    d = random.uniform(20, y1 - y0)
                    predio(x + w / 2, s * (y0 + d / 2), w - 4, d, random.uniform(hmin, hmax), random.random())
                x += w
        nivel[0] = "frente"
    # Cidade do fundo: quarteirões até o horizonte.
    nivel[0] = "fundo"
    for gx in range(-1600, 4600, 50):
        for gy in range(190, 1800, 50):
            for s in (1, -1):
                if random.random() < 0.12:
                    continue
                x = gx + random.uniform(-6, 6)
                if not fora_das_travessas(x, 24):
                    continue
                h = random.choices([random.uniform(8, 30), random.uniform(30, 65), random.uniform(65, 110)], [0.7, 0.25, 0.05])[0]
                predio(x, s * (gy + random.uniform(-5, 5)), random.uniform(18, 36), random.uniform(18, 36), h, random.random())
    for gx in range(int(X1) + 60, 4600, 50):  # depois do fim da avenida
        for gy in range(-180, 190, 50):
            h = random.uniform(10, 70)
            predio(gx, gy, random.uniform(18, 34), random.uniform(18, 34), h, random.random())
    o = c.objeto("predios", bm, [M["fachada"]])
    atributos_predio(o.data, rnds, bases, topos)
    telhados(M, caixas)


def mat_cobertura():
    """Platibanda e casa de máquinas na cor do prédio (rnd), equipamento galvanizado, caixa d'água e placa solar."""
    if "cobertura" in bpy.data.materials:
        return bpy.data.materials["cobertura"]
    m = bpy.data.materials.new("cobertura")
    n = c.Nos(m)
    rnd = n.atributo("rnd")[2]
    g = n.geo()
    pos = n.sep(g["Position"])
    nz = n.sep(g["Normal"])[2]
    idx = n.atributo("parte")[2]  # 0 parede, 1 equipamento, 2 caixa d'água, 3 placa solar
    paleta = ["#A9A196", "#7D7770", "#5C5853", "#B59F84", "#4A4E55", "#C4BDB2", "#6E5D4E", "#2E3238", "#8F8A80"]
    parede = n.mix_cor(0.12, c.rampa_paleta(n, rnd, paleta), c.rgba("#3A3835"))
    topo = n.math("GREATER_THAN", nz, 0.5)
    parede = n.mix_cor(n.math("MULTIPLY", topo, 0.6), parede, c.rgba("#4A4743"))
    equip = n.mix_cor(n.math("GREATER_THAN", n.math("FRACT", n.math("MULTIPLY", rnd, 41.0)), 0.6),
                      c.rgba("#9EA2A3"), c.rgba("#D2D2CC"))
    caixa = n.mix_cor(n.math("GREATER_THAN", n.math("FRACT", n.math("MULTIPLY", rnd, 29.0)), 0.7),
                      c.rgba("#77726A"), c.rgba("#2F5878"))
    solar = c.rgba("#18243A")
    eh = [n.math("LESS_THAN", n.math("ABSOLUTE", n.math("SUBTRACT", idx, k)), 0.5) for k in (1, 2, 3)]
    cor = n.mix_cor(eh[0], parede, equip)
    cor = n.mix_cor(eh[1], cor, caixa)
    cor = n.mix_cor(eh[2], cor, solar)
    rough = n.mix_float(eh[0], 0.85, 0.45)
    rough = n.mix_float(eh[2], rough, 0.12)
    b = n.principled(None, rough)
    n.link(cor, b.inputs["Base Color"])
    n.link(n.math("MULTIPLY", n.math("ADD", eh[0], eh[2]), 0.6), b.inputs["Metallic"])
    finalizar(n, b.outputs[0])
    return m


def telhados(M, caixas, semente=211, moderno=True):
    """Sofia, 21/11: o telhado é a maior área do quadro visto de drone. Platibanda em toda caixa; casa de máquinas,
    caixa d'água, ar-condicionado, placas solares e mastro nos prédios da frente; casinha e caixa d'água no fundo.
    Sorteio próprio (semente fixa), para não mexer no layout aprovado."""
    rng = random.Random(semente)
    bm = bmesh.new()
    rnds, partes = [], []

    def bloco(centro, tam, r, parte):
        k = c.caixa_rapida(bm, centro, tam)
        rnds.extend([r] * k)
        partes.extend([parte] * k)

    for (cx, cy, w, d, zt, r, nivel) in caixas:
        if w < 4 or d < 4:
            continue
        p = 1.1 if nivel != "fundo" else 0.9
        e = 0.35
        bloco((cx, cy - d / 2 + e / 2, zt + p / 2), (w, e, p), r, 0)
        bloco((cx, cy + d / 2 - e / 2, zt + p / 2), (w, e, p), r, 0)
        bloco((cx - w / 2 + e / 2, cy, zt + p / 2), (e, d - 2 * e, p), r, 0)
        bloco((cx + w / 2 - e / 2, cy, zt + p / 2), (e, d - 2 * e, p), r, 0)
        livre_x, livre_y = w / 2 - 2.5, d / 2 - 2.5
        if livre_x < 2 or livre_y < 2:
            continue
        if nivel == "fundo":
            if rng.random() < 0.6:
                mw, md, mh = rng.uniform(3, 6), rng.uniform(3, 5), rng.uniform(2.5, 3.5)
                mx, my = cx + rng.uniform(-livre_x, livre_x) * 0.6, cy + rng.uniform(-livre_y, livre_y) * 0.6
                bloco((mx, my, zt + mh / 2), (mw, md, mh), r, 0)
                if rng.random() < 0.6:
                    bloco((mx, my, zt + mh + 0.9), (mw * 0.8, md * 0.8, 1.8), r, 2)
            continue
        # casa de máquinas com a caixa d'água em cima
        mw, md, mh = rng.uniform(5, 9), rng.uniform(4, 7), rng.uniform(3.2, 4.6)
        mw, md = min(mw, w * 0.5), min(md, d * 0.5)
        mx = cx + rng.uniform(-1, 1) * max(0.0, livre_x - mw / 2)
        my = cy + rng.uniform(-1, 1) * max(0.0, livre_y - md / 2)
        bloco((mx, my, zt + mh / 2), (mw, md, mh), r, 0)
        bloco((mx, my, zt + mh + 0.15), (mw + 0.4, md + 0.4, 0.3), r, 0)
        bloco((mx, my, zt + mh + 0.3 + 1.0), (mw * 0.7, md * 0.7, 2.0), r, 2)
        # ar-condicionado em fila
        if rng.random() < (0.75 if moderno else 0.0):
            n_ac = rng.randint(2, 7)
            ax = cx + rng.uniform(-livre_x, livre_x) * 0.5
            ay = cy + rng.uniform(-livre_y, livre_y) * 0.7
            for k in range(n_ac):
                bloco((ax + (k - n_ac / 2) * 2.0, ay, zt + 0.6), (1.6, 1.1, 1.2), r, 1)
        # placas solares (prédios mais baixos) ou clarabóias
        if rng.random() < 0.3 and zt < 90 and moderno:
            fx = rng.uniform(-livre_x, livre_x) * 0.3
            for i in range(-2, 3):
                for j in range(-1, 2):
                    px, py = cx + fx + i * 2.3, cy + j * 1.5 + (my - cy) * -0.5
                    if abs(px - cx) < livre_x and abs(py - cy) < livre_y:
                        bloco((px, py, zt + 0.35), (2.0, 1.2, 0.12), r, 3)
        # mastro de antena
        if rng.random() < 0.3:
            c.cilindro(bm, (mx + mw / 3, my, zt + mh + 4), 0.12, 8, 6)
            falta = len(bm.faces) - len(rnds)
            rnds.extend([r] * falta)
            partes.extend([1] * falta)
    bm.faces.ensure_lookup_table()
    o = c.objeto("telhados", bm, [mat_cobertura()])
    c.atributo_por_face(o.data, "rnd", rnds)
    c.atributo_por_face(o.data, "parte", partes)
    return o


def torres_de_tv(M):
    """Torres de antena de treliça, vermelhas e brancas, que marcam o espigão."""
    for i, (x, y, base, alt) in enumerate(((880, 58, 70, 150), (1480, -92, 60, 175), (2080, 64, 55, 140), (520, -140, 45, 120))):
        bm = bmesh.new()
        lado0, lado1 = 9.0, 1.6
        n_seg = int(alt / 6)
        for k in range(n_seg):
            z0, z1 = base + k * 6, base + (k + 1) * 6
            l0 = lado0 + (lado1 - lado0) * k / n_seg
            l1 = lado0 + (lado1 - lado0) * (k + 1) / n_seg
            mat = 1 if (k // 3) % 2 else 0
            for sx, sy in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
                a = Vector((x + sx * l0 / 2, y + sy * l0 / 2, z0))
                b = Vector((x + sx * l1 / 2, y + sy * l1 / 2, z1))
                _barra(bm, a, b, 0.35, mat)
            for (ax, ay), (bx, by) in (((1, 1), (1, -1)), ((1, -1), (-1, -1)), ((-1, -1), (-1, 1)), ((-1, 1), (1, 1))):
                _barra(bm, Vector((x + ax * l0 / 2, y + ay * l0 / 2, z0)), Vector((x + bx * l1 / 2, y + by * l1 / 2, z1)), 0.18, mat)
                _barra(bm, Vector((x + ax * l1 / 2, y + ay * l1 / 2, z1)), Vector((x + bx * l1 / 2, y + by * l1 / 2, z1)), 0.18, mat)
        c.cilindro(bm, (x, y, base + alt + 6), 0.4, 12, 6, 1)
        c.caixa(bm, (x, y, base / 2), (22, 22, base), 2)
        o = c.objeto(f"torre_tv_{i}", bm, [M["torre_branca"], M["torre_verm"], M["fachada"]])
        k = len(o.data.polygons)
        atributos_predio(o.data, [0.3] * k, [0.0] * k, [float(base)] * k)


def _barra(bm, a, b, esp, mat):
    meio = (a + b) / 2
    d = b - a
    comp = d.length
    rot = d.to_track_quat("Z", "Y")
    from mathutils import Matrix
    m = Matrix.LocRotScale(meio, rot, Vector((esp, esp, comp)))
    r = bmesh.ops.create_cube(bm, size=1.0, matrix=m)
    for v in r["verts"]:
        for f in v.link_faces:
            f.material_index = mat


def portico_vermelho(M):
    """Um museu suspenso por dois pórticos vermelhos, com o vão livre embaixo (marco da avenida, desenho próprio)."""
    x, y = 610.0, -(LOTE + 32)
    bm = bmesh.new()
    comp, larg = 74.0, 30.0
    c.plano_chao(bm, x - comp / 2 - 6, y - larg / 2 - 4, x + comp / 2 + 6, y + larg / 2 + 4, 0.2, 2)
    for sx in (-1, 1):
        for sy in (-1, 1):
            c.caixa(bm, (x + sx * (comp / 2 - 2), y + sy * (larg / 2 + 1.5), 12), (3.2, 2.2, 24), 0)
        c.caixa(bm, (x + sx * (comp / 2 - 2), y, 24.8), (3.2, larg + 5.2, 2.0), 0)
    for sy in (-1, 1):
        c.caixa(bm, (x, y + sy * (larg / 2 + 1.5), 24.8), (comp, 2.2, 2.2), 0)
    c.caixa(bm, (x, y, 16.5), (comp - 6, larg, 13), 1)
    c.objeto("portico", bm, [M["vermelho"], M["vidro"], M["praca"]])


# ------------------------------------------------------------------------------------------------ árvores
def mat_copa(nome, cores):
    """Copa: cor por árvore (Object Info), tom por tufo (atributo 'tom'), folhagem em manchas com relevo e a parte de
    baixo da copa mais escura (a sombra que a própria copa faz)."""
    m = bpy.data.materials.new(nome)
    n = c.Nos(m)
    info = n.add("ShaderNodeObjectInfo")
    tom = n.atributo("tom")[2]
    base = c.rampa_paleta(n, n.math("FRACT", n.math("ADD", info.outputs["Random"], n.math("MULTIPLY", tom, 0.35))), cores, False)
    hsv = n.add("ShaderNodeHueSaturation")
    n.link(base, hsv.inputs["Color"])
    n.link(n.math("ADD", 0.48, n.math("MULTIPLY", tom, 0.04)), hsv.inputs["Hue"])
    n.link(n.math("ADD", 0.75, n.math("MULTIPLY", tom, 0.5)), hsv.inputs["Value"])
    coord = n.add("ShaderNodeTexCoord")
    folhas = n.ruido(coord.outputs["Object"], 1.3, 4, 0.6)[0]
    cor = n.mix_cor(n.math("MULTIPLY", n.math("SUBTRACT", 0.55, folhas, clamp=True), 1.6), hsv.outputs[0], c.rgba("#16200F"))
    luz = n.math("MULTIPLY", n.math("SUBTRACT", folhas, 0.5, clamp=True), 0.8)
    cor = n.mix_cor(luz, cor, c.rgba("#7E9448"))
    gz = n.sep(coord.outputs["Generated"])[2]
    baixo = n.math("MULTIPLY", n.math("SUBTRACT", 0.78, gz, clamp=True), 1.8, clamp=True)
    cor = n.mix_cor(n.math("MULTIPLY", baixo, 0.7), cor, c.rgba("#121A0C"))
    b = n.principled(None, 0.82)
    n.link(cor, b.inputs["Base Color"])
    b.inputs["Specular IOR Level"].default_value = 0.25
    rel = n.add("ShaderNodeBump")
    rel.inputs["Strength"].default_value = 0.7
    n.link(n.ruido(coord.outputs["Object"], 3.5, 3, 0.6)[0], rel.inputs["Height"])
    n.link(rel.outputs[0], b.inputs["Normal"])
    finalizar(n, b.outputs[0])
    return m


def malha_arvore(nome, M, alt, raio, forma="copa"):
    """Sofia, 21/11: tronco que afina, 3 a 5 galhos aparentes e a copa em 11 a 16 tufos irregulares (vértices
    sacudidos), em camadas, cada um com um tom. Sorteio próprio por nome; a sequência global segue igual."""
    rng = random.Random(f"{nome}|{alt:.4f}|{raio:.4f}")
    for _ in range(45):  # o desenho antigo gastava 45 sorteios: mantém a posição das árvores e da multidão
        random.random()
    bm = bmesh.new()
    toms = []

    def marca(t):
        toms.extend([t] * (len(bm.faces) - len(toms)))

    estreita = forma == "choupo"
    r_copa = raio * (0.55 if estreita else 1.0)
    alt_tronco = alt * (0.35 if estreita else 0.42)
    c.cilindro(bm, (0, 0, alt_tronco / 2), raio * 0.075, alt_tronco, 8, 1, raio * 0.05)
    n_galhos = rng.randint(3, 5)
    pontas = []
    for k in range(n_galhos):
        a = 2 * math.pi * k / n_galhos + rng.uniform(-0.4, 0.4)
        p0 = (0, 0, alt_tronco * rng.uniform(0.75, 1.0))
        p1 = (math.cos(a) * r_copa * 0.55, math.sin(a) * r_copa * 0.55, alt * rng.uniform(0.6, 0.72))
        c.cone_entre(bm, p0, p1, raio * 0.045, raio * 0.018, 6, 1)
        pontas.append(p1)
    marca(0.0)
    n_tufos = rng.randint(11, 16)
    centro_z = alt * (0.62 if estreita else 0.68)
    esp_z = alt * (0.3 if estreita else 0.17)
    for i in range(n_tufos):
        if i < len(pontas):
            px, py, pz = pontas[i]
        else:
            a = rng.uniform(0, 2 * math.pi)
            d = math.sqrt(rng.random()) * r_copa * 0.62
            px, py, pz = math.cos(a) * d, math.sin(a) * d, centro_z + rng.uniform(-1, 1) * esp_z
        rr = r_copa * rng.uniform(0.26, 0.55)
        res = c.esfera(bm, (px, py, pz), rr, 0, 2, (1, 1, rng.uniform(0.62, 0.85)))
        for v in res["verts"]:
            v.co += Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-0.6, 0.6))) * rr * 0.24
        marca(rng.random())
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(M["copa"])
    me.materials.append(M["tronco"])
    for p in me.polygons:
        p.use_smooth = True
    c.atributo_por_face(me, "tom", toms)
    return me


def arvores(M, tempo, plano):
    malhas = [malha_arvore(f"arvore{i}", M, random.uniform(9, 14), random.uniform(3.2, 4.6)) for i in range(4)]
    vento = plano["id"] in ("P1",)
    for s in (1, -1):
        for yy, passo in ((BORDA + 1.8, 10.0), (LOTE - 1.6, 17.0)):
            x = X0 + random.uniform(0, passo)
            while x < X1:
                if fora_das_travessas(x, 3) and not (550 < x < 680 and s < 0 and yy > BORDA + 2):
                    o = bpy.data.objects.new("arvore", random.choice(malhas))
                    o.location = (x + random.uniform(-1.5, 1.5), s * (yy + random.uniform(-0.4, 0.4)), 0.18)
                    o.rotation_euler = (0, 0, random.uniform(0, 6.28))
                    esc = random.uniform(0.85, 1.2)
                    o.scale = (esc, esc, esc)
                    bpy.context.scene.collection.objects.link(o)
                    if vento:
                        _balanco(o)
                x += passo * random.uniform(0.8, 1.2)


def _balanco(o):
    o.keyframe_insert("rotation_euler", frame=1)
    ad = o.animation_data
    for fc in c._fcurves(ad.action):
        if fc.data_path == "rotation_euler" and fc.array_index in (0, 1):
            mod = fc.modifiers.new("NOISE")
            mod.scale = 22.0
            mod.strength = 0.035
            mod.phase = random.uniform(0, 100)


# ------------------------------------------------------------------------------------------------ postes e letreiros
def postes_e_letreiros(M, tempo, plano):
    bm_p = bmesh.new()
    bm_l = bmesh.new()
    for s in (1, -1):
        x = X0 + 10
        while x < X1:
            if fora_das_travessas(x, 4):
                y = s * (BORDA + 0.8)
                c.cilindro(bm_p, (x, y, 5.5), 0.14, 11, 8, 0)
                c.caixa(bm_p, (x, y - s * 2.0, 11.0), (0.25, 4.0, 0.25), 0)
                c.caixa(bm_l, (x, y - s * 3.6, 10.8), (0.7, 1.1, 0.25), 0)
            x += 32.0
    c.objeto("postes", bm_p, [M["metal"]])
    luz = c.objeto("lampadas", bm_l, [M["lampada"]])
    # Letreiros com timer nas fachadas da frente.
    letreiros = []
    for i in range(34):
        s = random.choice((1, -1))
        x = random.uniform(-200, 2200)
        if not fora_das_travessas(x, 30):
            continue
        cor = random.choice(["#F5F1E8", "#E04A3A", "#3A7BE0", "#F0B54A", "#F5F1E8"])
        m = c.Nos(bpy.data.materials.new(f"letreiro{i}"))
        b = m.principled(c.rgba("#202020"), 0.5, 0.0, c.rgba(cor), 0.0)
        finalizar(m, b.outputs[0])
        bm = bmesh.new()
        z = random.uniform(30, 90)
        c.caixa(bm, (x, s * (LOTE + 1.3), z), (random.uniform(8, 18), 0.4, random.uniform(2.5, 4)))
        o = c.objeto(f"letreiro{i}", bm, [m.mat])
        letreiros.append(m.mat)
    e = tempo.evento("luzes_acendem")
    if e:
        a = e[0]
        lamp = M["lampada"].node_tree.nodes
        bs = next(nd for nd in lamp if nd.type == "BSDF_PRINCIPLED")
        c.chave(bs.inputs["Emission Strength"], "default_value", [(a - 1, 0.0), (a + 6, 18.0)])
        for k, m in enumerate(letreiros):
            bs = next(nd for nd in m.node_tree.nodes if nd.type == "BSDF_PRINCIPLED")
            atraso = random.randint(0, 14)
            c.chave(bs.inputs["Emission Strength"], "default_value", [(a + atraso - 1, 0.0), (a + atraso + 2, 7.0)], "CONSTANT")


# ------------------------------------------------------------------------------------------------ gente e carros
def malha_pessoa(nome, M, voce=False, perto=False, pose="parado", cabelo="curto"):
    """Sofia, 21/11: pessoa adulta de 1,75 m (7,5 cabeças), olhando para +x. Pernas separadas, quadril, tronco mais
    largo nos ombros e achatado de frente para trás, camiseta de manga curta, braços com cotovelo, mãos, pescoço,
    cabeça com nariz e orelhas, cabelo e tênis. Materiais: 0 camiseta, 1 calça, 2 pele, 3 cabelo, 4 sapato.
    pose 'empurra': os braços vão à frente, na altura do puxador do carrinho."""
    bm = bmesh.new()
    seg = 10 if perto else 7
    for s in (1, -1):
        y = s * 0.095
        c.afunilar(c.caixa(bm, (0.045, y, 0.045), (0.27, 0.1, 0.09), 4), 0.8, 0.85, -0.02)     # tênis
        c.cone_entre(bm, (0.0, y, 0.07), (0.0, y * 0.97, 0.5), 0.047, 0.06, seg, 1)            # canela
        c.cone_entre(bm, (0.0, y * 0.97, 0.49), (0.0, y * 0.88, 0.93), 0.062, 0.088, seg, 1)   # coxa
    c.esfera(bm, (0, 0, 0.93), 1.0, 1, 2, (0.092, 0.155, 0.09))                                # quadril
    tronco = c.cilindro(bm, (0, 0, 1.165), 0.165, 0.5, 14 if perto else 10, 0, 0.2)            # tronco
    for v in tronco["verts"]:
        v.co.x *= 0.6
    c.esfera(bm, (0, 0, 1.39), 1.0, 0, 2, (0.12, 0.215, 0.08))                                 # ombros
    c.cilindro(bm, (0, 0, 1.48), 0.05, 0.11, 8, 2)                                              # pescoço
    for s in (1, -1):
        ombro = Vector((0.0, s * 0.205, 1.385))
        if pose == "empurra":
            cotovelo, pulso = Vector((0.2, s * 0.225, 1.17)), Vector((0.43, s * 0.21, 1.02))
        else:
            cotovelo, pulso = Vector((-0.01, s * 0.245, 1.11)), Vector((0.035, s * 0.24, 0.85))
        c.cone_entre(bm, ombro, ombro + (cotovelo - ombro) * 0.4, 0.066, 0.06, seg, 0)           # manga
        c.cone_entre(bm, ombro, cotovelo, 0.047, 0.04, seg, 2)                                   # braço
        c.cone_entre(bm, cotovelo, pulso, 0.041, 0.03, seg, 2)                                   # antebraço
        mao = pulso + (pulso - cotovelo).normalized() * 0.07
        c.esfera(bm, tuple(mao), 1.0, 2, 1, (0.03, 0.026, 0.045) if pose == "empurra" else (0.026, 0.03, 0.05))
    c.esfera(bm, (0.012, 0, 1.62), 1.0, 2, 3 if perto else 2, (0.098, 0.077, 0.115))           # cabeça
    c.esfera(bm, (0.107, 0, 1.6), 1.0, 2, 1, (0.022, 0.014, 0.026))                             # nariz
    for s in (1, -1):
        c.esfera(bm, (0.0, s * 0.079, 1.615), 1.0, 2, 1, (0.018, 0.01, 0.03))                   # orelhas
    c.esfera(bm, (-0.012, 0, 1.668), 1.0, 3, 2, (0.1, 0.083, 0.086))                            # cabelo
    if cabelo == "longo":
        c.esfera(bm, (-0.06, 0, 1.5), 1.0, 3, 2, (0.06, 0.085, 0.16))
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    if voce:
        camiseta, calca = (M["voce_perto"] if perto else M["voce"]), M["calca_voce"]
    else:
        camiseta, calca = M["roupa"], M["calca"]
    for mat in (camiseta, calca, M["pele"], M["cabelo"], M["sapato"]):
        me.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = True
    return me


def malha_carro(nome, M, onibus=False):
    bm = bmesh.new()
    if onibus:
        c.afunilar(c.caixa(bm, (0, 0, 1.75), (12.6, 2.55, 2.9), 0), 0.99, 0.96)
        c.caixa(bm, (0, 1.28, 2.25), (11.2, 0.04, 1.0), 1)
        c.caixa(bm, (0, -1.28, 2.25), (11.2, 0.04, 1.0), 1)
        c.caixa(bm, (0, 0, 3.25), (8.0, 1.6, 0.25), 0)
    else:
        # Sofia, 21/11: ombro arredondado, cabine que afina com para-brisa inclinado e capô mais baixo que a traseira.
        c.afunilar(c.caixa(bm, (0, 0, 0.6), (4.4, 1.78, 0.7), 0), 0.98, 0.9)
        c.afunilar(c.caixa(bm, (1.55, 0, 0.98), (1.2, 1.6, 0.08), 0), 0.9, 0.95)
        c.afunilar(c.caixa(bm, (-0.25, 0, 1.22), (2.4, 1.56, 0.6), 1), 0.66, 0.82, -0.18)
        c.caixa(bm, (-0.43, 0, 1.525), (1.5, 1.26, 0.04), 0)
    for (x, y) in ((1.4, 0.8), (1.4, -0.8), (-1.4, 0.8), (-1.4, -0.8)) if not onibus else ((4.2, 1.2), (4.2, -1.2), (-3.8, 1.2), (-3.8, -1.2)):
        c.cilindro(bm, (x, y, 0.32 if not onibus else 0.5), 0.32 if not onibus else 0.5, 0.2, 10, 2)
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(M["onibus"] if onibus else M["carro"])
    me.materials.append(M["vidro"])
    me.materials.append(M["metal"])
    return me


def multidao(M, tempo, plano):
    """Carros, ônibus, ciclistas e pedestres em movimento; todos somem de uma vez em 'última'."""
    e = tempo.evento("multidao_some")
    some = e[0] if e else tempo.quadros + 1
    carro, onibus = malha_carro("carro", M), malha_carro("onibus", M, True)
    pessoas = [malha_pessoa(f"pessoa{i}", M, cabelo="longo" if i == 1 else "curto") for i in range(3)]
    col = bpy.data.collections.new("multidao")
    bpy.context.scene.collection.children.link(col)

    def por(me, pos, vel, rot):
        o = bpy.data.objects.new(me.name, me)
        o.rotation_euler = (0, 0, rot)
        col.objects.link(o)
        p0 = Vector(pos)
        p1 = p0 + Vector(vel) * (some - 1) / c.FPS
        c.chave(o, "location", [(1, p0), (some, p1)], "LINEAR")
        c.sumir(o, some)
        return o

    xmin, xmax = -260.0, 1500.0
    for s in (1, -1):
        sentido = -1 if s > 0 else 1        # mão inglesa não: no Brasil, a pista da direita (y < 0) vai para +x
        for faixa in range(4):
            y = s * (CANTEIRO + 1.7 + 3.35 * faixa)
            x = xmin + random.uniform(0, 12)
            while x < xmax:
                bus = faixa == 3 and random.random() < 0.35
                me = onibus if bus else carro
                comp = 12.6 if bus else 4.4
                if fora_das_travessas(x, 2) or random.random() < 0.5:
                    v = random.uniform(6, 11) * sentido
                    por(me, (x, y + random.uniform(-0.3, 0.3), 0.0), (v, 0, 0), 0 if sentido > 0 else math.pi)
                x += comp + random.uniform(3, 14) * (1.6 if faixa == 0 else 1.0)
    # pedestres nas calçadas e nas faixas
    for s in (1, -1):
        x = xmin
        while x < xmax:
            y = s * random.uniform(BORDA + 1.0, LOTE - 0.8)
            sentido = random.choice((1, -1))
            por(random.choice(pessoas), (x, y, 0.18), (1.3 * sentido, 0, 0), 0 if sentido > 0 else math.pi)  # olha para onde anda
            x += random.uniform(0.6, 2.6)
    for t in TRAVESSAS:
        if xmin < t < xmax:
            for xf in (t - LARG_TRAVESSA / 2 - 3.2, t + LARG_TRAVESSA / 2 + 3.2):
                for _ in range(random.randint(4, 12)):
                    y = random.uniform(-BORDA, BORDA)
                    me_p = random.choice(pessoas)
                    xp = xf + random.uniform(-1.5, 1.5)
                    vy = random.choice((1.2, -1.2))  # mesma ordem de sorteio de antes
                    por(me_p, (xp, y, 0.0), (0, vy, 0), math.pi / 2 if vy > 0 else -math.pi / 2)
    # ciclistas na ciclovia
    for _ in range(26):
        x = random.uniform(xmin, xmax)
        y = random.choice((0.5, -0.5))
        por(random.choice(pessoas), (x, y, 0.5), (4.5 * (1 if y < 0 else -1), 0, 0), 0 if y < 0 else math.pi)


def voce(M):
    """O 'você': pessoa de camiseta amarela no meio da pista. Vista de 180 m ela vira o ponto amarelo do Design
    System; para o ponto ler no celular, a figura está 6× maior que uma pessoa (3× na altura) e não projeta sombra."""
    me = malha_pessoa("voce", M, voce=True)
    o = bpy.data.objects.new("voce", me)
    o.location = VOCE
    o.scale = (6.0, 6.0, 3.0)
    o.visible_shadow = False
    bpy.context.scene.collection.objects.link(o)
    return o


# ------------------------------------------------------------------------------------------------ anos depois
def mato(M, tempo):
    e = tempo.evento("mato_cresce")
    a, b = e
    bm = bmesh.new()
    # Sofia, 21/11: as 6.500 moitas são copiadas de uma esfera-modelo vértice a vértice. Com bmesh.ops em malha
    # grande a montagem do P5 levava ~2,5 min; os sorteios são os mesmos de antes.
    modelo = bmesh.new()
    bmesh.ops.create_icosphere(modelo, subdivisions=1, radius=1.0)
    mv = [v.co.copy() for v in modelo.verts]
    mf = [[v.index for v in f.verts] for f in modelo.faces]
    modelo.free()
    for _ in range(6500):
        x = random.uniform(-100, 1300)
        y = random.choice([random.uniform(-CANTEIRO, CANTEIRO), random.uniform(-BORDA, BORDA),
                           random.choice((1, -1)) * random.uniform(BORDA, LOTE)])
        r = random.uniform(0.5, 1.7)
        vs = [bm.verts.new((x + p.x * r, y + p.y * r, 0.1 + p.z * r * 0.45)) for p in mv]
        for ids in mf:
            bm.faces.new([vs[i] for i in ids])
    o = c.objeto("mato", bm, [M["mato"]])
    c.chave(o, "scale", [(a, (1, 1, 0.01)), (b, (1, 1, 1))])
    o.location = (0, 0, 0.12)


def chuva(sc, M, tempo):
    a, _ = tempo.evento("chuva")
    cam_pos = CAM_POS
    bm = bmesh.new()
    frente = (CAM_ALVO - CAM_POS).normalized()
    for _ in range(9000):
        d = random.uniform(15, 140)
        lado = random.uniform(-0.45, 0.45) * d
        alt = random.uniform(-0.75, 0.75) * d
        direita = frente.cross(Vector((0, 0, 1))).normalized()
        cima = direita.cross(frente).normalized()
        p = cam_pos + frente * d + direita * lado + cima * alt
        c.caixa_rapida(bm, tuple(p), (0.025, 0.025, random.uniform(0.8, 1.6)), 0)  # rápida: 9.000 pingos
    o = c.objeto("chuva", bm, [M["chuva"]])
    o.visible_shadow = False
    # cai em ciclo de 10 quadros (os pingos se repetem a cada 25 m de queda)
    c.chave(o, "location", [(1, (0, 0, 12)), (11, (-1.0, 0, -13))], "LINEAR")
    for fc in c._fcurves(o.animation_data.action):
        fc.modifiers.new("CYCLES")
    c.aparecer(o, a)
