"""Armazenamento dos PDFs em disco.

Regras de segurança:
- O nome do arquivo enviado NUNCA vira caminho. O arquivo é salvo como `<id[:2]>/<id>.pdf`,
  onde `id` é o UUID gerado para o documento. Isso torna path traversal impossível por
  construção; ainda assim, toda chave é validada e resolvida dentro da raiz.
- O caminho absoluto nunca sai deste módulo para as respostas da API.
- Escrita em duas etapas: primeiro em `.tmp/`, depois `os.replace` (atômico no mesmo disco).
- Remoção em duas etapas: o arquivo vai para `.trash/` antes do commit no banco; se o commit
  falhar, ele volta para o lugar. Só depois do commit o arquivo é apagado de vez.
"""

from __future__ import annotations

import contextlib
import os
import re
import uuid
from pathlib import Path

_CHAVE_VALIDA = re.compile(r"^[0-9a-f]{2}/[0-9a-f]{32}\.pdf$")


class StorageError(RuntimeError):
    """Falha de disco. A mensagem é genérica: não revela caminhos."""


class Armazenamento:
    def __init__(self, raiz: Path) -> None:
        self.raiz = Path(raiz).resolve()

    @property
    def _tmp(self) -> Path:
        return self.raiz / ".tmp"

    @property
    def _lixeira(self) -> Path:
        return self.raiz / ".trash"

    def preparar(self) -> None:
        """Cria a raiz e as pastas internas (permissão só do dono)."""
        try:
            for pasta in (self.raiz, self._tmp, self._lixeira):
                pasta.mkdir(mode=0o700, parents=True, exist_ok=True)
        except OSError as erro:
            raise StorageError("não foi possível preparar o diretório de armazenamento") from erro

    def novo_temporario(self) -> Path:
        self.preparar()
        return self._tmp / f"{uuid.uuid4().hex}.part"

    @staticmethod
    def chave_para(documento_id: uuid.UUID) -> str:
        h = documento_id.hex
        return f"{h[:2]}/{h}.pdf"

    def caminho(self, chave: str) -> Path:
        """Caminho absoluto de uma chave, recusando qualquer coisa fora do formato esperado."""
        if not _CHAVE_VALIDA.fullmatch(chave):
            raise StorageError("chave de armazenamento inválida")
        destino = (self.raiz / chave).resolve()
        if not destino.is_relative_to(self.raiz):
            raise StorageError("chave de armazenamento fora do diretório")
        return destino

    def instalar(self, temporario: Path, chave: str) -> None:
        """Move o arquivo temporário para o lugar definitivo."""
        destino = self.caminho(chave)
        try:
            destino.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
            os.replace(temporario, destino)
        except OSError as erro:
            raise StorageError("não foi possível gravar o arquivo") from erro

    def existe(self, chave: str) -> bool:
        return self.caminho(chave).is_file()

    def mover_para_lixeira(self, chave: str) -> Path | None:
        """Tira o arquivo do lugar (reversível). Devolve onde ele ficou, ou None se não existia."""
        origem = self.caminho(chave)
        if not origem.exists():
            return None
        self.preparar()
        destino = self._lixeira / f"{origem.stem}.{uuid.uuid4().hex}.pdf"
        try:
            os.replace(origem, destino)
        except OSError as erro:
            raise StorageError("não foi possível remover o arquivo") from erro
        return destino

    def restaurar(self, da_lixeira: Path, chave: str) -> None:
        self.instalar(da_lixeira, chave)

    @staticmethod
    def descartar(caminho: Path | None) -> None:
        """Apaga de vez (temporários e itens da lixeira). Nunca levanta erro."""
        if caminho is None:
            return
        with contextlib.suppress(OSError):
            caminho.unlink(missing_ok=True)
