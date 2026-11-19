"""Mede o hook UserPromptSubmit na parede (critério de pronto F3-A2: p95 < 300 ms).

Cada medida é um processo novo do `hela-hook user-prompt-submit`, como o Claude Code faz, com
N memórias no banco e, ao mesmo tempo, outro processo gravando (observações sem parar e uma memória
nova a cada ~0,3 s). Nada toca no ~/.hela real: o banco fica numa pasta temporária.

Uso:
    .venv/bin/python scripts/medir_hook.py --memorias 10000 --rodadas 40
"""

from __future__ import annotations

import argparse
import json
import multiprocessing as mp
import os
import random
import statistics
import subprocess
import sys
import tempfile
import time
from pathlib import Path

TEMAS = ["ffmpeg", "gif", "pytest", "docker", "sqlite", "rebase", "css", "blender", "venv", "vite", "deploy",
         "testes", "converter", "vídeo", "branch", "layout", "render", "json", "csv", "workflow", "api", "cache",
         "login", "token", "build", "lint", "banco", "fila", "imagem", "servidor"]
PROMPTS = ["transformar mp4 em gif leve", "como rodar os testes com pytest", "o sqlite trava com escritas no wal",
           "fazer deploy da api com docker compose", "deu conflito no rebase da branch", "ajuste o css do login",
           "converter csv para json", "renderizar as cenas do blender em lote", "criar o venv do projeto",
           "qual a capital da frança", "o build do vite quebrou na subpasta", "limpar o cache do servidor"]


def _popular(home: Path, n: int) -> None:
    from hela.core.engine import Engine

    rnd = random.Random(7)
    with Engine(home=home) as eng:
        for i in range(n):
            palavras = " ".join(rnd.sample(TEMAS, 6))
            eng.remember(kind=("semantic", "episodic", "procedural", "executive")[i % 4], title=f"nota {i}",
                         content=f"Anotação {i}: {palavras}. Detalhe {rnd.randint(0, 10**6)} do projeto {i % 37}.")


def _escritor(home: str, parar) -> None:  # type: ignore[no-untyped-def]
    import sqlite3

    from hela.core.engine import Engine

    eng = Engine(home=Path(home))
    conn = sqlite3.connect(str(Path(home) / "hela.db"), isolation_level=None, timeout=5)
    i = 0
    ultimo = time.monotonic()
    while not parar.is_set():
        conn.execute("BEGIN IMMEDIATE")
        conn.execute("INSERT INTO observations (event, tool_name, success, summary, payload, created_at)"
                     " VALUES ('PostToolUse', 'Bash', 1, 'ls', '{}', '2026-11-19T00:00:00+00:00')")
        time.sleep(0.005)  # segura a trava um pouco, como uma gravação de verdade
        conn.execute("COMMIT")
        if time.monotonic() - ultimo > 0.3:
            eng.remember(kind="episodic", content=f"memória nova do escritor {i} {random.choice(TEMAS)}")
            ultimo = time.monotonic()
            i += 1
        time.sleep(0.002)
    eng.close()
    conn.close()


def _medir(home: Path, hook: str, prompt: str) -> tuple[float, bool]:
    entrada = json.dumps({"session_id": "medicao", "prompt": prompt, "cwd": str(home),
                          "hook_event_name": "UserPromptSubmit"}).encode()
    env = {**os.environ, "HELA_HOME": str(home)}
    inicio = time.perf_counter()
    p = subprocess.run([hook, "user-prompt-submit"], input=entrada, capture_output=True, env=env, timeout=30)
    dt = (time.perf_counter() - inicio) * 1000
    return dt, bool(p.stdout.strip())


def _percentil(valores: list[float], p: float) -> float:
    ordenados = sorted(valores)
    k = max(0, min(len(ordenados) - 1, int(round(p / 100 * len(ordenados) + 0.5)) - 1))
    return ordenados[k]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--memorias", type=int, default=10_000)
    ap.add_argument("--rodadas", type=int, default=40)
    ap.add_argument("--sem-escritor", action="store_true")
    a = ap.parse_args()
    hook = str(Path(sys.executable).parent / "hela-hook")
    with tempfile.TemporaryDirectory(prefix="hela-medicao-") as pasta:
        home = Path(pasta) / "hela"
        t = time.perf_counter()
        _popular(home, a.memorias)
        print(f"banco com {a.memorias} memórias em {time.perf_counter() - t:.0f} s", file=sys.stderr)
        frio, _ = _medir(home, hook, PROMPTS[0])  # monta o cache de vetores
        parar = mp.Event()
        escritor = None if a.sem_escritor else mp.Process(target=_escritor, args=(str(home), parar))
        if escritor:
            escritor.start()
            time.sleep(1.0)
        tempos, com_contexto = [], 0
        try:
            for i in range(a.rodadas):
                dt, ctx = _medir(home, hook, PROMPTS[i % len(PROMPTS)])
                tempos.append(dt)
                com_contexto += ctx
        finally:
            parar.set()
            if escritor:
                escritor.join(10)
        log = (home / "logs" / "hooks.log").read_text(encoding="utf-8").splitlines()
        resultados = [json.loads(x).get("result") for x in log[1:]]
        saida = {"memorias": a.memorias, "rodadas": a.rodadas, "escritor": not a.sem_escritor,
                 "primeira_com_cache_frio_ms": round(frio, 1), "p50_ms": round(statistics.median(tempos), 1),
                 "p95_ms": round(_percentil(tempos, 95), 1), "max_ms": round(max(tempos), 1),
                 "min_ms": round(min(tempos), 1), "com_contexto": com_contexto,
                 "resultados_no_log": {r: resultados.count(r) for r in set(resultados)}}
        print(json.dumps(saida, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
