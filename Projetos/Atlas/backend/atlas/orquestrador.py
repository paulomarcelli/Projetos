"""Orquestrador: coordena Researcher → Analyst → Verifier com ciclo de revisão limitado.

- Valida as saídas de cada agente (contratos em modelos.py) antes de repassá-las.
- O Verifier pode devolver o trabalho ao Researcher (mais pesquisa) ou ao Analyst (correções),
  no máximo `max_revisoes` vezes.
- Cada etapa emite eventos persistidos (a interface acompanha o progresso real).
- Falhas externas preservam o que já foi obtido e nunca são preenchidas com conteúdo fictício.
"""
from __future__ import annotations

import logging
import uuid

from . import casos, motor
from .agentes.analyst import Analyst
from .agentes.base import Contexto
from .agentes.researcher import Researcher
from .agentes.verifier import Verifier
from .config import Config
from .modelos import Evento, Modo, NomeAgente, RegistroPremissas, Resultado, SimulacaoEntrada
from .persistencia import Banco
from .provedores.busca import DemoBusca, GdeltBusca, ProvedorBusca, TavilyBusca
from .provedores.erros import ErroProvedor, descrever
from .provedores.llm import CompatLLM, DemoLLM, GeminiLLM, ProvedorLLM

log = logging.getLogger("atlas.orquestrador")


def provedores(cfg: Config) -> tuple[ProvedorLLM, ProvedorBusca]:
    llm: ProvedorLLM
    if cfg.ia == "gemini":
        llm = GeminiLLM(cfg.gemini_api_key or "", cfg.gemini_model, cfg.timeout_s, cfg.tentativas_api)
    elif cfg.ia == "ollama":
        llm = CompatLLM("ollama", cfg.ollama_url, cfg.ollama_model, None, cfg.ollama_timeout_s, cfg.tentativas_api)
    elif cfg.ia == "openai":
        llm = CompatLLM("openai", cfg.openai_base_url or "", cfg.openai_model or "", cfg.openai_api_key, cfg.timeout_s, cfg.tentativas_api)
    else:
        llm = DemoLLM()
    busca: ProvedorBusca
    if cfg.busca == "tavily":
        busca = TavilyBusca(cfg.tavily_api_key or "", cfg.timeout_s, cfg.tentativas_api)
    elif cfg.busca == "gdelt":
        busca = GdeltBusca(cfg.timeout_s, cfg.tentativas_api)
    else:
        busca = DemoBusca()
    return llm, busca


def resolver_caso(entrada: SimulacaoEntrada):
    if entrada.caso_id == "personalizado":
        if not entrada.descricao_personalizada or len(entrada.descricao_personalizada.strip()) < 20:
            raise motor.ErroValidacao("Descreva a situação personalizada com pelo menos 20 caracteres.")
        return casos.caso_personalizado(entrada.titulo_personalizado or "", entrada.descricao_personalizada)
    caso = casos.obter(entrada.caso_id)
    if caso is None:
        raise motor.ErroValidacao(f"Caso desconhecido: {entrada.caso_id}")
    return caso


def preparar(entrada: SimulacaoEntrada, cfg: Config, banco: Banco, llm: ProvedorLLM, busca: ProvedorBusca) -> Resultado:
    """Valida a entrada, roda o motor determinístico e cria o registro da simulação (síncrono)."""
    caso = resolver_caso(entrada)
    valores = motor.validar_valores(caso, entrada.valores)
    entrada = entrada.model_copy(update={"valores": valores})
    if entrada.horizonte_meses not in caso.horizontes_meses and not (1 <= entrada.horizonte_meses <= 60):
        raise motor.ErroValidacao("Horizonte inválido.")
    if entrada.base_id and banco.obter(entrada.base_id) is None:
        raise motor.ErroValidacao("Simulação base não encontrada.")
    saida_motor = motor.executar(caso, entrada)
    condicoes = motor.descrever_variaveis(caso, valores)
    modo = Modo(ia=llm.nome, busca=busca.nome)  # type: ignore[arg-type]
    avisos = []
    if modo.demonstrativo:
        faltando = [n for n, real in (("IA real", llm.nome != "demo"), ("pesquisa na web", busca.nome != "demo")) if not real]
        avisos.append("MODO DEMONSTRATIVO: sem " + " e sem ".join(faltando) + " configurada(s). Resultados ilustram o funcionamento e não usam informações atuais.")
    r = Resultado(
        id=uuid.uuid4().hex[:12],
        status="pendente",
        entrada=entrada,
        caso=caso,
        motor=saida_motor,
        modo=modo,
        avisos=avisos,
        registro=RegistroPremissas(
            premissas=caso.premissas_padrao + entrada.premissas_extra,
            horizonte_meses=entrada.horizonte_meses,
            condicoes_iniciais=condicoes,
            limitacoes=motor.LIMITACOES + ["Cenários são análises condicionais às premissas, não previsões."],
        ),
    )
    banco.salvar(r)
    return r


class Orquestrador:
    def __init__(self, cfg: Config, banco: Banco, llm: ProvedorLLM, busca: ProvedorBusca):
        self.cfg, self.banco, self.llm, self.busca = cfg, banco, llm, busca
        self.researcher, self.analyst, self.verifier = Researcher(), Analyst(), Verifier()

    async def executar(self, r: Resultado) -> Resultado:
        seq = 0

        async def emitir(agente: NomeAgente, tipo: str, mensagem: str, dados: dict | None = None) -> None:
            nonlocal seq
            seq += 1
            self.banco.registrar_evento(r.id, Evento(seq=seq, agente=agente, tipo=tipo, mensagem=mensagem, dados=dados or {}))  # type: ignore[arg-type]

        assert r.motor and r.registro
        ctx = Contexto(cfg=self.cfg, banco=self.banco, llm=self.llm, busca=self.busca, caso=r.caso, entrada=r.entrada, motor=r.motor, condicoes=r.registro.condicoes_iniciais, emitir=emitir, uso=r.uso)
        r.status = "executando"
        self.banco.salvar(r)
        if r.modo.ia not in ("demo", "ollama"):
            self.banco.somar_uso(simulacoes=1)
        await emitir("orquestrador", "inicio", f"Simulação iniciada: {r.caso.titulo} ({r.entrada.horizonte_meses} meses).", {"modo": r.modo.model_dump()})
        await emitir("orquestrador", "progresso", f"Motor determinístico: propensão de escalada {r.motor.propensao_escalada.valor:.0f}/100 ({r.motor.propensao_escalada.nivel}).", {"indices": {d: i.valor for d, i in r.motor.indices.items()}})

        etapa = "researcher"
        try:
            r.evidencias = await self.researcher.executar(ctx)
            self.banco.salvar(r)
            if r.evidencias.erro:
                r.avisos.append(r.evidencias.erro)

            etapa = "analyst"
            r.analise = await self.analyst.executar(ctx, r.evidencias.model_dump(include={"fontes", "evidencias", "lacunas"}))
            self.banco.salvar(r)

            for rodada in range(1, self.cfg.max_revisoes + 2):
                etapa = "verifier"
                rel = await self.verifier.executar(ctx, r.analise, r.evidencias, rodada)
                r.verificacoes.append(rel)
                self.banco.salvar(r)
                if rel.aprovado:
                    break
                if rodada > self.cfg.max_revisoes:
                    r.avisos.append(f"O Verifier ainda aponta {sum(p.severidade == 'critico' for p in rel.problemas)} problema(s) crítico(s) após {self.cfg.max_revisoes} revisão(ões). Veja a seção de verificação.")
                    break
                criticos = [p for p in rel.problemas if p.severidade == "critico"]
                if any(p.alvo == "researcher" for p in criticos) and r.evidencias.pesquisa_real:
                    etapa = "researcher"
                    await emitir("orquestrador", "progresso", "Verifier pediu mais evidências: nova rodada de pesquisa.", {"rodada": rodada})
                    extra = [f"{r.caso.titulo} {p.local}"[:120] for p in criticos if p.alvo == "researcher"][:2]
                    r.evidencias = await self.researcher.executar(ctx, extra)
                etapa = "analyst"
                await emitir("orquestrador", "progresso", f"Devolvendo {len(rel.problemas)} ponto(s) ao Analyst (revisão {rodada}/{self.cfg.max_revisoes}).", {"rodada": rodada})
                r.analise = await self.analyst.executar(ctx, r.evidencias.model_dump(include={"fontes", "evidencias", "lacunas"}), rel.problemas)
                self.banco.salvar(r)

            ultima = r.verificacoes[-1] if r.verificacoes else None
            r.status = "concluida" if ultima and ultima.aprovado else "parcial"
            await emitir("orquestrador", "fim", "Simulação concluída." if r.status == "concluida" else "Simulação concluída com pendências apontadas pelo Verifier.", {"status": r.status, "uso": r.uso.model_dump()})
        except ErroProvedor as e:
            msg = descrever(e)
            r.erro = f"{etapa}: {msg}"
            r.status = "parcial" if r.analise else "falhou"
            r.avisos.append(f"Execução interrompida na etapa {etapa}: {msg} Os resultados obtidos até aqui foram preservados.")
            await emitir(etapa, "erro", msg, {"motivo": e.motivo})  # type: ignore[arg-type]
            await emitir("orquestrador", "fim", "Execução interrompida por falha externa.", {"status": r.status})
        except Exception as e:  # erro inesperado: registra sem vazar detalhes internos
            log.exception("falha inesperada na simulação %s", r.id)
            r.erro = f"{etapa}: erro interno ({e.__class__.__name__})."
            r.status = "parcial" if r.analise else "falhou"
            await emitir("orquestrador", "erro", "Erro interno inesperado. Os resultados parciais foram preservados.", {"tipo": e.__class__.__name__})
            await emitir("orquestrador", "fim", "Execução interrompida.", {"status": r.status})
        self.banco.salvar(r)
        return r
