"""Validador estático de scripts (Execution Intelligence).

A HELA **nunca executa** um script. Este módulo só lê o texto e aponta o que exige um humano antes
de qualquer execução: apagar recursivo, baixar e executar, privilégio, destruir disco, permissão
aberta, execução dinâmica, rede para fora da lista de hosts, caminhos de credenciais, persistência e
apagar histórico.

- Shell e PowerShell: expressões regulares por linha lógica (continuações com barra invertida juntas).
- Python: leitura da AST (não regex), com os apelidos de import resolvidos; as strings do código
  também passam pelas regras de shell e de caminhos.

Por regras: pega os padrões conhecidos, não todos. Por isso qualquer script não aprovado continua
saindo como "exige autorização humana", com ou sem achados.

Módulo puro: sem numpy, networkx ou pydantic.
"""

from __future__ import annotations

import ast
import hashlib
import re
from dataclasses import asdict, dataclass, field
from typing import Iterable, Optional

LANGUAGES = ("shell", "powershell", "python")
LANGUAGE_ALIASES = {"bash": "shell", "sh": "shell", "zsh": "shell", "pwsh": "powershell", "ps1": "powershell",
             "py": "python", "python3": "python"}
DEFAULT_ALLOWED_HOSTS = ("localhost", "127.0.0.1", "::1")


@dataclass(frozen=True)
class Finding:
    rule: str
    severity: str     # critical | high | medium
    line: int
    reason: str


@dataclass
class ValidationReport:
    ok: bool
    language: str
    sha256: str
    findings: list[Finding] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {"ok": self.ok, "language": self.language, "sha256": self.sha256,
                "findings": [asdict(f) for f in self.findings], "rules": sorted({f.rule for f in self.findings})}


def script_sha256(script: str) -> str:
    """sha256 dos bytes exatos (UTF-8). Um espaço, um CRLF ou um BOM a mais mudam o hash."""
    return hashlib.sha256(script.encode("utf-8")).hexdigest()


# --- detecção de linguagem ----------------------------------------------------------------
_PS_CMDLET = re.compile(r"\b(Get|Set|New|Remove|Invoke|Start|Stop|Write|Out|Copy|Move|Register)-[A-Z]\w+")


def detect_language(script: str, hint: Optional[str] = None) -> str:
    if hint:
        h = hint.strip().lower()
        h = LANGUAGE_ALIASES.get(h, h)
        if h in LANGUAGES:
            return h
    primeira = script.lstrip().splitlines()[0] if script.strip() else ""
    if primeira.startswith("#!"):
        if "python" in primeira:
            return "python"
        if "pwsh" in primeira or "powershell" in primeira:
            return "powershell"
        return "shell"
    if _PS_CMDLET.search(script) or "$env:" in script:
        return "powershell"
    try:
        arvore = ast.parse(script)
    except (SyntaxError, ValueError):
        return "shell"
    marcas = (ast.Import, ast.ImportFrom, ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)
    return "python" if any(isinstance(n, marcas) for n in ast.walk(arvore)) else "shell"


# --- regras de texto (shell, PowerShell e strings do Python) -------------------------------
_R = re.IGNORECASE
_DOWNLOAD_EXEC = [
    re.compile(r"\b(curl|wget|fetch)\b[^|\n]*\|\s*(sudo\s+)?(ba|z|da|k)?sh\b"),
    re.compile(r"\b(curl|wget)\b[^|\n]*\|\s*(sudo\s+)?(python[0-9.]*|perl|ruby|node)\b"),
    re.compile(r"\b(ba|z)?sh\s+<\(\s*(curl|wget)\b"),
    re.compile(r"\b(ba|z)?sh\s+-c\s+[\"']?\$\(\s*(curl|wget)\b"),
    re.compile(r"\b(iex|invoke-expression)\b.*\b(iwr|irm|invoke-webrequest|invoke-restmethod|downloadstring)\b", _R),
    re.compile(r"\b(iwr|irm|invoke-webrequest|invoke-restmethod)\b.*\|\s*(iex|invoke-expression)\b", _R),
]
_PRIVILEGE = [
    re.compile(r"(^|[;&|(]\s*|\s)(sudo|doas)\s"),
    re.compile(r"(^|[;&|(]\s*)su(\s+-|\s+root\b|$)"),
    re.compile(r"\bset-executionpolicy\b", _R),
    re.compile(r"-verb\s+runas\b", _R),
]
_DISK = [
    re.compile(r"\bmkfs(\.\w+)?\b"),
    re.compile(r"\bdd\b[^\n]*\bof="),
    re.compile(r"\b(fdisk|wipefs|parted|shred)\b"),
    re.compile(r">\s*/dev/(sd|nvme|hd|disk)\w*"),
    re.compile(r":\(\)\s*\{\s*:\|:&\s*\};:"),
]
_PERMISSIONS = [
    re.compile(r"\bchmod\s+(-\w+\s+)*(0?777|a\+rwx|ugo\+rwx|o\+w)\b"),
    re.compile(r"\bchown\s+(-\w*\s+)*-\w*R"),
]
_DYNAMIC = [
    re.compile(r"(^|[;&|(]\s*)eval\s"),
    re.compile(r"\bbase64\s+(-d|--decode)\b[^\n]*\|\s*(ba|z)?sh\b"),
    re.compile(r"\b(python[0-9.]*|perl|ruby|node)\s+-(c|e)\s+[\"']?\$"),
    re.compile(r"(^|[;&|(]\s*)exec\s+[\"']?\$"),
    re.compile(r"\bsource\s+<\("),
    re.compile(r"(^|[;&|(]\s*)(iex|invoke-expression)\b", _R),
]
_CREDENTIALS = [
    re.compile(r"\.ssh\b"), re.compile(r"\bid_(rsa|dsa|ecdsa|ed25519)\b"), re.compile(r"\.aws/(credentials|config)\b"),
    re.compile(r"\.gnupg\b"), re.compile(r"\.netrc\b"), re.compile(r"\.npmrc\b"), re.compile(r"\.pypirc\b"),
    re.compile(r"\.git-credentials\b"), re.compile(r"\.docker/config\.json\b"), re.compile(r"\.kube/config\b"),
    re.compile(r"\.claude\.json\b"), re.compile(r"\.claude/settings(\.local)?\.json\b"),
    re.compile(r"(~|\$HOME|\$\{HOME\}|/home/[^/\s]+|/root)/\.hela\b"), re.compile(r"/etc/(shadow|sudoers|passwd)\b"),
    re.compile(r"(^|[\s/\"'=<>(])\.env(\.[\w-]+)?\b"),
]
_PERSISTENCE = [
    re.compile(r"\bcrontab\b"),
    re.compile(r"(>>?|\btee\b(\s+-a)?)\s*[\"']?(~|\$HOME|\$\{HOME\})?/?\.(bashrc|bash_profile|zshrc|zprofile|profile)\b"),
    re.compile(r"\bsystemctl\s+(--user\s+)?enable\b"), re.compile(r"\blaunchctl\s+load\b"),
    re.compile(r"\bschtasks\s+/create\b", _R), re.compile(r"\bregister-scheduledtask\b", _R),
]
_HISTORY = [
    re.compile(r"\bhistory\s+-c\b"), re.compile(r"\bunset\s+HISTFILE\b"), re.compile(r"\bHISTSIZE=0\b"),
    re.compile(r"\bHISTFILE=/dev/null\b"), re.compile(r"\bset\s+\+o\s+history\b"),
    re.compile(r"(>|\brm\b[^\n]*)\s*\S*\.bash_history\b"), re.compile(r"\bclear-history\b", _R),
]
_TRUSTED_IMPORT = [re.compile(r"\bhela\s+import\b[^\n]*--trusted\b")]
_NETWORK_CMD = re.compile(
    r"(^|[;&|(\s])(curl|wget|nc|ncat|netcat|socat|scp|rsync|sftp|ftp|telnet|ssh|iwr|irm|invoke-webrequest|"
    r"invoke-restmethod)\b", _R)
_UPLOAD = re.compile(r"(\s-d\b|\s--data\b|\s-F\b|\s-T\b|--upload-file|-X\s*(POST|PUT|PATCH)|-Method\s+(Post|Put))", _R)
_URL_HOST = re.compile(r"\b[a-z][a-z0-9+.-]*://(?:[^@/\s\"']*@)?(\[[^\]]+\]|[^/:\s\"'?#]+)", _R)
_SCP_HOST = re.compile(r"\b[\w.-]+@([\w.-]+):")
_NC_HOST = re.compile(r"\b(nc|ncat|netcat|telnet)\s+(?:-\w+\s+)*([\w.-]+)\s+\d+", _R)


def _rm_recursivo(linha: str) -> Optional[Finding]:
    """rm com -r e -f (ou --recursive/--force); crítico se o alvo for raiz, home, curinga ou variável."""
    for m in re.finditer(r"(?:^|[;&|(]\s*|\s)(?:sudo\s+)?rm\s+([^;&|\n]*)", linha):
        tokens = m.group(1).split()
        flags = "".join(t.lstrip("-") for t in tokens if t.startswith("-") and not t.startswith("--"))
        longas = {t for t in tokens if t.startswith("--")}
        recursivo = "r" in flags.lower() or "--recursive" in longas
        forcado = "f" in flags or "--force" in longas
        if recursivo and forcado:
            alvos = [t.strip("\"'") for t in tokens if not t.startswith("-")]
            perigoso = any(a in {"/", "/*", "~", "~/", "*", ".", "..", "$HOME", "${HOME}"} or a.startswith("$")
                           or a.startswith("/*") for a in alvos) or not alvos
            return Finding("rm_recursive", "critical" if perigoso else "high", 0,
                           "apaga recursivamente e sem confirmação" + (" um alvo amplo ou vindo de variável"
                                                                       if perigoso else ""))
    if re.search(r"\bremove-item\b(?=.*-recurse)(?=.*-force)", linha, _R) or \
            re.search(r"\b(rmdir|rd)\s+/s\b", linha, _R):
        return Finding("rm_recursive", "high", 0, "apaga pastas recursivamente e sem confirmação")
    return None


def _hosts(linha: str) -> list[str]:
    hosts = [h.strip("[]").lower() for h in _URL_HOST.findall(linha)]
    hosts += [h.lower() for h in _SCP_HOST.findall(linha)]
    hosts += [m.group(2).lower() for m in _NC_HOST.finditer(linha)]
    return hosts


def _regras_de_texto(linha: str, n: int, allowed: Iterable[str]) -> list[Finding]:
    achados: list[Finding] = []
    rm = _rm_recursivo(linha)
    if rm:
        achados.append(Finding(rm.rule, rm.severity, n, rm.reason))

    def checar(padroes: list[re.Pattern[str]], regra: str, sev: str, motivo: str) -> None:
        if any(p.search(linha) for p in padroes):
            achados.append(Finding(regra, sev, n, motivo))

    checar(_DOWNLOAD_EXEC, "download_exec", "critical", "baixa código da rede e executa sem revisão")
    checar(_PRIVILEGE, "privilege", "high", "pede privilégio de administrador")
    checar(_DISK, "disk_destroy", "critical", "pode destruir um disco ou travar a máquina")
    checar(_PERMISSIONS, "permissions", "high", "abre permissões para todos ou troca o dono em massa")
    checar(_DYNAMIC, "dynamic_exec", "high", "executa código montado em tempo de execução")
    checar(_CREDENTIALS, "credential_path", "high",
           "toca em caminho de credenciais ou de configuração sensível (.ssh, .aws, .env, ~/.claude...)")
    checar(_PERSISTENCE, "persistence", "high", "instala algo que roda sozinho depois (cron, rc do shell, serviço)")
    checar(_HISTORY, "history_tamper", "high", "apaga ou desliga o histórico de comandos")
    checar(_TRUSTED_IMPORT, "trusted_import", "high",
           "importa memórias como confiáveis: só o usuário, no terminal, com o próprio backup")
    if _NETWORK_CMD.search(linha) or "/dev/tcp/" in linha:
        permitidos = {h.lower() for h in allowed}
        hosts = _hosts(linha)
        fora = sorted({h for h in hosts if h not in permitidos})
        if "/dev/tcp/" in linha:
            achados.append(Finding("network", "high", n, "abre conexão de rede crua por /dev/tcp"))
        elif fora or not hosts:
            envia = bool(_UPLOAD.search(linha)) or bool(re.search(r"\b(scp|rsync|sftp|nc|ncat|netcat|socat)\b", linha))
            alvo = ", ".join(fora) if fora else "host não identificado"
            achados.append(Finding("network", "high" if envia else "medium", n,
                                   ("envia dados para fora" if envia else "acessa a rede") + f" ({alvo})"))
    return achados


def _linhas_logicas(script: str) -> list[tuple[int, str]]:
    """Junta as continuações com barra invertida; cada linha lógica guarda o número da primeira."""
    saida, atual, inicio = [], "", 1
    for i, linha in enumerate(script.splitlines(), start=1):
        if not atual:
            inicio = i
        if linha.rstrip().endswith("\\") or linha.rstrip().endswith("`"):
            atual += linha.rstrip()[:-1] + " "
            continue
        atual += linha
        if atual.strip() and not atual.lstrip().startswith("#"):
            saida.append((inicio, atual))
        atual = ""
    if atual.strip():
        saida.append((inicio, atual))
    return saida


# --- Python (AST) -------------------------------------------------------------------------
_PY_DYNAMIC = {"eval": "critical", "exec": "critical", "compile": "medium", "__import__": "high",
               "importlib.import_module": "medium"}
_PY_EXEC_PREFIXOS = ("os.exec", "os.spawn", "os.posix_spawn")
_PY_EXEC = {"os.system", "os.popen", "pty.spawn", "commands.getoutput", "subprocess.run", "subprocess.call",
            "subprocess.Popen", "subprocess.check_output", "subprocess.check_call", "subprocess.getoutput",
            "subprocess.getstatusoutput", "asyncio.create_subprocess_shell", "asyncio.create_subprocess_exec"}
_PY_RM = {"shutil.rmtree", "os.removedirs"}
_PY_NET_PREFIXOS = ("requests.", "httpx.", "urllib.request.", "http.client.", "ftplib.", "smtplib.", "paramiko.",
                    "aiohttp.", "socket.")
_PY_DESSERIALIZA = {"pickle.loads", "pickle.load", "marshal.loads", "shelve.open"}


def _nome(no: ast.AST, apelidos: dict[str, str]) -> Optional[str]:
    partes = []
    while isinstance(no, ast.Attribute):
        partes.append(no.attr)
        no = no.value
    if isinstance(no, ast.Call):  # __import__('os').system → __import__().system
        interno = _nome(no.func, apelidos)
        if interno is None:
            return None
        partes.append(interno + "()")
        return ".".join(reversed(partes))
    if not isinstance(no, ast.Name):
        return None
    partes.append(apelidos.get(no.id, no.id))
    return ".".join(reversed(partes))


def _strings(no: ast.AST) -> list[str]:
    return [n.value for n in ast.walk(no) if isinstance(n, ast.Constant) and isinstance(n.value, str)]


def _validar_python(script: str, allowed: Iterable[str]) -> list[Finding]:
    try:
        arvore = ast.parse(script)
    except (SyntaxError, ValueError):
        return [Finding("unparseable", "high", 0, "não deu para ler o script como Python; sem leitura, sem garantia")]
    apelidos: dict[str, str] = {}
    for no in ast.walk(arvore):
        if isinstance(no, ast.Import):
            for a in no.names:
                apelidos[a.asname or a.name.split(".")[0]] = a.name if a.asname else a.name.split(".")[0]
        elif isinstance(no, ast.ImportFrom) and no.module:
            for a in no.names:
                apelidos[a.asname or a.name] = f"{no.module}.{a.name}"
    permitidos = {h.lower() for h in allowed}
    achados: list[Finding] = []
    for no in ast.walk(arvore):
        if not isinstance(no, ast.Call):
            continue
        nome = _nome(no.func, apelidos) or ""
        linha = getattr(no, "lineno", 0)
        if nome in _PY_DYNAMIC or nome.startswith("__import__()"):
            chave = "__import__" if nome.startswith("__import__") else nome
            achados.append(Finding("dynamic_exec", _PY_DYNAMIC[chave], linha,
                                   f"{chave}() executa ou carrega código montado em tempo de execução"))
            if nome.startswith("__import__()."):
                nome = nome.replace("__import__().", "", 1)
                interno = no.func.value if isinstance(no.func, ast.Attribute) else None
                if isinstance(interno, ast.Call) and interno.args and isinstance(interno.args[0], ast.Constant):
                    nome = f"{interno.args[0].value}.{nome.split('.')[-1]}"
        shell = any(k.arg == "shell" and isinstance(k.value, ast.Constant) and k.value.value is True
                    for k in no.keywords)
        if nome in _PY_EXEC or nome.startswith(_PY_EXEC_PREFIXOS):
            sev = "critical" if shell or nome in {"os.system", "os.popen"} else "high"
            achados.append(Finding("python_exec", sev, linha, f"{nome}() executa comandos do sistema"))
        if nome in _PY_RM:
            textos = " ".join(_strings(no))
            amplo = "~" in textos or textos.strip() in {"/", ""} or "home" in ast.dump(no).lower()
            achados.append(Finding("rm_recursive", "critical" if amplo else "high", linha,
                                   f"{nome}() apaga pastas inteiras"))
        if nome == "os.chmod" and len(no.args) >= 2 and isinstance(no.args[1], ast.Constant) \
                and isinstance(no.args[1].value, int) and no.args[1].value & 0o002:
            achados.append(Finding("permissions", "high", linha, "os.chmod() dá escrita para todos"))
        if nome.startswith(_PY_NET_PREFIXOS):
            hosts = [h for s in _strings(no) for h in _hosts(s)]
            if not hosts or any(h not in permitidos for h in hosts):
                envia = nome.split(".")[-1] in {"post", "put", "patch", "send", "sendall", "connect",
                                                "create_connection", "sendmail", "storbinary"}
                achados.append(Finding("network", "high" if envia else "medium", linha,
                                       f"{nome}() usa a rede" + (f" ({', '.join(sorted(set(hosts)))})" if hosts else "")))
        if nome in _PY_DESSERIALIZA:
            achados.append(Finding("dynamic_exec", "medium", linha, f"{nome}() pode executar código ao desserializar"))
    # As strings do script passam pelas regras de texto (comando de shell dentro de os.system, caminhos...).
    for no in ast.walk(arvore):
        if isinstance(no, ast.Constant) and isinstance(no.value, str):
            for f in _regras_de_texto(no.value, getattr(no, "lineno", 0), allowed):
                if f.rule != "network":  # rede em Python já foi vista pelas chamadas
                    achados.append(f)
    return achados


def validate_script(script: str, language: Optional[str] = None,
                    allowed_hosts: Iterable[str] = DEFAULT_ALLOWED_HOSTS) -> ValidationReport:
    if not isinstance(script, str):
        raise TypeError("script precisa ser texto")
    lang = detect_language(script, language)
    permitidos = tuple(allowed_hosts)
    if lang == "python":
        achados = _validar_python(script, permitidos)
    else:
        achados = [f for n, linha in _linhas_logicas(script) for f in _regras_de_texto(linha, n, permitidos)]
    unicos = list(dict.fromkeys(achados))
    return ValidationReport(ok=not unicos, language=lang, sha256=script_sha256(script), findings=unicos)
