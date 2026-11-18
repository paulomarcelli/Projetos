"""Naive Bayes multinomial em numpy: o modelo treinado de verdade do Task Classifier.

Por que este modelo: com poucas centenas de exemplos curtos (pedidos de tarefa), o NB multinomial
é rápido de treinar, difícil de sobreajustar e auditável (os parâmetros são contagens suavizadas).
O scikit-learn faria o mesmo, mas não é dependência garantida em outras máquinas (plano, 3.5).

Contas (Laplace, alpha):
    P(c)     = N_c / N
    P(w | c) = (contagem de w nos textos de c + alpha) / (total de palavras de c + alpha · |V|)
    log P(c | x) ∝ log P(c) + Σ_w x_w · log P(w | c)

O numpy é importado só dentro das funções: importar este módulo não custa nada (hooks da Fase 4).
"""

from __future__ import annotations

import math
import random
from collections import Counter
from typing import Any, Optional, Sequence

from hela.learning.taxonomy import STOPWORDS, words


def tokenize(texto: str, bigrams: bool = True) -> list[str]:
    """Palavras normalizadas (sem acento, sem palavras vazias, com 2+ letras) e, se pedido, bigramas."""
    ps = [p for p in words(texto) if len(p) >= 2 and p not in STOPWORDS]
    if bigrams:
        ps += [f"{a}_{b}" for a, b in zip(ps, ps[1:])]
    return ps


class MultinomialNB:
    def __init__(self, alpha: float = 1.0, max_vocab: int = 5000, bigrams: bool = True) -> None:
        if alpha <= 0:
            raise ValueError("alpha precisa ser > 0")
        self.alpha = float(alpha)
        self.max_vocab = int(max_vocab)
        self.bigrams = bigrams
        self.classes: list[str] = []
        self.vocab: dict[str, int] = {}
        self.class_log_prior: Any = None     # numpy (C,)
        self.feature_log_prob: Any = None    # numpy (C, V)

    # --- treino --------------------------------------------------------------------------
    def fit(self, textos: Sequence[str], rotulos: Sequence[str]) -> "MultinomialNB":
        import numpy as np

        if len(textos) != len(rotulos) or not textos:
            raise ValueError("textos e rótulos precisam ter o mesmo tamanho (e não ser vazios)")
        docs = [tokenize(t, self.bigrams) for t in textos]
        # Vocabulário: os termos que aparecem em mais documentos (empate: ordem alfabética).
        df = Counter(w for d in docs for w in set(d))
        termos = sorted(df, key=lambda w: (-df[w], w))[: self.max_vocab]
        self.vocab = {w: i for i, w in enumerate(sorted(termos))}
        self.classes = sorted(set(rotulos))
        indice = {c: i for i, c in enumerate(self.classes)}
        contagens = np.zeros((len(self.classes), len(self.vocab)), dtype=np.float64)
        por_classe = np.zeros(len(self.classes), dtype=np.float64)
        for d, r in zip(docs, rotulos):
            por_classe[indice[r]] += 1
            for w in d:
                j = self.vocab.get(w)
                if j is not None:
                    contagens[indice[r], j] += 1
        self.class_log_prior = np.log(por_classe / por_classe.sum())
        suavizado = contagens + self.alpha
        self.feature_log_prob = np.log(suavizado / suavizado.sum(axis=1, keepdims=True))
        return self

    # --- previsão ------------------------------------------------------------------------
    def _matriz(self, textos: Sequence[str]):  # type: ignore[no-untyped-def]
        import numpy as np

        x = np.zeros((len(textos), len(self.vocab)), dtype=np.float64)
        for i, t in enumerate(textos):
            for w in tokenize(t, self.bigrams):
                j = self.vocab.get(w)
                if j is not None:
                    x[i, j] += 1
        return x

    def predict_proba(self, textos: Sequence[str]) -> list[dict[str, float]]:
        import numpy as np

        if self.feature_log_prob is None:
            raise ValueError("modelo não treinado")
        log = self._matriz(textos) @ self.feature_log_prob.T + self.class_log_prior
        log -= log.max(axis=1, keepdims=True)
        p = np.exp(log)
        p /= p.sum(axis=1, keepdims=True)
        return [{c: float(v) for c, v in zip(self.classes, linha)} for linha in p]

    def predict(self, textos: Sequence[str]) -> list[str]:
        return [max(p, key=lambda c: (p[c], c)) for p in self.predict_proba(textos)]

    # --- persistência (JSON, tabela classifier_models) -----------------------------------
    def to_params(self) -> dict[str, Any]:
        return {
            "alpha": self.alpha, "max_vocab": self.max_vocab, "bigrams": self.bigrams, "classes": self.classes,
            "vocab": sorted(self.vocab, key=self.vocab.__getitem__),
            "class_log_prior": [float(v) for v in self.class_log_prior],
            "feature_log_prob": [[float(v) for v in linha] for linha in self.feature_log_prob],
        }

    @classmethod
    def from_params(cls, params: dict[str, Any]) -> "MultinomialNB":
        import numpy as np

        nb = cls(alpha=params["alpha"], max_vocab=params["max_vocab"], bigrams=params["bigrams"])
        nb.classes = list(params["classes"])
        nb.vocab = {w: i for i, w in enumerate(params["vocab"])}
        nb.class_log_prior = np.asarray(params["class_log_prior"], dtype=np.float64)
        nb.feature_log_prob = np.asarray(params["feature_log_prob"], dtype=np.float64).reshape(
            len(nb.classes), len(nb.vocab))
        return nb


def stratified_folds(rotulos: Sequence[str], folds: int, seed: int = 0) -> list[list[int]]:
    """Índices de teste de cada dobra. Cada classe é embaralhada (semente fixa) e distribuída em rodízio."""
    rng = random.Random(seed)
    dobras: list[list[int]] = [[] for _ in range(folds)]
    por_classe: dict[str, list[int]] = {}
    for i, r in enumerate(rotulos):
        por_classe.setdefault(r, []).append(i)
    posicao = 0
    for classe in sorted(por_classe):
        idx = por_classe[classe]
        rng.shuffle(idx)
        for i in idx:
            dobras[posicao % folds].append(i)
            posicao += 1
    return [sorted(d) for d in dobras if d]


def cross_validate(textos: Sequence[str], rotulos: Sequence[str], folds: int = 5, alpha: float = 1.0,
                   max_vocab: int = 5000, seed: int = 0) -> dict[str, Any]:
    """Acurácia média da validação cruzada estratificada (k dobras, k ≤ menor classe)."""
    menor = min(Counter(rotulos).values())
    k = max(2, min(folds, menor))
    acertos_por_dobra: list[float] = []
    for teste in stratified_folds(rotulos, k, seed):
        dentro = set(teste)
        treino = [i for i in range(len(textos)) if i not in dentro]
        nb = MultinomialNB(alpha=alpha, max_vocab=max_vocab).fit([textos[i] for i in treino],
                                                                 [rotulos[i] for i in treino])
        previstos = nb.predict([textos[i] for i in teste])
        acertos = sum(p == rotulos[i] for p, i in zip(previstos, teste))
        acertos_por_dobra.append(acertos / len(teste))
    media = sum(acertos_por_dobra) / len(acertos_por_dobra)
    return {"accuracy": round(media, 4), "folds": len(acertos_por_dobra),
            "per_fold": [round(a, 4) for a in acertos_por_dobra],
            "std": round(math.sqrt(sum((a - media) ** 2 for a in acertos_por_dobra) / len(acertos_por_dobra)), 4)}


def majority_baseline(rotulos: Sequence[str]) -> Optional[float]:
    """Acurácia de chutar sempre a classe mais comum (referência honesta para a acurácia do modelo)."""
    if not rotulos:
        return None
    return round(Counter(rotulos).most_common(1)[0][1] / len(rotulos), 4)
