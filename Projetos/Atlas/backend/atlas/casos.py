"""Catálogo de casos geopolíticos e suas variáveis contextualizadas.

Os textos de contexto descrevem dinâmicas estruturais conhecidas, sem datas nem números
atuais: fatos recentes vêm SEMPRE da pesquisa do Researcher, com fonte.
Os pesos das variáveis alimentam o motor determinístico (ver motor.py).
"""
from __future__ import annotations

from .modelos import Ator, Caso, Variavel

N3 = ["baixo", "moderado", "alto"]

CASOS: list[Caso] = [
    Caso(
        id="eua-china-tarifas",
        titulo="Escalada tarifária entre Estados Unidos e China",
        resumo="Aumento de tarifas sobre importações e possíveis retaliações entre as duas maiores economias.",
        contexto=(
            "Estados Unidos e China mantêm uma relação comercial interdependente, com cadeias de suprimento "
            "integradas em eletrônicos, máquinas e bens de consumo. Rodadas de tarifas e retaliações afetam preços, "
            "fluxos de comércio, investimento e o posicionamento de terceiros países que podem absorver comércio desviado."
        ),
        atores=[
            Ator(id="usa", nome="Estados Unidos", iso3="USA", papel="impõe as tarifas"),
            Ator(id="chn", nome="China", iso3="CHN", papel="alvo e possível retaliador"),
            Ator(id="ue", nome="União Europeia", iso3=None, papel="parceiro afetado por desvio de comércio"),
            Ator(id="vnm", nome="Vietnã", iso3="VNM", papel="possível destino de realocação produtiva"),
            Ator(id="mex", nome="México", iso3="MEX", papel="possível destino de realocação produtiva"),
            Ator(id="bra", nome="Brasil", iso3="BRA", papel="exportador de commodities para ambos"),
        ],
        variaveis=[
            Variavel(id="tarifa", nome="Tarifa adicional média", descricao="Acréscimo tarifário médio sobre importações da China.", minimo=0, maximo=150, passo=5, padrao=30, unidade="%", pesos={"economico": 1.0, "diplomatico": 0.5, "estrategico": 0.3}, efeito_escalada=0.6),
            Variavel(id="abrangencia", nome="Abrangência das restrições", descricao="Parcela das importações cobertas pelas tarifas.", padrao=50, unidade="% das importações", pesos={"economico": 0.9, "diplomatico": 0.3, "estrategico": 0.4}, efeito_escalada=0.4),
            Variavel(id="duracao", nome="Duração estimada da medida", descricao="Por quanto tempo as tarifas devem vigorar.", minimo=1, maximo=36, padrao=12, unidade="meses", pesos={"economico": 0.6, "diplomatico": 0.4, "estrategico": 0.5}, efeito_escalada=0.3),
            Variavel(id="retaliacao", nome="Grau de retaliação chinesa", descricao="Intensidade das contramedidas da China (tarifas, controles, listas de entidades).", padrao=50, rotulos=["nenhuma", "simbólica", "proporcional", "ampliada", "assimétrica"], pesos={"economico": 0.7, "diplomatico": 0.8, "estrategico": 0.6}, efeito_escalada=0.8),
            Variavel(id="diplomacia", nome="Engajamento diplomático", descricao="Intensidade das negociações e canais de diálogo abertos.", padrao=40, rotulos=["congelado", "protocolar", "ativo", "intenso", "acordo em negociação"], pesos={"economico": 0.2, "diplomatico": 0.9, "estrategico": 0.4}, efeito_escalada=-0.8),
        ],
        hipoteses=[
            "Tarifas mais altas reduzem o comércio bilateral direto e desviam parte dele para terceiros países.",
            "Retaliação proporcional tende a manter a disputa em ciclos de escalada controlada.",
            "Canais diplomáticos ativos reduzem a chance de medidas fora do campo tarifário.",
        ],
        consultas=["US China tariffs latest", "China retaliation tariffs United States", "US China trade talks"],
        premissas_padrao=[
            "Não há conflito militar direto entre as partes no horizonte analisado.",
            "As instituições multilaterais de comércio não resolvem a disputa no período.",
        ],
    ),
    Caso(
        id="sancoes-russia",
        titulo="Sanções econômicas contra a Rússia",
        resumo="Ampliação ou flexibilização de sanções financeiras e energéticas e seus efeitos de contorno.",
        contexto=(
            "Sanções financeiras e energéticas buscam reduzir receitas e acesso a tecnologia do país-alvo. "
            "A eficácia depende da adesão internacional, da capacidade de fiscalização e de rotas alternativas "
            "de comércio com países que não aderem às medidas."
        ),
        atores=[
            Ator(id="rus", nome="Rússia", iso3="RUS", papel="país-alvo"),
            Ator(id="usa", nome="Estados Unidos", iso3="USA", papel="impõe sanções"),
            Ator(id="ue", nome="União Europeia", iso3=None, papel="impõe sanções"),
            Ator(id="chn", nome="China", iso3="CHN", papel="parceiro comercial não aderente"),
            Ator(id="ind", nome="Índia", iso3="IND", papel="comprador de energia"),
            Ator(id="tur", nome="Turquia", iso3="TUR", papel="intermediário comercial"),
        ],
        variaveis=[
            Variavel(id="financeiras", nome="Abrangência das sanções financeiras", descricao="Bancos e ativos atingidos, incluindo exclusão de sistemas de mensagens interbancárias.", padrao=60, unidade="%", pesos={"economico": 1.0, "diplomatico": 0.5, "estrategico": 0.5}, efeito_escalada=0.5),
            Variavel(id="energia", nome="Restrições à energia", descricao="Rigidez de embargos e tetos de preço sobre petróleo e gás.", padrao=50, rotulos=["nenhuma", "parcial", "teto de preço", "embargo amplo", "embargo + fiscalização marítima"], pesos={"economico": 0.9, "diplomatico": 0.6, "estrategico": 0.6}, efeito_escalada=0.5),
            Variavel(id="adesao", nome="Adesão internacional", descricao="Quantos países relevantes aplicam as medidas.", padrao=40, rotulos=["isolada", "G7", "G7 ampliado", "ampla", "quase universal"], pesos={"economico": 0.6, "diplomatico": 0.9, "estrategico": 0.5}, efeito_escalada=0.2),
            Variavel(id="fiscalizacao", nome="Fiscalização contra contorno", descricao="Sanções secundárias e controle de intermediários.", padrao=40, pesos={"economico": 0.5, "diplomatico": 0.8, "estrategico": 0.4}, efeito_escalada=0.4),
            Variavel(id="contramedidas", nome="Contramedidas do país-alvo", descricao="Restrições de exportação, nacionalização de ativos estrangeiros, cortes de fornecimento.", padrao=40, pesos={"economico": 0.7, "diplomatico": 0.7, "estrategico": 0.7}, efeito_escalada=0.7),
        ],
        hipoteses=[
            "Sanções com baixa adesão internacional tendem a ser contornadas por terceiros países.",
            "Restrições energéticas afetam preços globais e as receitas do país-alvo de forma desigual.",
            "Fiscalização de intermediários aumenta tensões diplomáticas com países não aderentes.",
        ],
        consultas=["Russia sanctions latest", "Russia oil price cap enforcement", "secondary sanctions Russia intermediaries"],
        premissas_padrao=[
            "O regime de sanções existente é o ponto de partida.",
            "Não há acordo de paz abrangente que suspenda as sanções no horizonte.",
        ],
    ),
    Caso(
        id="estreito-taiwan",
        titulo="Crise diplomática no Estreito de Taiwan",
        resumo="Aumento de tensões políticas e militares envolvendo China, Taiwan e parceiros regionais.",
        contexto=(
            "O Estreito de Taiwan concentra rotas marítimas e a produção de semicondutores avançados. "
            "Exercícios militares, retórica oficial e medidas econômicas coercitivas alternam-se com "
            "mecanismos de comunicação que reduzem o risco de incidentes."
        ),
        atores=[
            Ator(id="chn", nome="China", iso3="CHN", papel="reivindica soberania"),
            Ator(id="twn", nome="Taiwan", iso3="TWN", papel="governo da ilha"),
            Ator(id="usa", nome="Estados Unidos", iso3="USA", papel="parceiro de segurança"),
            Ator(id="jpn", nome="Japão", iso3="JPN", papel="vizinho e aliado dos EUA"),
            Ator(id="phl", nome="Filipinas", iso3="PHL", papel="vizinho e aliado dos EUA"),
        ],
        variaveis=[
            Variavel(id="exercicios", nome="Intensidade de exercícios militares", descricao="Frequência e escala de manobras perto da ilha.", padrao=50, rotulos=["rotina", "elevada", "grande escala", "bloqueio simulado", "quarentena"], pesos={"economico": 0.4, "diplomatico": 0.7, "estrategico": 1.0}, efeito_escalada=0.8),
            Variavel(id="retorica", nome="Retórica oficial", descricao="Dureza das declarações de governo.", padrao=50, pesos={"economico": 0.2, "diplomatico": 0.9, "estrategico": 0.5}, efeito_escalada=0.5),
            Variavel(id="coercao", nome="Medidas econômicas coercitivas", descricao="Restrições a importações, turismo e insumos.", padrao=30, pesos={"economico": 0.9, "diplomatico": 0.6, "estrategico": 0.4}, efeito_escalada=0.5),
            Variavel(id="terceiros", nome="Envolvimento de terceiros", descricao="Presença naval e declarações de aliados.", padrao=40, pesos={"economico": 0.3, "diplomatico": 0.7, "estrategico": 0.9}, efeito_escalada=0.4),
            Variavel(id="comunicacao", nome="Canais de comunicação de crise", descricao="Linhas diretas e diálogo militar ativos.", padrao=40, pesos={"economico": 0.2, "diplomatico": 0.8, "estrategico": 0.7}, efeito_escalada=-0.9),
        ],
        hipoteses=[
            "Canais de comunicação ativos reduzem a chance de incidentes não intencionais.",
            "Medidas econômicas coercitivas afetam cadeias de semicondutores e comércio regional.",
            "Maior presença de terceiros aumenta a dissuasão e também a percepção de ameaça.",
        ],
        consultas=["Taiwan Strait military drills", "China Taiwan tensions latest", "US China military communication channel"],
        premissas_padrao=[
            "Não há declaração formal de independência nem invasão no horizonte analisado.",
            "As rotas marítimas permanecem abertas ao comércio civil.",
        ],
    ),
    Caso(
        id="chips-exportacao",
        titulo="Restrições à exportação de semicondutores avançados",
        resumo="Controles sobre chips e equipamentos de fabricação e respostas com minerais críticos.",
        contexto=(
            "Controles de exportação sobre chips avançados e equipamentos de litografia buscam limitar capacidades "
            "tecnológicas e militares. A eficácia depende da adesão de países que dominam etapas da cadeia; o alvo "
            "pode responder com restrições a minerais críticos e investimento em autossuficiência."
        ),
        atores=[
            Ator(id="usa", nome="Estados Unidos", iso3="USA", papel="impõe os controles"),
            Ator(id="chn", nome="China", iso3="CHN", papel="alvo dos controles"),
            Ator(id="nld", nome="Países Baixos", iso3="NLD", papel="fornecedor de equipamentos"),
            Ator(id="jpn", nome="Japão", iso3="JPN", papel="fornecedor de equipamentos e materiais"),
            Ator(id="kor", nome="Coreia do Sul", iso3="KOR", papel="fabricante de memórias"),
            Ator(id="twn", nome="Taiwan", iso3="TWN", papel="fabricante de chips avançados"),
        ],
        variaveis=[
            Variavel(id="escopo", nome="Escopo tecnológico dos controles", descricao="Que gerações de chips e equipamentos são restritas.", padrao=60, pesos={"economico": 0.7, "diplomatico": 0.5, "estrategico": 1.0}, efeito_escalada=0.5),
            Variavel(id="aliados", nome="Adesão dos aliados", descricao="Alinhamento de fornecedores-chave aos controles.", padrao=60, pesos={"economico": 0.6, "diplomatico": 0.8, "estrategico": 0.8}, efeito_escalada=0.3),
            Variavel(id="minerais", nome="Retaliação com minerais críticos", descricao="Restrições do alvo à exportação de insumos como gálio, germânio e terras raras.", padrao=40, pesos={"economico": 0.9, "diplomatico": 0.6, "estrategico": 0.7}, efeito_escalada=0.7),
            Variavel(id="autossuficiencia", nome="Investimento em autossuficiência", descricao="Esforço do alvo para substituir tecnologia importada.", padrao=60, pesos={"economico": 0.5, "diplomatico": 0.2, "estrategico": 0.8}, efeito_escalada=0.1),
            Variavel(id="licencas", nome="Flexibilidade de licenças", descricao="Concessão de exceções e licenças para exportadores.", padrao=40, pesos={"economico": 0.6, "diplomatico": 0.5, "estrategico": 0.3}, efeito_escalada=-0.6),
        ],
        hipoteses=[
            "Controles sem adesão dos fornecedores de equipamentos têm efeito limitado.",
            "Retaliação com minerais críticos eleva custos de toda a cadeia global.",
            "Investimento em autossuficiência reduz a eficácia dos controles no longo prazo.",
        ],
        consultas=["semiconductor export controls China latest", "China critical minerals export restrictions gallium germanium", "Netherlands Japan chip equipment export controls"],
        premissas_padrao=[
            "Os controles existentes são o ponto de partida.",
            "Não há ruptura física da produção em Taiwan no horizonte.",
        ],
    ),
    Caso(
        id="mercosul-ue",
        titulo="Acordo comercial Mercosul–União Europeia",
        resumo="Implementação, atraso ou bloqueio do acordo e seus efeitos para o Brasil e parceiros.",
        contexto=(
            "O acordo entre Mercosul e União Europeia prevê redução de tarifas e regras sobre compras governamentais, "
            "serviços e sustentabilidade. A ratificação enfrenta resistências agrícolas e ambientais na Europa, "
            "enquanto o Mercosul busca diversificar mercados diante da forte relação comercial com a China."
        ),
        atores=[
            Ator(id="bra", nome="Brasil", iso3="BRA", papel="maior economia do Mercosul"),
            Ator(id="arg", nome="Argentina", iso3="ARG", papel="membro do Mercosul"),
            Ator(id="ue", nome="União Europeia", iso3=None, papel="contraparte do acordo"),
            Ator(id="fra", nome="França", iso3="FRA", papel="principal resistência agrícola"),
            Ator(id="deu", nome="Alemanha", iso3="DEU", papel="defensora do acordo"),
            Ator(id="chn", nome="China", iso3="CHN", papel="principal parceiro comercial do Mercosul"),
        ],
        variaveis=[
            Variavel(id="reducao", nome="Profundidade da redução tarifária", descricao="Parcela das linhas tarifárias liberalizadas na implementação.", padrao=60, unidade="%", pesos={"economico": 1.0, "diplomatico": 0.5, "estrategico": 0.4}, efeito_escalada=-0.3),
            Variavel(id="salvaguardas", nome="Salvaguardas agrícolas e ambientais", descricao="Rigidez das cláusulas de proteção e de cumprimento ambiental.", padrao=50, pesos={"economico": 0.6, "diplomatico": 0.7, "estrategico": 0.3}, efeito_escalada=0.2),
            Variavel(id="resistencia", nome="Resistência política europeia", descricao="Força da oposição de governos e setores agrícolas.", padrao=50, rotulos=["mínima", "pontual", "relevante", "forte", "bloqueadora"], pesos={"economico": 0.5, "diplomatico": 0.9, "estrategico": 0.4}, efeito_escalada=0.6),
            Variavel(id="ritmo", nome="Ritmo de implementação", descricao="Velocidade de entrada em vigor das reduções.", padrao=50, pesos={"economico": 0.8, "diplomatico": 0.4, "estrategico": 0.3}, efeito_escalada=-0.3),
            Variavel(id="china", nome="Aproximação concorrente com a China", descricao="Intensidade de acordos paralelos do Mercosul com a China.", padrao=40, pesos={"economico": 0.6, "diplomatico": 0.6, "estrategico": 0.8}, efeito_escalada=0.3),
        ],
        hipoteses=[
            "Salvaguardas mais rígidas facilitam a ratificação europeia, mas reduzem ganhos agrícolas do Mercosul.",
            "Atrasos na implementação aumentam o incentivo do Mercosul a aprofundar laços com a China.",
            "A resistência agrícola europeia é o principal ponto de veto do acordo.",
        ],
        consultas=["Mercosur EU trade agreement ratification", "France opposition Mercosur deal farmers", "acordo Mercosul União Europeia"],
        premissas_padrao=[
            "O texto negociado do acordo é a base da análise.",
            "Não há saída de membros do Mercosul no horizonte.",
        ],
    ),
]

# Caso livre: variáveis genéricas, deixadas explícitas como genéricas na interface.
VARIAVEIS_GENERICAS = [
    Variavel(id="intensidade", nome="Intensidade da medida principal", descricao="Força da ação que desencadeia a situação (genérica, pois o caso é livre).", padrao=50, pesos={"economico": 0.7, "diplomatico": 0.6, "estrategico": 0.6}, efeito_escalada=0.6),
    Variavel(id="abrangencia", nome="Abrangência", descricao="Quantos setores ou atores são atingidos.", padrao=50, pesos={"economico": 0.8, "diplomatico": 0.4, "estrategico": 0.4}, efeito_escalada=0.3),
    Variavel(id="duracao", nome="Duração estimada", descricao="Tempo previsto da medida.", minimo=1, maximo=36, padrao=12, unidade="meses", pesos={"economico": 0.6, "diplomatico": 0.4, "estrategico": 0.5}, efeito_escalada=0.3),
    Variavel(id="retaliacao", nome="Grau de retaliação", descricao="Intensidade da resposta da parte afetada.", padrao=40, pesos={"economico": 0.6, "diplomatico": 0.8, "estrategico": 0.6}, efeito_escalada=0.8),
    Variavel(id="diplomacia", nome="Engajamento diplomático", descricao="Canais de negociação abertos.", padrao=40, pesos={"economico": 0.2, "diplomatico": 0.9, "estrategico": 0.4}, efeito_escalada=-0.8),
]

_INDICE = {c.id: c for c in CASOS}


def listar() -> list[Caso]:
    return CASOS


def obter(caso_id: str) -> Caso | None:
    return _INDICE.get(caso_id)


def caso_personalizado(titulo: str, descricao: str) -> Caso:
    """Caso descrito pelo usuário. Atores e fatos são identificados pelo Researcher/Analyst."""
    return Caso(
        id="personalizado",
        titulo=titulo.strip()[:140] or "Situação personalizada",
        resumo=descricao.strip()[:300],
        contexto=descricao.strip()[:1500],
        atores=[],
        variaveis=VARIAVEIS_GENERICAS,
        hipoteses=["As hipóteses deste caso são formuladas pelo Analyst a partir das evidências."],
        consultas=[titulo.strip()[:120] or descricao.strip()[:120]],
        premissas_padrao=["Caso descrito livremente pelo usuário; variáveis genéricas."],
        personalizado=True,
    )
