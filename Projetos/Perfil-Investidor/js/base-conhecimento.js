/*
 * Base de conhecimento do especialista em perfil de investidor.
 *
 * - perguntas: cada opção dá PONTOS de tolerância a risco e FATOS usados pelas regras.
 * - regras: SE → ENTÃO, executadas pelo motor de inferência (js/motor.js).
 * - carteiras: exemplos educativos de distribuição por tipo de investimento.
 *
 * Projeto educacional: não é recomendação oficial de investimento.
 */
(function (raiz, fabrica) {
  const ehNode = typeof module === 'object' && module.exports;
  const modulo = fabrica(ehNode ? require('./motor.js') : raiz.Motor);
  if (ehNode) module.exports = modulo;
  else raiz.BaseConhecimento = modulo;
})(typeof self !== 'undefined' ? self : this, function (Motor) {
  const NIVEIS = ['conservador', 'moderado', 'arrojado'];
  const NOMES = { conservador: 'Conservador', moderado: 'Moderado', arrojado: 'Arrojado' };
  const LIMITE_CONSERVADOR = 12; // pontuação até 12 → conservador
  const LIMITE_MODERADO = 23;    // de 13 a 23 → moderado; 24 ou mais → arrojado (máximo: 34)

  const perguntas = [
    {
      id: 'objetivo',
      texto: 'Qual é o seu principal objetivo ao investir?',
      opcoes: [
        { texto: 'Proteger o dinheiro que já tenho', pontos: 0, fatos: {} },
        { texto: 'Ter uma renda extra estável', pontos: 1, fatos: {} },
        { texto: 'Fazer o dinheiro crescer com equilíbrio', pontos: 2, fatos: {} },
        { texto: 'Multiplicar o patrimônio, mesmo com sobe e desce', pontos: 4, fatos: {} },
      ],
    },
    {
      id: 'prazo',
      texto: 'Quando você vai precisar desse dinheiro?',
      ajuda: 'Pense no dinheiro que você pretende investir agora.',
      opcoes: [
        { texto: 'Em menos de 1 ano', pontos: 0, fatos: { prazo: 'curto' } },
        { texto: 'Entre 1 e 3 anos', pontos: 1, fatos: { prazo: 'medio' } },
        { texto: 'Entre 3 e 5 anos', pontos: 2, fatos: { prazo: 'medio' } },
        { texto: 'Daqui a mais de 5 anos', pontos: 4, fatos: { prazo: 'longo' } },
      ],
    },
    {
      id: 'reserva',
      texto: 'Você tem uma reserva de emergência?',
      ajuda: 'Reserva de emergência é um dinheiro guardado, fácil de sacar, que cobre uns 6 meses das suas despesas.',
      opcoes: [
        { texto: 'Sim, completa', pontos: 2, fatos: { reserva: 'sim' } },
        { texto: 'Tenho uma parte', pontos: 1, fatos: { reserva: 'parcial' } },
        { texto: 'Não tenho', pontos: 0, fatos: { reserva: 'nao' } },
      ],
    },
    {
      id: 'dividas',
      texto: 'Você tem dívidas com juros altos, como rotativo do cartão ou cheque especial?',
      opcoes: [
        { texto: 'Não', pontos: 2, fatos: { dividaCara: false } },
        { texto: 'Sim', pontos: 0, fatos: { dividaCara: true } },
      ],
    },
    {
      id: 'queda',
      texto: 'Se seus investimentos caíssem 10% em um mês, o que você faria?',
      opcoes: [
        { texto: 'Venderia tudo para não perder mais', pontos: 0, fatos: { reacaoQueda: 'vende' } },
        { texto: 'Venderia uma parte', pontos: 1, fatos: { reacaoQueda: 'parte' } },
        { texto: 'Esperaria o valor se recuperar', pontos: 3, fatos: { reacaoQueda: 'espera' } },
        { texto: 'Aproveitaria para comprar mais', pontos: 4, fatos: { reacaoQueda: 'compra' } },
      ],
    },
    {
      id: 'experiencia',
      texto: 'Quais investimentos você já fez?',
      opcoes: [
        { texto: 'Nenhum, ou só poupança', pontos: 0, fatos: {} },
        { texto: 'Renda fixa, como CDB ou Tesouro Direto', pontos: 1, fatos: {} },
        { texto: 'Fundos de investimento ou previdência', pontos: 2, fatos: {} },
        { texto: 'Ações, fundos imobiliários ou criptomoedas', pontos: 4, fatos: {} },
      ],
    },
    {
      id: 'conhecimento',
      texto: 'Como você avalia o seu conhecimento sobre investimentos?',
      opcoes: [
        { texto: 'Nenhum', pontos: 0, fatos: {} },
        { texto: 'Básico', pontos: 1, fatos: {} },
        { texto: 'Intermediário', pontos: 2, fatos: {} },
        { texto: 'Avançado', pontos: 4, fatos: {} },
      ],
    },
    {
      id: 'renda',
      texto: 'Quanto da sua renda mensal você consegue investir?',
      opcoes: [
        { texto: 'Quase nada', pontos: 0, fatos: {} },
        { texto: 'Até 10%', pontos: 1, fatos: {} },
        { texto: 'Entre 10% e 30%', pontos: 2, fatos: {} },
        { texto: 'Mais de 30%', pontos: 3, fatos: {} },
      ],
    },
    {
      id: 'estabilidade',
      texto: 'Como é a sua renda?',
      opcoes: [
        { texto: 'Instável: varia muito de um mês para outro', pontos: 0, fatos: {} },
        { texto: 'Estável, mas posso perdê-la (ex.: emprego CLT)', pontos: 1, fatos: {} },
        { texto: 'Muito estável ou com várias fontes', pontos: 3, fatos: {} },
      ],
    },
    {
      id: 'preferencia',
      texto: 'Para investir R$ 1.000 por um ano, qual destas opções você escolheria?',
      opcoes: [
        { texto: 'Receber R$ 1.100, garantido', pontos: 0, fatos: {} },
        { texto: 'Receber entre R$ 1.000 e R$ 1.200', pontos: 1, fatos: {} },
        { texto: 'Receber entre R$ 950 e R$ 1.300', pontos: 2, fatos: {} },
        { texto: 'Receber entre R$ 800 e R$ 1.500', pontos: 4, fatos: {} },
      ],
    },
  ];

  const carteiras = {
    conservador: [
      { nome: 'Tesouro Selic e CDB de liquidez diária', percentual: 60, descricao: 'Rendem perto da taxa básica de juros e podem ser sacados a qualquer momento.' },
      { nome: 'CDB, LCI e LCA com prazo', percentual: 25, descricao: 'Renda fixa de bancos, com rendimento um pouco maior em troca de esperar o prazo.' },
      { nome: 'Tesouro IPCA+', percentual: 15, descricao: 'Título do governo que protege o dinheiro da inflação.' },
    ],
    moderado: [
      { nome: 'Tesouro Selic e CDB de liquidez diária', percentual: 35, descricao: 'A base segura da carteira, fácil de sacar.' },
      { nome: 'Tesouro IPCA+', percentual: 25, descricao: 'Protege da inflação no médio e longo prazo.' },
      { nome: 'Fundos multimercado', percentual: 15, descricao: 'Fundos que misturam renda fixa, ações e câmbio, geridos por profissionais.' },
      { nome: 'Fundos imobiliários (FIIs)', percentual: 10, descricao: 'Cotas de imóveis que pagam aluguéis mensais.' },
      { nome: 'Ações e ETFs', percentual: 15, descricao: 'Pedaços de empresas; oscilam mais e podem render mais no longo prazo.' },
    ],
    arrojado: [
      { nome: 'Tesouro Selic e CDB de liquidez diária', percentual: 15, descricao: 'Uma parte segura para aproveitar oportunidades.' },
      { nome: 'Tesouro IPCA+', percentual: 15, descricao: 'Proteção contra a inflação.' },
      { nome: 'Fundos multimercado', percentual: 10, descricao: 'Diversificação com gestão profissional.' },
      { nome: 'Fundos imobiliários (FIIs)', percentual: 15, descricao: 'Renda mensal de aluguéis.' },
      { nome: 'Ações e ETFs do Brasil', percentual: 30, descricao: 'Maior potencial de retorno, com mais oscilação.' },
      { nome: 'Investimentos no exterior (ETFs)', percentual: 15, descricao: 'Diversifica em outras moedas e mercados.' },
    ],
  };

  const menor = (a, b) => NIVEIS[Math.min(NIVEIS.indexOf(a), NIVEIS.indexOf(b))];
  const comAlerta = (f, alerta) => ({ alertas: [...f.alertas, alerta] });
  const comLimite = (f, nivel) => ({ limite: menor(f.limite, nivel) });

  const regras = [
    // --- Perfil preliminar pela pontuação ---
    {
      id: 'R01', nome: 'Pontuação baixa', prioridade: 50,
      se: (f) => f.pontuacao <= LIMITE_CONSERVADOR,
      entao: () => ({ perfilPreliminar: 'conservador' }),
      explicacao: (f) => `Sua pontuação de tolerância a risco foi ${f.pontuacao} de 34 (até ${LIMITE_CONSERVADOR} indica perfil conservador).`,
    },
    {
      id: 'R02', nome: 'Pontuação intermediária', prioridade: 50,
      se: (f) => f.pontuacao > LIMITE_CONSERVADOR && f.pontuacao <= LIMITE_MODERADO,
      entao: () => ({ perfilPreliminar: 'moderado' }),
      explicacao: (f) => `Sua pontuação de tolerância a risco foi ${f.pontuacao} de 34 (de ${LIMITE_CONSERVADOR + 1} a ${LIMITE_MODERADO} indica perfil moderado).`,
    },
    {
      id: 'R03', nome: 'Pontuação alta', prioridade: 50,
      se: (f) => f.pontuacao > LIMITE_MODERADO,
      entao: () => ({ perfilPreliminar: 'arrojado' }),
      explicacao: (f) => `Sua pontuação de tolerância a risco foi ${f.pontuacao} de 34 (a partir de ${LIMITE_MODERADO + 1} indica perfil arrojado).`,
    },
    // --- Regras de segurança (limitam o perfil ou geram alertas) ---
    {
      id: 'R10', nome: 'Sem reserva de emergência', prioridade: 40,
      se: (f) => f.reserva === 'nao',
      entao: (f) => ({
        ...comLimite(f, 'conservador'),
        ...comAlerta(f, { tipo: 'reserva', texto: 'Antes de arriscar, monte uma reserva de emergência de cerca de 6 meses das suas despesas, em algo seguro e fácil de sacar.' }),
      }),
      explicacao: 'Quem não tem reserva de emergência pode precisar sacar na pior hora. Por isso o perfil fica no máximo conservador.',
    },
    {
      id: 'R11', nome: 'Prazo curto', prioridade: 40,
      se: (f) => f.prazo === 'curto',
      entao: (f) => comLimite(f, 'conservador'),
      explicacao: 'Dinheiro que será usado em menos de 1 ano não tem tempo de se recuperar de uma queda. Por isso o perfil fica no máximo conservador.',
    },
    {
      id: 'R12', nome: 'Baixa tolerância a quedas', prioridade: 40,
      se: (f) => f.reacaoQueda === 'vende',
      entao: (f) => comLimite(f, 'moderado'),
      explicacao: 'Você venderia tudo numa queda de 10%, e quem vende na baixa transforma oscilação em prejuízo. Por isso o perfil fica no máximo moderado.',
    },
    {
      id: 'R13', nome: 'Dívida com juros altos', prioridade: 40,
      se: (f) => f.dividaCara === true,
      entao: (f) => comAlerta(f, { tipo: 'divida', texto: 'Quite primeiro as dívidas caras: os juros do cartão e do cheque especial são maiores do que o rendimento de quase qualquer investimento.' }),
      explicacao: 'Dívidas de cartão ou cheque especial cobram juros maiores do que os investimentos rendem, então quitá-las vem antes.',
    },
    {
      id: 'R14', nome: 'Reserva de emergência incompleta', prioridade: 40,
      se: (f) => f.reserva === 'parcial',
      entao: (f) => comAlerta(f, { tipo: 'reserva-parcial', texto: 'Continue completando sua reserva de emergência antes de aumentar o risco da carteira.' }),
      explicacao: 'Sua reserva ainda não está completa, então vale terminar de montá-la junto com os investimentos.',
    },
    // --- Conclusão ---
    {
      id: 'R20', nome: 'Perfil final', prioridade: 20,
      se: (f) => !!f.perfilPreliminar && !f.perfil,
      entao: (f) => ({ perfil: menor(f.perfilPreliminar, f.limite) }),
      explicacao: (f) => (f.perfil === f.perfilPreliminar
        ? `Nenhuma regra de segurança limitou o resultado: seu perfil é ${NOMES[f.perfil]}.`
        : `Pela pontuação você seria ${NOMES[f.perfilPreliminar]}, mas por segurança o perfil final ficou ${NOMES[f.perfil]}.`),
    },
    ...NIVEIS.map((nivel, i) => ({
      id: `R3${i}`, nome: `Carteira de exemplo — ${NOMES[nivel]}`, prioridade: 10,
      se: (f) => f.perfil === nivel && !f.carteira,
      entao: () => ({ carteira: carteiras[nivel] }),
      explicacao: `Para o perfil ${NOMES[nivel]}, a carteira de exemplo distribui o dinheiro entre ${carteiras[nivel].length} tipos de investimento.`,
    })),
  ];

  /** Converte respostas ({ idPergunta: índiceDaOpção }) em fatos iniciais para o motor. */
  function fatosDasRespostas(respostas) {
    let fatos = { pontuacao: 0, alertas: [], limite: 'arrojado' };
    for (const p of perguntas) {
      const opcao = p.opcoes[respostas[p.id]];
      if (!opcao) throw new Error(`Pergunta "${p.id}" sem resposta válida.`);
      fatos = { ...fatos, ...opcao.fatos, pontuacao: fatos.pontuacao + opcao.pontos };
    }
    return fatos;
  }

  /** Roda o sistema especialista completo. */
  function avaliar(respostas) {
    return Motor.inferir(fatosDasRespostas(respostas), regras);
  }

  return { NIVEIS, NOMES, perguntas, regras, carteiras, fatosDasRespostas, avaliar };
});
