// Lê cada e-mail e devolve uma vaga por item.
const saida = [];
const vistos = new Set();
for (const item of $input.all()) {
  const e = item.json;
  const vagas = extrairVagas({ text: e.textPlain || e.text || '', html: e.textHtml || e.html || '' });
  const dia = (e.date ? new Date(e.date) : new Date()).toISOString().slice(0, 10);
  for (const v of vagas) {
    if (vistos.has(v.id)) continue;
    vistos.add(v.id);
    saida.push({ json: { ...v, recebida_em: dia, consulta: { filter: { property: 'ID vaga', rich_text: { equals: v.id } }, page_size: 1 } } });
  }
}
return saida;
