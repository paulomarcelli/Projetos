"""Monta o mini trailer vertical (1080x1920, ~30 s) para os stories.

Entrada: a gravação do jogo feita pelo Movie Maker do Godot (tests/trailer.gd), em quadros PNG de
480x270 a 60 fps e o som num WAV:
    xvfb-run godot --path . --rendering-driver opengl3 --resolution 1440x810 \
        --write-movie <pasta>/q.png --script res://tests/trailer.gd
Saída: docs/divulgacao/trailer.mp4 (H.264 + AAC, 30 fps), com:
  - o logo do jogo em cima (recortado da própria capa);
  - o jogo no meio, ampliado 2x sem borrar, com moldura dourada;
  - uma legenda por cena embaixo, na fonte pixel do jogo;
  - "LINK NOS STORIES" no rodapé, fora da faixa que a interface dos stories cobre.
Uso: python3 ferramentas/trailer.py <pasta_da_gravacao> [saida.mp4]
"""
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from story import CORES, OURO, PRETO, BRANCO, W, H, fonte, fundo, moldura, texto  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent

# (início, fim, legenda, cor) em segundos: casa com as cenas de tests/trailer.gd
LEGENDAS = [
    (0.0, 2.75, "A BRIGA MAIS POLARIZADA DO PAÍS", OURO),
    (2.75, 4.75, "LULA x BOLSONARO", BRANCO),
    (4.75, 9.75, "MEMES DE VERDADE NA LUTA", OURO),
    (9.75, 15.25, "TRUMP DANÇANDO YMCA", (126, 240, 255)),
    (15.25, 18.0, "O DILERA APARECE DO NADA", (255, 90, 78)),
    (18.0, 24.0, "ULTIMATE: PICANHA SUPREMA", OURO),
    (24.0, 28.0, "K.O.! E A VITÓRIA COM MÚSICA", BRANCO),
    (28.0, 31.0, "TESTA AÍ!", OURO),
]
JOGO = (60, 700, 960, 540)  # x, y, largura, altura do jogo no vídeo


def base(capa: Image.Image, saida: Path) -> None:
    """Fundo fixo: degradê com raios, o logo em cima, a moldura do jogo e o rodapé do link."""
    img = fundo()
    d = ImageDraw.Draw(img, "RGBA")
    # logo recortado da capa do jogo (480x270), ampliado 3x sem suavizar
    logo = capa.crop((60, 0, 420, 92)).resize((360 * 3 // 1, 92 * 3 // 1), Image.NEAREST)
    logo = logo.resize((1020, int(1020 * logo.height / logo.width)), Image.NEAREST)
    img.paste(logo, ((W - logo.width) // 2, 300))
    x, y, w, h = JOGO
    moldura(img, Image.new("RGB", (w, h), PRETO), x, y)
    texto(d, W // 2, 1560, "LINK NOS STORIES", 30, BRANCO, borda=4, sombra=5)
    for i, cx in enumerate([170, W - 170]):
        d.polygon([(cx - 20, 1562), (cx + 20, 1562), (cx, 1590)], fill=CORES[i])
    img.save(saida)


AGUDOS = {"Á": "A", "É": "E", "Í": "I", "Ó": "O", "Ú": "U"}


def texto_acentos(d: ImageDraw.ImageDraw, cx: int, y: int, txt: str, px: int, cor, borda: int, sombra: int) -> None:
    """A fonte troca as maiúsculas com acento agudo por minúsculas: escreve a letra sem acento
    e desenha o acento em cima, em pixel (a fonte é monoespaçada)."""
    limpo = "".join(AGUDOS.get(c, c) for c in txt)
    texto(d, cx, y, limpo, px, cor, borda=borda, sombra=sombra)
    f = fonte(px)
    cw = d.textlength("A", font=f)
    x0 = cx - d.textlength(limpo, font=f) / 2
    u = px / 8
    for i, c in enumerate(txt):
        if c in AGUDOS:
            xm = x0 + i * cw + cw / 2
            pts = [(xm - u, y - u * 0.5), (xm + u * 1.5, y - u * 2.5), (xm + u * 2.5, y - u * 1.5), (xm, y + u * 0.5)]
            d.polygon([(px_ + sombra * 0.5, py + sombra * 0.5) for px_, py in pts], fill=PRETO)
            d.polygon(pts, fill=cor, outline=PRETO)


def legenda(txt: str, cor, saida: Path) -> None:
    """Faixa da legenda (transparente fora dela)."""
    img = Image.new("RGBA", (W, 170), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    d.rectangle([0, 20, W, 150], fill=(0, 0, 0, 150))
    d.rectangle([0, 20, W, 26], fill=OURO)
    d.rectangle([0, 144, W, 150], fill=OURO)
    px = 44
    while px > 20 and d.textlength(txt, font=fonte(px)) > W - 80:
        px -= 2
    texto_acentos(d, W // 2, 85 - px // 2, txt, px, cor, borda=5, sombra=6)
    img.save(saida)


def main(pasta: Path, saida: Path) -> None:
    capa = Image.open(pasta / "q00000060.png").convert("RGB")
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        base(capa, tmp / "base.png")
        entradas = ["-loop", "1", "-framerate", "30", "-i", str(tmp / "base.png"),
                    "-framerate", "60", "-i", str(pasta / "q%08d.png"),
                    "-i", str(pasta / "q.wav")]
        for i, (_, _, txt, cor) in enumerate(LEGENDAS):
            legenda(txt, cor, tmp / f"leg{i}.png")
            entradas += ["-i", str(tmp / f"leg{i}.png")]
        x, y, w, h = JOGO
        filtros = [f"[1:v]fps=30,scale={w}:{h}:flags=neighbor[jogo]", f"[0:v][jogo]overlay={x}:{y}:shortest=1[v0]"]
        ult = "v0"
        for i, (a, b, _, _) in enumerate(LEGENDAS):
            filtros.append(f"[{ult}][{i + 3}:v]overlay=0:1290:enable='between(t,{a},{b})'[v{i + 1}]")
            ult = f"v{i + 1}"
        saida.parent.mkdir(parents=True, exist_ok=True)
        cmd = ["ffmpeg", "-v", "error", "-y", *entradas, "-filter_complex", ";".join(filtros),
               "-map", f"[{ult}]", "-map", "2:a", "-c:v", "libx264", "-preset", "slow", "-crf", "20",
               "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac", "-b:a", "160k", "-af", "afade=t=out:st=29.2:d=1.3",
               "-movflags", "+faststart", "-shortest", str(saida)]
        subprocess.run(cmd, check=True)
    print(saida)


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]) if len(sys.argv) > 2 else RAIZ / "docs" / "divulgacao" / "trailer.mp4")
