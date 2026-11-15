// Capturas do fã-site no ar para a análise de design (T-0001). Só lê o site: não altera nada.
// Uso: node captura.cjs <nome> <largura> <altura> [celular] [reduzido] [intro] [fundo]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = 'https://paulomarcelli.github.io/Projetos/Projetos/Sofia-Carson/';
const [nome, L, A, ...opc] = process.argv.slice(2);
const largura = +L, altura = +A;
const celular = opc.includes('celular'), reduzido = opc.includes('reduzido'), comIntro = opc.includes('intro'), comFundo = opc.includes('fundo');
const pasta = __dirname;
const espera = ms => new Promise(ok => setTimeout(ok, ms));
const doisDig = n => String(n).padStart(2, '0');

(async () => {
  const navegador = await chromium.launch();
  const ctx = await navegador.newContext({
    viewport: { width: largura, height: altura }, deviceScaleFactor: 1, isMobile: celular, hasTouch: celular,
    reducedMotion: reduzido ? 'reduce' : 'no-preference', locale: 'pt-BR',
  });
  const pag = await ctx.newPage();
  const console_ = [], falhas = [];
  pag.on('console', m => { if (['error', 'warning'].includes(m.type())) console_.push(m.type() + ': ' + m.text()); });
  pag.on('pageerror', e => console_.push('pageerror: ' + e.message));
  pag.on('requestfailed', r => falhas.push(r.url() + ' ' + ((r.failure() || {}).errorText || '')));
  await pag.addInitScript(() => {
    window.__cls = 0; window.__lcp = null;
    try {
      new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver(l => { const e = l.getEntries().pop(); window.__lcp = { t: Math.round(e.startTime), el: e.element ? e.element.tagName + '.' + e.element.className : '', url: e.url || '' }; }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {}
  });

  const t0 = Date.now();
  await pag.goto(URL, { waitUntil: 'commit', timeout: 60000 });

  // 1) Intro: um quadro a cada ~400 ms até o site ficar pronto
  const intro = [];
  if (comIntro) fs.mkdirSync(path.join(pasta, 'intro'), { recursive: true });
  for (let i = 0; i < 40; i++) {
    const pronto = await pag.evaluate(() => document.documentElement.classList.contains('is-pronto') && document.querySelector('[data-carga]').classList.contains('is-fora')).catch(() => false);
    const ms = Date.now() - t0;
    if (comIntro) {
      const arq = `intro/${nome}-intro-${doisDig(i)}-${ms}ms.png`;
      await pag.screenshot({ path: path.join(pasta, arq) }).catch(() => {});
      intro.push({ arq, ms, pronto });
    }
    if (pronto) { intro.push({ fimDaIntroMs: ms }); break; }
    await espera(comIntro ? 330 : 250);
  }
  await pag.waitForLoadState('load').catch(() => {});
  await espera(2500);
  await pag.screenshot({ path: path.join(pasta, `${nome}-00-topo.png`) });

  const video = await pag.evaluate(() => {
    const v = document.querySelector('[data-fundo] video');
    return { readyState: v.readyState, paused: v.paused, tempo: v.currentTime, duracao: v.duration, erro: v.error ? v.error.message || v.error.code : null, tamanho: v.videoWidth + 'x' + v.videoHeight };
  });

  // 2) Rolagem em passos de 40 px; a cada ~85% da altura, espera 2,5 s e captura
  const total = await pag.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const paradas = [];
  const passoParada = Math.round(altura * 0.85);
  let y = 0, proxima = passoParada, n = 1;
  while (y < total) {
    y = Math.min(total, y + 40);
    await pag.evaluate(v => window.scrollTo(0, v), y);
    await espera(30);
    if (y >= proxima || y >= total) {
      await espera(2500);
      const real = await pag.evaluate(() => Math.round(scrollY));
      const arq = `${nome}-${doisDig(n)}-y${real}.png`;
      await pag.screenshot({ path: path.join(pasta, arq) });
      paradas.push({ arq, y: real });
      proxima += passoParada; n++;
    }
  }

  // 3) Medidas (com a página inteira já revelada)
  const medidas = await pag.evaluate(() => {
    const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; };
    const txt = el => (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    const textos = [];
    const sel = 'h1, h2, p, a, button, label > span, input, select, figcaption p, li p, footer span';
    for (const el of document.querySelectorAll(sel)) {
      if (!vis(el) || el.closest('[data-carga]') || el.closest('dialog')) continue;
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      const linhas = Math.max(1, Math.round(r.height / parseFloat(s.lineHeight || 20)));
      textos.push({ quem: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').join('.') : ''), texto: txt(el), px: +parseFloat(s.fontSize).toFixed(1), peso: s.fontWeight, entrelinha: s.lineHeight, cor: s.color, largura: Math.round(r.width), linhas, caracteresPorLinha: Math.round(txt(el).length / linhas) });
    }
    const alvos = [];
    for (const el of document.querySelectorAll('a, button, input, select')) {
      if (!vis(el) || el.closest('[data-carga]') || el.closest('dialog')) continue;
      const r = el.getBoundingClientRect();
      alvos.push({ quem: el.tagName.toLowerCase() + '.' + el.className, texto: txt(el) || el.name || '', w: Math.round(r.width), h: Math.round(r.height) });
    }
    const bordas = {};
    for (const el of document.querySelectorAll('main h1, main h2, main p, main label, main figure, main .pilula')) {
      if (!vis(el)) continue;
      const x = Math.round(el.getBoundingClientRect().left);
      bordas[x] = (bordas[x] || 0) + 1;
    }
    const rec = performance.getEntriesByType('resource').map(r => ({ url: r.name.split('/').slice(-2).join('/'), kb: Math.round((r.transferSize || r.encodedBodySize || 0) / 1024), tipo: r.initiatorType }));
    return {
      largura: innerWidth, alturaDaPagina: document.documentElement.scrollHeight, sobraLateral: document.documentElement.scrollWidth - innerWidth,
      cls: +window.__cls.toFixed(4), lcp: window.__lcp, textos, alvos, bordasEsquerdas: bordas,
      titulos: [...document.querySelectorAll('h1, h2, h3')].map(h => h.tagName + ': ' + txt(h)),
      imagens: [...document.querySelectorAll('main img')].map(i => ({ src: i.getAttribute('src'), alt: i.alt })),
      recursos: rec, pesoTotalKb: rec.reduce((a, r) => a + r.kb, 0),
      fontes: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight).filter((v, i, a) => a.indexOf(v) === i),
    };
  });

  // 4) Fundo sob os textos que ficam sobre o filme: esconde o texto, recorta a tela e mede a luminância
  let fundo = null;
  if (comFundo) {
    const medidor = await ctx.newPage();
    await medidor.setContent('<canvas id="c"></canvas>');
    const mede = async buf => medidor.evaluate(async b64 => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.getElementById('c'); c.width = img.width; c.height = img.height;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      const ls = [];
      for (let i = 0; i < d.length; i += 4) ls.push(0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]));
      ls.sort((a, b) => a - b);
      return { media: ls.reduce((a, b) => a + b, 0) / ls.length, p95: ls[Math.floor(ls.length * 0.95)], max: ls[ls.length - 1] };
    }, buf.toString('base64'));
    const LUZ = 0.9041; // luminância relativa de #f4f4f2
    const razao = l => +((LUZ + 0.05) / (l + 0.05)).toFixed(2);
    const alvos = [
      { nome: 'nav: links sobre o filme (topo)', sel: '.nav__links', y: 0 },
      { nome: 'nav: pilula contorno sobre o filme (topo)', sel: '.nav__reel', y: 0 },
      { nome: 'hero: canto esquerdo', sel: '.hero__canto--esq', y: 0 },
      { nome: 'hero: canto direito', sel: '.hero__canto--dir', y: 0 },
      { nome: 'hero: ver a montagem (celular/tablet)', sel: '.hero__reel', y: 0 },
      { nome: 'furo: So a voz e o palco', sel: '.filmes__furo p', centro: true },
      { nome: 'trajetoria: titulo', sel: '#trajetoria h2', centro: true },
      { nome: 'trajetoria: etapas', sel: '#trajetoria ol', centro: true },
      { nome: 'nav: links sobre o filme (na trajetoria)', sel: '.nav__links', ancora: '#trajetoria h2' },
    ];
    fundo = [];
    for (const a of alvos) {
      const existe = await pag.evaluate(s => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && getComputedStyle(e).display !== 'none'; }, a.sel);
      if (!existe) { fundo.push({ nome: a.nome, ausente: true }); continue; }
      if (a.centro || a.ancora) await pag.evaluate(s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); window.scrollTo(0, scrollY + r.top - innerHeight / 2 + r.height / 2); }, a.ancora || a.sel);
      else await pag.evaluate(v => window.scrollTo(0, v), a.y);
      await espera(1600);
      const amostras = [];
      for (let i = 0; i < 6; i++) {
        const r = await pag.evaluate(s => { const e = document.querySelector(s); e.style.visibility = 'hidden'; const b = e.getBoundingClientRect(); return { x: Math.max(0, b.left), y: Math.max(0, b.top), width: Math.min(b.width, innerWidth - Math.max(0, b.left)), height: Math.min(b.height, innerHeight - Math.max(0, b.top)) }; }, a.sel);
        const buf = await pag.screenshot({ clip: r });
        await pag.evaluate(s => { document.querySelector(s).style.visibility = ''; }, a.sel);
        const m = await mede(buf);
        amostras.push({ contrasteMedio: razao(m.media), contrasteP95: razao(m.p95) });
        if (i === 0) await pag.screenshot({ path: path.join(pasta, `${nome}-fundo-${fundo.length}.png`) });
        await espera(2200); // 6 amostras ≈ os 13 s da montagem
      }
      fundo.push({ nome: a.nome, piorMedio: Math.min(...amostras.map(x => x.contrasteMedio)), piorP95: Math.min(...amostras.map(x => x.contrasteP95)), amostras });
    }
    await medidor.close();
  }

  fs.writeFileSync(path.join(pasta, `medidas-${nome}.json`), JSON.stringify({ nome, largura, altura, celular, reduzido, intro, video, paradas, medidas, fundo, console: console_, falhasDeRede: falhas }, null, 1));
  console.log(nome, 'ok', paradas.length, 'paradas; altura da página', medidas.alturaDaPagina, '; sobra lateral', medidas.sobraLateral, '; console', console_.length, '; falhas', falhas.length, '; vídeo', JSON.stringify(video));
  await navegador.close();
})().catch(e => { console.error(nome, 'ERRO', e); process.exit(1); });
