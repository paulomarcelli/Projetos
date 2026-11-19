"""Configuração leve do hook: mesmos padrões do HelaConfig, sem pydantic."""

from __future__ import annotations

import json

import pytest

from hela.core.config import HelaConfig, load_config
from hela.integration.light_config import DEFAULTS, load_light_config


def _subconjunto(completo: dict, modelo: dict) -> dict:
    return {k: (_subconjunto(completo[k], v) if isinstance(v, dict) else completo[k]) for k, v in modelo.items()}


def test_padroes_iguais_aos_do_helaconfig():
    completo = HelaConfig().model_dump(mode="json")
    assert DEFAULTS == _subconjunto(completo, DEFAULTS)


def test_secao_integration_tem_os_padroes_do_hook():
    cfg = HelaConfig()
    assert cfg.integration.enabled is True
    assert cfg.integration.hook_deadline_ms == 250
    assert 0 < cfg.integration.hook_busy_timeout_ms <= 200
    assert cfg.integration.web_taint_hours > 0


def test_arquivo_do_usuario_vale_igual_nos_dois(tmp_path):
    (tmp_path / "config.json").write_text(json.dumps({
        "router": {"min_relevance": 0.5}, "integration": {"enabled": False}, "search": {"weights": {"graph": 0}}}))
    leve = load_light_config(tmp_path)
    cheio = load_config(tmp_path)
    assert leve["router"]["min_relevance"] == cheio.router.min_relevance == 0.5
    assert leve["integration"]["enabled"] is cheio.integration.enabled is False
    assert leve["search"]["weights"]["graph"] == 0 and leve["search"]["weights"]["bm25"] == 1.0


def test_sem_arquivo_vale_o_padrao(tmp_path):
    assert load_light_config(tmp_path) == DEFAULTS


@pytest.mark.parametrize("texto", ["{ quebrado", "[1, 2]", json.dumps({"router": {"min_relevance": "alto"}}),
                                   json.dumps({"router": {"min_relevance": 7}})])
def test_arquivo_invalido_levanta_valueerror(tmp_path, texto):
    (tmp_path / "config.json").write_text(texto)
    with pytest.raises(ValueError):
        load_light_config(tmp_path)
