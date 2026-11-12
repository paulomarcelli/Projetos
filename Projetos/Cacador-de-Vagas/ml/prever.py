#!/usr/bin/env python3
"""Usa o modelo treinado para ordenar as vagas que você ainda não marcou.

Uso:
    python ml/exportar.py && python ml/prever.py
"""
import argparse
from pathlib import Path

import joblib
import pandas as pd

from treinar import texto_da_vaga

PASTA = Path(__file__).resolve().parent


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", default=str(PASTA / "dados" / "vagas.csv"))
    ap.add_argument("--modelo", default=str(PASTA / "resultados" / "modelo.joblib"))
    ap.add_argument("--top", type=int, default=10)
    args = ap.parse_args()

    modelo = joblib.load(args.modelo)
    df = pd.read_csv(args.csv, dtype=str).fillna("")
    novas = df[df["gostei"] == ""].copy()
    if novas.empty:
        raise SystemExit("Nenhuma vaga sem marcação para prever.")
    novas["chance"] = modelo.predict_proba(texto_da_vaga(novas))[:, 1]
    novas = novas.sort_values("chance", ascending=False).head(args.top)
    for _, v in novas.iterrows():
        print(f"{v['chance']:.0%}  {v['vaga']} · {v['empresa']}  (IA: {v['nota_ia'] or '–'})  {v['link']}")


if __name__ == "__main__":
    main()
