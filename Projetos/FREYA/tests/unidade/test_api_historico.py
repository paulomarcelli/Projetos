"""Histórico, exclusão e guardados: Repositorio (com a migração de bancos antigos) e os endpoints da API.

Tudo em memória, com o corpus sintético do conftest: sem Docker e sem modelo de linguagem.
"""
import json
import sqlite3
from datetime import timedelta

from fastapi.testclient import TestClient

from freya.api.app import criar_app
from freya.investigacao.orquestrador import Estado, Investigacao, Repositorio, agora
from freya.llm.cliente import ModeloSimulado
from freya.prospectivo.modelos import Afirmacao, Cenario, CorpoDaAnalise

QUESTOES = ["Qual o futuro de Alfa diante de Beta?", "Como Gama se relaciona com a Ordem?", "O que acontece se Beta conseguir o Cubo?"]


def _cliente(comp):
    return TestClient(criar_app(comp, sincrono=True))


def _criar(cli, questao, horizonte=None):
    r = cli.post("/investigacoes", json={"questao": questao, "horizonte": horizonte})
    assert r.status_code == 202
    return r.json()["id"]


def test_lista_mais_recentes_primeiro_com_resumo(componentes):
    cli = _cliente(componentes())
    ids = [_criar(cli, q, "teste" if i == 0 else None) for i, q in enumerate(QUESTOES)]
    lista = cli.get("/investigacoes").json()
    assert [r["id"] for r in lista] == ids[::-1]
    r = lista[-1]
    assert set(r) == {"id", "questao", "horizonte", "estado", "erro", "guardada", "cenarios", "criada_em", "atualizada_em"}
    assert r["questao"] == QUESTOES[0] and r["horizonte"] == "teste" and r["estado"] == "concluida"
    assert r["erro"] is None and r["guardada"] is False and r["cenarios"] == 0
    assert [r["id"] for r in cli.get("/investigacoes", params={"limite": 2}).json()] == ids[:0:-1]
    assert cli.get("/investigacoes", params={"limite": 0}).status_code == 422


def test_resumo_conta_cenarios_e_registra_falha(componentes):
    def resposta(_prompt):
        return CorpoDaAnalise(cenarios=[Cenario(id=f"C{i}", nome=f"C{i}", logica=Afirmacao(texto="Se...", tipo="hipotese")) for i in (1, 2)])

    cli = _cliente(componentes(ModeloSimulado(resposta)))
    _criar(cli, QUESTOES[2])
    assert cli.get("/investigacoes").json()[0]["cenarios"] == 2

    from freya.llm.cliente import ErroDoModelo

    cli2 = _cliente(componentes(ModeloSimulado(ErroDoModelo("limite de uso"))))
    _criar(cli2, QUESTOES[0])
    r = cli2.get("/investigacoes").json()[0]
    assert r["estado"] == "falhou" and "limite de uso" in r["erro"] and r["cenarios"] == 0



def test_guardar_desguardar_e_filtro(componentes):
    cli = _cliente(componentes())
    a, b = _criar(cli, QUESTOES[0]), _criar(cli, QUESTOES[1])
    assert cli.get(f"/investigacoes/{a}").json()["guardada"] is False
    assert cli.put(f"/investigacoes/{a}/guardada").status_code == 204
    assert cli.put(f"/investigacoes/{a}/guardada").status_code == 204  # idempotente
    assert cli.get(f"/investigacoes/{a}").json()["guardada"] is True
    assert [r["id"] for r in cli.get("/investigacoes", params={"guardadas": "true"}).json()] == [a]
    assert [r["id"] for r in cli.get("/investigacoes", params={"guardadas": "false"}).json()] == [b]
    # explorar o grafo regrava a investigação, e isso não pode desfazer o "guardada"
    assert cli.get(f"/investigacoes/{a}/grafo/expandir", params={"no": "character:gama"}).status_code == 200
    assert cli.get(f"/investigacoes/{a}").json()["guardada"] is True
    assert cli.delete(f"/investigacoes/{a}/guardada").status_code == 204
    assert cli.get("/investigacoes", params={"guardadas": "true"}).json() == []
    assert cli.put("/investigacoes/naoexiste/guardada").status_code == 404
    assert cli.delete("/investigacoes/naoexiste/guardada").status_code == 404


def test_excluir_204_404_e_409_em_execucao(componentes):
    comp = componentes()
    cli = _cliente(comp)
    iid = _criar(cli, QUESTOES[0])
    assert cli.delete(f"/investigacoes/{iid}").status_code == 204
    assert cli.get(f"/investigacoes/{iid}").status_code == 404
    assert cli.delete(f"/investigacoes/{iid}").status_code == 404
    assert cli.get("/investigacoes").json() == []

    orq = comp.orquestrador
    pendente = orq.criar(QUESTOES[1])  # criada e ainda não executada
    r = cli.delete(f"/investigacoes/{pendente.id}")
    assert r.status_code == 409 and "execução" in r.json()["detail"]
    for estado in (Estado.RECUPERANDO, Estado.ANALISANDO, Estado.VALIDANDO):
        pendente.estado = estado
        orq.repo.salvar(pendente)
        assert cli.delete(f"/investigacoes/{pendente.id}").status_code == 409
    orq.executar(pendente.id)
    assert cli.delete(f"/investigacoes/{pendente.id}").status_code == 204


def test_excluir_investigacao_abandonada(componentes):
    """Um processo que parou no meio deixa a investigação num estado intermediário; depois de muito tempo, ela pode sair."""
    comp = componentes()
    cli = _cliente(comp)
    inv = comp.orquestrador.criar(QUESTOES[0])
    inv.estado, inv.atualizada_em = Estado.ANALISANDO, agora() - timedelta(hours=2)
    comp.orquestrador.repo._con.execute("UPDATE investigacoes SET dados = ? WHERE id = ?", (inv.model_dump_json(), inv.id))
    assert cli.delete(f"/investigacoes/{inv.id}").status_code == 204


def test_cors_aceita_put_e_delete(componentes):
    cli = TestClient(criar_app(componentes(), sincrono=True, origens=["http://localhost:5173"]))
    for metodo in ("PUT", "DELETE"):
        r = cli.options("/investigacoes/x/guardada", headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": metodo})
        assert r.status_code == 200 and metodo in r.headers["access-control-allow-methods"]


def test_migracao_de_banco_antigo(tmp_path):
    caminho = tmp_path / "antigo.db"
    con = sqlite3.connect(caminho)
    con.execute("CREATE TABLE investigacoes (id TEXT PRIMARY KEY, dados TEXT NOT NULL, atualizada_em TEXT NOT NULL)")
    base = agora() - timedelta(days=1)
    invs = [Investigacao(id=f"id{i}", questao=q, estado=Estado.CONCLUIDA, criada_em=base + timedelta(minutes=i), atualizada_em=base)
            for i, q in enumerate(QUESTOES)]
    invs[1].estado, invs[1].erro = Estado.FALHOU, "modelo de linguagem: limite"
    for inv in invs:
        con.execute("INSERT INTO investigacoes VALUES (?, ?, ?)", (inv.id, inv.model_dump_json(), inv.atualizada_em.isoformat()))
    con.commit()
    con.close()

    repo = Repositorio(str(caminho))
    colunas = {r[1] for r in repo._con.execute("PRAGMA table_info(investigacoes)")}
    assert {"guardada", "questao", "estado", "cenarios", "criada_em"} <= colunas
    lista = repo.listar()
    assert [r.id for r in lista] == ["id2", "id1", "id0"]
    assert all(r.guardada is False for r in lista)
    assert lista[1].estado == Estado.FALHOU and lista[1].erro == "modelo de linguagem: limite"
    assert lista[2].questao == QUESTOES[0] and lista[2].criada_em == invs[0].criada_em

    assert repo.marcar_guardada("id0", True) and not repo.marcar_guardada("nao", True)
    repo.salvar(repo.obter("id0"))  # regravar não desfaz o guardada
    assert [r.id for r in repo.listar(guardadas=True)] == ["id0"]
    assert repo.remover("id1") and not repo.remover("id1")
    repo._con.close()

    # reabrir um banco já migrado não muda nada
    repo2 = Repositorio(str(caminho))
    assert [(r.id, r.guardada) for r in repo2.listar()] == [("id2", False), ("id0", True)]
    assert json.loads(repo2._con.execute("SELECT dados FROM investigacoes WHERE id='id0'").fetchone()[0])["id"] == "id0"
