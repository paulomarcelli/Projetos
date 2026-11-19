"""Cache dos vetores para o caminho leve do hook (revisão F3-A2).

Ler 10.000 vetores do SQLite a cada prompt custa caro (20 MB de BLOBs). O cache guarda a matriz num
.npy em HELA_HOME/cache/ e a abre com mmap: o sistema operacional só traz do disco as páginas usadas,
e um segundo processo reaproveita o cache de páginas do primeiro.

Validade:
- meta.vectors_version (migração 3) sobe por gatilho quando um vetor muda ou uma memória some:
  contador diferente do gravado no cache = reconstruir;
- inserções não sobem o contador: o cache guarda o maior rid que já contém e acrescenta só as linhas
  novas (rid maior). Com muitas linhas novas, regrava o arquivo;
- arquivo estragado, de outro modelo ou de outra dimensão = reconstruir.

O cache tem todos os vetores do modelo, de qualquer status: quem chama filtra os candidatos no
SQLite (status, projeto, tipo, validade). Gravação atômica (temporário + os.replace); se a pasta não
aceitar escrita, a matriz sai da memória e o hook segue (melhor esforço).
"""

from __future__ import annotations

import json
import os
import re
import sqlite3
import tempfile
from pathlib import Path
from typing import Optional

import numpy as np

REGRAVAR_A_PARTIR_DE = 256  # linhas novas acumuladas antes de regravar o arquivo


def _nome_seguro(modelo: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]", "_", modelo)[:80] or "modelo"


class VectorCache:
    def __init__(self, home: Path, model: str, dim: int) -> None:
        self.model = model
        self.dim = int(dim)
        self.dir = Path(home) / "cache"
        base = f"vectors-{_nome_seguro(model)}-{self.dim}"
        self.npy_path = self.dir / f"{base}.npy"
        self.meta_path = self.dir / f"{base}.json"
        self.last_action: Optional[str] = None  # "mmap", "append" ou "rebuild" (para testes e medição)

    # --- leitura -------------------------------------------------------------------------
    def load(self, conn: sqlite3.Connection) -> tuple[list[str], np.ndarray]:
        """(ids, matriz n × dim) de todos os vetores do modelo, na ordem do rid."""
        versao, maior = conn.execute(
            "SELECT (SELECT CAST(value AS INTEGER) FROM meta WHERE key = 'vectors_version'),"
            " (SELECT COALESCE(MAX(rid), 0) FROM memories)").fetchone()
        versao, maior = int(versao or 0), int(maior or 0)
        meta = self._ler_meta()
        if meta is not None and meta.get("version") == versao and meta.get("model") == self.model \
                and meta.get("dim") == self.dim and isinstance(meta.get("max_rid"), int) \
                and meta["max_rid"] <= maior and isinstance(meta.get("ids"), list):
            matriz = self._abrir(len(meta["ids"]))
            if matriz is not None:
                ids = list(meta["ids"])
                if meta["max_rid"] == maior:
                    self.last_action = "mmap"
                    return ids, matriz
                novos_rids, novos_ids, novos = self._linhas(conn, depois_de=meta["max_rid"])
                self.last_action = "append"
                if not novos_ids:
                    return ids, matriz
                ids += novos_ids
                matriz = np.vstack([np.asarray(matriz), novos])
                if len(novos_ids) >= REGRAVAR_A_PARTIR_DE:
                    self._gravar(ids, matriz, versao, max(novos_rids[-1], meta["max_rid"]))
                return ids, matriz
        rids, ids, matriz = self._linhas(conn, depois_de=None)
        self.last_action = "rebuild"
        self._gravar(ids, matriz, versao, rids[-1] if rids else 0)
        return ids, matriz

    def _linhas(self, conn: sqlite3.Connection, depois_de: Optional[int]) -> tuple[list[int], list[str], np.ndarray]:
        sql = "SELECT rid, id, embedding FROM memories WHERE embedding_model = ? AND embedding IS NOT NULL"
        args: list[object] = [self.model]
        if depois_de is not None:
            sql += " AND rid > ?"
            args.append(depois_de)
        rids: list[int] = []
        ids: list[str] = []
        blocos: list[bytes] = []
        tamanho = self.dim * 4
        for rid, mid, blob in conn.execute(sql + " ORDER BY rid", args):
            if blob is None or len(blob) != tamanho:
                continue  # vetor de outra dimensão: fica fora (o reembed resolve)
            rids.append(int(rid))
            ids.append(str(mid))
            blocos.append(bytes(blob))
        matriz = (np.frombuffer(b"".join(blocos), dtype=np.float32).reshape(len(ids), self.dim)
                  if ids else np.zeros((0, self.dim), dtype=np.float32))
        return rids, ids, matriz

    def _ler_meta(self) -> Optional[dict]:
        try:
            dados = json.loads(self.meta_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return None
        return dados if isinstance(dados, dict) else None

    def _abrir(self, linhas: int) -> Optional[np.ndarray]:
        try:
            matriz = np.load(self.npy_path, mmap_mode="r", allow_pickle=False)
        except (OSError, ValueError):
            return None
        if matriz.dtype != np.float32 or matriz.ndim != 2 or matriz.shape != (linhas, self.dim):
            return None  # .npy e .json de gerações diferentes (ou arquivo mexido): reconstruir
        return matriz

    # --- escrita -------------------------------------------------------------------------
    def _gravar(self, ids: list[str], matriz: np.ndarray, versao: int, max_rid: int) -> bool:
        """Melhor esforço: grava o .npy e depois o .json, cada um por temporário + os.replace."""
        try:
            self.dir.mkdir(parents=True, exist_ok=True)
            if os.name == "posix":
                os.chmod(self.dir, 0o700)
            self._substituir(self.npy_path, lambda f: np.save(f, np.ascontiguousarray(matriz, dtype=np.float32),
                                                               allow_pickle=False))
            meta = {"version": versao, "max_rid": max_rid, "model": self.model, "dim": self.dim, "ids": ids}
            texto = json.dumps(meta, separators=(",", ":")).encode("utf-8")
            self._substituir(self.meta_path, lambda f: f.write(texto))
            return True
        except (OSError, ValueError):
            return False

    def _substituir(self, destino: Path, escrever) -> None:
        fd, temporario = tempfile.mkstemp(dir=self.dir, prefix=destino.name + ".", suffix=".tmp")
        try:
            with os.fdopen(fd, "wb") as f:
                escrever(f)
            if os.name == "posix":
                os.chmod(temporario, 0o600)
            os.replace(temporario, destino)
        except BaseException:
            try:
                os.unlink(temporario)
            except OSError:
                pass
            raise
