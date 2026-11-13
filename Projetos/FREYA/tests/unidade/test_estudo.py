"""Estudo de personagens sem rede: HTML SINTÉTICO no formato da wiki (Hub, temporada, episódio, biografia)."""
from __future__ import annotations

from freya.conhecimento.modelos import Entidade, Fato, TipoEvidencia
from freya.conhecimento.ontologia import Predicado, TipoEntidade
from freya.estudo import EstudoDePersonagens
from freya.estudo.modulo import episodios, variantes_do_hub

HUB = '<a title="Alfa">Alfa</a><a title="Alfa/Viagem">x</a><a title="Alfa/Ponta">x</a><a title="Gama">x</a>'
TEMPORADA = """<h2>Plot</h2><p>Na segunda temporada, Alfa enfrenta Beta pelo controle do Cubo de teste, numa longa disputa.</p>
<h2>Episodes</h2><table class="wikitable"><tr><td><i><a title="Começo (Série Alfa)">Começo</a></i></td><td><a title="Roteirista Real">x</a></td></tr>
<tr><td><i><a title="Fim/Final">Fim/Final</a></i></td><td><a title="Alfa/Viagem">Alfa</a></td></tr></table><h2>References</h2>"""


def _bio(n):
    return ('<aside class="portable-infobox"></aside><h2>Biography</h2>'
            + "".join(f"<h3>Capítulo {i}</h3><p>Alfa viajante vive o capítulo {i} da sua trajetória de teste, longe da cidade.</p>" for i in range(n))
            + "<h2>Relationships</h2>")


def _episodio(t):
    return f"<h2>Synopsis</h2><p>{t}: Alfa descobre o destino do Cubo de teste e decide protegê-lo para sempre.</p><h2>Plot</h2><p>Em {t}, Alfa assume o lugar de guardião do Cubo e fica sozinho no fim da história de teste.</p>"


class WikiFalsa:
    def __init__(self):
        self.pedidos = []
        self.paginas = {"Hub:Alfa": HUB, "Alfa/Viagem": _bio(5), "Alfa/Ponta": _bio(1), "Série Alfa (TV series)/Season Two": TEMPORADA,
                        "Começo (Série Alfa)": _episodio("Começo"), "Fim/Final": _episodio("Fim/Final")}

    def pagina(self, titulo):
        self.pedidos.append(titulo)
        html = self.paginas.get(titulo)
        return {"titulo": titulo, "html": html, "revid": 1} if html else None


def test_hub_e_lista_de_episodios():
    assert variantes_do_hub(HUB, "Alfa") == ["Alfa/Viagem", "Alfa/Ponta"]
    assert episodios(TEMPORADA) == ["Começo (Série Alfa)", "Fim/Final"]  # roteirista e personagem ficam de fora


def test_estuda_variante_com_mais_historia_e_enredo_da_temporada(componentes, tmp_path):
    comp = componentes()
    # a série e a 2ª temporada no grafo, e a variante aparecendo na temporada
    comp.grafo.adicionar_entidades([Entidade(chave="series:serie-alfa", nome="Série Alfa", tipo=TipoEntidade.SERIE),
                                    Entidade(chave="series:serie-alfa-2", nome="Série Alfa | Season 2", tipo=TipoEntidade.SERIE, atributos={"ano": 2023})])
    wiki = WikiFalsa()
    estudo = EstudoDePersonagens(comp.hibrido, comp.grafo, pasta=tmp_path / "estudos", cliente=wiki, max_variantes=1)
    original = estudo._variantes

    def com_aparicao(chave, nome, leitor, novo):
        lidas = original(chave, nome, leitor, novo)
        novo.adicionar_fato(Fato(sujeito=lidas[0], predicado=Predicado.APARECE_EM, objeto="series:serie-alfa", evidencia="Appearances",
                                 tipo_evidencia=TipoEvidencia.CAMPO, doc_id=f"wiki:{lidas[0]}:perfil", url="https://exemplo.teste"))
        return lidas

    estudo._variantes = com_aparicao
    r = estudo.estudar("character:alfa", "Alfa")
    assert r["variantes"] == ["character:alfa-viagem"]  # 5 capítulos ganham de 1
    assert r["series"] == ["Série Alfa | Season 2"] and r["episodios"] == 2
    assert comp.grafo.no("character:alfa-viagem") is not None
    achados = {x.chunk.doc_id for x in comp.hibrido.buscar("Alfa guardião do Cubo sozinho no fim", k=8)}
    assert any(":ep-fim-final:" in d for d in achados)
    # estudado uma vez: a segunda chamada não vai à wiki
    n = len(wiki.pedidos)
    assert estudo.estudar("character:alfa", "Alfa")["estudo"] == "já feito" and len(wiki.pedidos) == n
