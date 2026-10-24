"""Índices de busca: BM25 (lexical) e, opcionalmente, vetores densos.

* BM25 é o baseline obrigatório da especificação (§3.4): robusto, explicável,
  sem custo e sem depender de rede. É sempre usado.
* A busca densa (embeddings do Gemini) é OPCIONAL (`LUNA_RAG_DENSO=1`). Quando
  ligada, as duas listas são combinadas por Reciprocal Rank Fusion (RRF), que
  junta rankings sem precisar calibrar escalas de pontuação diferentes. Os vetores
  ficam em cache em disco, indexados pelo hash do texto, para não recalcular a
  cada reinício nem gastar cota à toa.
"""

import json
import logging
import math
import hashlib
from collections import Counter
from pathlib import Path

log = logging.getLogger("luna.rag")


class IndiceBM25:
    """BM25 clássico (Robertson/Sparck Jones) sobre listas de radicais."""

    def __init__(self, documentos_termos, k1=1.2, b=0.75):
        self.k1, self.b = k1, b
        self.freqs = [Counter(t) for t in documentos_termos]
        self.tamanhos = [len(t) for t in documentos_termos]
        self.media = (sum(self.tamanhos) / len(self.tamanhos)) if self.tamanhos else 0.0
        df = Counter()
        for f in self.freqs:
            df.update(f.keys())
        n = len(self.freqs)
        # IDF com +1 dentro do log: nunca fica negativo para termos muito comuns.
        self.idf = {t: math.log(1 + (n - d + 0.5) / (d + 0.5)) for t, d in df.items()}

    def pontuar(self, consulta, candidatos):
        """Pontua só os índices em `candidatos` (os filtros já foram aplicados antes)."""
        termos_consulta = set(consulta)
        saida = []
        for i in candidatos:
            f, tam = self.freqs[i], self.tamanhos[i]
            nota, achados = 0.0, 0
            for t in termos_consulta:
                tf = f.get(t)
                if not tf:
                    continue
                achados += 1
                nota += self.idf[t] * tf * (self.k1 + 1) / (tf + self.k1 * (1 - self.b + self.b * tam / (self.media or 1)))
            if nota > 0:
                saida.append((i, nota, achados))
        saida.sort(key=lambda x: x[1], reverse=True)
        return saida


def fundir_rrf(*rankings, k=60):
    """Reciprocal Rank Fusion: soma 1/(k + posição) de cada lista de índices."""
    notas = Counter()
    for ranking in rankings:
        for pos, i in enumerate(ranking):
            notas[i] += 1.0 / (k + pos + 1)
    return [i for i, _ in notas.most_common()]


class IndiceDenso:
    """Vetores de embeddings por trecho, com cache em disco.

    `embedder(textos, tipo)` é injetável: em produção usa o Gemini
    (`embedder_gemini`); nos testes, uma função falsa determinística.

    Os textos são enviados em LOTES PEQUENOS (`lote`) e o cache é gravado a cada lote.
    Motivo: no plano gratuito da API cada texto conta como uma requisição por minuto;
    se a indexação for interrompida (limite, queda de rede, reinício), o que já foi
    calculado não se perde e a próxima tentativa continua de onde parou.
    """

    def __init__(self, textos, embedder, cache_arquivo=None, lote=40):
        self.embedder = embedder
        self.cache_arquivo = Path(cache_arquivo) if cache_arquivo else None
        cache = self._ler_cache()
        chaves = [hashlib.sha256(t.encode("utf-8")).hexdigest()[:24] for t in textos]
        faltando = [i for i, c in enumerate(chaves) if c not in cache]
        for inicio in range(0, len(faltando), lote):
            indices = faltando[inicio:inicio + lote]
            novos = embedder([textos[i] for i in indices], "RETRIEVAL_DOCUMENT")
            for i, vetor in zip(indices, novos):
                cache[chaves[i]] = vetor
            self._gravar_cache(cache)            # progresso salvo a cada lote
            log.info("RAG: embeddings %d/%d", min(inicio + lote, len(faltando)), len(faltando))
        self.vetores = [_unitario(cache[c]) for c in chaves]

    def _ler_cache(self):
        if self.cache_arquivo and self.cache_arquivo.is_file():
            try:
                return json.loads(self.cache_arquivo.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                log.warning("RAG: cache de embeddings ilegível; será refeito")
        return {}

    def _gravar_cache(self, cache):
        if not self.cache_arquivo:
            return
        try:
            self.cache_arquivo.parent.mkdir(parents=True, exist_ok=True)
            temporario = self.cache_arquivo.with_suffix(".tmp")
            temporario.write_text(json.dumps(cache), encoding="utf-8")
            temporario.replace(self.cache_arquivo)    # troca atômica: nunca fica meio gravado
        except OSError:
            log.warning("RAG: não consegui gravar o cache de embeddings")

    def buscar(self, texto, candidatos):
        consulta = _unitario(self.embedder([texto], "RETRIEVAL_QUERY")[0])
        sims = [(i, sum(a * b for a, b in zip(consulta, self.vetores[i]))) for i in candidatos]
        sims.sort(key=lambda x: x[1], reverse=True)
        return sims


def _unitario(v):
    norma = math.sqrt(sum(x * x for x in v)) or 1.0
    return [x / norma for x in v]


def embedder_gemini(modelo, esperas=(65, 65, 65, 65)):
    """Cria a função de embeddings do Gemini (usa GEMINI_API_KEY do ambiente).

    Limite do plano gratuito: 100 textos por minuto (cada texto conta como uma
    requisição). Ao receber 429 (RESOURCE_EXHAUSTED), espera a janela de 1 minuto
    passar e tenta de novo; `esperas` define quantas tentativas extras e quanto
    esperar em cada uma. Se continuar falhando, a exceção sobe e o RAG segue só
    com BM25. Em plano pago o 429 não acontece e não há espera alguma.
    """
    import time

    from google import genai

    cliente = genai.Client()

    def embutir(textos, tipo):
        for tentativa in range(len(esperas) + 1):
            try:
                resposta = cliente.models.embed_content(
                    model=modelo, contents=textos, config={"task_type": tipo})
                return [list(e.values) for e in resposta.embeddings]
            except Exception as erro:
                if getattr(erro, "code", None) != 429 or tentativa == len(esperas):
                    raise
                log.info("RAG: limite de embeddings atingido; aguardando %ds", esperas[tentativa])
                time.sleep(esperas[tentativa])

    return embutir
