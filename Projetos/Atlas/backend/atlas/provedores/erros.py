from __future__ import annotations


class ErroProvedor(Exception):
    """Falha de provedor externo. `motivo` é um código estável para a interface."""

    def __init__(self, motivo: str, mensagem: str, temporario: bool = False, espera_s: float = 0.0):
        super().__init__(mensagem)
        self.espera_s = espera_s  # tempo sugerido pelo provedor antes de tentar de novo (Retry-After)
        self.motivo = motivo  # cota | cota_diaria | chave | indisponivel | timeout | resposta_invalida | limite_local
        self.mensagem = mensagem
        self.temporario = temporario


MENSAGENS = {
    "cota": "O serviço atingiu o limite de requisições por minuto.",
    "cota_diaria": "A cota diária do plano gratuito foi atingida.",
    "chave": "A chave de API foi recusada. Confira a variável de ambiente.",
    "indisponivel": "O serviço externo está indisponível no momento.",
    "timeout": "O serviço externo não respondeu a tempo.",
    "resposta_invalida": "O modelo devolveu uma resposta fora do formato esperado.",
    "limite_local": "O limite de chamadas configurado para esta simulação foi atingido.",
}


import re as _re

_DIARIO = _re.compile(r"per\s*day|perday|daily|\(tpd\)|\(rpd\)|tokens per day|requests per day", _re.I)


def limite_diario(texto: str) -> bool:
    """Distingue cota diária de limite por minuto. Não basta procurar "day": "today" também casa."""
    return bool(_DIARIO.search(texto or ""))


def descrever(e: ErroProvedor) -> str:
    """Mensagem para o usuário: o texto padrão do motivo + o detalhe do provedor (ex.: como abrir o Ollama)."""
    padrao = MENSAGENS.get(e.motivo, "")
    detalhe = (e.mensagem or "").strip()
    if not padrao:
        return detalhe
    if not detalhe or detalhe in padrao:
        return padrao
    return f"{padrao} {detalhe if detalhe.endswith('.') else detalhe + '.'}"
