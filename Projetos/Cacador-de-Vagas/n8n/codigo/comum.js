// Ajudantes usados nos nós de código (o montador copia este trecho para dentro de cada nó).
const AREAS = ['IA e dados', 'Desenvolvimento', 'Suporte e infra', 'Outra'];
const NIVEIS = ['Estágio', 'Júnior', 'Pleno ou sênior', 'Não informado'];
const MODALIDADES = ['Remoto', 'Híbrido', 'Presencial', 'Não informado'];
const opcao = (valor, lista, padrao) => (lista.includes(valor) ? valor : padrao);
const texto = (v) => (Array.isArray(v) ? v.join('; ') : v == null ? '' : String(v));
const rt = (v) => {
  const s = texto(v);
  return { rich_text: s ? [{ text: { content: s.slice(0, 1990) } }] : [] };
};
const lerJsonDaIA = (resposta) => {
  const conteudo = resposta?.choices?.[0]?.message?.content;
  if (!conteudo) {
    const erro = resposta?.error?.message || resposta?.error || JSON.stringify(resposta).slice(0, 300);
    return { erro: `A IA não respondeu: ${texto(erro)}` };
  }
  const limpo = String(conteudo).replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '').trim();
  try { return JSON.parse(limpo); } catch (e) {
    const m = limpo.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch (e2) {} }
    return { erro: `A IA respondeu fora do formato: ${limpo.slice(0, 300)}` };
  }
};
const notaValida = (n) => (n === '' || n == null || !Number.isFinite(Number(n)) ? null : Math.max(0, Math.min(10, Math.round(Number(n)))));
const escapar = (s) => texto(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
