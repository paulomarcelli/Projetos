"""Leitura da wiki do MCU e extração de relações dos enredos (com HTML e entidades fictícias)."""
from freya.conhecimento.coleta.wiki_mcu import LeitorWiki, pagina_confere
from freya.conhecimento.coleta.wiki_obras import ler_obra_wiki
from freya.conhecimento.corpus import Corpus
from freya.conhecimento.extracao import Extracao, RelacaoExtraida, extrair
from freya.conhecimento.modelos import Confiabilidade, Documento, Entidade
from freya.conhecimento.ontologia import Predicado, TipoEntidade
from freya.llm.cliente import ModeloSimulado

PAGINA = """
<aside class="portable-infobox">
 <div class="pi-item pi-data" data-source="real name"><h3>Real Name</h3><div class="pi-data-value">Alfa Teste<sup class="reference"><a href="#cite_note-OB1-1">[1]</a></sup></div></div>
 <div class="pi-item pi-data" data-source="alias"><h3>Aliases</h3><div class="pi-data-value"><b>Codenames</b><br>Personagem Alfa</div></div>
 <div class="pi-item pi-data" data-source="status"><h3>Status</h3><div class="pi-data-value">Alive</div></div>
 <div class="pi-item pi-data" data-source="affiliation"><h3>Affiliation</h3><div class="pi-data-value"><a title="Ordem">Ordem</a> (formerly)<br><a title="Liga">Liga</a></div></div>
 <div class="pi-item pi-data" data-source="movie"><h3>Movies</h3><div class="pi-data-value"><i><a title="Obra Um">Obra Um</a></i><br><i><a title="Obra Dois">Obra Dois</a></i> (mentioned)</div></div>
</aside>
<h2>Biography</h2>
<h3>Early Life</h3>
<p>Alfa grew up in the test city and trained with the Order for many years.<sup class="reference"><a href="#cite_note-OB1-1">[1]</a></sup></p>
<h3>Rumors</h3>
<p>It was said that Alfa had a secret sibling somewhere far away from the city.<sup class="reference"><a href="#cite_note-Unconfirmed-2">[2]</a></sup></p>
<h2>Relationships</h2>
<h3>Family</h3><ul><li><a title="Beta">Beta</a> † - Older Brother and Former Teammate</li></ul>
<h3>Enemies</h3><ul><li><a title="Gama">Gama</a> - Rival</li></ul>
<h2>References</h2>
<ol class="references"><li id="cite_note-OB1-1"><span class="reference-text">Obra Um</span></li>
<li id="cite_note-Unconfirmed-2"><span class="reference-text">This information is revealed in a book whose canonicity within the MCU has neither been confirmed nor denied.</span></li></ol>
"""


def test_wiki_infobox_relacoes_com_nuance_e_biografia_datada():
    reg = {"titulo": "Alfa Teste", "revid": 1, "html": PAGINA}
    assert pagina_confere(reg, "Personagem Alfa", [])
    assert not pagina_confere(reg, "Outro Nome", [])
    leitor = LeitorWiki({"obra um": ("film:obra-um", 2010), "obra dois": ("film:obra-dois", 2012)}, {"Beta": "character:beta-oficial"})
    r = leitor.ler(reg, "character:alfa", "Alfa", TipoEntidade.PERSONAGEM)
    por = {(f.predicado, f.objeto): f for f in r.fatos}
    assert por[(Predicado.MEMBRO_DE, "organization:ordem")].qualificador == "antiga"
    assert por[(Predicado.MEMBRO_DE, "organization:liga")].qualificador == "atual"
    irmao = por[(Predicado.PARENTE_DE, "character:beta-oficial")]  # ligado à chave oficial pelo mapa de títulos
    assert irmao.qualificador == "Older Brother and Former Teammate" and irmao.confiabilidade == Confiabilidade.WIKI_FAS
    assert (Predicado.APARECE_EM, "film:obra-um") in por and (Predicado.APARECE_EM, "film:obra-dois") not in por  # "mentioned" não conta
    assert r.aparicoes_ignoradas == 1
    assert r.descartados_incertos == 1  # trecho só com referência "Unconfirmed"
    momento = next(f for f in r.fatos if f.predicado == Predicado.VIVENCIA)
    assert momento.ano == 2010 and momento.obra == "film:obra-um" and momento.ordem == 1
    bio = next(d for d in r.documentos if d.secao == "Early Life")
    assert bio.obras == ["film:obra-um"] and "[1]" not in bio.texto


def test_pagina_de_obra_aparicoes_e_enredo():
    html = """<h2>Plot</h2><p>Alfa and Beta join forces against Gama to protect the Cube in the test city.</p>
    <h2>Appearances</h2><ul><li><a title="Alfa Teste">Alfa</a></li></ul>
    <h3>Items</h3><ul><li><a title="Cube">Cube</a></li><li><a title="Lamp">Lamp</a> (background)</li></ul>
    <h3>Media</h3><ul><li><a title="wikipedia:Some Film">Some Film</a></li></ul>"""
    docs, ents, fatos = ler_obra_wiki({"titulo": "Obra Um", "html": html}, "film:obra-um", "Obra Um", 2010, {"Alfa Teste": "character:alfa"})
    assert {d.secao for d in docs} == {"plot", "aparicoes"}
    alvos = {(f.sujeito, f.objeto) for f in fatos}
    assert ("character:alfa", "film:obra-um") in alvos and ("artifact:cube", "film:obra-um") in alvos
    assert not any("lamp" in f.sujeito for f in fatos)  # "(background)" não conta


def _corpus():
    c = Corpus()
    for ch, nome, tipo in [("character:alfa", "Alfa", TipoEntidade.PERSONAGEM), ("character:beta", "Beta", TipoEntidade.PERSONAGEM),
                           ("character:gama", "Gama", TipoEntidade.PERSONAGEM), ("artifact:cubo", "Cubo", TipoEntidade.ARTEFATO)]:
        c.adicionar_entidade(Entidade(chave=ch, nome=nome, tipo=tipo))
    return c


def test_extracao_aceita_so_citacao_literal_entidades_da_lista_e_predicado_valido():
    texto = "Alfa and Beta join forces against Gama. Gama seeks the Cubo to rule the city."
    doc = Documento(doc_id="enredo:1", titulo="Obra Um", url="u", texto=texto, obras=["film:obra-um"], ano=2010,
                    confiabilidade=Confiabilidade.WIKI_FAS)
    resposta = Extracao(relacoes=[
        RelacaoExtraida(sujeito="character:alfa", predicado="ALLY_OF", objeto="character:beta", evidencia="Alfa and Beta join forces"),
        RelacaoExtraida(sujeito="character:gama", predicado="SEEKS", objeto="artifact:cubo", evidencia="Gama seeks the Cubo"),
        RelacaoExtraida(sujeito="character:alfa", predicado="ENEMY_OF", objeto="character:gama", evidencia="Alfa defeats Gama in battle"),  # não literal
        RelacaoExtraida(sujeito="character:alfa", predicado="ALLY_OF", objeto="character:inventado", evidencia="Alfa and Beta join forces"),
        RelacaoExtraida(sujeito="character:alfa", predicado="LOVES", objeto="character:beta", evidencia="Alfa and Beta join forces"),
        RelacaoExtraida(sujeito="artifact:cubo", predicado="MEMBER_OF", objeto="character:alfa", evidencia="Gama seeks the Cubo"),  # domínio
    ])
    fatos, rel = extrair(_corpus(), [doc], ModeloSimulado(resposta), paralelo=1)
    assert {(f.sujeito, f.predicado, f.objeto) for f in fatos} == {
        ("character:alfa", Predicado.ALIADO_DE, "character:beta"), ("character:gama", Predicado.BUSCA, "artifact:cubo")}
    assert all(f.obra == "film:obra-um" and f.ano == 2010 and f.confiabilidade == Confiabilidade.WIKI_FAS for f in fatos)
    r = rel["recusadas"]
    assert r["citacao_nao_literal"] == 1 and r["entidade_fora_da_lista"] == 1 and r["predicado"] == 1 and r["dominio"] == 1


def test_extracao_nao_chama_o_modelo_sem_pelo_menos_duas_entidades():
    modelo = ModeloSimulado(Extracao())
    doc = Documento(doc_id="enredo:2", titulo="x", url="u", texto="Only Alfa walks alone through the quiet test city at night.")
    _, rel = extrair(_corpus(), [doc], modelo, paralelo=1)
    assert rel["chamadas"] == 0 and modelo.chamadas == []
