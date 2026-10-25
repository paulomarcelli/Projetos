"""Agente 2 — Analyst: atores, cenários, impactos, matriz de riscos e relações."""
from __future__ import annotations

from pydantic import ValidationError

from .. import normalizar
from ..modelos import Problema, SaidaAnalyst
from ..provedores.erros import ErroProvedor
from ..seguranca import REGRA_DADOS, delimitar
from .base import Contexto, json_compacto

SISTEMA = f"""Você é o Analyst do ATLAS, um sistema de análise geopolítica condicional.
Com base nas EVIDÊNCIAS do Researcher, nos ÍNDICES do motor determinístico e nas PREMISSAS da simulação,
produza uma análise estruturada. Regras obrigatórias:
- Construa exatamente três cenários: "continuidade" (tendências atuais), "escalada" e "desescalada".
- Cada afirmação tem "natureza": "fato" (só se sustentado por evidência com status confirmado; cite evidencia_ids),
  "interpretacao" (sua análise), "premissa" (condição assumida na simulação) ou "hipotese" (algo que pode acontecer).
- Nunca apresente especulação como fato. Não use probabilidades numéricas ou percentuais inventados:
  use apenas classificações qualitativas "baixo", "moderado", "alto" com justificativa.
- Explique mecanismos causais e efeitos indiretos nos impactos (campo "mecanismo").
- Respeite as premissas e os índices do motor: eles descrevem a configuração escolhida pelo usuário.
- Use os ids de atores fornecidos quando existirem.
{REGRA_DADOS}
Responda apenas JSON com as chaves: resumo_executivo[{{texto,natureza,evidencia_ids}}], atores[{{ator_id,interesses,incentivos,capacidades,restricoes,postura}}],
cenarios[{{tipo,titulo,narrativa[{{texto,natureza,evidencia_ids}}],gatilhos,indicadores,plausibilidade,justificativa}}],
impactos[{{dimensao,titulo,mecanismo,por_cenario{{continuidade,escalada,desescalada}},natureza,evidencia_ids}}],
matriz[{{tipo,titulo,probabilidade,impacto,justificativa,cenarios}}], relacoes[{{origem,destino,tipo,intensidade,descricao}}],
confianca, justificativa_confianca, incertezas[str].
dimensao ∈ economico|diplomatico|estrategico; postura ∈ cooperativa|neutra|confrontacional; tipo de relacao ∈ cooperacao|tensao|dependencia|neutra."""


class Analyst:
    nome = "analyst"

    async def executar(self, ctx: Contexto, evidencias: dict, problemas: list[Problema] | None = None) -> SaidaAnalyst:
        rodada = "revisão" if problemas else "primeira versão"
        await ctx.emitir(self.nome, "inicio", f"Construindo cenários ({rodada}).", {"problemas": len(problemas or [])})
        atores = [a.model_dump() for a in ctx.caso.atores]
        usuario = (
            f"Cenário: {ctx.caso.titulo}\nContexto: {ctx.caso.contexto}\nAtores: {json_compacto(atores)}\n"
            f"Horizonte: {ctx.entrada.horizonte_meses} meses\nCondições iniciais: {json_compacto(ctx.condicoes)}\n"
            f"Premissas: {json_compacto(ctx.caso.premissas_padrao + ctx.entrada.premissas_extra)}\n"
            f"Índices do motor (0–100, construção do modelo, não probabilidade): {json_compacto({d: {'valor': i.valor, 'nivel': i.nivel} for d, i in ctx.motor.indices.items()})}; "
            f"propensão de escalada: {ctx.motor.propensao_escalada.valor} ({ctx.motor.propensao_escalada.nivel})\n"
            f"Hipóteses do caso: {json_compacto(ctx.caso.hipoteses)}\n\n"
            + delimitar("evidencias_do_researcher", json_compacto(evidencias))
        )
        if problemas:
            usuario += "\n\nO Verifier pediu correções. Corrija TODOS os pontos abaixo mantendo o formato:\n" + "\n".join(f"- [{p.severidade}] {p.local}: {p.descricao}" for p in problemas)
        contexto = {"caso": ctx.caso.model_dump(), "motor": ctx.motor.model_dump(), "evidencias": evidencias, "entrada": ctx.entrada.model_dump(), "problemas": [p.model_dump() for p in problemas or []]}
        dados = await ctx.chamar_llm(self.nome, "analisar", SISTEMA, usuario, contexto, usar_cache=not problemas)
        try:
            saida = SaidaAnalyst.model_validate(normalizar.analise(dados))
        except ValidationError as e:
            if ctx.llm.nome == "demo":
                raise ErroProvedor("resposta_invalida", f"Saída do Analyst fora do contrato: {e.error_count()} erro(s).") from e
            ctx.esquecer("analisar", SISTEMA, usuario)  # não reaproveitar resposta inválida
            # uma única tentativa de correção, apontando exatamente o que faltou
            erros = _resumo_erros(e)
            await ctx.emitir(self.nome, "aviso", f"Resposta incompleta ({e.error_count()} problema(s) de formato). Pedindo a versão completa uma vez.", {"erros": erros})
            reparo = usuario + "\n\nSua resposta anterior estava fora do formato. Problemas:\n" + "\n".join(f"- {x}" for x in erros) + "\nResponda novamente com o JSON COMPLETO, contendo TODAS as chaves pedidas."
            dados = await ctx.chamar_llm(self.nome, "analisar", SISTEMA, reparo, contexto, usar_cache=False)
            try:
                saida = SaidaAnalyst.model_validate(normalizar.analise(dados))
            except ValidationError as e2:
                ctx.esquecer("analisar", SISTEMA, reparo)
                raise ErroProvedor("resposta_invalida", f"Saída do Analyst fora do contrato mesmo após correção: {'; '.join(_resumo_erros(e2)[:5])}.") from e2
        await ctx.emitir(self.nome, "resultado", f"{len(saida.cenarios)} cenários, {len(saida.impactos)} impactos, {len(saida.matriz)} itens na matriz; confiança {saida.confianca}.", {"confianca": saida.confianca})
        return saida


def _resumo_erros(e: ValidationError) -> list[str]:
    """'matriz: campo obrigatório ausente' — legível para o modelo e para o usuário."""
    saida = []
    for err in e.errors()[:12]:
        local = ".".join(str(x) for x in err["loc"])
        saida.append(f"{local}: campo obrigatório ausente" if err["type"] == "missing" else f"{local}: {err['msg']}")
    return saida
