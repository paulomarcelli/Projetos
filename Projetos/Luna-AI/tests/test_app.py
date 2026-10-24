"""Testes do servidor e do motor com um modelo FALSO (sem internet, sem chave).

Eles verificam o fluxo do código: validação, segurança antes/depois da IA,
memória com consentimento e tratamento de erros. A qualidade real das respostas
do Gemini é avaliada em avaliar_respostas.py (precisa de chave).
"""

import io
import json
import logging
import sys
import unittest
from unittest import mock
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import app as servidor  # noqa: E402
import luna  # noqa: E402


class ModeloFalso:
    """Substitui luna.chamar_modelo e registra o que recebeu."""

    def __init__(self, saida=None, erro=None):
        self.saida, self.erro, self.chamadas = saida, erro, []

    def __call__(self, instrucoes, conteudos):
        self.chamadas.append((instrucoes, conteudos))
        if self.erro:
            raise self.erro
        return self.saida


def json_ia(resposta, lembrar=None, necessidade="acolhimento"):
    return json.dumps({"necessidade": necessidade, "resposta": resposta, "lembrar": lembrar})


class Base(unittest.TestCase):
    def setUp(self):
        self.original = luna.chamar_modelo
        self.cliente = servidor.app.test_client()

    def tearDown(self):
        luna.chamar_modelo = self.original

    def usar(self, **kw):
        luna.chamar_modelo = ModeloFalso(**kw)
        return luna.chamar_modelo

    def enviar(self, **corpo):
        return self.cliente.post("/chat", json=corpo)


class TestRotas(Base):
    def test_resposta_normal_com_historico(self):
        falso = self.usar(saida=json_ia("Entendo. O que aconteceu antes disso?"))
        r = self.enviar(mensagem="Minha amiga demorou pra responder",
                        historico=[{"papel": "usuario", "texto": "oi"}, {"papel": "luna", "texto": "Oi! Como você está?"}])
        self.assertEqual(r.status_code, 200)
        dados = r.get_json()
        self.assertEqual(dados["resposta"], "Entendo. O que aconteceu antes disso?")
        self.assertEqual(dados["seguranca"]["nivel"], "nenhum")
        self.assertEqual(dados["seguranca"]["contatos"], [])
        conteudos = falso.chamadas[0][1]
        self.assertEqual([c["role"] for c in conteudos], ["user", "model", "user"])  # contexto chega ao modelo
        self.assertEqual(r.headers["Cache-Control"], "no-store")

    def test_validacao(self):
        self.usar(saida=json_ia("ok"))
        self.assertEqual(self.enviar(mensagem="   ").status_code, 400)
        self.assertEqual(self.enviar(mensagem="x" * 4001).status_code, 400)
        self.assertEqual(self.enviar(mensagem="oi", historico=[{"papel": "sistema", "texto": "x"}]).status_code, 400)
        self.assertEqual(self.enviar(mensagem="oi", memoria=["x" * 301]).status_code, 400)
        self.assertEqual(self.cliente.post("/chat", data="nao e json").status_code, 400)

    def test_historico_longo_e_cortado(self):
        falso = self.usar(saida=json_ia("ok"))
        historico = [{"papel": "usuario" if i % 2 == 0 else "luna", "texto": f"m{i}"} for i in range(50)]
        self.assertEqual(self.enviar(mensagem="oi", historico=historico).status_code, 200)
        self.assertEqual(len(falso.chamadas[0][1]), luna.LIMITE_HISTORICO + 1)

    def test_risco_imediato_nao_depende_da_ia(self):
        falso = self.usar(saida=json_ia("isso nunca deveria aparecer"))
        dados = self.enviar(mensagem="vou me matar hoje").get_json()
        self.assertEqual(falso.chamadas, [])
        self.assertEqual(dados["seguranca"]["nivel"], "imediato")
        self.assertIn("192", dados["resposta"])
        self.assertIn("188", dados["resposta"])
        self.assertEqual([c["numero"] for c in dados["seguranca"]["contatos"]], ["188", "192"])

    def test_depois_do_texto_de_crise_a_ia_continua_em_modo_seguranca(self):
        falso = self.usar(saida=json_ia("Você está em segurança agora? Estou aqui.", necessidade="seguranca"))
        historico = [{"papel": "usuario", "texto": "vou me matar hoje"},
                     {"papel": "luna", "texto": luna.seguranca.RESPOSTAS_PADRAO["autolesao_imediato"]}]
        dados = self.enviar(mensagem="não sei, tô sozinho agora", historico=historico).get_json()
        self.assertEqual(len(falso.chamadas), 1)
        self.assertIn("MODO SEGURANÇA", falso.chamadas[0][0])
        self.assertIn("188", dados["resposta"])  # contatos acrescentados pelo código

    def test_risco_alto_com_ia_bloqueada_usa_texto_revisado(self):
        self.usar(saida=None)
        dados = self.enviar(mensagem="quero morrer").get_json()
        self.assertEqual(dados["resposta"], luna.seguranca.RESPOSTAS_PADRAO["autolesao"])

    def test_risco_alto_sem_chave_ainda_responde(self):
        self.usar(erro=luna.ErroModelo("sem_chave"))
        r = self.enviar(mensagem="meu marido me bate")
        self.assertEqual(r.status_code, 200)
        self.assertIn("190", r.get_json()["resposta"])

    def test_erros_sem_risco_viram_mensagens_claras(self):
        self.usar(erro=luna.ErroModelo("sem_chave"))
        r = self.enviar(mensagem="oi")
        self.assertEqual(r.status_code, 503)
        self.assertIn("GEMINI_API_KEY", r.get_json()["erro"])

        class Cota(Exception):
            code = 429
        self.usar(erro=Cota())
        self.assertEqual(self.enviar(mensagem="oi").status_code, 429)
        self.usar(saida="")
        self.assertEqual(self.enviar(mensagem="oi").status_code, 502)

    def test_limite_diario_gratuito_tem_mensagem_propria(self):
        class CotaDiaria(Exception):
            code = 429

        self.usar(erro=CotaDiaria("Generate content requests per day limit exceeded on Free Tier"))
        r = self.enviar(mensagem="Tive um dia difícil no trabalho")
        self.assertEqual(r.status_code, 429)
        self.assertIn("diário", r.get_json()["erro"])          # não diz "espere um minutinho"

    def test_log_nao_registra_o_texto(self):
        self.usar(erro=RuntimeError("detalhe com quero contar um segredo"))
        fluxo = io.StringIO()
        manipulador = logging.StreamHandler(fluxo)
        servidor.log.addHandler(manipulador)
        try:
            self.enviar(mensagem="meu segredo pessoal")
        finally:
            servidor.log.removeHandler(manipulador)
        self.assertNotIn("segredo", fluxo.getvalue())
        self.assertIn("falha", fluxo.getvalue())

    def test_cors_so_para_origens_locais(self):
        self.usar(saida=json_ia("ok"))
        r = self.cliente.options("/chat", headers={"Origin": "http://127.0.0.1:5500", "Access-Control-Request-Method": "POST"})
        self.assertEqual(r.headers.get("Access-Control-Allow-Origin"), "http://127.0.0.1:5500")
        r = self.cliente.post("/chat", json={"mensagem": "oi"}, headers={"Origin": "https://site-qualquer.com"})
        self.assertNotIn("Access-Control-Allow-Origin", r.headers)

    def test_serve_a_interface(self):
        r = self.cliente.get("/")
        self.assertEqual(r.status_code, 200)
        self.assertIn(b"LUNA", r.data)
        r.close()


class TestMemoria(Base):
    def test_sugestao_so_com_memoria_ativa(self):
        self.usar(saida=json_ia("Combinado.", lembrar="Prefere respostas curtas"))
        self.assertIsNone(self.enviar(mensagem="prefiro respostas curtas").get_json()["sugestao_memoria"])
        dados = self.enviar(mensagem="prefiro respostas curtas", memoria_ativa=True).get_json()
        self.assertEqual(dados["sugestao_memoria"], "Prefere respostas curtas")

    def test_memoria_chega_ao_modelo_como_dados(self):
        falso = self.usar(saida=json_ia("ok"))
        self.enviar(mensagem="oi", memoria=["Faz faculdade de ADS"], memoria_ativa=True)
        self.assertIn("- Faz faculdade de ADS", falso.chamadas[0][0])
        self.enviar(mensagem="oi", memoria=["Faz faculdade de ADS"], memoria_ativa=False)
        self.assertNotIn("Faz faculdade de ADS", falso.chamadas[1][0])

    def test_nada_e_lembrado_em_conversa_de_risco(self):
        self.usar(saida=json_ia("Você está em segurança? CVV 188.", lembrar="Pensa em morrer"))
        dados = self.enviar(mensagem="quero morrer", memoria_ativa=True).get_json()
        self.assertIsNone(dados["sugestao_memoria"])


class TestRepeticaoDeErrosTemporarios(unittest.TestCase):
    """O Gemini às vezes responde 503 ("alta demanda"); uma nova tentativa costuma resolver."""

    class Erro(Exception):
        def __init__(self, code):
            super().__init__(f"erro {code}")
            self.code = code

    def rodar(self, erros):
        chamadas = []

        def gerar(**kw):
            chamadas.append(1)
            if len(chamadas) <= len(erros):
                raise self.Erro(erros[len(chamadas) - 1])
            return type("R", (), {"text": "ok"})()

        cliente = type("C", (), {"models": type("M", (), {"generate_content": staticmethod(gerar)})()})()
        antes = luna._cliente
        luna._cliente = cliente
        try:
            with mock.patch.dict("os.environ", {"GEMINI_API_KEY": "teste"}), mock.patch("time.sleep") as dormir:
                try:
                    return luna.chamar_modelo("instrucoes", []), len(chamadas), dormir.call_count
                except Exception as erro:
                    return erro, len(chamadas), dormir.call_count
        finally:
            luna._cliente = antes

    def test_503_passa_na_terceira_tentativa(self):
        self.assertEqual(self.rodar([503, 503]), ("ok", 3, 2))

    def test_503_persistente_sobe_o_erro_depois_de_tres_tentativas(self):
        resultado, chamadas, _ = self.rodar([503, 503, 503])
        self.assertIsInstance(resultado, self.Erro)
        self.assertEqual(chamadas, 3)

    def test_cota_e_chave_nao_sao_repetidas(self):
        for codigo in (429, 401, 403):
            resultado, chamadas, pausas = self.rodar([codigo])
            self.assertIsInstance(resultado, self.Erro)
            self.assertEqual((chamadas, pausas), (1, 0), codigo)


class TestInterpretar(unittest.TestCase):
    def test_formatos(self):
        self.assertEqual(luna.interpretar('```json\n{"resposta": "oi", "lembrar": null}\n```')["resposta"], "oi")
        self.assertEqual(luna.interpretar("Texto solto sem JSON")["resposta"], "Texto solto sem JSON")
        self.assertIsNone(luna.interpretar('{"resposta": ""}'))
        self.assertIsNone(luna.interpretar('{"resposta": "corta'))
        self.assertIsNone(luna.interpretar(None))

    def test_modo_voz_e_sinais_mudam_as_instrucoes(self):
        av = luna.seguranca.avaliar("não conta pra ninguém, quero parar a terapia")
        texto = luna.montar_instrucoes(av, [], False, True)
        self.assertIn("MODO VOZ", texto)
        self.assertIn("pediu segredo", texto)
        self.assertIn("parar ou mudar um tratamento", texto)


if __name__ == "__main__":
    unittest.main()
