// Fluxo 02: monta o pedido para a IA com a descrição completa e as perguntas do formulário.
const f = $input.first().json;
const cfg = $('Configuração').first().json;
const campo = (nome) => texto(f[nome]).trim();
const perguntas = campo('Perguntas do formulário');
const sistema = `Você ajuda um candidato a avaliar uma vaga e a se candidatar. Perfil e preferências do candidato:\n${cfg.perfil}\n\n` +
  `Regras: use só o que está no perfil; nunca invente experiência, curso ou ferramenta que o candidato não tem. ` +
  `Quando a vaga pedir algo que ele não tem, diga com honestidade e mostre o que ele tem de mais próximo.\n` +
  `Responda APENAS com um objeto JSON com estas chaves:\n` +
  `"nota": inteiro de 0 a 10 de compatibilidade,\n"porque": 2 ou 3 frases,\n"pontos_fortes": o que do perfil combina,\n` +
  `"lacunas": o que falta e como compensar,\n"area": um de ${JSON.stringify(AREAS)},\n"nivel": um de ${JSON.stringify(NIVEIS)},\n` +
  `"modalidade": um de ${JSON.stringify(MODALIDADES)},\n` +
  `"respostas": lista de objetos {"pergunta", "resposta"}, uma para cada pergunta do formulário, em primeira pessoa, ` +
  `naturais e específicas, citando projetos reais do perfil (lista vazia se não houver perguntas),\n` +
  `"mensagem_recrutador": mensagem curta (até 600 caracteres) para mandar ao recrutador no LinkedIn,\n` +
  `"destacar_no_curriculo": o que destacar no currículo para esta vaga.\nEscreva em português do Brasil.`;
const usuario = `Vaga: ${campo('Título da vaga')}\nEmpresa: ${campo('Empresa')}\nLink: ${campo('Link da vaga')}\n\n` +
  `Descrição completa:\n${campo('Descrição da vaga')}\n\nPerguntas do formulário:\n${perguntas || '(nenhuma)'}`;
return [{ json: { form: f, pedido_ia: { model: cfg.llm_modelo, temperature: 0.4, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: sistema }, { role: 'user', content: usuario }] } } }];
