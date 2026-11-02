from fastapi.testclient import TestClient

from freya.api.app import criar_app
from freya.evidencias.registro import Evidencia, Fonte, RegistroDeEvidencias
from freya.llm.cliente import ErroDoModelo, ModeloSimulado
from freya.prospectivo.modelos import Afirmacao, Cenario, CorpoDaAnalise, RelacaoSistemica, TipoEpistemico
from freya.prospectivo.validador import validar


def _registro():
    r = RegistroDeEvidencias()
    r.itens["E1"] = Evidencia(id="E1", tipo="trecho", texto="t", fonte=Fonte(doc_id="d", url="u"))
    r.itens["E2"] = Evidencia(id="E2", tipo="relacao", texto="Connections › Allies", fonte=Fonte(doc_id="d", url="u"))
    return r


def test_validador_rebaixa_remove_e_anota():
    corpo = CorpoDaAnalise(
        contexto=[Afirmacao(texto="fato", tipo="confirmado", evidencias=["E1"]),
                  Afirmacao(texto="palpite no contexto", tipo="hipotese")],
        relacoes_sistemicas=[RelacaoSistemica(entidades=["character:a", "character:inventado"], natureza="aliança",
                                              descricao=Afirmacao(texto="aliança só por texto", tipo="confirmado", evidencias=["E1"]))],
        tendencias_e_sinais=[Afirmacao(texto="sem fonte", tipo="confirmado", evidencias=["E99"])],
        cenarios=[Cenario(id="C1", nome="c", logica=Afirmacao(texto="se X", tipo="hipotese"), entidades=["character:a", "character:zz"])],
    )
    c, rv = validar(corpo, _registro(), {"character:a"})
    assert len(c.contexto) == 1 and rv.removidas
    assert c.relacoes_sistemicas[0].descricao.tipo == TipoEpistemico.INFERENCIA  # relação precisa de evidência do grafo
    assert c.relacoes_sistemicas[0].entidades == ["character:a"]
    assert c.tendencias_e_sinais[0].tipo == TipoEpistemico.HIPOTESE and c.tendencias_e_sinais[0].evidencias == []
    assert "E99" in rv.citacoes_invalidas[0]
    assert c.cenarios[0].entidades == ["character:a"] and rv.entidades_desconhecidas


def test_modo_deterministico_nao_inventa_cenarios(componentes):
    comp = componentes()
    orq = comp.orquestrador
    inv = orq.executar(orq.criar("Qual o futuro de Alfa diante de Beta?").id)
    assert inv.estado.value == "concluida"
    a = inv.analise
    assert a.modo == "deterministico" and a.cenarios == [] and any("cenários" in l for l in a.limitacoes)
    assert all(af.tipo == TipoEpistemico.CONFIRMADO and af.evidencias for af in a.contexto)
    for af in a.contexto + a.tendencias_e_sinais:
        for e in af.evidencias:
            assert e in inv.registro.itens


def test_modelo_simulado_tem_citacoes_e_entidades_validadas(componentes):
    def resposta(prompt: str):
        assert "SEM CAMINHO" in prompt or "CAMINHOS" in prompt
        return CorpoDaAnalise(
            contexto=[Afirmacao(texto="Alfa lidera a Ordem.", tipo="confirmado", evidencias=["E1"])],
            cenarios=[Cenario(id="C1", nome="Ruptura", logica=Afirmacao(texto="Se Beta obtiver o Cubo...", tipo="hipotese"),
                              premissas=[Afirmacao(texto="Beta busca o Cubo.", tipo="confirmado", evidencias=["E404"])],
                              entidades=["character:beta", "character:nao-existe"])])

    comp = componentes(ModeloSimulado(resposta))
    orq = comp.orquestrador
    inv = orq.executar(orq.criar("O que acontece se Beta conseguir o Cubo?").id)
    a = inv.analise
    assert inv.estado.value == "concluida" and a.modo == "modelo"
    assert a.cenarios[0].premissas[0].tipo == TipoEpistemico.HIPOTESE  # citou E404, que não existe
    assert a.cenarios[0].entidades == ["character:beta"]
    assert inv.grafo.cenarios[0].nos == ["character:beta"]


def test_falha_do_modelo_vira_estado_falhou(componentes):
    comp = componentes(ModeloSimulado(ErroDoModelo("limite de uso")))
    orq = comp.orquestrador
    inv = orq.executar(orq.criar("Qual o futuro de Alfa diante de Beta?").id)
    assert inv.estado.value == "falhou" and "limite de uso" in inv.erro
    assert inv.etapas[0].nome == "recuperacao" and inv.etapas[0].fim


def test_grafo_visual_contrato(componentes):
    comp = componentes()
    orq = comp.orquestrador
    inv = orq.executar(orq.criar("Como Gama se relaciona com a Ordem?").id)
    g = inv.grafo
    ids_nos = {n.id for n in g.nos}
    assert g.focais and g.sequencia[0].motivo == "entidades focais" and set(g.sequencia[0].nos) == set(g.focais)
    for a in g.arestas:
        assert a.origem in ids_nos and a.destino in ids_nos
        assert a.evidencias and all(e in g.evidencias for e in a.evidencias)
    assert g.caminhos and all(aid in {a.id for a in g.arestas} for aid in g.caminhos[0].arestas)
    assert next(n for n in g.nos if n.id in g.focais).papel == "focal"
    assert "character" in g.legenda["tipos_de_no"]


def test_api_fluxo_completo(componentes):
    comp = componentes()
    cli = TestClient(criar_app(comp, sincrono=True))
    assert cli.get("/saude").json()["motor"] == "deterministico"
    assert cli.post("/investigacoes", json={"questao": "curta"}).status_code == 422
    r = cli.post("/investigacoes", json={"questao": "Qual o futuro de Alfa diante de Beta?", "horizonte": "teste"})
    assert r.status_code == 202
    iid = r.json()["id"]
    inv = cli.get(f"/investigacoes/{iid}").json()
    assert inv["estado"] == "concluida" and inv["analise"]["questao"].startswith("Qual o futuro")
    g = cli.get(f"/investigacoes/{iid}/grafo").json()
    assert g["nos"] and g["arestas"] and g["sequencia"]
    eid = g["arestas"][0]["evidencias"][0]
    assert cli.get(f"/investigacoes/{iid}/evidencias/{eid}").json()["id"] == eid
    exp = cli.get(f"/investigacoes/{iid}/grafo/expandir", params={"no": "character:gama"}).json()
    assert exp["arestas"] and all(e in exp["evidencias"] for a in exp["arestas"] for e in a["evidencias"])
    cam = cli.get(f"/investigacoes/{iid}/grafo/caminho", params={"de": "character:gama", "para": "organization:ordem"}).json()
    assert cam["existe"]
    assert cli.get(f"/investigacoes/{iid}/grafo/caminho", params={"de": "character:alfa", "para": "character:isolado"}).json()["existe"] is False
    assert cli.get(f"/investigacoes/{iid}/grafo/expandir", params={"no": "character:nao-existe"}).status_code == 404
    assert cli.get("/investigacoes/naoexiste").status_code == 404
