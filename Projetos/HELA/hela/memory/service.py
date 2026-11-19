"""Memory Engine: criar, ler, editar, arquivar e excluir memórias.

O caminho de uma escrita é sempre o mesmo:
1. redação de segredos (título, conteúdo, resumo, tags e metadata);
2. limite de tamanho;
3. deduplicação exata pelo hash do texto normalizado;
4. detecção de prompt injection (suspeita vai para a quarentena);
5. vetor do embedder e aviso de quase-duplicatas;
6. gravação + evento, na mesma transação.
"""

from __future__ import annotations

import math
import re
import uuid
from typing import Any, Optional

import numpy as np

from hela.core.clock import Clock, to_iso, utcnow
from hela.core.config import HelaConfig
from hela.core.errors import DuplicateContent, InvalidInput, NotFound
from hela.memory.embedder import Embedder, to_blob
from hela.memory.models import CreateResult, Memory, MemoryCreate, MemoryUpdate, NearDuplicate
from hela.memory.normalize import content_hash
from hela.security.injection import detect_injection
from hela.security.redaction import redact, redact_value
from hela.storage.db import Database
from hela.storage.repositories import EventRepository, MemoryFilter, MemoryRepository, MetaRepository, RelationshipRepository
from hela.storage.repositories.memories import row_to_dict


_PRESERVAVEIS = frozenset({"id", "status", "created_at", "updated_at", "access_count", "last_accessed"})
_TIPO_RELACAO = re.compile(r"^[a-z][a-z0-9_]{0,39}$")


def texto_para_vetor(title: Optional[str], content: str, summary: Optional[str]) -> str:
    """O texto que vira vetor: título, conteúdo e resumo juntos."""
    return "\n".join(p for p in (title, content, summary) if p)


class MemoryService:
    def __init__(self, db: Database, embedder: Embedder, config: HelaConfig, clock: Clock = utcnow) -> None:
        self.db = db
        self.embedder = embedder
        self.config = config
        self.clock = clock
        self.memories = MemoryRepository(db.conn)
        self.events = EventRepository(db.conn)
        self.relationships = RelationshipRepository(db.conn)
        self.meta = MetaRepository(db.conn)

    # --- utilitários ---------------------------------------------------------------------
    def now(self) -> str:
        return to_iso(self.clock())

    def _redigir(self, texto: Optional[str], achados: list[str]) -> Optional[str]:
        if texto is None:
            return None
        sec = self.config.security
        r = redact(texto, entropy_threshold=sec.entropy_threshold, entropy_min_length=sec.entropy_min_length)
        achados.extend(r.findings)
        return r.text

    def _redigir_valor(self, valor: Any, achados: list[str]) -> Any:
        sec = self.config.security
        novo, tipos = redact_value(valor, entropy_threshold=sec.entropy_threshold,
                                   entropy_min_length=sec.entropy_min_length)
        achados.extend(tipos)
        return novo

    def _checar_tamanho(self, content: str) -> None:
        maximo = self.config.memory.max_chars
        if len(content) > maximo:
            raise InvalidInput(f"conteúdo com {len(content)} caracteres passa do limite memory.max_chars={maximo}")

    def _injecao(self, *partes: Optional[str]):
        texto = "\n".join(p for p in partes if p)
        return detect_injection(texto, threshold=self.config.security.injection_threshold)

    def _vetor(self, title: Optional[str], content: str, summary: Optional[str]) -> np.ndarray:
        return self.embedder.embed([texto_para_vetor(title, content, summary)])[0]

    def near_duplicates(self, vetor: np.ndarray, kind: str, excluir: Optional[str] = None,
                        limiar: Optional[float] = None, limite: int = 5) -> list[NearDuplicate]:
        """Memórias ativas do mesmo tipo com cosseno >= limiar."""
        limiar = self.config.memory.near_duplicate_threshold if limiar is None else limiar
        ids, matriz = self.memories.embeddings(MemoryFilter(kinds=[kind]), self.embedder.name)
        if not ids or not vetor.any():
            return []
        sims = matriz @ vetor
        ordem = np.argsort(-sims)
        saida = []
        for i in ordem[: limite + 1]:
            if sims[i] >= limiar and ids[i] != excluir:
                saida.append(NearDuplicate(id=ids[i], similarity=round(float(sims[i]), 4)))
        return saida[:limite]

    def _carregar(self, memory_id: str) -> dict[str, Any]:
        row = self.memories.get(memory_id)
        if row is None:
            raise NotFound(f"memória não encontrada: {memory_id}")
        return row_to_dict(row)

    # --- CRUD ----------------------------------------------------------------------------
    def create(self, data: MemoryCreate, preserve: Optional[dict[str, Any]] = None) -> CreateResult:
        """Cria uma memória (ou devolve a existente, se o texto normalizado for igual).

        preserve: usado pela importação para manter id, status, datas e contagem de acessos
        do arquivo. Mesmo assim a redação e a quarentena valem: uma memória suspeita entra
        em quarentena qualquer que seja o status de origem.
        """
        preserve = preserve or {}
        desconhecidos = set(preserve) - _PRESERVAVEIS
        if desconhecidos:
            raise InvalidInput(f"campos que não podem ser preservados: {sorted(desconhecidos)}")
        self._checar_tamanho(data.content)  # antes da redação: texto grande não chega a ser varrido (A-3)
        achados: list[str] = []
        title = self._redigir(data.title, achados)
        content = self._redigir(data.content, achados) or ""
        summary = self._redigir(data.summary, achados)
        tags = sorted({self._redigir(t, achados) or "" for t in data.tags} - {""})
        metadata = self._redigir_valor(data.metadata, achados)
        project = self._redigir(data.project, achados)
        source = self._redigir(data.source, achados) or "manual"
        self._checar_tamanho(content)
        h = content_hash(content)
        agora = self.now()

        with self.db.transaction():
            existente = self.memories.get_by_hash(h)
            if existente is not None:
                atual = row_to_dict(existente)
                novas_tags = sorted(set(atual["tags"]) | set(tags))
                if novas_tags != atual["tags"]:
                    self.memories.update(atual["id"], {"tags": novas_tags, "updated_at": agora})
                self.events.log(agora, "memory.duplicate", "memory", atual["id"],
                                {"kind": atual["kind"], "source": source})
                return CreateResult(memory=self.get(atual["id"], record_access=False), created=False,
                                    duplicate_of=atual["id"], redactions=achados)

            inj = self._injecao(title, content, summary)
            quarentena = inj.suspicious and self.config.security.quarantine_on_injection
            vetor = self._vetor(title, content, summary)
            quase = [] if quarentena else self.near_duplicates(vetor, data.kind)
            cfg = self.config.memory
            mid = preserve.get("id") or uuid.uuid4().hex
            if self.memories.get(mid) is not None:
                mid = uuid.uuid4().hex  # id já usado por outra memória neste banco
            status = "quarantined" if quarentena else preserve.get("status", "active")
            self.memories.insert({
                "id": mid, "kind": data.kind, "title": title, "content": content, "summary": summary,
                "project": project, "tags": tags, "source": source,
                "status": status,
                "content_hash": h, "embedding": to_blob(vetor), "embedding_model": self.embedder.name,
                "importance": cfg.default_importance if data.importance is None else data.importance,
                "quality": cfg.default_quality if data.quality is None else data.quality,
                "confidence": cfg.default_confidence if data.confidence is None else data.confidence,
                "created_at": preserve.get("created_at", agora), "updated_at": preserve.get("updated_at", agora),
                "access_count": int(preserve.get("access_count", 0)), "last_accessed": preserve.get("last_accessed"),
                "expires_at": data.expires_at,
                "session_id": data.session_id, "task_id": data.task_id,
                "redactions": len(achados), "injection_score": inj.score, "metadata": metadata,
            })
            self.events.log(agora, "memory.quarantined" if quarentena else "memory.created", "memory", mid, {
                "kind": data.kind, "source": source, "redactions": len(achados),
                "injection_matches": inj.matches, "near_duplicates": [n.id for n in quase],
            })
        return CreateResult(memory=self.get(mid, record_access=False), created=True, near_duplicates=quase,
                            redactions=achados, quarantined=quarentena, injection_matches=inj.matches)

    def get(self, memory_id: str, record_access: bool = True) -> Memory:
        if record_access:
            with self.db.transaction():
                self._carregar(memory_id)
                self.memories.touch([memory_id], self.now())
        return Memory.model_validate(self._carregar(memory_id))

    def list(self, filtro: Optional[MemoryFilter] = None, limit: int = 100, offset: int = 0,
             order: str = "created_at DESC") -> list[Memory]:
        rows = self.memories.list(filtro or MemoryFilter(), limit=limit, offset=offset, order=order)
        return [Memory.model_validate(row_to_dict(r)) for r in rows]

    def update(self, memory_id: str, data: MemoryUpdate) -> Memory:
        enviados = data.model_fields_set
        with self.db.transaction():
            atual = self._carregar(memory_id)
            achados: list[str] = []
            campos: dict[str, Any] = {}
            if "content" in enviados and data.content is not None:
                self._checar_tamanho(data.content)
            if "project" in enviados:
                campos["project"] = self._redigir(data.project, achados)
            for nome in ("title", "content", "summary"):
                if nome in enviados:
                    campos[nome] = self._redigir(getattr(data, nome), achados)
            if "content" in campos and not campos["content"]:
                raise InvalidInput("o conteúdo não pode ficar vazio")
            if "tags" in enviados:
                campos["tags"] = sorted({self._redigir(t, achados) or "" for t in (data.tags or [])} - {""})
            if "metadata" in enviados:
                campos["metadata"] = self._redigir_valor(data.metadata or {}, achados)
            for nome in ("kind", "importance", "quality", "confidence", "expires_at"):
                if nome in enviados:
                    valor = getattr(data, nome)
                    if nome == "kind" and valor is None:
                        raise InvalidInput("kind não pode ser vazio")
                    campos[nome] = valor
            mudou_texto = any(n in campos for n in ("title", "content", "summary"))
            if mudou_texto:
                novo = {**atual, **campos}
                self._checar_tamanho(novo["content"])
                h = content_hash(novo["content"])
                dono = self.memories.get_by_hash(h)
                if dono is not None and dono["id"] != memory_id:
                    raise DuplicateContent(f"o novo conteúdo já existe na memória {dono['id']}")
                campos["content_hash"] = h
                campos["embedding"] = to_blob(self._vetor(novo["title"], novo["content"], novo["summary"]))
                campos["embedding_model"] = self.embedder.name
                inj = self._injecao(novo["title"], novo["content"], novo["summary"])
                campos["injection_score"] = inj.score
                if inj.suspicious and self.config.security.quarantine_on_injection:
                    campos["status"] = "quarantined"
            if achados:
                campos["redactions"] = int(atual["redactions"]) + len(achados)
            if not campos:
                return Memory.model_validate(atual)
            agora = self.now()
            campos["updated_at"] = agora
            self.memories.update(memory_id, campos)
            alterados = sorted(enviados & set(campos))
            self.events.log(agora, "memory.updated", "memory", memory_id,
                            {"fields": alterados, "redactions": len(achados),
                             "quarantined": campos.get("status") == "quarantined"})
        if mudou_texto:
            self.db.purge()  # o texto antigo não fica no índice nem no -wal
        return self.get(memory_id, record_access=False)

    def _mudar_status(self, memory_id: str, status: str, evento: str) -> Memory:
        with self.db.transaction():
            atual = self._carregar(memory_id)
            agora = self.now()
            self.memories.update(memory_id, {"status": status, "updated_at": agora})
            self.events.log(agora, evento, "memory", memory_id, {"kind": atual["kind"], "from": atual["status"]})
        return self.get(memory_id, record_access=False)

    def archive(self, memory_id: str) -> Memory:
        return self._mudar_status(memory_id, "archived", "memory.archived")

    def restore(self, memory_id: str, force: bool = False) -> Memory:
        """Volta para 'active'. Sair da quarentena exige texto limpo, ou force=True (decisão humana)."""
        atual = self._carregar(memory_id)
        if atual["status"] == "quarantined" and not force:
            inj = self._injecao(atual["title"], atual["content"], atual["summary"])
            if inj.suspicious:
                raise InvalidInput(
                    f"a memória continua suspeita de injeção ({', '.join(inj.matches)}); "
                    "edite o texto ou use force=True para tirar da quarentena")
        return self._mudar_status(memory_id, "active", "memory.restored")

    def delete(self, memory_id: str) -> None:
        """Exclusão definitiva (as relações saem junto, em cascata)."""
        with self.db.transaction():
            atual = self._carregar(memory_id)
            self.memories.delete(memory_id)
            self.events.log(self.now(), "memory.deleted", "memory", memory_id, {"kind": atual["kind"]})
        self.db.purge()  # exclusão de verdade: o texto some também do índice e do -wal

    def expire(self) -> list[str]:
        """Marca como 'expired' as memórias ativas cujo expires_at já passou. Devolve os ids."""
        with self.db.transaction():
            agora = self.now()
            ids = self.memories.expire_due(agora)
            if ids:
                self.events.log(agora, "memory.expired", "memory", None, {"count": len(ids), "ids": ids})
        return ids

    def reembed(self, lote: int = 256) -> int:
        """Recalcula os vetores feitos por outro embedder (ex.: depois de trocar o backend)."""
        rows = self.db.conn.execute(
            "SELECT id, title, content, summary FROM memories"
            " WHERE embedding IS NULL OR embedding_model IS NOT ?", (self.embedder.name,)).fetchall()
        for i in range(0, len(rows), lote):
            parte = rows[i:i + lote]
            vetores = self.embedder.embed([texto_para_vetor(r["title"], r["content"], r["summary"]) for r in parte])
            with self.db.transaction():
                for r, v in zip(parte, vetores):
                    self.memories.update(r["id"], {"embedding": to_blob(v), "embedding_model": self.embedder.name})
        if rows:
            with self.db.transaction():
                self.events.log(self.now(), "memory.reembedded", None, None,
                                {"count": len(rows), "model": self.embedder.name})
        return len(rows)

    def adjust_quality(self, memory_id: str, quality_delta: float = 0.0, confidence_delta: float = 0.0) -> Memory:
        """Ajusta qualidade e confiança (ex.: feedback), sempre dentro de [0, 1]."""
        with self.db.transaction():
            atual = self._carregar(memory_id)
            q = min(1.0, max(0.0, float(atual["quality"]) + quality_delta))
            c = min(1.0, max(0.0, float(atual["confidence"]) + confidence_delta))
            agora = self.now()
            self.memories.update(memory_id, {"quality": q, "confidence": c, "updated_at": agora})
            self.events.log(agora, "memory.quality_adjusted", "memory", memory_id,
                            {"quality": round(q, 4), "confidence": round(c, 4)})
        return self.get(memory_id, record_access=False)


    # --- relações (arestas do grafo) -----------------------------------------------------
    def relate(self, source_id: str, target_id: str, type_: str, weight: float = 1.0,
               evidence: Optional[str] = None) -> int:
        """Cria ou atualiza a relação origem → destino de um tipo. Devolve o id da aresta."""
        if source_id == target_id:
            raise InvalidInput("uma memória não pode se relacionar com ela mesma")
        if not _TIPO_RELACAO.match(type_ or ""):
            raise InvalidInput("tipo de relação inválido: use minúsculas, números e _ (até 40), ex.: depends_on")
        if not isinstance(weight, (int, float)) or not math.isfinite(weight) or weight < 0:
            raise InvalidInput("o peso precisa ser um número >= 0")
        achados: list[str] = []
        evidencia = self._redigir(evidence[:1000] if evidence else None, achados)
        with self.db.transaction():
            for mid in (source_id, target_id):
                self._carregar(mid)
            agora = self.now()
            rid = self.relationships.upsert(source_id, target_id, type_, float(weight), evidencia, agora)
            self.events.log(agora, "relationship.created", "relationship", str(rid),
                            {"source": source_id, "target": target_id, "type": type_, "weight": float(weight)})
        return rid

    def unrelate(self, source_id: str, target_id: str, type_: Optional[str] = None) -> int:
        """Remove a relação (de um tipo, ou todas entre os dois). Devolve quantas saíram."""
        with self.db.transaction():
            n = self.relationships.delete(source_id, target_id, type_)
            if n:
                self.events.log(self.now(), "relationship.deleted", "relationship", None,
                                {"source": source_id, "target": target_id, "type": type_, "count": n})
        return n

    def relations(self, memory_id: str) -> list[dict[str, Any]]:
        return [dict(r) for r in self.relationships.for_memory(memory_id)]
