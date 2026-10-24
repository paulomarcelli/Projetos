"""Normalização de texto em português para a busca lexical (BM25).

Por que existe: a especificação (cap. 12, §3.4) pede BM25 como baseline obrigatório.
BM25 compara termos, então "ansiedade", "ansiosa" e "Ansioso" precisam virar o mesmo
termo. Fazemos isso com três passos simples e determinísticos:

1. minúsculas + remoção de acentos (o usuário nem sempre acentua);
2. remoção de palavras vazias (stopwords) que não ajudam a achar o assunto;
3. um "radicalizador" leve que corta sufixos comuns do português.

O radicalizador é propositalmente conservador: errar para menos (não juntar duas
formas) só reduz um pouco a revocação; errar para mais (juntar palavras diferentes)
traz trechos errados, que é pior num contexto de apoio emocional.
"""

import re
import unicodedata

# Palavras que aparecem em quase toda frase e não indicam assunto.
# Inclui formas coloquiais comuns em conversa ("pra", "ta", "vc").
STOPWORDS = frozenset("""
a o as os um uma uns umas de do da dos das no na nos nas em por para pra pro pros
com sem sob sobre entre ate apos ante e ou mas nem que se como quando onde porque
porem pois entao tambem ja nao sim muito muita muitos muitas pouco pouca mais menos
tao tanto toda todo todas todos outro outra outros outras mesmo mesma este esta
isto esse essa isso aquele aquela aquilo eu tu ele ela nos vos eles elas me te lhe
mim ti si meu minha meus minhas teu tua seu sua seus suas nosso nossa dele dela
deles delas ao aos a as num numa ser estar ter haver fazer sou e era foi sao estou
esta estava tenho tem tinha ha hoje agora ainda so apenas cada qual quais quem
ta to tava vc voce voces gente coisa coisas dia dias vez vezes la aqui ai ali
q pq tb tbm ne ok oi ola bom boa obrigado obrigada sei acho quero queria posso
pode vai vou fica ficar sempre nunca algo alguem nada ninguem tudo
""".split())

# Sufixos testados do mais longo para o mais curto; corta só o primeiro que casar.
SUFIXOS = (
    "amentos", "imentos", "amento", "imento", "mente", "idades", "idade", "dades",
    "dade", "icoes", "acoes", "icao", "acao", "ismos", "ismo", "istas", "ista",
    "aveis", "iveis", "avel", "ivel", "ancias", "encias", "ancia", "encia", "ezas",
    "eza", "osas", "osos", "osa", "oso", "ivas", "ivos", "iva", "ivo", "ados", "adas",
    "idos", "idas", "ado", "ada", "ido", "ida", "ando", "endo", "indo", "oes", "aes",
    "ao", "ar", "er", "ir", "es", "s",
)
_PALAVRA = re.compile(r"[a-z0-9]+")


def sem_acentos(texto):
    """Minúsculas e sem acentos: 'Ruminação' -> 'ruminacao'."""
    texto = unicodedata.normalize("NFKD", texto.lower())
    return "".join(c for c in texto if not unicodedata.combining(c))


def radical(palavra):
    """Corta um sufixo comum, mantendo pelo menos 4 letras de radical.

    Depois do corte, remove uma vogal final solta, para que 'ansiedade' -> 'ansie'
    e 'ansioso' -> 'ansi' terminem no mesmo radical 'ansi'.
    """
    for sufixo in SUFIXOS:
        if palavra.endswith(sufixo) and len(palavra) - len(sufixo) >= 4:
            palavra = palavra[: -len(sufixo)]
            break
    if len(palavra) > 4 and palavra[-1] in "aeiou":
        palavra = palavra[:-1]
    return palavra


def termos(texto):
    """Texto -> lista de radicais de busca (sem stopwords, números curtos ou letras soltas)."""
    return [
        radical(p)
        for p in _PALAVRA.findall(sem_acentos(texto))
        if p not in STOPWORDS and len(p) > 2 and not p.isdigit()
    ]
