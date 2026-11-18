"""Task Classifier: regras primeiro, Naive Bayes só com rótulos legítimos (explicit/feedback)."""

from __future__ import annotations

import json
import subprocess
import sys
import uuid
from pathlib import Path

import pytest

from hela.core.config import HelaConfig
from hela.learning.classifier import Example, TaskClassifier
from hela.learning.naive_bayes import MultinomialNB, cross_validate, tokenize
from hela.learning.rules import classify_by_rules
from hela.learning.taxonomy import CATEGORIES, DEFAULT_CATEGORY
from hela.storage.db import Database
from tests.helpers import RelogioFalso

# Um exemplo em português e um em inglês por categoria: as regras precisam acertar todos.
EXEMPLOS = {
    "debug": ["o login está dando erro 500, corrija", "fix the crash when saving the file"],
    "test": ["escreva testes com pytest para o parser", "add unit tests with jest for the cart"],
    "feature": ["implemente a exportação em PDF no relatório", "implement a new feature to share links"],
    "refactor": ["refatore o módulo de pagamentos", "refactor the auth service into smaller functions"],
    "docs": ["atualize o README com a instalação", "write the documentation for the public API"],
    "explain": ["explique o que é um closure em javascript", "explain how does the event loop work"],
    "devops": ["configure o deploy com docker no servidor", "set up a github actions pipeline"],
    "data": ["converta o csv de vendas em json", "write a sql query on the sqlite database"],
    "media": ["converter vídeo mp4 para gif com ffmpeg", "render the blender scene to png frames"],
    "ui": ["ajuste o layout da tela de login no css", "make the react component responsive"],
    "setup": ["instale as dependências e crie o venv", "install the npm packages for the project"],
    "git": ["faça o rebase da branch e resolva o conflito", "squash the commits before the merge"],
    "security": ["revise a segurança contra xss e csrf", "find the vulnerability in the auth flow"],
    "performance": ["a página está lenta, otimize as consultas", "profile the slow endpoint and reduce latency"],
}


@pytest.mark.parametrize("categoria,texto", [(c, t) for c, ts in EXEMPLOS.items() for t in ts])
def test_regras_acertam_cada_categoria(categoria: str, texto: str) -> None:
    r = classify_by_rules(texto)
    assert r.category == categoria, (texto, r.scores)
    assert 0 < r.confidence <= 1


def test_taxonomia_tem_as_categorias_dos_exemplos() -> None:
    assert set(EXEMPLOS) == set(CATEGORIES) - {DEFAULT_CATEGORY}


def test_sem_palavra_chave_cai_em_general() -> None:
    r = classify_by_rules("bom dia, tudo bem?")
    assert r.category == DEFAULT_CATEGORY and r.confidence == 0


def test_complexidade_pelos_sinais() -> None:
    assert classify_by_rules("corrija um typo simples no README").complexity == "low"
    alta = classify_by_rules(
        "migre a arquitetura inteira do sistema para microsserviços, depois integre a autenticação, "
        "em seguida configure o deploy ponta a ponta e por fim documente tudo em vários arquivos")
    assert alta.complexity == "high" and alta.complexity_signals
    assert classify_by_rules("implemente a exportação em PDF no relatório mensal").complexity == "medium"


def test_ferramentas_provaveis() -> None:
    r = classify_by_rules("procure onde o erro acontece, corrija o arquivo e rode o pytest")
    assert {"Grep", "Edit", "Read", "Bash"} <= set(r.tools)
    assert "WebFetch" in classify_by_rules("leia a documentação em https://exemplo.dev").tools


def test_modulos_de_regras_nao_carregam_numpy_nem_pydantic() -> None:
    codigo = ("import sys; import hela.learning.rules, hela.learning.taxonomy, hela.learning.naive_bayes; "
              "print(sorted(m for m in ('numpy','networkx','pydantic') if m in sys.modules))")
    r = subprocess.run([sys.executable, "-c", codigo], capture_output=True, text=True, timeout=60,
                       cwd=Path(__file__).resolve().parents[1])
    assert r.returncode == 0, r.stderr
    assert r.stdout.strip() == "[]"


# --- Naive Bayes ------------------------------------------------------------------------

def _separavel(n: int = 8) -> tuple[list[str], list[str]]:
    textos, rotulos = [], []
    for i in range(n):
        textos.append(f"fatura boleto cobrança cliente {i} vencimento pagamento")
        rotulos.append("financeiro")
        textos.append(f"escala plantão turno equipe {i} folga enfermagem")
        rotulos.append("escala")
    return textos, rotulos


def test_tokenize_normaliza_e_faz_bigramas() -> None:
    assert tokenize("Renderização de VÍDEO") == ["renderizacao", "video", "renderizacao_video"]


def test_naive_bayes_aprende_conjunto_separavel() -> None:
    textos, rotulos = _separavel()
    nb = MultinomialNB(alpha=1.0).fit(textos, rotulos)
    assert nb.predict(["boleto do cliente venceu", "trocar o plantão da equipe"]) == ["financeiro", "escala"]
    proba = nb.predict_proba(["boleto"])[0]
    assert abs(sum(proba.values()) - 1) < 1e-9 and proba["financeiro"] > 0.5
    copia = MultinomialNB.from_params(json.loads(json.dumps(nb.to_params())))
    assert copia.predict_proba(["boleto"]) == nb.predict_proba(["boleto"])


def test_naive_bayes_contas_conhecidas() -> None:
    # Contas à mão: vocabulário {a, b}, alpha 1. Classe x: a,a,b → P(a|x)=3/5. Classe y: b → P(a|y)=1/3.
    nb = MultinomialNB(alpha=1.0, bigrams=False).fit(["aa aa bb", "bb"], ["x", "y"])
    p = nb.predict_proba(["aa"])[0]
    esperado_x = 0.5 * 3 / 5
    esperado_y = 0.5 * 1 / 3
    assert p["x"] == pytest.approx(esperado_x / (esperado_x + esperado_y))


def test_validacao_cruzada_deterministica() -> None:
    textos, rotulos = _separavel()
    a = cross_validate(textos, rotulos, folds=4, alpha=1.0, seed=7)
    b = cross_validate(textos, rotulos, folds=4, alpha=1.0, seed=7)
    assert a == b and a["folds"] == 4 and a["accuracy"] == 1.0


# --- TaskClassifier (banco) -------------------------------------------------------------

def _tarefa(db: Database, prompt: str, categoria: str | None, origem: str | None) -> None:
    db.conn.execute(
        "INSERT INTO tasks (id, prompt, category, label_source, created_at) VALUES (?, ?, ?, ?, ?)",
        (uuid.uuid4().hex, prompt, categoria, origem, "2026-11-18T12:00:00.000000+00:00"))


@pytest.fixture()
def clf(tmp_path: Path) -> TaskClassifier:
    return TaskClassifier(Database(tmp_path / "h.db"), HelaConfig(), clock=RelogioFalso())


def _legitimos(clf: TaskClassifier, n: int = 8) -> int:
    textos, rotulos = _separavel(n)
    for i, (t, r) in enumerate(zip(textos, rotulos)):
        _tarefa(clf.db, t, r, "explicit" if i % 2 else "feedback")
    return len(textos)


def test_rotulos_das_regras_nao_treinam(clf: TaskClassifier, monkeypatch: pytest.MonkeyPatch) -> None:
    n_legitimos = _legitimos(clf)
    for i in range(100):  # rótulos das próprias regras e previsões do modelo (label_source NULL)
        _tarefa(clf.db, f"texto automático {i} boleto plantão", "categoria_das_regras", "rules")
        _tarefa(clf.db, f"previsão {i}", "categoria_prevista", None)
    vistos: list[str] = []
    original = MultinomialNB.fit

    def espiao(self, textos, rotulos):  # type: ignore[no-untyped-def]
        vistos.extend(rotulos)
        return original(self, textos, rotulos)

    monkeypatch.setattr(MultinomialNB, "fit", espiao)
    rel = clf.train()
    assert rel.trained and rel.n_samples == n_legitimos
    assert set(rel.classes) == {"financeiro", "escala"}
    assert vistos and not {"categoria_das_regras", "categoria_prevista"} & set(vistos)
    assert {e.source for e in clf.training_examples()} <= {"explicit", "feedback"}


def test_treinador_recusa_rotulo_de_regra(clf: TaskClassifier) -> None:
    with pytest.raises(ValueError, match="rules"):
        clf.train([Example("qualquer coisa", "debug", "rules")])


def test_minimo_por_classe(clf: TaskClassifier) -> None:
    _legitimos(clf, n=4)  # 4 por classe < min_per_class (5)
    rel = clf.train()
    assert not rel.trained and "mínimo" in rel.reason
    assert clf.status()["mode"] == "rules"


def test_modelo_so_assume_quando_bate_as_regras(clf: TaskClassifier) -> None:
    n = _legitimos(clf)
    rel = clf.train()
    assert rel.trained and rel.activated
    assert rel.cv_accuracy == 1.0 and rel.rules_accuracy == 0.0
    st = clf.status()
    assert st["mode"] == "naive_bayes"
    assert st["model"]["n_samples"] == n and st["model"]["cv_accuracy"] == 1.0
    r = clf.classify("boleto atrasado do cliente")
    assert r["category"] == "financeiro" and r["mode"] == "naive_bayes"
    assert r["rules_category"] != "financeiro" and r["complexity"] in {"low", "medium", "high"}
    linha = clf.db.conn.execute("SELECT algo, active, label_sources FROM classifier_models").fetchone()
    assert linha["algo"] == "naive_bayes" and linha["active"] == 1
    assert set(json.loads(linha["label_sources"])) <= {"explicit", "feedback"}


def test_modelo_que_nao_supera_as_regras_fica_inativo(clf: TaskClassifier) -> None:
    for cat in ("media", "git"):
        for t in EXEMPLOS[cat] * 3:
            _tarefa(clf.db, t, cat, "explicit")
    rel = clf.train()
    assert rel.trained and not rel.activated and rel.rules_accuracy == 1.0
    assert clf.status()["mode"] == "rules"
    assert clf.classify("converter vídeo para gif")["mode"] == "rules"


def test_status_sem_dados(clf: TaskClassifier) -> None:
    st = clf.status()
    assert st["mode"] == "rules" and st["model"] is None and st["labeled_examples"] == 0
