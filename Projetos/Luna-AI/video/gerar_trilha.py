"""Gera a trilha do vídeo: música ambiente ORIGINAL, sintetizada aqui (sem amostras nem músicas de terceiros).

Acordes lentos em Ré maior, sinos esparsos e um arpejo suave que entra nas cenas
técnicas e sai nas cenas mais reflexivas. As seções seguem os tempos do roteiro.json.

Rodar na pasta Luna-AI:  python video/gerar_trilha.py   (gera video/audio/trilha.wav)
"""

import json
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

PASTA = Path(__file__).resolve().parent
SR = 48000
rng = np.random.default_rng(11)


def nota(nome):
    tons = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4, "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}
    return 440.0 * 2 ** ((tons[nome[:-1]] + 12 * (int(nome[-1]) - 4)) / 12)


ACORDES = [  # Dmaj9 · Bm11 · Gmaj7(#11) · A(add9)
    ["D3", "F#3", "A3", "C#4", "E4"],
    ["B2", "D3", "F#3", "A3", "E4"],
    ["G2", "D3", "F#3", "B3", "C#4"],
    ["A2", "E3", "A3", "B3", "C#4"],
]
FINAL = ["D2", "A2", "D3", "F#3", "A3", "E4"]


def envelope(n, ataque, soltura):
    e = np.ones(n)
    a, r = int(ataque * SR), int(soltura * SR)
    e[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    e[-r:] *= np.cos(np.linspace(0, np.pi / 2, r)) ** 2
    return e


def pad(freqs, dur, brilho):
    n = int(dur * SR)
    t = np.arange(n) / SR
    saida = np.zeros((n, 2))
    for i, f in enumerate(freqs):
        for desafino, lado in ((-4, 0.35), (4, 0.65)):        # duas vozes levemente desafinadas, abertas no estéreo
            fd = f * 2 ** (desafino / 1200)
            onda = np.zeros(n)
            for k in range(1, 8):
                onda += np.sin(2 * np.pi * fd * k * t + rng.uniform(0, 6.28)) * (1 / k ** 1.5) * np.exp(-k / brilho)
            vib = 1 + 0.08 * np.sin(2 * np.pi * (0.07 + 0.02 * i) * t + i)   # respiração lenta
            saida[:, 0] += onda * vib * (1 - lado)
            saida[:, 1] += onda * vib * lado
    return saida * envelope(n, 2.8, 3.2)[:, None] / len(freqs)


def sino(f, dur=4.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * d) for r, a, d in ((1, 1, 1.1), (2.76, 0.35, 2.4), (5.4, 0.12, 4.0)))
    return s * np.minimum(1, t / 0.015)          # ataque de 15 ms: macio, sem estalo


def pluck(f, dur=0.9):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 6.5)
    return s * np.minimum(1, t / 0.008)


def somar(mix, sinal, inicio, ganho, pan=0.5):
    i = int(inicio * SR)
    if i >= len(mix):
        return
    sinal = sinal[: len(mix) - i]
    if sinal.ndim == 1:
        mix[i:i + len(sinal), 0] += sinal * ganho * (1 - pan)
        mix[i:i + len(sinal), 1] += sinal * ganho * pan
    else:
        mix[i:i + len(sinal)] += sinal * ganho


def main():
    roteiro = json.loads((PASTA / "roteiro.json").read_text(encoding="utf-8"))
    dur = roteiro["duracao"] + 1.0
    cena = {c["id"]: (c["inicio"], c["fim"]) for c in roteiro["cenas"]}
    mix = np.zeros((int(dur * SR), 2))

    # 1) acordes: um a cada 8 s, sobrepostos; mais escuro na abertura e na segurança
    passo, t, k = 8.0, 0.0, 0
    while t < cena["encerramento"][0] + 4:
        brilho = 1.6 if t < 10 or cena["seguranca"][0] <= t < cena["seguranca"][1] else 2.6
        freqs = [nota(n) for n in ACORDES[k % 4]]
        if cena["seguranca"][0] <= t < cena["seguranca"][1]:
            freqs = [f / 2 if f > 300 else f for f in freqs]       # registro mais grave, mais sério
        somar(mix, pad(freqs, passo + 4.5, brilho), t, 0.55)
        t += passo
        k += 1
    somar(mix, pad([nota(n) for n in FINAL], 14, 2.8), 162.5, 0.6)  # resolução em Ré maior no encerramento

    # 2) arpejo suave nas cenas técnicas (dados "andando")
    batida = 60 / 72 / 2
    for inicio, fim, ganho in ((cena["arquitetura"][0] + 2, cena["mensagem"][1] - 1, 0.16), (cena["voz"][0] + 1, cena["voz"][1] - 2, 0.11)):
        t, i = inicio, 0
        while t < fim:
            acorde = ACORDES[int(t // passo) % 4]
            f = nota(acorde[[0, 2, 3, 4, 3, 2][i % 6]]) * 2
            entrada = min(1, (t - inicio) / 4) * min(1, (fim - t) / 3)
            somar(mix, pluck(f), t, ganho * entrada * (0.75 + 0.25 * rng.random()), pan=0.3 + 0.4 * rng.random())
            t += batida
            i += 1

    # 3) sinos esparsos: no título, nas cenas reflexivas e no fim
    pentatonica = [nota(n) for n in ("D5", "F#5", "A5", "B5", "E5", "A4")]
    for inicio, fim, densidade in ((3.0, 12, 0.5), (cena["instrucoes"][0], cena["instrucoes"][1], 0.35), (cena["encerramento"][0], 172, 0.45)):
        t = inicio
        while t < fim:
            somar(mix, sino(pentatonica[rng.integers(len(pentatonica))]), t, 0.10, pan=rng.uniform(0.2, 0.8))
            t += rng.uniform(1.2, 2.6) / densidade

    # 4) reverb: cauda de 3,5 s feita de ruído que decai (estéreo descorrelacionado)
    n_ir = int(3.5 * SR)
    decai = np.exp(-np.arange(n_ir) / SR * 2.2)
    sos = butter(4, 5500, "low", fs=SR, output="sos")
    molhado = np.zeros_like(mix)
    for c in range(2):
        ir = sosfilt(sos, rng.standard_normal(n_ir)) * decai
        ir /= np.sqrt(np.sum(ir ** 2))
        molhado[:, c] = fftconvolve(mix[:, c], ir)[: len(mix)]
    mix = 0.72 * mix + 0.42 * molhado
    mix = sosfilt(butter(2, 35, "high", fs=SR, output="sos"), mix, axis=0)   # tira graves inaudíveis

    # 5) entrada e saída suaves, pico em -1 dBFS
    n = len(mix)
    mix[: int(4 * SR)] *= np.linspace(0, 1, int(4 * SR))[:, None] ** 2
    cauda = int(5 * SR)
    mix[n - cauda:] *= np.linspace(1, 0, cauda)[:, None] ** 1.5
    mix *= 10 ** (-1 / 20) / np.max(np.abs(mix))
    (PASTA / "audio").mkdir(exist_ok=True)
    wavfile.write(PASTA / "audio" / "trilha.wav", SR, (mix * 32767).astype(np.int16))
    print("Trilha em", PASTA / "audio" / "trilha.wav", f"({n / SR:.1f} s)")


if __name__ == "__main__":
    main()
