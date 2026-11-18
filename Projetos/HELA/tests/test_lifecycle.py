"""Testes do ciclo de vida: consolidação de quase-duplicatas e expiração."""

from __future__ import annotations

from pathlib import Path

import pytest

from hela.memory.consolidation import consolidate
from hela.memory.models import MemoryCreate
from hela.memory.search import HybridSearch
from hela.memory.service import MemoryService
from hela.storage.repositories.memories import MemoryFilter
from tests.helpers import RelogioFalso, novo_servico

BASE = "Para publicar o site rode npm run build e copie a pasta dist para o Pages"


@pytest.fixture
def relogio() -> RelogioFalso:
    return RelogioFalso()


@pytest.fixture
def svc(tmp_path: Path, relogio: RelogioFalso) -> MemoryService:
    return novo_servico(tmp_path / "c.db", relogio)


def _criar(svc: MemoryService, texto: str, **kw) -> str:
    return svc.create(MemoryCreate(kind=kw.pop("kind", "procedural"), content=texto, **kw)).memory.id


def test_consolida_quase_duplicatas_e_mantem_a_melhor(svc: MemoryService, relogio: RelogioFalso) -> None:
    fraca = _criar(svc, BASE + ".", quality=0.3, tags=["deploy"], importance=0.9)
    forte = _criar(svc, BASE + "!", quality=0.9, confidence=0.8, tags=["pages"])
    outra = _criar(svc, "Renderização no Blender usa Cycles com 128 amostras")
    for _ in range(3):
        svc.get(fraca)
    relogio.avancar(hours=2)
    svc.get(forte)

    rel = consolidate(svc)

    assert rel.merged == 1
    assert rel.clusters[0].winner == forte and rel.clusters[0].merged == [fraca]
    vencedora = svc.get(forte, record_access=False)
    assert vencedora.content == BASE + "!"
    assert vencedora.access_count == 4  # 3 + 1: os acessos somam
    assert vencedora.last_accessed == "2026-11-18T14:00:00.000000+00:00"
    assert vencedora.tags == ["deploy", "pages"]
    assert vencedora.importance == 0.9
    perdedora = svc.get(fraca, record_access=False)
    assert perdedora.status == "merged" and perdedora.merged_into == forte
    assert svc.get(outra, record_access=False).status == "active"
    assert any(e["type"] == "consolidation.run" for e in svc.events.recent(100))


def test_consolidacao_move_relacoes_para_a_vencedora(svc: MemoryService) -> None:
    a = _criar(svc, BASE + ".", quality=0.2)
    b = _criar(svc, BASE + "!", quality=0.9)
    c = _criar(svc, "Pages publica a cada push na main", kind="semantic")
    svc.relate(a, c, "related", weight=0.4)
    svc.relate(a, b, "related")  # viraria laço: descartada
    consolidate(svc)
    rels = svc.relations(b)
    assert [(r["source_id"], r["target_id"], r["weight"]) for r in rels] == [(b, c, 0.4)]


def test_consolidacao_nao_junta_tipos_ou_projetos_diferentes(svc: MemoryService) -> None:
    _criar(svc, BASE + ".", kind="procedural")
    _criar(svc, BASE + "!", kind="semantic")
    _criar(svc, BASE + "?", kind="procedural", project="outro")
    assert consolidate(svc).merged == 0


def test_consolidacao_simulada_nao_muda_nada(svc: MemoryService) -> None:
    a = _criar(svc, BASE + ".")
    _criar(svc, BASE + "!")
    rel = consolidate(svc, dry_run=True)
    assert rel.merged == 1
    assert svc.get(a, record_access=False).status == "active"


def test_expiracao_marca_vencidas(svc: MemoryService, relogio: RelogioFalso) -> None:
    vence = _criar(svc, "token temporário do CI vale uma hora", expires_at="2026-11-18T13:00:00Z")
    fica = _criar(svc, "nota sem validade")
    assert svc.expire() == []
    relogio.avancar(hours=2)
    assert svc.expire() == [vence]
    assert svc.get(vence, record_access=False).status == "expired"
    assert svc.get(fica, record_access=False).status == "active"
    assert svc.list(MemoryFilter(statuses=["expired"]))[0].id == vence
    assert any(e["type"] == "memory.expired" for e in svc.events.recent(100))
    assert all(h.memory.id != vence for h in HybridSearch(svc).search("token temporário CI"))


def test_expires_at_aceita_fuso_e_normaliza_para_utc(svc: MemoryService) -> None:
    mid = _criar(svc, "com fuso", expires_at="2026-11-18T10:00:00-03:00")
    assert svc.get(mid, record_access=False).expires_at == "2026-11-18T13:00:00.000000+00:00"
