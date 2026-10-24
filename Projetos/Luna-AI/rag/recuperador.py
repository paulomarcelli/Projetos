"""Recuperação: escolhe quais trechos da biblioteca vão para o modelo.

Fluxo de uma busca (especificação, §3.4–3.6):

1. FILTRO antes de tudo: só trechos com escopo "conversa" (capítulos de domínio
   humano). O modelo nunca decide o que pode ver.
2. PONTUAÇÃO: BM25 sempre; se a busca densa estiver ligada, funde por RRF.
3. SUFICIÊNCIA: se o melhor trecho não tiver evidência lexical mínima (nota e
   número de termos distintos da consulta encontrados), a busca ABSTÉM: nenhum
   trecho é enviado e a conversa segue só com a personalidade. É melhor não
   trazer nada do que trazer algo que só "parece" relacionado.
4. DIVERSIDADE e ORÇAMENTO: no máximo 2 trechos do mesmo capítulo e um teto de
   caracteres somados, para não lotar o contexto do modelo.
"""

import logging
from dataclasses import dataclass, field

from .consulta import montar_consulta
from .indice import IndiceBM25, IndiceDenso, fundir_rrf

log = logging.getLogger("luna.rag")


@dataclass
class Resultado:
    status: str                         # "suficiente" | "insuficiente"
    trechos: list = field(default_factory=list)
    consulta: object = None             # rag.consulta.Consulta (original preservada)
    motivo: str = ""                    # por que absteve, quando absteve


class Recuperador:
    def __init__(self, biblioteca, top_k=3, max_caracteres=3600, nota_minima=4.0,
                 termos_minimos=2, por_documento=2, embedder=None, cache_embeddings=None):
        self.biblioteca = biblioteca
        self.trechos = biblioteca.trechos
        self.top_k, self.max_caracteres = top_k, max_caracteres
        self.nota_minima, self.termos_minimos = nota_minima, termos_minimos
        self.por_documento = por_documento
        # Filtro de escopo calculado uma vez: índices dos trechos que podem ir à conversa.
        self.permitidos = [i for i, t in enumerate(self.trechos) if t.escopo == "conversa"]
        self.bm25 = IndiceBM25([t.termos for t in self.trechos])
        self.denso = None
        if embedder is not None:
            try:
                self.denso = IndiceDenso([t.texto for t in self.trechos], embedder, cache_embeddings)
            except Exception as erro:  # rede, cota, chave: cai para o lexical, sem derrubar o app
                log.warning("RAG: busca densa indisponível (%s); usando só BM25", erro.__class__.__name__)

    @property
    def modo(self):
        return "hibrido" if self.denso else "lexical"

    def buscar(self, mensagem, anteriores=()):
        consulta = montar_consulta(mensagem, list(anteriores))
        if not consulta.termos:
            return Resultado("insuficiente", consulta=consulta, motivo="sem_termos")

        lexical = self.bm25.pontuar(consulta.termos, self.permitidos)
        if not lexical:
            return Resultado("insuficiente", consulta=consulta, motivo="sem_correspondencia")
        melhor_nota = lexical[0][1]
        # Evidência mínima: pontuação e quantidade de termos distintos em comum.
        com_evidencia = {i for i, nota, achados in lexical
                         if nota >= self.nota_minima and achados >= self.termos_minimos}
        if not com_evidencia:
            return Resultado("insuficiente", consulta=consulta, motivo="evidencia_fraca")

        ordem = [i for i, _, _ in lexical]
        if self.denso:
            try:
                densos = [i for i, _ in self.denso.buscar(mensagem, self.permitidos)[:20]]
                ordem = fundir_rrf(ordem[:20], densos)
            except Exception as erro:
                log.warning("RAG: falha na busca densa (%s); mantendo BM25", erro.__class__.__name__)

        # Corte relativo: trechos muito abaixo do melhor costumam ser ruído.
        notas = {i: nota for i, nota, _ in lexical}
        escolhidos, por_doc, total = [], {}, 0
        for i in ordem:
            if i not in com_evidencia or notas.get(i, 0) < 0.5 * melhor_nota:
                continue
            t = self.trechos[i]
            if por_doc.get(t.doc_id, 0) >= self.por_documento:
                continue
            if total + len(t.texto) > self.max_caracteres and escolhidos:
                continue
            escolhidos.append(t)
            por_doc[t.doc_id] = por_doc.get(t.doc_id, 0) + 1
            total += len(t.texto)
            if len(escolhidos) == self.top_k:
                break
        return Resultado("suficiente", trechos=escolhidos, consulta=consulta)
