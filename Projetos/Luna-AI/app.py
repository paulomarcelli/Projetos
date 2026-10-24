"""Servidor da LUNA MIND (Flask).

Rodar:  python app.py   e abrir http://127.0.0.1:5000

Privacidade: o servidor não guarda nada. O histórico e a memória ficam no
navegador da pessoa e chegam aqui só para gerar cada resposta. Os logs registram
apenas a rota e o código de status, nunca o texto das mensagens.
"""

import logging
import os
import re

from flask import Flask, jsonify, request

import luna
import rag

app = Flask(__name__, static_folder="web", static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = 512 * 1024            # corta requisições gigantes antes de ler
log = logging.getLogger("luna")

LIMITE_MENSAGEM = 4000
LIMITE_ITENS_HISTORICO = 60
LIMITE_TEXTO_HISTORICO = 8000
LIMITE_ITENS_MEMORIA = 30
LIMITE_TEXTO_MEMORIA = 300

ERROS_MODELO = {
    "sem_chave": (503, "A chave da API do Gemini não está configurada no servidor. Veja o README para configurar GEMINI_API_KEY."),
    "chave": (503, "A chave da API do Gemini foi recusada. Confira se ela está correta."),
    "limite": (429, "Muitas mensagens em pouco tempo. Espere um minutinho e tente de novo."),
    "vazia": (502, "Não consegui formular uma resposta agora. Pode tentar de novo?"),
    "falha": (502, "Tive um problema para falar com a inteligência artificial. Tente de novo em alguns instantes."),
}

# Páginas abertas pelo Live Server (ex.: porta 5500) também podem chamar a API.
ORIGEM_LOCAL = re.compile(r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$")


@app.after_request
def cabecalhos(resposta):
    origem = request.headers.get("Origin", "")
    if ORIGEM_LOCAL.match(origem):
        resposta.headers["Access-Control-Allow-Origin"] = origem
        resposta.headers["Access-Control-Allow-Headers"] = "Content-Type"
        resposta.headers["Vary"] = "Origin"
    resposta.headers["X-Content-Type-Options"] = "nosniff"
    resposta.headers["Referrer-Policy"] = "no-referrer"
    if request.path == "/chat":
        resposta.headers["Cache-Control"] = "no-store"     # respostas emocionais não ficam em cache
    return resposta


@app.get("/")
def inicio():
    return app.send_static_file("index.html")


def validar(dados):
    """Valida o que chega do navegador. Devolve (pedido, None) ou (None, mensagem de erro)."""
    if not isinstance(dados, dict):
        return None, "Envie um JSON com o campo 'mensagem'."
    mensagem = dados.get("mensagem")
    if not isinstance(mensagem, str) or not mensagem.strip():
        return None, "A mensagem está vazia."
    if len(mensagem) > LIMITE_MENSAGEM:
        return None, f"A mensagem é muito longa (máximo de {LIMITE_MENSAGEM} caracteres)."

    historico = dados.get("historico", [])
    if not isinstance(historico, list) or len(historico) > LIMITE_ITENS_HISTORICO:
        return None, "Histórico inválido."
    for item in historico:
        if (not isinstance(item, dict) or item.get("papel") not in ("usuario", "luna")
                or not isinstance(item.get("texto"), str) or len(item["texto"]) > LIMITE_TEXTO_HISTORICO):
            return None, "Histórico inválido."

    memoria = dados.get("memoria", [])
    if (not isinstance(memoria, list) or len(memoria) > LIMITE_ITENS_MEMORIA
            or not all(isinstance(m, str) and len(m) <= LIMITE_TEXTO_MEMORIA for m in memoria)):
        return None, "Memória inválida."

    return {
        "mensagem": mensagem.strip(),
        "historico": [{"papel": h["papel"], "texto": h["texto"]} for h in historico if h["texto"].strip()],
        "memoria": [m.strip() for m in memoria if m.strip()],
        "memoria_ativa": dados.get("memoria_ativa") is True,
        "modo_voz": dados.get("modo_voz") is True,
    }, None


@app.get("/status")
def estado():
    """Diagnóstico sem dados pessoais: se a chave existe (sim/não) e o estado do RAG.

    Útil para conferir a integração da biblioteca sem abrir uma conversa.
    Nunca devolve a chave nem trechos de conversa.
    """
    return jsonify(
        modelo_configurado=bool(os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")),
        rag=rag.status(),
    )


@app.post("/chat")
def chat():
    pedido, erro = validar(request.get_json(silent=True))
    if erro:
        return jsonify(erro=erro), 400
    try:
        return jsonify(luna.responder(**pedido))
    except luna.ErroModelo as falha:
        status, texto = ERROS_MODELO.get(falha.motivo, ERROS_MODELO["falha"])
        log.warning("Falha ao gerar resposta: %s", falha.motivo)   # só o motivo, nunca o texto da pessoa
        return jsonify(erro=texto), status


if __name__ == "__main__":
    from flask.cli import load_dotenv
    load_dotenv()                                             # lê o arquivo .env, se existir
    logging.basicConfig(level=logging.INFO)
    if not (os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")):
        log.warning("GEMINI_API_KEY não definida: o chat vai avisar que a chave falta (os textos de segurança continuam funcionando).")
    print("LUNA MIND rodando em http://127.0.0.1:5000")
    log.info("Biblioteca: %s", rag.status())                  # carrega o RAG já na partida
    app.run(host="127.0.0.1", port=5000, debug=False)
