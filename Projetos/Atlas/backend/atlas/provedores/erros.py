from __future__ import annotations


class ErroProvedor(Exception):
    """Falha de provedor externo. `motivo` é um código estável para a interface."""

    def __init__(self, motivo: str, mensagem: str, temporario: bool = False):
        super().__init__(mensagem)
        self.motivo = motivo  # cota | cota_diaria | chave | indisponivel | timeout | resposta_invalida | limite_local
        self.mensagem = mensagem
        self.temporario = temporario


MENSAGENS = {
    "cota": "A API atingiu o limite de requisições por minuto do plano gratuito.",
    "cota_diaria": "A cota diária do plano gratuito foi atingida.",
    "chave": "A chave de API foi recusada. Confira a variável de ambiente.",
    "indisponivel": "O serviço externo está indisponível no momento.",
    "timeout": "O serviço externo não respondeu a tempo.",
    "resposta_invalida": "O modelo devolveu uma resposta fora do formato esperado.",
    "limite_local": "O limite de chamadas configurado para esta simulação foi atingido.",
}
