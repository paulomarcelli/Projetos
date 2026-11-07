"""Gera todo o áudio do jogo por síntese (nada gravado, nada copiado).

Uso:
    python3 ferramentas/sons.py

Saída (ogg vorbis, mono, 22 050 Hz):
    audio/sfx/<nome>.ogg        golpes, impactos, poderes, menus
    audio/vozes/<id>/<nome>.ogg grunhidos caricatos de cada lutador (voz sintética, não imita ninguém)
    audio/musica/<nome>.ogg     trilhas chiptune originais em loop
"""
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, lfilter

SR = 22050
RAIZ = Path(__file__).resolve().parent.parent
rng = np.random.default_rng(7)


# ------------------------------------------------------------------ blocos básicos

def t_(dur):
    return np.arange(int(SR * dur)) / SR


def env(n, a=0.005, d=0.1, s=0.0, r=0.05, total=None):
    """Envelope ADSR com n amostras."""
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    e = np.zeros(n)
    i = 0
    seg = min(a, n)
    e[:seg] = np.linspace(0, 1, seg, endpoint=False) if seg else 0
    i = seg
    seg = min(d, n - i)
    e[i:i + seg] = np.linspace(1, s, seg, endpoint=False)
    i += seg
    sustain_end = max(i, n - r)
    e[i:sustain_end] = s
    seg = n - sustain_end
    if seg > 0:
        e[sustain_end:] = np.linspace(s if sustain_end > 0 else 1, 0, seg)
    return e


def decai(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def ruido(dur):
    return rng.uniform(-1, 1, int(SR * dur))


def passa(sig, f, tipo="low", ordem=2):
    f = float(np.clip(f, 30, SR / 2 - 100))
    b, a = butter(ordem, f / (SR / 2), btype=tipo)
    return lfilter(b, a, sig)


def lp_var(sig, freqs):
    """Passa-baixa de um polo com corte variando no tempo (varreduras de ruído)."""
    freqs = np.resize(np.asarray(freqs, dtype=float), len(sig))
    k = 1 - np.exp(-2 * np.pi * np.clip(freqs, 20, SR / 2) / SR)
    out = np.zeros(len(sig))
    y = 0.0
    for i in range(len(sig)):
        y += k[i] * (sig[i] - y)
        out[i] = y
    return out


def banda(sig, lo, hi, ordem=2):
    b, a = butter(ordem, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], btype="band")
    return lfilter(b, a, sig)


def osc(freq, dur, forma="sen", duty=0.5):
    """freq pode ser número ou array (varredura)."""
    n = int(SR * dur)
    f = np.full(n, freq) if np.isscalar(freq) else np.asarray(freq)[:n]
    fase = np.cumsum(f) / SR
    fr = fase % 1.0
    if forma == "sen":
        return np.sin(2 * np.pi * fase)
    if forma == "quad":
        return np.where(fr < duty, 1.0, -1.0)
    if forma == "tri":
        return 4 * np.abs(fr - 0.5) - 1
    if forma == "serra":
        return 2 * fr - 1
    raise ValueError(forma)


def varre(f0, f1, dur, curva=2.0):
    n = int(SR * dur)
    k = np.linspace(0, 1, n) ** curva
    return f0 + (f1 - f0) * k


def bitcrush(sig, bits=6):
    q = 2 ** bits
    return np.round(sig * q) / q


def mix(*partes):
    n = max(len(p) for p in partes)
    out = np.zeros(n)
    for p in partes:
        out[:len(p)] += p
    return out


def seq(*partes, gap=0.0):
    out = []
    for p in partes:
        out.append(p)
        if gap:
            out.append(np.zeros(int(gap * SR)))
    return np.concatenate(out)


def eco(sig, atraso=0.09, ganho=0.35, n=3):
    d = int(atraso * SR)
    out = np.concatenate([sig, np.zeros(d * n)])
    for k in range(1, n + 1):
        out[d * k:d * k + len(sig)] += sig * ganho ** k
    return out


def normaliza(sig, pico=0.9):
    m = np.max(np.abs(sig)) or 1.0
    return sig / m * pico


def salvar(sig, caminho, q=3):
    caminho = RAIZ / caminho
    caminho.parent.mkdir(parents=True, exist_ok=True)
    sig = np.clip(normaliza(sig), -1, 1)
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "x.wav"
        wavfile.write(wav, SR, (sig * 32767).astype(np.int16))
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-c:a", "libvorbis", "-q:a", str(q), str(caminho)], check=True)


# ------------------------------------------------------------------ efeitos

def golpe(peso):
    """Soco/chute: estalo de ruído + baque grave. peso 0 (fraco) a 1 (forte)."""
    dur = 0.12 + 0.18 * peso
    n = int(SR * dur)
    estalo = banda(ruido(dur), 900 + 1500 * (1 - peso), 5000) * decai(n, 0.012 + 0.01 * peso)
    baque = osc(varre(180 - 60 * peso, 45, dur, 0.6), dur) * decai(n, 0.05 + 0.06 * peso)
    return bitcrush(estalo * 0.9 + baque * (0.7 + 0.6 * peso), 7)


def whoosh(dur=0.18, f0=500, f1=2500):
    n = int(SR * dur)
    r = ruido(dur)
    out = np.zeros(n)
    bloco = 256
    for i in range(0, n, bloco):
        k = i / n
        f = f0 + (f1 - f0) * np.sin(np.pi * k)
        out[i:i + bloco] = banda(r[max(0, i - 512):i + bloco], f * 0.7, f * 1.4)[-len(out[i:i + bloco]):]
    return out * np.sin(np.linspace(0, np.pi, n)) ** 1.5


def explosao(dur=0.9, grave=60):
    n = int(SR * dur)
    r = lp_var(ruido(dur), varre(4000, 200, dur, 0.5)) * 2.5
    boom = osc(varre(grave * 2, grave * 0.5, dur, 0.4), dur) * decai(n, 0.25)
    return bitcrush((r * decai(n, 0.22) + boom * 1.2), 6)


def arpejo(notas, passo=0.05, forma="quad", duty=0.25, cauda=0.0):
    partes = []
    for f in notas:
        s = osc(f, passo, forma, duty) * env(int(SR * passo), 0.002, passo * 0.8, 0.3, 0.01)
        partes.append(s)
    out = np.concatenate(partes)
    if cauda:
        out = eco(out, cauda, 0.4, 3)
    return out


def nota(n):
    """MIDI -> Hz"""
    return 440.0 * 2 ** ((n - 69) / 12)


def efeitos():
    s = {}
    s["soco_fraco"] = golpe(0.1)
    s["soco_forte"] = golpe(0.75)
    s["chute"] = golpe(0.45)
    s["chute_forte"] = mix(golpe(0.95), whoosh(0.12, 300, 900) * 0.3)
    s["impacto"] = mix(golpe(1.0), explosao(0.35, 70) * 0.5)
    bl = banda(ruido(0.12), 1500, 6000) * decai(int(SR * 0.12), 0.02)
    s["bloqueio"] = mix(bl, osc(1200, 0.12, "quad", 0.3) * decai(int(SR * 0.12), 0.015) * 0.4)
    s["contra"] = eco(mix(osc(1568, 0.25, "quad", 0.25), osc(2093, 0.25, "quad", 0.5) * 0.5) * decai(int(SR * 0.25), 0.07), 0.07, 0.4, 3)
    s["whoosh"] = whoosh(0.16, 600, 2200)
    s["whoosh_forte"] = whoosh(0.26, 300, 1600)
    s["pulo"] = osc(varre(220, 660, 0.14, 0.7), 0.14, "quad", 0.25) * env(int(SR * 0.14), 0.003, 0.12, 0, 0.02) * 0.6
    s["aterrissa"] = osc(varre(120, 50, 0.1), 0.1) * decai(int(SR * 0.1), 0.03) + banda(ruido(0.1), 200, 900) * decai(int(SR * 0.1), 0.02) * 0.4
    s["dash"] = mix(whoosh(0.2, 800, 3000), banda(ruido(0.2), 100, 500) * decai(int(SR * 0.2), 0.06) * 0.5)
    s["queda"] = mix(osc(varre(90, 35, 0.4), 0.4) * decai(int(SR * 0.4), 0.12), banda(ruido(0.4), 120, 1000) * decai(int(SR * 0.4), 0.1) * 0.7)
    s["agarrao"] = mix(banda(ruido(0.1), 300, 2000) * decai(int(SR * 0.1), 0.03), osc(160, 0.1, "quad", 0.5) * decai(int(SR * 0.1), 0.04) * 0.4)
    s["arremesso"] = seq(whoosh(0.25, 400, 1800), s["queda"])
    s["ko"] = eco(mix(explosao(1.2, 50), golpe(1.0)), 0.16, 0.45, 4)
    s["projetil"] = mix(osc(varre(1400, 300, 0.22, 0.5), 0.22, "quad", 0.25) * env(int(SR * 0.22), 0.002, 0.2, 0, 0.02), whoosh(0.22) * 0.3)
    s["explosao"] = explosao(0.9)
    s["energia_cheia"] = arpejo([nota(n) for n in [72, 76, 79, 84, 88, 91, 96]], 0.045, cauda=0.08)
    sobe = osc(varre(110, 880, 0.6, 1.5), 0.6, "serra") * env(int(SR * 0.6), 0.05, 0.5, 0.4, 0.1)
    s["super"] = mix(passa(sobe, 3000), arpejo([nota(n) for n in [60, 67, 72, 79, 84]], 0.06, "quad", 0.5) * 0.5, banda(ruido(0.6), 2000, 8000) * np.linspace(0, 0.3, int(SR * 0.6)))
    s["ultimate"] = eco(mix(passa(osc(varre(55, 440, 1.2, 2.0), 1.2, "serra"), 2500) * env(int(SR * 1.2), 0.2, 0.8, 0.6, 0.2), osc(55, 1.2, "quad", 0.5) * 0.4 * env(int(SR * 1.2), 0.3, 0.6, 0.5, 0.3), explosao(1.2, 40) * np.linspace(0, 1, int(SR * 1.2)) ** 3), 0.12, 0.35, 3)
    s["sem_energia"] = seq(osc(140, 0.09, "quad", 0.5) * 0.6, osc(110, 0.14, "quad", 0.5) * 0.6, gap=0.03)
    s["recarga"] = osc(880, 0.04, "quad", 0.25) * 0.4
    s["menu_mover"] = osc(1046, 0.04, "quad", 0.25) * env(int(SR * 0.04), 0.001, 0.03, 0, 0.005) * 0.5
    s["menu_ok"] = arpejo([nota(n) for n in [72, 79, 84]], 0.05)
    s["menu_voltar"] = arpejo([nota(n) for n in [79, 72]], 0.05)
    gong = mix(*[osc(f, 1.4) * decai(int(SR * 1.4), 0.5 / (k + 1)) * (0.8 / (k + 1)) for k, f in enumerate([110, 163, 237, 331, 452])])
    s["round"] = mix(gong, golpe(0.8) * 0.6)
    s["lute"] = mix(arpejo([nota(n) for n in [60, 64, 67, 72]], 0.06, "quad", 0.5), explosao(0.5, 80) * 0.4)
    melodia = [72, 76, 79, 84, 79, 84, 88]
    s["vitoria"] = eco(arpejo([nota(n) for n in melodia], 0.11, "quad", 0.5), 0.12, 0.3, 2)
    s["derrota"] = arpejo([nota(n) for n in [67, 63, 60, 55, 48]], 0.16, "tri")
    s["multidao"] = banda(ruido(1.6), 400, 2500) * env(int(SR * 1.6), 0.3, 0.6, 0.5, 0.6)
    # assinaturas dos poderes
    chiado = banda(ruido(1.0), 2500, 9000) * (0.6 + 0.4 * np.abs(np.sin(np.arange(int(SR * 1.0)) / SR * 37)))
    s["churrasco"] = chiado * env(int(SR * 1.0), 0.05, 0.3, 0.7, 0.3)
    motor = osc(varre(70, 140, 0.9, 0.7), 0.9, "quad", 0.3)
    s["moto"] = passa(motor * (0.7 + 0.3 * osc(23, 0.9)), 1800) * env(int(SR * 0.9), 0.05, 0.2, 0.8, 0.2)
    jato = lp_var(ruido(1.6), np.concatenate([varre(300, 3000, 0.9, 1.0), varre(3000, 400, 0.7, 0.6)])) * 2.5
    s["caca"] = mix(jato * np.resize(np.concatenate([np.linspace(0, 1, int(SR * 0.9)), np.linspace(1, 0, int(SR * 0.7))]), len(jato)), osc(varre(900, 300, 1.6, 1), 1.6, "serra") * 0.15)
    s["martelo"] = mix(osc(varre(160, 60, 0.3), 0.3) * decai(int(SR * 0.3), 0.06), banda(ruido(0.3), 600, 3000) * decai(int(SR * 0.3), 0.015), osc(420, 0.3, "tri") * decai(int(SR * 0.3), 0.04) * 0.4)
    s["carimbo"] = mix(golpe(0.6), osc(300, 0.15, "quad", 0.5) * decai(int(SR * 0.15), 0.03) * 0.3)
    s["notificacao"] = seq(osc(1318, 0.07, "quad", 0.25) * decai(int(SR * 0.07), 0.03), osc(1760, 0.12, "quad", 0.25) * decai(int(SR * 0.12), 0.04))
    s["microfone"] = mix(osc(varre(2200, 3200, 0.5, 1), 0.5) * env(int(SR * 0.5), 0.15, 0.2, 0.6, 0.1) * 0.5, explosao(0.5, 90) * np.linspace(0, 1, int(SR * 0.5)) ** 4)
    kick = osc(varre(160, 45, 0.12, 0.5), 0.12) * decai(int(SR * 0.12), 0.05)
    hat = banda(ruido(0.05), 6000, 10000) * decai(int(SR * 0.05), 0.01) * 0.4
    s["danca"] = seq(*([mix(kick, arpejo([nota(76)], 0.1, "quad", 0.25) * 0.4), hat, kick, hat] * 2))
    s["fuzil"] = seq(*[mix(osc(varre(900, 200, 0.07), 0.07, "quad", 0.5) * decai(int(SR * 0.07), 0.02), banda(ruido(0.07), 1000, 5000) * decai(int(SR * 0.07), 0.01) * 0.6) for _ in range(3)], gap=0.04)
    vidro = mix(*[osc(f, 0.4) * decai(int(SR * 0.4), 0.08) * 0.3 for f in [2637, 3520, 4186]])
    bolha = mix(*[np.pad(osc(varre(300 + 200 * k, 900 + 200 * k, 0.06), 0.06) * 0.3, (int(SR * (0.1 + 0.07 * k)), 0)) for k in range(5)])
    s["frasco"] = mix(vidro, banda(ruido(0.4), 3000, 9000) * decai(int(SR * 0.4), 0.03), bolha)
    s["papel"] = banda(ruido(0.3), 1500, 7000) * (np.abs(np.sin(np.arange(int(SR * 0.3)) / SR * 40)) ** 2) * env(int(SR * 0.3), 0.02, 0.2, 0.3, 0.05)
    s["cabelo"] = osc(varre(200, 800, 0.35, 0.5) + 60 * np.sin(np.arange(int(SR * 0.35)) / SR * 2 * np.pi * 18), 0.35, "tri") * env(int(SR * 0.35), 0.005, 0.3, 0, 0.04)
    s["discurso"] = mix(*[osc(varre(300, 180, 0.6, 1.0), 0.6, "quad", 0.3) * (0.5 + 0.5 * np.sign(np.sin(np.arange(int(SR * 0.6)) / SR * 2 * np.pi * 7))) * 0.4, whoosh(0.6, 200, 900) * 0.5])
    s["helicoptero"] = banda(ruido(1.5), 80, 600) * (0.5 + 0.5 * np.abs(np.sin(np.arange(int(SR * 1.5)) / SR * 2 * np.pi * 11))) * env(int(SR * 1.5), 0.4, 0.5, 0.8, 0.5)
    for nome, sig in s.items():
        salvar(sig, f"audio/sfx/{nome}.ogg")
    return list(s)


# ------------------------------------------------------------------ vozes caricatas
# Fonte (pulsos glotais) + filtro de formantes. Cada lutador tem altura, timbre e jeito próprios,
# no estilo das vozes curtas dos fliperamas: "rá!", "uôu!", "ai!". Não imita a voz de ninguém.

VOGAIS = {"a": (800, 1200, 2500), "e": (500, 1800, 2500), "i": (300, 2200, 2900), "o": (500, 900, 2400), "u": (350, 700, 2300)}

PERFIS = {
    "lula": {"f0": 105, "rouco": 0.45, "formante": 0.92, "vib": 5.0},
    "bolsonaro": {"f0": 135, "rouco": 0.18, "formante": 1.05, "vib": 3.0},
    "trump": {"f0": 120, "rouco": 0.22, "formante": 0.98, "vib": 4.0},
    "xandao": {"f0": 92, "rouco": 0.12, "formante": 0.9, "vib": 2.0},
    "eduarda": {"f0": 235, "rouco": 0.08, "formante": 1.18, "vib": 6.0},
    "erika": {"f0": 200, "rouco": 0.1, "formante": 1.1, "vib": 4.5},
}


def silaba(perfil, vogal, dur, f_ini=1.0, f_fim=1.0, forca=1.0, consoante=None):
    n = int(SR * dur)
    f0 = perfil["f0"] * np.linspace(f_ini, f_fim, n)
    f0 = f0 * (1 + 0.012 * np.sin(np.arange(n) / SR * 2 * np.pi * perfil["vib"])) * (1 + 0.004 * rng.standard_normal(n))
    fonte = osc(f0, dur, "serra") * 0.7 + osc(f0, dur, "quad", 0.3) * 0.3
    fonte += ruido(dur) * perfil["rouco"]
    k = perfil["formante"]
    out = np.zeros(n)
    for j, fr in enumerate(VOGAIS[vogal]):
        larg = 90 + j * 60
        out += banda(fonte, max(60, fr * k - larg), fr * k + larg) * [1.0, 0.6, 0.25][j]
    out *= env(n, 0.012, dur * 0.4, 0.75, dur * 0.35) * forca
    if consoante == "h":
        out = np.concatenate([banda(ruido(0.05), 800, 4000) * np.linspace(0, 0.4, int(SR * 0.05)), out])
    elif consoante == "r":
        out = np.concatenate([(banda(ruido(0.04), 300, 2000) * np.abs(np.sin(np.arange(int(SR * 0.04)) / SR * 2 * np.pi * 30))) * 0.5, out])
    elif consoante == "p":
        out = np.concatenate([np.zeros(int(SR * 0.01)), banda(ruido(0.015), 200, 3000) * 0.8, out])
    return out


def vozes():
    falas = {
        # nome: lista de sílabas (vogal, dur, f_ini, f_fim, força, consoante)
        "ataque1": [("a", 0.13, 1.25, 1.05, 1.0, "h")],
        "ataque2": [("e", 0.1, 1.3, 1.1, 1.0, "h"), ("a", 0.12, 1.15, 0.95, 0.9, None)],
        "forte": [("a", 0.22, 1.35, 1.0, 1.0, "r")],
        "dor": [("u", 0.08, 1.5, 1.6, 0.7, None), ("a", 0.18, 1.5, 1.0, 1.0, "h")],
        "dor2": [("o", 0.22, 1.3, 0.85, 1.0, None)],
        "especial": [("o", 0.1, 1.1, 1.25, 0.9, "h"), ("a", 0.3, 1.4, 1.1, 1.0, "r")],
        "super": [("e", 0.12, 1.0, 1.2, 0.8, None), ("a", 0.42, 1.5, 1.3, 1.0, "r")],
        "provocar": [("e", 0.1, 1.2, 1.3, 0.8, "h"), ("e", 0.1, 1.3, 1.4, 0.8, "h"), ("e", 0.14, 1.4, 1.2, 0.8, "h")],
        "vitoria": [("a", 0.11, 1.3, 1.25, 0.9, "h"), ("a", 0.11, 1.35, 1.3, 0.9, "h"), ("a", 0.2, 1.45, 1.2, 1.0, "h")],
        "derrota": [("o", 0.5, 1.1, 0.7, 1.0, None)],
        "agarra": [("i", 0.12, 1.2, 1.4, 0.9, "p"), ("a", 0.16, 1.3, 1.0, 1.0, "h")],
    }
    for id_, perfil in PERFIS.items():
        for nome, sil in falas.items():
            partes = [silaba(perfil, v, d, fi, ff, fo, c) for (v, d, fi, ff, fo, c) in sil]
            sig = seq(*partes, gap=0.02)
            sig = bitcrush(passa(sig, 5500), 7)
            salvar(sig, f"audio/vozes/{id_}/{nome}.ogg")


# ------------------------------------------------------------------ música chiptune original

ESCALAS = {"maior": [0, 2, 4, 5, 7, 9, 11], "menor": [0, 2, 3, 5, 7, 8, 10], "dorico": [0, 2, 3, 5, 7, 9, 10], "frigio": [0, 1, 3, 5, 7, 8, 10]}


def acorde(raiz_grau, escala, tonica):
    e = ESCALAS[escala]
    graus = [raiz_grau, raiz_grau + 2, raiz_grau + 4]
    return [tonica + e[g % 7] + 12 * (g // 7) for g in graus]


def faixa(nome, bpm, tonica, escala, progressao, semente, estilo="luta", compassos=16):
    r = np.random.default_rng(semente)
    batida = 60.0 / bpm
    passo = batida / 4  # semicolcheia
    passos_total = compassos * 16
    n_total = int(SR * passo * passos_total)
    pista = {k: np.zeros(n_total + SR) for k in ["baixo", "lead", "arp", "bateria"]}

    def coloca(canal, i_passo, sig):
        i = int(i_passo * passo * SR)
        pista[canal][i:i + len(sig)] += sig[:len(pista[canal]) - i]

    # motivo principal de 2 compassos, repetido com variação (A A' B A)
    def motivo(acordes2):
        notas = []
        e = ESCALAS[escala]
        grau = r.integers(0, 5)
        for p in range(32):
            ac = acordes2[p // 16]
            forte = p % 4 == 0
            if r.random() < (0.85 if forte else 0.45):
                if forte:
                    alvo = r.choice(ac) + 12
                else:
                    grau = int(np.clip(grau + r.choice([-1, 1, 1, 2, -2]), 0, 9))
                    alvo = tonica + 12 + e[grau % 7] + 12 * (grau // 7)
                dur = r.choice([1, 2, 2, 3]) if not forte else r.choice([2, 3, 4])
                notas.append((p, alvo, dur))
        return notas

    acordes = [acorde(g, escala, tonica) for g in progressao]
    motivos = {}
    for c in range(compassos):
        ac = acordes[c % len(acordes)]
        par = (c // 2) % 4
        chave = "B" if par == 2 else "A"
        base_passo = c * 16
        # baixo: tônica do acorde em colcheias com oitava
        for p in range(0, 16, 2):
            f = nota(ac[0] - 24 + (12 if p % 8 == 6 else 0))
            s = osc(f, passo * 2 * 0.9, "tri") * env(int(SR * passo * 2 * 0.9), 0.003, 0.08, 0.6, 0.02)
            coloca("baixo", base_passo + p, s * 0.9)
        # arpejo
        if estilo != "calmo" or c % 2 == 0:
            for p in range(16):
                f = nota(ac[p % 3] + 12 * (1 + (p // 3) % 2))
                s = osc(f, passo * 0.8, "quad", 0.125) * env(int(SR * passo * 0.8), 0.002, passo * 0.6, 0.2, 0.01)
                coloca("arp", base_passo + p, s * 0.28)
        # bateria
        for p in range(16):
            if p % 8 == 0 or (estilo == "luta" and p in (10,)):
                k = osc(varre(170, 45, 0.11, 0.5), 0.11) * decai(int(SR * 0.11), 0.045)
                coloca("bateria", base_passo + p, k * 1.1)
            if p % 8 == 4:
                sn = banda(ruido(0.12), 1200, 7000) * decai(int(SR * 0.12), 0.035) + osc(220, 0.12, "tri") * decai(int(SR * 0.12), 0.02) * 0.4
                coloca("bateria", base_passo + p, sn * 0.8)
            if p % 2 == 0 or (estilo == "luta" and r.random() < 0.3):
                h = banda(ruido(0.03), 6000, 10500) * decai(int(SR * 0.03), 0.008)
                coloca("bateria", base_passo + p, h * 0.35)
        # melodia
        if c % 2 == 0:
            if chave not in motivos:
                motivos[chave] = motivo([ac, acordes[(c + 1) % len(acordes)]])
            notas = motivos[chave]
            if par == 1:  # A': transpõe o fim uma terça acima
                notas = [(p, n + (3 if p >= 24 else 0), d) for (p, n, d) in notas]
            for (p, n, d) in notas:
                dur = passo * d * 0.95
                vib = 1 + 0.006 * np.sin(np.arange(int(SR * dur)) / SR * 2 * np.pi * 6) * np.linspace(0, 1, int(SR * dur))
                s = osc(nota(n) * vib, dur, "quad", 0.25 if estilo != "calmo" else 0.5) * env(int(SR * dur), 0.004, dur * 0.5, 0.55, 0.03)
                coloca("lead", base_passo + p, s * 0.42)
    musica = pista["baixo"][:n_total] * 0.55 + pista["lead"][:n_total] * 0.5 + pista["arp"][:n_total] * 0.5 + pista["bateria"][:n_total] * 0.55
    musica = bitcrush(passa(musica, 7000), 8)
    salvar(musica, f"audio/musica/{nome}.ogg", q=1)


def musicas():
    # cada cenário com tom, andamento e progressão próprios
    faixa("menu", 132, 57, "menor", [0, 5, 2, 6], 11, "luta")
    faixa("praca", 148, 52, "dorico", [0, 6, 5, 6], 23, "luta")
    faixa("usp", 140, 55, "menor", [0, 3, 4, 0], 37, "luta")
    faixa("paulista", 156, 50, "frigio", [0, 1, 0, 6], 41, "luta")
    faixa("casa_branca", 128, 53, "maior", [0, 4, 5, 3], 59, "luta")
    faixa("selecao", 120, 60, "maior", [0, 5, 3, 4], 71, "calmo", 8)


if __name__ == "__main__":
    print("efeitos:", len(efeitos()))
    vozes()
    print("vozes ok")
    musicas()
    print("músicas ok")
