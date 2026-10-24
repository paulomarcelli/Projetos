"""Camada de consulta: transforma a fala da pessoa numa busca na biblioteca.

A especificação (§3.5) pede que a consulta preserve a pergunta original para
auditoria, registre reformulações e não altere a intenção em silêncio.

Problema real: quem conversa escreve "tô travada, não consigo parar de pensar
na prova", enquanto a biblioteca fala em "ruminação" e "estresse acadêmico".
Para aproximar os dois vocabulários usamos uma EXPANSÃO pequena e explícita:
palavras coloquiais acrescentam termos técnicos equivalentes à busca, sem
remover nada do que a pessoa escreveu. O mapa é curto de propósito, fácil de
revisar e de testar; ele não interpreta nem rotula a pessoa, só ajuda a achar
o capítulo certo.
"""

from dataclasses import dataclass, field

from .texto import sem_acentos, termos

# chave (sem acento, minúscula, pode ser início de palavra) -> termos acrescentados à busca
EXPANSOES = {
    "ansios": "ansiedade preocupação",
    "nervos": "ansiedade",
    "preocup": "preocupação ansiedade",
    "panico": "ansiedade pânico",
    "pensar demais": "ruminação pensamento repetitivo",
    "parar de pensar": "ruminação pensamento repetitivo",
    "remoend": "ruminação",
    "triste": "tristeza humor",
    "deprimid": "depressão tristeza",
    "desanim": "desânimo tristeza interesse",
    "vazio": "tristeza desesperança",
    "sozinh": "solidão isolamento",
    "solidao": "solidão isolamento vínculos",
    "namor": "relacionamento vínculos",
    "termin": "término relacionamento perda",
    "amig": "amizade vínculos relacionamento",
    "familia": "família vínculos",
    "briga": "conflito relacionamento",
    "brigu": "conflito relacionamento",
    "discut": "conflito relacionamento",
    "parceir": "relacionamento vínculos",
    "marido": "relacionamento vínculos",
    "esposa": "relacionamento vínculos",
    "casament": "relacionamento vínculos",
    "divorci": "término relacionamento perda",
    "inseguran": "insegurança autoestima",
    "autoestima": "autoestima autocrítica",
    "feia": "autoestima imagem corporal",
    "feio": "autoestima imagem corporal",
    "culpa": "culpa autocrítica",
    "fracass": "fracasso autocrítica autoestima",
    "prova": "estresse acadêmico estudos",
    "faculdade": "estresse acadêmico estudos",
    "escola": "estresse acadêmico estudos",
    "estud": "estudos estresse acadêmico",
    "trabalh": "trabalho estresse",
    "chefe": "trabalho estresse",
    "cansad": "esgotamento estresse sono",
    "esgotad": "esgotamento burnout estresse",
    "sobrecarreg": "sobrecarga estresse",
    "morreu": "luto perda",
    "morte": "luto perda",
    "perdi ": "perda luto",
    "saudade": "luto perda",
    "dormi": "sono qualidade de vida",
    "insonia": "sono insônia",
    "sono": "sono hábitos",
    "exercicio": "atividade física hábitos",
    "celular": "tela hábitos digital",
    "respira": "respiração técnicas regulação emocional",
    "acalmar": "regulação emocional técnicas",
    "racismo": "discriminação fatores sociais",
    "preconceito": "discriminação fatores sociais",
    "dinheiro": "fatores sociais financeiro",
}

# Consultas muito curtas ("e agora?") pegam o contexto da mensagem anterior da pessoa.
MINIMO_TERMOS_PROPRIOS = 3


@dataclass
class Consulta:
    original: str                       # exatamente o que a pessoa escreveu (auditoria)
    termos: list                        # radicais usados de fato na busca
    expansoes: list = field(default_factory=list)   # chaves do mapa que dispararam
    usou_contexto: bool = False         # se a mensagem anterior foi somada


def montar_consulta(mensagem, anteriores=()):
    """Monta a consulta de busca a partir da mensagem atual e, se curta, da anterior."""
    texto = mensagem
    proprios = termos(mensagem)
    usou_contexto = False
    if len(proprios) < MINIMO_TERMOS_PROPRIOS and anteriores:
        texto = f"{anteriores[-1]} {mensagem}"
        usou_contexto = True

    normal = f" {sem_acentos(texto)} "
    # Casa só no início de palavra: "termin" pega "terminei", mas não "determinado".
    normal = " ".join(normal.replace("?", " ").replace(",", " ").replace(".", " ").split())
    normal = f" {normal} "
    disparadas = [chave for chave in EXPANSOES if f" {chave}" in normal]
    extras = " ".join(EXPANSOES[c] for c in disparadas)
    return Consulta(
        original=mensagem,
        termos=termos(f"{texto} {extras}"),
        expansoes=disparadas,
        usou_contexto=usou_contexto,
    )
