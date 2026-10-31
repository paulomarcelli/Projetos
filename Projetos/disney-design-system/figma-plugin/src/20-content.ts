/* =====================================================================
   Conteúdo estratégico (PT-BR). Fatos históricos conferidos nas fontes
   listadas em SOURCES; números financeiros citam o relatório anual (10-K).
   ===================================================================== */

const PROJECT = {
  name: "Disney — Where Magic Becomes Reality",
  subtitle: "Design System · The Walt Disney Company",
  version: "v1.0 · 2026",
  author: "Paulo Marcelli",
  disclaimer:
    "Projeto acadêmico conceitual, sem afiliação, patrocínio ou endosso da The Walt Disney Company. Disney, nomes de filmes, franquias e personagens são marcas de seus titulares. A assinatura oficial (logotipo) e os personagens não foram reproduzidos: o wordmark e as artes são conceituais.",
};

const SOURCES = [
  "The Walt Disney Company — About / Our Businesses (thewaltdisneycompany.com/about)",
  "D23, The Official Disney Fan Club — Disney History (d23.com/disney-history)",
  "The Walt Disney Company — Form 10-K, ano fiscal de 2024 (SEC, sec.gov)",
  "Walt Disney Archives — linha do tempo institucional",
];

const TIMELINE: [string, string, string][] = [
  ["1923", "A fundação", "Em 16 de outubro, Walt e Roy O. Disney abrem o Disney Brothers Cartoon Studio, em Los Angeles."],
  ["1928", "Nasce um ícone", "Mickey Mouse estreia em “Steamboat Willie”, um dos primeiros desenhos animados com som sincronizado."],
  ["1937", "O primeiro longa", "“Branca de Neve e os Sete Anões”, primeiro longa-metragem de animação do estúdio, muda o cinema."],
  ["1955", "A magia ganha endereço", "A Disneyland abre em Anaheim, Califórnia: as histórias passam a ser lugares."],
  ["1971", "Walt Disney World", "O resort da Flórida inaugura o modelo de destino completo de férias."],
  ["1983–2016", "Parques pelo mundo", "Tóquio (1983), Paris (1992), Hong Kong (2005) e Xangai (2016)."],
  ["1995–1996", "Mídia e esportes", "A aquisição da Capital Cities/ABC traz a ABC e a ESPN."],
  ["2006–2012", "Grandes estúdios", "Chegam Pixar (2006), Marvel (2009) e Lucasfilm (2012)."],
  ["2019", "Era do streaming", "Aquisição da 21st Century Fox e lançamento do Disney+, em 12 de novembro."],
  ["Hoje", "Uma empresa, três segmentos", "Entertainment, Sports e Experiences; sede em Burbank, Califórnia."],
];

const SEGMENTS: [string, string, string[]][] = [
  ["Entertainment", "Criação e distribuição de histórias", ["Walt Disney Animation Studios, Pixar, Marvel Studios, Lucasfilm, 20th Century Studios", "Disney+, Hulu e redes de TV (ABC, Disney Channel, National Geographic)", "Música, teatro (Disney Theatrical) e publicações"]],
  ["Sports", "Esporte ao vivo e jornalismo esportivo", ["ESPN e seus canais", "ESPN+ e transmissões digitais", "Direitos de eventos e ligas"]],
  ["Experiences", "Histórias que se vivem em pessoa", ["12 parques temáticos em 6 resorts pelo mundo", "Disney Cruise Line, Aulani e Disney Vacation Club", "Produtos de consumo, licenciamento, games e shopDisney"]],
];

const FACTS: [string, string][] = [
  ["1923", "Ano de fundação"],
  ["3", "Segmentos de negócio"],
  ["12", "Parques temáticos em 6 resorts"],
  ["US$ 91,4 bi", "Receita no ano fiscal de 2024 (10-K)"],
];

const DIFFERENTIATORS: [string, string][] = [
  ["Narrativa como motor", "Toda linha de negócio nasce de uma história: o filme vira parque, música, produto e memória."],
  ["Portfólio de franquias", "Disney, Pixar, Marvel, Star Wars e National Geographic sob o mesmo teto criativo."],
  ["Ecossistema integrado", "Tela, parque, cruzeiro e loja conectados: cada ponto de contato alimenta o outro."],
  ["Excelência de experiência", "Padrão reconhecido de hospitalidade, cuidado com o detalhe e encantamento."],
  ["Inovação técnica", "Do som sincronizado (1928) à animação digital e à imersão nos parques."],
  ["Relevância multigeracional", "Avós, pais e filhos compartilham as mesmas histórias, em tempos diferentes."],
];

const PERSONALITY: [string, string][] = [
  ["Arquétipo · O Mago", "Transforma o comum em extraordinário e faz sonhos parecerem possíveis."],
  ["Calorosa", "Acolhe todas as idades e todas as famílias, com gentileza e cuidado."],
  ["Imaginativa", "Convida a pensar além do possível, com curiosidade e humor."],
  ["Otimista", "Acredita no final feliz conquistado com coragem e bondade."],
  ["Atemporal", "Honra o legado clássico enquanto inventa o futuro do entretenimento."],
];

const POSITIONING = {
  statement:
    "Para famílias e fãs de todas as idades que buscam viver emoções verdadeiras juntos, a Disney é a marca de entretenimento que transforma histórias em experiências, da tela ao parque, porque une mais de cem anos de narrativa, franquias amadas e um padrão incomparável de encantamento.",
  value: "Experiências de entretenimento que criam memórias compartilhadas: histórias que você assiste, visita, coleciona e passa adiante.",
  mission:
    "“Entreter, informar e inspirar pessoas ao redor do mundo por meio do poder de uma narrativa incomparável, refletindo as marcas icônicas, as mentes criativas e as tecnologias inovadoras que fazem da nossa a principal empresa de entretenimento do mundo.” — missão declarada pela empresa",
  purpose: "Fazer a magia virar realidade: aproximar pessoas por meio de histórias que despertam imaginação, coragem e esperança.",
  audiences: [
    ["Famílias com crianças", "Buscam entretenimento seguro, emocionante e compartilhável."],
    ["Jovens adultos e fãs", "Marvel, Star Wars e Pixar: comunidade, colecionáveis e lançamentos."],
    ["Adultos nostálgicos", "Revivem a infância e a apresentam a uma nova geração."],
    ["Viajantes de experiência", "Parques, cruzeiros e resorts como destino de vida."],
  ] as [string, string][],
  competitive: [
    ["Propriedade intelectual", "Biblioteca e franquias que nenhum concorrente replica."],
    ["Efeito volante", "Um sucesso de bilheteria alimenta streaming, parques e produtos."],
    ["Confiança da marca", "Sinônimo de qualidade e segurança para famílias."],
  ] as [string, string][],
  perception: ["Mágica, sem ser infantil", "Sofisticada, sem ser distante", "Nostálgica, sem ser antiquada", "Global, sem perder o calor humano"],
  market:
    "Líder global em entretenimento de marca: compete com estúdios e plataformas (Netflix, Warner Bros. Discovery, Universal/Comcast) em conteúdo, e com destinos de lazer em experiências, mas é a única com um ecossistema completo de histórias.",
};

const PERSONA = {
  name: "Mariana Albuquerque",
  age: 36,
  quote: "“Quero que meus filhos sintam o que eu senti na primeira vez que vi O Rei Leão.”",
  demographic: [
    ["Idade", "36 anos"],
    ["Cidade", "Campinas, SP"],
    ["Ocupação", "Gerente de marketing em uma empresa de tecnologia"],
    ["Família", "Casada; mãe de Theo (7) e Lia (4)"],
    ["Renda", "Classe A/B, renda familiar ~R$ 25 mil/mês"],
    ["Escolaridade", "Pós-graduada em Comunicação"],
  ] as [string, string][],
  interests: ["Cinema de animação", "Viagens em família", "Musicais da Broadway", "Decoração temática", "Séries da Marvel com o marido"],
  habits: [
    "Assina Disney+ e assiste a um filme em família toda sexta-feira",
    "Compra presentes e fantasias na shopDisney e em lojas licenciadas",
    "Ouve trilhas sonoras Disney com as crianças no carro",
    "Planeja a primeira viagem ao Walt Disney World há um ano",
  ],
  relation:
    "Cresceu com os clássicos dos anos 1990. Hoje revive a marca como mãe: filmes, músicas, produtos e, em breve, o parque. Para ela, a Disney é um ritual de família, não só um catálogo.",
  needs: ["Planejar a viagem com clareza de custos", "Encontrar conteúdo certo para cada idade", "Experiências que adultos também curtam", "Um lugar só para descobrir tudo da marca"],
  pains: ["Planejar parques parece complexo e caro (ingressos, câmbio, filas)", "Excesso de opções no streaming", "Informações espalhadas entre apps e sites de cada marca", "Medo de a viagem não corresponder à expectativa"],
  motivations: ["Criar memórias que os filhos levem para a vida", "Reviver a própria infância", "Ver o encantamento no rosto das crianças", "Sentir-se uma boa organizadora da família"],
  channels: ["Disney+", "Instagram (@disneyparks)", "YouTube", "App My Disney Experience", "shopDisney", "Spotify", "Grupos de WhatsApp de viagem"],
  journey: [
    ["Descobre", "Trailer de um novo filme no Instagram"],
    ["Assiste", "Sessão em família no Disney+"],
    ["Coleciona", "Pelúcia e livro na shopDisney"],
    ["Planeja", "Pesquisa ingressos e resorts"],
    ["Vive", "Primeira visita ao Magic Kingdom"],
    ["Compartilha", "Fotos e vídeos com a família"],
  ] as [string, string][],
};

const VOICE = {
  intro:
    "A Disney fala como um bom contador de histórias: com calor, imaginação e clareza. Encanta sem exagerar, acolhe sem infantilizar e inspira sem prometer o impossível.",
  traits: [
    ["Inspiradora", "Desperta vontade de sonhar e agir."],
    ["Mágica", "Encontra o extraordinário no simples."],
    ["Emocional", "Fala de sentimentos, não de funcionalidades."],
    ["Acolhedora", "Todas as idades e todas as famílias se sentem convidadas."],
    ["Imaginativa", "Usa imagens e metáforas com leveza."],
    ["Otimista", "Olha para o final feliz, com honestidade."],
    ["Atemporal", "Evita gírias passageiras; soa bem em qualquer década."],
  ] as [string, string][],
  principles: [
    ["Conte, não anuncie", "Comece pela emoção da história antes do produto."],
    ["Encante com clareza", "A magia está no tom; a informação precisa ser direta."],
    ["Fale com todas as gerações", "Simples para a criança, rico para o adulto."],
    ["Prometa o que entrega", "Otimismo sem exagero: nada de “o melhor dia da sua vida, garantido”."],
    ["Respeite o momento", "Mais leveza no marketing; mais precisão em erros e pagamentos."],
  ] as [string, string][],
  vocabularyUse: ["imaginar", "descobrir", "juntos", "memória", "história", "encantar", "aventura", "sonho", "família", "brilho"],
  vocabularyAvoid: ["imperdível!!!", "garantido", "barato", "promoção relâmpago", "usuário", "erro fatal", "clique aqui", "gírias da moda"],
  tone: [
    ["Campanhas e marketing", 90, "Mais mágico e emocional"],
    ["Navegação e produto", 55, "Caloroso e objetivo"],
    ["Compras e reservas", 35, "Claro, confiável, sem pressão"],
    ["Erros e suporte", 20, "Empático, direto, com saída"],
  ] as [string, number, string][],
  examples: [
    ["Boas-vindas", "Que bom ter você aqui. Vamos começar uma nova história?", "Bem-vindo ao portal. Faça login para continuar."],
    ["Chamada de parque", "Onde os sonhos ganham endereço. Planeje sua visita ao Walt Disney World.", "IMPERDÍVEL!!! Garanta já o melhor dia da sua vida!!!"],
    ["Erro de pagamento", "Não conseguimos confirmar o pagamento. Confira os dados do cartão e tente de novo; seus ingressos continuam reservados por 15 minutos.", "Erro fatal 402. Transação recusada."],
    ["Estado vazio", "Sua lista de desejos está esperando a primeira história.", "Nenhum item encontrado."],
  ] as [string, string, string][],
  ui: [
    ["Botão primário", "Planejar minha visita", "Enviar"],
    ["Botão de compra", "Garantir ingressos", "Comprar agora!!!"],
    ["Sucesso", "Tudo pronto! Sua aventura começa em 12 de março.", "Operação concluída com sucesso."],
    ["Busca vazia", "Nenhuma história com esse nome ainda. Que tal “Moana”?", "0 resultados."],
    ["Carregamento", "Preparando a magia…", "Carregando…"],
  ] as [string, string, string][],
};
