"""Persistência em SQLite: simulações, eventos, cache, uso diário, contas, sessões e turmas."""
from __future__ import annotations

import hashlib
import json
import sqlite3
import threading
import time
from datetime import date
from pathlib import Path

from .modelos import Evento, Resultado, ResumoSimulacao

_ESQUEMA = """
CREATE TABLE IF NOT EXISTS simulacoes (
    id TEXT PRIMARY KEY, criada_em TEXT NOT NULL, status TEXT NOT NULL,
    caso_id TEXT NOT NULL, titulo TEXT NOT NULL, base_id TEXT, dados TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS eventos (
    sim_id TEXT NOT NULL, seq INTEGER NOT NULL, dados TEXT NOT NULL, PRIMARY KEY (sim_id, seq)
);
CREATE TABLE IF NOT EXISTS cache (chave TEXT PRIMARY KEY, valor TEXT NOT NULL, criado REAL NOT NULL);
CREATE TABLE IF NOT EXISTS uso_diario (
    dia TEXT PRIMARY KEY, simulacoes INTEGER DEFAULT 0, chamadas_llm INTEGER DEFAULT 0,
    tokens INTEGER DEFAULT 0, buscas INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY, nome TEXT NOT NULL, email TEXT NOT NULL UNIQUE, senha_hash TEXT NOT NULL,
    papel TEXT NOT NULL, criado_em TEXT NOT NULL, aceite_termos_em TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessoes (
    token_hash TEXT PRIMARY KEY, usuario_id TEXT NOT NULL, expira REAL NOT NULL, criada_em REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS turmas (
    id TEXT PRIMARY KEY, nome TEXT NOT NULL, codigo TEXT NOT NULL UNIQUE, professor_id TEXT NOT NULL,
    criada_em TEXT NOT NULL, cenario_caso_id TEXT, cenario_orientacao TEXT
);
CREATE TABLE IF NOT EXISTS membros (
    turma_id TEXT NOT NULL, usuario_id TEXT NOT NULL, entrou_em TEXT NOT NULL, PRIMARY KEY (turma_id, usuario_id)
);
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_membros_usuario ON membros(usuario_id);
"""

# colunas acrescentadas depois da v1 (migração automática de bancos antigos)
_COLUNAS_NOVAS = {"simulacoes": [("usuario_id", "TEXT"), ("turma_id", "TEXT")]}


class Banco:
    def __init__(self, caminho: Path | str):
        self.caminho = str(caminho)
        if self.caminho != ":memory:":
            Path(self.caminho).parent.mkdir(parents=True, exist_ok=True)
        self._con = sqlite3.connect(self.caminho, check_same_thread=False)
        self._con.row_factory = sqlite3.Row
        self._trava = threading.Lock()
        with self._trava:
            self._con.executescript(_ESQUEMA)
            for tabela, colunas in _COLUNAS_NOVAS.items():
                existentes = {l["name"] for l in self._con.execute(f"PRAGMA table_info({tabela})")}
                for nome, tipo in colunas:
                    if nome not in existentes:
                        self._con.execute(f"ALTER TABLE {tabela} ADD COLUMN {nome} {tipo}")
            self._con.execute("CREATE INDEX IF NOT EXISTS idx_sim_usuario ON simulacoes(usuario_id)")
            self._con.execute("CREATE INDEX IF NOT EXISTS idx_sim_turma ON simulacoes(turma_id)")
            self._con.commit()

    # ---------------- simulações
    def salvar(self, r: Resultado) -> None:
        with self._trava:
            self._con.execute(
                "INSERT INTO simulacoes (id, criada_em, status, caso_id, titulo, base_id, dados, usuario_id, turma_id) VALUES (?,?,?,?,?,?,?,?,?) "
                "ON CONFLICT(id) DO UPDATE SET status=excluded.status, dados=excluded.dados, usuario_id=excluded.usuario_id, turma_id=excluded.turma_id",
                (r.id, r.criada_em, r.status, r.caso.id, r.caso.titulo, r.entrada.base_id, r.model_dump_json(), r.usuario_id, r.turma_id),
            )
            self._con.commit()

    def obter(self, sim_id: str) -> Resultado | None:
        with self._trava:
            linha = self._con.execute("SELECT dados FROM simulacoes WHERE id=?", (sim_id,)).fetchone()
        return Resultado.model_validate_json(linha["dados"]) if linha else None

    def listar(self, limite: int = 50, usuario_id: str | None = None, turma_ids: list[str] | None = None, todos: bool = False) -> list[ResumoSimulacao]:
        """Sem filtro só com todos=True (admin). Senão: as do usuário e/ou as das turmas indicadas."""
        filtros, params = [], []
        if not todos:
            if usuario_id:
                filtros.append("s.usuario_id = ?"); params.append(usuario_id)
            if turma_ids:
                filtros.append(f"s.turma_id IN ({','.join('?' * len(turma_ids))})"); params += turma_ids
            if not filtros:
                return []
        onde = ("WHERE " + " OR ".join(filtros)) if filtros else ""
        with self._trava:
            linhas = self._con.execute(
                f"SELECT s.dados, u.nome AS autor FROM simulacoes s LEFT JOIN usuarios u ON u.id = s.usuario_id {onde} "
                "ORDER BY s.criada_em DESC, s.rowid DESC LIMIT ?", (*params, limite)).fetchall()
        saida = []
        for l in linhas:
            r = Resultado.model_validate_json(l["dados"])
            saida.append(ResumoSimulacao(id=r.id, criada_em=r.criada_em, status=r.status, caso_id=r.caso.id, titulo=r.caso.titulo, horizonte_meses=r.entrada.horizonte_meses, modo=r.modo, confianca=r.analise.confianca if r.analise else None, base_id=r.entrada.base_id, usuario_id=r.usuario_id, turma_id=r.turma_id, autor=l["autor"]))
        return saida

    def simulacoes_hoje(self, usuario_id: str) -> int:
        with self._trava:
            l = self._con.execute("SELECT COUNT(*) AS n FROM simulacoes WHERE usuario_id=? AND substr(criada_em,1,10)=?", (usuario_id, date.today().isoformat())).fetchone()
        return int(l["n"])

    def apagar_do_usuario(self, usuario_id: str) -> int:
        with self._trava:
            ids = [l["id"] for l in self._con.execute("SELECT id FROM simulacoes WHERE usuario_id=?", (usuario_id,))]
            for i in ids:
                self._con.execute("DELETE FROM eventos WHERE sim_id=?", (i,))
            self._con.execute("DELETE FROM simulacoes WHERE usuario_id=?", (usuario_id,))
            self._con.commit()
        return len(ids)

    def apagar(self, sim_id: str) -> bool:
        with self._trava:
            c = self._con.execute("DELETE FROM simulacoes WHERE id=?", (sim_id,))
            self._con.execute("DELETE FROM eventos WHERE sim_id=?", (sim_id,))
            self._con.commit()
            return c.rowcount > 0

    # ---------------- eventos
    def registrar_evento(self, sim_id: str, ev: Evento) -> None:
        with self._trava:
            self._con.execute("INSERT OR REPLACE INTO eventos (sim_id, seq, dados) VALUES (?,?,?)", (sim_id, ev.seq, ev.model_dump_json()))
            self._con.commit()

    def eventos(self, sim_id: str, desde: int = 0) -> list[Evento]:
        with self._trava:
            linhas = self._con.execute("SELECT dados FROM eventos WHERE sim_id=? AND seq>? ORDER BY seq", (sim_id, desde)).fetchall()
        return [Evento.model_validate_json(l["dados"]) for l in linhas]

    # ---------------- cache (pesquisa e respostas de IA idênticas)
    @staticmethod
    def chave(*partes: object) -> str:
        return hashlib.sha256(json.dumps(partes, sort_keys=True, ensure_ascii=False, default=str).encode()).hexdigest()

    def cache_ler(self, chave: str, validade_s: float) -> object | None:
        with self._trava:
            l = self._con.execute("SELECT valor, criado FROM cache WHERE chave=?", (chave,)).fetchone()
        if not l or time.time() - l["criado"] > validade_s:
            return None
        return json.loads(l["valor"])

    def cache_gravar(self, chave: str, valor: object) -> None:
        with self._trava:
            self._con.execute("INSERT OR REPLACE INTO cache (chave, valor, criado) VALUES (?,?,?)", (chave, json.dumps(valor, ensure_ascii=False), time.time()))
            self._con.commit()

    def cache_apagar(self, chave: str) -> None:
        with self._trava:
            self._con.execute("DELETE FROM cache WHERE chave=?", (chave,))
            self._con.commit()

    # ---------------- uso diário (protege cotas gratuitas)
    def uso_hoje(self) -> dict:
        dia = date.today().isoformat()
        with self._trava:
            l = self._con.execute("SELECT * FROM uso_diario WHERE dia=?", (dia,)).fetchone()
        return dict(l) if l else {"dia": dia, "simulacoes": 0, "chamadas_llm": 0, "tokens": 0, "buscas": 0}

    def somar_uso(self, **inc: int) -> None:
        dia = date.today().isoformat()
        with self._trava:
            self._con.execute("INSERT OR IGNORE INTO uso_diario (dia) VALUES (?)", (dia,))
            for campo, v in inc.items():
                if campo in {"simulacoes", "chamadas_llm", "tokens", "buscas"} and v:
                    self._con.execute(f"UPDATE uso_diario SET {campo} = {campo} + ? WHERE dia=?", (int(v), dia))
            self._con.commit()
