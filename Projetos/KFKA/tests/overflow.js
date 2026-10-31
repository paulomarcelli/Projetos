const { chromium } = require('playwright'); const path = require('path');
const BASE = 'file://' + path.resolve(__dirname, '../index.html');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  for (const r of process.argv.slice(2)) { await p.goto(BASE + '#' + r); await p.waitForTimeout(80);
    console.log(r, await p.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > 392).slice(0, 6).map((e) => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right)))); }
  await b.close(); })();
