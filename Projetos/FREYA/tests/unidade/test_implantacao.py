"""Preparação no servidor: indexa na primeira vez, não repete sem mudança e reindexa quando um corpus muda."""
from types import SimpleNamespace

from freya.config import Config
from freya.graph.armazenamento import GrafoMemoria
from freya.hybrid.indices import EmbedderHash, IndiceLexicalMemoria, IndiceQdrant
from freya.hybrid.recuperador import RecuperadorHibrido
from freya.implantacao import preparar_base


class _Contavel:
    def __init__(self, interno, contar):
        self._i, self._contar = interno, contar

    def __getattr__(self, nome):
        return getattr(self._i, nome)

    def contar(self):
        return self._contar()


def test_preparar_base_e_idempotente(tmp_path, corpus_sintetico):
    corpus_sintetico.salvar(tmp_path / "coletado")
    cfg = Config(freya_db_path=str(tmp_path / "estado" / "freya.db"))
    lex = IndiceLexicalMemoria()
    hib = RecuperadorHibrido(EmbedderHash(), IndiceQdrant(":memory:"), _Contavel(lex, lambda: len(lex.chunks)))
    grafo = GrafoMemoria()
    comp = SimpleNamespace(hibrido=hib, grafo=_Contavel(grafo, lambda: grafo.g.number_of_nodes()))

    primeira = preparar_base(cfg, comp, tmp_path, coletar_se_faltar=False)
    assert primeira["acao"] == "indexada" and primeira["indexacao"]["hybrid"]["chunks"] > 0
    assert preparar_base(cfg, comp, tmp_path, coletar_se_faltar=False)["acao"] == "nenhuma"

    (tmp_path / "wiki").mkdir()
    corpus_sintetico.salvar(tmp_path / "wiki")  # corpus novo no repositório -> reindexa
    assert preparar_base(cfg, comp, tmp_path, coletar_se_faltar=False)["acao"] == "indexada"


def test_coleta_vazia_nao_grava_nem_indexa(tmp_path, monkeypatch):
    import pytest

    from freya.conhecimento.coleta import coletor
    from freya.conhecimento.corpus import Corpus
    from freya.implantacao import coletar_marvel

    class Bloqueado:  # marvel.com respondendo 403 a tudo
        def __init__(self, **_):
            pass

        def carregar_robots(self):
            pass

        def obras_da_cronologia(self):
            return []

        def perfis_do_sitemap(self):
            return []

        def coletar(self, *_a, **_k):
            return Corpus(), {}

    monkeypatch.setattr(coletor, "Coletor", Bloqueado)
    with pytest.raises(RuntimeError, match="nenhuma página"):
        coletar_marvel(Config(), tmp_path)
    assert not (tmp_path / "coletado").exists()
