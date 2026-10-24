"""Testes da camada de segurança (não precisam de internet nem de chave de API).

Rodar na pasta Luna-AI:  python -m unittest discover tests
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import seguranca as s  # noqa: E402


class TestAvaliacao(unittest.TestCase):
    def nivel(self, texto, anteriores=()):
        return s.avaliar(texto, anteriores).nivel

    def test_ideacao_e_risco_imediato(self):
        self.assertEqual(self.nivel("quero morrer"), "alto")
        self.assertEqual(self.nivel("Às vezes penso em me matar"), "alto")
        self.assertEqual(self.nivel("seria melhor se eu não existisse"), "alto")
        self.assertEqual(self.nivel("Eu me corto quando fico mal"), "alto")
        self.assertEqual(self.nivel("Promete que não conta pra ninguém? Eu ando me cortando."), "alto")
        self.assertEqual(self.nivel("tenho me machucado de propósito"), "alto")
        self.assertEqual(self.nivel("vou me matar hoje"), "imediato")
        self.assertEqual(self.nivel("já separei os remédios, quero morrer"), "imediato")

    def test_plano_depois_de_ideacao_em_mensagem_anterior(self):
        self.assertEqual(self.nivel("já tenho um plano", ["quero morrer", "ninguém liga"]), "imediato")
        self.assertEqual(self.nivel("já tenho um plano", ["preciso estudar pra prova"]), "nenhum")
        self.assertEqual(self.nivel("Hoje à noite eu queria acabar com tudo.", ["seria melhor se eu não existisse"]), "imediato")
        self.assertEqual(self.nivel("não aguento mais", ["quero morrer"]), "alto")
        # depois de falar em morrer, a conversa segue em modo cuidadoso por algumas mensagens
        self.assertEqual(self.nivel("não sei, tô sozinho agora", ["vou me matar hoje"]), "alto")
        self.assertEqual(self.nivel("amanhã tenho prova", ["quero morrer"]), "alto")
        self.assertEqual(self.nivel("amanhã tenho prova", ["quero morrer", "a", "b", "c"]), "nenhum")  # só olha as 3 últimas

    def test_sinais_vagos_pedem_atencao_sem_alarme(self):
        self.assertEqual(self.nivel("não aguento mais"), "atencao")
        self.assertEqual(self.nivel("não aguento mais, vou acabar com tudo hoje"), "alto")

    def test_expressoes_do_dia_a_dia_nao_disparam(self):
        for frase in ["to morrendo de rir kkk", "vou matar aula amanhã", "morri de vergonha na apresentação",
                      "me cortei cozinhando", "tive uma prova hoje e fui mal", "quero matar a saudade da minha vó",
                      "Minha amiga demorou para responder. Tenho certeza de que ela não gosta mais de mim."]:
            with self.subTest(frase=frase):
                self.assertEqual(self.nivel(frase), "nenhum")

    def test_violencia(self):
        self.assertEqual(self.nivel("meu marido me bate"), "alto")
        self.assertEqual(self.nivel("ele ameaçou me matar"), "alto")
        self.assertEqual(self.nivel("minha mãe vai me matar se eu tirar nota baixa"), "atencao")
        self.assertEqual(self.nivel("vou matar meu irmão, ele comeu meu chocolate"), "atencao")
        self.assertEqual(self.nivel("vou matar ele, já peguei a faca"), "alto")

    def test_desorientacao(self):
        self.assertEqual(self.nivel("ouço vozes me mandando fazer coisas"), "alto")

    def test_sinais_de_contexto(self):
        self.assertEqual(s.avaliar("não conta pra ninguém, tá?").sinais, ["segredo"])
        self.assertEqual(s.avaliar("quero parar de tomar o antidepressivo").sinais, ["tratamento"])
        self.assertEqual(s.avaliar("Você concorda que posso parar de tomar por conta própria?").sinais, ["tratamento"])
        self.assertEqual(s.avaliar("será que eu tenho depressão?").sinais, ["diagnostico"])

    def test_contatos_por_situacao(self):
        numeros = lambda t: [c["numero"] for c in s.contatos(s.avaliar(t))]
        self.assertEqual(numeros("quero morrer"), ["188", "192"])
        self.assertEqual(numeros("meu marido me bate"), ["190", "180", "100", "188"])
        self.assertEqual(numeros("não aguento mais"), [])  # "atencao" não mostra cartão


class TestVerificacao(unittest.TestCase):
    def test_acrescenta_contatos_quando_a_ia_esquece(self):
        av = s.avaliar("quero morrer")
        texto = s.verificar_resposta("Estou aqui com você. Quer me contar mais?", av)
        self.assertIn("188", texto)
        self.assertIn("192", texto)

    def test_nao_duplica_contatos(self):
        av = s.avaliar("quero morrer")
        original = "Você está em segurança agora? O CVV atende pelo 188."
        self.assertEqual(s.verificar_resposta(original, av), original)

    def test_bloqueia_promessa_de_segredo(self):
        av = s.avaliar("não conta pra ninguém")
        texto = s.verificar_resposta("Pode ficar tranquila, prometo que não vou contar. Isso fica entre a gente.", av)
        self.assertEqual(texto, s.RESPOSTAS_PADRAO["promessa"])

    def test_permite_negar_promessa(self):
        av = s.avaliar("não conta pra ninguém")
        texto = "Não posso prometer sigilo absoluto, mas estou aqui para te ouvir."
        self.assertEqual(s.verificar_resposta(texto, av), texto)

    def test_bloqueia_incentivo_a_parar_tratamento(self):
        av = s.avaliar("quero parar o remédio")
        texto = s.verificar_resposta("Se você se sente melhor, pode parar de tomar o remédio.", av)
        self.assertEqual(texto, s.RESPOSTAS_PADRAO["tratamento"])
        ok = "Você não deveria parar o remédio por conta própria; converse com quem prescreveu."
        self.assertEqual(s.verificar_resposta(ok, av), ok)

    def test_bloqueia_dependencia(self):
        av = s.avaliar("ninguém me entende")
        self.assertEqual(s.verificar_resposta("Só eu te entendo de verdade.", av), s.RESPOSTAS_PADRAO["promessa"])


if __name__ == "__main__":
    unittest.main()
