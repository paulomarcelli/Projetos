"""Servidor da LUNA MIND (Flask).

Rodar:  python app.py   e abrir http://127.0.0.1:5000

Privacidade: o servidor não guarda nada. O histórico e a memória ficam no
navegador da pessoa e chegam aqui só para gerar cada resposta. Os logs registram
apenas a rota e o código de status, nunca o texto das mensagens.
"""

import logging
import os
import re
import threading
import time

from flask import Flask, jsonify, request

import luna
import rag
import voz_tempo_real

app = Flask(__name__, static_folder="web", static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = 512 * 1024            # corta requisições gigantes antes de ler

# Hospedado atrás de um proxy (ex.: Render): usa o IP real de quem acessa, vindo do X-Forwarded-For.
# Só liga com LUNA_PROXY=1; sem proxy, aceitar esse cabeçalho deixaria qualquer um forjar o IP.
if os.environ.get("LUNA_PROXY") == "1":
    from werkzeug.middleware.proxy_fix import ProxyFix
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)

# Limite de mensagens por IP: com a Luna pública, protege os créditos das chaves de quem hospeda.
LIMITE_CHAT_HORA = int(os.environ.get("LUNA_LIMITE_CHAT_HORA", "60"))
_pedidos_chat = {}
_trava_chat = threading.Lock()


def dentro_do_limite_chat(ip):
    agora = time.time()
    with _trava_chat:
        recentes = [t for t in _pedidos_chat.get(ip, []) if agora - t < 3600]
        permitido = len(recentes) < LIMITE_CHAT_HORA
        if permitido:
            recentes.append(agora)
        _pedidos_chat[ip] = recentes
        return permitido
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
    "limite_dia": (429, "O limite diário gratuito da chave do Gemini acabou. Tente de novo amanhã ou ative o faturamento no Google AI Studio para conversar sem esse limite."),
    "vazia": (502, "Não consegui formular uma resposta agora. Pode tentar de novo?"),
    "falha": (502, "Tive um problema para falar com a inteligência artificial. Tente de novo em alguns instantes."),
}

# Páginas abertas pelo Live Server (ex.: porta 5500) também podem chamar a API.
ORIGEM_LOCAL = re.compile(r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$")
# Frontend publicado em outro endereço (ex.: GitHub Pages): só as origens listadas, exatas.
# Ex.: LUNA_ORIGENS_PERMITIDAS=https://paulomarcelli.github.io
ORIGENS_PERMITIDAS = {o.strip().rstrip("/") for o in os.environ.get("LUNA_ORIGENS_PERMITIDAS", "").split(",") if o.strip()}


def origem_permitida(origem):
    return bool(ORIGEM_LOCAL.match(origem)) or origem in ORIGENS_PERMITIDAS


@app.after_request
def cabecalhos(resposta):
    origem = request.headers.get("Origin", "")
    if origem_permitida(origem):
        resposta.headers["Access-Control-Allow-Origin"] = origem
        resposta.headers["Access-Control-Allow-Headers"] = "Content-Type"
        resposta.headers["Vary"] = "Origin"
    resposta.headers["X-Content-Type-Options"] = "nosniff"
    resposta.headers["Referrer-Policy"] = "no-referrer"
    if request.path == "/chat" or request.path.startswith("/voz/"):
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
        voz_tempo_real=voz_tempo_real.disponivel(),
        rag=rag.status(),
    )


@app.post("/chat")
def chat():
    pedido, erro = validar(request.get_json(silent=True))
    if erro:
        return jsonify(erro=erro), 400
    if not dentro_do_limite_chat(request.remote_addr or ""):
        return jsonify(erro="Muitas mensagens em pouco tempo. Faça uma pausa e tente de novo daqui a pouco."), 429
    try:
        return jsonify(luna.responder(**pedido))
    except luna.ErroModelo as falha:
        status, texto = ERROS_MODELO.get(falha.motivo, ERROS_MODELO["falha"])
        log.warning("Falha ao gerar resposta: %s", falha.motivo)   # só o motivo, nunca o texto da pessoa
        return jsonify(erro=texto), status


@app.post("/voz/sessao")
def voz_sessao():
    """Cria uma sessão de voz em tempo real. Devolve uma chave EFÊMERA, nunca a chave secreta."""
    dados = request.get_json(silent=True) or {}
    memoria = dados.get("memoria", [])
    if (not isinstance(memoria, list) or len(memoria) > LIMITE_ITENS_MEMORIA
            or not all(isinstance(m, str) and len(m) <= LIMITE_TEXTO_MEMORIA for m in memoria)):
        return jsonify(erro="Memória inválida."), 400
    try:
        sessao = voz_tempo_real.criar_sessao(
            [m.strip() for m in memoria if m.strip()], dados.get("memoria_ativa") is True, request.remote_addr or "")
    except voz_tempo_real.ErroVoz as falha:
        log.warning("Voz em tempo real indisponível (%s)", falha.status)
        return jsonify(erro=str(falha)), falha.status
    return jsonify(sessao)


@app.post("/voz/avaliar")
def voz_avaliar():
    """Segurança em código para a fala transcrita (o texto não vai para o log)."""
    dados = request.get_json(silent=True) or {}
    texto = dados.get("texto")
    anteriores = dados.get("anteriores", [])
    if not isinstance(texto, str) or not texto.strip() or len(texto) > LIMITE_MENSAGEM:
        return jsonify(erro="Texto inválido."), 400
    if (not isinstance(anteriores, list) or len(anteriores) > LIMITE_ITENS_HISTORICO
            or not all(isinstance(a, str) and len(a) <= LIMITE_TEXTO_HISTORICO for a in anteriores)):
        return jsonify(erro="Histórico inválido."), 400
    return jsonify(voz_tempo_real.avaliar(texto.strip(), anteriores))


if __name__ == "__main__":
    from flask.cli import load_dotenv
    load_dotenv()                                             # lê o arquivo .env, se existir
    logging.basicConfig(level=logging.INFO)
    if not (os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")):
        log.warning("GEMINI_API_KEY não definida: o chat vai avisar que a chave falta (os textos de segurança continuam funcionando).")
    print("LUNA MIND rodando em http://127.0.0.1:5000")
    log.info("Biblioteca: %s", rag.status())                  # carrega o RAG já na partida
    app.run(host="127.0.0.1", port=5000, debug=False)
