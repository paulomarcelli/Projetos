"""Testes da configuração: padrões, arquivo do usuário e validação."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from hela.core.config import HelaConfig, load_config

RAIZ = Path(__file__).resolve().parents[1]


def test_config_json_do_repositorio_e_igual_aos_padroes() -> None:
    arquivo = json.loads((RAIZ / "config" / "config.json").read_text(encoding="utf-8"))
    assert arquivo == HelaConfig().model_dump(mode="json")


def test_sem_arquivo_vale_o_padrao(tmp_path: Path) -> None:
    cfg = load_config(tmp_path)
    assert cfg.embedder.backend == "hashing"
    assert cfg.embedder.dim == 512


def test_arquivo_do_usuario_sobrepoe_so_o_que_define(tmp_path: Path) -> None:
    (tmp_path / "config.json").write_text(json.dumps({"search": {"rrf_k": 30}}), encoding="utf-8")
    cfg = load_config(tmp_path)
    assert cfg.search.rrf_k == 30
    assert cfg.search.weights.bm25 == HelaConfig().search.weights.bm25


def test_arquivo_invalido_da_erro_claro(tmp_path: Path) -> None:
    (tmp_path / "config.json").write_text(json.dumps({"search": {"rrf_k": -1}}), encoding="utf-8")
    with pytest.raises(ValueError, match="config.json"):
        load_config(tmp_path)
    (tmp_path / "config.json").write_text("{ quebrado", encoding="utf-8")
    with pytest.raises(ValueError, match="config.json"):
        load_config(tmp_path)
