"""Converte os áudios de meme (enviados pelo usuário) para o jogo.

Uso:
    python3 ferramentas/memes_audio.py <pasta_com_os_mp3>

Para cada clipe da lista abaixo: corta o silêncio do começo, limita a duração (com fade no fim),
nivela o volume (loudnorm) e grava em OGG mono:
    audio/memes/<id>/<nome>.ogg     memes (a legenda de cada um fica em scripts/personagens.gd)
    audio/ultimate/<id>.ogg         trilha da Ultimate: o trecho mais forte da faixa
    audio/ultimate/trump_ymca.ogg   o YMCA do SUPER do Trump (e a batida, em BPM, para a dança)
    audio/cenario/recua.ogg         a torcida da USP
    audio/dilera/<nome>.ogg         o Dilera que aparece no canto da tela
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

RAIZ = Path(__file__).resolve().parent.parent
TAXA = 32000

# (pasta/arquivo de origem, destino, duração máxima em segundos)
MEMES = [
    ("lula/lula-cara-sem-dente.mp3", "memes/lula/cara_sem_dente", 7),
    ("lula/lula-por-favor-me-ajuda.mp3", "memes/lula/me_ajuda", 6),
    ("lula/lula-defende-meu-pai.mp3", "memes/lula/defende_meu_pai", 5),
    ("lula/lula-cade-o-ze-gotinha.mp3", "memes/lula/ze_gotinha", 5),
    ("lula/lula-feijao-puro.mp3", "memes/lula/feijao_puro", 8),
    ("lula/lula-pergunta-simples.mp3", "memes/lula/pergunta_simples", 8),
    ("lula/lula-vai-entrar-o-grosso.mp3", "memes/lula/vai_entrar_o_grosso", 8),
    ("lula/lula-vai-todo-mundo-se-fud3r.mp3", "memes/lula/todo_mundo", 6),
    ("lula/pergunta-pro-google.mp3", "memes/lula/pergunta_pro_google", 4),
    ("lula/ate-teu-pai-lula-2026.mp3", "memes/lula/ate_teu_pai", 8),
    ("bolsonaro/bolsonaro-imbroxavel.mp3", "memes/bolsonaro/imbrochavel", 9),
    ("bolsonaro/pop-corn-bolsonaro-falando-ingles.mp3", "memes/bolsonaro/pop_corn", 8),
    ("xandao/transparenciaaa.mp3", "memes/xandao/transparencia", 4),
    ("trump/trump-you-are-fake-news.mp3", "memes/trump/fake_news", 4),
    ("trump/thank-you-very-much-trump.mp3", "memes/trump/thank_you", 4),
    ("trump/donald-trump-wrong-sound-effect.mp3", "memes/trump/wrong", 4),
    ("trump/trump-i-love-tesler_5FwwWs1.mp3", "memes/trump/tesla", 4),
    ("trump/good-job_Bbr5WOK.mp3", "memes/trump/good_job", 4),
    ("dilma/dilma-oi-internautas.mp3", "memes/dilma/oi_internautas", 6),
    ("dilma/dilma-plmds-meu-querido.mp3", "memes/dilma/meu_querido", 5),
    ("dilma/dilma-porcaria-dessa-meta.mp3", "memes/dilma/porcaria_da_meta", 5),
    ("dilma/e-uma.mp3", "memes/dilma/e_uma", 4),
    ("dilma/dilma-ganhar-ou-perder.mp3", "memes/dilma/ganhar_ou_perder", 11),
    ("nikolas/chupetinha.mp3", "memes/nikolas/chupetinha", 6),
    ("nikolas/nikolas-oi-dani.mp3", "memes/nikolas/oi_dani", 4),
    ("nikolas/o-peruca.mp3", "memes/nikolas/o_peruca", 3),
    ("nikolas/pec-da-blinglagem.mp3", "memes/nikolas/pec_da_blindagem", 6),
    ("flavio/tem-bolsonaro-dentro-do-lula.mp3", "memes/flavio/bolsonaro_dentro_do_lula", 6),
    ("renan/renan-santos-verdades-lula.mp3", "memes/renan/verdades_lula", 9),
    ("renan/renan-santos-tranqueira.mp3", "memes/renan/tranqueira", 5),
    ("renan/eu-quero-chacinar-um-coletivo-de-traficantes.mp3", "memes/renan/coletivo_de_traficantes", 5),
    ("renan/prendeu-matou.mp3", "memes/renan/prendeu_matou", 3),
    ("renan/sao-faceis-porque-sao-pobres.mp3", "memes/renan/sao_pobres", 4),
    ("recua.mp3", "cenario/recua", 9.5),
    ("dilera/ai-paje.mp3", "dilera/ai_paje", 3),
    ("dilera/dilera-aiiiiinn-gugu.mp3", "dilera/aiiin_gugu", 4),
    ("dilera/dilera-guguu.mp3", "dilera/guguu", 3),
    ("dilera/dilera-oi-torto.mp3", "dilera/oi_torto", 4),
    ("dilera/dilera-careca-do-stf.mp3", "dilera/careca_do_stf", 6),
]
# trilhas: o trecho mais forte (janela de N segundos)
TRILHAS = [
    ("lula/trump-defende-meu-pai-ultimate.mp3", "ultimate/lula", 6.0),
    ("bolsonaro/vai-17-vai-17-ultimate.mp3", "ultimate/bolsonaro", 6.0),
    ("xandao/ministro-alexandre-de-moraes-ultimate.mp3", "ultimate/xandao", 6.0),
    ("nikolas/nikolas-ferreira-sendo-nikolas-ferreira-ultimate.mp3", "ultimate/nikolas", 6.0),
    ("dilma/dilma-estocando-o-vento-remix-qualidade-media1-ultimate.mp3", "ultimate/dilma", 6.0),
    ("trump/ymca-avc-ultimate.mp3", "ultimate/trump_ymca", 5.0),
]


def decodificar(arq: Path) -> np.ndarray:
    bruto = subprocess.run(["ffmpeg", "-v", "error", "-i", str(arq), "-ac", "1", "-ar", str(TAXA), "-f", "f32le", "-"],
                           check=True, capture_output=True).stdout
    return np.frombuffer(bruto, dtype=np.float32)


def gravar(arq: Path, destino: Path, inicio: float, dur: float, tirar_silencio: bool) -> None:
    destino.parent.mkdir(parents=True, exist_ok=True)
    filtros = []
    if tirar_silencio:
        filtros.append("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05")
    filtros += [f"atrim=0:{dur}", "asetpts=PTS-STARTPTS", f"afade=t=out:st={max(0.0, dur - 0.35):.2f}:d=0.35",
                "loudnorm=I=-15:TP=-1.5:LRA=11", f"aresample={TAXA}"]
    cmd = ["ffmpeg", "-v", "error", "-y", "-ss", f"{inicio:.3f}", "-i", str(arq), "-ac", "1", "-af", ",".join(filtros),
           "-c:a", "libvorbis", "-q:a", "3", str(destino)]
    subprocess.run(cmd, check=True)


def melhor_janela(sinal: np.ndarray, seg: float) -> float:
    """Início (s) da janela de seg segundos com mais energia (o refrão costuma ser o mais forte)."""
    passo = TAXA // 10
    energia = np.array([np.mean(sinal[i:i + passo] ** 2) for i in range(0, len(sinal) - passo, passo)])
    n = int(seg * 10)
    if len(energia) <= n:
        return 0.0
    soma = np.convolve(energia, np.ones(n), mode="valid")
    return float(np.argmax(soma)) / 10.0


def batida(sinal: np.ndarray) -> dict:
    """BPM e o instante da primeira batida (envelope de ataques + autocorrelação)."""
    janela = 512
    env = np.array([np.sqrt(np.mean(sinal[i:i + janela] ** 2)) for i in range(0, len(sinal) - janela, janela)])
    ataque = np.maximum(0.0, np.diff(env, prepend=env[0]))
    ataque -= ataque.mean()
    fps = TAXA / janela
    ac = np.correlate(ataque, ataque, mode="full")[len(ataque) - 1:]
    lags = np.arange(len(ac)) / fps
    validos = (lags > 60 / 170) & (lags < 60 / 80)
    lag = lags[validos][np.argmax(ac[validos])]
    bpm = 60.0 / lag
    periodo = int(round(lag * fps))
    fases = [ataque[f::periodo].sum() for f in range(periodo)]
    return {"bpm": round(bpm, 2), "primeira": round(int(np.argmax(fases)) / fps, 3)}


def main(origem: Path) -> None:
    info = {}
    for rel, dest, dur in MEMES:
        arq = origem / rel
        if not arq.exists():
            print("falta", rel)
            continue
        gravar(arq, RAIZ / "audio" / f"{dest}.ogg", 0.0, dur, True)
        print("ok", dest)
    for rel, dest, seg in TRILHAS:
        arq = origem / rel
        if not arq.exists():
            print("falta", rel)
            continue
        sinal = decodificar(arq)
        ini = melhor_janela(sinal, seg)
        gravar(arq, RAIZ / "audio" / f"{dest}.ogg", ini, seg, False)
        trecho = sinal[int(ini * TAXA):int((ini + seg) * TAXA)]
        info[dest] = {"inicio": ini, **batida(trecho)}
        print("ok", dest, info[dest])
    (RAIZ / "ferramentas" / "trilhas.json").write_text(json.dumps(info, indent=1))


if __name__ == "__main__":
    main(Path(sys.argv[1]))
