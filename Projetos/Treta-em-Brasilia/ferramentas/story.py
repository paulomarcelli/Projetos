"""Imagem vertical (1080x1920) para os stories: a capa do jogo em cima e os créditos embaixo.

Usa duas capturas do próprio jogo (960x540, o dobro da tela de 480x270, sem suavização):
    xvfb-run godot --path . --rendering-driver opengl3 --fixed-fps 60 \
        --script res://tests/capturas.gd -- <pasta> story
e monta tudo com a fonte pixel do jogo. Uso:
    python3 ferramentas/story.py <pasta_das_capturas> [saida.png]
A saída padrão é docs/divulgacao/story.png. Fica tudo fora das faixas que a interface dos
stories cobre (~250 px em cima, ~350 px embaixo), com espaço para a figurinha de link.
"""
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
FONTE = RAIZ / "fontes" / "PressStart2P-Regular.ttf"
W, H = 1080, 1920
FUNDO = (18, 10, 38)
OURO = (255, 210, 63)
VERMELHO = (179, 0, 27)
BRANCO = (251, 251, 247)
PRETO = (20, 12, 28)
CORES = [(255, 59, 107), (42, 157, 244), (255, 210, 63), (31, 157, 85), (176, 108, 255)]


def fonte(px: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTE), px)


def texto(d: ImageDraw.ImageDraw, cx: int, y: int, txt: str, px: int, cor, borda: int = 0, sombra: int = 0) -> None:
    f = fonte(px)
    w = d.textlength(txt, font=f)
    x = cx - w / 2
    if sombra:
        d.text((x + sombra, y + sombra), txt, font=f, fill=PRETO)
    d.text((x, y), txt, font=f, fill=cor, stroke_width=borda, stroke_fill=PRETO)


def fundo() -> Image.Image:
    img = Image.new("RGB", (W, H), FUNDO)
    d = ImageDraw.Draw(img, "RGBA")
    # degradê vertical para o roxo do jogo
    for y in range(H):
        k = y / H
        d.line([(0, y), (W, y)], fill=(int(18 + 24 * k), int(10 + 10 * k), int(38 + 32 * k), 255))
    # raios de energia saindo do meio
    import math
    cx, cy = W / 2, H * 0.47
    for i in range(22):
        a = i * 2 * math.pi / 22
        a2 = a + 0.08
        r = 2200
        d.polygon([(cx, cy), (cx + math.cos(a) * r, cy + math.sin(a) * r), (cx + math.cos(a2) * r, cy + math.sin(a2) * r)],
                  fill=(255, 210, 63, 14 if i % 2 else 22))
    # confete e brasas (sempre o mesmo desenho)
    rnd = random.Random(7)
    for _ in range(140):
        x, y = rnd.randrange(W), rnd.randrange(H)
        c = CORES[rnd.randrange(len(CORES))]
        t = rnd.choice([6, 8, 10])
        d.rectangle([x, y, x + t, y + t // 2 + 2], fill=c + (170,))
    return img


def moldura(img: Image.Image, peca: Image.Image, x: int, y: int) -> None:
    d = ImageDraw.Draw(img, "RGBA")
    w, h = peca.size
    d.rectangle([x - 4 + 14, y - 4 + 16, x + w + 4 + 14, y + h + 4 + 16], fill=(0, 0, 0, 120))  # sombra
    d.rectangle([x - 12, y - 12, x + w + 12, y + h + 12], fill=PRETO)
    d.rectangle([x - 8, y - 8, x + w + 8, y + h + 8], fill=OURO)
    d.rectangle([x - 3, y - 3, x + w + 3, y + h + 3], fill=PRETO)
    img.paste(peca, (x, y))


def main(pasta: Path, saida: Path) -> None:
    capa = Image.open(next(pasta.glob("*story_capa*.png"))).convert("RGB")
    cred = Image.open(next(pasta.glob("*story_creditos*.png"))).convert("RGB")
    # créditos: do título "CRÉDITOS" até o "OBRIGADO POR JOGAR!" (sem a logo repetida e o VOLTAR)
    cred = cred.crop((0, 84, cred.width, 456))

    img = fundo()
    d = ImageDraw.Draw(img, "RGBA")
    x = (W - capa.width) // 2

    y_capa = 250
    moldura(img, capa, x, y_capa)

    # faixa do meio: o convite
    y_meio = y_capa + capa.height + 42
    d.rectangle([0, y_meio, W, y_meio + 150], fill=(0, 0, 0, 110))
    d.rectangle([0, y_meio, W, y_meio + 6], fill=OURO)
    d.rectangle([0, y_meio + 144, W, y_meio + 150], fill=OURO)
    texto(d, W // 2, y_meio + 26, "TESTA AI!", 64, OURO, borda=6, sombra=8)
    # a fonte não tem o Í maiúsculo: o acento do "AÍ" vai desenhado à mão, em pixel
    f64 = fonte(64)
    cw = d.textlength("A", font=f64)
    x_i = W / 2 - d.textlength("TESTA AI!", font=f64) / 2 + 7 * cw + cw / 2
    acento = [(x_i - 2, y_meio + 10), (x_i + 16, y_meio - 6), (x_i + 26, y_meio + 2), (x_i + 8, y_meio + 18)]
    d.polygon([(px + 4, py + 4) for px, py in acento], fill=PRETO)
    d.polygon(acento, fill=OURO, outline=PRETO)
    texto(d, W // 2, y_meio + 108, "LUTA 2D - CELULAR, PC E ONLINE", 24, BRANCO, borda=3)

    y_cred = y_meio + 150 + 46
    moldura(img, cred, x, y_cred)

    # chamada final (acima da faixa que a interface do story cobre)
    y_cta = y_cred + cred.height + 46
    # setinhas desenhadas (a fonte não tem o triângulo)
    texto(d, W // 2, y_cta, "TOQUE NO LINK E JOGUE", 34, BRANCO, borda=4, sombra=5)
    for i, cx in enumerate([150, W - 150]):
        d.polygon([(cx - 22, y_cta + 4), (cx + 22, y_cta + 4), (cx, y_cta + 34)], fill=CORES[i])
    texto(d, W // 2, y_cta + 62, "paulomarcelli.github.io/Projetos", 22, OURO, borda=3)

    saida.parent.mkdir(parents=True, exist_ok=True)
    img.save(saida, optimize=True)
    print(saida, img.size, "rodapé livre a partir de y =", y_cta + 100)


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]) if len(sys.argv) > 2 else RAIZ / "docs" / "divulgacao" / "story.png")
