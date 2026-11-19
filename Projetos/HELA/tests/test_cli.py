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
    assert main(["import", "--dry-run", str(arquivo)]) == 0
    assert "simulação" in capsys.readouterr().out
    with Engine() as eng:
        assert eng.stats()["memories"]["total"] == 0
    assert main(["import", "--trusted", str(arquivo)]) == 0
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


@pytest.mark.parametrize(("comando", "fase"), [("dashboard", "Fase 5"), ("doctor", "Fase 6")])
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


# --- Fase 3: procedimentos, classificador e evolução pela CLI ---------------------------

def _procedimento():  # type: ignore[no-untyped-def]
    from hela.core.engine import Engine

    with Engine() as eng:
        return eng.learn(kind="procedural", content="rodar testes",
                         procedure={"name": "testes", "script": "pytest -q"})["procedure"]


def test_cli_procedure_aprova_so_com_o_sha256(capsys: pytest.CaptureFixture[str]) -> None:
    from hela.execution.validator import script_sha256

    p = _procedimento()
    assert main(["procedure", "list"]) == 0 and p["id"] in capsys.readouterr().out
    assert main(["procedure", "show", p["id"]]) == 0 and "human_approval" in capsys.readouterr().out
    assert main(["procedure", "approve", p["id"], "--sha256", "0" * 64]) == 1
    assert "sha256" in capsys.readouterr().err
    assert main(["procedure", "approve", p["id"], "--sha256", script_sha256("pytest -q")]) == 0
    assert '"exec_class": "script"' in capsys.readouterr().out
    assert main(["procedure", "revoke", p["id"]]) == 0


def test_cli_classifier_e_evolution(capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["classifier", "status"]) == 0 and '"mode": "rules"' in capsys.readouterr().out
    assert main(["classifier", "train"]) == 0 and "insuficientes" in capsys.readouterr().out
    assert main(["evolution", "propose"]) == 0 and "skipped" in capsys.readouterr().out
    assert main(["evolution", "list"]) == 0
    assert main(["evolution", "apply", "999"]) == 1
