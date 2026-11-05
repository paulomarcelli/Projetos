"""Transforma a foto de uma pessoa na cabeça caricata em pixel art usada no jogo.

Uso:
    python3 ferramentas/cabeca_pixel.py <id> <x0> <y0> <x1> <y1> [altura]

Lê fotos/<id>.jpg, tira o fundo (rembg), recorta a cabeça na caixa (x0, y0, x1, y1),
reduz para `altura` pixels (padrão 44, a cabeça no jogo), limita a paleta,
realça contraste e cor e põe contorno escuro de 1 pixel. Gera:
    sprites/<id>_cabeca.png   (no tamanho real, 1 pixel = 1 pixel da tela)
    sprites/<id>_retrato.png  (maior, para a tela de seleção)
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent
CONTORNO = (20, 12, 28, 255)


def sem_fundo(id_: str) -> Image.Image:
    cache = RAIZ / "fotos" / f"{id_}_sem_fundo.png"
    if cache.exists():
        return Image.open(cache).convert("RGBA")
    from rembg import new_session, remove

    im = Image.open(RAIZ / "fotos" / f"{id_}.jpg").convert("RGB")
    out = remove(im, session=new_session("u2net_human_seg"))
    out.save(cache)
    return out


def pixelar(rgba: Image.Image, altura: int, cores: int) -> Image.Image:
    w = max(1, round(rgba.width * altura / rgba.height))
    # realce antes de reduzir: caricatura pede contraste
    rgb = despill(rgba.convert("RGB"))
    rgb = ImageEnhance.Contrast(rgb).enhance(1.18)
    rgb = ImageEnhance.Color(rgb).enhance(1.25)
    rgb = rgb.filter(ImageFilter.UnsharpMask(radius=3, percent=120, threshold=2))
    pequeno = rgb.resize((w, altura), Image.LANCZOS).filter(ImageFilter.ModeFilter(3) if altura < 60 else ImageFilter.SMOOTH)
    alfa = rgba.getchannel("A").resize((w, altura), Image.LANCZOS).point(lambda a: 255 if a > 110 else 0)
    paleta = pequeno.quantize(colors=cores, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    saida = paleta.convert("RGBA")
    saida.putalpha(alfa)
    return contorno(saida)


def despill(rgb: Image.Image) -> Image.Image:
    """Tira o verde que o fundo (chroma, cortina verde) deixa no cabelo e na pele."""
    r, g, b = rgb.split()
    import numpy as np

    R, G, B = (np.asarray(c, dtype=np.int16) for c in (r, g, b))
    limite = (R + B) // 2 + 6
    G2 = np.where(G > limite, limite, G).astype(np.uint8)
    return Image.merge("RGB", (r, Image.fromarray(G2), b))


def contorno(im: Image.Image) -> Image.Image:
    w, h = im.size
    base = Image.new("RGBA", (w + 2, h + 2), (0, 0, 0, 0))
    base.paste(im, (1, 1))
    px = base.load()
    alfa = [[px[x, y][3] > 0 for y in range(h + 2)] for x in range(w + 2)]
    for x in range(w + 2):
        for y in range(h + 2):
            if alfa[x][y]:
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w + 2 and 0 <= ny < h + 2 and alfa[nx][ny]:
                    px[x, y] = CONTORNO
                    break
    return base


def main() -> None:
    id_ = sys.argv[1]
    caixa = tuple(int(v) for v in sys.argv[2:6])
    altura = int(sys.argv[6]) if len(sys.argv) > 6 else 44
    foto = sem_fundo(id_)
    cabeca = foto.crop(caixa)
    # máscara oval: tira ombros e gola que entram nos cantos de baixo do recorte
    oval = Image.new("L", cabeca.size, 0)
    w, h = cabeca.size
    ImageDraw.Draw(oval).ellipse((-w * 0.04, -h * 0.02, w * 1.04, h * 1.0), fill=255)
    a = Image.composite(cabeca.getchannel("A"), Image.new("L", cabeca.size, 0), oval)
    cabeca.putalpha(a)
    pasta = RAIZ / "sprites"
    pasta.mkdir(exist_ok=True)
    pixelar(cabeca, altura, 12).save(pasta / f"{id_}_cabeca.png")
    pixelar(cabeca, altura * 2, 24).save(pasta / f"{id_}_retrato.png")
    print("ok", id_, caixa, altura)


if __name__ == "__main__":
    main()
