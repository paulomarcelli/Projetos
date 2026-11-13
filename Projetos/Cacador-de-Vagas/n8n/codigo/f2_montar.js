// Fluxo 02: guarda a análise no Notion, com as respostas no corpo da página.
const cfg = $('Configuração').first().json;
const f = $('Pedido para a IA').first().json.form;
const campo = (nome) => texto(f[nome]).trim();
const a = lerJsonDaIA($input.first().json);
const nota = notaValida(a.nota);
const respostas = Array.isArray(a.respostas) ? a.respostas : [];
const paragrafos = (s) => {
  const t = texto(s);
  const blocos = [];
  for (let i = 0; i < t.length; i += 1900) blocos.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ text: { content: t.slice(i, i + 1900) } }] } });
  return blocos.length ? blocos : [{ object: 'block', type: 'paragraph', paragraph: { rich_text: [] } }];
};
const titulo = (nivel, s) => ({ object: 'block', type: `heading_${nivel}`, [`heading_${nivel}`]: { rich_text: [{ text: { content: texto(s).slice(0, 190) } }] } });
const filhos = [];
if (respostas.length) {
  filhos.push(titulo(2, 'Respostas para o formulário'));
  for (const r of respostas) filhos.push(titulo(3, r.pergunta), ...paragrafos(r.resposta));
}
filhos.push(titulo(2, 'Mensagem para o recrutador'), ...paragrafos(a.mensagem_recrutador));
filhos.push(titulo(2, 'O que destacar no currículo'), ...paragrafos(a.destacar_no_curriculo));
const rascunho = respostas.map((r) => `${texto(r.pergunta)}\n${texto(r.resposta)}`).join('\n\n') || texto(a.mensagem_recrutador);
const link = campo('Link da vaga');
const id = (link.match(/jobs\/view\/(?:[^\/?]*-)?(\d{6,})/) || [])[1] || '';
const corpo = {
  parent: { database_id: cfg.notion_database_id },
  properties: {
    'Vaga': { title: [{ text: { content: campo('Título da vaga').slice(0, 1990) || 'Vaga sem título' } }] },
    'Empresa': rt(campo('Empresa')),
    'Link': { url: link || null },
    'Nota IA': { number: nota },
    'Por quê': rt(a.erro || a.porque),
    'Pontos fortes': rt(a.pontos_fortes),
    'Lacunas': rt(a.lacunas),
    'Área': { select: { name: opcao(a.area, AREAS, 'Outra') } },
    'Nível': { select: { name: opcao(a.nivel, NIVEIS, 'Não informado') } },
    'Modalidade': { select: { name: opcao(a.modalidade, MODALIDADES, 'Não informado') } },
    'Status': { select: { name: 'Vi' } },
    'Fonte': { select: { name: 'Análise manual' } },
    'Descrição': rt(campo('Descrição da vaga')),
    'Rascunho': rt(rascunho),
    'Recebida em': { date: { start: new Date().toISOString().slice(0, 10) } },
    'ID vaga': rt(id),
  },
  children: filhos.slice(0, 95),
};
return [{ json: { analise: a, nota, corpo_pagina: corpo } }];
