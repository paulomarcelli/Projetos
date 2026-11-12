#!/usr/bin/env python3
"""Treina um modelo que aprende o SEU gosto por vagas e compara com a nota da IA.

Usa as vagas em que você marcou "Gostei?" (👍 Sim / 👎 Não) no Notion.

Uso:
    python ml/exportar.py          # baixa as vagas do Notion
    python ml/treinar.py           # treina, avalia e escreve ml/resultados/

O que ele faz:
  1. Monta um texto por vaga (título, empresa, local, área, nível, modalidade, descrição).
  2. Modelo próprio: TF-IDF (palavras e pares de palavras) + Regressão Logística.
  3. Avalia com validação cruzada estratificada: cada vaga é prevista por um modelo
     que NÃO a viu no treino. Assim a nota é honesta.
  4. Compara com duas referências usando as MESMAS vagas:
       - a IA (LLM): "gostei" quando Nota IA >= LIMIAR_IA
       - chute da maioria: sempre a resposta mais comum
  5. Salva relatório, matriz de confusão, as palavras que mais pesam e o modelo final.
"""
import argparse
import json
from pathlib import Path

import joblib
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.pipeline import Pipeline

PASTA = Path(__file__).resolve().parent
LIMIAR_IA = 7
MIN_TOTAL, MIN_POR_CLASSE = 20, 5


def texto_da_vaga(df):
    campos = ["vaga", "empresa", "local", "area", "nivel", "modalidade", "descricao"]
    return df[campos].fillna("").astype(str).agg(" | ".join, axis=1)


def metricas(y, pred):
    return {
        "acuracia": accuracy_score(y, pred),
        "precisao": precision_score(y, pred, zero_division=0),
        "revocacao": recall_score(y, pred, zero_division=0),
        "f1": f1_score(y, pred, zero_division=0),
    }


def criar_modelo():
    return Pipeline([
        ("tfidf", TfidfVectorizer(strip_accents="unicode", lowercase=True, ngram_range=(1, 2),
                                  min_df=1, sublinear_tf=True)),
        ("clf", LogisticRegression(class_weight="balanced", max_iter=2000, C=2.0)),
    ])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", default=str(PASTA / "dados" / "vagas.csv"))
    ap.add_argument("--saida", default=str(PASTA / "resultados"))
    args = ap.parse_args()

    df = pd.read_csv(args.csv, dtype=str).fillna("")
    df = df[df["gostei"].isin(["👍 Sim", "👎 Não"])].reset_index(drop=True)
    y = (df["gostei"] == "👍 Sim").astype(int).to_numpy()
    n_sim, n_nao = int(y.sum()), int(len(y) - y.sum())
    if len(df) < MIN_TOTAL or min(n_sim, n_nao) < MIN_POR_CLASSE:
        raise SystemExit(
            f"Ainda poucas vagas marcadas: {len(df)} ({n_sim} 👍, {n_nao} 👎). "
            f"Marque pelo menos {MIN_TOTAL}, com {MIN_POR_CLASSE} de cada tipo, e rode de novo."
        )

    X = texto_da_vaga(df)
    k = min(5, n_sim, n_nao)
    cv = StratifiedKFold(n_splits=k, shuffle=True, random_state=42)
    pred_modelo = cross_val_predict(criar_modelo(), X, y, cv=cv)

    nota = pd.to_numeric(df["nota_ia"], errors="coerce")
    tem_nota = nota.notna().to_numpy()
    pred_ia = (nota.fillna(-1) >= LIMIAR_IA).astype(int).to_numpy()
    maioria = int(n_sim >= n_nao)
    pred_maioria = np.full_like(y, maioria)

    resultados = {
        "Seu modelo (TF-IDF + Regressão Logística)": metricas(y[tem_nota], pred_modelo[tem_nota]),
        f"IA (Nota IA >= {LIMIAR_IA})": metricas(y[tem_nota], pred_ia[tem_nota]),
        "Chute da maioria": metricas(y[tem_nota], pred_maioria[tem_nota]),
    }

    # Modelo final com todas as vagas, e as palavras que mais pesam
    modelo = criar_modelo().fit(X, y)
    vocab = modelo.named_steps["tfidf"].get_feature_names_out()
    coef = modelo.named_steps["clf"].coef_[0]
    ordem = np.argsort(coef)
    gosta = [(vocab[i], round(float(coef[i]), 2)) for i in ordem[::-1][:15]]
    nao_gosta = [(vocab[i], round(float(coef[i]), 2)) for i in ordem[:15]]

    saida = Path(args.saida)
    saida.mkdir(parents=True, exist_ok=True)
    joblib.dump(modelo, saida / "modelo.joblib")

    fig, eixos = plt.subplots(1, 2, figsize=(9, 4))
    for eixo, (nome, pred) in zip(eixos, [("Seu modelo", pred_modelo), (f"IA (nota ≥ {LIMIAR_IA})", pred_ia)]):
        cm = confusion_matrix(y[tem_nota], pred[tem_nota], labels=[0, 1])
        eixo.imshow(cm, cmap="Oranges")
        for (i, j), v in np.ndenumerate(cm):
            eixo.text(j, i, str(v), ha="center", va="center", fontsize=14)
        eixo.set_xticks([0, 1], ["previu: não", "previu: sim"])
        eixo.set_yticks([0, 1], ["você: não", "você: sim"])
        eixo.set_title(nome)
    fig.tight_layout()
    fig.savefig(saida / "matriz_confusao.png", dpi=150)

    linhas = [
        "# Caçador de Vagas · resultado do modelo",
        "",
        f"Vagas avaliadas: **{int(tem_nota.sum())}** ({n_sim} 👍 e {n_nao} 👎 no total marcado). "
        f"Validação cruzada estratificada com {k} partes: cada vaga foi prevista por um modelo que não a viu.",
        "",
        "| Quem previu | Acurácia | Precisão | Revocação | F1 |",
        "|---|---|---|---|---|",
    ]
    for nome, m in resultados.items():
        linhas.append(f"| {nome} | {m['acuracia']:.0%} | {m['precisao']:.0%} | {m['revocacao']:.0%} | {m['f1']:.2f} |")
    melhor = max(resultados, key=lambda n: resultados[n]["f1"])
    linhas += [
        "",
        f"**Quem acertou mais o seu gosto (F1):** {melhor}.",
        "",
        "- **Precisão:** das vagas que ele disse que você ia gostar, quantas você gostou de verdade.",
        "- **Revocação:** das vagas que você gostou, quantas ele encontrou.",
        "- **F1:** equilíbrio entre as duas. É a métrica principal aqui, porque as classes podem ser desiguais.",
        "",
        "![Matriz de confusão](matriz_confusao.png)",
        "",
        "## O que o seu modelo aprendeu",
        "",
        "Palavras que puxam para 👍: " + ", ".join(f"`{p}`" for p, _ in gosta),
        "",
        "Palavras que puxam para 👎: " + ", ".join(f"`{p}`" for p, _ in nao_gosta),
        "",
        "> Com poucas vagas os números variam bastante. Marque mais vagas e treine de novo de tempos em tempos.",
    ]
    (saida / "relatorio.md").write_text("\n".join(linhas), encoding="utf-8")
    (saida / "metricas.json").write_text(json.dumps(resultados, ensure_ascii=False, indent=2), encoding="utf-8")
    print("\n".join(linhas[4:4 + 2 + len(resultados)]))
    print(f"\nRelatório: {saida / 'relatorio.md'}")


if __name__ == "__main__":
    main()
