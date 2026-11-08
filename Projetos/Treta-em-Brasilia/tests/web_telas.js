// Passeio pelas telas da versão web num Chromium (Playwright): título, configurações, como jogar,
// créditos, lutadores, online, seleção, arena, VS, luta e pausa. Tira uma captura de cada tela e
// junta os erros do console. Serve para conferir uma troca de motor (web/motor) ou de exportação:
// rode nas duas versões e compare as capturas.
//
// Uso (servidor em export/web): node tests/web_telas.js http://localhost:8765/ pasta_capturas
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://localhost:8765/';
const SAIDA = process.argv[3] || '.';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Pontos em coordenadas do jogo (a janela do teste tem o mesmo tamanho: 1280x720).
const TITULO = { play: [462, 351], online: [462, 425], lutadores: [818, 499], config: [462, 573], creditos: [818, 573] };
const CONFIG_COMO_JOGAR = [640, 581];
const ARENA_PRACA = [380, 238];

(async () => {
  const navegador = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
      '--autoplay-policy=no-user-gesture-required'],
  });
  const pg = await (await navegador.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const erros = [];
  let etapa = 'carregando';
  pg.on('console', (m) => {
    const t = m.text();
    if (m.type() === 'error' || /SCRIPT ERROR|ERROR:|Cannot get class|not found|Failed to/i.test(t)) erros.push(`[${etapa}] ${t}`);
  });
  pg.on('pageerror', (e) => erros.push(`[${etapa}] pageerror ${e.message}`));

  const t0 = Date.now();
  await pg.goto(BASE);
  await pg.waitForFunction(() => {
    const s = document.getElementById('status');
    return !s || getComputedStyle(s).display === 'none' || getComputedStyle(s).visibility === 'hidden';
  }, null, { timeout: 120000 });
  console.log(`abriu em ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  await espera(2500);

  // a etapa marca, nos erros do console, depois de qual captura eles apareceram
  const foto = async (nome) => { await pg.screenshot({ path: `${SAIDA}/${nome}.png` }); etapa = `depois de ${nome}`; console.log('captura', nome); };
  const clica = async (p, ms = 1500) => { await pg.mouse.click(p[0], p[1]); await espera(ms); };
  const tecla = async (k, ms = 1200) => { await pg.keyboard.press(k); await espera(ms); };

  await foto('01_titulo');
  await clica(TITULO.config);
  await foto('02_config');
  await clica(CONFIG_COMO_JOGAR);
  await foto('03_como_jogar');
  await tecla('Escape');
  await tecla('Escape');
  await clica(TITULO.creditos, 3000);
  await foto('04_creditos');
  await tecla('Escape');
  await clica(TITULO.lutadores, 2000);
  await foto('05_lutadores');
  await tecla('Escape');
  await clica(TITULO.online, 2000);
  await foto('06_online');
  await tecla('Escape');
  await clica(TITULO.play, 2000);
  await foto('07_selecao');
  // 1P escolhe, a CPU escolhe; depois a arena (Praça dos Três Poderes)
  await tecla('Enter', 1500);
  await tecla('Enter', 1500);
  await foto('08_arena');
  // a arena só aceita o toque depois que a cortina da transição abre: insiste algumas vezes
  for (let i = 0; i < 3; i++) await clica(ARENA_PRACA, 700);
  await foto('09_versus');
  await espera(6000);
  await foto('10_luta');
  await tecla('p', 1000);
  await foto('11_pausa');
  await tecla('p', 500);

  console.log(erros.length ? `ERROS NO CONSOLE (${erros.length}):\n  ${erros.join('\n  ')}` : 'console sem erros');
  console.log(erros.length ? 'TELAS WEB: FALHOU' : 'TELAS WEB: OK');
  await navegador.close();
  process.exit(erros.length ? 1 : 0);
})();
