"""Task Classifier: categoria, complexidade e ferramentas de uma tarefa.

Dois modos, sempre visíveis em status():
- "rules": a taxonomia de palavras-chave (rules.py). É o padrão.
- "naive_bayes": um Naive Bayes multinomial treinado de verdade (naive_bayes.py). Só assume a
  categoria quando (1) há rótulos legítimos suficientes, (2) a acurácia da validação cruzada passa
  de learning.classifier.min_cv_accuracy e (3) é maior que a acurácia das regras nos mesmos rótulos.

Rótulos legítimos são só os de label_source 'explicit' (quem pediu disse a categoria) e 'feedback'
(alguém corrigiu). Os rótulos das próprias regras ('rules') e as previsões do modelo (label_source
NULL) nunca treinam: seria o classificador aprendendo com ele mesmo.

Complexidade e ferramentas vêm sempre das regras, nos dois modos.
"""

from __future__ import annotations

import json
from collections import Counter
from dataclasses import dataclass, field
from typing import Any, Optional

from hela.core.clock import Clock, to_iso, utcnow
from hela.core.config import HelaConfig
from hela.learning.naive_bayes import MultinomialNB, cross_validate, majority_baseline
from hela.learning.rules import classify_by_rules
from hela.storage.db import Database

ALLOWED_LABEL_SOURCES = ("explicit", "feedback")
MODEL_NAME = "task_category"


@dataclass(frozen=True)
class Example:
    text: str
    label: str
    source: str


@dataclass
class TrainReport:
    trained: bool
    activated: bool
    reason: str
    n_samples: int = 0
    classes: list[str] = field(default_factory=list)
    excluded_classes: dict[str, int] = field(default_factory=dict)
    cv_accuracy: Optional[float] = None
    rules_accuracy: Optional[float] = None
    baseline_accuracy: Optional[float] = None
    model_id: Optional[int] = None
    version: Optional[int] = None

    def as_dict(self) -> dict[str, Any]:
        return dict(self.__dict__)


class TaskClassifier:
    def __init__(self, db: Database, config: HelaConfig, clock: Clock = utcnow) -> None:
        self.db = db
        self.config = config
        self.clock = clock
        self._cache: tuple[Optional[int], Optional[MultinomialNB]] = (None, None)

    # --- dados de treino -----------------------------------------------------------------
    def training_examples(self) -> list[Example]:
        """Só tarefas com rótulo legítimo (explicit/feedback). A consulta é o primeiro filtro."""
        marcas = ",".join("?" * len(ALLOWED_LABEL_SOURCES))
        rows = self.db.conn.execute(
            f"SELECT prompt, category, label_source FROM tasks WHERE label_source IN ({marcas})"
            " AND category IS NOT NULL AND category <> '' ORDER BY created_at, id", ALLOWED_LABEL_SOURCES).fetchall()
        return [Example(r["prompt"], r["category"], r["label_source"]) for r in rows]

    # --- treino --------------------------------------------------------------------------
    def train(self, examples: Optional[list[Example]] = None) -> TrainReport:
        exemplos = self.training_examples() if examples is None else list(examples)
        ilegitimos = sorted({e.source for e in exemplos} - set(ALLOWED_LABEL_SOURCES))
        if ilegitimos:  # segundo filtro: nem por engano um rótulo das regras entra no treino
            raise ValueError(f"rótulos de origem não permitida no treino: {ilegitimos} "
                             f"(só {', '.join(ALLOWED_LABEL_SOURCES)}; 'rules' nunca treina)")
        cfg = self.config.learning.classifier
        por_classe = Counter(e.label for e in exemplos)
        excluidas = {c: n for c, n in por_classe.items() if n < cfg.min_per_class}
        usados = [e for e in exemplos if e.label not in excluidas]
        classes = sorted({e.label for e in usados})
        if len(classes) < cfg.min_classes:
            return TrainReport(False, False, (
                f"rótulos insuficientes: precisa de {cfg.min_classes} classes com o mínimo de {cfg.min_per_class} "
                f"exemplos cada (há {dict(por_classe)})"), n_samples=len(usados), classes=classes,
                excluded_classes=excluidas)

        textos = [e.text for e in usados]
        rotulos = [e.label for e in usados]
        cv = cross_validate(textos, rotulos, folds=cfg.cv_folds, alpha=cfg.alpha, max_vocab=cfg.max_vocab)
        regras = round(sum(classify_by_rules(t).category == r for t, r in zip(textos, rotulos)) / len(usados), 4)
        base = majority_baseline(rotulos)
        modelo = MultinomialNB(alpha=cfg.alpha, max_vocab=cfg.max_vocab).fit(textos, rotulos)
        ativar = cv["accuracy"] >= cfg.min_cv_accuracy and cv["accuracy"] > regras
        if ativar:
            motivo = f"ativo: acurácia {cv['accuracy']:.2f} na validação cruzada contra {regras:.2f} das regras"
        elif cv["accuracy"] < cfg.min_cv_accuracy:
            motivo = f"inativo: acurácia {cv['accuracy']:.2f} abaixo do mínimo {cfg.min_cv_accuracy:.2f}"
        else:
            motivo = f"inativo: acurácia {cv['accuracy']:.2f} não supera a das regras ({regras:.2f})"

        params = {**modelo.to_params(), "cv": cv, "rules_accuracy": regras, "baseline_accuracy": base,
                  "excluded_classes": excluidas, "per_class": dict(Counter(rotulos))}
        agora = to_iso(self.clock())
        with self.db.transaction():
            versao = int(self.db.conn.execute("SELECT COALESCE(MAX(version), 0) FROM classifier_models WHERE name = ?",
                                              (MODEL_NAME,)).fetchone()[0]) + 1
            if ativar:
                self.db.conn.execute("UPDATE classifier_models SET active = 0 WHERE name = ?", (MODEL_NAME,))
            cur = self.db.conn.execute(
                "INSERT INTO classifier_models (name, algo, version, params, classes, n_samples, cv_accuracy,"
                " label_sources, active, trained_at) VALUES (?, 'naive_bayes', ?, ?, ?, ?, ?, ?, ?, ?)",
                (MODEL_NAME, versao, json.dumps(params), json.dumps(classes), len(usados), cv["accuracy"],
                 json.dumps(sorted({e.source for e in usados})), int(ativar), agora))
            self.db.conn.execute(
                "INSERT INTO events (ts, type, entity, entity_id, data) VALUES (?, 'classifier.trained', 'model', ?, ?)",
                (agora, str(cur.lastrowid), json.dumps({"version": versao, "n_samples": len(usados),
                                                        "cv_accuracy": cv["accuracy"], "rules_accuracy": regras,
                                                        "active": ativar})))
        return TrainReport(True, ativar, motivo, n_samples=len(usados), classes=classes, excluded_classes=excluidas,
                           cv_accuracy=cv["accuracy"], rules_accuracy=regras, baseline_accuracy=base,
                           model_id=int(cur.lastrowid), version=versao)

    # --- modo ativo ----------------------------------------------------------------------
    def _ativo(self) -> Optional[Any]:
        return self.db.conn.execute(
            "SELECT * FROM classifier_models WHERE name = ? AND algo = 'naive_bayes' AND active = 1"
            " ORDER BY version DESC LIMIT 1", (MODEL_NAME,)).fetchone()

    def _modelo(self, linha: Any) -> MultinomialNB:
        mid, nb = self._cache
        if mid != linha["id"] or nb is None:
            nb = MultinomialNB.from_params(json.loads(linha["params"]))
            self._cache = (linha["id"], nb)
        return nb

    def status(self) -> dict[str, Any]:
        linha = self._ativo()
        exemplos = self.training_examples()
        modelo = None
        if linha is not None:
            params = json.loads(linha["params"])
            modelo = {"id": linha["id"], "version": linha["version"], "algo": "naive_bayes",
                      "n_samples": linha["n_samples"], "cv_accuracy": linha["cv_accuracy"],
                      "rules_accuracy": params.get("rules_accuracy"), "baseline_accuracy": params.get("baseline_accuracy"),
                      "classes": json.loads(linha["classes"]), "label_sources": json.loads(linha["label_sources"]),
                      "trained_at": linha["trained_at"]}
        return {
            "mode": "naive_bayes" if modelo else "rules",
            "method": ("modelo treinado (Naive Bayes multinomial) com rótulos explicit/feedback" if modelo
                       else "regras (palavras-chave da taxonomia)"),
            "model": modelo,
            "labeled_examples": len(exemplos),
            "by_class": dict(Counter(e.label for e in exemplos)),
            "min_per_class": self.config.learning.classifier.min_per_class,
        }

    def classify(self, texto: str) -> dict[str, Any]:
        regras = classify_by_rules(texto)
        saida: dict[str, Any] = {
            "category": regras.category, "confidence": regras.confidence, "mode": "rules",
            "rules_category": regras.category, "model_version": None,
            "complexity": regras.complexity, "complexity_signals": regras.complexity_signals, "tools": regras.tools,
            "matched_keywords": regras.matched,
        }
        linha = self._ativo()
        if linha is not None:
            proba = self._modelo(linha).predict_proba([texto])[0]
            categoria = max(proba, key=lambda c: (proba[c], c))
            saida.update(category=categoria, confidence=round(proba[categoria], 4), mode="naive_bayes",
                         model_version=linha["version"])
        return saida
