"""Assinatura do backup (HMAC-SHA256) para o `hela import --trusted`.

Por que: com --trusted o arquivo decide qualidade, confiança, contadores, status e origem. O risco
não é o Paulo importar o próprio backup, é um arquivo que não é dele entrar como confiável (por
exemplo, uma injeção que manda o Claude baixar um JSON e rodar o import). A assinatura com uma chave
que só existe nesta instalação garante que o arquivo saiu do `hela export` daqui e não mudou.

- Chave: $HELA_HOME/backup.key, 32 bytes de secrets.token_bytes, permissão 0600, criada no primeiro
  export. Para mudar de máquina, copia-se a chave junto, de propósito.
- O que é assinado: o documento inteiro sem o campo "signature", em JSON canônico (chaves ordenadas,
  sem espaços, UTF-8).
- Conferência com hmac.compare_digest.

Módulo puro (só biblioteca padrão).
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import secrets
from pathlib import Path
from typing import Any, Optional

KEY_FILE = "backup.key"
ALG = "HMAC-SHA256"


def _canonico(doc: dict[str, Any]) -> bytes:
    sem = {k: v for k, v in doc.items() if k != "signature"}
    return json.dumps(sem, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def key_id(chave: bytes) -> str:
    """Identificador curto da chave (não revela a chave): os 16 primeiros hex do sha256 dela."""
    return hashlib.sha256(chave).hexdigest()[:16]


def load_key(home: Path) -> Optional[bytes]:
    caminho = Path(home) / KEY_FILE
    if not caminho.is_file():
        return None
    chave = caminho.read_bytes()
    return chave if len(chave) == 32 else None


def load_or_create_key(home: Path) -> bytes:
    """Lê a chave ou cria uma nova (0600 desde a criação: O_EXCL + modo no open, sem janela aberta)."""
    existente = load_key(home)
    if existente is not None:
        return existente
    caminho = Path(home) / KEY_FILE
    caminho.parent.mkdir(parents=True, exist_ok=True)
    try:
        fd = os.open(caminho, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except FileExistsError:  # outro processo criou ao mesmo tempo
        chave = load_key(home)
        if chave is None:
            raise ValueError(f"a chave de backup em {caminho} está corrompida (precisa ter 32 bytes)") from None
        return chave
    with os.fdopen(fd, "wb") as f:
        f.write(secrets.token_bytes(32))
    if os.name == "posix":
        os.chmod(caminho, 0o600)
    return load_or_create_key(home)


def sign(doc: dict[str, Any], chave: bytes) -> dict[str, Any]:
    """Devolve uma cópia do documento com o campo signature."""
    valor = hmac.new(chave, _canonico(doc), hashlib.sha256).hexdigest()
    return {**{k: v for k, v in doc.items() if k != "signature"},
            "signature": {"alg": ALG, "key_id": key_id(chave), "value": valor}}


def verify(doc: Any, chave: Optional[bytes]) -> bool:
    if chave is None or not isinstance(doc, dict):
        return False
    assinatura = doc.get("signature")
    if not isinstance(assinatura, dict) or assinatura.get("alg") != ALG:
        return False
    valor = assinatura.get("value")
    if not isinstance(valor, str):
        return False
    esperado = hmac.new(chave, _canonico(doc), hashlib.sha256).hexdigest()
    return hmac.compare_digest(valor, esperado)
