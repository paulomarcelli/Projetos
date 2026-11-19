"""Redação de segredos antes de gravar qualquer texto.

A HELA guarda trechos de trabalho (comandos, erros, configurações), e é fácil um token
vir junto. Toda entrada passa por redact() antes de chegar ao banco: o segredo vira
um marcador [REDACTED:<tipo>] e o resto do texto fica intacto.

Ordem: primeiro os formatos conhecidos (mais precisos), depois as atribuições do tipo
password=..., e por último a heurística de alta entropia para o que sobrou.
A função é idempotente: aplicar duas vezes dá o mesmo texto.
"""

from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass, field

MARCADOR = "[REDACTED:{}]"


@dataclass
class RedactionResult:
    text: str
    findings: list[str] = field(default_factory=list)  # um tipo por trecho trocado

    @property
    def count(self) -> int:
        return len(self.findings)


# Formatos conhecidos: (tipo, regex). O trecho inteiro casado vira o marcador.
_PADROES: list[tuple[str, re.Pattern[str]]] = [
    ("private_key", re.compile(
        r"-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z0-9 ]*PRIVATE KEY-----|\Z)")),
    ("anthropic_key", re.compile(r"\bsk-ant-[A-Za-z0-9_\-]{20,}")),
    ("openai_key", re.compile(r"\bsk-(?!ant-)(?:proj-|svcacct-|admin-)?[A-Za-z0-9_\-]{20,}")),
    ("github_token", re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}")),
    ("github_token", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{22,}")),
    ("aws_access_key", re.compile(r"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b")),
    ("slack_token", re.compile(r"\bxox[abposr]-[A-Za-z0-9\-]{10,}")),
    ("jwt", re.compile(r"\beyJ[A-Za-z0-9_\-]{5,}\.eyJ[A-Za-z0-9_\-]{5,}\.[A-Za-z0-9_\-]{5,}")),
]

# URL com credencial: esquema://usuario:senha@host. Troca usuário e senha, mantém o resto.
_URL_CREDENCIAL = re.compile(r"(?i)\b([a-z][a-z0-9+.\-]{0,31}://)[^/\s:@\[\]]{1,256}:[^/\s\[\]]{1,256}@")

# "Authorization: Bearer <valor>": troca só o valor.
_BEARER = re.compile(r"(?i)(\bBearer\s+)([A-Za-z0-9._~+/=\-]{16,})")

# Atribuições: nome terminado em uma palavra sensível, seguido de = ou :.
# A busca começa pela palavra sensível (não pelo nome): tempo linear (revisão A-3).
# "max_tokens=1000" não casa porque depois de "token" vem "s", não o separador.
_ATRIBUICAO = re.compile(
    r"""(?ix)
    (?P<chave>pass(?:word|wd|phrase)?|pwd|secret|token|api[_\-]?key|access[_\-]?key|private[_\-]?key|auth|cookie|
       credentials?|[_\-]key)
    (?P<sep>["']?\s*[:=]\s*)
    (?P<valor>"[^"\n]{0,1024}"|'[^'\n]{0,1024}'|[^\s,;}\])]{1,1024})
    """
)

# "Authorization: Basic <base64>" e cabeçalho Cookie: troca só o valor.
_BASIC = re.compile(r"(?i)(\bBasic\s+)([A-Za-z0-9+/]{8,512}={0,2})")
_COOKIE = re.compile(r"(?im)^(\s*(?:set-)?cookie\s*:\s*)(\S[^\n]{0,4096})")

# Linha de comando (revisão A-4): curl -u user:senha, --password X, mysql -pSENHA e o .netrc.
_CLI_USER = re.compile(r"(?<!\S)(-u|--user)(\s+)([^\s:]{1,128}):([^\s@]{1,256})")
_CLI_FLAG = re.compile(r"(?i)(?<!\S)(--(?:password|passwd|pass|token|secret|api-key|access-key))(\s+)(?!-)(\S{1,512})")
_MYSQL_P = re.compile(r"(?i)\b((?:mysql|mysqldump|mysqladmin|mariadb)\b[^\n]{0,200}?\s-p)([^\s-][^\s]{0,255})")
_NETRC = re.compile(r"(?im)((?:\blogin\s+\S{1,128}\s+|^\s*)password\s+)(\S{1,512})")
_AWS_SECRET = re.compile(r"(?i)(\baws_secret(?:_access_key)?\b[\"']?\s*[:=]?\s*[\"']?)([A-Za-z0-9/+]{30,60})")

# Hexadecimal longo solto (48+, ex.: segredo de webhook de 64). uuid em hex (32), hash de commit (40) e hashes com
# rótulo (sha256, digest, md5, checksum) ficam de fora.
_HEX = re.compile(r"(?<![\w:@])[0-9a-fA-F]{48,128}(?!\w)")
_ROTULO_HASH = re.compile(r"(?i)(sha\d*|digest|md5|checksum|hash|commit)\W{0,3}$")

# Valores que não são segredo: tipos, nulos, referências a variáveis e marcadores já trocados.
_VALORES_INOFENSIVOS = re.compile(
    r"""(?ix)^(?:
        str|int|bool|bytes|none|null|nil|true|false|optional\[.*|string|undefined|
        \$.*|%.*|<.*>|\{\{.*|os\.environ.*|process\.env.*|env\(.*|getenv.*|
        \[REDACTED:.*|\*+|x+|\.\.\.|
    )$"""
)

# Candidatos a alta entropia: sequências longas sem espaço, barra ou ponto.
_CANDIDATO = re.compile(r"(?<![\w+=\-])[A-Za-z0-9_+=\-]{24,}(?![\w+=\-])")


def _entropia(texto: str) -> float:
    """Entropia de Shannon em bits por caractere."""
    n = len(texto)
    return -sum(c / n * math.log2(c / n) for c in Counter(texto).values())


def _parece_segredo(token: str, limiar: float) -> bool:
    # Precisa misturar letras e dígitos: nomes longos de função ficam de fora.
    if not (re.search(r"[A-Za-z]", token) and re.search(r"\d", token)):
        return False
    e = _entropia(token)
    # Hash de commit e UUID são hexadecimais: entropia máxima de 4 bits, abaixo do limiar.
    if e >= limiar:
        return True
    # Tokens curtos (24 a 31) têm entropia medida mais baixa mesmo sendo aleatórios (revisão A-4):
    # aceitar 3,6 bits quando misturam maiúscula, minúscula e dígito.
    mistura = re.search(r"[a-z]", token) and re.search(r"[A-Z]", token)
    return bool(mistura) and len(token) < 32 and e >= 3.6


def redact(text: str, entropy_threshold: float = 4.2, entropy_min_length: int = 24) -> RedactionResult:
    """Troca segredos por marcadores. Devolve o texto limpo e o tipo de cada troca."""
    if not text:
        return RedactionResult(text or "")
    achados: list[str] = []

    for tipo, padrao in _PADROES:
        def _troca(_m: re.Match[str], tipo: str = tipo) -> str:
            achados.append(tipo)
            return MARCADOR.format(tipo)
        text = padrao.sub(_troca, text)

    def _troca_url(m: re.Match[str]) -> str:
        achados.append("url_credentials")
        return m.group(1) + MARCADOR.format("url_credentials") + "@"
    text = _URL_CREDENCIAL.sub(_troca_url, text)

    def _troca_bearer(m: re.Match[str]) -> str:
        if m.group(2).startswith("[REDACTED"):
            return m.group(0)
        achados.append("bearer_token")
        return m.group(1) + MARCADOR.format("bearer_token")
    text = _BEARER.sub(_troca_bearer, text)

    def _troca_grupo(padrao: re.Pattern[str], tipo: str, grupo_valor: int) -> None:
        nonlocal text

        def _sub(m: re.Match[str]) -> str:
            valor = m.group(grupo_valor)
            if valor.startswith("[REDACTED") or _VALORES_INOFENSIVOS.match(valor):
                return m.group(0)
            achados.append(tipo)
            inicio, fim = m.span(grupo_valor)
            base = m.start(0)
            return m.group(0)[: inicio - base] + MARCADOR.format(tipo) + m.group(0)[fim - base:]
        text = padrao.sub(_sub, text)

    _troca_grupo(_BASIC, "basic_auth", 2)
    _troca_grupo(_COOKIE, "cookie", 2)
    _troca_grupo(_CLI_USER, "cli_password", 4)
    _troca_grupo(_CLI_FLAG, "cli_password", 3)
    _troca_grupo(_MYSQL_P, "cli_password", 2)
    _troca_grupo(_NETRC, "netrc_password", 2)
    _troca_grupo(_AWS_SECRET, "aws_secret", 2)

    def _troca_hex(m: re.Match[str]) -> str:
        token = m.group(0)
        antes = text_atual[max(0, m.start() - 16):m.start()]
        if len(token) == 40 or _ROTULO_HASH.search(antes) or not re.search(r"[a-fA-F]", token) \
                or not re.search(r"\d", token):
            return token
        achados.append("hex_secret")
        return MARCADOR.format("hex_secret")
    text_atual = text
    text = _HEX.sub(_troca_hex, text)

    def _troca_atribuicao(m: re.Match[str]) -> str:
        valor = m.group("valor")
        nucleo = valor[1:-1] if valor[:1] in "\"'" and valor[-1:] == valor[:1] and len(valor) >= 2 else valor
        if not nucleo.strip() or _VALORES_INOFENSIVOS.match(nucleo.strip()):
            return m.group(0)
        achados.append("credential_assignment")
        marcador = MARCADOR.format("credential_assignment")
        if nucleo is not valor:
            marcador = valor[0] + marcador + valor[-1]
        return m.group("chave") + m.group("sep") + marcador
    text = _ATRIBUICAO.sub(_troca_atribuicao, text)

    def _troca_entropia(m: re.Match[str]) -> str:
        token = m.group(0)
        if len(token) < entropy_min_length or not _parece_segredo(token, entropy_threshold):
            return token
        achados.append("high_entropy")
        return MARCADOR.format("high_entropy")
    text = _CANDIDATO.sub(_troca_entropia, text)

    return RedactionResult(text, achados)


def redact_value(valor: object, **kwargs: float) -> tuple[object, list[str]]:
    """Redige recursivamente as strings dentro de dicts e listas (para o campo metadata).

    Devolve o valor limpo e o tipo de cada trecho trocado.
    """
    if isinstance(valor, str):
        r = redact(valor, **kwargs)  # type: ignore[arg-type]
        return r.text, r.findings
    achados: list[str] = []
    if isinstance(valor, dict):
        saida = {}
        for k, v in valor.items():
            chave = k
            if isinstance(k, str):  # as chaves também (revisão A-4)
                rk = redact(k, **kwargs)  # type: ignore[arg-type]
                chave = rk.text
                achados.extend(rk.findings)
            saida[chave], tipos = redact_value(v, **kwargs)
            achados.extend(tipos)
        return saida, achados
    if isinstance(valor, list):
        lista = []
        for v in valor:
            novo, tipos = redact_value(v, **kwargs)
            lista.append(novo)
            achados.extend(tipos)
        return lista, achados
    return valor, achados
