// Fica só com as vagas que ainda não estão no Notion e monta o pedido para a IA.
const vagas = $('Extrair vagas').all();
const cfg = $('Configuração').first().json;
const sistema = `Você ajuda um candidato a filtrar vagas de emprego. Perfil e preferências do candidato:\n${cfg.perfil}\n\n` +
  `O e-mail de alerta traz só título, empresa, local e um trecho curto: avalie com isso e não invente requisitos.\n` +
  `Responda APENAS com um objeto JSON com estas chaves:\n` +
  `"nota": inteiro de 0 a 10 (9-10 encaixe ótimo, 7-8 bom, 4-6 talvez, 0-3 não combina com o perfil e as preferências),\n` +
  `"porque": 1 ou 2 frases explicando a nota,\n"pontos_fortes": o que do perfil combina com a vaga,\n` +
  `"lacunas": o que pode faltar ou o que conferir na descrição completa,\n` +
  `"area": um de ${JSON.stringify(AREAS)},\n"nivel": um de ${JSON.stringify(NIVEIS)},\n"modalidade": um de ${JSON.stringify(MODALIDADES)}.\n` +
  `Escreva em português do Brasil.`;
const saida = [];
$input.all().forEach((resposta, i) => {
  if ((resposta.json.results || []).length > 0) return; // já está no Notion
  const v = vagas[i].json;
  saida.push({
    json: {
      ...v,
      pedido_ia: {
        model: cfg.llm_modelo,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: sistema },
          { role: 'user', content: `Vaga: ${v.titulo}\nEmpresa: ${v.empresa}\nLocal: ${v.local}\nTrecho do e-mail: ${v.trecho}` },
        ],
      },
    },
  });
});
return saida;
