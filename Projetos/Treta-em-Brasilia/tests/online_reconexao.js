// Teste de reconexão do online no navegador (duas páginas do Chromium, servidor real do PeerJS):
//  1. sala no WhatsApp: A cria a sala e "vai para o WhatsApp" (sai do servidor e a página congela);
//     B abre o link e fica procurando; A volta e B entra na MESMA sala;
//  2. pisca na luta: no meio da luta a conexão de dados cai; os dois reconectam e a luta segue
//     com os resumos de estado iguais;
//  3. saiu da tela: B sai da tela (página congelada) por 20 s; A espera (não cai) e mostra o
//     aviso; B volta e a luta continua.
//
// Uso (servidor em export/web): node tests/online_reconexao.js http://localhost:8765/ pasta_capturas
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://localhost:8765/';
const SAIDA = process.argv[3] || '.';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const estado = (pg) => pg.evaluate(() => window.brasiliaOnline || {});

async function esperarEstado(pg, nomes, ms = 60000) {
  const fim = Date.now() + ms;
  while (Date.now() < fim) {
    const e = await estado(pg);
    if (nomes.includes(e.estado)) return e;
    await espera(300);
  }
  throw new Error(`estado ${nomes} não chegou: ${JSON.stringify(await estado(pg))}`);
}

async function tecla(pg, k, n = 1) {
  for (let i = 0; i < n; i++) {
    await pg.keyboard.press(k, { delay: 60 });
    await espera(250);
  }
}

// guarda os resumos (quadro -> hash) publicados pelas duas páginas, para comparar no fim
const historico = { A: {}, B: {} };
async function anotar(a, b) {
  for (const [nome, pg] of [['A', a], ['B', b]]) {
    const e = await estado(pg);
    if (e.q) historico[nome][e.q] = e.h;
  }
}

async function lutar(a, b, ms) {
  const golpes = ['f', 'g', 'h', 'd', 'a', 'f', 'j', 't', 's', 'w'];
  const fim = Date.now() + ms;
  let i = 0;
  while (Date.now() < fim) {
    await a.keyboard.press(golpes[i % golpes.length], { delay: 80 });
    await b.keyboard.press(golpes[(i * 3 + 1) % golpes.length], { delay: 80 });
    i++;
    await anotar(a, b);
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
  const cdpA = await ctxA.newCDPSession(a);
  const cdpB = await ctxB.newCDPSession(b);
  for (const [nome, pg] of [['A', a], ['B', b]]) {
    pg.on('console', (m) => { if (/erro|error|dessinc/i.test(m.text())) console.log(`[${nome}] ${m.text()}`); });
  }
  const resultados = [];
  const caso = (nome, ok, detalhe) => { resultados.push(ok); console.log(`${ok ? 'OK  ' : 'ERRO'} ${nome}: ${detalhe}`); };
  try {
    // ---- 1) sala no WhatsApp
    await a.goto(BASE);
    await espera(9000);
    await a.mouse.click(480, 270);
    await tecla(a, 'ArrowDown');
    await tecla(a, 'Enter');
    await espera(1200);
    await tecla(a, 'Enter');
    const sala = (await esperarEstado(a, ['aguardando'])).sala;
    console.log('sala criada:', sala);
    // A vai para o WhatsApp: sai do servidor de salas e, parado em segundo plano, não reconecta
    // sozinho (a reconexão automática é desligada só enquanto ele está "fora")
    await a.evaluate(() => { window.__reconectar = brk.reconectar; brk.reconectar = () => {}; brk.peer.disconnect(); });
    await b.goto(`${BASE}?sala=${sala}`);
    await espera(20000);
    const procurando = await estado(b);
    caso('convidado espera a sala (anfitrião fora da tela)', procurando.estado === 'conectando', JSON.stringify({ estado: procurando.estado, info: procurando.info }));
    // A volta para o jogo: a volta para a aba reconecta ao servidor com o mesmo código
    await a.evaluate(() => { brk.reconectar = window.__reconectar; document.dispatchEvent(new Event('visibilitychange')); });
    await esperarEstado(b, ['conectado'], 60000);
    await esperarEstado(a, ['conectado'], 30000);
    const salaDepois = (await estado(a)).sala;
    caso('anfitrião volta e o convidado entra na MESMA sala', salaDepois === sala, `sala ${sala} -> ${salaDepois}`);

    // seleção e arena (como em online_web.js)
    await espera(2500);
    await tecla(b, 'd', 3);
    await tecla(a, 'Enter');
    await tecla(b, 'Enter');
    await espera(3500);
    const limite = Date.now() + 60000;
    await espera(2000);
    await tecla(a, 'd');
    while (Date.now() < limite && !(await estado(a)).q) {
      await tecla(a, 'Enter');
      await espera(2500);
    }
    await lutar(a, b, 8000);

    // ---- 2) a conexão de dados pisca no meio da luta
    const qAntes = (await estado(a)).q || 0;
    await b.evaluate(() => brk.conn.close());
    await espera(1500);
    const durante = [(await estado(a)).estado, (await estado(b)).estado];
    await a.screenshot({ path: `${SAIDA}/reconexao_A_reconectando.png` });
    await esperarEstado(a, ['conectado'], 45000);
    await esperarEstado(b, ['conectado'], 45000);
    await lutar(a, b, 12000);
    const qDepois = (await estado(a)).q || 0;
    caso('conexão pisca na luta e volta', qDepois > qAntes + 300, `estados na queda ${durante}, quadro ${qAntes} -> ${qDepois}`);

    // ---- 3) B sai da tela por 20 s (página congelada) e volta
    await b.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await cdpB.send('Page.setWebLifecycleState', { state: 'frozen' });
    await espera(20000);
    const ea = await estado(a);
    await a.screenshot({ path: `${SAIDA}/reconexao_A_outro_fora.png` });
    caso('quem ficou espera o outro voltar (não cai)', ea.estado === 'conectado' && ea.outro_oculto === true, JSON.stringify({ estado: ea.estado, outro_oculto: ea.outro_oculto }));
    await cdpB.send('Page.setWebLifecycleState', { state: 'active' });
    await b.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await espera(3000);
    const q3 = (await estado(a)).q || 0;
    await lutar(a, b, 12000);
    const q4 = (await estado(a)).q || 0;
    const fimA = await estado(a);
    const fimB = await estado(b);
    caso('volta da tela e a luta continua', q4 > q3 + 300 && fimA.estado === 'conectado' && fimB.estado === 'conectado' && !fimA.outro_oculto,
      `quadro ${q3} -> ${q4}, estados ${fimA.estado}/${fimB.estado}`);

    // ---- resumos de estado iguais nos dois lados, do começo ao fim
    let comuns = 0;
    let diferentes = 0;
    for (const q of Object.keys(historico.A)) {
      if (q in historico.B) {
        comuns++;
        if (historico.A[q] !== historico.B[q]) diferentes++;
      }
    }
    caso('estado igual nas duas telas', comuns >= 10 && diferentes === 0, `conferências em comum ${comuns}, diferentes ${diferentes}`);
  } catch (err) {
    console.log('ERRO:', err.message);
    resultados.push(false);
    await a.screenshot({ path: `${SAIDA}/reconexao_A_erro.png` }).catch(() => {});
    await b.screenshot({ path: `${SAIDA}/reconexao_B_erro.png` }).catch(() => {});
  }
  const falhou = resultados.includes(false);
  console.log(falhou ? 'RECONEXÃO: FALHOU' : 'RECONEXÃO: OK');
  await navegador.close();
  process.exit(falhou ? 1 : 0);
})();
