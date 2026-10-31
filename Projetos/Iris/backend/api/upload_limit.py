"""Limite de tamanho do corpo do upload, aplicado ANTES de o arquivo ser lido.

Sem isto, o servidor gravaria o upload inteiro em disco temporário antes de a rota poder
recusá-lo. Aqui a recusa (413) acontece pelo cabeçalho Content-Length, quando existe, ou assim que
os bytes recebidos passam do limite (envios sem Content-Length / chunked).
"""

from __future__ import annotations

import json

from fastapi import HTTPException
from starlette.types import ASGIApp, Message, Receive, Scope, Send

# Folga para o envelope multipart e os campos de metadados que acompanham o arquivo.
FOLGA_MULTIPART = 1024 * 1024


class CorpoGrandeDemais(HTTPException):
    """Levantada durante a leitura do corpo; `main.py` a transforma na resposta 413 padrão."""

    def __init__(self) -> None:
        super().__init__(status_code=413)


class LimiteDeUpload:
    def __init__(self, app: ASGIApp, *, caminhos: set[str], max_bytes: int, max_mb: int) -> None:
        self.app = app
        self.caminhos = caminhos
        self.limite = max_bytes + FOLGA_MULTIPART
        self.corpo_413 = json.dumps(
            {
                "detail": f"O arquivo passa do limite de {max_mb} MB por documento.",
                "code": "file_too_large",
            },
            ensure_ascii=False,
        ).encode()

    async def _responder_413(self, send: Send) -> None:
        await send(
            {
                "type": "http.response.start",
                "status": 413,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"content-length", str(len(self.corpo_413)).encode()),
                    (b"connection", b"close"),
                ],
            }
        )
        await send({"type": "http.response.body", "body": self.corpo_413})

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope["path"] not in self.caminhos:
            await self.app(scope, receive, send)
            return

        for nome, valor in scope.get("headers", []):
            if nome == b"content-length":
                try:
                    declarado = int(valor)
                except ValueError:
                    declarado = 0
                if declarado > self.limite:
                    await self._responder_413(send)
                    return

        recebido = 0
        resposta_iniciada = False

        async def receber_com_limite() -> Message:
            nonlocal recebido
            mensagem = await receive()
            if mensagem["type"] == "http.request":
                recebido += len(mensagem.get("body", b""))
                if recebido > self.limite:
                    raise CorpoGrandeDemais()
            return mensagem

        async def enviar(mensagem: Message) -> None:
            nonlocal resposta_iniciada
            if mensagem["type"] == "http.response.start":
                resposta_iniciada = True
            await send(mensagem)

        try:
            await self.app(scope, receber_com_limite, enviar)
        except CorpoGrandeDemais:
            if not resposta_iniciada:
                await self._responder_413(send)
