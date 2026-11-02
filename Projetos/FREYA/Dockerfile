# API da F.R.E.Y.A. Na primeira subida, coleta marvel.com e indexa a base; depois só abre a API.
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 HF_HOME=/app/.cache/hf \
    FREYA_HOST=0.0.0.0 FREYA_DB_PATH=/app/data/estado/freya.db
WORKDIR /app

# torch só para CPU (o pacote padrão traz CUDA e passa de 3 GB)
RUN pip install torch==2.15.0 --index-url https://download.pytorch.org/whl/cpu
COPY pyproject.toml README.md ./
COPY src ./src
RUN pip install .
# modelo de embedding dentro da imagem: o servidor não depende de baixar nada para responder
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')"
ENV HF_HUB_OFFLINE=1

# corpora públicos (wiki do MCU, extração e Manus); marvel.com é coletado no servidor
# só as pastas graváveis ficam com o usuário da API (um chown -R duplicaria o modelo numa nova camada)
RUN useradd --create-home freya
COPY --chown=freya data/corpus ./data/corpus
RUN mkdir -p data/estado data/corpus/coletado data/raw && chown freya data data/estado data/corpus/coletado data/raw
USER freya
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30m \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/saude', timeout=4)"
CMD ["freya", "servir", "--preparar"]
