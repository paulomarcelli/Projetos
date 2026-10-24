"""Captura telas REAIS da interface da Luna para o vídeo.

Sobe o servidor Flask de verdade (porta 5000) e abre a página num Chromium
automático. Só a IA é trocada por um roteiro fixo, para as capturas sempre
saírem iguais: a conversa de exemplo usa a resposta-modelo que está nas
instruções da Luna (comportamento desejado), e o vídeo marca isso como exemplo.
A resposta de crise é o texto revisado real, que não passa pela IA.

Rodar na pasta Luna-AI:  python video/capturar_telas.py
"""

import json
import sys
import threading
from pathlib import Path

PASTA = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PASTA))
sys.path.insert(0, str(PASTA / "tests"))

from playwright.sync_api import sync_playwright  # noqa: E402
from werkzeug.serving import make_server  # noqa: E402

import app as servidor  # noqa: E402
import luna  # noqa: E402
from test_interface import BIBLIOTECAS, VOZ_FALSA  # noqa: E402  (mesmas libs locais e voz simulada dos testes)

SAIDA = Path(__file__).resolve().parent / "capturas"
EXEMPLO = ("Entendo por que essa demora pode ter despertado insegurança. Mas vamos separar o que sabemos do que estamos "
           "imaginando: sabemos que ela demorou para responder; ainda não sabemos o motivo. Pode haver várias explicações, "
           "e isso, sozinho, não confirma que ela deixou de gostar de você. O que aconteceu antes disso que fez essa "
           "possibilidade parecer tão provável?")
# Fontes parecidas com Cormorant/Nunito instaladas aqui (as originais vêm do Google Fonts).
FONTES = """
body, button, input, textarea, select, .transcricao { font-family: 'Nunito', 'Poppins', sans-serif !important; }
.marca h1, .saudacao, .topo-nome, .dialogo-topo h2 { font-family: 'Cormorant Garamond', 'TeX Gyre Pagella', serif !important; }
"""


def modelo_roteiro(instrucoes, conteudos):
    ultima = conteudos[-1]["parts"][0]["text"].lower()
    if "amiga" in ultima:
        return json.dumps({"necessidade": "reflexao", "resposta": EXEMPLO, "lembrar": None})
    return json.dumps({"necessidade": "acolhimento", "resposta": "Estou aqui. Quer me contar um pouco mais?", "lembrar": None})


def abrir(navegador, largura, altura, escala, voz=False):
    contexto = navegador.new_context(viewport={"width": largura, "height": altura}, device_scale_factor=escala, locale="pt-BR")
    if voz:
        contexto.add_init_script(VOZ_FALSA)
    contexto.route("https://cdn.jsdelivr.net/npm/**", lambda r: r.fulfill(
        path=next(v for k, v in BIBLIOTECAS.items() if k in r.request.url),
        headers={"Content-Type": "application/javascript", "Access-Control-Allow-Origin": "*"}))
    contexto.route("https://fonts.g*/**", lambda r: r.abort())
    pagina = contexto.new_page()
    pagina.goto("http://127.0.0.1:5000/")
    pagina.add_style_tag(content=FONTES)
    pagina.wait_for_function("window.marked && window.DOMPurify")
    return pagina


def parar_animacoes(pagina, ms=4100):
    """Congela as animações num quadro bonito (logo no pico do brilho, mensagens já visíveis)."""
    pagina.evaluate(f"document.getAnimations().forEach(a => {{ try {{ a.pause(); a.currentTime = {ms}; }} catch {{}} }})")


def enviar(pagina, texto):
    antes = pagina.locator(".linha.luna").count()
    pagina.fill("#campo-mensagem", texto)
    pagina.press("#campo-mensagem", "Enter")
    pagina.wait_for_function(f"document.querySelectorAll('.linha.luna:not(#digitando)').length > {antes}")
    pagina.wait_for_timeout(900)


def main():
    SAIDA.mkdir(exist_ok=True)
    luna.chamar_modelo = modelo_roteiro
    http = make_server("127.0.0.1", 5000, servidor.app, threaded=True)
    threading.Thread(target=http.serve_forever, daemon=True).start()
    with sync_playwright() as pw:
        nav = pw.chromium.launch()

        p = abrir(nav, 1440, 900, 1.5)
        parar_animacoes(p)
        p.screenshot(path=SAIDA / "computador-inicio.png")
        p.evaluate("document.getAnimations().forEach(a => a.play())")
        enviar(p, "Minha amiga demorou para responder. Tenho certeza de que ela não gosta mais de mim.")
        parar_animacoes(p, 2000)
        p.screenshot(path=SAIDA / "computador-conversa.png")
        p.click("#abrir-configuracoes")
        p.check("#cfg-memoria")
        p.fill("#nova-memoria", "Prefere respostas curtas")
        p.press("#nova-memoria", "Enter")
        p.locator("#secao-privacidade").scroll_into_view_if_needed()
        p.wait_for_timeout(500)
        p.screenshot(path=SAIDA / "computador-configuracoes.png")

        p = abrir(nav, 390, 844, 3)
        parar_animacoes(p)
        p.screenshot(path=SAIDA / "celular-inicio.png")
        p.evaluate("document.getAnimations().forEach(a => a.play())")
        enviar(p, "Hoje eu queria não existir mais.")
        p.evaluate("const m = document.getElementById('mensagens'); m.scrollTop = m.scrollHeight")
        p.wait_for_timeout(1600)
        p.screenshot(path=SAIDA / "celular-crise.png")

        p = abrir(nav, 390, 844, 3, voz=True)
        p.evaluate("window.__duracaoFala = 60000; window.__falas = ['Estou ansioso com a prova de amanhã']")
        p.click("#botao-microfone")
        p.wait_for_function("document.querySelector('.indicador-voz').dataset.estado === 'falando'")
        p.wait_for_timeout(900)
        parar_animacoes(p, 450)
        p.screenshot(path=SAIDA / "celular-voz.png")
        nav.close()
    http.shutdown()
    print("Capturas em", SAIDA)


if __name__ == "__main__":
    main()
