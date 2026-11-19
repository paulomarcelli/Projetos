"""Cache de vetores do hook: .npy aberto com mmap, invalidado pelo contador do banco (revisão F3-A2)."""

from __future__ import annotations

import numpy as np

from hela.core.engine import Engine
from hela.memory.vector_cache import VectorCache


def _cache(eng: Engine) -> VectorCache:
    return VectorCache(eng.home, eng.embedder.name, eng.embedder.dim)


def _ids_do_banco(eng: Engine) -> list[str]:
    return [r[0] for r in eng.db.conn.execute(
        "SELECT id FROM memories WHERE embedding IS NOT NULL ORDER BY rid")]


def test_primeira_leitura_monta_o_arquivo_e_a_segunda_usa_mmap(tmp_path):
    with Engine(home=tmp_path) as eng:
        for i in range(5):
            eng.remember(kind="semantic", content=f"memória número {i} sobre ffmpeg e gif {i * 7}")
        c = _cache(eng)
        ids, m = c.load(eng.db.conn)
        assert ids == _ids_do_banco(eng) and m.shape == (5, eng.embedder.dim)
        assert c.last_action == "rebuild" and c.npy_path.exists()
        ids2, m2 = _cache(eng).load(eng.db.conn)
        assert ids2 == ids and isinstance(m2, np.memmap)
        assert np.allclose(np.asarray(m2), np.asarray(m))


def test_insercao_acrescenta_sem_reconstruir(tmp_path):
    with Engine(home=tmp_path) as eng:
        eng.remember(kind="semantic", content="primeira memória sobre testes com pytest")
        _cache(eng).load(eng.db.conn)
        eng.remember(kind="semantic", content="segunda memória sobre o banco sqlite em wal")
        c = _cache(eng)
        ids, m = c.load(eng.db.conn)
        assert c.last_action == "append" and ids == _ids_do_banco(eng) and m.shape[0] == 2
        linha = eng.db.conn.execute("SELECT embedding FROM memories WHERE id = ?", (ids[1],)).fetchone()[0]
        assert np.allclose(m[1], np.frombuffer(linha, dtype=np.float32))


def test_edicao_e_exclusao_invalidam(tmp_path):
    with Engine(home=tmp_path) as eng:
        a = eng.remember(kind="semantic", content="memória sobre renderizar no blender").memory
        b = eng.remember(kind="semantic", content="memória sobre converter vídeo em gif").memory
        _cache(eng).load(eng.db.conn)
        eng.update(a.id, content="memória sobre renderizar no blender com cycles e gpu")
        c = _cache(eng)
        ids, m = c.load(eng.db.conn)
        assert c.last_action == "rebuild"
        novo = eng.db.conn.execute("SELECT embedding FROM memories WHERE id = ?", (a.id,)).fetchone()[0]
        assert np.allclose(m[ids.index(a.id)], np.frombuffer(novo, dtype=np.float32))
        eng.delete(b.id)
        c = _cache(eng)
        ids, _ = c.load(eng.db.conn)
        assert c.last_action == "rebuild" and b.id not in ids


def test_arquivo_estragado_ou_de_outro_modelo_e_refeito(tmp_path):
    with Engine(home=tmp_path) as eng:
        eng.remember(kind="semantic", content="memória sobre o git e rebase")
        c = _cache(eng)
        c.load(eng.db.conn)
        c.npy_path.write_bytes(b"lixo")
        c2 = _cache(eng)
        ids, m = c2.load(eng.db.conn)
        assert c2.last_action == "rebuild" and m.shape == (1, eng.embedder.dim)
        outro = VectorCache(eng.home, "outro-modelo", eng.embedder.dim)
        ids3, m3 = outro.load(eng.db.conn)
        assert ids3 == [] and m3.shape == (0, eng.embedder.dim)


def test_pasta_somente_leitura_nao_impede_a_leitura(tmp_path):
    with Engine(home=tmp_path) as eng:
        eng.remember(kind="semantic", content="memória sobre docker compose")
        c = VectorCache(tmp_path / "nao" / "existe" / "\0ruim", eng.embedder.name, eng.embedder.dim)
        ids, m = c.load(eng.db.conn)
        assert len(ids) == 1 and m.shape[0] == 1 and c.last_action == "rebuild"


def test_permissoes_privadas(tmp_path):
    import os
    import stat

    with Engine(home=tmp_path) as eng:
        eng.remember(kind="semantic", content="memória sobre permissões")
        c = _cache(eng)
        c.load(eng.db.conn)
        if os.name == "posix":
            assert stat.S_IMODE(c.npy_path.stat().st_mode) == 0o600
            assert stat.S_IMODE(c.npy_path.parent.stat().st_mode) == 0o700


def test_scores_iguais_com_e_sem_linhas_novas(tmp_path):
    with Engine(home=tmp_path) as eng:
        for i in range(4):
            eng.remember(kind="semantic", content=f"memória {i} sobre docker e testes {i * 3}")
        _cache(eng).load(eng.db.conn)
        eng.remember(kind="semantic", content="memória nova sobre docker compose")
        vetor = eng.embedder.embed(["docker compose"])[0]
        c = _cache(eng)
        ids, valores = c.scores(eng.db.conn, vetor)
        assert c.last_action == "append" and len(ids) == 5
        _, matriz = _cache(eng).load(eng.db.conn)
        assert np.allclose(valores, matriz @ vetor)
