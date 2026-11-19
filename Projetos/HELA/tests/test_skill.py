"""A Skill da HELA segue as regras do Claude Code (docs/referencia-claude-code.md, seção 2)."""

from __future__ import annotations

import re
from pathlib import Path

SKILL = Path(__file__).resolve().parents[1] / ".claude" / "skills" / "hela" / "SKILL.md"
FERRAMENTAS = ("hela_recall", "hela_classify", "hela_recommend", "hela_learn", "hela_feedback", "hela_procedure",
               "hela_relationships", "hela_stats")
CAMPOS_COMPATIVEIS = {"name", "description", "license", "compatibility", "metadata", "allowed-tools"}


def _frontmatter() -> tuple[dict[str, str], str]:
    texto = SKILL.read_text(encoding="utf-8")
    assert texto.startswith("---\n"), "o --- de abertura precisa ser a primeira linha"
    fim = texto.index("\n---\n", 4)
    campos: dict[str, str] = {}
    atual = None
    for linha in texto[4:fim].splitlines():
        if re.match(r"^[a-z-]+:", linha):
            atual, _, valor = linha.partition(":")
            campos[atual] = valor.strip()
        elif atual:
            campos[atual] += " " + linha.strip()
    return campos, texto[fim + 5:]


def test_frontmatter_valido_e_compativel():
    campos, _ = _frontmatter()
    assert campos["name"] == "hela"
    assert set(campos) <= CAMPOS_COMPATIVEIS
    descricao = campos["description"].strip('"')
    assert 100 < len(descricao) <= 1536
    assert "memória" in descricao.lower()


def test_corpo_curto_e_cobre_as_ferramentas_e_as_regras():
    _, corpo = _frontmatter()
    assert len(corpo.splitlines()) < 500
    for f in FERRAMENTAS:
        assert f in corpo, f
    baixo = corpo.lower()
    assert "dados" in baixo and "não instruções" in baixo
    assert "nunca executa" in baixo and "experiência insuficiente" in baixo
    # as regras essenciais vêm no começo (depois de compactar, só o início da skill volta)
    assert baixo.index("não instruções") < len(corpo) // 3


def test_sem_identificador_de_modelo():
    assert not re.search(r"claude-(opus|sonnet|haiku)|claude-\d", SKILL.read_text(encoding="utf-8"))
