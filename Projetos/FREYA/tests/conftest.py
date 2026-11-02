"""Corpus SINTÉTICO para os testes do motor, do grafo e da API.

As entidades abaixo (Alfa, Beta, Gama, Ordem, Cubo) são fictícias e servem só para testar a mecânica.
Nenhum fato do MCU é inventado nos testes; os testes do leitor de marvel.com usam trechos reais capturados.
"""
from __future__ import annotations

import pytest

from freya.config import Config
from freya.conhecimento.corpus import Corpus
from freya.conhecimento.modelos import Documento, Entidade, Fato, TipoEvidencia
from freya.conhecimento.ontologia import Predicado, TipoEntidade
from freya.fabrica import montar
from freya.hybrid.indices import EmbedderHash
from freya.investigacao.orquestrador import Repositorio

URL = "https://exemplo.teste/fonte"


def _f(s, p, o, ev, doc, tipo=TipoEvidencia.CAMPO, ordem=None, ano=None):
    return Fato(sujeito=s, predicado=p, objeto=o, evidencia=ev, tipo_evidencia=tipo, doc_id=doc, url=URL, ordem=ordem, ano=ano)


@pytest.fixture
def corpus_sintetico() -> Corpus:
    c = Corpus()
    docs = {
        "teste:alfa": "Alfa (Personagem Alfa) — perfil de teste.\nAlfa protege a cidade de teste e lidera a Ordem.\nMomento 1 — Despertar: Alfa encontra o Cubo.",
        "teste:beta": "Beta — perfil de teste.\nBeta deseja o Cubo para dominar a cidade de teste.",
        "teste:gama": "Gama — perfil de teste.\nGama é aliado de Alfa e também já enfrentou Alfa.",
        "teste:obra": "Obra Um — página de teste.\nDirected By: Pessoa Real",
    }
    for d, t in docs.items():
        c.adicionar_documento(Documento(doc_id=d, titulo=d.split(":")[1].title(), url=URL, texto=t, entidade=f"character:{d.split(':')[1]}"))
    for ch, nome, tipo in [("character:alfa", "Alfa", TipoEntidade.PERSONAGEM), ("character:beta", "Beta", TipoEntidade.PERSONAGEM),
                           ("character:gama", "Gama", TipoEntidade.PERSONAGEM), ("organization:ordem", "Ordem", TipoEntidade.ORGANIZACAO),
                           ("artifact:cubo", "Cubo", TipoEntidade.ARTEFATO), ("film:obra-um", "Obra Um", TipoEntidade.FILME),
                           ("person:pessoa-real", "Pessoa Real", TipoEntidade.PESSOA), ("character:isolado", "Isolado", TipoEntidade.PERSONAGEM),
                           ("event:alfa--despertar", "Alfa: Despertar", TipoEntidade.ACONTECIMENTO)]:
        c.adicionar_entidade(Entidade(chave=ch, nome=nome, tipo=tipo, apelidos=["Personagem Alfa"] if ch == "character:alfa" else []))
    for f in [
        _f("character:alfa", Predicado.MEMBRO_DE, "organization:ordem", "Connections › Groups: Ordem", "teste:alfa"),
        _f("character:alfa", Predicado.INIMIGO_DE, "character:beta", "Connections › Enemies: Beta", "teste:alfa"),
        _f("character:beta", Predicado.BUSCA, "artifact:cubo", "Beta deseja o Cubo para dominar a cidade de teste.", "teste:beta", TipoEvidencia.TEXTO),
        _f("character:gama", Predicado.ALIADO_DE, "character:alfa", "Connections › Allies: Alfa", "teste:gama"),
        _f("character:gama", Predicado.INIMIGO_DE, "character:alfa", "Connections › Enemies: Alfa", "teste:gama"),
        _f("character:alfa", Predicado.VIVENCIA, "event:alfa--despertar", "Alfa encontra o Cubo.", "teste:alfa", TipoEvidencia.TEXTO, ordem=1),
        _f("character:alfa", Predicado.APARECE_EM, "film:obra-um", "Related: Obra Um (2010)", "teste:alfa", ano=2010),
        _f("film:obra-um", Predicado.DIRIGIDO_POR, "person:pessoa-real", "Directed By: Pessoa Real", "teste:obra"),
    ]:
        c.adicionar_fato(f)
    return c


@pytest.fixture
def componentes(corpus_sintetico, tmp_path):
    from freya.conhecimento.ingestao import ingerir

    def fabricar(modelo=None):
        comp = montar(Config(_env_file=None, freya_db_path=str(tmp_path / "t.db")), "memoria", embedder=EmbedderHash(), modelo=modelo,
                      repo=Repositorio(":memory:"))
        if modelo is None:
            comp.orquestrador.motor.modelo = None
            comp.modelo = None
        ingerir(corpus_sintetico, comp.hibrido, comp.grafo)
        return comp

    return fabricar
