"""Testes da interface no navegador (Playwright + Chromium), em celular, tablet e computador.

Sobe o servidor Flask DE VERDADE na porta 5000, mas com o modelo de IA trocado
por um falso (sem internet). As APIs de voz do navegador também são simuladas,
porque o Chromium de teste não tem microfone nem alto-falante: o teste verifica
a lógica (ouvir → pensar → falar → ouvir de novo, interromper, erros), não a
qualidade real da voz.

Rodar na pasta Luna-AI:
    pip install playwright && python -m playwright install chromium
    python -m unittest tests.test_interface
Capturas de tela ficam em tests/saida/.
"""

import json
import re
import os
import socket
import sys
import threading
import unittest
from pathlib import Path

PASTA = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PASTA))

try:
    from playwright.sync_api import sync_playwright
except ImportError:  # pragma: no cover
    sync_playwright = None

from werkzeug.serving import make_server  # noqa: E402

import app as servidor  # noqa: E402
import luna  # noqa: E402

SAIDA = PASTA / "tests" / "saida"
URL = "http://127.0.0.1:5000/"
TELAS = {
    "celular": {"viewport": {"width": 390, "height": 844}, "is_mobile": True, "has_touch": True, "device_scale_factor": 2},
    "tablet": {"viewport": {"width": 820, "height": 1180}, "has_touch": True},
    "computador": {"viewport": {"width": 1366, "height": 850}},
}
# Cópias locais das bibliotecas (mesma versão fixada no index.html) para o teste não depender da CDN.
# Pasta node_modules com as cópias locais das bibliotecas da CDN (configurável por LUNA_NPM_TOOLS).
NPM_TOOLS = os.environ.get("LUNA_NPM_TOOLS", "/opt/npm-tools/node_modules")
BIBLIOTECAS = {
    "marked@18.0.10/lib/marked.umd.js": os.path.join(NPM_TOOLS, "marked/lib/marked.umd.js"),
    "dompurify@3.4.14/dist/purify.min.js": os.path.join(NPM_TOOLS, "dompurify/dist/purify.min.js"),
}

instrucoes_recebidas = []


def modelo_falso(instrucoes, conteudos):
    instrucoes_recebidas.append(instrucoes)
    ultima = conteudos[-1]["parts"][0]["text"].lower()
    if "falhar" in ultima and "agora vai" not in ultima:
        raise luna.ErroModelo("falha")
    if "xss" in ultima:
        resposta = 'Oi <img src=x onerror="window.__xss=1"> [clique](javascript:window.__xss=2) **negrito**'
        return json.dumps({"necessidade": "acolhimento", "resposta": resposta, "lembrar": None})
    if "mostre as fontes" in ultima:
        # cita o primeiro trecho da biblioteca que o RAG enviou nas instruções (como o modelo real faria)
        achado = re.search(r'<trecho id="([^"]+)"', instrucoes)
        fontes = [achado.group(1), "99#1"] if achado else []   # "99#1" é inventado: o servidor deve descartar
        return json.dumps({"necessidade": "reflexao", "resposta": "Isso parece um ciclo de ruminação.", "lembrar": None, "fontes": fontes})
    if "lembre" in ultima:
        return json.dumps({"necessidade": "acolhimento", "resposta": "Combinado, vou responder de forma curta.", "lembrar": "Prefere respostas curtas"})
    return json.dumps({"necessidade": "reflexao", "resposta": f"Entendo. **O que aconteceu** antes disso? (contexto: {len(conteudos)} mensagens)", "lembrar": None})


# ----- simulação das APIs de voz (injetada antes dos scripts da página) -----
VOZ_FALSA = """
window.__falado = []; window.__falas = []; window.__erroMic = null; window.__duracaoFala = 30;
class ReconhecimentoFalso {
  start() {
    this._ativo = true;
    setTimeout(() => {
      if (!this._ativo) return;
      if (window.__erroMic) { this.onerror?.({ error: window.__erroMic }); this._fim(); return; }
      const fala = window.__falas.shift();
      if (fala) this.onresult?.({ resultIndex: 0, results: [Object.assign([{ transcript: fala }], { isFinal: true })] });
      else this.onerror?.({ error: "no-speech" });
      this._fim();
    }, 40);
  }
  _fim() { if (this._ativo) { this._ativo = false; this.onend?.(); } }
  abort() { const estava = this._ativo; this._ativo = false; if (estava) setTimeout(() => this.onend?.(), 0); }
  stop() { this._fim(); }
}
window.SpeechRecognition = ReconhecimentoFalso;
const fila = [];
let falando = null;
function proxima() {
  if (falando || !fila.length || window.speechSynthesis.paused) return;
  falando = fila.shift();
  window.__falado.push(falando.text);
  falando._t = setTimeout(() => { const u = falando; falando = null; u.onend?.({}); proxima(); }, window.__duracaoFala);
}
Object.defineProperty(window, "speechSynthesis", { value: {
  paused: false,
  speak(u) { fila.push(u); proxima(); },
  cancel() { fila.length = 0; if (falando) { clearTimeout(falando._t); const u = falando; falando = null; u.onerror?.({ error: "interrupted" }); } },
  pause() { this.paused = true; }, resume() { this.paused = false; proxima(); },
  getVoices() { return [{ name: "Voz Teste Natural", lang: "pt-BR", voiceURI: "teste" }]; },
  addEventListener() {},
}});
window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
"""


def porta_livre(porta):
    with socket.socket() as s:
        return s.connect_ex(("127.0.0.1", porta)) != 0


@unittest.skipIf(sync_playwright is None, "Playwright não instalado")
class TestInterface(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not porta_livre(5000):
            raise unittest.SkipTest("A porta 5000 está ocupada; desligue o servidor da Luna para rodar este teste.")
        cls.original = luna.chamar_modelo
        luna.chamar_modelo = modelo_falso
        cls.http = make_server("127.0.0.1", 5000, servidor.app, threaded=True)
        threading.Thread(target=cls.http.serve_forever, daemon=True).start()
        cls.pw = sync_playwright().start()
        # LUNA_CHROMIUM permite usar um Chromium já instalado (ex.: ambientes sem `playwright install`).
        cls.navegador = cls.pw.chromium.launch(executable_path=os.environ.get("LUNA_CHROMIUM") or None)
        SAIDA.mkdir(exist_ok=True)

    @classmethod
    def tearDownClass(cls):
        cls.navegador.close()
        cls.pw.stop()
        cls.http.shutdown()
        luna.chamar_modelo = cls.original

    def abrir(self, tela, voz_falsa=False, contexto=None):
        contexto = contexto or self.navegador.new_context(**TELAS[tela], locale="pt-BR")
        if voz_falsa:
            contexto.add_init_script(VOZ_FALSA)

        def servir_biblioteca(rota):
            caminho = next(local for nome, local in BIBLIOTECAS.items() if nome in rota.request.url)
            rota.fulfill(path=caminho, headers={"Content-Type": "application/javascript", "Access-Control-Allow-Origin": "*"})

        contexto.route("https://cdn.jsdelivr.net/npm/**", servir_biblioteca)
        contexto.route("https://fonts.googleapis.com/**", lambda r: r.abort())
        contexto.route("https://fonts.gstatic.com/**", lambda r: r.abort())
        pagina = contexto.new_page()
        erros = []
        pagina.on("pageerror", lambda e: erros.append(str(e)))
        pagina.goto(URL)
        pagina.wait_for_function("window.marked && window.DOMPurify")  # SRI conferiu e as libs carregaram
        self.addCleanup(contexto.close)
        self.addCleanup(lambda: self.assertEqual(erros, [], "erros de JavaScript na página"))
        return pagina

    def enviar(self, pagina, texto):
        antes = pagina.locator(".linha.luna").count()
        pagina.fill("#campo-mensagem", texto)
        pagina.press("#campo-mensagem", "Enter")
        pagina.wait_for_function(f"document.querySelectorAll('.linha.luna:not(#digitando)').length > {antes}")
        return pagina.locator(".linha.luna").last

    def sem_rolagem_horizontal(self, pagina):
        return pagina.evaluate("document.documentElement.scrollWidth <= window.innerWidth")

    # ---------- testes em todos os tamanhos ----------
    def test_conversa_basica_em_todos_os_tamanhos(self):
        for tela in TELAS:
            with self.subTest(tela=tela):
                pagina = self.abrir(tela)
                self.assertTrue(pagina.is_visible(".boas-vindas"))
                self.assertTrue(self.sem_rolagem_horizontal(pagina))
                pagina.screenshot(path=SAIDA / f"{tela}-1-inicio.png")

                resposta = self.enviar(pagina, "Minha amiga demorou pra responder")
                self.assertTrue(pagina.is_hidden(".boas-vindas"))
                self.assertEqual(resposta.locator(".balao strong").inner_text(), "O que aconteceu")
                self.assertEqual(pagina.locator("#digitando").count(), 0)
                self.assertEqual(pagina.input_value("#campo-mensagem"), "")

                resposta = self.enviar(pagina, "ela sempre responde rápido")
                self.assertIn("contexto: 3 mensagens", resposta.inner_text())  # o histórico chegou ao servidor
                self.assertTrue(self.sem_rolagem_horizontal(pagina))
                self.assertLess(pagina.locator("#campo-mensagem").bounding_box()["height"], 50)  # campo volta a ter 1 linha
                pagina.wait_for_timeout(600)  # espera a rolagem suave e a animação terminarem
                pagina.screenshot(path=SAIDA / f"{tela}-2-conversa.png")

                crise = self.enviar(pagina, "quero morrer")
                self.assertTrue(crise.locator(".cartao-contatos").is_visible())
                self.assertEqual(crise.locator(".cartao-contatos a.numero").evaluate_all("l => l.map(a => a.getAttribute('href'))"), ["tel:188", "tel:192"])
                self.assertIn("188", crise.locator(".balao").inner_text())
                pagina.wait_for_timeout(600)
                self.assertTrue(crise.locator(".cartao-contatos").evaluate(  # o cartão ficou dentro da área visível
                    "el => { const r = el.getBoundingClientRect(), m = document.getElementById('mensagens').getBoundingClientRect(); return r.bottom <= m.bottom + 1; }"))
                pagina.screenshot(path=SAIDA / f"{tela}-3-contatos-de-ajuda.png")

    def test_marca_logo_animado_e_icones(self):
        pagina = self.abrir("computador")
        self.assertEqual(pagina.title(), "LUNA MIND")
        self.assertEqual(pagina.locator(".marca h1").get_attribute("aria-label"), "LUNA MIND")
        self.assertEqual(pagina.locator("#logo-luna .logo-luna__faisca").count(), 4)   # faíscas nos cristais
        self.assertEqual(pagina.locator("#logo-luna").get_attribute("role"), "img")
        self.assertTrue(pagina.evaluate("document.getElementById('logo-luna').getAnimations({subtree: true}).length >= 5"))
        # a logo carregou de verdade (arquivo refinado) e os ícones existem
        self.assertTrue(pagina.evaluate("document.querySelector('#logo-luna img').naturalWidth === 960"))
        cliente = servidor.app.test_client()
        for arquivo in ("marca/luna-mind.png", "marca/favicon-32.png", "marca/apple-touch-icon.png", "marca/icone-192.png"):
            self.assertEqual(cliente.get("/" + arquivo).status_code, 200, arquivo)
        pagina.screenshot(path=SAIDA / "marca-logo-animado.png")

    def test_logo_parada_com_movimento_reduzido(self):
        contexto = self.navegador.new_context(**TELAS["computador"], locale="pt-BR", reduced_motion="reduce")
        pagina = self.abrir("computador", contexto=contexto)
        pagina.wait_for_timeout(300)
        self.assertEqual(pagina.evaluate("document.getElementById('logo-luna').getAnimations({subtree: true}).length"), 0)
        self.assertEqual(pagina.evaluate("getComputedStyle(document.querySelector('.logo-luna__faisca')).opacity"), "0")

    def test_fontes_da_biblioteca_aparecem_sob_a_resposta(self):
        pagina = self.abrir("computador")
        resposta = self.enviar(pagina, "Fico remoendo e não consigo parar de pensar, mostre as fontes")
        self.assertEqual(resposta.locator("details.fontes").count(), 1)       # só a fonte real; a inventada foi descartada
        self.assertEqual(resposta.locator("details.fontes li").count(), 1)
        self.assertFalse(resposta.locator("details.fontes").evaluate("d => d.open"))   # fechado por padrão
        resposta.locator("details.fontes summary").click()
        self.assertTrue(resposta.locator(".fonte-doc").first.is_visible())
        self.assertIn("Ansiedade", resposta.locator(".fonte-doc").first.inner_text())
        pagina.wait_for_timeout(500)
        pagina.screenshot(path=SAIDA / "fontes-da-biblioteca.png")
        # mensagem sem tema da biblioteca: nenhum bloco de fontes
        outra = self.enviar(pagina, "oi, tudo bem?")
        self.assertEqual(outra.locator("details.fontes").count(), 0)

    def test_menu_e_ajuda_no_celular(self):
        pagina = self.abrir("celular")
        self.assertTrue(pagina.is_hidden("#sidebar .cartao-ajuda"))
        pagina.click("#botao-menu")
        pagina.wait_for_timeout(350)
        self.assertTrue(pagina.is_visible("#cartao-ajuda"))
        self.assertEqual(pagina.evaluate("document.activeElement.id"), "nova-conversa")  # foco entra na gaveta
        self.assertEqual(pagina.get_attribute("#botao-menu", "aria-expanded"), "true")
        self.assertTrue(pagina.evaluate("document.getElementById('chat-area').inert"))  # Tab não escapa pra trás
        pagina.screenshot(path=SAIDA / "celular-4-menu.png")
        pagina.keyboard.press("Escape")
        pagina.wait_for_timeout(500)  # a gaveta desliza por 0,3s antes de sumir
        self.assertTrue(pagina.is_hidden("#cartao-ajuda"))
        self.assertEqual(pagina.evaluate("document.activeElement.id"), "botao-menu")
        pagina.click("#botao-ajuda-mobile")
        pagina.wait_for_timeout(350)
        self.assertEqual(pagina.evaluate("document.activeElement.id"), "cartao-ajuda")

    def test_sidebar_fixa_no_computador_e_tablet(self):
        for tela in ("computador",):
            pagina = self.abrir(tela)
            self.assertTrue(pagina.is_visible("#sidebar"))
            self.assertTrue(pagina.is_hidden("#botao-menu"))
        pagina = self.abrir("tablet")  # 820px: acima do limite de 768, sidebar fixa
        self.assertTrue(pagina.is_visible("#sidebar"))

    # ---------- segurança da interface ----------
    def test_html_da_ia_e_limpo(self):
        pagina = self.abrir("computador")
        resposta = self.enviar(pagina, "teste xss")
        self.assertEqual(resposta.locator("img[onerror]").count(), 0)
        self.assertIsNone(pagina.evaluate("window.__xss ?? null"))
        hrefs = resposta.locator(".balao a").evaluate_all("l => l.map(a => a.getAttribute('href'))")
        self.assertFalse(any(h and h.startswith("javascript") for h in hrefs))
        self.assertEqual(resposta.locator(".balao strong").inner_text(), "negrito")

    def test_erro_com_tentar_de_novo(self):
        pagina = self.abrir("computador")
        erro = self.enviar(pagina, "isso vai falhar")
        self.assertIn("inteligência artificial", erro.inner_text())
        self.assertTrue(erro.locator(".balao.erro").is_visible())
        pagina.wait_for_timeout(400)
        pagina.screenshot(path=SAIDA / "computador-5-erro.png")
        luna.chamar_modelo = lambda i, c: json.dumps({"resposta": "Voltei!", "lembrar": None})
        try:
            erro.locator("text=Tentar de novo").click()
            pagina.wait_for_selector(".linha.luna .balao:has-text('Voltei!')")
        finally:
            luna.chamar_modelo = modelo_falso
        self.assertEqual(pagina.locator(".balao.erro").count(), 0)
        self.assertEqual(pagina.locator(".linha.usuario").count(), 1)  # a pergunta não ficou duplicada

    # ---------- histórico e memória ----------
    def test_historico_so_com_permissao_e_retomada(self):
        pagina = self.abrir("computador")
        self.enviar(pagina, "primeira conversa sem permissão")
        self.assertIsNone(pagina.evaluate("localStorage.getItem('luna.conversas')"))
        self.assertIn("desligado", pagina.inner_text("#historico-vazio"))

        pagina.click("#abrir-configuracoes")
        pagina.check("#cfg-historico")
        pagina.screenshot(path=SAIDA / "computador-6-configuracoes.png")
        pagina.click("#fechar-config")
        self.assertEqual(pagina.locator(".item-conversa").count(), 1)  # a conversa atual foi guardada ao ativar

        pagina.reload()
        pagina.wait_for_function("window.marked && window.DOMPurify")
        self.assertTrue(pagina.is_visible(".boas-vindas"))
        pagina.click(".abrir-conversa")
        self.assertEqual(pagina.locator(".linha.usuario .balao").inner_text(), "primeira conversa sem permissão")
        resposta = self.enviar(pagina, "continuando")
        self.assertIn("contexto: 3 mensagens", resposta.inner_text())  # retomou com o contexto

        pagina.on("dialog", lambda d: d.accept())
        pagina.click("#abrir-configuracoes")
        pagina.uncheck("#cfg-historico")
        self.assertIsNone(pagina.evaluate("localStorage.getItem('luna.conversas')"))

    def test_memoria_com_consentimento(self):
        pagina = self.abrir("computador")
        resposta = self.enviar(pagina, "lembre que prefiro respostas curtas")
        self.assertEqual(resposta.locator(".sugestao-memoria").count(), 0)  # memória desligada: nada sugerido

        pagina.click("#abrir-configuracoes")
        pagina.check("#cfg-memoria")
        pagina.click("#fechar-config")
        resposta = self.enviar(pagina, "lembre que prefiro respostas curtas")
        resposta.locator("text=Lembrar").click()
        self.assertEqual(pagina.evaluate("JSON.parse(localStorage.getItem('luna.memoria'))"), ["Prefere respostas curtas"])
        self.enviar(pagina, "oi de novo")
        self.assertIn("- Prefere respostas curtas", instrucoes_recebidas[-1])  # a memória foi junto como contexto

        pagina.click("#abrir-configuracoes")
        campo = pagina.locator("#lista-memoria input")
        campo.fill("Prefere respostas bem curtas")
        campo.press("Tab")
        self.assertEqual(pagina.evaluate("JSON.parse(localStorage.getItem('luna.memoria'))"), ["Prefere respostas bem curtas"])
        pagina.click("#lista-memoria button")
        self.assertEqual(pagina.evaluate("JSON.parse(localStorage.getItem('luna.memoria'))"), [])
        self.assertTrue(pagina.is_visible("#memoria-vazia"))

    # ---------- voz (APIs simuladas) ----------
    def test_conversa_por_voz_completa(self):
        pagina = self.abrir("computador", voz_falsa=True)
        pagina.evaluate("window.__falas = ['estou ansiosa com a prova de amanhã']")
        pagina.click("#botao-microfone")
        self.assertEqual(pagina.get_attribute("#botao-microfone", "aria-pressed"), "true")
        pagina.wait_for_selector(".linha.usuario:has-text('estou ansiosa com a prova')")
        pagina.wait_for_function("window.__falado.length > 0")
        falado = " ".join(pagina.evaluate("window.__falado"))
        self.assertIn("O que aconteceu antes disso?", falado)
        self.assertNotIn("*", falado)                                     # Markdown não é lido em voz alta
        self.assertIn("MODO VOZ", instrucoes_recebidas[-1])               # servidor pediu resposta curta, sem Markdown
        # depois de falar, volta a ouvir; sem fala 3 vezes seguidas, pausa
        pagina.wait_for_function("document.getElementById('status-voz').textContent.includes('Não ouvi nada')")
        self.assertEqual(pagina.inner_text("#voz-pausar"), "Retomar")
        pagina.screenshot(path=SAIDA / "computador-7-voz-pausada.png")
        pagina.click("#voz-encerrar")
        self.assertTrue(pagina.is_hidden("#painel-voz"))
        self.assertEqual(pagina.get_attribute("#botao-microfone", "aria-pressed"), "false")

    def test_interromper_e_nao_duplicar(self):
        pagina = self.abrir("computador", voz_falsa=True)
        pagina.evaluate("window.__duracaoFala = 5000; window.__falas = ['oi luna']")
        pagina.click("#botao-microfone")
        pagina.wait_for_function("document.querySelector('.indicador-voz').dataset.estado === 'falando'")
        self.assertTrue(pagina.is_visible("#voz-interromper"))
        pagina.evaluate("window.__falas = []")
        pagina.click("#voz-interromper")
        estado = pagina.evaluate("document.querySelector('.indicador-voz').dataset.estado")
        self.assertEqual(estado, "ouvindo")
        self.assertEqual(pagina.evaluate("window.__falado.length"), 1)  # a fala foi cortada, não continuou
        self.assertEqual(pagina.locator(".linha.luna").count(), 1)       # uma resposta só

    def test_pausar_e_retomar_fala(self):
        pagina = self.abrir("computador", voz_falsa=True)
        pagina.evaluate("window.__duracaoFala = 3000; window.__falas = ['oi luna']")
        pagina.click("#botao-microfone")
        pagina.wait_for_function("document.querySelector('.indicador-voz').dataset.estado === 'falando'")
        pagina.click("#voz-pausar")
        self.assertEqual(pagina.inner_text("#status-voz"), "Fala pausada.")
        self.assertTrue(pagina.evaluate("speechSynthesis.paused"))
        pagina.click("#voz-pausar")
        self.assertFalse(pagina.evaluate("speechSynthesis.paused"))
        self.assertEqual(pagina.inner_text("#status-voz"), "Luna falando…")

    def test_microfone_negado(self):
        pagina = self.abrir("celular", voz_falsa=True)
        pagina.evaluate("window.__erroMic = 'not-allowed'")
        pagina.click("#botao-microfone")
        pagina.wait_for_selector("#aviso-rapido.visivel")
        self.assertIn("microfone foi negado", pagina.inner_text("#aviso-rapido"))
        self.assertTrue(pagina.is_hidden("#painel-voz"))

    def test_painel_de_voz_no_celular(self):
        pagina = self.abrir("celular", voz_falsa=True)
        pagina.evaluate("window.__duracaoFala = 5000; window.__falas = ['oi luna']")
        pagina.click("#botao-microfone")
        pagina.wait_for_function("document.querySelector('.indicador-voz').dataset.estado === 'falando'")
        self.assertTrue(self.sem_rolagem_horizontal(pagina))
        pagina.screenshot(path=SAIDA / "celular-5-voz.png")

    def test_navegador_sem_reconhecimento_de_fala(self):
        contexto = self.navegador.new_context(**TELAS["computador"])
        contexto.add_init_script("delete window.SpeechRecognition; delete window.webkitSpeechRecognition;")
        pagina = self.abrir("computador", contexto=contexto)
        self.assertEqual(pagina.get_attribute("#botao-microfone", "aria-disabled"), "true")
        pagina.click("#botao-microfone", force=True)  # aria-disabled não impede o clique de verdade; o Playwright sim
        pagina.wait_for_selector("#aviso-rapido.visivel")
        self.assertIn("Chrome, Edge ou Safari", pagina.inner_text("#aviso-rapido"))

    # ---------- acessibilidade ----------
    def test_acessibilidade_basica(self):
        pagina = self.abrir("computador", voz_falsa=True)
        self.enviar(pagina, "quero morrer")
        pagina.click("#abrir-configuracoes")
        problemas = pagina.evaluate("""() => {
            const visivel = (el) => el.getClientRects().length > 0;
            const nome = (el) => (el.getAttribute('aria-label') || el.innerText || el.getAttribute('title') || '').trim();
            const p = [];
            document.querySelectorAll('button, a').forEach(el => { if (visivel(el) && !nome(el)) p.push('sem nome: ' + el.outerHTML.slice(0, 80)); });
            document.querySelectorAll('img').forEach(el => { if (!el.hasAttribute('alt')) p.push('img sem alt'); });
            document.querySelectorAll('input, select, textarea').forEach(el => {
                const rotulado = el.labels?.length || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
                if (!rotulado) p.push('campo sem rótulo: ' + (el.id || el.outerHTML.slice(0, 60)));
            });
            document.querySelectorAll('button').forEach(el => {
                const r = el.getBoundingClientRect();
                if (visivel(el) && (r.width < 24 || r.height < 24)) p.push('alvo de toque pequeno: ' + nome(el));
            });
            return p;
        }""")
        self.assertEqual(problemas, [])
        self.assertEqual(pagina.evaluate("document.activeElement.closest('dialog')?.id"), "configuracoes")  # foco foi pra janela
        pagina.keyboard.press("Escape")
        self.assertFalse(pagina.evaluate("document.getElementById('configuracoes').open"))

    def test_texto_maior(self):
        pagina = self.abrir("celular")
        pagina.click("#botao-menu")
        pagina.click("#abrir-configuracoes")
        pagina.check("#cfg-texto-grande")
        pagina.click("#fechar-config")
        resposta = self.enviar(pagina, "oi")
        tamanho = resposta.locator(".balao").evaluate("el => getComputedStyle(el).fontSize")
        self.assertEqual(tamanho, "18.5px")
        self.assertTrue(self.sem_rolagem_horizontal(pagina))


if __name__ == "__main__":
    unittest.main()
