"""Corpus da F.R.E.Y.A.: documentos, entidades e fatos em três arquivos JSONL por fonte.

    data/corpus/<fonte>/documentos.jsonl
    data/corpus/<fonte>/entidades.jsonl
    data/corpus/<fonte>/fatos.jsonl

Várias fontes (o corpus migrado da Manus, a coleta de marvel.com) são unidas em memória; a mesma
entidade vinda de fontes diferentes é fundida pela chave tipada, juntando apelidos, atributos e fontes.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

from freya.conhecimento.modelos import Continuidade, Documento, Entidade, Fato, TipoEvidencia
from freya.conhecimento.normalizacao import normalizar


@dataclass
class Corpus:
    documentos: dict[str, Documento] = field(default_factory=dict)
    entidades: dict[str, Entidade] = field(default_factory=dict)
    fatos: dict[str, Fato] = field(default_factory=dict)

    # ---------------------------------------------------------------- montagem
    def adicionar_documento(self, d: Documento) -> None:
        if d.continuidade != Continuidade.MCU:
            raise ValueError(f"{d.doc_id}: só a continuidade MCU é aceita (veio {d.continuidade})")
        self.documentos[d.doc_id] = d

    def adicionar_entidade(self, e: Entidade) -> Entidade:
        atual = self.entidades.get(e.chave)
        if atual is None:
            self.entidades[e.chave] = e.model_copy(deep=True)
            return self.entidades[e.chave]
        for a in [e.nome, *e.apelidos]:
            if normalizar(a) != normalizar(atual.nome) and normalizar(a) not in {normalizar(x) for x in atual.apelidos}:
                atual.apelidos.append(a)
        for k, v in e.atributos.items():
            if v is not None and atual.atributos.get(k) is None:
                atual.atributos[k] = v
        if e.descricao and not atual.descricao:
            atual.descricao = e.descricao
        atual.fontes = sorted(set(atual.fontes) | set(e.fontes))
        return atual

    def adicionar_fato(self, f: Fato) -> None:
        self.fatos.setdefault(f.id, f)

    def unir(self, outro: "Corpus") -> "Corpus":
        for d in outro.documentos.values():
            self.adicionar_documento(d)
        for e in outro.entidades.values():
            self.adicionar_entidade(e)
        for f in outro.fatos.values():
            self.adicionar_fato(f)
        return self

    # ---------------------------------------------------------------- validação
    def problemas(self) -> list[str]:
        """Fatos sem entidade, sem documento ou com evidência textual que não está no texto de origem."""
        erros = []
        for f in self.fatos.values():
            for ch in (f.sujeito, f.objeto):
                if ch not in self.entidades:
                    erros.append(f"{f.id}: entidade ausente {ch}")
            doc = self.documentos.get(f.doc_id)
            if doc is None:
                erros.append(f"{f.id}: documento ausente {f.doc_id}")
            elif f.tipo_evidencia == TipoEvidencia.TEXTO and normalizar(f.evidencia) not in normalizar(doc.texto):
                erros.append(f"{f.id}: evidência não está no texto do documento")
            if f.sujeito == f.objeto:
                erros.append(f"{f.id}: laço (sujeito = objeto)")
        return erros

    # ---------------------------------------------------------------- arquivos
    def salvar(self, pasta: str | Path) -> None:
        p = Path(pasta)
        p.mkdir(parents=True, exist_ok=True)
        for nome, itens in (("documentos", self.documentos), ("entidades", self.entidades), ("fatos", self.fatos)):
            with (p / f"{nome}.jsonl").open("w", encoding="utf-8") as fh:
                for item in sorted(itens.values(), key=lambda x: getattr(x, "doc_id", None) or getattr(x, "chave", None) or x.id):
                    fh.write(item.model_dump_json() + "\n")

    @classmethod
    def carregar(cls, pasta: str | Path) -> "Corpus":
        p = Path(pasta)
        c = cls()

        def linhas(nome):
            arq = p / f"{nome}.jsonl"
            return [json.loads(x) for x in arq.read_text(encoding="utf-8").splitlines() if x.strip()] if arq.exists() else []

        for x in linhas("documentos"):
            c.adicionar_documento(Documento.model_validate(x))
        for x in linhas("entidades"):
            c.adicionar_entidade(Entidade.model_validate(x))
        for x in linhas("fatos"):
            c.adicionar_fato(Fato.model_validate(x))
        return c

    @classmethod
    def carregar_varios(cls, pastas: list[str | Path]) -> "Corpus":
        total = cls()
        for pasta in pastas:
            if Path(pasta).exists():
                total.unir(cls.carregar(pasta))
        return total

    def resumo(self) -> dict:
        from collections import Counter

        return {
            "documentos": len(self.documentos),
            "entidades": len(self.entidades),
            "fatos": len(self.fatos),
            "tipos": dict(Counter(e.tipo.value for e in self.entidades.values()).most_common()),
            "predicados": dict(Counter(f.predicado.value for f in self.fatos.values()).most_common()),
        }
