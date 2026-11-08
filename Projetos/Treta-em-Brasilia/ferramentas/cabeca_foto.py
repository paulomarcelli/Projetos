"""Cabeças dos lutadores feitas da foto, em alta resolução, com as expressões editadas no lugar.

Uso:
    python3 ferramentas/cabeca_foto.py <id> [<id> ...]
    python3 ferramentas/cabeca_foto.py todos

A expressão neutra é a própria foto (com um tratamento leve de desenho: contraste, cor, nitidez
e contorno). As outras mexem só onde precisam: a região do olho, da sobrancelha ou da boca é
apagada com inpainting (cv2.inpaint, que preenche com a pele em volta) e o traço novo é
desenhado com antialias no tamanho e na cor da própria pessoa, seguindo os contornos do rosto
detectados pelo MediaPipe (ferramentas/rostos.json, gerado por ferramentas/rostos.py).

No jogo a cabeça é reduzida pela GPU com mipmaps (Desenho.textura usa CanvasTexture com filtro
linear), então a foto chega à tela de 480x270 pela média dos pixels, sem perder olho nem boca.

Gera, com os quadros de EXPRESSOES lado a lado:
    sprites/<id>_rosto.png    ALTURA px de altura (luta e seleção)
    sprites/<id>_retrato.png  ALTURA_RETRATO px (memes, SUPER, VS)
    sprites/<id>_cabeca.png   o primeiro quadro do rosto
A Eduarda é caricatura e continua no gerador antigo (ferramentas/cabeca_pixel.py).
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

sys.path.insert(0, str(Path(__file__).resolve().parent))
from cabeca_pixel import CAIXAS, EXPRESSOES, sem_fundo, despill  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
ALTURA = 120
ALTURA_RETRATO = 220
CONTORNO = (20, 12, 28)
CARICATURAS = {"eduarda"}

# ajustes de recorte por pessoa (somados à caixa do gerador antigo): mais cabelo, barba ou queixo
AJUSTE = {
    "erika": (0, 0, 0, 60),
    "lula": (-10, -6, 10, 30),
    "renan": (-6, 0, 6, 22),
    "trump": (-6, 0, 6, 10),
    "bolsonaro": (0, 0, 0, 10),
    "xandao": (0, 0, 0, 10),
}
# quanto a barba desce além do contorno do queixo (fração da largura do olho)
BARBA = {"lula": 0.45, "renan": 0.3}
# cabelo comprido: não corta abaixo do nariz (só o oval)
CABELO_LONGO = {"erika"}


def _pts(lista) -> np.ndarray:
    return np.array(lista, dtype=np.float32)


class Cara:
    """A foto recortada (BGR para o OpenCV), a máscara e os contornos do rosto em coordenadas do recorte."""

    def __init__(self, id_: str):
        info = CAIXAS[id_]
        caixa = list(info["caixa"])
        for i, d in enumerate(AJUSTE.get(id_, (0, 0, 0, 0))):
            caixa[i] += d
        pontos = json.loads((RAIZ / "ferramentas" / "rostos.json").read_text())[id_]
        foto = sem_fundo(id_)
        caixa[0], caixa[1] = max(0, caixa[0]), max(0, caixa[1])
        caixa[2], caixa[3] = min(foto.width, caixa[2]), min(foto.height, caixa[3])
        cab = foto.crop(tuple(caixa))
        x0, y0 = caixa[0], caixa[1]
        p = {}
        for k, v in pontos.items():
            if k.startswith("c_"):
                p[k] = _pts([[q[0] - x0, q[1] - y0] for q in v])
            else:
                p[k] = np.array([v[0] - x0, v[1] - y0], dtype=np.float32)
        # no jogo a cabeça olha para a frente do lutador (+x): espelha quem olha para a esquerda
        meio = (p["olho_e"][0] + p["olho_d"][0]) / 2
        if (p["nariz"][0] - meio) / abs(p["olho_d"][0] - p["olho_e"][0]) < -0.08:
            cab = ImageOps.mirror(cab)
            w = cab.width
            for k in p:
                if p[k].ndim == 1:
                    p[k] = np.array([w - p[k][0], p[k][1]], dtype=np.float32)
                else:
                    p[k] = np.stack([w - p[k][:, 0], p[k][:, 1]], axis=1).astype(np.float32)
            for a, b in (("olho_e", "olho_d"), ("sobr_e", "sobr_d"), ("canto_e", "canto_d"),
                         ("c_olho_e", "c_olho_d"), ("c_sobr_e", "c_sobr_d")):
                p[a], p[b] = p[b], p[a]
        w, h = cab.size
        oval = Image.new("L", (w, h), 0)
        ImageDraw.Draw(oval).ellipse((-w * 0.04, -h * 0.02, w * 1.04, h * 1.0), fill=255)
        alfa = np.asarray(Image.composite(cab.getchannel("A"), Image.new("L", (w, h), 0), oval)).copy()
        # abaixo do nariz fica só o rosto (contorno do MediaPipe, com folga para barba e pescoço):
        # sai o paletó, o colarinho e os ombros que entram no recorte
        olho_w = float(np.linalg.norm(p["c_olho_e"][0] - p["c_olho_e"][8]))
        centro = p["c_rosto"].mean(axis=0)
        folga = olho_w * (0.25 + BARBA.get(id_, 0.0))
        meia = max(1.0, float(np.ptp(p["c_rosto"][:, 0])) / 2)
        rel = p["c_rosto"] - centro
        cara = centro + rel * np.array([1.0 + olho_w * 0.12 / meia, 1.0], np.float32)
        # a barba desce: empurra só a parte de baixo do contorno
        baixo = rel[:, 1] > 0
        cara[baixo, 1] += folga * (rel[baixo, 1] / max(1.0, float(rel[:, 1].max())))
        m = np.zeros((h, w), np.uint8)
        cv2.fillPoly(m, [cara.astype(np.int32)], 255)
        # pescoço curto embaixo do queixo
        q = p["queixo"]
        cv2.ellipse(m, (int(q[0]), int(q[1])), (int(olho_w * 0.75), int(olho_w * 0.4 + folga)), 0, 0, 360, 255, -1)
        corte = int(p["nariz"][1])
        if id_ not in CABELO_LONGO:
            alfa[corte:][m[corte:] == 0] = 0
        alfa = Image.fromarray(alfa)
        rgb = despill(cab.convert("RGB"))
        self.bgr = cv2.cvtColor(np.asarray(rgb), cv2.COLOR_RGB2BGR)
        self.alfa = np.asarray(alfa)
        self.p = p
        self.w, self.h = w, h
        self.olho_w = float(np.linalg.norm(p["c_olho_e"][0] - p["c_olho_e"][8]))
        self.boca_w = float(np.linalg.norm(p["c_labios"][0] - p["c_labios"][10]))
        self.lapis = max(2, int(round(self.olho_w * 0.09)))  # espessura base dos traços

    # ------------------------------------------------------------ amostras de cor

    def cor(self, pts: np.ndarray, pct: float, dilata=0) -> tuple:
        m = np.zeros((self.h, self.w), np.uint8)
        cv2.fillPoly(m, [pts.astype(np.int32)], 255)
        if dilata:
            m = cv2.dilate(m, np.ones((dilata, dilata), np.uint8))
        px = self.bgr[(m > 0) & (self.alfa > 0)]
        if len(px) == 0:
            return (40, 30, 30)
        lum = px.mean(axis=1)
        sel = px[lum <= np.percentile(lum, pct)] if pct < 100 else px
        return tuple(int(v) for v in np.median(sel, axis=0))

    def pele(self) -> tuple:
        # bochecha: abaixo do olho, entre o olho e o canto da boca
        c = (self.p["olho_e"] + self.p["canto_e"]) / 2
        r = self.olho_w * 0.25
        quad = _pts([[c[0] - r, c[1] - r], [c[0] + r, c[1] - r], [c[0] + r, c[1] + r], [c[0] - r, c[1] + r]])
        return self.cor(quad, 100)


def _apagar(img: np.ndarray, polis: list, dilata: int) -> np.ndarray:
    m = np.zeros(img.shape[:2], np.uint8)
    for pol in polis:
        cv2.fillPoly(m, [pol.astype(np.int32)], 255)
    m = cv2.dilate(m, np.ones((dilata, dilata), np.uint8))
    return cv2.inpaint(img, m, max(3, dilata), cv2.INPAINT_TELEA)


def _faixa(polilinha: np.ndarray, esp: float) -> np.ndarray:
    """Polígono em volta de uma polilinha (para apagar sobrancelhas)."""
    cima = polilinha + np.array([0, -esp], np.float32)
    baixo = polilinha[::-1] + np.array([0, esp], np.float32)
    return np.concatenate([cima, baixo])


def _linha(img, pts, cor, esp):
    """Traço suave (desenhado em 4x e reduzido não precisa: o LINE_AA do OpenCV já suaviza)."""
    pts = np.round(np.asarray(pts) * 16).astype(np.int32)
    cv2.polylines(img, [pts], False, cor, int(esp), cv2.LINE_AA, shift=4)


def _poli(img, pts, cor):
    pts = np.round(np.asarray(pts) * 16).astype(np.int32)
    cv2.fillPoly(img, [pts], cor, cv2.LINE_AA, shift=4)


def _curva(a, b, meio_desl: float, n=12):
    """Pontos de a até b passando por um meio deslocado em y (curva de pálpebra ou de boca)."""
    a, b = np.asarray(a, np.float32), np.asarray(b, np.float32)
    m = (a + b) / 2 + np.array([0, meio_desl], np.float32)
    t = np.linspace(0, 1, n)[:, None]
    return (1 - t) ** 2 * a + 2 * (1 - t) * t * m + t ** 2 * b


def expressao(c: Cara, expr: str) -> np.ndarray:
    img = c.bgr.copy()
    p = c.p
    lap = c.lapis
    if expr in ("neutro", "feliz"):
        return img
    cilio = tuple(int(v * 0.55) for v in c.cor(p["c_olho_e"], 15))
    sobr_cor = c.cor(p["c_sobr_e"], 50, dilata=3)
    labio = c.cor(p["c_labios"], 40)
    labio_esc = tuple(int(v * 0.7) for v in labio)
    boca_esc = (40, 22, 70)   # BGR: vermelho bem escuro
    dente = (214, 224, 232)
    lingua = (110, 105, 215)

    olhos = (p["c_olho_e"], p["c_olho_d"])
    sobrs = (p["c_sobr_e"], p["c_sobr_d"])

    # ---------------------------------------------------------------- sobrancelhas
    forma_sobr = {"esforco": "brava", "grito": "brava", "dor": "triste", "derrota": "triste", "nocaute": "alta"}.get(expr)
    if forma_sobr:
        img = _apagar(img, [_faixa(s[:5], lap * 1.2) for s in sobrs] + [_faixa(s[5:], lap * 1.2) for s in sobrs], lap * 2)
        for s, lado in ((sobrs[0], 1), (sobrs[1], -1)):
            # a linha de cima da sobrancelha (pontos 5..9) vai de dentro (perto do nariz) para fora
            topo = s[5:].copy()
            base = s[:5][::-1].copy()
            meio = (topo + base) / 2
            # índice 0 = ponta de dentro (perto do nariz)
            dentro_primeiro = abs(meio[0][0] - p["nariz"][0]) < abs(meio[-1][0] - p["nariz"][0])
            if not dentro_primeiro:
                meio = meio[::-1]
            k = np.linspace(1, 0, len(meio))[:, None]  # 1 = dentro
            if forma_sobr == "brava":
                meio = meio + np.concatenate([np.zeros_like(k), k * c.olho_w * 0.22], axis=1)
            elif forma_sobr == "triste":
                meio = meio + np.concatenate([np.zeros_like(k), -k * c.olho_w * 0.2], axis=1)
            else:
                meio = meio + np.array([0, -c.olho_w * 0.18], np.float32)
            esp = max(lap * 1.2, float(np.mean(np.abs(topo[:, 1] - base[:, 1]))) * 0.7)
            _linha(img, meio, sobr_cor, esp)

    # ---------------------------------------------------------------- olhos
    fechados = {"piscar": "reto", "derrota": "triste", "dor": "apertado"}.get(expr)
    if fechados or expr == "nocaute":
        img = _apagar(img, list(olhos), int(lap * 2.2))
        for o in olhos:
            a, b = o[0], o[8]  # cantos
            centro = o.mean(axis=0)
            if expr == "nocaute":
                r = c.olho_w * 0.32
                _linha(img, [centro + [-r, -r], centro + [r, r]], cilio, lap * 1.3)
                _linha(img, [centro + [-r, r], centro + [r, -r]], cilio, lap * 1.3)
            elif fechados == "reto":
                _linha(img, _curva(a, b, c.olho_w * 0.12), cilio, lap * 1.2)
            elif fechados == "triste":
                _linha(img, _curva(a, b, c.olho_w * 0.18), cilio, lap * 1.2)
            else:  # apertado de dor: dois traços em "> <"
                lado = 1 if centro[0] < p["nariz"][0] else -1
                ponta = centro + [lado * c.olho_w * 0.35, 0]
                _linha(img, [centro + [-lado * c.olho_w * 0.4, -c.olho_w * 0.18], ponta, centro + [-lado * c.olho_w * 0.4, c.olho_w * 0.18]], cilio, lap * 1.2)
        if expr == "derrota":
            o = olhos[0]
            gota = o.mean(axis=0) + [0, c.olho_w * 0.45]
            cv2.ellipse(img, tuple(int(v) for v in gota), (max(2, int(c.olho_w * 0.12)), max(3, int(c.olho_w * 0.2))), 0, 0, 360, (250, 200, 120), -1, cv2.LINE_AA)

    # ---------------------------------------------------------------- boca
    if expr in ("esforco", "grito", "dor", "nocaute", "derrota"):
        labios = p["c_labios"]
        ce, cd = labios[0], labios[10]
        topo_y = float(labios[3:8, 1].mean())  # lábio de cima
        baixo_y = float(labios[13:18, 1].mean())
        abre = {"grito": c.boca_w * 0.55, "esforco": c.boca_w * 0.2, "dor": c.boca_w * 0.18, "nocaute": c.boca_w * 0.32, "derrota": 0}[expr]
        apagar = [labios]
        if expr == "grito":
            queixo = labios.copy()
            queixo[11:20, 1] += abre * 0.6
            apagar.append(queixo)
        img = _apagar(img, apagar, int(lap * 2))
        meio_x = (ce[0] + cd[0]) / 2
        if expr == "grito":
            # boca aberta: lábio de cima no lugar, mandíbula descendo; a curva de Bézier chega à
            # metade do deslocamento de controle, por isso o controle é o dobro da abertura
            cima = _curva(ce, cd, -c.boca_w * 0.16)
            baixo = _curva(cd, ce, abre * 2.0)
            forma = np.concatenate([cima, baixo])
            _poli(img, forma, boca_esc)
            # garganta mais escura no meio
            cv2.ellipse(img, (int(meio_x), int(topo_y + abre * 0.55)), (int(c.boca_w * 0.22), max(3, int(abre * 0.3))), 0, 0, 360, (20, 10, 30), -1, cv2.LINE_AA)
            # fileira de dentes de cima: faixa fina colada no lábio, sem chegar nos cantos
            ins = c.boca_w * 0.2
            sup = _curva(ce + [ins, -c.boca_w * 0.01], cd - [ins, c.boca_w * 0.01], -c.boca_w * 0.13)
            inf = _curva(cd - [ins, -abre * 0.16], ce + [ins, abre * 0.16], -c.boca_w * 0.1)
            _poli(img, np.concatenate([sup, inf]), dente)
            # língua no fundo
            cv2.ellipse(img, (int(meio_x), int(topo_y + abre * 0.95)), (int(c.boca_w * 0.24), max(3, int(abre * 0.2))), 0, 180, 360, lingua, -1, cv2.LINE_AA)
            _linha(img, np.concatenate([forma, forma[:1]]), labio_esc, lap * 1.6)
        elif expr in ("esforco", "dor"):
            meio_y = (topo_y + baixo_y) / 2
            h = abre / 2
            caida = c.boca_w * (0.1 if expr == "dor" else 0.0)
            ins = c.boca_w * 0.08
            ret = _pts([[ce[0] + ins, meio_y - h + caida], [cd[0] - ins, meio_y - h + caida], [cd[0] - ins * 1.6, meio_y + h + caida],
                        [ce[0] + ins * 1.6, meio_y + h + caida]])
            if expr == "dor":
                ret[1:3] = ret[1:3] - [0, caida * 1.5]
            _poli(img, ret, dente)
            _linha(img, [(ret[0] + ret[3]) / 2, (ret[1] + ret[2]) / 2], labio_esc, max(1, lap * 0.7))
            for k in range(1, 4):
                x = ret[0][0] + (ret[1][0] - ret[0][0]) * k / 4
                _linha(img, [[x, meio_y - h * 0.8 + caida], [x, meio_y + h * 0.8 + caida]], (190, 198, 206), max(1, lap * 0.35))
            _linha(img, np.concatenate([ret, ret[:1]]), labio_esc, lap * 1.2)
        elif expr == "nocaute":
            cv2.ellipse(img, (int(meio_x), int((topo_y + baixo_y) / 2)), (max(3, int(c.boca_w * 0.16)), max(4, int(abre * 0.5))), 0, 0, 360, boca_esc, -1, cv2.LINE_AA)
            cv2.ellipse(img, (int(meio_x), int((topo_y + baixo_y) / 2)), (max(3, int(c.boca_w * 0.16)), max(4, int(abre * 0.5))), 0, 0, 360, labio_esc, int(lap), cv2.LINE_AA)
        elif expr == "derrota":
            _linha(img, _curva(ce + [c.boca_w * 0.05, c.boca_w * 0.08], cd - [c.boca_w * 0.05, -c.boca_w * 0.08], -c.boca_w * 0.12), labio_esc, lap * 1.4)
    return img


def tratar(bgr: np.ndarray, alfa: np.ndarray, altura: int) -> Image.Image:
    rgb = Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
    rgb = ImageEnhance.Contrast(rgb).enhance(1.12)
    rgb = ImageEnhance.Color(rgb).enhance(1.15)
    rgb = rgb.filter(ImageFilter.UnsharpMask(radius=max(1, rgb.height // 160), percent=110, threshold=2))
    w = max(1, round(rgb.width * altura / rgb.height))
    peq = rgb.resize((w, altura), Image.LANCZOS)
    a = Image.fromarray(alfa).resize((w, altura), Image.LANCZOS).point(lambda v: 255 if v > 120 else 0)
    peq = peq.convert("RGBA")
    peq.putalpha(a)
    # contorno escuro em volta (2 px no rosto, 3 no retrato)
    esp = 2 if altura <= 140 else 3
    m = np.asarray(a) > 0
    borda = cv2.dilate(m.astype(np.uint8), np.ones((esp * 2 + 1, esp * 2 + 1), np.uint8)) > 0
    base = np.zeros((altura, w, 4), np.uint8)
    base[borda] = CONTORNO + (255,)
    arr = np.asarray(peq).copy()
    base[m] = arr[m]
    return Image.fromarray(base)


def folha(c: Cara, altura: int) -> Image.Image:
    quadros = [tratar(expressao(c, e), c.alfa, altura) for e in EXPRESSOES]
    fw, fh = quadros[0].size
    sheet = Image.new("RGBA", (fw * len(quadros), fh), (0, 0, 0, 0))
    for i, q in enumerate(quadros):
        sheet.paste(q, (i * fw, 0))
    return sheet


def gerar(id_: str) -> None:
    if id_ in CARICATURAS:
        print("pula", id_, "(caricatura, gerador antigo)")
        return
    c = Cara(id_)
    pasta = RAIZ / "sprites"
    rosto = folha(c, ALTURA)
    rosto.save(pasta / f"{id_}_rosto.png")
    folha(c, ALTURA_RETRATO).save(pasta / f"{id_}_retrato.png")
    fw = rosto.width // len(EXPRESSOES)
    rosto.crop((0, 0, fw, rosto.height)).save(pasta / f"{id_}_cabeca.png")
    print("ok", id_, rosto.size)


if __name__ == "__main__":
    for i in ([k for k in CAIXAS if k not in CARICATURAS] if sys.argv[1] == "todos" else sys.argv[1:]):
        gerar(i)
