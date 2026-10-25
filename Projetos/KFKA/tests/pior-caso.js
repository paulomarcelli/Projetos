// Teste "pior caso" (skill break-ui): abre as telas com ?dados=pior e procura quebras.
// Uso: node tests/pior-caso.js   → lista, por tela e largura, o que vazou da tela ou do próprio contêiner.
const { chromium } = require('playwright');
const path = require('path');
const BASE = 'file://' + path.resolve(__dirname, '../index.html') + '?dados=pior';
// Telas que mostram nomes, e-mails, tags e textos longos
const ROTAS = ['/admin/painel', '/admin/alunos', '/admin/responsaveis', '/admin/revisao', '/admin/revisao/rel-103', '/admin/relatorios',
  '/professor/painel', '/professor/turmas/6A?disc=MAT', '/professor/registros', '/professor/registros/rel-102',
  '/familia/selecionar', '/familia/painel', '/familia/relatorios', '/familia/relatorios/rel-109', '/familia/perfil'];
const LARGURAS = [390, 1280];

(async () => {
  const b = await chromium.launch();
  let total = 0;
  for (const w of LARGURAS) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    for (const r of ROTAS) {
      await p.goto(BASE + '#' + r);
      await p.waitForTimeout(120);
      const achados = await p.evaluate((vw) => {
        const out = [];
        // 1) Algo passou da borda direita da janela (rolagem horizontal)
        if (document.documentElement.scrollWidth > vw + 1) out.push(`página com rolagem horizontal (${document.documentElement.scrollWidth}px)`);
        // 2) Texto que vazou do próprio elemento (sem quebra nem reticências)
        for (const el of document.querySelectorAll('.content *, .pick-screen *')) {
          const cs = getComputedStyle(el);
          if (cs.display === 'inline' || cs.overflowX === 'auto' || cs.overflowX === 'scroll' || el.closest('.table-wrap, .tabs, .bim-tabs, svg, .sr-only')) continue;
          if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && cs.textOverflow !== 'ellipsis') {
            out.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} vazou ${el.scrollWidth - el.clientWidth}px: "${(el.textContent || '').trim().slice(0, 40)}"`);
          }
        }
        // 3) Avatar/ícone circular deformado (largura ≠ altura)
        for (const el of document.querySelectorAll('.avatar, .tl-dot, .flow-dot')) {
          const r = el.getBoundingClientRect();
          if (Math.abs(r.width - r.height) > 1) out.push(`círculo deformado ${Math.round(r.width)}×${Math.round(r.height)}`);
        }
        return [...new Set(out)].slice(0, 8);
      }, w);
      if (achados.length) { total += achados.length; console.log(`✗ ${w}px ${r}\n   - ${achados.join('\n   - ')}`); }
      else console.log(`✓ ${w}px ${r}`);
    }
    await p.close();
  }
  await b.close();
  console.log(total ? `\n${total} problema(s) no pior caso.` : '\nNenhuma quebra no pior caso.');
})();
