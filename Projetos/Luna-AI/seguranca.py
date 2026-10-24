"""Camada de segurança da LUNA.

Roda no código, antes e depois do modelo de IA. Por isso não depende de a IA
"lembrar" de seguir as instruções. Ela NÃO diagnostica nada: só decide quando a
conversa precisa priorizar segurança e quais contatos de ajuda mostrar.

Os padrões são heurísticos e de propósito conservadores. Um alerta aqui não é
uma conclusão sobre a pessoa: no nível "atencao" e "alto", a própria Luna é
orientada a perguntar com cuidado antes de presumir qualquer coisa.
"""

import re
import unicodedata
from dataclasses import dataclass, field

NIVEIS = ("nenhum", "atencao", "alto", "imediato")  # do menor para o maior


def normalizar(texto):
    """Minúsculas, sem acentos e com espaços simples, pra comparar com os padrões."""
    decomposto = unicodedata.normalize("NFD", texto.lower())
    sem_acento = "".join(c for c in decomposto if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", sem_acento).strip()


def _re(*partes):
    return re.compile("|".join(partes))


# Expressões do dia a dia que usam "morrer"/"matar" sem risco nenhum.
# São apagadas antes da análise pra não gerar falso alarme.
COLOQUIAIS = _re(
    r"\bmorr\w* de (rir|ri|vergonha|fome|sono|calor|frio|tedio|saudades?|cansaco|inveja|amor|medo|curiosidade|preguica)\b",
    r"\bmort[oa]s? de (cansaco|fome|sono|vergonha|saudades?)\b",
    r"\bmat\w* (a |as |o )?(saudades?|aula|aulas|tempo|fome|sede|curiosidade|charada|questao|prova)\b",
    r"\bme mat\w* de (rir|trabalhar|estudar|tanto)\b",
)

# Alguém ameaçando a pessoa: tratado como possível violência sofrida.
AMEACA_SOFRIDA = _re(
    r"\b(ameacou|ameaca|ameacando|disse que vai|falou que vai|jurou que vai|tentou|quer|quis) me (matar|machucar|bater|agredir|enforcar)\b",
)
# "Minha mãe vai me matar se..." é quase sempre figura de linguagem: só pede atenção.
VAI_ME_MATAR = re.compile(r"\b(vai|vao|ia|iam|iria) me matar\b")

IDEACAO = _re(
    # intenção ou desejo em primeira pessoa
    r"\b(quero|queria|vontade de|penso em|pensando em|pensei em|pensado em|desejo|vou|decidi|resolvi|preciso) "
    r"(morrer|me matar|me suicidar|tirar (a )?minha (propria )?vida|acabar com (a )?minha (propria )?vida|sumir (para|pra) sempre|nao acordar|nao existir mais)\b",
    r"\bme (matar|suicidar)\b",
    r"\b(tenho|tive|ando com|estou com|to com|tenho tido) (pensamentos?|ideias?|ideacao) suicidas?\b",
    r"\b(tentei|tentativa de) (me matar|suicidio|tirar minha vida)\b",
    # desejo passivo de morrer
    r"\b(seria|era|e) melhor (se eu )?(nao existir|nao existisse|nao estar aqui|nao estivesse aqui|eu morrer|morresse|morrer|eu sumir de vez|sumisse de vez)\b",
    r"\b(queria|preferia) (nao ter nascido|nunca ter nascido|estar mort[oa])\b",
    r"\bmelhor sem mim\b",
    r"\bninguem (vai )?sentir (a )?minha falta\b",
    r"\bnao (quero|aguento) mais viver\b",
    r"\bnao vejo (mais )?sentido (em|na|de) (viver|vida|continuar vivo|continuar viva)\b",
    r"\bcansad[oa] de viver\b",
    r"\b(dormir e )?nao acordar mais\b",
    # autolesão
    r"\b(vontade de|quero|queria|penso em|voltei a|costumo|nao consigo parar de|vou) "
    r"(me cortar|me machucar|me ferir|me queimar|me bater)\b",
    r"\b(tenho|ando|estou|to|continuo|voltei a) me (cortando|cortado|machucando|machucado|ferindo|ferido|queimando|queimado)\b",
    r"\bautomutila|\bautolesao|\bauto lesao|\bauto-lesao|\bme corto\b|\bme cortei de novo\b",
)

# Sinais vagos: a Luna é orientada a checar com delicadeza, sem cartão de crise.
ATENCAO_AUTOLESAO = _re(
    r"\bnao aguento mais\b",
    r"\b(quero|queria|vontade de) sumir\b",
    r"\bdesistir de tudo\b",
    r"\bnao vejo saida\b",
    r"\bacabar com tudo\b",
    r"\bsuicid",
)

# Tempo próximo ("hoje", "agora") e plano/meios: sobem o nível quando já há sinal de autolesão.
TEMPO = re.compile(r"\b(hoje|agora|essa noite|esta noite|hoje a noite|amanha|daqui a pouco|neste momento|nesse momento|ja ja)\b")
PLANO = _re(
    r"\b(ja )?(tenho|separei|comprei|peguei|juntei|guardei) (um plano|o plano|tudo planejado|os remedios|remedios|comprimidos|veneno|uma corda|a corda|uma arma|a arma|uma faca|a faca|uma lamina|a lamina)\b",
    r"\bplanej(ei|ando|o|ado)\b",
    r"\bcarta de despedida\b",
    r"\bme (despedi|despedir|despedindo)\b",
    r"\b(vou|decidi|resolvi|irei) (me matar|me suicidar|tirar (a )?minha vida|acabar com (a )?minha vida)\b",
)

VIOLENCIA_OUTROS = _re(
    r"\b(vou|quero|vontade de|penso em|pensando em|vou acabar) (matar|machucar|esfaquear|atirar|agredir|espancar|bater) "
    r"(n?ele|n?ela|n?eles|n?elas|alguem|aquele|aquela|meu|minha|meus|minhas|o |a |os |as |todo mundo|geral|esse|essa|esses|essas|em )",
)
MEIOS_VIOLENCIA = re.compile(r"\b(arma|faca|revolver|pistola|veneno|plano|planej\w*)\b")

ABUSO = _re(
    r"\bme (bate|bateu|batendo|agride|agrediu|agredindo|espanca|espancou|estuprou|estupra|violentou|forca a|forcou a|obriga a fazer|tranca|trancou|prende em casa|ameaca|ameacou)\b",
    r"\b(abusa|abusou|abusaram|abusando) de mim\b",
    r"\bviolencia domestica\b",
    r"\babuso sexual\b",
    r"\bfui (estuprad|abusad|agredid|violentad|espancad)",
    r"\bestou sendo (agredid|abusad|ameacad|perseguid|espancad)",
    r"\btenho medo de (voltar (pra|para) casa|apanhar|ele me matar|ela me matar)\b",
)

DESORIENTACAO = _re(
    r"\bnao sei (onde estou|quem eu sou|quem sou)\b",
    r"\b(ouco|escuto|ouvindo|escutando|ouvi) vozes\b",
    r"\bvozes (que )?(me )?mand",
    r"\bnao consigo (me manter|ficar|me sentir) (em )?segur",
    r"\bperdi (a nocao|o contato) (de tudo|da realidade|com a realidade)\b",
)

# Sinais de contexto (não são risco por si): mudam as orientações dadas à IA.
SEGREDO = _re(
    r"\bnao (conta|conte|fala|fale|diga|diz) (pra|para|a) ninguem\b",
    r"\bpromete (que )?(nao|guardar|vai guardar)\b",
    r"\bguard(a|e|ar) (esse |este |o |meu |um )?segredo\b",
    r"\bfica (so )?entre (a gente|nos)\b",
    r"\bsegredo (entre|so nosso)\b",
)
TRATAMENTO = _re(
    r"\b(parar|largar|abandonar|deixar|suspender|interromper|cortar|tirar) (de tomar |de ir |de fazer |o |a |os |as |meu |minha |meus |minhas |com )*"
    r"(remedio|remedios|medicamento|medicacao|antidepressivo|ansiolitico|tratamento|terapia|psicolog|psiquiatr)",
    r"\b(parei|larguei|abandonei|deixei) de (tomar|ir|fazer)\b",
    r"\b(parar|largar|suspender|interromper|deixar) de tomar\b",
    r"\bnao (preciso|quero) mais (de |do |da )?(remedio|medicacao|terapia|psicolog|psiquiatr|tratamento)",
)
DIAGNOSTICO = _re(
    r"\b(sera que|acha que|voce acha|como saber se|como sei se|eu tenho|tenho|eu sou|sou) (eu )?(tenho |sou |estou com )?"
    r"(depressao|depressiv|ansiedade generalizada|tdah|bipolar|borderline|autis|toc\b|transtorno|esquizofren|sindrome do panico|panico)\b",
    r"\bme (de|da|dar|passa) (um |o )?diagnostico\b",
    r"\bmeu diagnostico\b",
    r"\bme diagnostic",
)


@dataclass
class Avaliacao:
    nivel: str = "nenhum"
    categorias: list = field(default_factory=list)  # autolesao, violencia_outros, abuso, desorientacao
    sinais: list = field(default_factory=list)      # segredo, tratamento, diagnostico

    def no_minimo(self, nivel):
        return NIVEIS.index(self.nivel) >= NIVEIS.index(nivel)


def _subir(atual, novo):
    return novo if NIVEIS.index(novo) > NIVEIS.index(atual) else atual


def avaliar(mensagem, anteriores=()):
    """Classifica a mensagem atual, olhando também as 3 últimas mensagens da pessoa."""
    atual = COLOQUIAIS.sub(" ", normalizar(mensagem))
    recentes = COLOQUIAIS.sub(" ", normalizar(" ".join(list(anteriores)[-3:])))
    av = Avaliacao()

    def marcar(categoria, nivel):
        if categoria not in av.categorias:
            av.categorias.append(categoria)
        av.nivel = _subir(av.nivel, nivel)

    sofrida = bool(AMEACA_SOFRIDA.search(atual))
    sem_ameacas = VAI_ME_MATAR.sub(" ", AMEACA_SOFRIDA.sub(" ", atual))  # "vai me matar" não é ideação
    tem_tempo = bool(TEMPO.search(atual))
    tem_plano = bool(PLANO.search(atual))
    ideacao_antes = bool(IDEACAO.search(VAI_ME_MATAR.sub(" ", recentes)))  # já falou em morrer nas últimas mensagens

    # Autolesão / suicídio
    if IDEACAO.search(sem_ameacas):
        marcar("autolesao", "imediato" if (tem_tempo or tem_plano) else "alto")
    elif ATENCAO_AUTOLESAO.search(sem_ameacas):
        # "quero acabar com tudo hoje" depois de "seria melhor não existir" é risco imediato
        if tem_plano or (tem_tempo and ideacao_antes):
            marcar("autolesao", "imediato")
        else:
            marcar("autolesao", "alto" if (tem_tempo or ideacao_antes) else "atencao")
    elif ideacao_antes:
        # Falou em morrer nas últimas mensagens: a conversa continua em modo cuidadoso.
        # Ex.: "quero morrer" antes e agora "já tenho um plano" → imediato.
        marcar("autolesao", "imediato" if tem_plano else "alto")

    # Violência sofrida (abuso, ameaça)
    if ABUSO.search(atual) or sofrida:
        marcar("abuso", "alto")
    elif VAI_ME_MATAR.search(atual):
        marcar("abuso", "atencao")

    # Violência contra outras pessoas: pode ser só desabafo de raiva, então
    # vira "alto" apenas com meios, plano ou tempo; senão a Luna pergunta.
    if VIOLENCIA_OUTROS.search(atual):
        marcar("violencia_outros", "alto" if (MEIOS_VIOLENCIA.search(atual) or tem_tempo or tem_plano) else "atencao")

    if DESORIENTACAO.search(atual):
        marcar("desorientacao", "alto")

    for nome, padrao in (("segredo", SEGREDO), ("tratamento", TRATAMENTO), ("diagnostico", DIAGNOSTICO)):
        if padrao.search(atual):
            av.sinais.append(nome)
    return av


# ===== CONTATOS DE AJUDA (Brasil) =====
CONTATOS = {
    "cvv": {"nome": "CVV", "numero": "188", "descricao": "Apoio emocional, ligação gratuita, 24 horas. Também tem chat em cvv.org.br."},
    "samu": {"nome": "SAMU", "numero": "192", "descricao": "Emergência médica, se houver risco imediato à vida."},
    "policia": {"nome": "Polícia Militar", "numero": "190", "descricao": "Se você ou outra pessoa estiver em perigo agora."},
    "mulher": {"nome": "Central de Atendimento à Mulher", "numero": "180", "descricao": "Orientação e denúncia de violência contra a mulher, 24 horas."},
    "direitos": {"nome": "Disque Direitos Humanos", "numero": "100", "descricao": "Denúncia de violência contra crianças, adolescentes, pessoas idosas e outras violações."},
}
CONTATOS_POR_CATEGORIA = {
    "autolesao": ("cvv", "samu"),
    "desorientacao": ("samu", "cvv"),
    "violencia_outros": ("policia", "cvv"),
    "abuso": ("policia", "mulher", "direitos", "cvv"),
}


def contatos(av):
    """Contatos a mostrar no cartão de ajuda. Só aparecem de "alto" para cima."""
    if not av.no_minimo("alto"):
        return []
    chaves = []
    for categoria in av.categorias:
        for chave in CONTATOS_POR_CATEGORIA.get(categoria, ()):
            if chave not in chaves:
                chaves.append(chave)
    return [CONTATOS[c] for c in chaves]


# ===== RESPOSTAS REVISADAS (usadas sem depender da IA) =====
RESPOSTAS_PADRAO = {
    "autolesao_imediato": (
        "Obrigada por me contar isso. Agora, o mais importante é você estar em segurança.\n\n"
        "Você está em segurança neste momento? Se existe risco de você se machucar agora, ligue **192 (SAMU)** "
        "ou vá ao pronto-socorro mais próximo. Se puder, chame alguém de confiança para ficar com você, pessoalmente.\n\n"
        "Se quiser falar com uma pessoa agora, o **CVV atende pelo 188**, de graça e 24 horas por dia, ou pelo chat em cvv.org.br.\n\n"
        "Sou uma IA e não consigo garantir sua segurança nem chamar ajuda por você. Mas posso continuar aqui enquanto você procura esse apoio."
    ),
    "autolesao": (
        "Obrigada por confiar isso a mim. O que você está sentindo importa, e eu não quero presumir nada: "
        "você está pensando em tirar a sua vida ou em se machucar?\n\n"
        "Se em algum momento sentir que pode se machucar, ligue **192 (SAMU)**. Para conversar com alguém agora, "
        "o **CVV atende pelo 188**, de graça e 24 horas por dia."
    ),
    "abuso": (
        "Ninguém merece ser tratado assim, e o que está acontecendo não é culpa sua. Você está em segurança agora?\n\n"
        "Se estiver em perigo, ligue **190**. Para orientação e denúncia, existem o **Ligue 180** (violência contra a mulher) "
        "e o **Disque 100** (crianças, adolescentes, pessoas idosas e outras violações). Se puder, conte para alguém de confiança que esteja perto."
    ),
    "violencia_outros": (
        "Dá pra perceber que você está com muita raiva, e isso merece ser levado a sério. Quero entender melhor: "
        "você está pensando em machucar alguém de verdade?\n\n"
        "Se sentir que pode perder o controle, tente se afastar da situação agora. Se alguém estiver em perigo, ligue **190**. "
        "Para conversar com alguém sobre o que você está sentindo, o **CVV atende pelo 188**."
    ),
    "desorientacao": (
        "Obrigada por me contar. Parece um momento muito difícil. Você está em um lugar seguro agora? "
        "Tem alguém de confiança por perto que possa ficar com você?\n\n"
        "Se sentir que não consegue se manter em segurança, ligue **192 (SAMU)**. O **CVV (188)** também atende 24 horas."
    ),
    "promessa": (
        "Quero ser honesta com você: sou uma IA e não posso prometer sigilo absoluto, proteção nem acompanhar você fora desta conversa. "
        "O que eu posso fazer é te ouvir agora, sem julgamento. O que está acontecendo?"
    ),
    "tratamento": (
        "Não posso orientar você a parar ou mudar um tratamento, porque isso pode trazer riscos. O mais seguro é conversar com quem "
        "acompanha você (médico, psiquiatra ou psicólogo) e contar com sinceridade o que está incomodando. "
        "Se quiser, posso te ajudar a organizar o que você quer dizer nessa conversa."
    ),
}


def resposta_padrao(av):
    """Texto revisado para quando a IA não deve ou não consegue responder em situação de risco."""
    prioridade = ("autolesao", "abuso", "desorientacao", "violencia_outros")
    categoria = next((c for c in prioridade if c in av.categorias), "autolesao")
    if categoria == "autolesao" and av.nivel == "imediato":
        return RESPOSTAS_PADRAO["autolesao_imediato"]
    return RESPOSTAS_PADRAO[categoria]


# ===== VERIFICAÇÃO DA RESPOSTA DA IA =====
PROMESSAS_PROIBIDAS = _re(
    r"(?<!nao )\bprometo (que )?(nao (vou )?(contar|falar|dizer)|guardar|manter (isso )?em segredo|ficar so entre)",
    r"\b(isso )?fica (so )?entre (a gente|nos)\b",
    r"\bseu segredo (esta|vai ficar) (seguro|guardado)\b",
    r"(?<!nao )(?<!nao consigo )(?<!nao posso )\bvou (te )?proteger\b",
    r"\bvou ficar de olho em voce\b",
    r"\b(sou|eu sou) (a )?(unica|o unico) que (te )?(entende|compreende)\b",
    r"\bso eu (te )?(entendo|compreendo)\b",
    r"\bnao precisa de mais ninguem\b",
)
INCENTIVO_PARAR_TRATAMENTO = _re(
    r"(?<!nao )\b(pode|deveria|deve|vale a pena|melhor) (parar|largar|abandonar|suspender|interromper) "
    r"(de tomar |de ir |o |a |os |as |seu |sua |seus |suas |com )*(remedio|medicamento|medicacao|antidepressivo|tratamento|terapia)",
    r"\bvoce nao precisa (mais )?(de |do |da )(remedio|medicamento|medicacao|terapia|psicologo|psiquiatra|tratamento)\b",
)
NUMEROS_AJUDA = re.compile(r"\b(188|192|190|180)\b")


def verificar_resposta(texto, av):
    """Garante, no código, o que a IA não pode deixar passar. Devolve o texto final."""
    normal = normalizar(texto)
    if PROMESSAS_PROIBIDAS.search(normal):
        return resposta_padrao(av) if av.no_minimo("alto") else RESPOSTAS_PADRAO["promessa"]
    if INCENTIVO_PARAR_TRATAMENTO.search(normal):
        return RESPOSTAS_PADRAO["tratamento"]
    if av.no_minimo("alto") and not NUMEROS_AJUDA.search(texto):
        lista = " · ".join(f"**{c['nome']}: {c['numero']}**" for c in contatos(av))
        texto = f"{texto.rstrip()}\n\nSe precisar de ajuda agora: {lista}."
    return texto
