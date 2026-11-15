// Capturas extras: teclado e foco, estados do cadastro, reel, celular deitado, 320 px e detalhes ampliados.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const URL = 'https://paulomarcelli.github.io/Projetos/Projetos/Sofia-Carson/';
const P = a => path.join(__dirname, a);
const espera = ms => new Promise(ok => setTimeout(ok, ms));
const pronto = async pag => { await pag.waitForFunction(() => document.documentElement.classList.contains('is-pronto') && document.querySelector('[data-carga]').classList.contains('is-fora'), null, { timeout: 30000 }); await espera(2500); };
const rola = async (pag, ate) => { let y = await pag.evaluate(() => scrollY); while (y < ate) { y = Math.min(ate, y + 40); await pag.evaluate(v => window.scrollTo(0, v), y); await espera(25); } await espera(2500); };
const fim = pag => pag.evaluate(() => document.documentElement.scrollHeight - innerHeight);

(async () => {
  const nav = await chromium.launch();
  const saida = {};

  // A) Teclado em 1280: ordem do Tab, anel de foco, capturas
  {
    const ctx = await nav.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    const pag = await ctx.newPage();
    await pag.goto(URL, { waitUntil: 'load' });
    await pronto(pag);
    const ordem = [];
    for (let i = 0; i < 16; i++) {
      await pag.keyboard.press('Tab');
      await espera(1500);
      const f = await pag.evaluate(() => {
        const e = document.activeElement; if (!e || e === document.body) return null;
        const r = e.getBoundingClientRect(), s = getComputedStyle(e);
        return { quem: e.tagName.toLowerCase() + '.' + e.className, texto: (e.innerText || e.getAttribute('aria-label') || e.name || '').replace(/\s+/g, ' ').trim().slice(0, 40), naTela: r.top >= 0 && r.bottom <= innerHeight, topo: Math.round(r.top), contorno: s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineColor, bordaDeBaixo: s.borderBottomWidth, y: Math.round(scrollY), x: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) };
      });
      ordem.push(f);
      if (f && [0, 3, 5, 7, 9].includes(i)) {
        await pag.screenshot({ path: P(`foco-${String(i + 1).padStart(2, '0')}.png`) });
        const c = { x: Math.max(0, f.x - 60), y: Math.max(0, f.topo - 40), width: Math.min(1280 - Math.max(0, f.x - 60), f.w + 120), height: Math.min(800 - Math.max(0, f.topo - 40), f.h + 80) };
        if (c.width > 0 && c.height > 0) await pag.screenshot({ path: P(`foco-${String(i + 1).padStart(2, '0')}-detalhe.png`), clip: c });
      }
    }
    saida.tab = ordem;

    // B) Cadastro: erro e sucesso
    await pag.evaluate(() => window.scrollTo(0, 0)); await espera(500);
    await rola(pag, await fim(pag));
    await pag.locator('[data-cadastro]').scrollIntoViewIfNeeded();
    await pag.evaluate(() => { const r = document.querySelector('[data-cadastro]').getBoundingClientRect(); window.scrollTo(0, scrollY + r.top - 160); });
    await espera(1500);
    await pag.locator('[data-cadastro] button[type=submit]').click();
    await espera(900);
    await pag.screenshot({ path: P('cadastro-1-erro-nome.png') });
    await pag.fill('[name=nome]', 'Paulo');
    await pag.fill('[name=email]', 'paulo@');
    await pag.locator('[data-cadastro] button[type=submit]').click();
    await espera(900);
    await pag.screenshot({ path: P('cadastro-2-erro-email.png') });
    await pag.fill('[name=email]', 'fa@exemplo.com');
    await pag.locator('[data-cadastro] button[type=submit]').click();
    await espera(900);
    await pag.screenshot({ path: P('cadastro-3-sucesso.png') });
    saida.cadastro = await pag.evaluate(() => ({ retorno: document.querySelector('[data-retorno]').textContent, invalidos: [...document.querySelectorAll('[aria-invalid]')].length }));

    // C) Reel
    await pag.locator('.nav [data-abre-reel]').click();
    await espera(2500);
    await pag.screenshot({ path: P('reel-1280.png') });
    saida.reel = await pag.evaluate(() => { const d = document.querySelector('[data-reel]'); const v = d.querySelector('video'); return { aberto: d.open, controles: v.controls, tocando: !v.paused, focoEm: document.activeElement.className }; });
    await pag.keyboard.press('Escape');
    await espera(600);
    saida.reel.fechouComEsc = await pag.evaluate(() => !document.querySelector('[data-reel]').open);

    // D) Detalhes ampliados (2x) em 1280: costura no rodapé e nav sobre o filme claro
    await ctx.close();
    const ctx2 = await nav.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
    const p2 = await ctx2.newPage();
    await p2.goto(URL, { waitUntil: 'load' });
    await pronto(p2);
    await rola(p2, await fim(p2));
    await p2.screenshot({ path: P('detalhe-rodape-borda-esquerda.png'), clip: { x: 0, y: 360, width: 120, height: 440 } });
    await p2.screenshot({ path: P('detalhe-rodape-borda-direita.png'), clip: { x: 1160, y: 360, width: 120, height: 440 } });
    await p2.screenshot({ path: P('detalhe-rodape-texto.png'), clip: { x: 0, y: 730, width: 700, height: 70 } });
    await p2.screenshot({ path: P('detalhe-cadastro.png'), clip: { x: 840, y: 40, width: 440, height: 300 } });
    await ctx2.close();
  }

  // E) Nav sobre o plano mais claro do filme, no topo (procura o momento mais claro em ~14 s)
  {
    const ctx = await nav.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    const pag = await ctx.newPage();
    await pag.goto(URL, { waitUntil: 'load' });
    await pronto(pag);
    for (let i = 0; i < 7; i++) { await pag.screenshot({ path: P(`plano-${i}-topo-1280.png`) }); await espera(1900); }
    await ctx.close();
  }

  // F) Celular deitado e 320 px
  for (const [nome, w, h] of [['deitado844', 844, 390], ['c320', 320, 640]]) {
    const ctx = await nav.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const pag = await ctx.newPage();
    await pag.goto(URL, { waitUntil: 'load' });
    await pronto(pag);
    await pag.screenshot({ path: P(`${nome}-00-topo.png`) });
    const total = await fim(pag);
    let n = 1;
    for (let alvo = Math.round(h * 0.85); alvo < total + h; alvo += Math.round(h * 0.85)) {
      await rola(pag, Math.min(alvo, total));
      await pag.screenshot({ path: P(`${nome}-${String(n).padStart(2, '0')}.png`) });
      n++;
      if (alvo >= total) break;
    }
    saida[nome] = await pag.evaluate(() => ({ sobraLateral: document.documentElement.scrollWidth - innerWidth, alvos: [...document.querySelectorAll('.nav a, .nav button, .hero__reel')].filter(e => e.getBoundingClientRect().width).map(e => e.innerText.trim() + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)) }));
    await ctx.close();
  }

  fs.writeFileSync(P('medidas-extras.json'), JSON.stringify(saida, null, 1));
  console.log(JSON.stringify(saida, null, 1));
  await nav.close();
})().catch(e => { console.error('ERRO', e); process.exit(1); });
