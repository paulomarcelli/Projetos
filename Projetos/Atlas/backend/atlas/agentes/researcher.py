"""Agente 1 — Researcher: pesquisa, organiza fontes e extrai evidências rastreáveis."""
from __future__ import annotations

from ..modelos import Evidencia, Fonte, PacoteEvidencias, agora
from ..provedores.erros import MENSAGENS, ErroProvedor
from ..seguranca import REGRA_DADOS, delimitar, limpar
from .base import Contexto, json_compacto

SISTEMA = f"""Você é o Researcher do ATLAS, um sistema de análise geopolítica.
Sua tarefa: a partir das FONTES fornecidas, extrair evidências relevantes para o cenário e as hipóteses.
Regras obrigatórias:
- Use SOMENTE as fontes fornecidas. Cada evidência deve citar ids de fontes existentes (ex.: "F2"). Nunca invente fontes, URLs, datas ou citações.
- status: "confirmado" (fato reportado por fonte confiável/oficial), "alegado" (declaração de uma parte, ainda não confirmada) ou "incerto".
- relacao com a hipótese: "favorece", "contraria" ou "contexto". Inclua evidências contrárias quando existirem.
- Se as fontes não sustentam algo importante, registre em "lacunas" em vez de supor.
{REGRA_DADOS}
Responda apenas JSON: {{"evidencias":[{{"afirmacao":str,"fonte_ids":[str],"status":str,"relacao":str,"hipotese":str|null}}],"lacunas":[str]}}"""


class Researcher:
    nome = "researcher"

    async def executar(self, ctx: Contexto, consultas_extra: list[str] | None = None) -> PacoteEvidencias:
        # consultas pedidas pelo Verifier vêm primeiro para não serem cortadas pelo limite de buscas
        consultas = list(dict.fromkeys([*(consultas_extra or []), *ctx.caso.consultas]))[: ctx.cfg.max_buscas]
        pacote = PacoteEvidencias(consultas=consultas, pesquisa_real=ctx.busca.nome != "demo")
        await ctx.emitir(self.nome, "inicio", f"Pesquisando {len(consultas)} consultas ({ctx.busca.nome}).", {"consultas": consultas})

        fontes: dict[str, Fonte] = {}
        falhas: list[str] = []
        for consulta in consultas:
            try:
                resultados = await self._buscar(ctx, consulta)
            except ErroProvedor as e:
                falhas.append(f"{consulta}: {MENSAGENS.get(e.motivo, e.mensagem)}")
                await ctx.emitir(self.nome, "aviso", f"Busca falhou para “{consulta}”: {MENSAGENS.get(e.motivo, e.mensagem)}", {"motivo": e.motivo})
                if e.motivo in ("cota", "cota_diaria", "chave"):
                    break
                continue
            novas = 0
            for r in resultados:
                if any(f.url == r["url"] for f in fontes.values()):
                    continue
                fid = f"F{len(fontes) + 1}"
                fontes[fid] = Fonte(id=fid, titulo=limpar(r["titulo"], 300), url=r["url"], publicador=r.get("publicador"), data_publicacao=r.get("data_publicacao"), data_consulta=r.get("data_consulta") or agora(), trecho=limpar(r["trecho"], 1200), consulta=consulta)
                novas += 1
            await ctx.emitir(self.nome, "progresso", f"“{consulta}”: {len(resultados)} resultados, {novas} fontes novas.", {"consulta": consulta, "fontes": novas})

        pacote.fontes = list(fontes.values())
        if falhas and not fontes:
            pacote.erro = "A pesquisa na web falhou; a análise não usa informações atuais. " + " | ".join(falhas)
        if not pacote.pesquisa_real:
            pacote.lacunas.append("Modo demonstrativo: nenhuma pesquisa real foi feita, portanto não há fontes atuais nem fatos verificados.")

        if fontes:
            await ctx.emitir(self.nome, "progresso", f"Extraindo evidências de {len(fontes)} fontes.", {})
            bloco = "\n\n".join(f"[{f.id}] {f.titulo} — {f.publicador or 's/ publicador'} — {f.data_publicacao or 'data não informada'}\n{f.trecho}" for f in pacote.fontes)
            usuario = (
                f"Cenário: {ctx.caso.titulo}\nContexto: {ctx.caso.contexto}\n"
                f"Hipóteses: {json_compacto(ctx.caso.hipoteses)}\n"
                f"Condições da simulação: {json_compacto(ctx.condicoes)}\n\n"
                + delimitar("pesquisa_web", bloco)
            )
            dados = await ctx.chamar_llm(self.nome, "extrair_evidencias", SISTEMA, usuario, {"caso": ctx.caso.model_dump(), "fontes": [f.model_dump() for f in pacote.fontes]})
            pacote.evidencias, descartadas = self._validar(dados, fontes)
            pacote.lacunas += [limpar(l, 400) for l in dados.get("lacunas", []) if isinstance(l, str)][:8]
            if descartadas:
                await ctx.emitir(self.nome, "aviso", f"{descartadas} evidência(s) descartada(s) por citar fontes inexistentes ou nenhuma fonte.", {})
        elif pacote.pesquisa_real:
            pacote.lacunas.append("Nenhuma fonte foi encontrada para as consultas.")

        if not pacote.pesquisa_real:
            dados = await ctx.chamar_llm(self.nome, "evidencias_demo", SISTEMA, "", {"caso": ctx.caso.model_dump()})
            pacote.evidencias, _ = self._validar(dados, {}, permitir_sem_fonte=True)

        await ctx.emitir(self.nome, "resultado", f"{len(pacote.fontes)} fontes, {len(pacote.evidencias)} evidências, {len(pacote.lacunas)} lacunas.", {"fontes": len(pacote.fontes), "evidencias": len(pacote.evidencias)})
        return pacote

    async def _buscar(self, ctx: Contexto, consulta: str) -> list[dict]:
        chave = ctx.banco.chave("busca", ctx.busca.nome, consulta, ctx.cfg.resultados_por_busca)
        if ctx.busca.nome != "demo":
            em_cache = ctx.banco.cache_ler(chave, ctx.cfg.cache_horas * 3600)
            if isinstance(em_cache, list):
                ctx.uso.cache_hits += 1
                return em_cache
        resultados = await ctx.busca.buscar(consulta, ctx.cfg.resultados_por_busca)
        ctx.uso.buscas += 1
        ctx.banco.somar_uso(buscas=1)
        lista = [{"titulo": r.titulo, "url": r.url, "trecho": r.trecho, "publicador": r.publicador, "data_publicacao": r.data_publicacao, "data_consulta": agora()} for r in resultados]
        if ctx.busca.nome != "demo":
            ctx.banco.cache_gravar(chave, lista)
        return lista

    @staticmethod
    def _validar(dados: dict, fontes: dict[str, Fonte], permitir_sem_fonte: bool = False) -> tuple[list[Evidencia], int]:
        evidencias: list[Evidencia] = []
        descartadas = 0
        for i, bruto in enumerate(dados.get("evidencias", [])[:30]):
            if not isinstance(bruto, dict):
                descartadas += 1
                continue
            ids = [x for x in bruto.get("fonte_ids", []) if isinstance(x, str)]
            validos = [x for x in ids if x in fontes]
            if not permitir_sem_fonte and (not validos or len(validos) != len(ids)):
                descartadas += 1
                continue
            try:
                evidencias.append(Evidencia(id=f"E{len(evidencias) + 1}", afirmacao=limpar(bruto.get("afirmacao"), 600), fonte_ids=validos, status=bruto.get("status", "incerto") if bruto.get("status") in ("confirmado", "alegado", "incerto") else "incerto", relacao=bruto.get("relacao", "contexto") if bruto.get("relacao") in ("favorece", "contraria", "contexto") else "contexto", hipotese=limpar(bruto.get("hipotese"), 300) or None))
            except Exception:
                descartadas += 1
        return evidencias, descartadas
