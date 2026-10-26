"""Hospedagem pública: limite de mensagens por IP no /chat."""

import sys
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import app as servidor  # noqa: E402
import luna  # noqa: E402


class TestLimiteChat(unittest.TestCase):
    def setUp(self):
        servidor._pedidos_chat.clear()
        self.cliente = servidor.app.test_client()

    def test_bloqueia_depois_do_limite(self):
        resposta = {"fontes": [], "resposta": "oi", "seguranca": {"nivel": "nenhum", "categorias": [], "contatos": []},
                    "sugestao_memoria": None, "necessidade": "acolhimento"}
        with mock.patch.object(servidor, "LIMITE_CHAT_HORA", 3), mock.patch.object(luna, "responder", lambda **kw: resposta):
            codigos = [self.cliente.post("/chat", json={"mensagem": "oi"}).status_code for _ in range(4)]
        self.assertEqual(codigos, [200, 200, 200, 429])

    def test_ips_diferentes_tem_limites_separados(self):
        with mock.patch.object(servidor, "LIMITE_CHAT_HORA", 1):
            self.assertTrue(servidor.dentro_do_limite_chat("1.1.1.1"))
            self.assertFalse(servidor.dentro_do_limite_chat("1.1.1.1"))
            self.assertTrue(servidor.dentro_do_limite_chat("2.2.2.2"))


if __name__ == "__main__":
    unittest.main()
