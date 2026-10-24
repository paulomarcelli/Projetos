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
    # Limiares de similaridade (cosseno) do modelo gemini-embedding-001, calibrados com a
    # biblioteca real (tests/calibrar_busca_densa.py): frases sobre sofrimento ficaram entre
    # 0,656 e 0,705; frases sem relação (piada, receita, "oi") entre 0,552 e 0,656. Como a faixa
    # se toca na borda, a decisão combina os dois sinais (ver buscar). Outro modelo de embeddings
    # ou outro corpus exige recalibrar: use as variáveis LUNA_RAG_SIM_ALTA / LUNA_RAG_SIM_MEDIA.
    SIM_ALTA = 0.675
    SIM_MEDIA = 0.64

    def __init__(self, biblioteca, top_k=3, max_caracteres=3600, nota_minima=4.0,
                 termos_minimos=2, por_documento=2, embedder=None, cache_embeddings=None,
                 sim_alta=None, sim_media=None):
        self.biblioteca = biblioteca
        self.trechos = biblioteca.trechos
        self.top_k, self.max_caracteres = top_k, max_caracteres
        self.nota_minima, self.termos_minimos = nota_minima, termos_minimos
        self.por_documento = por_documento
        self.sim_alta = self.SIM_ALTA if sim_alta is None else sim_alta
        self.sim_media = self.SIM_MEDIA if sim_media is None else sim_media
        # Filtro de escopo calculado uma vez: índices dos trechos que podem ir à conversa.
        self.permitidos = [i for i, t in enumerate(self.trechos) if t.escopo == "conversa"]
        self.bm25 = IndiceBM25([t.termos for t in self.trechos])
        self.denso = None
        self.estado_denso = "desligado"      # desligado | preparando | pronto | indisponivel
        if embedder is not None:
            self.ativar_denso(embedder, cache_embeddings)

    def ativar_denso(self, embedder, cache_embeddings=None):
        """Monta o índice denso. Pode demorar (limites da API); por isso rag/__init__.py
        chama este método numa thread: enquanto prepara, as buscas usam só BM25."""
        self.estado_denso = "preparando"
        try:
            self.denso = IndiceDenso([t.texto for t in self.trechos], embedder, cache_embeddings)
            self.estado_denso = "pronto"
        except Exception as erro:  # rede, cota, chave: cai para o lexical, sem derrubar o app
            self.estado_denso = "indisponivel"
            log.warning("RAG: busca densa indisponível (%s); usando só BM25", erro.__class__.__name__)

    @property
    def modo(self):
        return "hibrido" if self.denso else "lexical"

    def buscar(self, mensagem, anteriores=()):
        consulta = montar_consulta(mensagem, list(anteriores))
        if not consulta.termos:
            return Resultado("insuficiente", consulta=consulta, motivo="sem_termos")

        lexical = self.bm25.pontuar(consulta.termos, self.permitidos)
        notas = {i: nota for i, nota, _ in lexical}
        achados = {i: n for i, _, n in lexical}
        melhor_nota = lexical[0][1] if lexical else 0.0
        # Evidência lexical forte: pontuação e quantidade de termos distintos em comum.
        lexico_ok = {i for i, nota, n in lexical if nota >= self.nota_minima and n >= self.termos_minimos}

        # Busca densa (se pronta). Uma falha aqui (rede, cota) só tira o sinal denso desta mensagem.
        sims = []
        if self.denso:
            try:
                sims = self.denso.buscar(mensagem, self.permitidos)[:20]
            except Exception as erro:
                log.warning("RAG: falha na busca densa (%s); usando só BM25", erro.__class__.__name__)
        denso_ok = set()
        if sims:
            topo = sims[0][1]
            vizinhos = [i for i, sim in sims[:10] if sim >= topo - 0.03]   # só os próximos do melhor
            if topo >= self.sim_alta:
                denso_ok = set(vizinhos)                                    # semântica forte: basta
            elif topo >= self.sim_media:
                denso_ok = {i for i in vizinhos if achados.get(i, 0) >= 1}  # faixa de borda: exige uma palavra em comum

        if not (lexico_ok or denso_ok):
            return Resultado("insuficiente", consulta=consulta,
                             motivo="sem_correspondencia" if not lexical and not sims else "evidencia_fraca")

        ordem = [i for i, _, _ in lexical]
        if sims:
            ordem = fundir_rrf(ordem[:20], [i for i, _ in sims])

        # Corte relativo: trechos muito abaixo do melhor costumam ser ruído.
        escolhidos, por_doc, total = [], {}, 0
        for i in ordem:
            passa_lexico = i in lexico_ok and notas.get(i, 0) >= 0.5 * melhor_nota
            if not (passa_lexico or i in denso_ok):
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
