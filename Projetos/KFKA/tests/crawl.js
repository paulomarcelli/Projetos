// Teste de fumaça: percorre todas as rotas por links, coleta erros e 404s
const { chromium } = require('playwright');
const path = require('path');
const BASE = 'file://' + path.resolve(__dirname, '../index.html');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(['pageerror', page.url().split('#')[1], e.message]));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push(['console', page.url().split('#')[1], m.text()]); });
  const seeds = ['/', '/entrar', '/entrar/administrador', '/recuperar-senha', '/design', '/documentacao', '/admin/painel', '/professor/painel', '/familia/selecionar', '/familia/painel'];
  const seen = new Set(); const queue = [...seeds]; const broken = [];
  while (queue.length) {
    const r = queue.shift(); if (seen.has(r)) continue; seen.add(r);
    await page.goto(BASE + '#' + r); await page.waitForTimeout(40);
    const t = await page.title();
    if (/não encontrada/i.test(t)) broken.push(r);
    const hrefs = await page.$$eval('a[href^="#/"]', (as) => as.map((a) => a.getAttribute('href').slice(1)));
    for (const h of hrefs) if (!seen.has(h) && seen.size + queue.length < 600) queue.push(h);
  }
  console.log('Rotas visitadas:', seen.size);
  console.log('404:', broken);
  console.log('Erros:', JSON.stringify(errors.slice(0, 30), null, 1), errors.length);
  await browser.close();
})();
