// Abre o jogo, entra em "Jogar" e executa uma sequência de golpes com o teclado.
// Uso: node tests/browser/fight.js <pasta-de-saida>   (build/web servido em 127.0.0.1:8765)
const { chromium } = require('playwright');
const out = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const logs = [];
  p.on('pageerror', e => logs.push('pageerror ' + e.message));
  p.on('console', m => { if (m.type() === 'error' || /ERROR/.test(m.text())) logs.push(m.text()); });
  await p.goto('http://127.0.0.1:8765/index.html');
  await p.waitForFunction(() => { const s = document.getElementById('status'); return !s || getComputedStyle(s).display === 'none'; }, null, { timeout: 120000 });
  await p.waitForTimeout(1500);
  await p.mouse.click(287, 253);               // JOGAR
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}/1-intro.png` });
  await p.waitForTimeout(1600);                 // fim da apresentação do round
  const hold = async (key, ms) => { await p.keyboard.down(key); await p.waitForTimeout(ms); await p.keyboard.up(key); };
  await hold('KeyD', 900);                      // P1 anda para frente
  await p.keyboard.press('KeyJ'); await p.waitForTimeout(60);
  await p.screenshot({ path: `${out}/2-jab.png` });
  await p.waitForTimeout(400);
  await hold('KeyL', 80); await p.waitForTimeout(140);
  await p.screenshot({ path: `${out}/3-forte.png` });
  await p.waitForTimeout(600);
  // especial do Rocha: baixo, baixo+frente, frente + médio
  await p.keyboard.down('KeyS'); await p.waitForTimeout(40);
  await p.keyboard.down('KeyD'); await p.waitForTimeout(40);
  await p.keyboard.up('KeyS'); await p.waitForTimeout(40);
  await p.keyboard.press('KeyK'); await p.keyboard.up('KeyD');
  await p.waitForTimeout(260);
  await p.screenshot({ path: `${out}/4-especial.png` });
  await p.waitForTimeout(900);
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  await p.screenshot({ path: `${out}/5-pausa.png` });
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('Enter');  // caixas de colisão
  await p.waitForTimeout(300);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.keyboard.press('KeyJ'); await p.waitForTimeout(110);
  await p.screenshot({ path: `${out}/6-caixas.png` });
  console.log(logs.join('\n') || 'sem erros no console');
  await b.close();
})();
