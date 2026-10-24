"""RAG da LUNA MIND: busca na biblioteca de pesquisa (pasta conhecimento/).

CONTRATO com luna.py (o único módulo que usa este pacote):

    rag.buscar(mensagem, anteriores) -> Resultado | None
        None quando o RAG está desligado ou indisponível (o chat segue normal).
    rag.montar_bloco(trechos) -> str
        Texto a anexar às instruções de sistema ("" se não houver trechos).
    rag.descrever(trecho) -> dict
        Metadados públicos de uma fonte para mostrar na interface.
    rag.status() -> dict
        Estado para a rota /status (sem conteúdo de conversa).

Configuração por variáveis de ambiente (ver .env.example):
    LUNA_RAG=0                 desliga o RAG
    LUNA_RAG_DIR               pasta da biblioteca (padrão: ./conhecimento)
    LUNA_RAG_TOP_K             trechos por resposta (padrão 3)
    LUNA_RAG_MAX_CARACTERES    teto de caracteres somados (padrão 3600)
    LUNA_RAG_DENSO=1           liga a busca híbrida (precisa de GEMINI_API_KEY)
    LUNA_EMBEDDING_MODELO      modelo de embeddings (padrão gemini-embedding-001)

A biblioteca é carregada uma única vez, na primeira busca (carga preguiçosa),
e reaproveitada por todas as requisições.
"""

import logging
import os
import threading
from pathlib import Path

from .ingestao import carregar_biblioteca
from .indice import embedder_gemini
from .prompt import montar_bloco
from .recuperador import Recuperador, Resultado

__all__ = ["buscar", "montar_bloco", "descrever", "status", "Resultado"]

log = logging.getLogger("luna.rag")
PASTA_PADRAO = Path(__file__).resolve().parent.parent / "conhecimento"

_recuperador = None
_erro_carga = None
_trava = threading.Lock()


def ativo():
    return os.environ.get("LUNA_RAG", "1") != "0"


def _carregar():
    """Cria o Recuperador uma vez (thread-safe). Falhas viram _erro_carga, nunca exceção."""
    global _recuperador, _erro_carga
    with _trava:
        if _recuperador is not None or _erro_carga is not None:
            return _recuperador
        try:
            pasta = Path(os.environ.get("LUNA_RAG_DIR") or PASTA_PADRAO)
            biblioteca = carregar_biblioteca(pasta)
            if not biblioteca.trechos:
                raise RuntimeError("biblioteca vazia")
            embedder, cache = None, None
            if os.environ.get("LUNA_RAG_DENSO") == "1":
                if os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY"):
                    modelo = os.environ.get("LUNA_EMBEDDING_MODELO", "gemini-embedding-001")
                    embedder = embedder_gemini(modelo)
                    cache = pasta / ".cache" / f"embeddings-{modelo}.json"
                else:
                    log.warning("RAG: LUNA_RAG_DENSO=1 sem GEMINI_API_KEY; usando só BM25")
            _recuperador = Recuperador(
                biblioteca,
                top_k=int(os.environ.get("LUNA_RAG_TOP_K", 3)),
                max_caracteres=int(os.environ.get("LUNA_RAG_MAX_CARACTERES", 3600)),
                embedder=embedder,
                cache_embeddings=cache,
            )
            r = biblioteca.relatorio
            log.info("RAG pronto: %d documentos, %d trechos (%d para conversa), modo %s",
                     r["documentos"], r["trechos"], r["conversa"], _recuperador.modo)
        except Exception as erro:
            _erro_carga = erro.__class__.__name__
            log.warning("RAG indisponível (%s); o chat continua sem a biblioteca", _erro_carga)
        return _recuperador


def buscar(mensagem, anteriores=()):
    if not ativo():
        return None
    recuperador = _carregar()
    return recuperador.buscar(mensagem, anteriores) if recuperador else None


def descrever(trecho):
    """O que a interface pode mostrar sobre uma fonte usada (sem o texto inteiro)."""
    return {
        "id": trecho.id,
        "documento": trecho.documento,
        "secao": trecho.subsecao or trecho.secao,
        "arquivo": trecho.arquivo,
        "ancora": trecho.ancora,
    }


def status():
    if not ativo():
        return {"ativo": False}
    recuperador = _carregar()
    if not recuperador:
        return {"ativo": True, "pronto": False, "erro": _erro_carga}
    r = recuperador.biblioteca.relatorio
    return {
        "ativo": True,
        "pronto": True,
        "modo": recuperador.modo,
        "documentos": r["documentos"],
        "trechos": r["trechos"],
        "trechos_conversa": r["conversa"],
        "integridade_ok": not r["divergentes"] and not r["ausentes"],
        "divergentes": r["divergentes"],
        "ausentes": r["ausentes"],
    }


def _reiniciar_para_testes():
    """Esquece o recuperador carregado (os testes trocam a pasta via LUNA_RAG_DIR)."""
    global _recuperador, _erro_carga
    with _trava:
        _recuperador, _erro_carga = None, None
