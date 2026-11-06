"""Transforma a foto de uma pessoa na cabeça caricata em pixel art usada no jogo, com expressões.

Uso:
    python3 ferramentas/cabeca_pixel.py <id> [<id> ...]
    python3 ferramentas/cabeca_pixel.py todos

Lê fotos/<id>.jpg, tira o fundo (rembg) e recorta a cabeça (CAIXAS). A foto dá o formato,
o cabelo, a barba e as cores da pele. Os traços que mudam com a emoção (olhos, sobrancelhas,
boca, óculos) são apagados e REDESENHADOS em pixel art em cada quadro, nos pontos do rosto
detectados na foto (ferramentas/rostos.json, gerado por ferramentas/rostos.py com o
MediaPipe Face Landmarker).

Gera, com os quadros de EXPRESSOES lado a lado:
    sprites/<id>_rosto.png    cabeça no tamanho do jogo (ALTURA px)
    sprites/<id>_retrato.png  o dobro, para a seleção e os memes
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
CONTORNO = (20, 12, 28, 255)
ALTURA = 38
EXPRESSOES = ["neutro", "piscar", "esforco", "grito", "dor", "nocaute", "feliz", "derrota"]

# Recorte da cabeça na foto original (x0, y0, x1, y1) e detalhes de cada rosto.
CAIXAS = {
    "lula": {"caixa": (222, 30, 472, 352), "barba": True, "oculos": False, "sobr": 1, "sobr_cor": (200, 194, 186)},
    "bolsonaro": {"caixa": (70, 18, 268, 262), "barba": False, "oculos": False, "sobr": 1, "sobr_cor": (60, 48, 44), "bravo": True},
    "xandao": {"caixa": (135, 40, 352, 300), "barba": False, "oculos": False, "sobr": 2, "sobr_cor": (52, 34, 30), "bravo": True},
    "trump": {"caixa": (252, 12, 500, 332), "barba": False, "oculos": False, "sobr": 1, "sobr_cor": (196, 150, 90)},
    # caricatura (referência do boneco abridor de garrafas): cabelo escuro liso até o ombro,
    # óculos de armação transparente e a risada escancarada com uma fileira de dentes grandes
    "eduarda": {"caixa": (185, 0, 565, 410), "barba": False, "oculos": True, "sobr": 1, "sobr_cor": (40, 28, 26),
                "risada": True, "cabelo_escuro": (34, 24, 24), "oculos_cor": (226, 228, 234)},
}

TRACO = (36, 16, 20, 255)
BRANCO = (250, 246, 240, 255)
BOCA = (96, 24, 36, 255)
LINGUA = (214, 92, 108, 255)
ARMACAO = (40, 34, 44, 255)


def sem_fundo(id_: str) -> Image.Image:
    cache = RAIZ / "fotos" / f"{id_}_sem_fundo.png"
    if cache.exists():
        return Image.open(cache).convert("RGBA")
    from rembg import new_session, remove

    out = remove(Image.open(RAIZ / "fotos" / f"{id_}.jpg").convert("RGB"), session=new_session("u2net_human_seg"))
    out.save(cache)
    return out


def despill(rgb: Image.Image) -> Image.Image:
    """Tira o verde que um fundo verde deixa no cabelo e na pele."""
    r, g, b = (np.asarray(c, dtype=np.int16) for c in rgb.split())
    limite = (r + b) // 2 + 6
    g = np.where(g > limite, limite, g)
    return Image.merge("RGB", [Image.fromarray(c.astype(np.uint8)) for c in (r, g, b)])


def base_pixel(cabeca: Image.Image, altura: int, cores: int) -> Image.Image:
    w = max(1, round(cabeca.width * altura / cabeca.height))
    rgb = despill(cabeca.convert("RGB"))
    rgb = ImageEnhance.Contrast(rgb).enhance(1.15)
    rgb = ImageEnhance.Color(rgb).enhance(1.2)
    # os traços finos da foto viram borrão em poucos pixels: suaviza antes e redesenha depois
    rgb = rgb.filter(ImageFilter.GaussianBlur(radius=cabeca.height / altura * 0.6))
    peq = rgb.resize((w, altura), Image.LANCZOS)
    alfa = cabeca.getchannel("A").resize((w, altura), Image.LANCZOS).point(lambda a: 255 if a > 110 else 0)
    pal = peq.quantize(colors=cores, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGBA")
    pal.putalpha(alfa)
    return pal


def versao_nitida(cabeca: Image.Image, tamanho: tuple) -> Image.Image:
    """A foto reduzida sem borrar, com contraste: é de onde vêm os olhos e as sobrancelhas de verdade."""
    rgb = despill(cabeca.convert("RGB"))
    rgb = ImageEnhance.Contrast(rgb).enhance(1.35)
    rgb = ImageEnhance.Color(rgb).enhance(1.15)
    rgb = rgb.filter(ImageFilter.UnsharpMask(radius=2, percent=160, threshold=1))
    return rgb.resize(tamanho, Image.BOX)


class Rosto:
    """Pontos do rosto na escala do sprite e um pincel de pixels de arte (u = tamanho do pixel)."""

    def __init__(self, im: Image.Image, pontos: dict, caixa: tuple, escala: float, u: int, nitida: Image.Image = None):
        self.im = im
        self.px = im.load()
        self.nitida = nitida.load() if nitida is not None else None
        self.u = u
        x0, y0 = caixa[0], caixa[1]
        self.p = {k: (round((v[0] - x0) * escala / u) * u, round((v[1] - y0) * escala / u) * u) for k, v in pontos.items()}
        self.dist = max(6, abs(self.p["olho_d"][0] - self.p["olho_e"][0]) // u)  # entre os olhos, em pixels de arte
        self.pele = self.cor_media(self.p["nariz"], 2)

    def cor_media(self, centro, raio):
        cores = []
        for dx in range(-raio * self.u, raio * self.u + 1):
            for dy in range(-raio * self.u, raio * self.u + 1):
                x, y = centro[0] + dx, centro[1] + dy
                if 0 <= x < self.im.width and 0 <= y < self.im.height and self.px[x, y][3] > 0:
                    cores.append(self.px[x, y][:3])
        if not cores:
            return (220, 170, 140, 255)
        return tuple(int(v) for v in np.median(np.array(cores), axis=0)) + (255,)

    def ponto(self, centro, dx, dy, cor):
        x0, y0 = centro[0] + dx * self.u, centro[1] + dy * self.u
        for i in range(self.u):
            for j in range(self.u):
                x, y = x0 + i, y0 + j
                if 0 <= x < self.im.width and 0 <= y < self.im.height and self.px[x, y][3] > 0:
                    self.px[x, y] = cor

    def linha(self, centro, pts, cor):
        for dx, dy in pts:
            self.ponto(centro, dx, dy, cor)

    def copiar_da_foto(self, centro, rx, ry):
        """Traz os pixels da foto nítida para a região (olho ou sobrancelha), realçando pupila e branco."""
        if self.nitida is None:
            return
        pts = []
        for dx in range(-rx, rx + 1):
            for dy in range(-ry, ry + 1):
                if (dx / (rx + 0.5)) ** 2 + (dy / (ry + 0.5)) ** 2 <= 1.0:
                    x, y = centro[0] + dx, centro[1] + dy
                    if 0 <= x < self.im.width and 0 <= y < self.im.height and self.px[x, y][3] > 0:
                        pts.append((x, y, self.nitida[x, y]))
        if not pts:
            return
        lum = np.array([0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2] for _, _, c in pts])
        escuro = min(np.percentile(lum, 20), 115)
        for (x, y, c), l in zip(pts, lum):
            sat = (max(c[:3]) - min(c[:3])) / max(1, max(c[:3]))
            if l <= escuro:
                c = tuple(int(v * 0.55) for v in c)  # pupila, cílios, sobrancelha
            elif l > 150 and sat < 0.22:
                c = tuple(int(v + (245 - v) * 0.45) for v in c)  # branco do olho (pouca cor)
            self.px[x, y] = tuple(c[:3]) + (255,)

    def apagar(self, centro, rx, ry, cor):
        """Pinta uma elipse com a cor da pele (ou da barba), apagando o traço da foto."""
        for dx in range(-rx, rx + 1):
            for dy in range(-ry, ry + 1):
                if (dx / (rx + 0.5)) ** 2 + (dy / (ry + 0.5)) ** 2 <= 1.0:
                    self.ponto(centro, dx, dy, cor)


def desenhar(r: Rosto, expr: str, info: dict) -> None:
    oe, od = r.p["olho_e"], r.p["olho_d"]
    se, sd = r.p["sobr_e"], r.p["sobr_d"]
    boca = r.p["boca"]
    lo = max(1, r.dist // 5)  # meia largura do olho
    lb = max(2, r.dist // 3)  # meia largura da boca
    cor_barba = r.cor_media((boca[0], boca[1] + 2 * r.u), 1) if info["barba"] else None

    # 1) olhos e sobrancelhas: da foto (nítidos) quando abertos; senão, apaga e redesenha
    olhos_foto = expr in ("neutro", "esforco", "grito") and not info.get("risada")
    sobr_foto = expr in ("neutro", "piscar", "feliz")
    u = r.u
    for c in (oe, od):
        if olhos_foto:
            r.copiar_da_foto(c, (lo + 2) * u, 2 * u)
        else:
            r.apagar(c, lo + 1, 1, r.pele)
    for c in (se, sd):
        if sobr_foto:
            r.copiar_da_foto(c, (lo + 2) * u, u)
        else:
            r.apagar(c, lo + 1, 1, r.pele)
    r.apagar(boca, lb, 1, cor_barba or r.pele)

    # 1a) cabelo liso escuro em formato de chanel: repartido no meio, testa aparecendo,
    # e duas cortinas dos lados do rosto até embaixo (desenhado por cima da foto)
    if info.get("cabelo_escuro"):
        escuro = info["cabelo_escuro"] + (255,)
        brilho = tuple(min(255, v + 30) for v in info["cabelo_escuro"]) + (255,)
        cx = (oe[0] + od[0]) / 2.0
        testa = r.dist * r.u * 0.55      # meia largura da testa que aparece
        lado = r.dist * r.u * 0.98       # a partir daqui é só cabelo (cortinas)
        sob_y = min(se[1], sd[1])
        for y in range(r.im.height):
            for x in range(r.im.width):
                c = r.px[x, y]
                if c[3] == 0:
                    continue
                dx = abs(x - cx)
                k = min(1.0, dx / testa)
                linha_cabelo = sob_y - 4 * r.u + k * k * 3 * r.u  # mais alta no meio (risca)
                cabelo = dx > lado or (dx > testa and y < sob_y + 2 * r.u) or y < linha_cabelo
                if cabelo:
                    fio = (x // r.u) % 5 == 0 and y < sob_y
                    r.px[x, y] = brilho if fio else escuro
        # a risca no meio
        for y in range(0, int(sob_y - 4 * r.u)):
            x = int(cx)
            if 0 <= x < r.im.width and r.px[x, y][3] > 0:
                r.px[x, y] = r.pele

    # 1b) franja reta (cabelo em cuia): do topo até logo acima das sobrancelhas
    if info.get("franja"):
        cabelo = r.cor_media((oe[0] - r.dist * r.u * 9 // 10, se[1] + 2 * r.u), 1)
        escuro = tuple(max(0, v - 22) for v in cabelo[:3]) + (255,)
        corte = min(se[1], sd[1]) - r.u
        for y in range(0, corte):
            for x in range(r.im.width):
                if r.px[x, y][3] > 0:
                    r.px[x, y] = escuro if (x // r.u) % 4 == 0 else cabelo
        for x in range(r.im.width):  # ponta da franja, reta
            for k in range(r.u):
                if 0 <= corte + k < r.im.height and r.px[x, corte + k][3] > 0 and (x // r.u) % 2 == 0:
                    r.px[x, corte + k] = escuro

    # 2) sobrancelhas desenhadas só quando a expressão pede. "miolo" = lado do nariz.
    sob = info["sobr_cor"] + (255,)
    forma = {"esforco": "brava", "grito": "brava", "dor": "triste", "nocaute": "alta", "derrota": "triste"}.get(expr, "normal")
    if info.get("bravo") and forma == "normal":
        forma = "brava"
    for c, miolo in (() if sobr_foto else ((se, 1), (sd, -1))):
        pts = []
        for i in range(-lo - 1, lo + 2):
            k = i * miolo  # positivo = perto do nariz
            if forma == "brava":
                y = 1 if k >= lo else (0 if k >= -1 else -1)
            elif forma == "triste":
                y = -1 if k >= lo else (0 if k >= -1 else 1)
            elif forma == "alta":
                y = -1
            else:
                y = 0
            pts.append((i, y))
            if info["sobr"] > 1:
                pts.append((i, y - 1))
        r.linha(c, pts, sob)

    # 3) olhos (pupila virada para a frente do personagem: +x)
    for c in (oe, od):
        if olhos_foto:
            pass  # os olhos da foto já estão no lugar
        elif expr == "piscar":
            r.linha(c, [(i, 0) for i in range(-lo, lo + 1)], TRACO)
        elif expr == "dor":
            r.linha(c, [(-lo, -1), (0, 0), (lo, -1)] + [(i, 0) for i in range(-lo + 1, lo)], TRACO)
        elif expr == "nocaute":
            r.linha(c, [(-1, -1), (1, 1), (0, 0), (-1, 1), (1, -1)], TRACO)
        elif expr == "feliz" or (info.get("risada") and expr in ("neutro", "grito")):
            # olhos fechados de tanto rir (arco para cima)
            r.linha(c, [(-lo, 0), (lo, 0)] + [(i, -1) for i in range(-lo + 1, lo)], TRACO)
        elif expr == "esforco" and info.get("risada"):
            r.linha(c, [(i, 0) for i in range(-lo, lo + 1)], TRACO)
        elif expr == "derrota":
            r.linha(c, [(i, 0) for i in range(-lo, lo + 1)], TRACO)
    if expr == "derrota":
        r.linha(oe, [(0, 1), (0, 2)], (120, 190, 255, 255))  # lágrima

    # 4) óculos
    if info["oculos"]:
        armacao = info.get("oculos_cor", ARMACAO[:3]) + (255,)
        for c in (oe, od):
            r.linha(c, [(i, -2) for i in range(-lo - 1, lo + 2)] + [(i, 2) for i in range(-lo - 1, lo + 2)]
                    + [(-lo - 2, y) for y in (-1, 0, 1)] + [(lo + 2, y) for y in (-1, 0, 1)], armacao)
        meio = (((oe[0] + od[0]) // 2) // r.u * r.u, oe[1])
        r.linha(meio, [(0, -1), (-1, -1), (1, -1)], armacao)

    # 5) boca
    if info.get("risada") and expr in ("neutro", "piscar", "feliz", "grito"):
        # a risada escancarada: boca aberta, fileira de dentes de cima grandes e língua
        lr = lb + 1
        alto = 5 if expr == "grito" else 4
        for i in range(-lr + 1, lr):
            for j in range(-1, alto):
                r.ponto(boca, i, j, BOCA)
        r.linha(boca, [(i, -1) for i in range(-lr + 1, lr)] + [(i, 0) for i in range(-lr + 2, lr - 1)], BRANCO)
        r.linha(boca, [(i, 0) for i in range(-lr + 2, lr - 1, 2)], (214, 206, 196, 255))
        r.linha(boca, [(i, alto - 1) for i in range(-1, 2)], LINGUA)
        r.linha(boca, [(i, -2) for i in range(-lr + 1, lr)] + [(i, alto) for i in range(-lr + 2, lr - 1)]
                + [(-lr, j) for j in range(-1, alto)] + [(lr, j) for j in range(-1, alto)], TRACO)
    elif expr in ("neutro", "piscar"):
        r.linha(boca, [(i, 0) for i in range(-lb + 1, lb)], TRACO)
    elif expr == "esforco":  # dentes cerrados
        r.linha(boca, [(i, -1) for i in range(-lb, lb + 1)] + [(i, 1) for i in range(-lb, lb + 1)], TRACO)
        r.linha(boca, [(i, 0) for i in range(-lb + 1, lb)], BRANCO)
        r.linha(boca, [(-lb, 0), (lb, 0), (0, 0)], TRACO)
    elif expr == "grito":
        for i in range(-lb + 1, lb):
            for j in range(-1, 3):
                r.ponto(boca, i, j, BOCA)
        r.linha(boca, [(i, -1) for i in range(-lb + 1, lb)], BRANCO)
        r.linha(boca, [(0, 2)], LINGUA)
        r.linha(boca, [(i, -2) for i in range(-lb + 1, lb)] + [(i, 3) for i in range(-lb + 1, lb)]
                + [(-lb, j) for j in range(-1, 3)] + [(lb, j) for j in range(-1, 3)], TRACO)
    elif expr == "dor":
        r.linha(boca, [(-lb, 1), (lb, 1)] + [(i, 0) for i in range(-lb + 1, lb)], TRACO)
        r.linha(boca, [(i, 1) for i in range(-lb + 1, lb)], BOCA)
        r.linha(boca, [(i, 2) for i in range(-lb + 1, lb)], TRACO)
    elif expr == "nocaute":
        r.linha(boca, [(0, 0), (0, 1)], BOCA)
        r.linha(boca, [(-1, 0), (-1, 1), (1, 0), (1, 1), (0, -1), (0, 2)], TRACO)
    elif expr == "feliz":
        r.linha(boca, [(i, 0) for i in range(-lb + 1, lb)], BRANCO)
        r.linha(boca, [(-lb, -1), (lb, -1)] + [(i, 1) for i in range(-lb + 1, lb)], TRACO)
    elif expr == "derrota":
        r.linha(boca, [(-lb, 1), (lb, 1)] + [(i, 0) for i in range(-lb + 1, lb)], TRACO)

    # 6) dentes da frente grandes (caricatura), em quase todas as expressões
    if info.get("dentes") and expr != "nocaute":
        topo = -1 if expr == "grito" else 1
        r.linha(boca, [(-2, topo), (-1, topo), (0, topo), (1, topo), (-2, topo + 1), (-1, topo + 1), (0, topo + 1), (1, topo + 1)], BRANCO)
        r.linha(boca, [(-3, topo), (-3, topo + 1), (2, topo), (2, topo + 1), (-2, topo + 2), (-1, topo + 2), (0, topo + 2), (1, topo + 2)], TRACO)
        r.ponto(boca, 0 if expr != "grito" else -1, topo + 1, (200, 196, 188, 255))


def contorno(im: Image.Image) -> Image.Image:
    w, h = im.size
    base = Image.new("RGBA", (w + 2, h + 2), (0, 0, 0, 0))
    base.paste(im, (1, 1))
    arr = np.array(base)
    a = arr[:, :, 3] > 0
    viz = np.zeros_like(a)
    viz[1:, :] |= a[:-1, :]
    viz[:-1, :] |= a[1:, :]
    viz[:, 1:] |= a[:, :-1]
    viz[:, :-1] |= a[:, 1:]
    arr[viz & ~a] = CONTORNO
    return Image.fromarray(arr)


def folha(id_: str, altura: int, u: int, cores: int) -> Image.Image:
    info = CAIXAS[id_]
    pontos = json.loads((RAIZ / "ferramentas" / "rostos.json").read_text())[id_]
    caixa = info["caixa"]
    cabeca = sem_fundo(id_).crop(caixa)
    # No jogo a cabeça olha sempre para a frente do lutador (+x). Se a pessoa está virada para a
    # esquerda na foto (nariz à esquerda do meio dos olhos), espelha a foto e os pontos do rosto.
    meio = (pontos["olho_e"][0] + pontos["olho_d"][0]) / 2
    if (pontos["nariz"][0] - meio) / abs(pontos["olho_d"][0] - pontos["olho_e"][0]) < -0.08:
        cabeca = ImageOps.mirror(cabeca)
        x0, x1 = caixa[0], caixa[2]
        pontos = {k: [x0 + x1 - v[0], v[1]] for k, v in pontos.items()}
        for a, b in (("olho_e", "olho_d"), ("sobr_e", "sobr_d"), ("canto_e", "canto_d")):
            pontos[a], pontos[b] = pontos[b], pontos[a]
    w, h = cabeca.size
    oval = Image.new("L", (w, h), 0)
    ImageDraw.Draw(oval).ellipse((-w * 0.04, -h * 0.02, w * 1.04, h * 1.0), fill=255)
    cabeca.putalpha(Image.composite(cabeca.getchannel("A"), Image.new("L", (w, h), 0), oval))
    base = base_pixel(cabeca, altura, cores)
    escala = base.height / h
    nitida = versao_nitida(cabeca, base.size)
    quadros = []
    for expr in EXPRESSOES:
        im = base.copy()
        desenhar(Rosto(im, pontos, caixa, escala, u, nitida), expr, info)
        quadros.append(contorno(im))
    fw, fh = quadros[0].size
    sheet = Image.new("RGBA", (fw * len(quadros), fh), (0, 0, 0, 0))
    for i, q in enumerate(quadros):
        sheet.paste(q, (i * fw, 0))
    return sheet


def gerar(id_: str) -> None:
    pasta = RAIZ / "sprites"
    pasta.mkdir(exist_ok=True)
    folha(id_, ALTURA, 1, 14).save(pasta / f"{id_}_rosto.png")
    folha(id_, ALTURA * 2, 2, 22).save(pasta / f"{id_}_retrato.png")
    print("ok", id_)


if __name__ == "__main__":
    for i in (list(CAIXAS) if sys.argv[1] == "todos" else sys.argv[1:]):
        gerar(i)
