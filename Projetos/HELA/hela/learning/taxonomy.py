"""Taxonomia de tarefas: categorias, palavras-chave, sinais de complexidade e ferramentas prováveis.

São **regras** escritas à mão, não aprendizado. O Naive Bayes (naive_bayes.py) só entra quando há
rótulos de verdade (explicit/feedback) suficientes e quando bate estas regras nos mesmos dados.

Formato das palavras-chave (sempre sem acento e em minúsculas, como sai de normalize()):
- "palavra": casa com a palavra inteira;
- "prefix*": casa com qualquer palavra que comece assim (refator* → refatore, refatorar);
- "duas palavras": casa com a sequência exata de palavras.

Módulo puro (sem numpy, networkx ou pydantic): os hooks da Fase 4 podem usar.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

DEFAULT_CATEGORY = "general"


@dataclass(frozen=True)
class Category:
    name: str
    description: str
    keywords: tuple[str, ...]
    base_complexity: int = 0   # tarefas desse tipo tendem a ser maiores (feature, refactor...)


_CATS = (
    Category("debug", "corrigir erro, falha ou comportamento inesperado", (
        "erro*", "error*", "bug*", "falh*", "fail*", "exception", "traceback", "stack trace", "quebr*", "crash*",
        "corrij*", "corrig*", "consert*", "fix*", "broken", "nao funciona", "not working", "debug*", "depur*",
        "500", "404")),
    Category("test", "escrever ou rodar testes", (
        "teste", "testes", "testar", "test", "tests", "testing", "pytest", "jest", "vitest", "unittest",
        "unit test", "unit tests", "cobertura", "coverage", "tdd", "e2e", "playwright")),
    Category("feature", "criar funcionalidade nova", (
        "implement*", "adicion*", "funcionalidade", "feature", "features", "endpoint", "construa", "construir",
        "nova tela", "novo recurso", "add a", "add an", "suporte a", "support for"), 1),
    Category("refactor", "reorganizar código sem mudar o comportamento", (
        "refator*", "refactor*", "simplifiq*", "simplific*", "simplify", "renome*", "rename*", "cleanup",
        "clean up", "reorganiz*", "extrair", "extract", "duplicacao", "smaller functions"), 1),
    Category("docs", "documentação", (
        "document*", "readme", "docstring*", "changelog", "tutorial", "guia", "comentarios", "comments")),
    Category("explain", "explicar um conceito ou um trecho", (
        "explic*", "explain*", "o que e", "what is", "what are", "como funciona", "how does", "how do",
        "por que", "porque", "why", "entender", "understand", "diferenca entre", "difference between",
        "conceito")),
    Category("devops", "deploy, contêiner, CI e servidor", (
        "deploy*", "docker*", "container*", "kubernetes", "k8s", "ci", "pipeline*", "github actions", "workflow*",
        "nginx", "servidor", "server", "hospedagem", "hosting", "systemd", "cloud"), 1),
    Category("data", "dados, arquivos estruturados e bancos", (
        "csv", "json", "sql", "sqlite", "postgres*", "mysql", "banco de dados", "database", "planilha*",
        "spreadsheet", "pandas", "dataframe", "query", "consulta sql", "excel", "xlsx", "etl", "dados")),
    Category("media", "vídeo, imagem, áudio e 3D", (
        "video*", "imagem", "imagens", "image", "images", "gif", "ffmpeg", "render*", "blender", "audio*",
        "mp4", "mp3", "png", "jpg", "jpeg", "thumbnail*", "legenda*", "subtitle*", "frames")),
    Category("ui", "interface, layout e estilo", (
        "css", "layout*", "tela", "telas", "frontend", "front end", "componente*", "component", "components",
        "react", "html", "responsiv*", "botao", "button", "interface", "estilo", "style")),
    Category("setup", "instalar e configurar ambiente", (
        "instal*", "install*", "setup", "set up the environment", "dependenc*", "pip", "npm", "venv",
        "virtualenv", "ambiente", "environment", "requirements", "pacotes", "packages")),
    Category("git", "controle de versão", (
        "git", "commit", "commits", "merge", "rebase", "branch*", "pull request", "conflito", "conflict",
        "stash", "cherry pick", "squash")),
    Category("security", "segurança, segredos e permissões", (
        "seguranca", "security", "vulnerab*", "segredo*", "secret*", "credencia*", "credential*", "xss", "csrf",
        "injection", "injecao", "sanitiz*", "permiss*", "auth flow", "autorizacao"), 1),
    Category("performance", "desempenho e latência", (
        "performance", "desempenho", "lent*", "slow*", "otimiz*", "optimiz*", "latencia", "latency",
        "memory leak", "profil*", "gargalo", "bottleneck")),
    Category(DEFAULT_CATEGORY, "sem sinal claro", ()),
)

CATEGORIES: dict[str, Category] = {c.name: c for c in _CATS}

# Sinais de complexidade. Cada sinal soma ou subtrai pontos; o total vira low/medium/high em rules.py.
COMPLEXITY_HIGH: tuple[str, ...] = (
    "arquitetura", "architecture", "sistema inteiro", "inteira", "inteiro", "todo o projeto", "entire",
    "migr*", "microsservic*", "microservic*", "ponta a ponta", "end to end", "do zero", "from scratch",
    "integracao", "integration", "integre", "distribuid*", "distributed", "concorrencia", "concurrency",
    "varios arquivos", "multiple files", "several files", "redesenh*", "redesign",
)
COMPLEXITY_LOW: tuple[str, ...] = (
    "simples", "simple", "rapido", "rapida", "quick", "typo", "pequeno", "pequena", "small", "uma linha",
    "one liner", "so isso", "just", "trivial",
)
STEP_MARKERS: tuple[str, ...] = (
    "depois", "em seguida", "por fim", "alem disso", "then", "after that", "finally", "and also",
)

# Ferramentas do Claude Code que a tarefa provavelmente vai usar.
TOOL_HINTS: dict[str, tuple[str, ...]] = {
    "Read": ("leia", "ler", "le o", "read", "analis*", "analyz*", "revis*", "review*", "entend*", "understand",
             "explic*", "explain*", "arquivo", "file", "codigo", "code"),
    "Grep": ("procur*", "encontr*", "busqu*", "busca*", "search*", "find", "onde", "where", "grep", "localiz*"),
    "Edit": ("corrij*", "corrig*", "fix*", "alter*", "mud*", "edit*", "refator*", "refactor*", "atualiz*",
             "update*", "ajust*", "renome*", "rename*", "otimiz*", "optimiz*"),
    "Write": ("crie", "criar", "create", "gere", "gerar", "generate", "novo arquivo", "new file", "escrev*",
              "write", "script"),
    "Bash": ("rod*", "run", "execut*", "instal*", "install*", "comando", "command", "terminal", "pytest", "npm",
             "pip", "git", "ffmpeg", "blender", "build", "compil*", "deploy*", "docker", "converter", "convert*",
             "render*"),
    "WebFetch": ("http", "https", "url", "pagina web", "web page", "link"),
    "WebSearch": ("pesquis*", "research", "internet", "google", "procure na web", "search the web"),
}
TOOL_ORDER: tuple[str, ...] = ("Read", "Grep", "Edit", "Write", "Bash", "WebFetch", "WebSearch")

# Palavras vazias (português e inglês) para o Naive Bayes e a cobertura do roteador.
STOPWORDS = frozenset("""
a o as os um uma uns umas de da do das dos e em no na nos nas por para pra com sem que se ao aos
como mais mas ou ja nao sim eu voce ele ela isso esse essa este esta foi ser sao tem ter sobre me
meu minha seu sua the of and or to in on for with is are was be by at it this that an as from how
what why i you my your we our can could please por favor
""".split())

_PALAVRA = re.compile(r"\w+", re.UNICODE)


def normalize(texto: str) -> str:
    """Minúsculas, sem acentos, só letras/dígitos separados por um espaço."""
    sem_acento = "".join(c for c in unicodedata.normalize("NFKD", texto or "") if not unicodedata.combining(c))
    return " ".join(_PALAVRA.findall(sem_acento.casefold())).replace("_", " ")


def words(texto: str) -> list[str]:
    """Palavras normalizadas, na ordem."""
    return normalize(texto).split()


def match_keywords(palavras: list[str], keywords: tuple[str, ...]) -> list[str]:
    """Palavras-chave (no formato da taxonomia) presentes na lista de palavras. Cada uma conta uma vez."""
    conjunto = set(palavras)
    junto = " " + " ".join(palavras) + " "
    achadas = []
    for kw in keywords:
        if " " in kw:
            if f" {kw} " in junto:
                achadas.append(kw)
        elif kw.endswith("*"):
            raiz = kw[:-1]
            if any(p.startswith(raiz) for p in conjunto):
                achadas.append(kw)
        elif kw in conjunto:
            achadas.append(kw)
    return achadas
