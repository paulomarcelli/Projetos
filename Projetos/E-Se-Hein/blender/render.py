"""Monta um plano do vídeo no Blender e renderiza (técnica da skill how-its-built-starter: a cena sai de um spec, e
cada mudança acontece na palavra da fala).

    blender -b --factory-startup -P blender/render.py -- <video> <plano> [--tempos 3.7,9.0] [--escala 50]
                                                       [--amostras 48] [--sequencia] [--salvar-blend]

--tempos     quadros soltos em segundos do vídeo -> out/blender/quadros/<plano>-<t>.jpg
--sequencia  o plano inteiro em JPEG -> out/blender/<video>/<plano>/0001.jpg (retoma de onde parou)
Sempre grava out/blender/<video>/<plano>.json com o tempo do plano e a posição do "você" na tela.
"""
import importlib
import json
import sys
import time
from pathlib import Path

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI))

import bpy  # noqa: E402

import comum as c  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
if len(argv) < 2:
    raise SystemExit("Uso: blender -b -P blender/render.py -- <video> <plano> [opções]")
VIDEO, PLANO = argv[0], argv[1]


def opcao(nome, padrao=None):
    return argv[argv.index(nome) + 1] if nome in argv else padrao


spec = json.loads((AQUI / f"{VIDEO}.spec.json").read_text(encoding="utf-8"))
plano = next((p for p in spec["planos"] if p["id"] == PLANO), None)
if not plano:
    raise SystemExit(f"Plano {PLANO} não está em {VIDEO}.spec.json")

inicio = time.time()
tempo = c.Tempo(VIDEO, spec, plano)
if plano.get("fim_do_video"):
    tempo.fim = tempo.dados["duracaoAudio"] + 1.0  # o fechamento laranja cobre o resto
for e in plano.get("eventos", []):  # confere todas as palavras antes de montar
    tempo.palavra(e["palavra"], e["trecho"], e.get("n", 1))
    if e.get("ate"):
        tempo.palavra(e["ate"], e["trecho"], e.get("n_ate", 1))

sc = c.cena_vazia()
c.configurar_render(sc, amostras=int(opcao("--amostras", 48)), escala=int(opcao("--escala", 100)))
sc.frame_end = tempo.quadros
if plano["cena"] == "paulista":
    info = importlib.import_module("paulista").montar(sc, tempo, plano, argv)
else:
    info = importlib.import_module("outras").CENAS[plano["cena"]](sc, tempo, plano)
print(f"MONTADO {PLANO}: {len(bpy.data.objects)} objetos em {time.time() - inicio:.1f} s; {tempo.quadros} quadros")

saida = c.RAIZ / "out" / "blender"
(saida / VIDEO).mkdir(parents=True, exist_ok=True)
resumo = {"plano": PLANO, "inicio": round(tempo.inicio, 3), "fim": round(tempo.fim, 3), "quadros": tempo.quadros}
if info.get("voce") is not None:
    pontos = {}
    for f in sorted({1, tempo.quadros, *range(1, tempo.quadros + 1, 15)}):
        sc.frame_set(f)
        pontos[f] = c.projetar(sc, info["camera"], info["voce"])
    resumo["voce"] = pontos
(saida / VIDEO / f"{PLANO}.json").write_text(json.dumps(resumo, indent=1), encoding="utf-8")
publico = c.RAIZ / "public" / "blender" / VIDEO  # o Remotion lê daqui (fora do git)
publico.mkdir(parents=True, exist_ok=True)
(publico / f"{PLANO}.json").write_text(json.dumps(resumo, indent=1), encoding="utf-8")

if "--salvar-blend" in argv:
    bpy.ops.wm.save_as_mainfile(filepath=str(saida / VIDEO / f"{PLANO}.blend"))

if opcao("--tempos"):
    pasta = saida / "quadros"
    pasta.mkdir(parents=True, exist_ok=True)
    for t in [float(v) for v in opcao("--tempos").split(",")]:
        f = max(1, min(tempo.quadros, tempo.quadro(t)))
        sc.frame_set(f)
        sc.render.filepath = str(pasta / f"{PLANO}-{t:05.2f}s.jpg")
        t0 = time.time()
        bpy.ops.render.render(write_still=True)
        print(f"QUADRO {PLANO} t={t:.2f}s (quadro {f}) em {time.time() - t0:.1f} s")
        if "--para-remotion" in argv:  # o mesmo quadro, numerado como no plano, para as camadas 2D por cima
            import shutil
            destino = publico / "quadros" / PLANO
            destino.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(sc.render.filepath, destino / f"{f:04d}.jpg")

if "--sequencia" in argv:
    pasta = saida / VIDEO / PLANO
    pasta.mkdir(parents=True, exist_ok=True)
    t0 = time.time()
    feitos = 0
    for f in range(1, tempo.quadros + 1):
        arq = pasta / f"{f:04d}.jpg"
        if arq.exists() and arq.stat().st_size > 0:
            continue
        sc.frame_set(f)
        sc.render.filepath = str(arq)
        bpy.ops.render.render(write_still=True)
        feitos += 1
        if feitos % 30 == 0:
            print(f"SEQ {PLANO} {f}/{tempo.quadros} ({(time.time() - t0) / feitos:.2f} s/quadro)", flush=True)
    print(f"SEQ {PLANO} pronta: {feitos} quadros novos em {time.time() - t0:.0f} s")

print(f"FIM {PLANO} em {time.time() - inicio:.0f} s")
