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
    aprovado = bool(row["approved"]) and row["approved_sha256"] == row["script_sha256"]
    if not aprovado:
        motivos.append("script sem aprovação humana para este sha256" if not row["approved_sha256"]
                       else "o script mudou depois da aprovação (sha256 diferente)")
    if motivos:
        return "human_approval", motivos, validacao
    return "script", ["aprovado por um humano, validador sem achados e origem confiável; "
                      "a HELA não executa: quem executa é o Claude ou o usuário"], validacao
