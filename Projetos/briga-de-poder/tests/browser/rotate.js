const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ ...devices['Pixel 7'], viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage(); const logs=[];
  p.on('pageerror', e => logs.push('pageerror '+e.message));
  p.on('console', m => { if (m.type()==='error') logs.push('console '+m.text()); });
  await p.goto('http://127.0.0.1:8765/index.html');
  await p.waitForFunction(() => { const s=document.getElementById('status'); return !s || getComputedStyle(s).display==='none' || getComputedStyle(s).visibility==='hidden'; }, null, {timeout:120000});
  await p.waitForTimeout(2000);
  await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(2000);
  await p.screenshot({ path: 'rot-land.png' });
  await p.touchscreen.tap(140, 185); await p.waitForTimeout(1800);  // Configurações (layout de toque)
  await p.screenshot({ path: 'rot-settings.png' });
  console.log(logs.join('\n') || 'sem erros no console'); await b.close();
})();
