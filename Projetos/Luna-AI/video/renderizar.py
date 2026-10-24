"""Renderiza o vídeo da Luna: desenha cada quadro no Chromium e monta o MP4 com o FFmpeg.

Uso (na pasta Luna-AI):
    python video/renderizar.py                              # vídeo completo em video/saida/luna-ai.mp4
    python video/renderizar.py --narracao minha_voz.wav     # mistura uma narração gravada (a música abaixa sozinha)
    python video/renderizar.py --sem-legendas               # sem legendas na imagem (ex.: quando houver narração)
    python video/renderizar.py --trilha musica.mp3          # usa outra música (some junto com o fim do vídeo)
    python video/renderizar.py --so-audio --trilha musica.mp3 --saida outro.mp4  # troca só o áudio do vídeo já renderizado
    python video/renderizar.py --inicio 28 --fim 60         # só um trecho, para conferir
    python video/renderizar.py --quadros 5 40.5 150         # só imagens PNG desses segundos

Precisa de: playwright (com Chromium) e ffmpeg. A trilha é gerada por video/gerar_trilha.py.
"""

import argparse
import functools
import http.server
import json
import shutil
import socketserver
import subprocess
import threading
from pathlib import Path

PASTA_VIDEO = Path(__file__).resolve().parent
RAIZ = PASTA_VIDEO.parent            # Luna-AI (o palco usa ../web/logo.png)
SAIDA = PASTA_VIDEO / "saida"


class Silencioso(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def servir():
    servidor = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Silencioso, directory=str(RAIZ)))
    threading.Thread(target=servidor.serve_forever, daemon=True).start()
    return servidor, f"http://127.0.0.1:{servidor.server_address[1]}/video/cenas.html"


def abrir_palco(pw, url):
    navegador = pw.chromium.launch()
    pagina = navegador.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
    pagina.goto(url)
    info = pagina.evaluate("window.pronto")
    return navegador, pagina, info


def escrever_srt(roteiro, destino):
    def ts(s):
        ms = round(s * 1000)
        return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
    linhas = []
    for i, leg in enumerate(roteiro["legendas"], 1):
        linhas += [str(i), f"{ts(leg['inicio'])} --> {ts(leg['fim'])}", leg["texto"], ""]
    destino.write_text("\n".join(linhas), encoding="utf-8")


def main():
    from playwright.sync_api import sync_playwright

    p = argparse.ArgumentParser()
    p.add_argument("--inicio", type=float, default=0)
    p.add_argument("--fim", type=float)
    p.add_argument("--quadros", type=float, nargs="*")
    p.add_argument("--narracao", type=Path)
    p.add_argument("--trilha", type=Path, help="outra música no lugar da trilha gerada")
    p.add_argument("--trilha-inicio", type=float, default=0, help="segundo da música em que o vídeo começa")
    p.add_argument("--so-audio", action="store_true", help="reaproveita a imagem de um vídeo já renderizado (--de)")
    p.add_argument("--de", type=Path, default=SAIDA / "luna-ai.mp4", help="vídeo de origem para --so-audio")
    p.add_argument("--sem-legendas", action="store_true")
    p.add_argument("--saida", type=Path, default=SAIDA / "luna-ai.mp4")
    a = p.parse_args()

    roteiro = json.loads((PASTA_VIDEO / "roteiro.json").read_text(encoding="utf-8"))
    SAIDA.mkdir(exist_ok=True)
    escrever_srt(roteiro, PASTA_VIDEO / "legendas.srt")
    servidor, url = servir()
    if a.sem_legendas:
        url += "?sem-legendas"

    if a.so_audio:
        video_mudo = SAIDA / "_imagem.mp4"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(a.de), "-map", "0:v", "-c", "copy", str(video_mudo)], check=True)
        fim = a.fim if a.fim is not None else roteiro["duracao"]
        juntar_audio(a, video_mudo, fim)
        servidor.shutdown()
        return

    with sync_playwright() as pw:
        navegador, pagina, info = abrir_palco(pw, url)
        fps = info["fps"]
        if a.quadros is not None:  # só fotos
            for t in a.quadros:
                pagina.evaluate(f"renderizar({t})")
                pagina.screenshot(path=SAIDA / f"quadro-{t:06.2f}.png")
            print("Quadros em", SAIDA)
            navegador.close()
            servidor.shutdown()
            return

        fim = a.fim if a.fim is not None else info["duracao"]
        total = round((fim - a.inicio) * fps)
        video_mudo = SAIDA / "_imagem.mp4"
        ffmpeg = subprocess.Popen(
            ["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(fps), "-c:v", "mjpeg", "-i", "-",
             "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(video_mudo)],
            stdin=subprocess.PIPE)
        for q in range(total):
            t = a.inicio + q / fps
            pagina.evaluate(f"renderizar({t:.5f})")
            ffmpeg.stdin.write(pagina.screenshot(type="jpeg", quality=93))
            if q % (fps * 10) == 0:
                print(f"  {t:6.1f}s / {fim:.0f}s", flush=True)
        ffmpeg.stdin.close()
        ffmpeg.wait()
        navegador.close()
    servidor.shutdown()
    juntar_audio(a, video_mudo, fim)


def juntar_audio(a, video_mudo, fim):
    """Trilha (e narração, se houver), cortada no mesmo trecho da imagem."""
    trilha = a.trilha or PASTA_VIDEO / "audio" / "trilha.wav"
    if not trilha.exists():
        subprocess.run(["python3", str(PASTA_VIDEO / "gerar_trilha.py")], check=True)
    dur = fim - a.inicio
    entradas = ["-i", str(video_mudo), "-ss", str(a.inicio + a.trilha_inicio), "-t", str(dur), "-i", str(trilha)]
    # música escolhida pela pessoa: entra sem estalo e some junto com o escurecimento final
    musica = f"[1:a]aresample=48000,aformat=channel_layouts=stereo,afade=t=in:d=0.4,afade=t=out:st={max(0, dur - 4.5):.2f}:d=4.5" if a.trilha else "[1:a]anull"
    if a.narracao:
        entradas += ["-ss", str(a.inicio), "-t", str(dur), "-i", str(a.narracao)]
        filtro = ("[2:a]aresample=48000,aformat=channel_layouts=stereo,loudnorm=I=-16:TP=-1.5:LRA=11[voz];"
                  "[voz]asplit[voz1][voz2];"
                  f"{musica}[m];[m][voz2]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[musica];"
                  "[musica][voz1]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]")
    else:
        filtro = f"{musica},loudnorm=I={-16 if a.trilha else -18}:TP=-1.5:LRA=11[a]"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *entradas, "-filter_complex", filtro, "-map", "0:v", "-map", "[a]",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", "-movflags", "+faststart", str(a.saida)], check=True)
    video_mudo.unlink()
    shutil.copy(PASTA_VIDEO / "legendas.srt", a.saida.with_suffix(".srt"))
    print("Vídeo pronto:", a.saida)


if __name__ == "__main__":
    main()
