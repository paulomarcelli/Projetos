"""Classe de execução de um procedimento, sem dependências pesadas.

Fica fora de procedures.py para o hook (caminho leve, revisão F3-A2) e o ProcedureService usarem a
mesma regra:
- reuse:          sem script; são passos para o Claude seguir;
- script:         aprovado por um humano para este sha256 e esta linguagem, validador sem achados e
                  origem confiável;
- human_approval: todo o resto.
"""

from __future__ import annotations

from typing import Any, Iterable, Optional


# Qualquer origem com uma destas marcas conta como web (revisão F3-A4: sem caixa e por conteúdo).
MARCAS_WEB = ("web", "fetch", "search", "http")


def is_web_origin(texto: Optional[str]) -> bool:
    valor = str(texto or "").casefold()
    return any(marca in valor for marca in MARCAS_WEB)


def trusted_origin(memoria: Optional[dict[str, Any]]) -> bool:
    """Origem confiável: não veio de import nem da web (pela origem gravada ou pela porta)."""
    if memoria is None:
        return False
    if memoria.get("source") == "import":
        return False
    meta = memoria.get("metadata") or {}
    return not any(is_web_origin(v) for v in (meta.get("origin"), meta.get("door_origin"), memoria.get("source")))


def approval_valid(row: Any) -> bool:
    """Aprovação vale para este sha256 **e** esta linguagem (revisão F3-M2): o mesmo texto lido como outra
    linguagem é outro programa. Aprovação antiga, sem linguagem gravada, deixa de valer (aprovar de novo)."""
    try:
        lingua = row["approved_language"]
    except (IndexError, KeyError):
        lingua = None
    return (bool(row["approved"]) and bool(row["script"]) and row["approved_sha256"] == row["script_sha256"]
            and lingua is not None and lingua == row["script_language"])


APPROVAL_SQL = ("approved = 1 AND script IS NOT NULL AND approved_sha256 = script_sha256"
                " AND approved_language = script_language")


def assess_procedure(row: Any, memoria: Optional[dict[str, Any]],
                     allowed_hosts: Iterable[str]) -> tuple[str, list[str], Optional[dict]]:
    """(classe, motivos, validação). row: a linha de procedures; memoria: status, source e metadata."""
    if memoria is not None and memoria["status"] == "quarantined":
        return "human_approval", ["a memória do procedimento está em quarentena (suspeita de injeção)"], None
    script = row["script"]
    if not script:
        return "reuse", ["sem script: passos para o Claude seguir"], None
    from hela.execution.validator import validate_script  # tardio: ~15 ms de regex que o hook quase nunca usa

    validacao = validate_script(script, row["script_language"], allowed_hosts=list(allowed_hosts)).as_dict()
    motivos = []
    if not trusted_origin(memoria):
        motivos.append("origem não confiável (web ou import): nunca sai como executável")
    if validacao["findings"]:
        motivos.append("o validador encontrou: " + ", ".join(validacao["rules"]))
    if not approval_valid(row):
        if not row["approved_sha256"]:
            motivos.append("script sem aprovação humana para este sha256")
        elif row["approved_sha256"] != row["script_sha256"]:
            motivos.append("o script mudou depois da aprovação (sha256 diferente)")
        else:
            motivos.append("a linguagem mudou depois da aprovação (ou a aprovação é anterior à linguagem gravada)")
    if motivos:
        return "human_approval", motivos, validacao
    return "script", ["aprovado por um humano, validador sem achados e origem confiável; "
                      "a HELA não executa: quem executa é o Claude ou o usuário"], validacao
