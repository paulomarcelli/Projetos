// E-mail de EXEMPLO para testar o fluxo sem configurar o Gmail.
// As duas vagas abaixo são inventadas.
return [{
  json: {
    subject: 'Exemplo: alerta de vagas',
    date: new Date().toISOString(),
    textPlain: [
      'Seu alerta de vagas para estágio em dados em São Paulo',
      '',
      'Estágio em Ciência de Dados (EXEMPLO)',
      'Empresa Fictícia de Tecnologia',
      'São Paulo, SP (Híbrido)',
      'Ver vaga: https://www.linkedin.com/comm/jobs/view/4999999901/?trackingId=exemplo',
      '',
      '---------------------------------------------------------',
      '',
      'Vendedor Externo Sênior (EXEMPLO)',
      'Comércio Fictício Ltda',
      'Guarulhos, SP (Presencial)',
      'Ver vaga: https://www.linkedin.com/comm/jobs/view/4999999902/?trackingId=exemplo',
    ].join('\n'),
    textHtml: '',
  },
}];
