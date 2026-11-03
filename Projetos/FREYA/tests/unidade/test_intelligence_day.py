"""Intelligence Day sem rede: um coletor falso devolve uma notícia SINTÉTICA no formato do estado de marvel.com.

A notícia fala de uma obra que o grafo ainda não tem ("Obra Nova"): ela tem de virar nó pelas tags oficiais,
ligar-se aos personagens marcados e entrar no RAG — e a investigação seguinte tem de encontrá-la.
"""
from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

from freya.conhecimento.modelos import Captura
from freya.intelligence_day import IntelligenceDay
from freya.intelligence_day.leitura import ler_noticia
from freya.intelligence_day.modulo import urls_da_lista, urls_do_sitemap
from freya.llm.cliente import ModeloSimulado

BASE = "https://www.marvel.com"
NOTICIA = f"{BASE}/articles/tv-shows/obra-nova-estreia"


def _estado(titulo="Obra Nova estreia com Alfa e Beta", data="2026-10-14"):
    return {
        "meta_tags": [{"json_schema": [{"object": {"datePublished": data}}]}],
        "components": [{}, {"article_components": [{"content_components": [
            {"component_type": "article_header", "title": titulo, "subtitle": "A série de teste chega ao streaming.",
             "publish_date": "October 14, 2026", "category": "TV Shows"},
            {"component_type": "content_block", "body_content": {"type": "text", "value":
                "<p>Em <a href='/tv-shows/obra-nova/1'><em>Obra Nova</em></a>, Alfa enfrenta Beta de novo.</p><p>Gama volta como aliado de Alfa.</p>"}},
            {"component_type": "content_block", "body_content": {"type": "image", "value": {"alt": "imagem"}}},
            {"component_type": "article_tags", "tags": [{"link": "/tv-shows/obra-nova/1", "title": "Obra Nova"},
                                                         {"link": "/characters/alfa", "title": "Alfa"},
                                                         {"link": "/characters/beta", "title": "Beta"}]},
        ]}]}],
    }


class ColetorFalso:
    def __init__(self, paginas: dict[str, dict], lista: list[str]):
        self.paginas, self.lista, self.pedidos = paginas, lista, []

    def carregar_robots(self):
        pass

    def permitido(self, url):
        return True

    def _get(self, url):
        class R:
            status_code = 200
            text = "".join(f'<a href="{u.replace(BASE, "")}">x</a>' for u in self.lista) if url.endswith("/articles") else "<urlset></urlset>"
        return R()

    def capturar(self, url):
        self.pedidos.append(url)
        if url not in self.paginas:
            return None
        return json.dumps(self.paginas[url]), Captura(id="sha-teste", url=url, recuperado_em=datetime.now(timezone.utc), caminho_local="", status_http=200)


def _intel(comp, tmp_path, coletor, modelo=None, **kw):
    return IntelligenceDay(comp.hibrido, comp.grafo, modelo, pasta=tmp_path / "intel", coletor=coletor, **kw)


def test_le_texto_data_e_tags_da_noticia():
    n = ler_noticia(_estado(), NOTICIA)
    assert n.titulo == "Obra Nova estreia com Alfa e Beta" and n.publicada_em.isoformat() == "2026-10-14"
    assert "Alfa enfrenta Beta de novo." in n.texto and "imagem" not in n.texto
    assert [t.chave for t in n.obras] == ["series:obra-nova-1"]
    assert [t.chave for t in n.personagens] == ["character:alfa", "character:beta"]
    d = n.documento("sha-teste")
    assert d.doc_id == "noticia:obra-nova-estreia" and d.entidade == "series:obra-nova-1" and d.ano == 2026 and d.tipo_fonte == "official_marvel_news"


def test_listas_de_noticias_so_filmes_e_series():
    html = '<a href="/articles/movies/a-1">x</a><a href="/articles/comics/b-2">x</a><a href="/articles/tv-shows/c-3">x</a><a href="/articles/movies/a-1">x</a>'
    assert urls_da_lista(html) == [f"{BASE}/articles/movies/a-1", f"{BASE}/articles/comics/b-2", f"{BASE}/articles/tv-shows/c-3"]
    assert urls_do_sitemap("<url><loc>https://www.marvel.com/articles/movies/x</loc></url>") == ["https://www.marvel.com/articles/movies/x"]


def test_noticia_nova_entra_no_rag_e_cria_a_obra_no_grafo(componentes, tmp_path):
    comp = componentes()
    assert comp.grafo.no("series:obra-nova-1") is None
    coletor = ColetorFalso({NOTICIA: _estado()}, [NOTICIA, f"{BASE}/articles/comics/fora"])
    r = _intel(comp, tmp_path, coletor).atualizar()

    assert r["noticias_novas"] == 1 and r["entidades_novas"] == 1 and r["relacoes"] == 2
    assert coletor.pedidos == [NOTICIA]  # quadrinhos nem são pedidos
    assert comp.grafo.no("series:obra-nova-1").nome == "Obra Nova"
    viz = comp.grafo.vizinhanca(["series:obra-nova-1"])
    assert {a.origem for a in viz.arestas.values() if a.predicado == "RELATED_TO"} == {"character:alfa", "character:beta"}
    assert any(r.chunk.doc_id == "noticia:obra-nova-estreia" for r in comp.hibrido.buscar("Obra Nova estreia", k=5))


def test_segunda_varredura_no_mesmo_dia_nao_vai_a_rede(componentes, tmp_path):
    comp = componentes()
    coletor = ColetorFalso({NOTICIA: _estado()}, [NOTICIA])
    intel = _intel(comp, tmp_path, coletor)
    intel.atualizar()
    assert intel.atualizar()["varredura"] == "em dia"
    assert coletor.pedidos == [NOTICIA]
    # vencida a validade, só pede o que ainda não leu
    intel.estado["ultima_varredura"] = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
    assert intel.atualizar()["noticias_novas"] == 0 and coletor.pedidos == [NOTICIA]


def test_reaplicar_devolve_as_noticias_a_uma_base_recriada(componentes, tmp_path):
    _intel(componentes(), tmp_path, ColetorFalso({NOTICIA: _estado()}, [NOTICIA])).atualizar()
    nova = componentes()  # a API reiniciou: base recriada, sem a notícia
    assert nova.grafo.no("series:obra-nova-1") is None
    r = _intel(nova, tmp_path, ColetorFalso({}, [])).reaplicar()
    assert r["entidades_novas"] == 1 and nova.grafo.no("series:obra-nova-1") is not None


def test_com_modelo_extrai_relacoes_do_texto_com_citacao_literal(componentes, tmp_path):
    comp = componentes()
    modelo = ModeloSimulado({"relacoes": [
        {"sujeito": "character:alfa", "predicado": "ENEMY_OF", "objeto": "character:beta", "evidencia": "Alfa enfrenta Beta de novo."},
        {"sujeito": "character:gama", "predicado": "ALLY_OF", "objeto": "character:alfa", "evidencia": "frase que não está no texto"},
    ]})
    r = _intel(comp, tmp_path, ColetorFalso({NOTICIA: _estado()}, [NOTICIA]), modelo=modelo).atualizar()
    assert r["relacoes_do_texto"] >= 1
    arestas = comp.grafo.vizinhanca(["character:alfa"]).arestas.values()
    assert any(a.predicado == "ENEMY_OF" and a.evidencia.doc_id == "noticia:obra-nova-estreia" for a in arestas)
    assert not any(a.evidencia.citacao == "frase que não está no texto" for a in arestas)


def test_falha_nas_noticias_nao_derruba_a_investigacao(componentes, tmp_path):
    comp = componentes()

    class Quebrado:
        def atualizar(self):
            raise ConnectionError("sem rede")

    comp.orquestrador.intelligence_day = Quebrado()
    inv = comp.orquestrador.executar(comp.orquestrador.criar("Como Alfa e Beta podem evoluir?").id)
    assert inv.estado.value == "concluida"
    etapa = next(e for e in inv.etapas if e.nome == "intelligence_day")
    assert "sem rede" in etapa.resumo["erro"]
