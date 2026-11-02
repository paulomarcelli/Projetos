"""Testes de integração com Qdrant, Elasticsearch e Neo4j reais.

    docker compose up -d
    pytest -m integracao

Usam o corpus sintético (conftest.py) em índices e chaves próprios dos testes.
"""
import pytest

from freya.config import Config
from freya.graph.armazenamento import GrafoNeo4j
from freya.hybrid.indices import EmbedderHash, IndiceElasticsearch, IndiceQdrant
from freya.hybrid.recuperador import RecuperadorHibrido

pytestmark = pytest.mark.integracao


@pytest.fixture(scope="module")
def cfg():
    c = Config()
    if not c.neo4j_password:
        pytest.skip("NEO4J_PASSWORD não definida")
    return c


def test_hybrid_com_qdrant_e_elasticsearch(cfg, corpus_sintetico):
    hib = RecuperadorHibrido(EmbedderHash(), IndiceQdrant(cfg.qdrant_url, "freya_teste"), IndiceElasticsearch(cfg.elasticsearch_url, "freya_teste"))
    assert hib.indexar(corpus_sintetico)["chunks"] >= 4
    r = hib.buscar("Beta deseja o Cubo", k=3)
    assert r[0].chunk.doc_id == "teste:beta" and r[0].posicao_lexical == 1


def test_grafo_no_neo4j_com_tipos_reais_e_caminhos(cfg, corpus_sintetico):
    g = GrafoNeo4j(cfg.neo4j_uri, cfg.neo4j_user, cfg.neo4j_password.get_secret_value(), base="freya_teste")
    try:
        estat = g.carregar(corpus_sintetico)
        assert estat["arestas"] >= len(corpus_sintetico.fatos)
        cs = g.caminhos("character:gama", "organization:ordem", max_saltos=3)
        assert cs and cs[0].arestas[0].evidencia.citacao
        assert g.caminhos("character:alfa", "character:isolado") == []
        viz = g.vizinhanca(["character:alfa"])
        assert "organization:ordem" in viz.nos and all(a.predicado != "DIRECTED_BY" for a in viz.arestas.values())
    finally:
        g.fechar()
