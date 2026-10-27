/**
 * SIMULAÇÃO ILUSTRATIVA para a prévia. Elaborada manualmente com pesquisa na web em
 * 27/10/2026 — NÃO foi produzida pelo motor do Iris (que ainda não existe). Serve para mostrar
 * como um resultado de investigação apareceria na plataforma.
 *
 * Regras seguidas: toda afirmação tem tipo epistêmico; fatos e evidências citam fontes; cenários
 * são condicionais; nenhuma probabilidade é atribuída.
 */
import type { ResultadoDeInvestigacao } from "../lib/investigacao";

export const INVESTIGACAO_EXEMPLO: ResultadoDeInvestigacao = {
  id: "exemplo-flavio-2026",
  pergunta: "O que aconteceria se Flávio Bolsonaro tivesse vencido a eleição presidencial de 2026 no Brasil?",
  natureza: "Contrafactual",
  horizonte: { inicio: 2027, fim: 2030 },
  escopo: "Global, com foco em América do Sul, Estados Unidos, China e União Europeia",
  dimensoes: ["Diplomacia", "Comércio", "Economia", "Segurança", "Energia", "Tecnologia"],
  profundidade: "Padrão",
  origem: "Simulação ilustrativa elaborada manualmente com pesquisa na web (27/10/2026). Não foi produzida pelo motor do Iris.",
  atualizadoEm: "2026-10-27",

  avisoDeContexto: {
    tipo: "fato",
    texto:
      "No resultado real, Lula (PT) foi reeleito no segundo turno de 25/10/2026, com 51,79% dos votos válidos contra 48,21% de Flávio Bolsonaro (PL). Esta investigação explora o caminho que não aconteceu.",
    fontes: ["tre-sp", "wiki-2026"],
  },

  sintese: [
    {
      tipo: "inferencia",
      texto:
        "A variável que mais separaria os futuros possíveis é o grau de alinhamento com os Estados Unidos — de cooperação pragmática a adesão plena ao Escudo das Américas — e como a China reagiria a isso, já que é destino de cerca de um quarto do comércio brasileiro.",
      fontes: ["metropoles-escudo", "poder360-china"],
    },
    {
      tipo: "inferencia",
      texto:
        "A promessa de indulto a Jair Bolsonaro cria um teste institucional logo no primeiro ano. A forma como esse conflito com o STF fosse resolvido condicionaria a capacidade do governo de executar a agenda externa e econômica.",
      fontes: ["sbt-indulto"],
    },
    {
      tipo: "cenario",
      texto:
        "Três trajetórias são plausíveis e não excludentes: pragmatismo alinhado (A), alinhamento hemisférico com atrito com a China (B) e primazia da crise institucional (C). Nenhuma é previsão: cada uma depende de premissas declaradas abaixo.",
    },
    {
      tipo: "incerteza",
      texto:
        "A sucessão nos EUA (eleição de novembro de 2028) é um fator externo que poderia mudar o valor do alinhamento no meio do mandato, em qualquer trajetória.",
    },
  ],

  pontoDePartida: [
    {
      tipo: "fato",
      texto: "No primeiro turno (4/10/2026), Flávio terminou à frente: 47,03% contra 45,16% de Lula. A virada no segundo turno foi inédita.",
      fontes: ["wiki-2026"],
    },
    {
      tipo: "evidencia",
      texto:
        "O programa de Flávio propõe política externa \"pragmática\", com parcerias prioritárias com EUA, Israel, Argentina, China e União Europeia, retomada da adesão à OCDE, abertura comercial gradual, mineração de minerais críticos e data centers.",
      fontes: ["conectado-pe", "poder360-propostas"],
    },
    {
      tipo: "evidencia",
      texto:
        "Flávio defendeu a adesão do Brasil ao Escudo das Américas, aliança de segurança do governo Trump; em 26/05/2026, na Casa Branca, pediu a classificação do PCC e do Comando Vermelho como organizações terroristas.",
      fontes: ["metropoles-escudo", "portaltela-trump"],
    },
    {
      tipo: "evidencia",
      texto:
        "Os EUA aplicam tarifas sobre produtos brasileiros desde 2025 (anúncio de 50% em julho de 2025, vinculado por Trump ao julgamento de Jair Bolsonaro). Em 2026, reportagens descrevem nova sobretaxa e negociação sem acordo antes da eleição.",
      fontes: ["fortune-tarifa", "politicalivre-tarifa", "exame-tarifa"],
    },
    {
      tipo: "fato",
      texto:
        "A China respondeu por 27,2% da corrente comercial brasileira em 2025; soja, minério de ferro e petróleo somaram 74,2% das exportações ao país.",
      fontes: ["poder360-china"],
    },
    {
      tipo: "evidencia",
      texto:
        "O plano econômico (\"Tesouraço\") prevê nova regra fiscal, corte de ao menos dez ministérios e retomada de privatizações, sem incluir Petrobras, Banco do Brasil e Caixa, segundo a coordenação econômica da campanha.",
      fontes: ["sbt-economia", "forbes-tesouraco"],
    },
    {
      tipo: "evidencia",
      texto:
        "Flávio prometeu indulto ao pai, condenado pelo STF em setembro de 2025 a 27 anos e 3 meses. Especialistas ouvidos pela imprensa avaliam que, mesmo com indulto, Jair continuaria inelegível.",
      fontes: ["sbt-indulto"],
    },
    {
      tipo: "fato",
      texto:
        "O acordo Mercosul–União Europeia foi ratificado pelo Brasil e tem aplicação provisória desde maio de 2026, enquanto o Tribunal de Justiça da UE analisa sua legalidade; a França é a principal opositora.",
      fontes: ["jb-mercosul", "aduana-mercosul"],
    },
    {
      tipo: "fato",
      texto: "Em 3/1/2026, uma operação militar dos EUA capturou Nicolás Maduro; a Venezuela fechou a fronteira com o Brasil em Roraima.",
      fontes: ["poder360-venezuela"],
    },
  ],

  premissas: [
    { tipo: "hipotese", texto: "Flávio vence o segundo turno por margem estreita, semelhante à do resultado real, e toma posse em janeiro de 2027." },
    { tipo: "hipotese", texto: "O governo precisa de partidos de centro no Congresso para aprovar reformas: o PL sozinho não tem maioria." },
    { tipo: "hipotese", texto: "Trump segue na presidência dos EUA até janeiro de 2029, e a relação EUA–China continua competitiva." },
    { tipo: "hipotese", texto: "As promessas de campanha (Escudo das Américas, indulto, Tesouraço, OCDE) são tentadas no primeiro ano." },
  ],

  variaveis: [
    {
      nome: "Relação com os EUA",
      porQueImporta: "Define tarifas, cooperação de segurança e acesso a investimento e tecnologia.",
      estadoAtual: { tipo: "evidencia", texto: "Tarifas americanas em vigor e negociação travada em 2026.", fontes: ["politicalivre-tarifa"] },
      direcao: {
        A: "Acordo comercial e cooperação de inteligência, sem presença militar",
        B: "Adesão plena ao Escudo, com cooperação militar ampla",
        C: "Apoio político de Washington, mas agenda bilateral parada",
      },
    },
    {
      nome: "Relação com a China",
      porQueImporta: "Maior parceira comercial; compradora de soja, minério e petróleo.",
      estadoAtual: { tipo: "fato", texto: "27,2% da corrente comercial em 2025.", fontes: ["poder360-china"] },
      direcao: {
        A: "Comércio preservado; cooperação política mais fria",
        B: "Atrito: restrições a investimentos chineses e diversificação de fornecedores por Pequim",
        C: "Comércio inalterado; relação política negligenciada",
      },
    },
    {
      nome: "Estabilidade institucional",
      porQueImporta: "O indulto pode abrir conflito com o STF e consumir capital político.",
      estadoAtual: { tipo: "evidencia", texto: "Indulto prometido; validade jurídica em disputa.", fontes: ["sbt-indulto"] },
      direcao: {
        A: "Solução negociada via Congresso, sem ruptura",
        B: "Tensão moderada e recorrente",
        C: "Crise aberta entre Poderes",
      },
    },
    {
      nome: "Política fiscal e mercados",
      porQueImporta: "Credibilidade fiscal afeta câmbio, juros e investimento externo.",
      estadoAtual: { tipo: "evidencia", texto: "\"Tesouraço\" sem metas numéricas detalhadas.", fontes: ["forbes-tesouraco"] },
      direcao: {
        A: "Reforma parcial aprovada; prêmio de risco cai",
        B: "Reforma parcial; perdas no agro pressionam contas externas",
        C: "Agenda travada; prêmio de risco sobe",
      },
    },
    {
      nome: "Meio ambiente e acordo com a UE",
      porQueImporta: "Cláusulas ambientais condicionam o acordo Mercosul–UE e o acesso ao mercado europeu.",
      estadoAtual: { tipo: "fato", texto: "Acordo em aplicação provisória; TJUE ainda decide.", fontes: ["jb-mercosul"] },
      direcao: {
        A: "Metas ambientais mantidas; acordo segue",
        B: "Flexibilização ambiental; UE trava a ratificação completa",
        C: "Paralisia: decisões adiadas",
      },
    },
  ],

  trajetorias: [
    {
      id: "A",
      nome: "Pragmatismo alinhado",
      resumo:
        "O Brasil se aproxima dos EUA por acordos comerciais e de segurança limitados, sem romper com a China. O conflito do indulto é negociado.",
      premissas: [
        "Acordo tarifário com os EUA no primeiro semestre de 2027",
        "Adesão ao Escudo restrita a inteligência e combate ao crime, sem tropas",
        "China mantém compras por necessidade (soja, minério, petróleo)",
        "Indulto encaminhado sem confronto direto com o STF",
      ],
      efeitos: [
        { regiao: "Estados Unidos", regioes: ["america-norte"], efeito: "aproximacao", texto: "Brasil vira parceiro preferencial na América do Sul; minerais críticos entram nas cadeias americanas." },
        { regiao: "América do Sul", regioes: ["america-sul"], efeito: "aproximacao", texto: "Eixo com Argentina, Chile e Paraguai alinhado a Washington; Mercosul com agenda de abertura." },
        { regiao: "China", regioes: ["asia-pacifico"], efeito: "misto", texto: "Comércio preservado; novos investimentos chineses em setores sensíveis desaceleram." },
        { regiao: "União Europeia", regioes: ["europa"], efeito: "aproximacao", texto: "Acordo Mercosul–UE avança se as metas ambientais forem mantidas." },
        { regiao: "Rússia e Ásia Central", regioes: ["eurasia"], efeito: "neutro", texto: "Relação de baixo perfil; Brasil reduz o papel de ponte no BRICS." },
      ],
      marcos: [
        { ano: 2027, texto: "Acordo comercial com os EUA; pedido de adesão à OCDE retomado" },
        { ano: 2028, texto: "Investimentos em minerais críticos e data centers" },
        { ano: 2029, texto: "Novo governo nos EUA testa o alinhamento" },
        { ano: 2030, texto: "Eleição no Brasil avalia os resultados econômicos" },
      ],
      relacoes: [
        { de: "brasil", para: "eua", tipo: "alianca" },
        { de: "brasil", para: "argentina", tipo: "alianca" },
        { de: "brasil", para: "china", tipo: "fluxo" },
        { de: "brasil", para: "ue", tipo: "fluxo" },
        { de: "eua", para: "china", tipo: "rivalidade" },
        { de: "brasil", para: "stf", tipo: "rivalidade" },
      ],
    },
    {
      id: "B",
      nome: "Alinhamento hemisférico e atrito com a China",
      resumo:
        "O Brasil adere plenamente à agenda de segurança dos EUA e adota medidas restritivas à China. Ganha um aliado forte e perde margem comercial.",
      premissas: [
        "Decreto de adesão plena ao Escudo das Américas em 2027",
        "Restrições a investimento e tecnologia chineses",
        "Baixo perfil no BRICS e nas negociações climáticas",
        "Flexibilização de regras ambientais",
      ],
      efeitos: [
        { regiao: "Estados Unidos", regioes: ["america-norte"], efeito: "aproximacao", texto: "Cooperação militar e de inteligência ampla; base de apoio no hemisfério." },
        { regiao: "América do Sul", regioes: ["america-sul"], efeito: "misto", texto: "Bloco pró-EUA consolidado; Brasil apoia a transição na Venezuela tutelada pelos EUA; tensão com governos de esquerda da região." },
        { regiao: "China", regioes: ["asia-pacifico"], efeito: "atrito", texto: "Pequim diversifica fornecedores agrícolas e reduz investimentos; exportações brasileiras caem." },
        { regiao: "União Europeia", regioes: ["europa"], efeito: "atrito", texto: "França e Parlamento Europeu usam cláusulas ambientais para frear a ratificação completa." },
        { regiao: "Rússia e Ásia Central", regioes: ["eurasia", "asia-sul", "mena", "africa"], efeito: "atrito", texto: "BRICS perde um membro fundador ativo; China e Rússia ganham peso relativo no bloco e no Sul Global." },
      ],
      marcos: [
        { ano: 2027, texto: "Adesão plena ao Escudo; primeiras restrições a investimentos chineses" },
        { ano: 2028, texto: "China reduz compras de soja; UE trava o acordo de parceria" },
        { ano: 2029, texto: "Mudança de governo nos EUA pode deixar o Brasil exposto" },
        { ano: 2030, texto: "Eleição no Brasil sob efeito das perdas no agro" },
      ],
      relacoes: [
        { de: "brasil", para: "eua", tipo: "alianca" },
        { de: "brasil", para: "argentina", tipo: "alianca" },
        { de: "brasil", para: "china", tipo: "rivalidade" },
        { de: "brasil", para: "china", tipo: "dependencia" },
        { de: "brasil", para: "ue", tipo: "rivalidade" },
        { de: "brasil", para: "venezuela", tipo: "causalidade" },
        { de: "eua", para: "venezuela", tipo: "causalidade" },
      ],
    },
    {
      id: "C",
      nome: "Primazia da crise institucional",
      resumo:
        "O indulto abre um confronto entre Poderes que domina o mandato. A política externa fica reativa e o país perde capacidade de influência.",
      premissas: [
        "Indulto concedido nos primeiros meses",
        "STF declara o indulto inconstitucional",
        "Congresso fragmentado e sem coalizão estável",
        "Agenda externa sem prioridade",
      ],
      efeitos: [
        { regiao: "Estados Unidos", regioes: ["america-norte"], efeito: "misto", texto: "Apoio político explícito ao governo, com atrito com o Judiciário brasileiro (precedente: tarifas de 2025 ligadas ao julgamento)." },
        { regiao: "América do Sul", regioes: ["america-sul"], efeito: "neutro", texto: "Brasil perde capacidade de liderança regional; outros países ocupam o espaço." },
        { regiao: "China", regioes: ["asia-pacifico"], efeito: "neutro", texto: "Comércio segue por inércia; nenhuma iniciativa nova." },
        { regiao: "União Europeia", regioes: ["europa"], efeito: "atrito", texto: "Preocupação com o Estado de direito desacelera a ratificação do acordo de parceria." },
        { regiao: "Global", regioes: ["eurasia", "asia-sul", "mena", "africa"], efeito: "atrito", texto: "Soft power reduzido; Brasil pouco presente em clima e comércio multilateral." },
      ],
      marcos: [
        { ano: 2027, texto: "Indulto e reação do STF; confronto entre Poderes" },
        { ano: 2028, texto: "Eleições municipais funcionam como termômetro da crise" },
        { ano: 2029, texto: "Desgaste fiscal e de imagem externa" },
        { ano: 2030, texto: "Eleição no Brasil sob polarização elevada" },
      ],
      relacoes: [
        { de: "brasil", para: "stf", tipo: "rivalidade" },
        { de: "eua", para: "brasil", tipo: "alianca" },
        { de: "eua", para: "stf", tipo: "rivalidade" },
        { de: "brasil", para: "china", tipo: "fluxo" },
        { de: "ue", para: "brasil", tipo: "causalidade" },
      ],
    },
  ],

  calendario: [
    { data: "jan. 2027", ano: 2027, texto: "Posse presidencial" },
    { data: "out. 2028", ano: 2028, texto: "Eleições municipais no Brasil" },
    { data: "nov. 2028", ano: 2028, texto: "Eleição presidencial nos EUA" },
    { data: "jan. 2029", ano: 2029, texto: "Posse do novo governo dos EUA" },
    { data: "out. 2030", ano: 2030, texto: "Eleições gerais no Brasil" },
  ],

  atores: [
    { id: "brasil", nome: "Brasil", x: 300, y: 190 },
    { id: "eua", nome: "EUA", x: 140, y: 70 },
    { id: "china", nome: "China", x: 520, y: 90 },
    { id: "argentina", nome: "Argentina", x: 150, y: 300 },
    { id: "ue", nome: "União Europeia", x: 470, y: 290 },
    { id: "venezuela", nome: "Venezuela", x: 60, y: 190 },
    { id: "stf", nome: "STF", x: 330, y: 330 },
  ],

  sinais: [
    { sinal: "Redução ou retirada das tarifas americanas nos primeiros 100 dias", variavel: "Relação com os EUA", favorece: ["A"], ondeAcompanhar: "USTR, Diário Oficial, MRE", quando: "1º semestre 2027" },
    { sinal: "Decreto de adesão ao Escudo das Américas com cooperação militar", variavel: "Relação com os EUA", favorece: ["B"], ondeAcompanhar: "Diário Oficial, Ministério da Defesa", quando: "2027" },
    { sinal: "Participação chinesa nas compras de soja da safra 2027/28", variavel: "Relação com a China", favorece: ["A", "B"], ondeAcompanhar: "Comex Stat (MDIC), Alfândega da China", quando: "2027–2028" },
    { sinal: "Indulto publicado e ação no STF contra ele", variavel: "Estabilidade institucional", favorece: ["C"], ondeAcompanhar: "Diário Oficial, pauta do STF", quando: "2027" },
    { sinal: "Aprovação do novo arcabouço fiscal no Congresso", variavel: "Política fiscal e mercados", favorece: ["A"], ondeAcompanhar: "Câmara, Senado, curva de juros", quando: "2027" },
    { sinal: "Taxa anual de desmatamento (PRODES) e reação da UE", variavel: "Meio ambiente e acordo com a UE", favorece: ["B"], ondeAcompanhar: "INPE, Comissão Europeia", quando: "Anual" },
    { sinal: "Parecer do Tribunal de Justiça da UE sobre o acordo", variavel: "Meio ambiente e acordo com a UE", favorece: ["A", "B", "C"], ondeAcompanhar: "Curia (TJUE)", quando: "Sem data" },
    { sinal: "Resultado da eleição presidencial americana", variavel: "Contexto externo", favorece: ["A", "B", "C"], ondeAcompanhar: "Resultados oficiais dos EUA", quando: "Nov. 2028" },
  ],

  limitacoes: [
    { tipo: "limitacao", texto: "Simulação elaborada manualmente para demonstração; não foi produzida pelo motor do Iris nem pela base científica da plataforma." },
    { tipo: "limitacao", texto: "As fontes são majoritariamente jornalísticas, de veículos com linhas editoriais distintas; não há artigos científicos revisados por pares nesta versão." },
    { tipo: "incerteza", texto: "Não foi confirmada a composição final do Congresso eleito em 2026, nem o estado exato das tarifas americanas em outubro de 2026." },
    { tipo: "limitacao", texto: "Nenhuma probabilidade é atribuída às trajetórias: não há método definido para isso nesta fase." },
    { tipo: "limitacao", texto: "É um exercício analítico sobre um caminho que não aconteceu. Não expressa preferência política nem recomendação." },
  ],

  fontes: [
    { id: "tre-sp", titulo: "Lula é reeleito presidente da República; confira resultado do 2º turno em SP", veiculo: "TRE-SP", data: "2026-10", url: "https://www.tre-sp.jus.br/comunicacao/noticias/2026/Outubro/eleicoes-2026-lula-e-reeleito-presidente-da-republica-confira-resultado-do-2o-turno-em-sp" },
    { id: "wiki-2026", titulo: "Eleição presidencial no Brasil em 2026", veiculo: "Wikipédia", data: "2026-10", url: "https://pt.wikipedia.org/wiki/Elei%C3%A7%C3%A3o_presidencial_no_Brasil_em_2026" },
    { id: "poder360-propostas", titulo: "Compare as propostas de Lula e Flávio Bolsonaro", veiculo: "Poder360", data: "2026-10", url: "https://www.poder360.com.br/poder-eleicoes-2026/compare-as-propostas-de-lula-e-flavio-bolsonaro/" },
    { id: "conectado-pe", titulo: "Flávio Bolsonaro anuncia propostas para política externa e economia", veiculo: "Conectado ao Poder", data: "2026", url: "https://conectadoaopoder.com.br/flavio-bolsonaro-pl-anuncia-propostas-para-politica-externa-e-economia-nas-eleicoes-2026/" },
    { id: "metropoles-escudo", titulo: "Escudo das Américas: aliança de Trump e a posição de Flávio", veiculo: "Metrópoles", data: "2026", url: "https://www.metropoles.com/brasil/escudo-das-americas-alianca-trump-flavio" },
    { id: "portaltela-trump", titulo: "Imprensa internacional repercute encontro Flávio–Trump", veiculo: "Portal Tela", data: "2026-05-27", url: "https://www.portaltela.com/noticias/internacional/2026/05/27/imprensa-internacional-repercute-encontro-flavio-trump-em-meio-a-crise-politica/" },
    { id: "exame-tarifa", titulo: "Tarifaço dos EUA: como Lula e Flávio Bolsonaro se posicionam sobre Trump no 2º turno", veiculo: "Exame", data: "2026-10", url: "https://exame.com/brasil/tarifaco-dos-eua-como-lula-e-flavio-bolsonaro-se-posicionam-sobre-trump-no-2o-turno/" },
    { id: "politicalivre-tarifa", titulo: "Governo Lula retoma negociação com Trump e teme que tarifaço se torne permanente", veiculo: "Política Livre", data: "2026-08", url: "https://www.politicalivre.com.br/2026/08/governo-lula-retoma-negociacao-com-trump-e-teme-que-tarifaco-se-torne-permanente" },
    { id: "fortune-tarifa", titulo: "Brazil's president calls Trump's 50% tariff threat over Bolsonaro trial 'unacceptable blackmail'", veiculo: "Fortune", data: "2025-07-18", url: "https://www.fortune.com/2025/07/18/brazil-president-lula-trump-50-tariff-threat-bolsonaro-trial-unacceptable-blackmail" },
    { id: "sbt-economia", titulo: "Flávio x Lula: o que defendem para economia e trabalho", veiculo: "SBT News", data: "2026-10", url: "https://sbtnews.sbt.com.br/noticia/eleicoes/flavio-x-lula-o-que-defendem-para-economia-e-trabalho" },
    { id: "forbes-tesouraco", titulo: "Tesouraço: o plano econômico de Flávio Bolsonaro", veiculo: "Forbes Brasil", data: "2026-10", url: "https://forbes.com.br/forbes-money/2026/10/tesouraco-flavio-bolsonaro-plano-economico/" },
    { id: "sbt-indulto", titulo: "Caso eleito, Flávio pode soltar Bolsonaro? O que diz a lei", veiculo: "SBT News", data: "2026", url: "https://sbtnews.sbt.com.br/noticia/eleicoes/caso-eleito-flavio-pode-soltar-bolsonaro-o-que-diz-a-lei" },
    { id: "poder360-china", titulo: "Brasil e China batem recorde de US$ 171 bi em comércio em 2025", veiculo: "Poder360", data: "2026", url: "https://www.poder360.com.br/poder-economia/brasil-e-china-batem-recorde-de-us-171-bi-em-comercio-em-2025/" },
    { id: "jb-mercosul", titulo: "Acordo Mercosul–UE valerá provisoriamente em maio, confirma governo", veiculo: "Jornal do Brasil", data: "2026-03", url: "https://www.jb.com.br/economia/2026/03/1059083-acordo-mercosul-ue-valera-provisoriamente-em-maio-confirma-governo.html" },
    { id: "aduana-mercosul", titulo: "Situação da ratificação do Acordo Mercosul–UE nos Estados Partes", veiculo: "Aduana News", data: "2026", url: "https://aduananews.com/pt/estado-de-la-ratificacion-del-acuerdo-mercosur-ue-en-los-estados-parte/" },
    { id: "poder360-venezuela", titulo: "Venezuela fecha fronteira com Brasil depois de ataque dos EUA", veiculo: "Poder360", data: "2026-01-03", url: "https://www.poder360.com.br/brasil/venezuela-fecha-fronteira-com-brasil-depois-ataque-dos-eua/" },
  ],
};
