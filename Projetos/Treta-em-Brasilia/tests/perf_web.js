// Mede a versão web num Chromium (Playwright), simulando um aparelho mais lento:
//   - quanto tempo a página leva até o jogo abrir;
//   - quadros por segundo na tela de título;
//   - se o modo leve automático liga (window.brasiliaFps, publicado por main.gd).
// A CPU é desacelerada pelo DevTools (lento = 4 ≈ celular intermediário). Sem placa de vídeo
// no contêiner, o Chromium desenha por software: compare versões, não leve os números ao pé da letra.
//
// Uso (servidor em export/web): node tests/perf_web.js http://localhost:8765/ [lento] [mbps]
// mbps (opcional) limita a rede, como um celular no 4G (ex.: 10). Use com o link publicado, que
// entrega os arquivos comprimidos (o servidor local de teste não comprime).
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://localhost:8765/';
const LENTO = +(process.argv[3] || 4);
const MBPS = +(process.argv[4] || 0);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const navegador = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
      '--autoplay-policy=no-user-gesture-required'],
  });
  const ctx = await navegador.newContext({ viewport: { width: 844, height: 390 } });
  const pg = await ctx.newPage();
  const cdp = await ctx.newCDPSession(pg);
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: LENTO });
  if (MBPS > 0) {
    await cdp.send('Network.emulateNetworkConditions',
      { offline: false, latency: 60, downloadThroughput: (MBPS * 1e6) / 8, uploadThroughput: (MBPS * 1e6) / 32 });
  }
  await pg.addInitScript(() => {
    window.__q = [];
    let ultimo = performance.now();
    const f = (t) => { window.__q.push(t - ultimo); ultimo = t; requestAnimationFrame(f); };
    requestAnimationFrame(f);
  });

  const t0 = Date.now();
  await pg.goto(BASE);
  await pg.waitForFunction(() => {
    const s = document.getElementById('status');
    return !s || getComputedStyle(s).display === 'none' || getComputedStyle(s).visibility === 'hidden';
  }, null, { timeout: 180000 });
  const abriu = (Date.now() - t0) / 1000;

  await espera(2000);
  await pg.evaluate(() => { window.__q = []; });
  await espera(4000);
  const q = (await pg.evaluate(() => window.__q.slice(1))).sort((a, b) => a - b);
  const media = q.reduce((a, b) => a + b, 0) / q.length;

  let leve = null;
  for (let i = 0; i < 10 && leve === null; i++) {
    const f = await pg.evaluate(() => window.brasiliaFps || null);
    if (f) leve = f;
    await espera(1500);
  }
  console.log(`CPU ${LENTO}x${MBPS ? `, rede ${MBPS} Mbps` : ''}: abriu em ${abriu.toFixed(1)} s · título ${(1000 / media).toFixed(1)} fps (p95 ${q[Math.floor(q.length * 0.95)].toFixed(1)} ms) · medidor ${JSON.stringify(leve)}`);
  await navegador.close();
})();
