"""Voz em tempo real: sessão efêmera, segurança da fala e CORS (OpenAI simulada, sem internet)."""

import json
import os
import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import app as servidor  # noqa: E402
import luna  # noqa: E402
import voz_tempo_real  # noqa: E402


class Resposta:
    def __init__(self, status, dados):
        self.status_code = status
        self._dados = dados

    def json(self):
        return self._dados


class TestSessao(unittest.TestCase):
    def setUp(self):
        self.env = mock.patch.dict(os.environ, {"OPENAI_REALTIME_API_KEY": "sk-secreta"}, clear=False)
        self.env.start()
        os.environ.pop("LUNA_VOZ_TEMPO_REAL", None)
        voz_tempo_real._pedidos.clear()
        self.cliente = servidor.app.test_client()

    def tearDown(self):
        self.env.stop()

    def test_devolve_so_a_chave_efemera(self):
        enviado = {}

        def post(url, **kw):
            enviado.update(kw, url=url)
            return Resposta(200, {"value": "ek_123", "expires_at": 99})

        with mock.patch("httpx.post", post):
            r = self.cliente.post("/voz/sessao", json={"memoria": ["gosto de caminhar"], "memoria_ativa": True})
        self.assertEqual(r.status_code, 200)
        corpo = r.get_json()
        self.assertEqual(corpo["chave"], "ek_123")
        self.assertTrue(corpo["url_chamada"].endswith("/realtime/calls"))
        self.assertNotIn("sk-secreta", json.dumps(corpo))                 # a chave secreta nunca vai ao navegador
        self.assertEqual(enviado["headers"]["Authorization"], "Bearer sk-secreta")
        sessao = enviado["json"]["session"]
        self.assertEqual(sessao["type"], "realtime")
        self.assertIn(luna.INSTRUCOES[:200], sessao["instructions"])      # personalidade da Luna presente
        self.assertIn("gosto de caminhar", sessao["instructions"])
        self.assertIn("TEMPO REAL", sessao["instructions"])
        self.assertLessEqual(enviado["json"]["expires_after"]["seconds"], 600)
        self.assertEqual(r.headers.get("Cache-Control"), "no-store")

    def test_sem_chave_responde_503(self):
        os.environ.pop("OPENAI_REALTIME_API_KEY")
        with mock.patch.dict(os.environ, {"LUNA_OPENAI_URL": "https://revenda.example/v1/chat/completions", "OPENAI_API_KEY": "x"}):
            self.assertFalse(voz_tempo_real.disponivel())                 # chave de revenda não serve para o Realtime
            r = self.cliente.post("/voz/sessao", json={})
        self.assertEqual(r.status_code, 503)

    def test_chave_recusada_vira_mensagem_clara(self):
        with mock.patch("httpx.post", lambda url, **kw: Resposta(401, {})):
            r = self.cliente.post("/voz/sessao", json={})
        self.assertEqual(r.status_code, 503)
        self.assertIn("recusada", r.get_json()["erro"])

    def test_limite_por_ip(self):
        with mock.patch("httpx.post", lambda url, **kw: Resposta(200, {"value": "ek"})):
            codigos = [self.cliente.post("/voz/sessao", json={}).status_code for _ in range(voz_tempo_real.LIMITE_POR_HORA + 1)]
        self.assertEqual(codigos[-1], 429)
        self.assertTrue(all(c == 200 for c in codigos[:-1]))

    def test_memoria_invalida(self):
        r = self.cliente.post("/voz/sessao", json={"memoria": "não é lista"})
        self.assertEqual(r.status_code, 400)

    def test_status_informa_disponibilidade(self):
        self.assertTrue(self.cliente.get("/status").get_json()["voz_tempo_real"])


class TestAvaliar(unittest.TestCase):
    def setUp(self):
        self.cliente = servidor.app.test_client()

    def test_risco_imediato_traz_contatos_e_texto_seguro(self):
        r = self.cliente.post("/voz/avaliar", json={"texto": "vou me matar agora", "anteriores": []})
        d = r.get_json()
        self.assertEqual(d["nivel"], "imediato")
        self.assertTrue(d["contatos"])
        self.assertIn("188", d["texto_seguro"])
        self.assertTrue(d["orientacao"])

    def test_fala_comum_sem_orientacao(self):
        d = self.cliente.post("/voz/avaliar", json={"texto": "tive um dia cansativo"}).get_json()
        self.assertEqual(d["nivel"], "nenhum")
        self.assertEqual(d["orientacao"], "")
        self.assertIsNone(d["texto_seguro"])

    def test_texto_vazio(self):
        self.assertEqual(self.cliente.post("/voz/avaliar", json={"texto": " "}).status_code, 400)


class TestCors(unittest.TestCase):
    def test_origem_publicada_so_quando_listada(self):
        cliente = servidor.app.test_client()
        origem = "https://paulomarcelli.github.io"
        with mock.patch.object(servidor, "ORIGENS_PERMITIDAS", set()):
            r = cliente.get("/status", headers={"Origin": origem})
            self.assertIsNone(r.headers.get("Access-Control-Allow-Origin"))
        with mock.patch.object(servidor, "ORIGENS_PERMITIDAS", {origem}):
            r = cliente.get("/status", headers={"Origin": origem})
            self.assertEqual(r.headers.get("Access-Control-Allow-Origin"), origem)
            r = cliente.get("/status", headers={"Origin": "https://outro.github.io"})
            self.assertIsNone(r.headers.get("Access-Control-Allow-Origin"))


if __name__ == "__main__":
    unittest.main()
