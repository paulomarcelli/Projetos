"""Agente 3 — Verifier: regras determinísticas + revisão por IA das afirmações."""
from __future__ import annotations

import re


from ..modelos import PacoteEvidencias, Problema, RelatorioVerificacao, SaidaAnalyst
from ..provedores.erros import ErroProvedor
from ..seguranca import REGRA_DADOS, delimitar
from .base import Contexto, json_compacto

ORDEM = {"baixo": 0, "moderado": 1, "alto": 2}
PROB_NUMERICA = re.compile(r"(probabilidade|chance|likelihood|probab\.)[^.]{0,40}?\d{1,3}\s?%|\d{1,3}\s?%\s+de\s+(chance|probabilidade)", re.I)

SISTEMA = f"""Você é o Verifier do ATLAS. Confira a análise contra as evidências.
Aponte somente problemas reais: afirmações factuais sem suporte nas evidências citadas, citações que não correspondem
ao conteúdo da evidência, contradições internas, conclusões exageradas ou pressupostos frágeis, e cenários que
desrespeitam as premissas. Não reescreva a análise.
{REGRA_DADOS}
Responda apenas JSON: {{"problemas":[{{"severidade":"critico"|"alerta","alvo":"analyst"|"researcher","local":str,"descricao":str}}],"observacoes":[str]}}"""


def regras(analise: SaidaAnalyst, pacote: PacoteEvidencias, ctx: Contexto) -> list[Problema]:
    """Checagens determinísticas, sem IA."""
    p: list[Problema] = []
    evid = {e.id: e for e in pacote.evidencias}

    def checar(afirmacoes, local):
        for i, a in enumerate(afirmacoes):
            for eid in a.evidencia_ids:
                if eid not in evid:
                    p.append(Problema(severidade="critico", alvo="analyst", local=f"{local}[{i}]", descricao=f"Cita a evidência {eid}, que não existe."))
            if a.natureza == "fato":
                if not a.evidencia_ids:
                    p.append(Problema(severidade="critico", alvo="analyst", local=f"{local}[{i}]", descricao="Afirmação apresentada como fato sem evidência citada."))
                elif any(evid.get(e) and evid[e].status != "confirmado" for e in a.evidencia_ids):
                    p.append(Problema(severidade="alerta", alvo="analyst", local=f"{local}[{i}]", descricao="Apresentada como fato, mas a evidência citada é alegação ou incerta."))
                elif any(evid.get(e) and not evid[e].fonte_ids for e in a.evidencia_ids):
                    p.append(Problema(severidade="critico", alvo="analyst", local=f"{local}[{i}]", descricao="Fato apoiado em evidência sem fonte rastreável."))
            if PROB_NUMERICA.search(a.texto):
                p.append(Problema(severidade="alerta", alvo="analyst", local=f"{local}[{i}]", descricao="Usa probabilidade numérica sem metodologia; use classificação qualitativa."))

    checar(analise.resumo_executivo, "resumo_executivo")
    tipos = [c.tipo for c in analise.cenarios]
    for t in ("continuidade", "escalada", "desescalada"):
        if tipos.count(t) != 1:
            p.append(Problema(severidade="critico", alvo="analyst", local="cenarios", descricao=f"Deve haver exatamente um cenário de {t} (encontrados: {tipos.count(t)})."))
    for c in analise.cenarios:
        checar(c.narrativa, f"cenario.{c.tipo}")
    for i, imp in enumerate(analise.impactos):
        for eid in imp.evidencia_ids:
            if eid not in evid:
                p.append(Problema(severidade="critico", alvo="analyst", local=f"impactos[{i}]", descricao=f"Cita a evidência {eid}, que não existe."))
        n = imp.por_cenario
        if "escalada" in n and "desescalada" in n and ORDEM[n["escalada"]] < ORDEM[n["desescalada"]]:
            p.append(Problema(severidade="alerta", alvo="analyst", local=f"impactos[{i}]", descricao=f"“{imp.titulo}”: impacto menor na escalada que na desescalada; justifique ou corrija."))
    for i, it in enumerate(analise.matriz):
        if PROB_NUMERICA.search(it.justificativa):
            p.append(Problema(severidade="alerta", alvo="analyst", local=f"matriz[{i}]", descricao="Probabilidade numérica sem metodologia."))

    # coerência com o motor (as premissas escolhidas pelo usuário)
    prop = ctx.motor.propensao_escalada.nivel
    plaus = {c.tipo: c.plausibilidade for c in analise.cenarios}
    if prop == "baixo" and plaus.get("escalada") == "alto" and plaus.get("desescalada") == "baixo":
        p.append(Problema(severidade="alerta", alvo="analyst", local="cenarios", descricao="Configuração de baixa propensão de escalada, mas a escalada aparece como a mais plausível sem justificativa nas premissas."))
    if prop == "alto" and plaus.get("desescalada") == "alto" and plaus.get("escalada") == "baixo":
        p.append(Problema(severidade="alerta", alvo="analyst", local="cenarios", descricao="Configuração de alta propensão de escalada, mas a desescalada aparece como a mais plausível sem justificativa."))

    ids_atores = {a.id for a in ctx.caso.atores}
    if ids_atores:
        for a in analise.atores:
            if a.ator_id not in ids_atores:
                p.append(Problema(severidade="alerta", alvo="analyst", local="atores", descricao=f"Ator “{a.ator_id}” não pertence ao caso."))

    # pesquisa
    if pacote.pesquisa_real and not pacote.fontes:
        p.append(Problema(severidade="alerta", alvo="researcher", local="fontes", descricao="Nenhuma fonte encontrada; as conclusões não têm base em informações atuais."))
    if pacote.pesquisa_real and pacote.fontes and not pacote.evidencias:
        p.append(Problema(severidade="critico", alvo="researcher", local="evidencias", descricao="Há fontes, mas nenhuma evidência foi extraída."))
    contrarias = sum(1 for e in pacote.evidencias if e.relacao == "contraria")
    if pacote.pesquisa_real and len(pacote.evidencias) >= 4 and contrarias == 0:
        p.append(Problema(severidade="alerta", alvo="researcher", local="evidencias", descricao="Nenhuma evidência contrária às hipóteses foi registrada; busque contrapontos."))
    return p


class Verifier:
    nome = "verifier"

    async def executar(self, ctx: Contexto, analise: SaidaAnalyst, pacote: PacoteEvidencias, rodada: int) -> RelatorioVerificacao:
        await ctx.emitir(self.nome, "inicio", f"Rodada {rodada}: checando fontes, citações e coerência com as premissas.", {"rodada": rodada})
        problemas = regras(analise, pacote, ctx)
        await ctx.emitir(self.nome, "progresso", f"Regras determinísticas: {len(problemas)} ponto(s).", {"regras": len(problemas)})
        observacoes: list[str] = []
        if pacote.evidencias and ctx.llm.nome != "demo":
            usuario = delimitar("evidencias", json_compacto([e.model_dump() for e in pacote.evidencias])) + "\n\n" + delimitar("analise", analise.model_dump_json())
            usuario += f"\n\nPremissas: {json_compacto(ctx.caso.premissas_padrao + ctx.entrada.premissas_extra)}"
            try:
                dados = await ctx.chamar_llm(self.nome, "verificar", SISTEMA, usuario, {}, usar_cache=rodada == 1)
                for bruto in dados.get("problemas", [])[:12]:
                    try:
                        problemas.append(Problema(origem="ia", **{k: bruto[k] for k in ("severidade", "alvo", "local", "descricao")}))
                    except Exception:
                        continue
                observacoes = [str(o)[:400] for o in dados.get("observacoes", [])][:6]
            except ErroProvedor as e:
                observacoes.append(f"Revisão por IA não executada: {e.mensagem}. Valeram só as regras determinísticas.")
                await ctx.emitir(self.nome, "aviso", observacoes[-1], {"motivo": e.motivo})
        elif ctx.llm.nome == "demo":
            observacoes.append("Modo demonstrativo: só as regras determinísticas foram aplicadas.")
        criticos = [x for x in problemas if x.severidade == "critico"]
        rel = RelatorioVerificacao(rodada=rodada, aprovado=not criticos, problemas=problemas, observacoes=observacoes)
        await ctx.emitir(self.nome, "resultado", f"{'Aprovado' if rel.aprovado else 'Correções necessárias'}: {len(criticos)} crítico(s), {len(problemas) - len(criticos)} alerta(s).", {"aprovado": rel.aprovado, "criticos": len(criticos)})
        return rel
