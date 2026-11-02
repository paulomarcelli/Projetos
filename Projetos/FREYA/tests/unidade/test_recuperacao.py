from freya.conhecimento.modelos import Documento
from freya.graph.armazenamento import GrafoMemoria
from freya.graph.modelos import No
from freya.graph.recuperador import RecuperadorGrafo
from freya.graph.resolucao import ResolvedorDeEntidades
from freya.hybrid.chunking import Chunk, dividir
from freya.hybrid.indices import EmbedderHash, IndiceLexicalMemoria, IndiceQdrant
from freya.hybrid.recuperador import RecuperadorHibrido


def test_chunking_por_frases_com_sobreposicao():
    texto = " ".join(f"Frase numero {i} termina aqui." for i in range(80))
    cs = dividir(Documento(doc_id="d", titulo="t", url="u", texto=texto), max_palavras=40)
    assert len(cs) > 1
    assert all(c.texto.endswith(".") for c in cs)  # não corta no meio da frase
    assert cs[0].texto.split("\n")[-1] == cs[1].texto.split("\n")[0]  # sobreposição de uma frase


def test_rrf_funde_as_duas_listas_e_explica_posicoes(corpus_sintetico):
    hib = RecuperadorHibrido(EmbedderHash(), IndiceQdrant(":memory:"), IndiceLexicalMemoria())
    hib.indexar(corpus_sintetico)
    r = hib.buscar("Beta deseja o Cubo", k=3)
    assert r[0].chunk.doc_id == "teste:beta"
    assert r[0].posicao_vetorial and r[0].posicao_lexical
    assert r[0].nota_rrf == 1 / 61 + 1 / 61 or r[0].nota_rrf > r[-1].nota_rrf


def test_rrf_limita_trechos_por_documento():
    hib = RecuperadorHibrido(EmbedderHash(), IndiceQdrant(":memory:"), IndiceLexicalMemoria())
    chunks = [Chunk(chunk_id=f"d#{i}", doc_id="d", texto=f"cubo cubo {i}", titulo="d", url="u") for i in range(5)]
    hib.vetorial.recriar(256)
    hib.vetorial.indexar(chunks, EmbedderHash().codificar([c.texto for c in chunks]))
    hib.lexical.indexar(chunks)
    assert len(hib.buscar("cubo", k=5, por_documento=2)) == 2


def test_resolvedor_prefere_trecho_mais_longo_e_registra_ambiguidade():
    nos = [No(chave="character:t", nome="Thor", tipo="character"), No(chave="film:t", nome="Thor", tipo="film"),
           No(chave="film:t2", nome="Thor: Ragnarok", tipo="film"), No(chave="character:c", nome="T’Challa", tipo="character")]
    r = ResolvedorDeEntidades(nos, apelidos_pt={})
    rec = r.reconhecer("O que Thor fez em Thor: Ragnarok e com T'Challa?")
    chaves = [n.chave for n in rec.entidades]
    assert "film:t2" in chaves and "character:t" in chaves and "character:c" in chaves
    assert rec.ambiguidades and rec.ambiguidades[0]["escolhida"] == "character:t"
    assert ResolvedorDeEntidades(nos, {}).reconhecer("no filme Thor").entidades[0].chave == "film:t"
    assert ResolvedorDeEntidades(nos, {}).reconhecer("Thorough").entidades == []


def test_resolvedor_usa_nomes_em_portugues():
    r = ResolvedorDeEntidades([No(chave="character:x", nome="Iron Man", tipo="character")], apelidos_pt={"character:x": ["Homem de Ferro"]})
    assert r.reconhecer("O futuro do Homem de Ferro").entidades[0].chave == "character:x"


def test_grafo_caminhos_reais_e_ausencia_de_caminho(corpus_sintetico):
    g = GrafoMemoria()
    g.carregar(corpus_sintetico)
    cs = g.caminhos("character:gama", "organization:ordem", max_saltos=3)
    assert cs and cs[0].nos[0] == "character:gama" and cs[0].nos[-1] == "organization:ordem"
    assert all(a.evidencia.citacao for a in cs[0].arestas)
    assert g.caminhos("character:alfa", "character:isolado") == []
    # arestas de catálogo (direção, elenco) ficam fora da exploração narrativa
    assert g.caminhos("character:alfa", "person:pessoa-real", max_saltos=4) == []
    assert g.caminhos("character:alfa", "person:pessoa-real", max_saltos=4, incluir_catalogo=True)


def test_graphrag_trajetoria_e_pares_sem_caminho(corpus_sintetico):
    g = GrafoMemoria()
    g.carregar(corpus_sintetico)
    r = RecuperadorGrafo(g).buscar("Qual o futuro de Alfa e de Isolado?")
    assert {n.chave for n in r.entidades} == {"character:alfa", "character:isolado"}
    assert ("character:alfa", "character:isolado") in r.sem_caminho
    traj = next(t for t in r.trajetorias if t.personagem == "character:alfa")
    assert traj.momentos[0].ordem == 1 and traj.aparicoes[0].ano == 2010
