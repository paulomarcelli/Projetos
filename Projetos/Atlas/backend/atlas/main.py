"""API HTTP do ATLAS (FastAPI)."""
from __future__ import annotations

import asyncio
import logging
import time
from collections import defaultdict, deque
from typing import Callable

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import __version__, casos, motor
from .config import Config, carregar
from .modelos import Caso, Comparacao, Evento, Resultado, ResumoSimulacao, SimulacaoEntrada
from .orquestrador import Orquestrador, preparar, provedores
from .persistencia import Banco

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
LIMITE_CORPO = 64 * 1024


class Limitador:
    """Janela deslizante por IP para rotas que disparam simulações (protege cotas)."""

    def __init__(self, maximo: int, janela_s: float):
        self.maximo, self.janela = maximo, janela_s
        self._hist: dict[str, deque[float]] = defaultdict(deque)

    def permitir(self, chave: str) -> bool:
        agora = time.monotonic()
        h = self._hist[chave]
        while h and agora - h[0] > self.janela:
            h.popleft()
        if len(h) >= self.maximo:
            return False
        h.append(agora)
        return True


def criar_app(cfg: Config | None = None, banco: Banco | None = None, fabrica_provedores: Callable | None = None) -> FastAPI:
    cfg = cfg or carregar()
    banco = banco or Banco(cfg.db_path)
    fabrica = fabrica_provedores or provedores
    app = FastAPI(title="ATLAS — Geopolitical Simulation Engine", version=__version__)
    app.state.cfg, app.state.banco, app.state.tarefas = cfg, banco, set()
    limitador = Limitador(maximo=6, janela_s=60)

    app.add_middleware(CORSMiddleware, allow_origins=list(cfg.origens_cors), allow_methods=["GET", "POST", "DELETE"], allow_headers=["Content-Type"])

    @app.middleware("http")
    async def limite_corpo(request: Request, call_next):
        tamanho = request.headers.get("content-length")
        if tamanho and int(tamanho) > LIMITE_CORPO:
            return JSONResponse({"detail": "Corpo da requisição grande demais."}, status_code=413)
        resposta = await call_next(request)
        resposta.headers["X-Content-Type-Options"] = "nosniff"
        return resposta

    @app.get("/api/saude")
    def saude() -> dict:
        llm, busca = fabrica(cfg)
        uso = banco.uso_hoje()
        return {
            "versao": __version__,
            "modo": {"ia": llm.nome, "busca": busca.nome, "demonstrativo": llm.nome == "demo" or busca.nome == "demo"},
            "modelo": cfg.modelo_ia if llm.nome != "demo" else None,
            "credenciais": {"gemini": bool(cfg.gemini_api_key), "tavily": bool(cfg.tavily_api_key), "openai_compat": bool(cfg.openai_api_key)},
            "provedores": {"ia": cfg.provedor_ia, "busca": cfg.provedor_busca},
            "limites": {"max_revisoes": cfg.max_revisoes, "max_chamadas_llm_por_simulacao": cfg.max_chamadas_llm, "max_buscas_por_simulacao": cfg.max_buscas, "max_simulacoes_dia": cfg.max_simulacoes_dia},
            "uso_hoje": uso,
        }

    @app.get("/api/casos", response_model=list[Caso])
    def listar_casos() -> list[Caso]:
        return casos.listar()

    @app.get("/api/casos/{caso_id}", response_model=Caso)
    def obter_caso(caso_id: str) -> Caso:
        if caso_id == "personalizado":  # modelo com as variáveis genéricas, para montar o formulário
            return casos.caso_personalizado("", "Descreva a situação.")
        c = casos.obter(caso_id)
        if not c:
            raise HTTPException(404, "Caso não encontrado.")
        return c

    @app.post("/api/simulacoes", status_code=202)
    async def criar(entrada: SimulacaoEntrada, request: Request) -> dict:
        ip = request.client.host if request.client else "local"
        if not limitador.permitir(ip):
            raise HTTPException(429, "Muitas simulações em pouco tempo. Aguarde um minuto.")
        llm, busca = fabrica(cfg)
        # o teto diário protege cotas remotas; o Ollama roda localmente e não tem cota
        if llm.nome not in ("demo", "ollama") and cfg.max_simulacoes_dia and banco.uso_hoje()["simulacoes"] >= cfg.max_simulacoes_dia:
            raise HTTPException(429, f"Limite diário de {cfg.max_simulacoes_dia} simulações com IA atingido (protege a cota gratuita).")
        try:
            r = preparar(entrada, cfg, banco, llm, busca)
        except motor.ErroValidacao as e:
            raise HTTPException(422, str(e)) from e
        tarefa = asyncio.create_task(Orquestrador(cfg, banco, llm, busca).executar(r))
        app.state.tarefas.add(tarefa)
        tarefa.add_done_callback(app.state.tarefas.discard)
        return {"id": r.id, "status": r.status, "modo": r.modo.model_dump()}

    @app.get("/api/simulacoes", response_model=list[ResumoSimulacao])
    def listar(limite: int = Query(50, ge=1, le=200)) -> list[ResumoSimulacao]:
        return banco.listar(limite)

    @app.get("/api/simulacoes/{sim_id}", response_model=Resultado)
    def obter(sim_id: str) -> Resultado:
        r = banco.obter(sim_id)
        if not r:
            raise HTTPException(404, "Simulação não encontrada.")
        return r

    @app.get("/api/simulacoes/{sim_id}/eventos", response_model=list[Evento])
    def eventos(sim_id: str, desde: int = Query(0, ge=0)) -> list[Evento]:
        if not banco.obter(sim_id):
            raise HTTPException(404, "Simulação não encontrada.")
        return banco.eventos(sim_id, desde)

    @app.delete("/api/simulacoes/{sim_id}", status_code=204)
    def apagar(sim_id: str) -> None:
        if not banco.apagar(sim_id):
            raise HTTPException(404, "Simulação não encontrada.")

    @app.get("/api/comparar", response_model=Comparacao)
    def comparar(a: str, b: str) -> Comparacao:
        ra, rb = banco.obter(a), banco.obter(b)
        if not ra or not rb:
            raise HTTPException(404, "Simulação não encontrada.")
        return motor.comparar(ra, rb)

    return app


app = criar_app()
