// Teste do online de verdade no navegador: duas páginas do Chromium, uma cria a sala no
// servidor do PeerJS, a outra entra pelo link ?sala=CODIGO, as duas escolhem lutador, o
// anfitrião escolhe a arena e as duas lutam apertando teclas. Confere que as conferências
// de estado (hash a cada 60 quadros) batem nas duas telas.
//
// Uso: (servidor em export/web) node tests/online_web.js http://localhost:8765/ pasta_capturas
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://localhost:8765/';
const SAIDA = process.argv[3] || '.';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function estado(pg) {
  return pg.evaluate(() => window.brasiliaOnline || {});
}

async function esperarEstado(pg, nome, ms = 60000) {
  const fim = Date.now() + ms;
  while (Date.now() < fim) {
    const e = await estado(pg);
    if (e.estado === nome) return e;
    await espera(300);
  }
  throw new Error(`estado ${nome} não chegou: ${JSON.stringify(await estado(pg))}`);
}

async function tecla(pg, k, n = 1) {
  for (let i = 0; i < n; i++) {
    await pg.keyboard.press(k, { delay: 60 });
    await espera(250);
  }
}

(async () => {
  const navegador = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
      '--disable-features=WebRtcHideLocalIpsWithMdns', '--autoplay-policy=no-user-gesture-required'],
  });
  const ctxA = await navegador.newContext({ viewport: { width: 960, height: 540 } });
  const ctxB = await navegador.newContext({ viewport: { width: 960, height: 540 } });
  const a = await ctxA.newPage();
  const b = await ctxB.newPage();
  for (const [nome, pg] of [['A', a], ['B', b]]) {
    pg.on('console', (m) => { if (/erro|error|dessinc|\[rede\]/i.test(m.text())) console.log(`[${nome}] ${m.text()}`); });
  }
  let falhou = false;
  try {
    // A: título -> ONLINE -> CRIAR SALA
    await a.goto(BASE);
    await espera(9000);
    await a.mouse.click(480, 270);
    await tecla(a, 'ArrowDown');
    await tecla(a, 'Enter');
    await espera(1200);
    await tecla(a, 'Enter');
    const sala = (await esperarEstado(a, 'aguardando')).sala;
    console.log('sala criada:', sala);
    await a.screenshot({ path: `${SAIDA}/web_A_sala.png` });

    // B: entra pelo link de convite
    await b.goto(`${BASE}?sala=${sala}`);
    await esperarEstado(b, 'conectado', 90000);
    await esperarEstado(a, 'conectado', 30000);
    const rtt = (await estado(a)).rtt;
    console.log('conectados! ping ~', Math.round(rtt), 'ms');
    await espera(2500);
    await a.screenshot({ path: `${SAIDA}/web_A_selecao.png` });

    // seleção: cada um anda o próprio cursor e confirma
    await tecla(b, 'd', 3);
    await tecla(a, 'Enter');
    await tecla(b, 'Enter');
    await espera(3500);
    await b.screenshot({ path: `${SAIDA}/web_B_arena.png` });
    // arena: o anfitrião escolhe (a segunda)
    await tecla(a, 'd');
    await tecla(a, 'Enter');
    await espera(6000);

    // luta: os dois apertam teclas por um tempo
    const golpes = ['f', 'g', 'h', 'd', 'a', 'f', 'j', 't', 's', 'w', 'f', 'g'];
    const historico = { A: {}, B: {} };
    const fim = Date.now() + 40000;
    let i = 0;
    while (Date.now() < fim) {
      await a.keyboard.press(golpes[i % golpes.length], { delay: 90 });
      await b.keyboard.press(golpes[(i * 5 + 3) % golpes.length], { delay: 90 });
      i++;
      for (const [nome, pg] of [['A', a], ['B', b]]) {
        const e = await estado(pg);
        if (e.q) historico[nome][e.q] = e.h;
      }
      if (i === 40) {
        await a.screenshot({ path: `${SAIDA}/web_A_luta.png` });
        await b.screenshot({ path: `${SAIDA}/web_B_luta.png` });
      }
    }
    let comuns = 0;
    let diferentes = 0;
    for (const q of Object.keys(historico.A)) {
      if (q in historico.B) {
        comuns++;
        if (historico.A[q] !== historico.B[q]) diferentes++;
      }
    }
    const ea = await estado(a);
    const eb = await estado(b);
    console.log(`conferências em comum: ${comuns}, diferentes: ${diferentes}; quadro A ${ea.q} B ${eb.q}; vidas A ${JSON.stringify(ea.vidas)} B ${JSON.stringify(eb.vidas)}; estados ${ea.estado}/${eb.estado}`);
    if (comuns < 3 || diferentes > 0 || ea.estado !== 'conectado' || eb.estado !== 'conectado') falhou = true;
  } catch (err) {
    console.log('ERRO:', err.message);
    falhou = true;
    await a.screenshot({ path: `${SAIDA}/web_A_erro.png` }).catch(() => {});
    await b.screenshot({ path: `${SAIDA}/web_B_erro.png` }).catch(() => {});
  }
  console.log(falhou ? 'ONLINE WEB: FALHOU' : 'ONLINE WEB: OK');
  await navegador.close();
  process.exit(falhou ? 1 : 0);
})();
