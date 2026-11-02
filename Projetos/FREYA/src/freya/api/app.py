"""API da F.R.E.Y.A. Um único produto: a investigação prospectiva e o grafo que a sustenta.

POST /investigacoes                         cria e executa (em segundo plano) uma investigação
GET  /investigacoes/{id}                    estado, etapas e a análise prospectiva
GET  /investigacoes/{id}/grafo              nós, arestas, evidências, sequência de animação, caminhos, cenários
GET  /investigacoes/{id}/grafo/expandir     vizinhos de um nó (exploração)
GET  /investigacoes/{id}/grafo/caminho      caminhos entre dois nós
GET  /investigacoes/{id}/evidencias/{eid}   uma evidência com a fonte
GET  /saude                                 serviços e modo do motor

Não há conversa, histórico de mensagens nem respostas livres: só investigações.
"""
from __future__ import annotations

from fastapi import BackgroundTasks, FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

from freya.fabrica import Componentes
from freya.investigacao.orquestrador import Estado


class PedidoDeInvestigacao(BaseModel):
    questao: str = Field(min_length=8, max_length=600, description="Tema, acontecimento ou questão de investigação sobre o MCU")
    horizonte: str | None = Field(default=None, max_length=120, description="Ex.: 'após Avengers: Endgame', 'próxima fase'")


def criar_app(comp: Componentes, sincrono: bool = False) -> FastAPI:
    app = FastAPI(title="F.R.E.Y.A.", version="0.1.0",
                  description="Inteligência prospectiva sobre o MCU: Hybrid RAG + GraphRAG + motor prospectivo.")
    orq = comp.orquestrador

    def obter(iid: str):
        inv = orq.repo.obter(iid)
        if inv is None:
            raise HTTPException(404, "investigação não encontrada")
        return inv

    @app.get("/saude")
    def saude():
        return {"status": "ok", "motor": "modelo" if comp.modelo else "deterministico", "modelo": getattr(comp.modelo, "nome", None),
                "grafo": type(comp.grafo).__name__}

    @app.post("/investigacoes", status_code=202)
    def criar(p: PedidoDeInvestigacao, tarefas: BackgroundTasks):
        try:
            inv = orq.criar(p.questao, p.horizonte)
        except ValueError as e:
            raise HTTPException(422, str(e)) from e
        if sincrono:
            inv = orq.executar(inv.id)
        else:
            tarefas.add_task(orq.executar, inv.id)
        return {"id": inv.id, "estado": inv.estado.value, "acompanhar": f"/investigacoes/{inv.id}"}

    @app.get("/investigacoes/{iid}")
    def ler(iid: str):
        inv = obter(iid)
        return inv.model_dump(mode="json", exclude={"grafo", "registro"}) | {
            "grafo": f"/investigacoes/{iid}/grafo" if inv.grafo else None,
            "evidencias": {k: v.model_dump() for k, v in inv.registro.itens.items()}}

    @app.get("/investigacoes/{iid}/grafo")
    def grafo(iid: str):
        inv = obter(iid)
        if inv.estado != Estado.CONCLUIDA or inv.grafo is None:
            raise HTTPException(409, f"investigação ainda não concluída (estado: {inv.estado.value})")
        return inv.grafo.model_dump(mode="json")

    @app.get("/investigacoes/{iid}/grafo/expandir")
    def expandir(iid: str, no: str = Query(..., description="chave do nó, ex.: character:thanos"), limite: int = Query(25, ge=1, le=200),
                 incluir_catalogo: bool = False):
        obter(iid)
        try:
            return orq.expandir(iid, no, limite, incluir_catalogo)
        except LookupError as e:
            raise HTTPException(404, f"nó não encontrado: {e}") from e

    @app.get("/investigacoes/{iid}/grafo/caminho")
    def caminho(iid: str, de: str, para: str, max_saltos: int = Query(4, ge=1, le=6)):
        obter(iid)
        try:
            return orq.caminho(iid, de, para, max_saltos)
        except LookupError as e:
            raise HTTPException(404, f"nó não encontrado: {e}") from e

    @app.get("/investigacoes/{iid}/evidencias/{eid}")
    def evidencia(iid: str, eid: str):
        inv = obter(iid)
        if eid not in inv.registro.itens:
            raise HTTPException(404, "evidência não encontrada")
        return inv.registro.itens[eid].model_dump()

    return app
