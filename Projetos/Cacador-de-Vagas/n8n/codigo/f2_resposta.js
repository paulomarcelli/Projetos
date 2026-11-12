// Fluxo 02: página de resultado que aparece depois de enviar o formulário.
const m = $('Montar análise').first().json;
const a = m.analise;
const pagina = $input.first().json.url || '';
const bloco = (t, c) => (c ? `<h3 style="margin:18px 0 6px">${escapar(t)}</h3><p style="white-space:pre-wrap;margin:0">${escapar(c)}</p>` : '');
const respostas = (Array.isArray(a.respostas) ? a.respostas : []).map((r) => bloco(r.pergunta, r.resposta)).join('');
const html = `<div style="font-family:Arial,sans-serif;max-width:720px;margin:24px auto;padding:0 16px;color:#1f2937;line-height:1.5">` +
  `<p style="font-size:14px;color:#6b7280;margin:0">Nota de compatibilidade</p>` +
  `<p style="font-size:44px;font-weight:700;color:#c2410c;margin:0">${m.nota ?? '–'}<span style="font-size:20px;color:#9ca3af">/10</span></p>` +
  `<p>${escapar(a.erro || a.porque)}</p>` +
  bloco('Pontos fortes', a.pontos_fortes) + bloco('Lacunas', a.lacunas) +
  (respostas ? `<h2 style="margin-top:28px">Respostas para o formulário</h2>${respostas}` : '') +
  bloco('Mensagem para o recrutador', a.mensagem_recrutador) + bloco('O que destacar no currículo', a.destacar_no_curriculo) +
  (pagina ? `<p style="margin-top:28px"><a href="${escapar(pagina)}">Abrir no Notion</a></p>` : '') +
  `<p style="font-size:13px;color:#6b7280">Revise antes de enviar: a IA escreve o rascunho, a decisão é sua.</p></div>`;
return [{ json: { html } }];
