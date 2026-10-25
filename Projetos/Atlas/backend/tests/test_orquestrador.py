"""Fluxo completo: passagem estruturada, ciclo de revisão, limites e falhas externas."""
from atlas.orquestrador import Orquestrador, preparar
from atlas.provedores.busca import DemoBusca
from atlas.provedores.erros import ErroProvedor
from atlas.provedores.llm import DemoLLM

from .conftest import FakeBusca, FakeLLM, analise_valida


async def rodar(cfg, banco, entrada, llm, busca):
    r = preparar(entrada, cfg, banco, llm, busca)
    return await Orquestrador(cfg, banco, llm, busca).executar(r)


async def test_fluxo_feliz_e_passagem_estruturada(cfg, banco, entrada):
    llm = FakeLLM()
    r = await rodar(cfg, banco, entrada, llm, FakeBusca())
    assert r.status == "concluida" and r.verificacoes[-1].aprovado
    prompt_analyst = next(u for t, u in llm.chamadas if t == "analisar")
    assert '"E1"' in prompt_analyst and '"F1"' in prompt_analyst  # evidências do Researcher chegam ao Analyst
    assert "propensão de escalada" in prompt_analyst  # índices do motor também
    salvo = banco.obter(r.id)
    assert salvo.status == "concluida" and salvo.analise and salvo.evidencias.fontes
    tipos = [e.tipo for e in banco.eventos(r.id, 0)]
    assert tipos[0] == "inicio" and tipos[-1] == "fim"
    assert not r.modo.demonstrativo and r.avisos == []


async def test_ciclo_de_revisao_corrige_e_aprova(cfg, banco, entrada):
    ruim = analise_valida("E9")
    llm = FakeLLM(respostas={"analisar": [ruim, analise_valida()]})
    r = await rodar(cfg, banco, entrada, llm, FakeBusca())
    assert r.status == "concluida"
    assert [v.aprovado for v in r.verificacoes] == [False, True]
    revisao = [u for t, u in llm.chamadas if t == "analisar"][1]
    assert "O Verifier pediu correções" in revisao and "E9" in revisao


async def test_limite_de_revisoes_gera_parcial(cfg, banco, entrada):
    llm = FakeLLM(respostas={"analisar": [analise_valida("E9")]})  # sempre errada
    r = await rodar(cfg, banco, entrada, llm, FakeBusca())
    assert r.status == "parcial"
    assert len(r.verificacoes) == cfg.max_revisoes + 1
    assert llm.contar("analisar") == cfg.max_revisoes + 1
    assert any("problema(s) crítico(s)" in a for a in r.avisos)


async def test_verifier_devolve_ao_researcher(cfg, banco, entrada):
    llm = FakeLLM(respostas={"verificar": [{"problemas": [{"severidade": "critico", "alvo": "researcher", "local": "evidências sobre retaliação", "descricao": "faltam fontes"}]}, {"problemas": []}]})
    busca = FakeBusca()
    r = await rodar(cfg, banco, entrada, llm, busca)
    assert r.status == "concluida"
    assert any("retaliação" in c for c in busca.consultas)


async def test_cota_no_analyst_preserva_pesquisa(cfg, banco, entrada):
    llm = FakeLLM(respostas={"analisar": ErroProvedor("cota_diaria", "x")})
    r = await rodar(cfg, banco, entrada, llm, FakeBusca())
    assert r.status == "falhou" and r.analise is None
    assert r.evidencias.fontes  # o que já foi obtido continua salvo
    assert "cota diária" in r.erro
    assert banco.obter(r.id).evidencias.fontes


async def test_cota_na_revisao_mantem_analise_parcial(cfg, banco, entrada):
    llm = FakeLLM(respostas={"analisar": [analise_valida("E9"), ErroProvedor("cota", "x")]})
    r = await rodar(cfg, banco, entrada, llm, FakeBusca())
    assert r.status == "parcial" and r.analise is not None


async def test_limite_local_de_chamadas(cfg, banco, entrada):
    from dataclasses import replace

    cfg = replace(cfg, max_chamadas_llm=1)
    r = await rodar(cfg, banco, entrada, FakeLLM(), FakeBusca())
    assert r.status == "falhou" and "limite de chamadas" in r.erro.lower()


async def test_busca_falha_ia_segue_com_aviso(cfg, banco, entrada):
    r = await rodar(cfg, banco, entrada, FakeLLM(), FakeBusca(erro=ErroProvedor("indisponivel", "x")))
    assert r.evidencias.fontes == []
    assert any("pesquisa na web falhou" in a for a in r.avisos)


async def test_modo_demo_rotulado_e_sem_fatos(cfg, banco, entrada):
    r = await rodar(cfg, banco, entrada, DemoLLM(), DemoBusca())
    assert r.status == "concluida" and r.modo.demonstrativo
    assert any("MODO DEMONSTRATIVO" in a for a in r.avisos)
    assert r.evidencias.fontes == []
    afirmacoes = r.analise.resumo_executivo + [n for c in r.analise.cenarios for n in c.narrativa]
    assert all(a.natureza != "fato" for a in afirmacoes)
    assert r.analise.confianca == "baixo"
    assert r.uso.chamadas_llm == 0


async def test_erro_inesperado_nao_vaza_detalhes(cfg, banco, entrada):
    llm = FakeLLM(respostas={"analisar": RuntimeError("segredo interno")})
    r = await rodar(cfg, banco, entrada, llm, FakeBusca())
    assert r.status == "falhou" and "segredo" not in r.erro and "RuntimeError" in r.erro


async def test_confianca_rebaixada_sem_evidencias_com_fonte(cfg, banco, entrada):
    llm = FakeLLM(respostas={"analisar": analise_valida(None)})  # confiança "moderado", sem evidências
    r = await rodar(cfg, banco, entrada, llm, FakeBusca(erro=ErroProvedor("indisponivel", "x")))
    assert r.analise.confianca == "baixo"
    assert "Rebaixada de “moderado”" in r.analise.justificativa_confianca
    assert any("Confiança rebaixada" in a for a in r.avisos)


async def test_confianca_mantida_com_evidencias(cfg, banco, entrada):
    r = await rodar(cfg, banco, entrada, FakeLLM(), FakeBusca())
    assert r.analise.confianca == "moderado"
