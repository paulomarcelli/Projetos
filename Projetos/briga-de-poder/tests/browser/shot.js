const { chromium, devices } = require('playwright');
const [,, name, w, h, mobile] = process.argv;
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const opts = mobile === '1'
    ? { ...devices['Pixel 7'], viewport: { width: +w, height: +h } }
    : { viewport: { width: +w, height: +h } };
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));
  const t0 = Date.now();
  await page.goto('http://127.0.0.1:8765/index.html');
  await page.waitForFunction(() => {
    const s = document.getElementById('status');
    return !s || getComputedStyle(s).display === 'none' || getComputedStyle(s).visibility === 'hidden';
  }, null, { timeout: 120000 }).catch(e => logs.push('[wait] ' + e.message));
  await page.waitForTimeout(2500);
  logs.push(`[timing] pronto em ${Date.now() - t0} ms`);
  await page.screenshot({ path: `${name}.png` });
  const actions = JSON.parse(process.env.ACTIONS || '[]');
  for (const [i, a] of actions.entries()) {
    if (a.click) { if (mobile === '1') await page.touchscreen.tap(a.click[0], a.click[1]); else await page.mouse.click(a.click[0], a.click[1]); }
    if (a.key) await page.keyboard.press(a.key);
    await page.waitForTimeout(a.wait || 900);
    await page.screenshot({ path: `${name}-${i + 1}.png` });
  }
  console.log(logs.join('\n'));
  await browser.close();
})();
