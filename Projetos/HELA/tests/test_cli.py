"""Testes da CLI mínima: status, export, import e avisos de fase."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

from hela.cli import main
from hela.core.engine import Engine


def test_status_mostra_o_estado(hela_home_temporario: Path, capsys: pytest.CaptureFixture[str]) -> None:
    with Engine() as eng:
        eng.remember(kind="semantic", content="nota")
    assert main(["status"]) == 0
    saida = capsys.readouterr().out
    assert str(hela_home_temporario) in saida and "semantic: 1" in saida and "wal" in saida
    assert main(["status", "--json"]) == 0
    assert json.loads(capsys.readouterr().out)["memories"]["total"] == 1


def test_export_e_import_pela_cli(hela_home_temporario: Path, tmp_path: Path,
                                  capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch) -> None:
    with Engine() as eng:
        eng.remember(kind="procedural", content="pytest -q")
    arquivo = tmp_path / "exp.json"
    assert main(["export", "--out", str(arquivo)]) == 0
    assert "1 memória" in capsys.readouterr().err
    assert main(["export"]) == 0
    assert json.loads(capsys.readouterr().out)["format"] == "hela-export"
    monkeypatch.setenv("HELA_HOME", str(tmp_path / "outra"))
    assert main(["import", str(arquivo)]) == 0
    assert "criadas: 1" in capsys.readouterr().out
    with Engine() as eng:
        assert eng.stats()["memories"]["total"] == 1


def test_erros_sao_claros(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["import", str(tmp_path / "nao-existe.json")]) == 1
    assert "não encontrado" in capsys.readouterr().err
    ruim = tmp_path / "ruim.json"
    ruim.write_text('{"format": "x"}', encoding="utf-8")
    assert main(["import", str(ruim)]) == 1
    assert "inválido" in capsys.readouterr().err


@pytest.mark.parametrize(("comando", "fase"), [("dashboard", "Fase 5"), ("doctor", "Fase 6"), ("procedure", "Fase 3")])
def test_comandos_de_outras_fases_avisam(comando: str, fase: str, capsys: pytest.CaptureFixture[str]) -> None:
    assert main([comando]) == 3
    assert fase in capsys.readouterr().err


def test_entrypoints_de_outras_fases(capsys: pytest.CaptureFixture[str]) -> None:
    from hela.api.server import main as api
    from hela.integration.hooks import main as hook
    from hela.integration.mcp_server import main as mcp

    assert mcp([]) == 3 and "Fase 4" in capsys.readouterr().err
    assert api([]) == 3 and "Fase 5" in capsys.readouterr().err
    assert hook(["SessionStart"]) == 0  # hooks são fail-open: nunca atrapalham o Claude Code
    capturado = capsys.readouterr()
    assert capturado.out == "" and "Fase 4" in capturado.err


def test_comando_hela_instalado_roda(hela_home_temporario: Path) -> None:
    script = Path(sys.executable).parent / "hela"
    if not script.exists():
        pytest.skip("pacote não instalado no venv")
    r = subprocess.run([str(script), "status"], capture_output=True, text=True, env=os.environ.copy(), timeout=60)
    assert r.returncode == 0, r.stderr
    assert str(hela_home_temporario) in r.stdout
    r = subprocess.run([sys.executable, "-m", "hela", "--version"], capture_output=True, text=True, timeout=60)
    assert r.returncode == 0 and "0.2.0" in r.stdout
