import json
from pathlib import Path

import pytest

from freya.conhecimento.coleta.parser_marvel import PaginaInvalida, chave_por_link, ler_obra, ler_perfil_personagem
from freya.conhecimento.corpus import Corpus
from freya.conhecimento.migracao_manus import migrar
from freya.conhecimento.modelos import Continuidade, Documento, Entidade, TipoEvidencia
from freya.conhecimento.normalizacao import contem_termo, normalizar, slug
from freya.conhecimento.ontologia import Predicado, TipoEntidade, dominio_valido
from freya.conhecimento.resolucao import resolver

FIX = Path(__file__).parents[1] / "fixtures"
MANUS = Path(__file__).parents[2] / "data" / "corpus" / "manus_corpus.jsonl"


def test_normalizacao_apostrofos_acentos_e_palavra_inteira():
    assert normalizar("T’Challa") == normalizar("T'Challa") == "t'challa"
    assert normalizar("Capitão  América") == "capitao america"
    assert slug("Marvel Studios' The Marvels") == "marvel-studios-the-marvels"
    assert contem_termo("o que thor quer", "thor") and not contem_termo("a thorough plan", "thor")


def test_dominio_impede_relacoes_entre_mundos():
    assert not dominio_valido(Predicado.MEMBRO_DE, TipoEntidade.PESSOA, TipoEntidade.ORGANIZACAO)  # atriz não é membro da Dora Milaje
    assert dominio_valido(Predicado.APARECE_EM, TipoEntidade.PERSONAGEM, TipoEntidade.FILME)
    assert not dominio_valido(Predicado.DIRIGIDO_POR, TipoEntidade.PERSONAGEM, TipoEntidade.PESSOA)
    assert dominio_valido(Predicado.ALIADO_DE, TipoEntidade.PERSONAGEM, TipoEntidade.ORGANIZACAO)


def test_chaves_vem_da_url_oficial():
    assert chave_por_link("/characters/iron-man-tony-stark") == (TipoEntidade.PERSONAGEM, "character:iron-man-tony-stark")
    assert chave_por_link("/teams-and-groups/avengers")[1] == "organization:avengers"
    assert chave_por_link("https://www.marvel.com/tv-shows/loki/2")[1] == "series:loki-2"


def test_perfil_on_screen_so_live_action_e_com_evidencia():
    estado = json.loads((FIX / "perfil_iron_man.json").read_text())
    r = ler_perfil_personagem(estado, "https://www.marvel.com/characters/iron-man-tony-stark/on-screen/profile", "cap1")
    preds = {f.predicado for f in r.fatos}
    assert {Predicado.VIVENCIA, Predicado.ALIADO_DE, Predicado.INIMIGO_DE, Predicado.MEMBRO_DE, Predicado.APARECE_EM} <= preds
    assert r.descartados_quadrinhos == 1  # o card de quadrinhos de teste ficou de fora
    assert not any("teste-quadrinhos" in f.objeto for f in r.fatos)
    doc = r.documentos[0]
    for f in r.fatos:
        assert f.captura_id == "cap1" and f.url.startswith("https://www.marvel.com/")
        if f.tipo_evidencia == TipoEvidencia.TEXTO:
            assert f.evidencia in doc.texto
    momentos = sorted((f for f in r.fatos if f.predicado == Predicado.VIVENCIA), key=lambda f: f.ordem)
    assert [m.ordem for m in momentos] == [1, 2]
    pessoa = r.entidades[0]
    assert pessoa.chave == "character:iron-man-tony-stark" and "Tony Stark" in pessoa.apelidos


def test_pagina_de_filme_creditos_elenco_e_descarte_de_quadrinhos():
    estado = json.loads((FIX / "filme_iron_man.json").read_text())
    r = ler_obra(estado, "https://www.marvel.com/movies/iron-man")
    obra = r.entidades[0]
    assert obra.chave == "film:iron-man" and obra.nome == "Iron Man" and obra.atributos["ano"] == 2008
    assert any(f.predicado == Predicado.DIRIGIDO_POR and f.objeto == "person:jon-favreau" for f in r.fatos)
    assert any(f.predicado == Predicado.APARECE_EM and f.sujeito == "character:iron-man-tony-stark" for f in r.fatos)
    assert r.descartados_quadrinhos == 3  # bloco "Iron Man: Legacy" (edições de quadrinhos)


def test_pagina_errada_e_recusada():
    with pytest.raises(PaginaInvalida):
        ler_perfil_personagem({}, "https://www.marvel.com/movies/iron-man")


def test_corpus_recusa_continuidade_dos_quadrinhos():
    c = Corpus()
    with pytest.raises(ValueError):
        c.adicionar_documento(Documento(doc_id="x", titulo="x", url="u", texto="t", continuidade=Continuidade.QUADRINHOS))


@pytest.mark.skipif(not MANUS.exists(), reason="corpus da Manus ausente")
def test_migracao_da_manus_separa_identidades_e_corrige_creditos():
    c, rel = migrar(MANUS)
    assert rel["problemas"] == []
    assert "character:thor" in c.entidades and "film:thor" in c.entidades  # antes: um nó só
    fatos = list(c.fatos.values())
    assert any(f.sujeito == "character:thor" and f.predicado == Predicado.PARENTE_DE for f in fatos)
    assert not any(f.sujeito == "film:thor" and f.predicado == Predicado.PARENTE_DE for f in fatos)
    assert any(f.sujeito == "film:thor-the-dark-world" and f.objeto == "person:alan-taylor" for f in fatos)
    assert any(f.sujeito == "character:nick-fury" and f.predicado == Predicado.LIDERA for f in fatos)
    assert "STREAMS_ON" in rel["descartados"]
    assert all(f.predicado_original != "LISTED_IN_OFFICIAL_MCU_TIMELINE" or f.ordem for f in fatos)


def test_resolucao_funde_nome_unico_e_nao_funde_ambiguo():
    oficial, outro = Corpus(), Corpus()
    oficial.adicionar_entidade(Entidade(chave="character:x-oficial", nome="Heroi X", tipo=TipoEntidade.PERSONAGEM, apelidos=["Pessoa X"]))
    oficial.adicionar_entidade(Entidade(chave="character:y1", nome="Titulo Y", tipo=TipoEntidade.PERSONAGEM, apelidos=["Primeiro Y"]))
    oficial.adicionar_entidade(Entidade(chave="character:y2", nome="Titulo Y", tipo=TipoEntidade.PERSONAGEM, apelidos=["Segundo Y"]))
    outro.adicionar_entidade(Entidade(chave="character:pessoa-x", nome="Pessoa X", tipo=TipoEntidade.PERSONAGEM))
    outro.adicionar_entidade(Entidade(chave="character:titulo-y", nome="Titulo Y", tipo=TipoEntidade.PERSONAGEM))
    _, rel = resolver(oficial, outro)
    assert rel["fundidas"] == {"character:pessoa-x": "character:x-oficial"}
    assert rel["ambiguas"] == {"character:titulo-y": ["character:y1", "character:y2"]}
