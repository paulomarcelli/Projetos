// Testes das opções de acessibilidade (Configurações) e da responsividade com texto grande.
const { chromium } = require('playwright'); const path = require('path');
const BASE = 'file://' + path.resolve(__dirname, '../index.html');
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } }); await require('./sessao')(p);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const raiz = () => p.evaluate(() => getComputedStyle(document.documentElement).fontSize);
  await p.goto(BASE + '#/professor/configuracoes'); await p.waitForTimeout(100);

  ok((await p.$$('input[name="tt"][data-texto]')).length === 4, 'quatro tamanhos de texto como rádios');
  ok(await raiz() === '16px', 'texto começa no padrão (16px)');
  await p.click('.tt-opcao:nth-child(3)'); await p.waitForTimeout(80);
  ok(await raiz() === '20px', 'Grande aplica 125% ao sistema inteiro');
  ok(/Texto grande \(125%\)/.test(await p.textContent('.config-status')), 'aviso para leitor de tela');
  const menu = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.sidebar a span')).fontSize));
  ok(menu > 16, 'menu lateral também cresce');
  // teclado: seta para a direita passa para o próximo tamanho
  await p.focus('input[name="tt"]:checked'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(80);
  ok(await raiz() === '24px', 'setas do teclado trocam o tamanho');
  ok(await p.isDisabled('[data-action="texto-passo"][data-passo="1"]'), 'A+ desativa no maior tamanho');
  await p.click('[data-action="texto-passo"][data-passo="-1"]'); await p.waitForTimeout(80);
  ok(await raiz() === '20px', 'A− diminui um passo');

  // com 150% num computador de 1280px, a largura útil cai abaixo de 1024 e o menu vira gaveta
  await p.click('.tt-opcao:nth-child(4)'); await p.waitForTimeout(80);
  ok(await p.evaluate(() => document.documentElement.classList.contains('gaveta-forcada')) && await p.isVisible('.menu-btn'), 'texto muito grande no computador: menu em gaveta');
  await p.click('.tt-opcao:nth-child(1)'); await p.waitForTimeout(80);
  ok(!(await p.evaluate(() => document.documentElement.classList.contains('gaveta-forcada'))), 'de volta ao padrão: menu lateral fixo');

  // interruptores
  for (const [cfg, classe] of [['espaco', 'texto-espacado'], ['links', 'links-sublinhados'], ['movimento', 'menos-movimento']]) {
    await p.click(`label:has([data-cfg="${cfg}"])`); await p.waitForTimeout(60);
    ok(await p.evaluate((c) => document.documentElement.classList.contains(c), classe), `interruptor ${cfg} liga ${classe}`);
    ok(await p.getAttribute(`[data-cfg="${cfg}"]`, 'role') === 'switch', `${cfg} anunciado como interruptor`);
  }
  // vale para a aba: F5 mantém
  await p.click('.tt-opcao:nth-child(3)'); await p.waitForTimeout(120); await p.reload(); await p.waitForTimeout(150);
  ok(await raiz() === '20px' && await p.evaluate(() => document.documentElement.classList.contains('texto-espacado')), 'F5 mantém as preferências');
  await p.click('[data-action="prefs-restaurar"]'); await p.waitForTimeout(100);
  ok(await raiz() === '16px' && !(await p.evaluate(() => document.documentElement.classList.contains('texto-espacado'))), 'restaurar volta tudo ao padrão');

  // perfil da família usa o mesmo controle
  await p.goto(BASE + '#/familia/perfil'); await p.waitForTimeout(100);
  await p.click('.tt-opcao:nth-child(2)'); await p.waitForTimeout(80);
  ok(await raiz() === '18px', 'perfil da família ajusta o mesmo tamanho');
  await p.click('.tt-opcao:nth-child(1)');

  // sem rolagem lateral no celular, nem com o texto no maior tamanho
  const m = await b.newPage({ viewport: { width: 360, height: 800 } }); await require('./sessao')(m);
  await m.addInitScript(() => sessionStorage.setItem('kfka-prefs', JSON.stringify({ texto: '150' })));
  for (const r of ['/', '/entrar/professor', '/criar-conta/responsavel', '/recuperar-senha', '/admin/painel', '/admin/revisao', '/admin/periodos', '/admin/relatorios', '/professor/painel', '/professor/registro/novo', '/familia/painel', '/familia/relatorios', '/professor/configuracoes', '/design']) {
    await m.goto(BASE + '#' + r); await m.waitForTimeout(60);
    const sw = await m.evaluate(() => document.documentElement.scrollWidth);
    ok(sw <= 360, `360px com texto 150%: ${r} sem rolagem lateral${sw > 360 ? ` (${sw})` : ''}`);
  }
  ok(errs.length === 0, 'sem erros JS ' + errs.join(' | '));
  await b.close();
})();
