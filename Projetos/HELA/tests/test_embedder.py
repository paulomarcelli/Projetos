"""Testes do embedder por feature hashing."""

from __future__ import annotations

import numpy as np
import pytest

from hela.memory.embedder import HashingEmbedder, from_blob, make_embedder, to_blob
from hela.memory.normalize import content_hash, normalize_text


def test_normalizacao_ignora_caixa_e_espacos() -> None:
    assert normalize_text("  Use   PYTEST\n-q ") == "use pytest -q"
    assert content_hash("Use pytest -q") == content_hash("use   pytest  -q\n")
    assert content_hash("use pytest -q") != content_hash("use pytest -x")


def test_vetores_tem_forma_tipo_e_norma() -> None:
    emb = HashingEmbedder()
    m = emb.embed(["renderizar no Blender", "rodar testes com pytest"])
    assert m.shape == (2, 512)
    assert m.dtype == np.float32
    assert np.allclose(np.linalg.norm(m, axis=1), 1.0, atol=1e-5)
    assert emb.name == "hashing-512-v1"


def test_vetores_sao_deterministicos_entre_instancias() -> None:
    a = HashingEmbedder().embed(["mesmo texto"])
    b = HashingEmbedder().embed(["mesmo texto"])
    assert np.array_equal(a, b)


def test_texto_vazio_vira_vetor_zero() -> None:
    v = HashingEmbedder().embed([""])[0]
    assert not v.any()


def test_similaridade_lexica_faz_sentido() -> None:
    emb = HashingEmbedder()
    base, perto, longe = emb.embed([
        "Para rodar os testes use pytest -q na pasta do projeto",
        "Para rodar os testes, use pytest -q na pasta do projeto.",
        "A renderização no Blender usa Cycles com 128 amostras",
    ])
    assert float(base @ perto) > 0.9
    assert float(base @ longe) < 0.4
    # Variação de forma (plural, flexão) ainda aproxima, pelos n-gramas de caracteres.
    a, b = emb.embed(["configurar o servidor", "configuração dos servidores"])
    assert float(a @ b) > float(base @ longe)


def test_blob_ida_e_volta() -> None:
    v = HashingEmbedder().embed(["abc"])[0]
    assert np.array_equal(from_blob(to_blob(v)), v)


def test_make_embedder_hashing_e_backend_invalido() -> None:
    assert isinstance(make_embedder("hashing", 512), HashingEmbedder)
    assert make_embedder("hashing", 256).dim == 256
    with pytest.raises(ValueError):
        make_embedder("magico", 512)
