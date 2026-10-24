"""Ingestão da biblioteca Luna RAG (pasta conhecimento/).

Lê os capítulos em Markdown e os metadados que acompanham a biblioteca e produz
TRECHOS (chunks) prontos para indexar. Segue a especificação do cap. 12:

* §3.2  A unidade de conhecimento é um documento com identidade e metadados.
        O SHA-256 de cada capítulo é conferido contra `manifesto_documentos.json`;
        divergências são relatadas em `relatorio` (governança/auditoria).
* §3.3  O particionamento preserva a estrutura: cada trecho nasce de uma seção
        (## ou ###) e carrega documento, versão (hash), seção, âncora e posição.
        Seções longas viram janelas de parágrafos com sobreposição de 1 parágrafo.
        O texto exibido como evidência fica fiel à fonte.
* §3.4  Filtros antes da geração: só capítulos de DOMÍNIO HUMANO (os listados em
        `taxonomia_conhecimento.json`) recebem escopo "conversa". Capítulos de
        metodologia, especificação técnica, avaliação e governança ficam com escopo
        "referencia" e nunca chegam à conversa.

Seções editoriais (fichas de fontes, estatísticas de busca, referências e
comparações técnicas internas) não viram trechos: são material de curadoria, não
conteúdo para a conversa. As fichas continuam nos arquivos para auditoria.
"""

import hashlib
import json
import logging
import re
from dataclasses import dataclass, field
from pathlib import Path

from .texto import termos

log = logging.getLogger("luna.rag")

# Seções (## ou ###) que não entram na busca. Comparação sem acento e em minúsculas.
# Os títulos variam entre capítulos ("Fichas críticas das fontes", "Estatísticas honestas
# da pesquisa", "Descrição individual das fontes citadas", "Casos 12/14/15 — ...").
# A numeração inicial ("7. ", "3.4 ") é removida antes da comparação (ver _titulo_base).
SECOES_EXCLUIDAS = re.compile(
    r"^(references|referencias|estatisticas|fichas|perfis das fontes|metadados|"
    r"descricao (individual )?das fontes|auditoria das fontes|transparencia de fontes|"
    r"comparacao (textual )?tecnica|casos 12)", re.I
)
# Domínios da taxonomia que são documentação técnica do próprio RAG (o README da
# biblioteca diz: "capítulos 02–11 tratam dos domínios humanos e de segurança; 12,
# 14 e 15 documentam arquitetura, avaliação e governança"). Ficam fora da conversa.
DOMINIOS_TECNICOS = {"tecnica_rag", "avaliacao_rag", "governanca_corpus"}
TAMANHO_ALVO = 1200      # caracteres por trecho (aprox.); hipótese ajustável (§3.3)
TAMANHO_MAXIMO = 1600    # acima disso a seção é quebrada em janelas


@dataclass
class Trecho:
    id: str                 # "<doc>#<n>", estável enquanto o capítulo não mudar
    doc_id: str             # "02"
    documento: str          # título do capítulo ("Ansiedade e ruminação")
    arquivo: str            # nome do arquivo de origem
    secao: str              # título da seção (##)
    subsecao: str           # título da subseção (###), pode ser ""
    ancora: str             # âncora Markdown da (sub)seção, para localizar no arquivo
    posicao: int            # ordem do trecho dentro do documento
    versao: str             # 12 primeiros caracteres do SHA-256 do arquivo
    escopo: str             # "conversa" ou "referencia"
    texto: str              # texto fiel à fonte (é o que vai como evidência)
    termos: list = field(default_factory=list, repr=False)   # radicais para o BM25


@dataclass
class Biblioteca:
    trechos: list
    documentos: dict        # doc_id -> metadados do manifesto + status de integridade
    relatorio: dict         # contagens e problemas encontrados na ingestão


def _sem_acento(texto):
    from .texto import sem_acentos
    return sem_acentos(texto)


def _titulo_base(titulo):
    """'7. Comparação textual…' -> 'comparacao textual…' (sem número, acento e caixa)."""
    return re.sub(r"^\d+(\.\d+)*\.?\s*", "", _sem_acento(titulo.strip()))


def _ancora(titulo):
    """Âncora no estilo do GitHub: '3.4 Representação' -> '34-representação'."""
    base = re.sub(r"[^\w\s-]", "", titulo.lower()).strip()
    return re.sub(r"\s+", "-", base)


def _janelas(paragrafos):
    """Agrupa parágrafos em janelas de ~TAMANHO_ALVO com 1 parágrafo de sobreposição."""
    janelas, atual = [], []
    pedacos = []
    for p in paragrafos:
        # Parágrafo maior que o alvo (ex.: lista longa sem linha em branco): quebra por linha.
        if len(p) > TAMANHO_ALVO and "\n" in p:
            pedacos.extend(l for l in p.split("\n") if l.strip())
        else:
            pedacos.append(p)
    for p in pedacos:
        if atual and sum(len(x) for x in atual) + len(p) > TAMANHO_ALVO:
            janelas.append(atual)
            atual = [atual[-1]] if len(atual[-1]) < TAMANHO_ALVO // 2 else []
        atual.append(p)
    if atual:
        janelas.append(atual)
    return ["\n\n".join(j) for j in janelas]


def _secoes(markdown):
    """Divide o Markdown em (secao, subsecao, texto), ignorando o título # do capítulo."""
    secao, subsecao, linhas, saida = "", "", [], []

    def fechar():
        texto = "\n".join(linhas).strip()
        if texto and secao:
            saida.append((secao, subsecao, texto))

    for linha in markdown.splitlines():
        m = re.match(r"^(#{2,3})\s+(.*)$", linha)
        if m:
            fechar()
            linhas = []
            if m.group(1) == "##":
                secao, subsecao = m.group(2).strip(), ""
            else:
                subsecao = m.group(2).strip()
            continue
        if linha.startswith("# "):
            continue
        linhas.append(linha)
    fechar()
    return saida


def _ler_json(caminho):
    try:
        return json.loads(caminho.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as erro:
        log.warning("RAG: não consegui ler %s (%s)", caminho.name, erro.__class__.__name__)
        return {}


def carregar_biblioteca(pasta):
    """Lê a pasta da biblioteca e devolve uma `Biblioteca` com todos os trechos.

    Nunca levanta exceção por causa de um capítulo ruim: o problema vai para o
    relatório e a ingestão continua com o resto (o chat não pode cair por isso).
    """
    pasta = Path(pasta)
    manifesto = _ler_json(pasta / "manifesto_documentos.json")
    taxonomia = _ler_json(pasta / "taxonomia_conhecimento.json")
    de_dominio = {d.get("document") for d in taxonomia.get("domains", [])
                  if d.get("id") not in DOMINIOS_TECNICOS}

    documentos, trechos = {}, []
    relatorio = {"documentos": 0, "trechos": 0, "divergentes": [], "ausentes": [], "conversa": 0}

    for meta in manifesto.get("documents", []):
        arquivo = pasta / meta.get("document", "")
        doc_id = str(meta.get("id", ""))
        if not arquivo.is_file():
            relatorio["ausentes"].append(meta.get("document"))
            continue
        bruto = arquivo.read_bytes()
        hash_real = hashlib.sha256(bruto).hexdigest()
        integro = hash_real == meta.get("sha256")
        if not integro:
            relatorio["divergentes"].append(meta.get("document"))
            log.warning("RAG: %s difere do hash do manifesto (arquivo editado depois?)", arquivo.name)
        escopo = "conversa" if meta.get("document") in de_dominio else "referencia"
        documentos[doc_id] = {
            "titulo": meta.get("title", arquivo.stem),
            "arquivo": arquivo.name,
            "sha256": hash_real,
            "integro": integro,
            "data_consulta": meta.get("date_consulted"),
            "escopo": escopo,
        }
        relatorio["documentos"] += 1

        posicao = 0
        for secao, subsecao, texto in _secoes(bruto.decode("utf-8")):
            if SECOES_EXCLUIDAS.match(_titulo_base(secao)) or SECOES_EXCLUIDAS.match(_titulo_base(subsecao)):
                continue
            paragrafos = [p.strip() for p in re.split(r"\n\s*\n", texto) if p.strip()]
            pedacos = [texto] if len(texto) <= TAMANHO_MAXIMO else _janelas(paragrafos)
            for pedaco in pedacos:
                posicao += 1
                cabecalho = f"{secao} {subsecao}"
                trechos.append(Trecho(
                    id=f"{doc_id}#{posicao}",
                    doc_id=doc_id,
                    documento=documentos[doc_id]["titulo"],
                    arquivo=arquivo.name,
                    secao=secao,
                    subsecao=subsecao,
                    ancora=_ancora(subsecao or secao),
                    posicao=posicao,
                    versao=hash_real[:12],
                    escopo=escopo,
                    texto=pedaco,
                    # O título da seção entra duas vezes: ele resume o assunto do trecho.
                    termos=termos(f"{cabecalho} {cabecalho} {pedaco}"),
                ))
                relatorio["trechos"] += 1
                relatorio["conversa"] += escopo == "conversa"

    return Biblioteca(trechos=trechos, documentos=documentos, relatorio=relatorio)
