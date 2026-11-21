"""As cenas fora da Paulista: cidades apagando à noite (P2), o corte genérico do metrô (P3), o supermercado (P4) e
Pripyat (P6). Tudo inventado por código; nenhum lugar com nome além de Pripyat, que é o fato conferido."""
import math
import random

import bmesh
import bpy
from mathutils import Vector

import comum as c
import paulista as P


def _bsdf(mat):
    return next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")


def mat_emissao(nome, cor, forca):
    m = bpy.data.materials.new(nome)
    n = c.Nos(m)
    em = n.add("ShaderNodeEmission")
    em.inputs["Color"].default_value = c.rgba(cor)
    v = n.val(forca, "forca")
    n.link(v, em.inputs["Strength"])
    n.link(em.outputs[0], n.saida.inputs["Surface"])
    return m


# ================================================================================================ P2 · cidades à noite
def montar_cidades(sc, tempo, plano):
    random.seed(4)
    fundo = c.ceu_noite(sc, "#05080F", "#121B33", 1.0)
    sc.view_settings.exposure = 0.0
    P.grupo_neblina()
    neb = bpy.data.node_groups["Neblina"]
    neb.nodes["cor"].outputs[0].default_value = c.rgba("#0B1226")
    neb.nodes["dist"].outputs[0].default_value = 16000.0

    chao = bpy.data.materials.new("terra_noite")
    n = c.Nos(chao)
    r = n.ruido(n.geo()["Position"], 0.0006, 5, 0.6)[0]
    cor = n.mix_cor(r, c.rgba("#06080A"), c.rgba("#0E1210"))
    b = n.principled(None, 0.95)
    n.link(cor, b.inputs["Base Color"])
    P.finalizar(n, b.outputs[0])
    bm = bmesh.new()
    c.plano_chao(bm, -40000, -40000, 80000, 40000, 0.0, 0)
    c.objeto("terra", bm, [chao])

    # Cidades: manchas de luz com ruas em grade torta, sem nenhuma reconhecível.
    centros = [(2600, -2300, 2400), (5000, 2600, 3000), (7600, -900, 3800), (10200, 3800, 2800), (12800, -3600, 3300),
               (15600, 1200, 4200), (1400, 1900, 1400), (19000, -1800, 3600), (9400, -5200, 2000), (500, -1200, 900)]
    cidades = []
    for i, (cx, cy, raio) in enumerate(centros):
        bm = bmesh.new()
        ang = random.uniform(0, math.pi)
        dx, dy = math.cos(ang), math.sin(ang)
        n_pts = int(raio * 6)
        for _ in range(n_pts):
            # ao longo de ruas: escolhe uma rua da grade e um ponto nela
            if random.random() < 0.7:
                k = random.randint(-int(raio / 140), int(raio / 140)) * 140
                t = random.gauss(0, raio * 0.45)
                if random.random() < 0.5:
                    x, y = cx + dx * t - dy * k, cy + dy * t + dx * k
                else:
                    x, y = cx + dx * k - dy * t, cy + dy * k + dx * t
            else:
                x, y = cx + random.gauss(0, raio * 0.4), cy + random.gauss(0, raio * 0.4)
            if (x - cx) ** 2 + (y - cy) ** 2 > (raio * 1.3) ** 2:
                continue
            s = random.uniform(4.5, 8.5)
            c.plano_chao(bm, x - s / 2, y - s / 2, x + s / 2, y + s / 2, 1.0, 0 if random.random() < 0.8 else 1)
        m1 = mat_emissao(f"luz_sodio{i}", "#FFB868", 9.0)
        m2 = mat_emissao(f"luz_branca{i}", "#E6EEFF", 7.0)
        o = c.objeto(f"cidade{i}", bm, [m1, m2])
        cidades.append((o, (m1, m2), math.hypot(cx, cy)))
    # estradas ligando as cidades (fios de luz)
    bm = bmesh.new()
    for (a, b_) in ((0, 2), (2, 4), (1, 3), (3, 5), (2, 3), (6, 1), (4, 7), (8, 2), (5, 7), (9, 0), (9, 6)):
        ax, ay, _ = centros[a]
        bx, by, _ = centros[b_]
        for k in range(160):
            t = k / 160
            x = ax + (bx - ax) * t + math.sin(t * 9 + a) * 220
            y = ay + (by - ay) * t + math.cos(t * 7 + b_) * 220
            c.plano_chao(bm, x - 6, y - 6, x + 6, y + 6, 1.0, 0)
    estr = mat_emissao("estradas", "#FFB868", 3.5)
    c.objeto("estradas", bm, [estr])

    # Falhas em "parando" e apagão uma a uma em "apagam, uma por uma" (das mais longe para as mais perto).
    falha = tempo.evento("cidades_falham")
    apaga = tempo.evento("cidades_apagam")
    ordem = sorted(cidades, key=lambda x: -x[2])
    if apaga:
        a, b = apaga
        b = min(b + 10, tempo.quadros - 4)
        for k, (o, ms, _) in enumerate(ordem):
            q = a + round((b - a) * k / max(1, len(ordem) - 1))
            for m in ms:
                sock = m.node_tree.nodes["forca"].outputs[0]
                base = sock.default_value
                chaves = [(1, base)]
                if falha:
                    f0 = falha[0]
                    for j in range(3):
                        t0 = f0 + random.randint(0, max(1, a - f0 - 6))
                        chaves += [(t0, base), (t0 + 2, base * random.uniform(0.15, 0.4)), (t0 + 4, base)]
                chaves += [(q - 1, base), (q + 2, base * 0.15), (q + 3, 0.0)]
                chaves.sort(key=lambda kv: kv[0])
                vistos = {}
                for f, v in chaves:
                    vistos[f] = v
                c.animar_valor(sock, sorted(vistos.items()), "CONSTANT")
        es = estr.node_tree.nodes["forca"].outputs[0]
        c.animar_valor(es, [(1, 3.5), (a, 3.5), (b, 0.0)], "LINEAR")

    cam = c.camera_drone(sc, (-1800, 0, 3400), (7600, 200, 0), lente=28)
    c.mirar(cam, (-1800, 0, 3400), (7600, 200, 0), quadro=1)
    c.mirar(cam, (-1000, 0, 3300), (8400, 200, 0), quadro=tempo.quadros)
    c.linear(cam)
    return {"camera": cam, "voce": None}


def mat_solo(nome, cor, freatico=None):
    """Terra do corte: duas cores puxadas da base, manchas e pedrinhas. Abaixo de freatico (z), terra encharcada."""
    m = bpy.data.materials.new(nome)
    n = c.Nos(m)
    pos = n.geo()["Position"]
    r = n.ruido(pos, 0.35, 6, 0.65)[0]
    base = c.lin(cor)
    claro = tuple(min(1.0, v * 1.35) for v in base)
    escuro = tuple(v * 0.6 for v in base)
    cor_n = n.mix_cor(r, (*escuro, 1), (*claro, 1))
    # Sofia, 21/11: camadas de sedimento (faixas horizontais onduladas), pedras com relevo e a terra molhada abaixo
    # do lençol num marrom escuro (antes um azul chapado que ocupava meio quadro).
    estrato = n.add("ShaderNodeTexWave", wave_type="BANDS", bands_direction="Z")
    estrato.inputs["Scale"].default_value = 0.9
    estrato.inputs["Distortion"].default_value = 2.0
    estrato.inputs["Detail"].default_value = 3.0
    n.link(pos, estrato.inputs["Vector"])
    cor_n = n.mix_cor(n.math("MULTIPLY", estrato.outputs["Fac"], 0.55), cor_n, (*tuple(v * 0.55 for v in base), 1))
    manchas = n.math("GREATER_THAN", n.ruido(pos, 0.5, 4, 0.6)[0], 0.58)
    cor_n = n.mix_cor(n.math("MULTIPLY", manchas, 0.4), cor_n, (*tuple(v * 0.5 for v in base), 1))
    vor = n.add("ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = 1.6
    n.link(pos, vor.inputs["Vector"])
    pedra = n.math("LESS_THAN", vor.outputs["Distance"], 0.1)
    cor_n = n.mix_cor(n.math("MULTIPLY", pedra, 0.7), cor_n, c.rgba("#9C9282"))
    rough = 0.95
    if freatico is not None:
        z = n.sep(pos)[2]
        onda = n.math("MULTIPLY", n.ruido(pos, 0.25, 3, 0.5)[0], 0.8)
        molhado = n.math("LESS_THAN", n.math("ADD", z, onda), freatico + 0.4)
        cor_n = n.mix_cor(n.math("MULTIPLY", molhado, 0.7), cor_n, c.rgba("#2B2119"))
        rough = n.mix_float(molhado, 0.95, 0.75)
    b = n.principled(None, rough)
    n.link(cor_n, b.inputs["Base Color"])
    rel = n.add("ShaderNodeBump")
    rel.inputs["Strength"].default_value = 0.8
    rel.inputs["Distance"].default_value = 0.12
    n.link(n.math("ADD", n.math("MULTIPLY", pedra, 0.6), n.ruido(pos, 2.5, 4, 0.6)[0]), rel.inputs["Height"])
    n.link(rel.outputs[0], b.inputs["Normal"])
    P.finalizar(n, b.outputs[0])
    return m


# ================================================================================================ P3 · corte do metrô
def montar_metro(sc, tempo, plano):
    random.seed(5)
    M = P.materiais()
    ceu, sol, fundo = c.ceu_e_sol(sc, elevacao=40.0, azimute=135.0, forca_ceu=0.8, forca_sol=2.6, sat_ceu=1.1)
    sc.view_settings.exposure = -0.6
    neb = bpy.data.node_groups["Neblina"]
    neb.nodes["dist"].outputs[0].default_value = 2500.0

    terra = [("asfalto_corte", "#2E2F31", 0.0, -0.35), ("base", "#7A7468", -0.35, -1.4), ("solo1", "#8A5A3A", -1.4, -3.7)]
    L = 70.0
    corte = bpy.data.collections.new("corte_da_terra")  # recebe a luz de preenchimento (light linking)
    sc.collection.children.link(corte)
    for nome, cor, z0, z1 in terra:
        bm = bmesh.new()
        c.caixa(bm, (0, 25, (z0 + z1) / 2), (L, 50, z0 - z1))
        c.objeto(nome, bm, [mat_solo(nome, cor)], corte)
    # rua de cima: calçada, meio-fio, postes e fachadas baixas sem nome
    bm = bmesh.new()
    c.caixa(bm, (0, 3.0, 0.09), (L, 6.0, 0.18), 0)
    c.caixa(bm, (0, 24.0, 0.09), (L, 6.0, 0.18), 0)
    for x in range(-30, 31, 4):
        c.caixa(bm, (x, 13.5, 0.01), (2.0, 0.15, 0.02), 1)
    c.objeto("rua", bm, [M["calcada"], M["faixa"]])
    bm = bmesh.new()
    rnds, topos, caixas = [], [], []
    x = -L / 2
    while x < L / 2:
        w = random.uniform(8, 16)
        h = random.uniform(9, 24)
        r = c.caixa(bm, (x + w / 2, 33, h / 2), (w - 0.6, 12, h))
        k = len({f for v in r["verts"] for f in v.link_faces})
        rr = random.random()
        rnds += [rr] * k
        topos += [h] * k
        caixas.append((x + w / 2, 33, w - 0.6, 12, h, rr, "fila"))
        x += w
    o = c.objeto("fachadas", bm, [M["fachada"]])
    P.atributos_predio(o.data, rnds, [0.0] * len(rnds), topos)
    P.telhados(M, caixas, semente=53)
    for x in (-20, 0, 20):
        bm = bmesh.new()
        c.cilindro(bm, (x, 1.0, 4.5), 0.12, 9, 8)
        c.objeto("poste", bm, [M["metal"]])
    # canos cortados no meio da terra (água, esgoto, cabos), vistos como círculos no corte
    from mathutils import Matrix
    for (xc, zc, rc, cor) in ((-11, -2.2, 0.45, "#3C6E91"), (-7.5, -2.6, 0.6, "#6E6E6A"), (2.0, -1.9, 0.3, "#2B2B2B"),
                             (6.5, -2.5, 0.7, "#7A776F"), (-2.0, -3.0, 0.3, "#3C6E91")):
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=rc, radius2=rc, depth=30,
                              matrix=Matrix.Translation((xc, 14.97, zc)) @ Matrix.Rotation(math.pi / 2, 4, "X"))
        c.objeto("cano", bm, [P.mat_simples("cano" + cor, cor, 0.6, 0.3)], corte)

    # túnel: laje de cima, piso, parede do fundo; o corte em y = 0 mostra o interior
    concreto = P.mat_simples("concreto", "#8E8B85", 0.8)
    azulejo = bpy.data.materials.new("azulejo")
    n = c.Nos(azulejo)
    tij = n.add("ShaderNodeTexBrick")
    tij.inputs["Scale"].default_value = 3.0
    tij.inputs["Color1"].default_value = c.rgba("#D9D6CF")
    tij.inputs["Color2"].default_value = c.rgba("#CFCBC2")
    tij.inputs["Mortar"].default_value = c.rgba("#8F8B83")
    tij.inputs["Mortar Size"].default_value = 0.015
    pos_t = n.geo()["Position"]
    n.link(pos_t, tij.inputs["Vector"])
    # faixa de cor na altura dos olhos e encardido que sobe do chão e escorre do teto
    zt = n.sep(pos_t)[2]
    faixa_t = n.math("MULTIPLY", n.math("GREATER_THAN", zt, -10.0), n.math("LESS_THAN", zt, -9.4))
    cor_t = n.mix_cor(faixa_t, tij.outputs["Color"], c.rgba("#2D5F8C"))
    encardido = n.math("ADD", n.math("MULTIPLY", n.math("SUBTRACT", -9.5, zt, clamp=True), 0.35),
                       n.math("MULTIPLY", n.ruido(pos_t, 0.6, 5, 0.6)[0], 0.35))
    cor_t = n.mix_cor(n.math("MINIMUM", encardido, 0.75), cor_t, c.rgba("#5A5246"))
    b = n.principled(None, 0.25)
    n.link(cor_t, b.inputs["Base Color"])
    P.finalizar(n, b.outputs[0])
    z_piso, z_teto = -12.0, -4.5
    # Sofia, 21/11: o túnel e o poço eram cavados com Boolean em malhas de caixas sobrepostas, e o Boolean exato
    # destruía a geometria (sumiam a parede de azulejo, o piso, o lastro e os dormentes; o fundo do vão aparecia
    # como uma parede salmão). Agora tudo é montado em blocos que já deixam o vão e o poço abertos.
    xb, yb = -9.0, 1.3                                  # poço da bomba: x -10.5 a -7.5, y -0.6 a 3.2
    px0, px1, py1, z_poco = xb - 1.5, xb + 1.5, yb + 1.9, z_piso - 2.0

    def bloco(bm_, x0, x1, y0, y1, z0, z1, mat=0):
        c.caixa(bm_, ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), (x1 - x0, y1 - y0, z1 - z0), mat)

    bm = bmesh.new()
    zc = z_piso - 0.8                                   # base do piso do túnel
    bloco(bm, -L / 2, L / 2, 0, 50, -40.0, z_poco - 0.2)                     # abaixo do poço
    bloco(bm, -L / 2, px0, 0, 50, z_poco - 0.2, zc)                          # em volta do poço
    bloco(bm, px1, L / 2, 0, 50, z_poco - 0.2, zc)
    bloco(bm, px0, px1, py1, 50, z_poco - 0.2, zc)
    bloco(bm, -L / 2, L / 2, 13.5, 50, zc, -3.7)                              # atrás da parede do túnel
    c.objeto("solo_baixo", bm, [mat_solo("solo_b", "#6B4430", freatico=-13.0)], corte)
    # Luz de preenchimento quente no corte, ligada só à terra (light linking): o corte de terra ficava na sombra,
    # pegando só o azul do céu, e virava uma parede azul chapada. O túnel não recebe essa luz, então o "apagou"
    # das luminárias continua forte.
    pre = bpy.data.lights.new("LGT_preenchimento_corte", "AREA")
    pre.energy, pre.size, pre.color = 90000.0, 30.0, c.lin("#FFE4C4")
    po = bpy.data.objects.new("LGT_preenchimento_corte", pre)
    sc.collection.objects.link(po)
    c.mirar(po, (-60.0, -22.0, 18.0), (-4.0, 0.0, -14.0))  # de lado e de cima: raspa o corte e mostra o relevo
    try:
        po.light_linking.receiver_collection = corte
    except AttributeError:
        pass
    bm = bmesh.new()
    bloco(bm, -L / 2, L / 2, -0.06, 13.5, z_teto, -3.7, 0)                    # laje
    bloco(bm, -L / 2, px0, -0.06, 13.0, zc, z_piso, 0)                        # piso, aberto no poço
    bloco(bm, px1, L / 2, -0.06, 13.0, zc, z_piso, 0)
    bloco(bm, px0, px1, py1, 13.0, zc, z_piso, 0)
    bloco(bm, -L / 2, L / 2, 12.9, 13.5, zc, z_teto, 1)                       # parede de azulejo
    bloco(bm, -L / 2, L / 2, 7.9, 12.9, z_piso, z_piso + 1.1, 0)              # plataforma
    bloco(bm, -L / 2, L / 2, 7.78, 8.18, z_piso + 1.1, z_piso + 1.11, 2)      # faixa amarela da borda
    c.objeto("tunel", bm, [concreto, azulejo, P.mat_simples("amarelo_borda", "#E2B21C", 0.6)])
    # via: lastro (aberto no poço), dormentes, trilhos (passam por cima do poço)
    bm = bmesh.new()
    bloco(bm, -L / 2, px0, 0.0, 7.9, z_piso, z_piso + 0.3, 0)
    bloco(bm, px1, L / 2, 0.0, 7.9, z_piso, z_piso + 0.3, 0)
    bloco(bm, px0, px1, py1, 7.9, z_piso, z_piso + 0.3, 0)
    x = -L / 2
    while x < L / 2:
        if not (px0 - 0.2 < x < px1 + 0.2):
            c.caixa(bm, (x, 4.2, z_piso + 0.36), (0.25, 2.6, 0.14), 1)
        x += 0.65
    for y in (3.5, 4.9):
        c.caixa(bm, (0, y, z_piso + 0.52), (L, 0.08, 0.16), 2)
    c.objeto("via", bm, [P.mat_simples("lastro", "#6A6862", 0.95), P.mat_simples("dormente", "#4B4540", 0.9), M["metal"]])
    # luminárias do túnel
    luz_tunel = mat_emissao("luminaria", "#EAF3FF", 6.0)
    bm = bmesh.new()
    for x in range(-30, 31, 6):
        c.caixa(bm, (x, 6.5, z_teto - 0.1), (2.4, 0.3, 0.08))
    c.objeto("luminarias", bm, [luz_tunel])
    luz_l = bpy.data.lights.new("luz_tunel", "AREA")
    luz_l.energy = 26000.0
    luz_l.size, luz_l.size_y = 60.0, 6.0
    luz_l.shape = "RECTANGLE"
    luz_l.color = c.lin("#EAF3FF")
    lo = bpy.data.objects.new("luz_tunel", luz_l)
    lo.location = (0, 6.5, z_teto - 0.3)
    sc.collection.objects.link(lo)
    # poço com a bomba e o cano que sobe até a rua
    bm = bmesh.new()
    bloco(bm, px0, px1, 0.0, py1, z_poco - 0.2, z_poco, 0)                   # fundo do poço
    c.objeto("poco", bm, [concreto])
    bm = bmesh.new()
    c.cilindro(bm, (xb, yb + 0.4, z_piso - 1.3), 0.55, 1.4, 16, 0)
    c.cilindro(bm, (xb, yb + 0.4, (z_piso - 0.6 + z_teto) / 2), 0.14, z_teto - z_piso + 0.6, 10, 0)
    bomba = c.objeto("bomba", bm, [P.mat_simples("bomba", "#2F6B8A", 0.5, 0.4)])
    bm = bmesh.new()
    c.esfera(bm, (xb + 0.3, yb - 0.2, z_piso - 0.75), 0.1, 0, 2)
    led_m = mat_emissao("led", "#38E06B", 30.0)
    led = c.objeto("led", bm, [led_m])
    foco = bpy.data.lights.new("foco_bomba", "SPOT")
    foco.energy, foco.spot_size, foco.spot_blend = 0.0, math.radians(30), 0.6
    fo = bpy.data.objects.new("foco_bomba", foco)
    fo.location = (xb, -6, z_piso + 6)
    c.mirar(fo, fo.location, (xb, yb, z_piso - 1.0))
    sc.collection.objects.link(fo)
    # água: sobe no poço e depois cobre só os trilhos (abaixo da plataforma)
    agua_m = bpy.data.materials.new("agua")
    n = c.Nos(agua_m)
    b = n.principled(c.rgba("#3A7E88"), 0.02)
    b.inputs["Alpha"].default_value = 0.82
    P.finalizar(n, b.outputs[0])
    bm = bmesh.new()
    c.caixa(bm, (0, 3.95, 0), (L, 7.9, 0.02))
    agua = c.objeto("agua", bm, [agua_m])

    e = tempo.evento("bomba_destaque")
    if e:
        c.chave(foco, "energy", [(e[0] - 1, 0.0), (e[0] + 6, 6000.0)])
    e = tempo.evento("bomba_desliga")
    if e:
        a = e[0]
        c.chave(foco, "energy", [(a, 6000.0), (a + 8, 0.0)])
        c.animar_valor(led_m.node_tree.nodes["forca"].outputs[0], [(a, 30.0), (a + 1, 0.0)], "CONSTANT")
        c.animar_valor(luz_tunel.node_tree.nodes["forca"].outputs[0], [(a + 6, 6.0), (a + 7, 0.6)], "CONSTANT")
        c.chave(luz_l, "energy", [(a + 6, 26000.0), (a + 7, 3000.0)], "CONSTANT")
    e = tempo.evento("agua_sobe")
    if e:
        a, b = e
        c.chave(agua, "location", [(1, (0, 0, z_piso - 1.7)), (a, (0, 0, z_piso - 1.7)), (b, (0, 0, z_piso + 0.72)),
                                   (tempo.quadros, (0, 0, z_piso + 0.78))], "LINEAR")
    else:
        agua.location = (0, 0, z_piso - 1.7)

    cam = c.camera_drone(sc, (-4.0, -24.0, -7.5), (-4.0, 10.0, -11.0), lente=28)
    c.mirar(cam, (-4.0, -24.0, -7.5), (-4.0, 10.0, -11.0), quadro=1)
    c.mirar(cam, (-4.3, -22.0, -7.4), (-4.3, 10.0, -11.0), quadro=tempo.quadros)
    c.linear(cam)
    return {"camera": cam, "voce": None}


# ================================================================================================ P4 · supermercado
def montar_mercado(sc, tempo, plano):
    random.seed(6)
    M = P.materiais()
    c.ceu_e_sol(sc, elevacao=30.0, azimute=60.0, forca_ceu=0.6, forca_sol=2.0)
    sc.view_settings.exposure = 0.4
    neb = bpy.data.node_groups["Neblina"]
    neb.nodes["dist"].outputs[0].default_value = 400.0
    neb.nodes["cor"].outputs[0].default_value = c.rgba("#1A2030")

    X0, X1, Y0, Y1, H = -4.0, 46.0, -14.0, 14.0, 6.2
    # Sofia, 21/11: piso de porcelanato em placas de 60 cm, com brilho que pega a luz da vitrine, desgaste no
    # corredor e cada placa num tom; parede com rodapé e faixa; forro em placas.
    piso = bpy.data.materials.new("piso_mercado")
    n = c.Nos(piso)
    pos = n.geo()["Position"]
    placa = n.add("ShaderNodeTexBrick")
    placa.offset = 0.0
    placa.inputs["Scale"].default_value = 1.0
    placa.inputs["Brick Width"].default_value = 0.6
    placa.inputs["Row Height"].default_value = 0.6
    placa.inputs["Mortar Size"].default_value = 0.004
    placa.inputs["Color1"].default_value = c.rgba("#B4AFA5")
    placa.inputs["Color2"].default_value = c.rgba("#A39E94")
    placa.inputs["Mortar"].default_value = c.rgba("#5E5A54")
    n.link(pos, placa.inputs["Vector"])
    uso = n.ruido(pos, 0.25, 4, 0.6)[0]
    cor = n.mix_cor(n.math("MULTIPLY", uso, 0.35), placa.outputs["Color"], c.rgba("#77726A"))
    rough = n.mix_float(uso, 0.08, 0.35)
    b = n.principled(None, rough)
    n.link(cor, b.inputs["Base Color"])
    P.finalizar(n, b.outputs[0])
    parede = bpy.data.materials.new("parede_mercado")
    n = c.Nos(parede)
    z = n.sep(n.geo()["Position"])[2]
    cor = n.mix_cor(n.math("LESS_THAN", z, 0.25), c.rgba("#C9C6BE"), c.rgba("#3A3C3E"))
    faixa = n.math("MULTIPLY", n.math("GREATER_THAN", z, 3.1), n.math("LESS_THAN", z, 3.6))
    cor = n.mix_cor(faixa, cor, c.rgba("#2F6E4E"))
    cor = n.mix_cor(n.math("MULTIPLY", n.ruido(n.geo()["Position"], 0.4, 4, 0.6)[0], 0.25), cor, c.rgba("#8E8A82"))
    b = n.principled(None, 0.75)
    n.link(cor, b.inputs["Base Color"])
    P.finalizar(n, b.outputs[0])
    teto = bpy.data.materials.new("teto_mercado")
    n = c.Nos(teto)
    forro = n.add("ShaderNodeTexBrick")
    forro.offset = 0.0
    forro.inputs["Scale"].default_value = 1.0
    forro.inputs["Brick Width"].default_value = 1.25
    forro.inputs["Row Height"].default_value = 0.625
    forro.inputs["Mortar Size"].default_value = 0.02
    forro.inputs["Color1"].default_value = c.rgba("#8E8D89")
    forro.inputs["Color2"].default_value = c.rgba("#85847F")
    forro.inputs["Mortar"].default_value = c.rgba("#3C3C3A")
    n.link(n.geo()["Position"], forro.inputs["Vector"])
    b = n.principled(None, 0.9)
    n.link(forro.outputs["Color"], b.inputs["Base Color"])
    P.finalizar(n, b.outputs[0])
    bm = bmesh.new()
    c.plano_chao(bm, X0, Y0, X1, Y1, 0.0, 0)
    c.caixa(bm, ((X0 + X1) / 2, Y0 - 0.2, H / 2), (X1 - X0, 0.4, H), 1)
    c.caixa(bm, (X1 + 0.2, 0, H / 2), (0.4, Y1 - Y0, H), 1)
    c.caixa(bm, ((X0 + X1) / 2, 0, H + 0.2), (X1 - X0 + 2, Y1 - Y0 + 2, 0.4), 2)
    # parede de vidro (vitrine) do lado +y: a única luz natural
    c.caixa(bm, ((X0 + X1) / 2, Y1 + 0.2, 0.4), (X1 - X0, 0.4, 0.8), 1)
    c.caixa(bm, ((X0 + X1) / 2, Y1 + 0.2, H - 0.3), (X1 - X0, 0.4, 0.6), 1)
    c.objeto("loja", bm, [piso, parede, teto])
    bm = bmesh.new()
    for xx in range(0, 46, 4):
        c.caixa(bm, (xx, 0, H - 0.25), (0.3, Y1 - Y0, 0.5))
    for yy in (-10.0, -5.5, 0.0, 5.5, 10.0):
        for xx in range(2, 44, 6):
            c.caixa(bm, (xx, yy, H - 0.6), (3.6, 0.4, 0.08))
    c.objeto("teto_vigas", bm, [P.mat_simples("luminaria_apagada", "#B8B8B4", 0.4)])
    luz_vitrine = bpy.data.lights.new("vitrine", "AREA")
    luz_vitrine.energy, luz_vitrine.size, luz_vitrine.size_y = 2600.0, 50.0, 4.0
    luz_vitrine.shape = "RECTANGLE"
    luz_vitrine.color = c.lin("#9CC3EE")
    lv = bpy.data.objects.new("vitrine", luz_vitrine)
    lv.location = ((X0 + X1) / 2, Y1 + 1.0, H / 2)
    lv.rotation_euler = (math.radians(90), 0, 0)
    sc.collection.objects.link(lv)

    # gôndolas ao longo de x, cheias de produtos
    produtos = P.mat_paleta("produto", ["#C8372D", "#E6B422", "#2B6CB0", "#F2F0EA", "#3C8D4F", "#D9792B", "#7A3E8C",
                                        "#1E2A44", "#B9B2A6", "#E24E6B"], 0.5)
    metal = P.mat_simples("gondola", "#D8D8D4", 0.5, 0.2)
    testeira = P.mat_simples("testeira", "#8E3A30", 0.6)
    # placas de corredor penduradas (sem texto), uma cor por corredor
    for k, (py, cor) in enumerate(((-7.75, "#2B5FA8"), (0.0, "#8C3A30"), (7.75, "#2F8A55"))):
        bm = bmesh.new()
        for px in (12.0, 30.0):
            c.caixa(bm, (px, py, H - 1.25), (0.06, 2.4, 0.7))
            c.caixa(bm, (px, py - 0.9, H - 0.6), (0.02, 0.02, 0.7))
            c.caixa(bm, (px, py + 0.9, H - 0.6), (0.02, 0.02, 0.7))
        c.objeto(f"placa{k}", bm, [P.mat_simples(f"placa{k}", cor, 0.5)])
    for gy in (-10.0, -5.5, 5.5, 10.0):
        bm = bmesh.new()
        # Sofia, 21/11: as gôndolas vão até x 40 (antes 36): o fundo da loja não fica um piso vazio até a geladeira.
        c.caixa(bm, (22, gy, 1.0), (36, 1.2, 2.0), 0)
        for k in range(5):
            c.caixa(bm, (22, gy, 0.15 + k * 0.42), (36, 1.4, 0.03), 0)
        c.caixa(bm, (22, gy, 2.35), (36, 0.12, 0.5), 1)  # testeira com a faixa de preço
        g = c.objeto("gondola", bm, [metal, testeira])
        for k in range(5):
            x = 4.4
            while x < 39.6:
                larg = random.uniform(0.18, 0.45)
                alt = random.uniform(0.18, 0.36)
                for lado in (-1, 1):
                    bm = bmesh.new()
                    c.caixa(bm, (0, 0, alt / 2), (larg, 0.5, alt))
                    me = bm
                    o = c.objeto("produto", me, [produtos])
                    o.location = (x, gy + lado * 0.42, 0.17 + k * 0.42)
                x += larg + 0.02
    # geladeiras de porta de vidro no fundo (x = X1)
    vidro_gel = bpy.data.materials.new("vidro_geladeira")
    n = c.Nos(vidro_gel)
    gl = n.add("ShaderNodeBsdfGlass")
    gl.inputs["Roughness"].default_value = 0.03
    n.link(gl.outputs[0], n.saida.inputs["Surface"])
    luz_gel = mat_emissao("luz_geladeira", "#EAF3FF", 9.0)
    bm = bmesh.new()
    c.caixa(bm, (X1 - 0.9, 0, 1.15), (1.6, 20, 2.3), 0)
    c.objeto("geladeiras", bm, [metal])
    bm = bmesh.new()
    for k in range(4):
        c.caixa(bm, (X1 - 1.75, 0, 0.35 + k * 0.5), (0.05, 19.0, 0.04))
    c.caixa(bm, (X1 - 1.69, 0, 2.15), (0.03, 19.0, 0.06))
    c.objeto("luz_gel", bm, [luz_gel])
    bm = bmesh.new()
    for k in range(9):
        c.caixa(bm, (X1 - 1.8, -9.5 + 2.1 * k + 1.05, 1.15), (0.04, 2.0, 2.1))
    c.objeto("portas", bm, [vidro_gel])
    luz_g = bpy.data.lights.new("geladeira", "AREA")
    luz_g.energy, luz_g.size, luz_g.size_y, luz_g.shape = 1500.0, 19.0, 2.0, "RECTANGLE"
    luz_g.color = c.lin("#EAF3FF")
    lg = bpy.data.objects.new("geladeira", luz_g)
    lg.location = (X1 - 2.2, 0, 1.2)
    lg.rotation_euler = (0, math.radians(-90), 0)
    sc.collection.objects.link(lg)
    for k in range(4):  # produtos nas prateleiras da geladeira
        x = -9.3
        while x < 9.3:
            bm = bmesh.new()
            c.cilindro(bm, (X1 - 1.2, x, 0.5 + k * 0.5), 0.07, 0.26, 8)
            c.objeto("bebida", bm, [produtos])
            x += 0.18
    # frutas e verduras em bancas perto da câmera
    frutas = bpy.data.materials.new("frutas")
    n = c.Nos(frutas)
    info = n.add("ShaderNodeObjectInfo")
    rampa = n.add("ShaderNodeValToRGB")
    rampa.color_ramp.interpolation = "CONSTANT"
    cores = ["#E3731C", "#C21F2A", "#6FA33A", "#E8C531", "#3F7D2E", "#D24A1E"]
    els = rampa.color_ramp.elements
    while len(els) < len(cores):
        els.new(0.5)
    for i, cor in enumerate(cores):
        els[i].position, els[i].color = i / len(cores), c.rgba(cor)
    n.link(info.outputs["Random"], rampa.inputs[0])
    murcho = n.val(0.0, "murcho")
    cor = n.mix_cor(murcho, rampa.outputs[0], c.rgba("#4A3A22"))
    bsdf = n.principled(None, 0.45)
    n.link(cor, bsdf.inputs["Base Color"])
    n.link(n.mix_float(murcho, 0.45, 0.9), bsdf.inputs["Roughness"])
    P.finalizar(n, bsdf.outputs[0])
    banca = P.mat_simples("banca", "#6B4A2E", 0.8)
    for (bx, by) in ((21.0, -2.6), (21.0, 2.6), (26.0, -2.6), (26.0, 2.6)):
        bm = bmesh.new()
        c.caixa(bm, (bx, by, 0.45), (3.6, 1.6, 0.9))
        c.objeto("banca", bm, [banca])
        tipo = random.random()
        for _ in range(170):
            bm = bmesh.new()
            r = random.uniform(0.04, 0.07)
            c.esfera(bm, (0, 0, 0), r, 0, 2)
            o = c.objeto("fruta", bm, [frutas])
            o.location = (bx + random.uniform(-1.7, 1.7), by + random.uniform(-0.7, 0.7), 0.95 + random.uniform(0, 0.12))
            # mesma fruta por banca
            o.pass_index = 0
    e = tempo.evento("frescos_murcham")
    if e:
        c.animar_valor(frutas.node_tree.nodes["murcho"].outputs[0],
                       [(e[0], 0.0), (e[1], 0.75)], "LINEAR")
    e = tempo.evento("geladeira_apaga")
    if e:
        a = e[0]
        c.animar_valor(luz_gel.node_tree.nodes["forca"].outputs[0], [(a, 9.0), (a + 1, 0.0)], "CONSTANT")
        c.chave(luz_g, "energy", [(a, 1500.0), (a + 1, 0.0)], "CONSTANT")
    # o "você" com um carrinho, no corredor central
    # Sofia, 21/11: o "você" de perto, com as mãos no puxador do carrinho; o carrinho ganhou puxador, pés e rodas.
    # Ele foi para o fundo, perto da geladeira e à direita do corredor (antes x 33, y 0,3): na tela, os pés ficam
    # acima de y 1050 o plano inteiro, fora da faixa do fato (y 1085 a 1180) e da legenda (projeção conferida).
    vx, vy = 40.5, -2.4
    voce = bpy.data.objects.new("voce", P.malha_pessoa("voce_m", M, voce=True, perto=True, pose="empurra"))
    voce.location = (vx, vy, 0.0)
    voce.rotation_euler = (0, 0, math.radians(0))
    sc.collection.objects.link(voce)
    bm = bmesh.new()
    cx_, cy_ = vx + 1.1, vy
    c.afunilar(c.caixa(bm, (cx_, cy_, 0.75), (0.9, 0.55, 0.5)), 1.1, 1.08)
    c.caixa(bm, (cx_, cy_, 0.28), (0.85, 0.5, 0.03))
    c.cone_entre(bm, (vx + 0.53, cy_ - 0.3, 1.03), (vx + 0.53, cy_ + 0.3, 1.03), 0.018, 0.018, 8, 1)
    for yy in (cy_ - 0.24, cy_ + 0.24):
        c.cone_entre(bm, (vx + 0.53, yy, 1.03), (vx + 0.68, yy, 0.95), 0.012, 0.012, 6)
        for xx in (vx + 0.72, vx + 1.5):
            c.cone_entre(bm, (xx, yy, 0.5), (xx, yy, 0.08), 0.012, 0.012, 6)
            c.cilindro(bm, (xx, yy, 0.05), 0.05, 0.03, 10, 2)
    c.objeto("carrinho", bm, [metal, P.mat_simples("puxador", "#B8261E", 0.5), P.mat_simples("roda", "#1A1A1A", 0.7)])

    cam = c.camera_drone(sc, (25.0, -1.2, 3.4), (46.0, 0.3, 0.2), lente=24)
    c.mirar(cam, (25.0, -1.2, 3.4), (46.0, 0.3, 0.2), quadro=1)
    c.mirar(cam, (13.0, -1.6, 4.2), (46.0, 0.3, 0.0), quadro=tempo.quadros)
    c.linear(cam)
    return {"camera": cam, "voce": None}


# ================================================================================================ P6 · Pripyat
def montar_pripyat(sc, tempo, plano):
    random.seed(8)
    M = P.materiais()
    ceu, sol, fundo = c.ceu_e_sol(sc, elevacao=28.0, azimute=140.0, forca_ceu=0.75, forca_sol=2.4)
    sc.view_settings.exposure = -0.7
    neb = bpy.data.node_groups["Neblina"]
    neb.nodes["dist"].outputs[0].default_value = 2200.0
    neb.nodes["cor"].outputs[0].default_value = c.rgba("#B9C4CC")
    P.valor(M["fachada"], "quebradas").default_value = 0.85
    P.valor(M["fachada"], "manchas").default_value = 0.9
    P.valor(M["fachada"], "janelas_acesas").default_value = 0.0
    P.valor(M["fachada"], "sujo").default_value = 1.0

    # Sofia, 21/11: capim em três escalas (manchas grandes de mato alto, capim seco mais claro, terra aparecendo),
    # com relevo, em vez de um bege liso.
    capim = bpy.data.materials.new("capim")
    n = c.Nos(capim)
    pos = n.geo()["Position"]
    r = n.ruido(pos, 0.04, 6, 0.6)[0]
    cor = n.mix_cor(r, c.rgba("#1E2A14"), c.rgba("#3F4426"))
    seco = n.math("GREATER_THAN", n.ruido(pos, 0.012, 3, 0.5)[0], 0.56)
    cor = n.mix_cor(n.math("MULTIPLY", seco, 0.6), cor, c.rgba("#6B6438"))
    terra = n.math("GREATER_THAN", n.ruido(pos, 0.07, 4, 0.6)[0], 0.64)
    cor = n.mix_cor(n.math("MULTIPLY", terra, 0.7), cor, c.rgba("#4A3E2E"))
    alto = n.math("GREATER_THAN", n.ruido(pos, 0.02, 2, 0.5)[0], 0.5)
    cor = n.mix_cor(n.math("MULTIPLY", alto, 0.5), cor, c.rgba("#18230F"))
    b = n.principled(None, 0.95)
    n.link(cor, b.inputs["Base Color"])
    rel = n.add("ShaderNodeBump")
    rel.inputs["Strength"].default_value = 0.6
    rel.inputs["Distance"].default_value = 0.3
    n.link(n.ruido(pos, 0.9, 4, 0.7)[0], rel.inputs["Height"])
    n.link(rel.outputs[0], b.inputs["Normal"])
    P.finalizar(n, b.outputs[0])
    bm = bmesh.new()
    c.plano_chao(bm, -20000, -20000, 20000, 20000, 0.0, 0)  # até o horizonte (Sofia, 21/11)
    c.objeto("capim", bm, [capim])
    # ruas velhas, quase cobertas
    rua = bpy.data.materials.new("rua_velha")  # asfalto velho, com rachaduras tomadas de mato
    n = c.Nos(rua)
    pos = n.geo()["Position"]
    cor = n.mix_cor(n.ruido(pos, 0.3, 4, 0.6)[0], c.rgba("#3E3D39"), c.rgba("#5E5C55"))
    vor = n.add("ShaderNodeTexVoronoi", feature="DISTANCE_TO_EDGE")
    vor.inputs["Scale"].default_value = 0.25
    n.link(pos, vor.inputs["Vector"])
    trinca = n.math("LESS_THAN", vor.outputs["Distance"], 0.06)
    cor = n.mix_cor(trinca, cor, c.rgba("#2E3A1A"))
    mato_r = n.math("GREATER_THAN", n.ruido(pos, 0.05, 3, 0.5)[0], 0.6)
    cor = n.mix_cor(n.math("MULTIPLY", mato_r, 0.8), cor, c.rgba("#33401F"))
    b = n.principled(None, 0.95)
    n.link(cor, b.inputs["Base Color"])
    P.finalizar(n, b.outputs[0])
    bm = bmesh.new()
    for y in (-60, 70, 200):
        c.caixa(bm, (150, y, 0.05), (900, 9, 0.1))
    for x in (-40, 130, 300):
        c.caixa(bm, (x, 60, 0.05), (9, 700, 0.1))
    c.objeto("ruas", bm, [rua])

    # prédios de painel (lajes longas de 9 a 16 andares)
    bm = bmesh.new()
    rnds = []
    blocos = [(-80, -150, 90, 14, 48, 0), (60, -170, 70, 14, 30, 0), (210, -140, 100, 14, 45, 0), (-60, 150, 14, 80, 38, 0),
              (90, 260, 110, 14, 48, 0), (260, 230, 14, 90, 30, 0), (380, -40, 14, 120, 48, 0), (420, 160, 80, 14, 30, 0),
              (-180, 40, 14, 90, 45, 0), (520, 320, 90, 14, 38, 0), (640, -120, 14, 100, 45, 0), (-200, -260, 80, 14, 30, 0),
              (760, 140, 100, 14, 48, 0), (300, 420, 14, 80, 38, 0)]
    caixas = []
    for (x, y, w, d, h, _) in blocos:
        r = c.caixa(bm, (x, y, h / 2), (w, d, h))
        rr = random.uniform(0.12, 0.19)
        rnds += [rr] * 6
        caixas.append((x, y, w, d, h, rr, "fila"))
    o = c.objeto("blocos", bm, [M["fachada"]])
    P.atributos_predio(o.data, rnds, [0.0] * len(rnds), [h for (_, _, _, _, h, _) in blocos for _ in range(6)])
    P.telhados(M, caixas, semente=86, moderno=False)

    # roda-gigante amarela parada (desenho próprio: aro duplo, raios, cabines e cavalete em A)
    amarelo = P.mat_simples("roda", "#D9B21E", 0.6, 0.2)
    ferrugem = P.mat_simples("ferrugem", "#7A4A2A", 0.9)
    rx, ry, rz, R = 140.0, 40.0, 17.0, 13.0
    bm = bmesh.new()
    for lado in (-1.0, 1.0):
        for k in range(48):
            a0, a1 = 2 * math.pi * k / 48, 2 * math.pi * (k + 1) / 48
            p0 = Vector((rx + R * math.cos(a0), ry + lado * 1.2, rz + R * math.sin(a0)))
            p1 = Vector((rx + R * math.cos(a1), ry + lado * 1.2, rz + R * math.sin(a1)))
            P._barra(bm, p0, p1, 0.35, 0)
        for k in range(16):
            a = 2 * math.pi * k / 16
            P._barra(bm, Vector((rx, ry + lado * 1.2, rz)), Vector((rx + R * math.cos(a), ry + lado * 1.2, rz + R * math.sin(a))), 0.18, 0)
        P._barra(bm, Vector((rx - 7, ry + lado * 2.4, 0)), Vector((rx, ry + lado * 1.4, rz)), 0.6, 1)
        P._barra(bm, Vector((rx + 7, ry + lado * 2.4, 0)), Vector((rx, ry + lado * 1.4, rz)), 0.6, 1)
    P._barra(bm, Vector((rx, ry - 2.5, rz)), Vector((rx, ry + 2.5, rz)), 0.8, 1)
    for k in range(16):
        a = 2 * math.pi * k / 16 + 0.1
        cx, cz = rx + R * math.cos(a), rz + R * math.sin(a) - 1.6
        c.caixa(bm, (cx, ry, cz), (1.8, 2.0, 1.6), 0)
        c.caixa(bm, (cx, ry, cz + 1.0), (2.0, 2.2, 0.15), 0)
    c.objeto("roda_gigante", bm, [amarelo, ferrugem])

    # árvores por toda parte, mais altas que no começo
    # Sofia, 21/11: dois dos seis desenhos são choupos (copa alta e estreita), comuns na cidade.
    malhas = [P.malha_arvore(f"arv_p{i}", M, random.uniform(15, 24), random.uniform(5.5, 8.5),
                             "choupo" if i in (1, 4) else "copa") for i in range(6)]
    n_arv = 0
    for _ in range(9000):
        x, y = random.uniform(-500, 1100), random.uniform(-520, 700)
        if any(abs(x - bx) < w / 2 + 2 and abs(y - by) < d / 2 + 2 for (bx, by, w, d, _, _) in blocos):
            continue
        if abs(x - rx) < 16 and abs(y - ry) < 6:
            continue
        o = bpy.data.objects.new("arvore", random.choice(malhas))
        o.location = (x, y, 0)
        esc = random.uniform(0.8, 1.35)
        o.scale = (esc, esc, esc * random.uniform(0.9, 1.2))
        o.rotation_euler = (0, 0, random.uniform(0, 6.28))
        sc.collection.objects.link(o)
        n_arv += 1

    # câmera: um movimento só, avançando por cima da roda e subindo até as copas cobrirem a cidade
    p0, a0 = Vector((20.0, -90.0, 55.0)), Vector((140.0, 40.0, 8.0))
    p1, a1 = Vector((150.0, -60.0, 140.0)), Vector((420.0, 180.0, 0.0))
    cam = c.camera_drone(sc, p0, a0, lente=28)
    c.mirar(cam, p0, a0, quadro=1)
    c.mirar(cam, p1, a1, quadro=tempo.quadros)
    c.linear(cam)
    return {"camera": cam, "voce": None}


CENAS = {"cidades": montar_cidades, "metro": montar_metro, "mercado": montar_mercado, "pripyat": montar_pripyat}
