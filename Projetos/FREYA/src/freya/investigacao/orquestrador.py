"""Orquestração de uma investigação prospectiva.

Fluxo: pendente → recuperando (Hybrid RAG + GraphRAG) → analisando (motor) → validando → concluida.
Qualquer falha vira `falhou`, com a etapa e a mensagem; o que já foi recuperado fica registrado.
Cada etapa grava início, fim e um resumo, para o frontend acompanhar o andamento.
"""
from __future__ import annotations

import json
import logging
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path

from pydantic import BaseModel, Field

from freya.evidencias.registro import RegistroDeEvidencias
from freya.grafo_visual.montagem import ArestaVisual, GrafoDaInvestigacao, NoVisual, montar_grafo
from freya.graph.armazenamento import ArmazenamentoGrafo
from freya.graph.recuperador import RecuperadorGrafo
from freya.hybrid.recuperador import RecuperadorHibrido
from freya.llm.cliente import ErroDoModelo
from freya.conhecimento.ontologia import ROTULOS_PT, SIMETRICOS, Predicado
from freya.prospectivo.modelos import AnaliseProspectiva
from freya.prospectivo.motor import MotorProspectivo

log = logging.getLogger(__name__)


def agora() -> datetime:
    return datetime.now(timezone.utc)


class Estado(str, Enum):
    PENDENTE = "pendente"
    RECUPERANDO = "recuperando"
    ANALISANDO = "analisando"
    VALIDANDO = "validando"
    CONCLUIDA = "concluida"
    FALHOU = "falhou"


class Etapa(BaseModel):
    nome: str
    inicio: datetime
    fim: datetime | None = None
    resumo: dict = Field(default_factory=dict)


class Investigacao(BaseModel):
    id: str
    questao: str
    horizonte: str | None = None
    estado: Estado = Estado.PENDENTE
    etapas: list[Etapa] = Field(default_factory=list)
    erro: str | None = None
    analise: AnaliseProspectiva | None = None
    grafo: GrafoDaInvestigacao | None = None
    registro: RegistroDeEvidencias = Field(default_factory=RegistroDeEvidencias)
    criada_em: datetime = Field(default_factory=agora)
    atualizada_em: datetime = Field(default_factory=agora)


EM_ANDAMENTO = frozenset({Estado.PENDENTE, Estado.RECUPERANDO, Estado.ANALISANDO, Estado.VALIDANDO})


class ResumoDeInvestigacao(BaseModel):
    """Item do histórico: o bastante para listar sem abrir a análise inteira."""
    id: str
    questao: str
    horizonte: str | None = None
    estado: Estado
    erro: str | None = None
    guardada: bool = False
    cenarios: int = 0
    criada_em: datetime
    atualizada_em: datetime


def _iso(d: datetime) -> str:
    """Instante em UTC com microssegundos fixos, para a ordem textual ser a ordem do tempo."""
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return d.astimezone(timezone.utc).isoformat(timespec="microseconds")


# colunas de resumo acrescentadas ao esquema original (id, dados, atualizada_em)
_COLUNAS_DE_RESUMO = {"questao": "TEXT", "horizonte": "TEXT", "estado": "TEXT", "erro": "TEXT",
                      "cenarios": "INTEGER NOT NULL DEFAULT 0", "criada_em": "TEXT", "guardada": "INTEGER NOT NULL DEFAULT 0"}
_SELECAO_DO_RESUMO = "id, questao, horizonte, estado, erro, guardada, cenarios, criada_em, atualizada_em"


class Repositorio:
    """Investigações em SQLite: um documento JSON por investigação, mais colunas de resumo para o histórico.

    `guardada` só existe na tabela (não no documento): salvar a investigação nunca a desfaz.
    Bancos antigos, sem as colunas de resumo, são migrados ao abrir (ALTER TABLE e preenchimento a partir do JSON).
    """

    def __init__(self, caminho: str):
        if caminho != ":memory:":
            Path(caminho).parent.mkdir(parents=True, exist_ok=True)
        self._con = sqlite3.connect(caminho, check_same_thread=False)
        self._trava = threading.Lock()
        with self._trava:
            self._con.execute("CREATE TABLE IF NOT EXISTS investigacoes (id TEXT PRIMARY KEY, dados TEXT NOT NULL, atualizada_em TEXT NOT NULL)")
            self._migrar()
            self._con.commit()

    def _migrar(self) -> None:
        existentes = {r[1] for r in self._con.execute("PRAGMA table_info(investigacoes)")}
        for nome, tipo in _COLUNAS_DE_RESUMO.items():
            if nome not in existentes:
                self._con.execute(f"ALTER TABLE investigacoes ADD COLUMN {nome} {tipo}")
        pendentes = self._con.execute("SELECT id, dados FROM investigacoes WHERE questao IS NULL OR criada_em IS NULL OR estado IS NULL").fetchall()
        for iid, dados in pendentes:  # uma vez só, ao migrar: lê o JSON para preencher o resumo
            inv = Investigacao.model_validate_json(dados)
            self._con.execute("UPDATE investigacoes SET questao = ?, horizonte = ?, estado = ?, erro = ?, cenarios = ?, criada_em = ? WHERE id = ?",
                              (*self._resumo_de(inv)[:5], _iso(inv.criada_em), iid))
        self._con.execute("CREATE INDEX IF NOT EXISTS investigacoes_criada_em ON investigacoes (criada_em DESC)")
        self._con.execute("CREATE INDEX IF NOT EXISTS investigacoes_guardada ON investigacoes (guardada, criada_em DESC)")

    @staticmethod
    def _resumo_de(inv: Investigacao) -> tuple:
        return (inv.questao, inv.horizonte, inv.estado.value, inv.erro, len(inv.analise.cenarios) if inv.analise else 0)

    def salvar(self, inv: Investigacao) -> None:
        inv.atualizada_em = agora()
        with self._trava:
            self._con.execute(
                "INSERT INTO investigacoes (id, dados, atualizada_em, questao, horizonte, estado, erro, cenarios, criada_em) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET dados = excluded.dados, atualizada_em = excluded.atualizada_em, "
                "questao = excluded.questao, horizonte = excluded.horizonte, estado = excluded.estado, erro = excluded.erro, "
                "cenarios = excluded.cenarios, criada_em = excluded.criada_em",
                (inv.id, inv.model_dump_json(), _iso(inv.atualizada_em), *self._resumo_de(inv), _iso(inv.criada_em)))
            self._con.commit()

    def obter(self, iid: str) -> Investigacao | None:
        with self._trava:
            row = self._con.execute("SELECT dados FROM investigacoes WHERE id = ?", (iid,)).fetchone()
        return Investigacao.model_validate_json(row[0]) if row else None

    def resumo(self, iid: str) -> ResumoDeInvestigacao | None:
        with self._trava:
            row = self._con.execute(f"SELECT {_SELECAO_DO_RESUMO} FROM investigacoes WHERE id = ?", (iid,)).fetchone()
        return self._linha(row) if row else None

    def listar(self, guardadas: bool | None = None, limite: int = 100) -> list[ResumoDeInvestigacao]:
        """Mais recentes primeiro. `guardadas` True/False filtra; None traz todas."""
        limite = max(1, min(int(limite), 1000))
        filtro, params = ("WHERE guardada = ?", (int(guardadas),)) if guardadas is not None else ("", ())
        with self._trava:
            rows = self._con.execute(f"SELECT {_SELECAO_DO_RESUMO} FROM investigacoes {filtro} ORDER BY criada_em DESC, id DESC LIMIT ?",
                                     (*params, limite)).fetchall()
        return [self._linha(r) for r in rows]

    @staticmethod
    def _linha(r) -> ResumoDeInvestigacao:
        return ResumoDeInvestigacao(id=r[0], questao=r[1], horizonte=r[2], estado=Estado(r[3]), erro=r[4], guardada=bool(r[5]), cenarios=r[6] or 0,
                                    criada_em=datetime.fromisoformat(r[7]), atualizada_em=datetime.fromisoformat(r[8]))

    def remover(self, iid: str) -> bool:
        with self._trava:
            n = self._con.execute("DELETE FROM investigacoes WHERE id = ?", (iid,)).rowcount
            self._con.commit()
        return n > 0

    def marcar_guardada(self, iid: str, valor: bool) -> bool:
        with self._trava:
            n = self._con.execute("UPDATE investigacoes SET guardada = ? WHERE id = ?", (int(valor), iid)).rowcount
            self._con.commit()
        return n > 0


class Orquestrador:
    def __init__(self, hibrido: RecuperadorHibrido, grafo: ArmazenamentoGrafo, motor: MotorProspectivo, repo: Repositorio):
        self.hibrido, self.grafo, self.motor, self.repo = hibrido, grafo, motor, repo
        self.rec_grafo = RecuperadorGrafo(grafo)

    def criar(self, questao: str, horizonte: str | None = None) -> Investigacao:
        q = " ".join(questao.split())
        if len(q) < 8:
            raise ValueError("A questão de investigação é curta demais.")
        if len(q) > 600:
            raise ValueError("A questão de investigação passa de 600 caracteres.")
        inv = Investigacao(id=uuid.uuid4().hex[:12], questao=q, horizonte=horizonte)
        self.repo.salvar(inv)
        return inv

    def _etapa(self, inv: Investigacao, nome: str, estado: Estado) -> Etapa:
        inv.estado = estado
        e = Etapa(nome=nome, inicio=agora())
        inv.etapas.append(e)
        self.repo.salvar(inv)
        return e

    def executar(self, iid: str) -> Investigacao:
        inv = self.repo.obter(iid)
        if inv is None:
            raise KeyError(iid)
        try:
            e = self._etapa(inv, "recuperacao", Estado.RECUPERANDO)
            hib = self.hibrido.buscar(inv.questao, k=8)
            extras = [r.chunk.entidade for r in hib[:3] if r.chunk.entidade]
            gr = self.rec_grafo.buscar(inv.questao, extras=extras)
            e.fim, e.resumo = agora(), {"trechos": len(hib), "entidades_focais": [n.chave for n in gr.entidades], "nos": len(gr.subgrafo.nos),
                                        "arestas": len(gr.subgrafo.arestas), "caminhos": len(gr.caminhos), "sem_caminho": len(gr.sem_caminho)}

            e = self._etapa(inv, "analise", Estado.ANALISANDO)
            analise, dossie = self.motor.analisar(inv.questao, inv.horizonte, hib, gr)
            e.fim, e.resumo = agora(), {"modo": analise.modo, "modelo": analise.modelo, "evidencias": len(dossie.registro.itens),
                                        "cenarios": len(analise.cenarios)}

            e = self._etapa(inv, "validacao_e_grafo", Estado.VALIDANDO)
            inv.analise = analise
            inv.grafo = montar_grafo(gr, dossie, analise)
            inv.registro = dossie.registro
            v = analise.validacao
            e.fim, e.resumo = agora(), {"rebaixadas": len(v.rebaixadas), "removidas": len(v.removidas), "citacoes_invalidas": len(v.citacoes_invalidas),
                                        "entidades_desconhecidas": len(v.entidades_desconhecidas)}
            inv.estado = Estado.CONCLUIDA
        except ErroDoModelo as ex:
            self._falhou(inv, f"modelo de linguagem: {ex}")
        except Exception as ex:  # nunca deixa a investigação presa num estado intermediário
            log.exception("investigação %s falhou", iid)
            self._falhou(inv, f"{type(ex).__name__}: {ex}")
        self.repo.salvar(inv)
        return inv

    def _falhou(self, inv: Investigacao, msg: str) -> None:
        inv.estado, inv.erro = Estado.FALHOU, msg
        if inv.etapas and inv.etapas[-1].fim is None:
            inv.etapas[-1].fim = agora()

    # ---------------------------------------------------------------- exploração do grafo
    def _visual(self, inv: Investigacao, arestas) -> list[ArestaVisual]:
        saida = []
        for a in arestas:
            eid = inv.registro.id_da_aresta(a.id) or inv.registro.de_aresta(a)
            pred = Predicado(a.predicado) if a.predicado in Predicado._value2member_map_ else None
            saida.append(ArestaVisual(id=a.id, origem=a.origem, destino=a.destino, predicado=a.predicado,
                                      rotulo=ROTULOS_PT.get(pred, a.predicado.lower()) if pred else a.predicado.lower(),
                                      dirigida=pred not in SIMETRICOS if pred else True, peso=0.5, evidencias=[eid], ordem=a.ordem, ano=a.ano))
        return saida

    def expandir(self, iid: str, no: str, limite: int = 25, incluir_catalogo: bool = False) -> dict:
        inv = self.repo.obter(iid)
        if inv is None:
            raise KeyError(iid)
        if not self.grafo.no(no):
            raise LookupError(no)
        sg = self.grafo.vizinhanca([no], profundidade=1, limite=limite, incluir_catalogo=incluir_catalogo)
        existentes = {n.id for n in inv.grafo.nos} if inv.grafo else set()
        nos = [NoVisual(id=n.chave, rotulo=n.nome, tipo=n.tipo, papel="expansao", relevancia=0.3, grau=0, descricao=n.descricao,
                        atributos=n.atributos) for n in sg.nos.values() if n.chave not in existentes]
        arestas = self._visual(inv, sg.arestas.values())
        self.repo.salvar(inv)
        return {"no": no, "nos": [n.model_dump() for n in nos], "arestas": [a.model_dump() for a in arestas],
                "evidencias": {e: inv.registro.itens[e].model_dump() for a in arestas for e in a.evidencias}}

    def caminho(self, iid: str, de: str, para: str, max_saltos: int = 4) -> dict:
        inv = self.repo.obter(iid)
        if inv is None:
            raise KeyError(iid)
        for ch in (de, para):
            if not self.grafo.no(ch):
                raise LookupError(ch)
        cs = self.grafo.caminhos(de, para, max_saltos=max_saltos, limite=5)
        saida = []
        for i, c in enumerate(cs, 1):
            ars = self._visual(inv, c.arestas)
            saida.append({"id": f"X{i}", "nos": c.nos, "arestas": [a.model_dump() for a in ars]})
        self.repo.salvar(inv)
        return {"de": de, "para": para, "caminhos": saida, "existe": bool(saida),
                "evidencias": {e: inv.registro.itens[e].model_dump() for c in saida for a in c["arestas"] for e in a["evidencias"]}}


def json_resumo(inv: Investigacao) -> str:
    return json.dumps({"id": inv.id, "estado": inv.estado.value, "erro": inv.erro}, ensure_ascii=False)
