// Capturas de tela em desktop, tablet e celular
const { chromium } = require('playwright');
const path = require('path');
const BASE = 'file://' + path.resolve(__dirname, '../index.html');
const OUT = process.argv[2];
const routes = process.argv.slice(3);
(async () => {
  const b = await chromium.launch();
  for (const [vw, vh, tag] of [[1366, 900, 'd'], [820, 1100, 't'], [390, 844, 'm']]) {
    const p = await b.newPage({ viewport: { width: vw, height: vh } });
    for (const r of routes) {
      await p.goto(BASE + '#' + r); await p.waitForTimeout(80);
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      if (sw > vw + 1) console.log('OVERFLOW', tag, r, sw);
      await p.screenshot({ path: `${OUT}/${tag}_${r.replace(/[^\w]+/g, '_')}.png`, fullPage: tag !== 'd' ? false : true });
    }
    await p.close();
  }
  await b.close();
})();
