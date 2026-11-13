// Junta a nota da IA com a vaga e monta a página do Notion.
const vagas = $('Só vagas novas').all();
const cfg = $('Configuração').first().json;
return $input.all().map((resposta, i) => {
  const v = vagas[i].json;
  const a = lerJsonDaIA(resposta.json);
  const nota = notaValida(a.nota);
  const porque = a.erro || texto(a.porque);
  const corpo = {
    parent: { database_id: cfg.notion_database_id },
    properties: {
      'Vaga': { title: [{ text: { content: v.titulo.slice(0, 1990) } }] },
      'Empresa': rt(v.empresa),
      'Local': rt(v.local),
      'Link': { url: v.link },
      'Nota IA': { number: nota },
      'Por quê': rt(porque),
      'Pontos fortes': rt(a.pontos_fortes),
      'Lacunas': rt(a.lacunas),
      'Área': { select: { name: opcao(a.area, AREAS, 'Outra') } },
      'Nível': { select: { name: opcao(a.nivel, NIVEIS, 'Não informado') } },
      'Modalidade': { select: { name: opcao(a.modalidade, MODALIDADES, 'Não informado') } },
      'Status': { select: { name: 'Nova' } },
      'Fonte': { select: { name: 'Alerta LinkedIn' } },
      'Descrição': rt(v.trecho),
      'Recebida em': { date: { start: v.recebida_em } },
      'ID vaga': rt(v.id),
    },
  };
  return { json: { id: v.id, titulo: v.titulo, empresa: v.empresa, local: v.local, link: v.link, nota, porque, corpo_pagina: corpo } };
});
