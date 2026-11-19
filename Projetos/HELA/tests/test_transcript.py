"""Tokens do provedor lidos do transcript: deduplicados por message.id, com cursor (referência, seção 4)."""

from __future__ import annotations

import json
from pathlib import Path

from hela.integration.transcript import collect_usage, sum_usage, transcript_files


def _assistant(mid: str, inp: int, out: int, cr: int = 0, cc: int = 0, think: int = 0, **extra) -> dict:
    return {"type": "assistant", "uuid": mid + "-u", "message": {
        "id": mid, "role": "assistant", "content": [{"type": "text", "text": "SEGREDO-NAO-LER"}],
        "usage": {"input_tokens": inp, "output_tokens": out, "cache_read_input_tokens": cr,
                  "cache_creation_input_tokens": cc, "output_tokens_details": {"thinking_tokens": think}}}, **extra}


def _gravar(caminho: Path, linhas: list[dict], parcial: str = "") -> None:
    with open(caminho, "a", encoding="utf-8") as f:
        for linha in linhas:
            f.write(json.dumps(linha) + "\n")
        f.write(parcial)


def test_mesma_resposta_em_varias_linhas_conta_uma_vez(tmp_path):
    t = tmp_path / "s.jsonl"
    _gravar(t, [{"type": "user", "message": {"content": "oi"}},
                _assistant("m1", 10, 5, 100, 7), _assistant("m1", 10, 5, 100, 7),  # 2 blocos da mesma resposta
                _assistant("m2", 1, 2, think=3), {"type": "system"}, "não é objeto", {"type": "assistant"},
                _assistant("m3", 99, 99, isApiErrorMessage=True)])
    total, n, offset, recentes = sum_usage(t, 0, [])
    assert total == {"input": 11, "output": 7, "cache_read": 100, "cache_creation": 7, "thinking": 3}
    assert n == 2 and offset == t.stat().st_size and recentes[-2:] == ["m1", "m2"]


def test_linha_pela_metade_fica_para_depois_e_cursor_nao_conta_de_novo(tmp_path):
    t = tmp_path / "s.jsonl"
    _gravar(t, [_assistant("m1", 1, 1)], parcial=json.dumps(_assistant("m2", 5, 5))[:30])
    total, n, offset, recentes = sum_usage(t, 0, [])
    assert n == 1 and total["input"] == 1 and offset < t.stat().st_size
    # o resto da linha chega; a mesma resposta m1 aparece de novo depois do offset
    with open(t, "a", encoding="utf-8") as f:
        f.write(json.dumps(_assistant("m2", 5, 5))[30:] + "\n")
    _gravar(t, [_assistant("m1", 1, 1)])
    total, n, offset2, _ = sum_usage(t, offset, recentes)
    assert n == 1 and total["input"] == 5 and offset2 == t.stat().st_size


def test_arquivo_trocado_recomeca_do_zero(tmp_path):
    t = tmp_path / "s.jsonl"
    _gravar(t, [_assistant("m9", 3, 3)])
    total, n, _, _ = sum_usage(t, 10_000, ["m1"])
    assert n == 1 and total["input"] == 3


def test_arquivos_da_sessao_incluem_subagentes(tmp_path):
    t = tmp_path / "abc.jsonl"
    t.write_text("")
    sub = tmp_path / "abc" / "subagents"
    sub.mkdir(parents=True)
    (sub / "agent-1.jsonl").write_text("")
    (sub / "outro.txt").write_text("")
    assert transcript_files(str(t)) == [t, sub / "agent-1.jsonl"]
    assert transcript_files(str(tmp_path / "nao-existe.jsonl")) == []
    assert transcript_files(str(tmp_path / "abc.txt")) == []  # só .jsonl
    assert transcript_files(None) == []


def test_collect_usa_e_avanca_os_cursores_do_banco(tmp_path):
    from hela.storage.db import Database

    db = Database(tmp_path / "h.db")
    t = tmp_path / "abc.jsonl"
    _gravar(t, [_assistant("m1", 10, 1)])
    sub = tmp_path / "abc" / "subagents"
    sub.mkdir(parents=True)
    _gravar(sub / "agent-x.jsonl", [_assistant("s1", 7, 1)])
    total, n, cursores = collect_usage(db.conn, str(t), "sessao")
    assert total["input"] == 17 and n == 2 and len(cursores) == 2
    for c in cursores:
        c.save(db.conn)
    _gravar(t, [_assistant("m2", 1, 1)])
    total, n, _ = collect_usage(db.conn, str(t), "sessao")
    assert total["input"] == 1 and n == 1
