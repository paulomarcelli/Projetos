"""Peças comuns das cenas do estilo realista (v2): tempo pela fala, materiais procedurais, céu e sol, câmera de drone,
neblina de distância e animação por palavra.

Tudo é inventado por código (nenhuma foto, nenhum modelo baixado). Unidades em metros; z para cima.
"""
import json
import math
import random
import re
import unicodedata
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector

RAIZ = Path(__file__).resolve().parent.parent  # Projetos/E-Se-Hein
FPS = 30


# ---------------------------------------------------------------------------------------------------- tempo e fala
def normalizar(s):
    s = unicodedata.normalize("NFD", s.lower())
    return re.sub(r"[^a-z0-9]", "", "".join(c for c in s if unicodedata.category(c) != "Mn"))


class Tempo:
    """Liga o plano do Blender à fala: tempo do vídeo (s) <-> quadro do plano (1 = início do plano)."""

    def __init__(self, video, spec, plano):
        self.dados = json.loads((RAIZ / "videos" / f"{video}.json").read_text(encoding="utf-8"))
        self.spec = spec
        self.plano = plano
        self.inicio, self.fim = limites_do_plano(self.dados, spec, plano)

    def palavra(self, texto, trecho, n=1):
        """Início (s, no tempo do vídeo) da n-ésima ocorrência da palavra no trecho (1 a 9)."""
        alvo = normalizar(texto)
        achadas = [p for p in self.dados["palavras"] if p["paragrafo"] == trecho - 1 and normalizar(p["texto"]) == alvo]
        if len(achadas) < n:
            raise SystemExit(f"Palavra '{texto}' (ocorrência {n}) não está no trecho {trecho}")
        return achadas[n - 1]["inicioMs"] / 1000

    def quadro(self, t):
        return 1 + round(t * FPS) - round(self.inicio * FPS)

    @property
    def quadros(self):
        # Igual ao Remotion (src/lib/v2.ts): o plano ocupa os quadros round(inicio*30) .. round(fim*30) - 1.
        return round(self.fim * FPS) - round(self.inicio * FPS)

    def evento(self, nome):
        """(início, fim) em quadros do plano para o evento do spec, ou None."""
        for e in self.plano.get("eventos", []):
            if e["o"] == nome:
                a = self.quadro(self.palavra(e["palavra"], e["trecho"], e.get("n", 1)))
                b = self.quadro(self.palavra(e["ate"], e["trecho"], e.get("n_ate", 1))) if e.get("ate") else a + 12
                return a, max(b, a + 1)
        return None


def limites_do_plano(dados, spec, plano):
    """O plano vai do meio da pausa antes do primeiro trecho até o meio da pausa depois do último."""
    trechos = dados["trechos"]
    i0, i1 = plano["trechos"][0] - 1, plano["trechos"][-1] - 1
    ini = 0.0 if i0 == 0 else (trechos[i0 - 1]["fim"] + trechos[i0]["inicio"]) / 2
    if i1 == len(trechos) - 1:
        fim = dados["duracaoAudio"] + spec.get("fechamento", 4)
    else:
        fim = (trechos[i1]["fim"] + trechos[i1 + 1]["inicio"]) / 2
    return ini, fim


# ---------------------------------------------------------------------------------------------------- cena e render
def cena_vazia():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras, bpy.data.curves):
        for b in list(coll):
            coll.remove(b)
    sc = bpy.context.scene
    sc.render.fps = FPS
    sc.frame_start = 1
    return sc


def configurar_render(sc, amostras=48, escala=100, motor="CYCLES"):
    try:
        sc.render.engine = motor
    except TypeError:
        sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y = 1080, 1920
    sc.render.resolution_percentage = escala
    if sc.render.engine == "CYCLES":
        prefs = bpy.context.preferences.addons["cycles"].preferences
        for tipo in ("OPTIX", "CUDA"):
            try:
                prefs.compute_device_type = tipo
                prefs.get_devices()
                for d in prefs.devices:
                    d.use = d.type == tipo
                break
            except Exception:
                continue
        c = sc.cycles
        c.device = "GPU"
        c.samples = amostras
        c.use_adaptive_sampling = True
        c.adaptive_threshold = 0.03
        c.use_denoising = True
        try:
            c.denoiser = "OPTIX"
        except TypeError:
            pass
        c.max_bounces, c.diffuse_bounces, c.glossy_bounces = 4, 2, 2
        c.transmission_bounces, c.volume_bounces, c.transparent_max_bounces = 4, 0, 8
        c.caustics_reflective = c.caustics_refractive = False
        c.blur_glossy = 1.0
        sc.render.use_persistent_data = True  # reaproveita a cena entre quadros na sequência
        try:
            c.use_fast_gi = False
        except AttributeError:
            pass
    vs = sc.view_settings
    vs.view_transform = "AgX"
    try:
        vs.look = "AgX - Base Contrast"
    except TypeError:
        pass
    sc.render.film_transparent = False
    im = sc.render.image_settings
    if hasattr(im, "media_type"):
        im.media_type = "IMAGE"
    im.file_format = "JPEG"
    im.quality = 95


# ---------------------------------------------------------------------------------------------------- cores
def lin(hexcol):
    h = hexcol.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)


def rgba(hexcol, a=1.0):
    return (*lin(hexcol), a)


# ---------------------------------------------------------------------------------------------------- nós
class Nos:
    """Atalho para montar materiais: n = Nos(mat); n.add('ShaderNodeMath', operation='MULTIPLY')."""

    def __init__(self, mat):
        mat.use_nodes = True
        self.mat = mat
        self.t = mat.node_tree
        self.t.nodes.clear()
        self.saida = self.add("ShaderNodeOutputMaterial")

    def add(self, tipo, **props):
        n = self.t.nodes.new(tipo)
        for k, v in props.items():
            setattr(n, k, v)
        return n

    def link(self, a, b):
        self.t.links.new(a, b)

    def val(self, v, nome=None):
        n = self.add("ShaderNodeValue")
        n.outputs[0].default_value = v
        if nome:
            n.name = n.label = nome
        return n.outputs[0]

    def math(self, op, a, b=None, clamp=False):
        n = self.add("ShaderNodeMath", operation=op, use_clamp=clamp)
        for i, x in enumerate((a, b)):
            if x is None:
                continue
            if isinstance(x, (int, float)):
                n.inputs[i].default_value = x
            else:
                self.link(x, n.inputs[i])
        return n.outputs[0]

    def mix_cor(self, fac, a, b):
        n = self.add("ShaderNodeMix", data_type="RGBA")
        ent = {s.identifier: s for s in n.inputs}
        for sock, x in ((ent["Factor_Float"], fac), (ent["A_Color"], a), (ent["B_Color"], b)):
            if isinstance(x, (int, float)):
                sock.default_value = x
            elif isinstance(x, tuple):
                sock.default_value = x if len(x) == 4 else (*x, 1)
            else:
                self.link(x, sock)
        return next(s for s in n.outputs if s.identifier == "Result_Color")

    def mix_float(self, fac, a, b):
        n = self.add("ShaderNodeMix", data_type="FLOAT")
        ent = {s.identifier: s for s in n.inputs}
        for sock, x in ((ent["Factor_Float"], fac), (ent["A_Float"], a), (ent["B_Float"], b)):
            if isinstance(x, (int, float)):
                sock.default_value = x
            else:
                self.link(x, sock)
        return next(s for s in n.outputs if s.identifier == "Result_Float")

    def principled(self, cor=None, rough=0.6, metal=0.0, emissao=None, forca=None):
        b = self.add("ShaderNodeBsdfPrincipled")
        for nome, x in (("Base Color", cor), ("Roughness", rough), ("Metallic", metal), ("Emission Color", emissao),
                        ("Emission Strength", forca)):
            if x is None:
                continue
            s = b.inputs[nome]
            if isinstance(x, (int, float)):
                s.default_value = x
            elif isinstance(x, tuple):
                s.default_value = x if len(x) == 4 else (*x, 1)
            else:
                self.link(x, s)
        return b

    def sep(self, vetor):
        n = self.add("ShaderNodeSeparateXYZ")
        self.link(vetor, n.inputs[0])
        return n.outputs

    def geo(self):
        return self.add("ShaderNodeNewGeometry").outputs

    def ruido(self, vetor=None, escala=5.0, detalhe=4.0, rough=0.5):
        n = self.add("ShaderNodeTexNoise")
        n.inputs["Scale"].default_value = escala
        n.inputs["Detail"].default_value = detalhe
        n.inputs["Roughness"].default_value = rough
        if vetor is not None:
            self.link(vetor, n.inputs["Vector"])
        return n.outputs

    def atributo(self, nome):
        n = self.add("ShaderNodeAttribute")
        n.attribute_name = nome
        return n.outputs


def animar_valor(sock, chaves, interp="BEZIER"):
    """Liga chaves [(quadro, valor)] a um socket de valor (nó Value) do material."""
    for f, v in chaves:
        sock.default_value = v
        sock.keyframe_insert("default_value", frame=f)
    _interp(sock.id_data, interp)


def _interp(idbloco, interp):
    ad = idbloco.animation_data
    if not ad or not ad.action:
        return
    for fc in _fcurves(ad.action):
        for k in fc.keyframe_points:
            k.interpolation = interp


def _fcurves(action):
    if hasattr(action, "fcurves") and len(getattr(action, "fcurves", [])):
        return list(action.fcurves)
    out = []  # Blender 5: ações em camadas
    for layer in getattr(action, "layers", []):
        for strip in layer.strips:
            for bag in strip.channelbags:
                out.extend(bag.fcurves)
    return out


def chave(obj, caminho, chaves, interp="BEZIER"):
    """Chaves [(quadro, valor)] num caminho do objeto (location, rotation_euler, scale, hide_render...)."""
    for f, v in chaves:
        setattr(obj, caminho, v)
        obj.keyframe_insert(caminho, frame=f)
    idb = getattr(obj, "id_data", obj)  # sockets e structs guardam a animação no bloco dono (mundo, material, cena)
    ad = getattr(idb, "animation_data", None)
    if ad and ad.action:
        for fc in _fcurves(ad.action):
            if fc.data_path == caminho or fc.data_path.endswith("." + caminho):
                for k in fc.keyframe_points:
                    k.interpolation = interp


def sumir(obj, quadro):
    """Some do render no quadro (sem fade): a virada é seca, no mesmo enquadramento."""
    if quadro <= 1:
        obj.hide_render = obj.hide_viewport = True
        return
    chave(obj, "hide_render", [(1, False), (quadro, True)], "CONSTANT")


def aparecer(obj, quadro):
    if quadro <= 1:
        return
    chave(obj, "hide_render", [(1, True), (quadro, False)], "CONSTANT")


# ---------------------------------------------------------------------------------------------------- malhas
def objeto(nome, bm, materiais=(), colecao=None):
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    for m in materiais:
        me.materials.append(m)
    o = bpy.data.objects.new(nome, me)
    (colecao or bpy.context.scene.collection).objects.link(o)
    return o


def caixa(bm, centro, tamanho, mat=0, rot_z=0.0):
    m = Matrix.LocRotScale(Vector(centro), Matrix.Rotation(rot_z, 3, "Z").to_quaternion(), Vector(tamanho))
    r = bmesh.ops.create_cube(bm, size=1.0, matrix=m)
    for v in r["verts"]:
        for f in v.link_faces:
            f.material_index = mat
    return r


def cilindro(bm, centro, raio, altura, segs=12, mat=0, raio2=None):
    m = Matrix.Translation(Vector(centro))
    r = bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=raio, radius2=raio if raio2 is None else raio2,
                              depth=altura, matrix=m)
    for v in r["verts"]:
        for f in v.link_faces:
            f.material_index = mat
    return r


def esfera(bm, centro, raio, mat=0, sub=1, escala=(1, 1, 1)):
    m = Matrix.Translation(Vector(centro)) @ Matrix.Diagonal((*escala, 1)) @ Matrix.Scale(raio, 4)
    r = bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=1.0, matrix=m)
    for v in r["verts"]:
        for f in v.link_faces:
            f.material_index = mat
    return r


def caixa_rapida(bm, centro, tamanho, mat=0):
    """Caixa alinhada aos eixos feita vértice a vértice. bmesh.ops.create_cube fica lento numa malha grande (cada
    chamada varre a malha inteira); para dezenas de milhares de caixas, use esta. Devolve o número de faces (6)."""
    cx, cy, cz = centro
    hx, hy, hz = tamanho[0] / 2, tamanho[1] / 2, tamanho[2] / 2
    v = [bm.verts.new((cx + sx * hx, cy + sy * hy, cz + sz * hz))
         for sz in (-1, 1) for sy in (-1, 1) for sx in (-1, 1)]
    # índices: 0(-,-,-) 1(+,-,-) 2(-,+,-) 3(+,+,-) 4(-,-,+) 5(+,-,+) 6(-,+,+) 7(+,+,+)
    for ids in ((0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4), (2, 6, 7, 3), (0, 4, 6, 2), (1, 3, 7, 5)):
        f = bm.faces.new([v[i] for i in ids])
        f.material_index = mat
    return 6


def cone_entre(bm, a, b, r0, r1, segs=6, mat=0):
    """Tronco de cone de a até b (galhos, mastros, canos inclinados)."""
    a, b = Vector(a), Vector(b)
    d = b - a
    m = Matrix.Translation((a + b) / 2) @ d.to_track_quat("Z", "Y").to_matrix().to_4x4()
    r = bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=r0, radius2=r1, depth=d.length, matrix=m)
    for v in r["verts"]:
        for f in v.link_faces:
            f.material_index = mat
    return r


def afunilar(res, fx=1.0, fy=1.0, dx=0.0):
    """Estreita o topo de uma caixa criada por caixa(): cabine de carro, para-brisa inclinado."""
    vs = res["verts"]
    zm = sum(v.co.z for v in vs) / len(vs)
    xm = sum(v.co.x for v in vs) / len(vs)
    ym = sum(v.co.y for v in vs) / len(vs)
    for v in vs:
        if v.co.z > zm:
            v.co.x = xm + dx + (v.co.x - xm) * fx
            v.co.y = ym + (v.co.y - ym) * fy
    return res


def rampa_paleta(n, fator, cores, constante=True):
    """ColorRamp com a paleta em degraus iguais, ligada a um fator (0 a 1)."""
    rampa = n.add("ShaderNodeValToRGB")
    if constante:
        rampa.color_ramp.interpolation = "CONSTANT"
    els = rampa.color_ramp.elements
    while len(els) < len(cores):
        els.new(0.5)
    for i, cor in enumerate(cores):
        els[i].position = i / len(cores)
        els[i].color = rgba(cor)
    n.link(fator, rampa.inputs[0])
    return rampa.outputs[0]


def plano_chao(bm, x0, y0, x1, y1, z=0.0, mat=0):
    vs = [bm.verts.new(c) for c in ((x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z))]
    f = bm.faces.new(vs)
    f.material_index = mat
    return f


def atributo_por_face(me, nome, valores):
    """Grava um float por face (ex.: 'rnd' de cada prédio) para o material ler com o nó Attribute."""
    at = me.attributes.new(nome, "FLOAT", "FACE")
    at.data.foreach_set("value", valores)


# ---------------------------------------------------------------------------------------------------- céu e sol
def ceu_e_sol(sc, elevacao=32.0, azimute=120.0, forca_ceu=1.0, forca_sol=4.0, sat_ceu=1.45, aerossol=0.12):
    """Céu procedural (espalhamento múltiplo) com o sol na mesma direção do Sun. Devolve (nó do céu, sol, fundo)."""
    w = bpy.data.worlds.new("ceu")
    sc.world = w
    w.use_nodes = True
    t = w.node_tree
    t.nodes.clear()
    ceu = t.nodes.new("ShaderNodeTexSky")
    try:
        ceu.sky_type = "MULTIPLE_SCATTERING"
    except TypeError:
        ceu.sky_type = "NISHITA"
    for k, v in (("sun_disc", True), ("sun_size", math.radians(0.6)), ("altitude", 760.0), ("air_density", 1.0),
                 ("aerosol_density", aerossol), ("dust_density", 0.2), ("ozone_density", 1.0), ("sun_intensity", 0.5)):
        if hasattr(ceu, k):
            setattr(ceu, k, v)
    fundo = t.nodes.new("ShaderNodeBackground")
    fundo.inputs["Strength"].default_value = forca_ceu
    saida = t.nodes.new("ShaderNodeOutputWorld")
    # Sofia, 21/11: o céu físico sai leitoso depois do AgX. Mais saturação no céu dá azul com profundidade e puxa a
    # sombra para o azul (a luz de preenchimento vem dele), como pede v2/grade/sombra.
    hs = t.nodes.new("ShaderNodeHueSaturation")
    hs.name = "satura_ceu"
    hs.inputs["Saturation"].default_value = sat_ceu
    hs.inputs["Value"].default_value = 1.0
    t.links.new(ceu.outputs[0], hs.inputs["Color"])
    t.links.new(hs.outputs[0], fundo.inputs[0])
    t.links.new(fundo.outputs[0], saida.inputs[0])

    sol_d = bpy.data.lights.new("sol", "SUN")
    sol_d.energy = forca_sol
    sol_d.angle = math.radians(0.8)
    sol_d.color = lin("#FFF1DE")
    sol = bpy.data.objects.new("sol", sol_d)
    sc.collection.objects.link(sol)
    posicionar_sol(ceu, sol, elevacao, azimute)
    return ceu, sol, fundo


def posicionar_sol(ceu, sol, elevacao, azimute, quadro=None):
    """azimute: de onde a luz vem, em graus a partir de +x no sentido anti-horário (90 = do lado +y)."""
    ceu.sun_elevation = math.radians(elevacao)
    ceu.sun_rotation = math.radians(azimute - 90)
    # O Sun aponta para -Z local. Rx(90 - elev) faz a luz andar para +y; Rz gira para a luz andar para longe do sol.
    sol.rotation_euler = (math.radians(90 - elevacao), 0, math.radians(azimute + 90))
    if quadro is not None:
        ceu.keyframe_insert("sun_elevation", frame=quadro)
        ceu.keyframe_insert("sun_rotation", frame=quadro)
        sol.keyframe_insert("rotation_euler", frame=quadro)


def ceu_noite(sc, cor_topo="#0B1430", cor_horizonte="#1C2B52", forca=1.0):
    """Céu noturno simples: degradê pela altura da direção de visão."""
    w = bpy.data.worlds.new("noite")
    sc.world = w
    w.use_nodes = True
    t = w.node_tree
    t.nodes.clear()
    coord = t.nodes.new("ShaderNodeTexCoord")
    sep = t.nodes.new("ShaderNodeSeparateXYZ")
    t.links.new(coord.outputs["Generated"], sep.inputs[0])
    rampa = t.nodes.new("ShaderNodeValToRGB")
    rampa.color_ramp.elements[0].position = 0.5
    rampa.color_ramp.elements[0].color = rgba(cor_horizonte)
    rampa.color_ramp.elements[1].position = 0.75
    rampa.color_ramp.elements[1].color = rgba(cor_topo)
    t.links.new(sep.outputs["Z"], rampa.inputs[0])
    fundo = t.nodes.new("ShaderNodeBackground")
    fundo.inputs["Strength"].default_value = forca
    t.links.new(rampa.outputs[0], fundo.inputs[0])
    saida = t.nodes.new("ShaderNodeOutputWorld")
    t.links.new(fundo.outputs[0], saida.inputs[0])
    return fundo


# ---------------------------------------------------------------------------------------------------- neblina
NEBLINA = {"cor": "#C9D6E3", "dist": 1400.0, "forca": 1.0}


def com_neblina(n, shader_out, cor=None, dist=None):
    """Mistura o shader com a cor da névoa pela distância da câmera (perspectiva aérea barata, sem volume)."""
    cam = n.add("ShaderNodeCameraData")
    d = n.math("DIVIDE", cam.outputs["View Distance"], dist or NEBLINA["dist"])
    fac = n.math("SUBTRACT", 1.0, n.math("EXPONENT", n.math("MULTIPLY", d, -1.0)), clamp=True)
    fac = n.math("MULTIPLY", fac, NEBLINA["forca"], clamp=True)
    em = n.add("ShaderNodeEmission")
    em.inputs["Color"].default_value = rgba(cor or NEBLINA["cor"])
    em.inputs["Strength"].default_value = 1.0
    mx = n.add("ShaderNodeMixShader")
    n.link(fac, mx.inputs[0])
    n.link(shader_out, mx.inputs[1])
    n.link(em.outputs[0], mx.inputs[2])
    return mx.outputs[0], em


# ---------------------------------------------------------------------------------------------------- câmera
def camera_drone(sc, pos, alvo, lente=28.0):
    d = bpy.data.cameras.new("drone")
    d.lens = lente
    d.sensor_fit = "VERTICAL"
    d.sensor_height = 36.0
    d.clip_start, d.clip_end = 1.0, 20000.0
    cam = bpy.data.objects.new("drone", d)
    sc.collection.objects.link(cam)
    sc.camera = cam
    mirar(cam, pos, alvo)
    return cam


def mirar(cam, pos, alvo, quadro=None):
    cam.location = Vector(pos)
    direcao = Vector(alvo) - Vector(pos)
    cam.rotation_euler = direcao.to_track_quat("-Z", "Y").to_euler()
    if quadro is not None:
        cam.keyframe_insert("location", frame=quadro)
        cam.keyframe_insert("rotation_euler", frame=quadro)


def linear(obj):
    ad = obj.animation_data
    if ad and ad.action:
        for fc in _fcurves(ad.action):
            for k in fc.keyframe_points:
                k.interpolation = "LINEAR"


def projetar(sc, cam, ponto):
    """Posição do ponto na tela (px de 1080 × 1920) no quadro atual."""
    from bpy_extras.object_utils import world_to_camera_view
    v = world_to_camera_view(sc, cam, Vector(ponto))
    return {"x": round(v.x * 1080, 1), "y": round((1 - v.y) * 1920, 1), "frente": v.z > 0}


def semente(n):
    random.seed(n)
