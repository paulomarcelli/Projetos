"""Separa uma tarefa em partes e classifica cada uma nas 4 classes de execução.

- human_approval: irreversível, destrutivo, público ou com custo (apagar, publicar, deploy, pagar,
  credenciais). Vence todas as outras: mesmo com um procedimento conhecido, pede um humano.
- reuse: já existe um procedimento conhecido para essa parte (procedure_lookup devolve um).
- script: trabalho determinístico que um script resolve (converter, renderizar, compilar, rodar testes).
- reasoning: o resto; precisa do raciocínio do Claude.

São **regras** (palavras-chave), não aprendizado. Módulo puro: sem numpy, networkx ou pydantic.
A HELA só classifica: nunca executa nada.
"""

from __future__ import annotations

import re
from typing import Any, Callable, Optional

from hela.learning.taxonomy import match_keywords, words

HUMAN_APPROVAL = (
    "apag*", "delet*", "remov*", "exclu*", "drop", "truncat*", "destru*", "wipe", "deploy*", "publiq*", "publicar",
    "publish*", "producao", "production", "push", "merge", "force push", "pagar", "pague", "pagamento", "payment",
    "comprar", "compre", "purchase", "assinatura", "subscription", "sudo", "senha", "senhas", "password*",
    "credencia*", "credential*", "segredo*", "secret*", "email", "e mail", "enviar mensagem", "send a message",
    "rm rf", "irreversivel", "irreversible",
)
SCRIPT = (
    "convert*", "convers*", "renderiz*", "render*", "compil*", "build", "redimension*", "resize*", "lote", "batch",
    "backup", "compact*", "compress*", "zip", "ffmpeg", "blender", "thumbnail*", "miniatura*", "lint*", "minif*",
    "formate o codigo", "format the code", "rode os testes", "rodar os testes", "run the tests", "export*",
    "extraia os frames", "extract frames", "gere os", "generate the",
)
REASONING = (
    "explic*", "explain*", "analis*", "analyz*", "projet*", "design*", "decid*", "escolh*", "choose", "por que",
    "why", "compare", "compar*", "planej*", "plan", "revis*", "review*", "investig*", "depur*", "debug*",
)

_ENUM = re.compile(r"(?m)^\s*(?:\d+[.)]|[-*•])\s+")
_CONECTORES = re.compile(
    r"\s*(?:[,;]\s*)?(?:\b(?:e|and)\s+)?\b(?:depois|em seguida|e entao|entao|por fim|finalmente|alem disso|"
    r"então|e então|além disso|then|after that|and then|finally)\b\s*[,:]?\s*", re.IGNORECASE)


def split_task(texto: str) -> list[str]:
    """Partes da tarefa: itens enumerados, ou trechos separados por conectores de sequência e por ';'."""
    texto = (texto or "").strip()
    if not texto:
        return []
    if len(_ENUM.findall(texto)) >= 2:
        partes = [p for p in _ENUM.split(texto) if p.strip()]
    else:
        partes = []
        for frase in re.split(r"(?<=[.!?;])\s+|\n+", texto):
            partes.extend(_CONECTORES.split(frase))
    return [p.strip().strip(",.;:").strip() for p in partes if p and p.strip().strip(",.;:").strip()]


def classify_parts(partes: list[str],
                   procedure_lookup: Optional[Callable[[str], Optional[dict[str, Any]]]] = None) -> list[dict[str, Any]]:
    saida = []
    for parte in partes:
        ps = words(parte)
        humano = match_keywords(ps, HUMAN_APPROVAL)
        item: dict[str, Any] = {"text": parte}
        if humano:
            item.update(exec_class="human_approval",
                        reason=f"ação irreversível, pública ou sensível ({', '.join(humano)}): precisa de um humano")
        else:
            proc = procedure_lookup(parte) if procedure_lookup else None
            script = match_keywords(ps, SCRIPT)
            if proc:
                item.update(exec_class="reuse", procedure=proc,
                            reason=f"já existe um procedimento conhecido: {proc.get('name') or proc.get('id')}")
            elif script:
                item.update(exec_class="script",
                            reason=f"trabalho determinístico ({', '.join(script)}): um script resolve; "
                                   "a execução continua com o Claude ou com quem pediu")
            else:
                pensar = match_keywords(ps, REASONING)
                item.update(exec_class="reasoning",
                            reason=(f"exige julgamento ({', '.join(pensar)})" if pensar
                                    else "sem procedimento conhecido: o Claude resolve"))
        saida.append(item)
    return saida
