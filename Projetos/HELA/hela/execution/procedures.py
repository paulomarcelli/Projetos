"""Procedimentos reutilizáveis: criar, consultar, avaliar a classe de execução e aprovar por sha256.

Um procedimento é uma memória procedural (busca, grafo, qualidade) mais uma linha em procedures
(passos, script, sha256, validação, aprovação, contagem de sucesso e falha).

Classe de execução de um procedimento:
- reuse:          sem script; são passos para o Claude seguir;
- script:         script aprovado por um humano (o sha256 aprovado é o do script atual), sem achados
                  do validador e de origem confiável;
- human_approval: qualquer outro caso (não aprovado, script mudou depois da aprovação, achados do
                  validador, origem web/import, memória em quarentena).

A HELA **nunca executa** o script: ele sai como dado, dentro do invólucro <hela_memories>.
Aprovar é uma decisão humana: approve() é chamado pela CLI ou pela API do dashboard, nunca pelo MCP.
"""

from __future__ import annotations

import json
import uuid
from typing import Any, Optional

from hela.core.clock import to_iso
from hela.core.config import HelaConfig
from hela.core.errors import InvalidInput, NotFound
from hela.execution.assessment import MARCAS_WEB, assess_procedure, trusted_origin  # noqa: F401
from hela.execution.validator import LANGUAGE_ALIASES, LANGUAGES, detect_language, script_sha256, validate_script
from hela.memory.models import MemoryCreate, MemoryUpdate
from hela.memory.service import MemoryService
from hela.security.envelope import wrap_as_data
from hela.security.redaction import redact
from hela.storage.repositories.memories import MemoryFilter

MAX_SCRIPT = 20_000
MAX_STEPS = 50
ACEITAS = frozenset(LANGUAGES) | frozenset(LANGUAGE_ALIASES)


def _texto_da_memoria(name: str, description: Optional[str], steps: list[str], script: Optional[str],
                      language: Optional[str]) -> str:
    partes = [name]
    if description:
        partes.append(description)
    if steps:
        partes.append("Passos:\n" + "\n".join(f"{i}. {p}" for i, p in enumerate(steps, start=1)))
    if script:
        partes.append(f"Script ({language}):\n```{language}\n{script}\n```")
    return "\n\n".join(partes)


class ProcedureService:
    def __init__(self, memories: MemoryService, config: HelaConfig, searcher: Any = None) -> None:
        self.memories = memories
        self.db = memories.db
        self.config = config
        self._searcher = searcher

    @property
    def searcher(self) -> Any:
        if self._searcher is None:
            from hela.memory.search import HybridSearch

            self._searcher = HybridSearch(self.memories)
        return self._searcher

    # --- utilitários ---------------------------------------------------------------------
    def _redigir(self, texto: Optional[str]) -> Optional[str]:
        if texto is None:
            return None
        sec = self.config.security
        return redact(texto, entropy_threshold=sec.entropy_threshold, entropy_min_length=sec.entropy_min_length).text

    def _validar_entrada(self, name: str, steps: Optional[list[str]], script: Optional[str],
                         language: Optional[str]) -> None:
        if not isinstance(name, str) or not name.strip() or len(name) > 200:
            raise InvalidInput("name precisa ter de 1 a 200 caracteres")
        if steps is not None and (not isinstance(steps, list) or len(steps) > MAX_STEPS
                                  or any(not isinstance(p, str) or not p.strip() or len(p) > 500 for p in steps)):
            raise InvalidInput(f"steps precisa ser uma lista de até {MAX_STEPS} textos de 1 a 500 caracteres")
        if script is not None and (not isinstance(script, str) or not script.strip() or len(script) > MAX_SCRIPT):
            raise InvalidInput(f"script precisa ter de 1 a {MAX_SCRIPT} caracteres")
        if language is not None and (not isinstance(language, str) or language.strip().lower() not in ACEITAS):
            raise InvalidInput(f"language precisa ser uma de {', '.join(LANGUAGES)}")

    def _linha(self, procedure_id: str) -> Any:
        row = self.db.conn.execute("SELECT * FROM procedures WHERE id = ?", (procedure_id,)).fetchone()
        if row is None:
            raise NotFound(f"procedimento não encontrado: {procedure_id}")
        return row

    @staticmethod
    def trusted(memoria: Optional[dict[str, Any]]) -> bool:
        return trusted_origin(memoria)

    def _memoria(self, memory_id: Optional[str]) -> Optional[dict[str, Any]]:
        if not memory_id:
            return None
        row = self.db.conn.execute("SELECT id, status, source, metadata, project, quality, confidence"
                                   " FROM memories WHERE id = ?", (memory_id,)).fetchone()
        if row is None:
            return None
        d = dict(row)
        d["metadata"] = json.loads(d["metadata"] or "{}")
        return d

    def assess(self, row: Any, memoria: Optional[dict[str, Any]]) -> tuple[str, list[str], Optional[dict]]:
        """(classe, motivos, validação) de um procedimento, calculados na hora."""
        return assess_procedure(row, memoria, self.config.execution.allowed_hosts)

    def view(self, row: Any) -> dict[str, Any]:
        memoria = self._memoria(row["memory_id"])
        classe, motivos, validacao = self.assess(row, memoria)
        quarentena = memoria is not None and memoria["status"] == "quarantined"
        passos = json.loads(row["steps"] or "[]")
        conteudo = row["script"] if row["script"] else "\n".join(f"{i}. {p}" for i, p in enumerate(passos, 1))
        contexto = "" if quarentena else wrap_as_data([{
            "id": row["id"], "kind": "procedural", "title": row["name"], "status": classe,
            "content": conteudo or row["name"]}])
        return {
            "id": row["id"], "memory_id": row["memory_id"], "name": row["name"], "description": row["description"],
            "steps": passos, "script_language": row["script_language"],
            "script": None if quarentena else row["script"], "script_sha256": row["script_sha256"],
            "approved": bool(row["approved"]) and bool(row["script"]) and row["approved_sha256"] == row["script_sha256"],
            "approved_sha256": row["approved_sha256"], "approved_at": row["approved_at"],
            "exec_class": classe, "exec_reasons": motivos, "validation": validacao,
            "trusted_origin": self.trusted(memoria), "origin": (memoria or {}).get("metadata", {}).get("origin"),
            "memory_status": (memoria or {}).get("status"), "quarantined": quarentena,
            "success_count": row["success_count"], "failure_count": row["failure_count"], "last_used": row["last_used"],
            "created_at": row["created_at"], "updated_at": row["updated_at"], "context": contexto,
        }

    def _salvar_classe(self, procedure_id: str) -> dict[str, Any]:
        v = self.view(self._linha(procedure_id))
        self.db.conn.execute("UPDATE procedures SET exec_class = ?, validation = ? WHERE id = ?",
                             (v["exec_class"], json.dumps(v["validation"] or {}), procedure_id))
        return v

    # --- operações -----------------------------------------------------------------------
    def create(self, name: str, description: Optional[str] = None, steps: Optional[list[str]] = None,
               script: Optional[str] = None, language: Optional[str] = None, project: Optional[str] = None,
               tags: Optional[list[str]] = None, source: str = "mcp", origin: Optional[str] = None,
               session_id: Optional[str] = None, task_id: Optional[str] = None) -> dict[str, Any]:
        self._validar_entrada(name, steps, script, language)
        if not (description or steps or script):
            raise InvalidInput("um procedimento precisa de description, steps ou script")
        nome = self._redigir(name.strip()) or ""
        descricao = self._redigir(description.strip()) if description else None
        passos = [self._redigir(p.strip()) or "" for p in (steps or [])]
        roteiro = self._redigir(script) if script else None
        lang = detect_language(roteiro, language) if roteiro else None
        meta = {"origin": origin} if origin else {}
        res = self.memories.create(MemoryCreate(
            kind="procedural", title=nome[:300], content=_texto_da_memoria(nome, descricao, passos, roteiro, lang),
            summary=(descricao or "")[:2000] or None, project=project, tags=tags or [], source=source,
            metadata=meta, session_id=session_id, task_id=task_id))
        existente = self.db.conn.execute("SELECT id FROM procedures WHERE memory_id = ?",
                                         (res.memory.id,)).fetchone()
        if existente is not None:
            return {**self.get(existente["id"]), "created": False}
        pid = uuid.uuid4().hex
        agora = self.memories.now()
        with self.db.transaction():
            self.db.conn.execute(
                "INSERT INTO procedures (id, memory_id, name, description, steps, script, script_language,"
                " script_sha256, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (pid, res.memory.id, nome, descricao, json.dumps(passos, ensure_ascii=False), roteiro, lang,
                 script_sha256(roteiro) if roteiro else None, agora, agora))
            v = self._salvar_classe(pid)
            self.memories.events.log(agora, "procedure.created", "procedure", pid,
                                     {"memory_id": res.memory.id, "exec_class": v["exec_class"],
                                      "quarantined": res.quarantined})
        return {**v, "created": True}

    def get(self, procedure_id: str) -> dict[str, Any]:
        return self.view(self._linha(procedure_id))

    def by_memory(self, memory_id: str) -> Optional[dict[str, Any]]:
        row = self.db.conn.execute("SELECT * FROM procedures WHERE memory_id = ?", (memory_id,)).fetchone()
        return None if row is None else self.view(row)

    def list(self, query: Optional[str] = None, project: Optional[str] = None, limit: int = 20) -> list[dict[str, Any]]:
        if not 1 <= limit <= 200:
            raise InvalidInput("limit precisa estar entre 1 e 200")
        if query:
            filtro = MemoryFilter(kinds=["procedural"], project=project, include_global=project is not None)
            hits = self.searcher.search(query, filtro, limit=limit, record_access=False)
            saida = []
            for h in hits:
                p = self.by_memory(h.memory.id)
                if p is not None:
                    saida.append({**p, "score": h.score})
            return saida
        sql = ("SELECT p.* FROM procedures p JOIN memories m ON m.id = p.memory_id WHERE m.status = 'active'"
               + (" AND (m.project = ? OR m.project IS NULL)" if project else "")
               + " ORDER BY p.success_count DESC, p.updated_at DESC, p.id LIMIT ?")
        args: list[Any] = ([project] if project else []) + [limit]
        return [self.view(r) for r in self.db.conn.execute(sql, args)]

    def approve(self, procedure_id: str, sha256: str, acknowledge_findings: bool = False,
                approver: str = "cli") -> dict[str, Any]:
        """Decisão humana. Exige o sha256 do script revisado: qualquer byte diferente invalida."""
        row = self._linha(procedure_id)
        if not row["script"]:
            raise InvalidInput("este procedimento não tem script para aprovar")
        memoria = self._memoria(row["memory_id"])
        if memoria is not None and memoria["status"] == "quarantined":
            raise InvalidInput("a memória está em quarentena: revise e restaure antes de aprovar")
        if not self.trusted(memoria):
            raise InvalidInput("origem não confiável (web ou import): este script não pode ser aprovado; "
                               "crie um procedimento novo com o texto revisado por você")
        if not isinstance(sha256, str) or sha256.strip().lower() != row["script_sha256"]:
            raise InvalidInput("o sha256 informado não é o do script atual: revise o script e aprove de novo")
        validacao = validate_script(row["script"], row["script_language"],
                                    allowed_hosts=self.config.execution.allowed_hosts)
        if validacao.findings and not acknowledge_findings:
            regras = ", ".join(sorted({f.rule for f in validacao.findings}))
            raise InvalidInput(f"o validador encontrou achados ({regras}); para aprovar mesmo assim, "
                               "confirme que leu os achados (acknowledge_findings)")
        agora = self.memories.now()
        with self.db.transaction():
            self.db.conn.execute("UPDATE procedures SET approved = 1, approved_sha256 = ?, approved_at = ?,"
                                 " updated_at = ? WHERE id = ?", (row["script_sha256"], agora, agora, procedure_id))
            v = self._salvar_classe(procedure_id)
            self.memories.events.log(agora, "procedure.approved", "procedure", procedure_id,
                                     {"sha256": row["script_sha256"], "approver": approver,
                                      "findings": len(validacao.findings)})
        return v

    def revoke(self, procedure_id: str) -> dict[str, Any]:
        self._linha(procedure_id)
        agora = self.memories.now()
        with self.db.transaction():
            self.db.conn.execute("UPDATE procedures SET approved = 0, approved_sha256 = NULL, approved_at = NULL,"
                                 " updated_at = ? WHERE id = ?", (agora, procedure_id))
            v = self._salvar_classe(procedure_id)
            self.memories.events.log(agora, "procedure.revoked", "procedure", procedure_id, {})
        return v

    def update_script(self, procedure_id: str, script: str, language: Optional[str] = None) -> dict[str, Any]:
        """Troca o script. A aprovação antiga fica registrada, mas deixa de valer (sha256 diferente)."""
        row = self._linha(procedure_id)
        self._validar_entrada(row["name"], None, script, language)
        roteiro = self._redigir(script) or ""
        lang = detect_language(roteiro, language or row["script_language"])
        agora = self.memories.now()
        with self.db.transaction():
            self.db.conn.execute("UPDATE procedures SET script = ?, script_language = ?, script_sha256 = ?,"
                                 " updated_at = ? WHERE id = ?",
                                 (roteiro, lang, script_sha256(roteiro), agora, procedure_id))
        if row["memory_id"]:
            texto = _texto_da_memoria(row["name"], row["description"], json.loads(row["steps"] or "[]"), roteiro, lang)
            self.memories.update(row["memory_id"], MemoryUpdate(content=texto))
        with self.db.transaction():
            v = self._salvar_classe(procedure_id)
            self.memories.events.log(agora, "procedure.script_changed", "procedure", procedure_id,
                                     {"sha256": script_sha256(roteiro), "approval_valid": v["approved"]})
        return v
