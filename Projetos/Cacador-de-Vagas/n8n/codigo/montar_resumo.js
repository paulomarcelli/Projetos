// Monta o e-mail de resumo só com as vagas que passaram da nota mínima.
const cfg = $('Configuração').first().json;
const minima = Number(cfg.nota_minima_resumo) || 7;
const salvas = $input.all();
const vagas = $('Montar página').all().map((it, i) => ({ ...it.json, notion: salvas[i]?.json?.url || '' }));
const boas = vagas.filter((v) => v.nota != null && v.nota >= minima).sort((a, b) => b.nota - a.nota);
if (!boas.length) return [];
const linhas = boas.map((v) =>
  `<tr><td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font:600 20px Arial;color:#c2410c;vertical-align:top">${v.nota}</td>` +
  `<td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font:14px Arial;color:#1f2937">` +
  `<a href="${escapar(v.link)}" style="font-weight:700;color:#111827">${escapar(v.titulo)}</a><br>` +
  `${escapar(v.empresa)} · ${escapar(v.local)}<br><span style="color:#4b5563">${escapar(v.porque)}</span>` +
  (v.notion ? `<br><a href="${escapar(v.notion)}" style="color:#2563eb">Abrir no Notion</a>` : '') + `</td></tr>`).join('');
const html = `<div style="max-width:640px"><p style="font:15px Arial">${boas.length} vaga(s) nova(s) com nota ${minima} ou mais:</p>` +
  `<table style="border-collapse:collapse;width:100%">${linhas}</table>` +
  `<p style="font:13px Arial;color:#6b7280">Marque 👍 ou 👎 em "Gostei?" no Notion para treinar o seu modelo.</p></div>`;
return [{ json: { assunto: `🎯 ${boas.length} vaga(s) boa(s) hoje · melhor nota ${boas[0].nota}`, html } }];
