"""API HTTP do ATLAS (FastAPI): simulações, contas, sessões e turmas."""
from __future__ import annotations

import asyncio
import logging
import time
from collections import defaultdict, deque
from typing import Callable

from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import __version__, casos, motor
from .config import Config, carregar
from .contas import Contas, ErroConta
from .modelos import (
    CadastroEntrada, Caso, CenarioEntrada, Comparacao, Evento, LoginEntrada, Membro, Resultado,
    ResumoSimulacao, SimulacaoEntrada, Turma, TurmaEntrada, Usuario,
)
from .orquestrador import Orquestrador, preparar, provedores
from .persistencia import Banco

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
LIMITE_CORPO = 64 * 1024
COOKIE = "atlas_sessao"
CABECALHO_CSRF = "x-atlas"  # formulários de outros sites não conseguem enviar cabeçalhos próprios


class Limitador:
    """Janela deslizante por chave (IP) — protege cotas e dificulta tentativa de senhas."""

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


def _ip(request: Request) -> str:
    return request.client.host if request.client else "local"


def criar_app(cfg: Config | None = None, banco: Banco | None = None, fabrica_provedores: Callable | None = None) -> FastAPI:
    cfg = cfg or carregar()
    banco = banco or Banco(cfg.db_path)
    contas = Contas(banco, sessao_dias=cfg.sessao_dias, admin_emails=cfg.admin_emails)
    fabrica = fabrica_provedores or provedores
    app = FastAPI(title="ATLAS — Geopolitical Simulation Engine", version=__version__)
    app.state.cfg, app.state.banco, app.state.contas, app.state.tarefas = cfg, banco, contas, set()
    lim_simulacao = Limitador(maximo=6, janela_s=60)
    lim_auth = Limitador(maximo=10, janela_s=60)

    app.add_middleware(
        CORSMiddleware, allow_origins=list(cfg.origens_cors), allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["Content-Type", "X-ATLAS"],
    )

    @app.middleware("http")
    async def protecoes(request: Request, call_next):
        tamanho = request.headers.get("content-length")
        if tamanho and tamanho.isdigit() and int(tamanho) > LIMITE_CORPO:
            return JSONResponse({"detail": "Corpo da requisição grande demais."}, status_code=413)
        if request.method in ("POST", "PUT", "PATCH", "DELETE") and request.url.path.startswith("/api/") and request.headers.get(CABECALHO_CSRF) != "1":
            return JSONResponse({"detail": "Requisição sem o cabeçalho de proteção (X-ATLAS)."}, status_code=403)
        resposta = await call_next(request)
        resposta.headers["X-Content-Type-Options"] = "nosniff"
        resposta.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        resposta.headers["X-Frame-Options"] = "DENY"
        if request.url.path.startswith("/api/"):
            resposta.headers["Cache-Control"] = "no-store"
        return resposta

    @app.exception_handler(ErroConta)
    async def _erro_conta(_: Request, e: ErroConta):
        return JSONResponse({"detail": e.mensagem}, status_code=e.status)

    # ------------------------------------------------------------ autenticação
    def usuario_opcional(request: Request) -> Usuario | None:
        return contas.usuario_da_sessao(request.cookies.get(COOKIE))

    def usuario_atual(u: Usuario | None = Depends(usuario_opcional)) -> Usuario:
        if u is None:
            raise HTTPException(401, "Entre na sua conta para continuar.")
        return u

    def so_admin(u: Usuario = Depends(usuario_atual)) -> Usuario:
        if u.papel != "admin":
            raise HTTPException(403, "Área restrita à administração.")
        return u

    def _abrir_sessao(resposta: Response, u: Usuario) -> None:
        resposta.set_cookie(COOKIE, contas.criar_sessao(u.id), max_age=cfg.sessao_dias * 86400, httponly=True,
                            secure=cfg.cookie_seguro, samesite="lax", path="/")

    def _limite_auth(request: Request) -> None:
        if not lim_auth.permitir(_ip(request)):
            raise HTTPException(429, "Muitas tentativas em pouco tempo. Aguarde um minuto.")

    def _perfil(u: Usuario) -> dict:
        return {**u.model_dump(), "simulacoes_hoje": banco.simulacoes_hoje(u.id), "limite_dia": None if u.papel == "admin" else cfg.limite_usuario_dia}

    @app.post("/api/auth/cadastro", status_code=201)
    def cadastro(dados: CadastroEntrada, request: Request, resposta: Response) -> dict:
        _limite_auth(request)
        if not dados.aceite_termos:
            raise HTTPException(422, "É preciso aceitar os termos de uso e a política de privacidade.")
        u = contas.criar_usuario(dados.nome, dados.email, dados.senha, dados.papel)
        turma = None
        if dados.codigo_turma:
            try:
                turma = contas.entrar_na_turma(u, dados.codigo_turma)
            except ErroConta:
                turma = None  # conta criada mesmo assim; a pessoa pode entrar na turma depois
        _abrir_sessao(resposta, u)
        return {"usuario": _perfil(u), "turma": turma.model_dump() if turma else None, "codigo_invalido": bool(dados.codigo_turma and not turma)}

    @app.post("/api/auth/entrar")
    def entrar(dados: LoginEntrada, request: Request, resposta: Response) -> dict:
        _limite_auth(request)
        u = contas.autenticar(dados.email, dados.senha)
        _abrir_sessao(resposta, u)
        return {"usuario": _perfil(u)}

    @app.post("/api/auth/sair", status_code=204)
    def sair(request: Request, resposta: Response) -> None:
        contas.encerrar_sessao(request.cookies.get(COOKIE))
        resposta.delete_cookie(COOKIE, path="/")

    @app.get("/api/auth/eu")
    def eu(u: Usuario = Depends(usuario_atual)) -> dict:
        return _perfil(u)

    @app.get("/api/conta/exportar")
    def exportar(u: Usuario = Depends(usuario_atual)) -> dict:
        return contas.exportar(u.id)

    @app.delete("/api/conta")
    def excluir_conta(resposta: Response, u: Usuario = Depends(usuario_atual)) -> dict:
        apagado = contas.excluir_usuario(u.id)
        resposta.delete_cookie(COOKIE, path="/")
        return {"excluido": True, **apagado}

    # ------------------------------------------------------------ catálogo e estado
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
            "rotas": cfg.rotas_expandidas if cfg.ia == "roteado" else None,
            "limites": {"max_revisoes": cfg.max_revisoes, "max_chamadas_llm_por_simulacao": cfg.max_chamadas_llm, "max_buscas_por_simulacao": cfg.max_buscas, "max_simulacoes_dia": cfg.max_simulacoes_dia, "simulacoes_por_usuario_dia": cfg.limite_usuario_dia},
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

    # ------------------------------------------------------------ simulações
    def pode_ver(u: Usuario, r: Resultado) -> bool:
        if u.papel == "admin" or (r.usuario_id and r.usuario_id == u.id):
            return True
        return bool(r.turma_id) and contas.eh_professor_da_turma(u, r.turma_id)

    def obter_visivel(u: Usuario, sim_id: str) -> Resultado:
        r = banco.obter(sim_id)
        if not r or not pode_ver(u, r):
            raise HTTPException(404, "Simulação não encontrada.")
        return r

    @app.post("/api/simulacoes", status_code=202)
    async def criar(entrada: SimulacaoEntrada, request: Request, u: Usuario = Depends(usuario_atual)) -> dict:
        if not lim_simulacao.permitir(_ip(request)):
            raise HTTPException(429, "Muitas simulações em pouco tempo. Aguarde um minuto.")
        if u.papel != "admin" and cfg.limite_usuario_dia and banco.simulacoes_hoje(u.id) >= cfg.limite_usuario_dia:
            raise HTTPException(429, f"Você atingiu o limite de {cfg.limite_usuario_dia} simulações por dia. O limite protege as cotas gratuitas de IA e volta amanhã.")
        if entrada.turma_id and not contas.pode_ver_turma(u, entrada.turma_id):
            raise HTTPException(422, "Você não participa desta turma.")
        llm, busca = fabrica(cfg)
        if llm.nome not in ("demo", "ollama") and cfg.max_simulacoes_dia and banco.uso_hoje()["simulacoes"] >= cfg.max_simulacoes_dia:
            raise HTTPException(429, f"Limite diário de {cfg.max_simulacoes_dia} simulações com IA atingido (protege a cota gratuita).")
        if entrada.base_id:
            base = banco.obter(entrada.base_id)
            if not base or not pode_ver(u, base):
                raise HTTPException(422, "Simulação base não encontrada.")
        try:
            r = preparar(entrada, cfg, banco, llm, busca)
        except motor.ErroValidacao as e:
            raise HTTPException(422, str(e)) from e
        r.usuario_id, r.turma_id = u.id, entrada.turma_id
        banco.salvar(r)
        tarefa = asyncio.create_task(Orquestrador(cfg, banco, llm, busca).executar(r))
        app.state.tarefas.add(tarefa)
        tarefa.add_done_callback(app.state.tarefas.discard)
        return {"id": r.id, "status": r.status, "modo": r.modo.model_dump()}

    @app.get("/api/simulacoes", response_model=list[ResumoSimulacao])
    def listar(limite: int = Query(50, ge=1, le=200), turma_id: str | None = None, todos: bool = False, u: Usuario = Depends(usuario_atual)) -> list[ResumoSimulacao]:
        if todos and u.papel == "admin":
            return banco.listar(limite, todos=True)
        if turma_id:
            if not contas.pode_ver_turma(u, turma_id):
                raise HTTPException(404, "Turma não encontrada.")
            if contas.eh_professor_da_turma(u, turma_id):
                return banco.listar(limite, turma_ids=[turma_id])
            return [s for s in banco.listar(limite, usuario_id=u.id) if s.turma_id == turma_id]
        return banco.listar(limite, usuario_id=u.id, turma_ids=contas.ids_turmas_lecionadas(u) or None)

    @app.get("/api/simulacoes/{sim_id}", response_model=Resultado)
    def obter(sim_id: str, u: Usuario = Depends(usuario_atual)) -> Resultado:
        return obter_visivel(u, sim_id)

    @app.get("/api/simulacoes/{sim_id}/eventos", response_model=list[Evento])
    def eventos(sim_id: str, desde: int = Query(0, ge=0), u: Usuario = Depends(usuario_atual)) -> list[Evento]:
        obter_visivel(u, sim_id)
        return banco.eventos(sim_id, desde)

    @app.delete("/api/simulacoes/{sim_id}", status_code=204)
    def apagar(sim_id: str, u: Usuario = Depends(usuario_atual)) -> None:
        r = obter_visivel(u, sim_id)
        if u.papel != "admin" and r.usuario_id != u.id:
            raise HTTPException(403, "Só quem criou a simulação pode excluí-la.")
        banco.apagar(sim_id)

    @app.get("/api/comparar", response_model=Comparacao)
    def comparar(a: str, b: str, u: Usuario = Depends(usuario_atual)) -> Comparacao:
        return motor.comparar(obter_visivel(u, a), obter_visivel(u, b))

    # ------------------------------------------------------------ turmas
    @app.get("/api/turmas", response_model=list[Turma])
    def minhas_turmas(u: Usuario = Depends(usuario_atual)) -> list[Turma]:
        return contas.turmas_do_usuario(u)

    @app.post("/api/turmas", response_model=Turma, status_code=201)
    def criar_turma(dados: TurmaEntrada, u: Usuario = Depends(usuario_atual)) -> Turma:
        return contas.criar_turma(u, dados.nome)

    @app.post("/api/turmas/entrar", response_model=Turma)
    def entrar_turma(dados: dict, request: Request, u: Usuario = Depends(usuario_atual)) -> Turma:
        _limite_auth(request)  # evita adivinhar códigos por força bruta
        codigo = str(dados.get("codigo", ""))[:20]
        if not codigo.strip():
            raise HTTPException(422, "Informe o código da turma.")
        return contas.entrar_na_turma(u, codigo)

    @app.get("/api/turmas/{tid}", response_model=Turma)
    def obter_turma(tid: str, u: Usuario = Depends(usuario_atual)) -> Turma:
        return contas.obter_turma(u, tid)

    @app.get("/api/turmas/{tid}/membros", response_model=list[Membro])
    def membros(tid: str, u: Usuario = Depends(usuario_atual)) -> list[Membro]:
        contas.obter_turma(u, tid)
        return contas.membros(u, tid)

    @app.delete("/api/turmas/{tid}/membros/{membro_id}", status_code=204)
    def remover_membro(tid: str, membro_id: str, u: Usuario = Depends(usuario_atual)) -> None:
        contas.obter_turma(u, tid)
        if membro_id == u.id:
            contas.sair_da_turma(u, tid)
        else:
            contas.remover_membro(u, tid, membro_id)

    @app.post("/api/turmas/{tid}/codigo", response_model=Turma)
    def trocar_codigo(tid: str, u: Usuario = Depends(usuario_atual)) -> Turma:
        contas.obter_turma(u, tid)
        return contas.novo_codigo(u, tid)

    @app.put("/api/turmas/{tid}/cenario", response_model=Turma)
    def cenario(tid: str, dados: CenarioEntrada, u: Usuario = Depends(usuario_atual)) -> Turma:
        contas.obter_turma(u, tid)
        if dados.caso_id and not casos.obter(dados.caso_id):
            raise HTTPException(422, "Caso desconhecido.")
        return contas.definir_cenario(u, tid, dados.caso_id, dados.orientacao)

    @app.delete("/api/turmas/{tid}", status_code=204)
    def excluir_turma(tid: str, u: Usuario = Depends(usuario_atual)) -> None:
        contas.obter_turma(u, tid)
        contas.excluir_turma(u, tid)

    # ------------------------------------------------------------ administração
    @app.get("/api/admin/resumo")
    def admin_resumo(_: Usuario = Depends(so_admin)) -> dict:
        return contas.resumo_admin()

    return app


app = criar_app()
