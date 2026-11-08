"""Recorta a foto do Dilera (fotos/dilera.jpg) para o "aparece do nada" da luta: sprites/dilera.png.

Tira o fundo (rembg, o mesmo dos rostos), enquadra do peito para cima, reduz para ~300 px de
altura e põe um contorno escuro de 3 px, no estilo das cabeças do jogo.
Uso: python3 ferramentas/dilera.py
"""
from pathlib import Path

from PIL import Image, ImageFilter

RAIZ = Path(__file__).resolve().parent.parent


def main() -> None:
    from rembg import new_session, remove

    foto = Image.open(RAIZ / "fotos" / "dilera.jpg").convert("RGB")
    sem = remove(foto, session=new_session("u2net_human_seg")).convert("RGBA")
    caixa = sem.getchannel("A").point(lambda a: 255 if a > 40 else 0).getbbox()
    sem = sem.crop(caixa)
    alt = 300
    sem = sem.resize((round(sem.width * alt / sem.height), alt), Image.LANCZOS)
    # contorno: a silhueta engordada em preto por baixo
    pad = 4
    tela = Image.new("RGBA", (sem.width + pad * 2, sem.height + pad), (0, 0, 0, 0))
    alfa = sem.getchannel("A").point(lambda a: 255 if a > 100 else 0)
    borda = Image.new("L", tela.size, 0)
    borda.paste(alfa, (pad, pad))
    borda = borda.filter(ImageFilter.MaxFilter(7))
    tela.paste(Image.new("RGBA", tela.size, (20, 12, 28, 255)), (0, 0), borda)
    tela.alpha_composite(sem, (pad, pad))
    tela.save(RAIZ / "sprites" / "dilera.png")
    print("sprites/dilera.png", tela.size)


if __name__ == "__main__":
    main()
