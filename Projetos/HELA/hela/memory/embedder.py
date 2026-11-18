"""Embedder plugável.

Padrão: feature hashing (o "hashing trick"). Cada n-grama do texto é espalhado por um
hash para uma de 512 posições de um vetor, com sinal +1/-1 (também pelo hash), e o vetor
é normalizado. Usamos:
- n-gramas de palavras de 1 e 2 (pegam termos e expressões);
- n-gramas de caracteres de 3 a 5 dentro de cada palavra (pegam flexões: "servidor" e
  "servidores" ficam próximos).
Os dois grupos são normalizados separadamente e somados com o mesmo peso.

Honestidade: isso é similaridade léxico-semântica (forma das palavras), não embedding
neural. "Carro" e "automóvel" não ficam próximos. Para isso existe o backend opcional
sentence-transformers, que não é dependência obrigatória.

O hash é blake2b (determinístico entre processos; o hash() do Python muda a cada execução).
"""

from __future__ import annotations

import hashlib
import math
import re
from collections import Counter
from typing import Protocol, Sequence

import numpy as np

from hela.memory.normalize import normalize_text

_PALAVRA = re.compile(r"\w+", re.UNICODE)


class Embedder(Protocol):
    """Interface de qualquer embedder: nome estável, dimensão e embed() em lote."""

    name: str
    dim: int

    def embed(self, texts: Sequence[str]) -> np.ndarray:  # (n, dim) float32, linhas com norma 1 ou 0
        ...


def _bucket(feature: str, dim: int) -> tuple[int, float]:
    h = int.from_bytes(hashlib.blake2b(feature.encode("utf-8"), digest_size=8).digest(), "little")
    return h % dim, (1.0 if (h >> 63) & 1 else -1.0)


def _normalizar_linha(v: np.ndarray) -> np.ndarray:
    n = float(np.linalg.norm(v))
    return v / n if n > 0 else v


class HashingEmbedder:
    """Feature hashing com n-gramas de palavras (1–2) e de caracteres (3–5)."""

    def __init__(self, dim: int = 512) -> None:
        if dim < 16:
            raise ValueError("dim precisa ser pelo menos 16")
        self.dim = dim
        self.name = f"hashing-{dim}-v1"

    def _features(self, text: str) -> tuple[Counter[str], Counter[str]]:
        palavras = _PALAVRA.findall(normalize_text(text))
        grupo_palavras: Counter[str] = Counter(f"w:{p}" for p in palavras)
        grupo_palavras.update(f"b:{a} {b}" for a, b in zip(palavras, palavras[1:]))
        grupo_chars: Counter[str] = Counter()
        for p in palavras:
            marcada = f"<{p}>"
            for n in (3, 4, 5):
                grupo_chars.update(f"c:{marcada[i:i + n]}" for i in range(len(marcada) - n + 1))
        return grupo_palavras, grupo_chars

    def _vetor(self, contagem: Counter[str]) -> np.ndarray:
        v = np.zeros(self.dim, dtype=np.float64)
        for feature, c in contagem.items():
            idx, sinal = _bucket(feature, self.dim)
            v[idx] += sinal * (1.0 + math.log(c))  # tf sublinear: repetição pesa menos
        return _normalizar_linha(v)

    def embed(self, texts: Sequence[str]) -> np.ndarray:
        saida = np.zeros((len(texts), self.dim), dtype=np.float32)
        for i, texto in enumerate(texts):
            palavras, chars = self._features(texto)
            saida[i] = _normalizar_linha(self._vetor(palavras) + self._vetor(chars)).astype(np.float32)
        return saida


class SentenceTransformerEmbedder:  # pragma: no cover - depende de pacote opcional
    """Embedding neural local, se o usuário instalar sentence-transformers (extra 'neural')."""

    def __init__(self, model: str) -> None:
        from sentence_transformers import SentenceTransformer

        self._model = SentenceTransformer(model)
        self.dim = int(self._model.get_sentence_embedding_dimension())
        self.name = f"st:{model}"

    def embed(self, texts: Sequence[str]) -> np.ndarray:
        m = self._model.encode(list(texts), normalize_embeddings=True, convert_to_numpy=True)
        return np.asarray(m, dtype=np.float32)


def _st_instalado() -> bool:
    import importlib.util

    return importlib.util.find_spec("sentence_transformers") is not None


def make_embedder(backend: str, dim: int = 512, model: str = "sentence-transformers/all-MiniLM-L6-v2") -> Embedder:
    """Escolhe o embedder pela configuração: 'hashing', 'sentence-transformers' ou 'auto'."""
    if backend == "hashing":
        return HashingEmbedder(dim)
    if backend == "sentence-transformers":
        if not _st_instalado():
            raise ValueError("backend 'sentence-transformers' pedido, mas o pacote não está instalado "
                             "(pip install 'hela[neural]')")
        return SentenceTransformerEmbedder(model)
    if backend == "auto":
        return SentenceTransformerEmbedder(model) if _st_instalado() else HashingEmbedder(dim)
    raise ValueError(f"backend de embedder desconhecido: {backend!r} (use hashing, sentence-transformers ou auto)")


def to_blob(vec: np.ndarray) -> bytes:
    return np.asarray(vec, dtype=np.float32).tobytes()


def from_blob(blob: bytes) -> np.ndarray:
    return np.frombuffer(blob, dtype=np.float32)
