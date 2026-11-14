// Intro (aod). 1) a porcentagem segue o buffer do vídeo do fundo (com um mínimo de tempo para ser lida);
// 2) em 100 os rótulos se afastam para as bordas e a coluna de quadros sobe pelo meio; 3) a coluna para com o
// último quadro (o 1º da montagem) no centro e ele cresce até cobrir a tela; 4) o vídeo começa por baixo dele,
// o quadro some e o hero entra. Rolar, tocar ou apertar uma tecla durante a intro pula direto para o fim.
import { lenis, reduzido } from './rolagem.js';

const espera = ms => new Promise(ok => setTimeout(ok, ms));
const quadro = () => new Promise(ok => requestAnimationFrame(() => requestAnimationFrame(ok)));

export function carga(pronto) {
  const el = document.querySelector('[data-carga]');
  const html = document.documentElement;
  const video = document.querySelector('[data-fundo] video');
  const pctEl = el.querySelector('[data-pct]');
  const coluna = el.querySelector('[data-coluna]');
  const ultimo = el.querySelector('[data-ultimo]');
  html.querySelectorAll('.hero__marca .marca b').forEach((b, i) => b.style.setProperty('--i', i));

  // a última miniatura tem a proporção da tela: crescer até a tela vira só uma escala, sem mudar o recorte
  const tela = () => coluna.style.setProperty('--tela', `${innerWidth} / ${innerHeight}`);
  tela();
  addEventListener('resize', tela);

  history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  lenis?.stop();

  let acabou = false;
  const fim = () => {
    if (acabou) return;
    acabou = true;
    removeEventListener('wheel', pula); removeEventListener('touchstart', pula); removeEventListener('keydown', pula); removeEventListener('pointerdown', pula);
    el.classList.add('is-fora');
    html.classList.add('is-pronto');
    lenis?.start();
    video.play().catch(() => {});
  };
  const pula = () => fim();
  addEventListener('wheel', pula, { passive: true });
  addEventListener('touchstart', pula, { passive: true });
  addEventListener('keydown', pula);
  addEventListener('pointerdown', pula);

  if (reduzido()) { Promise.resolve(pronto).then(fim); return; }

  // o vídeo espera parado no 1º quadro: é ele que aparece por baixo do último quadro da coluna
  video.pause();
  video.currentTime = 0;

  // 1) porcentagem: anda sozinha até 90 e só passa disso quando o vídeo está pronto
  let pct = 0, carregou = false;
  Promise.all([pronto, document.fonts.ready, espera(900)]).then(() => { carregou = true; });
  const conta = new Promise(ok => {
    const passo = () => {
      if (acabou) return ok();
      const alvo = carregou ? 100 : 90;
      pct = Math.min(alvo, pct + (carregou ? 5 : 2.6 * Math.random() + 1.4));
      pctEl.textContent = Math.round(pct);
      if (pct >= 100) ok(); else setTimeout(passo, 28);
    };
    passo();
  });

  conta.then(async () => {
    if (acabou) return;
    await espera(220);
    // 2) rótulos para as bordas e a coluna sobe: o último quadro para com o centro no meio da tela
    el.classList.add('is-abre');
    const r = ultimo.getBoundingClientRect();
    const sobe = innerHeight / 2 + (r.top - coluna.getBoundingClientRect().top) + r.height / 2;
    const anda = coluna.animate(
      [{ transform: 'translate(-50%, 0)' }, { transform: `translate(-50%, ${-sobe}px)` }],
      { duration: 1700, easing: 'cubic-bezier(0.65, 0, 0.18, 1)', fill: 'forwards' },
    );
    await anda.finished.catch(() => {});
    if (acabou) return;
    await espera(160);

    // 3) o último quadro se solta da coluna: fica do tamanho da tela, encolhido por transform exatamente sobre
    // a miniatura, e cresce só com transform (sem layout nem redesenho por quadro)
    const a = ultimo.getBoundingClientRect();
    const de = `translate(${a.left}px, ${a.top}px) scale(${a.width / innerWidth}, ${a.height / innerHeight})`;
    el.append(ultimo);                        // sai da coluna (que tem transform e some em fade)
    ultimo.style.transform = de;
    ultimo.classList.add('is-solto');
    el.classList.add('is-crescendo');         // o fundo segue preto enquanto o quadro cresce (como no aod)
    coluna.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
    await quadro();
    const cresce = ultimo.animate(
      [{ transform: de }, { transform: 'translate(0px, 0px) scale(1, 1)' }],
      { duration: 1100, easing: 'cubic-bezier(0.76, 0, 0.24, 1)', fill: 'forwards' },
    );
    // o nome começa a subir quando o quadro está quase assentado
    espera(800).then(() => { if (!acabou) html.classList.add('is-pronto'); });
    await cresce.finished.catch(() => {});
    if (acabou) return;

    // 4) o quadro cobre a tela: o preto sai, o vídeo (parado no mesmo 1º quadro) começa por baixo e o quadro some
    el.classList.add('is-abrindo');
    video.play().catch(() => {});
    ultimo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: 'forwards' });
    await espera(380);
    fim();
  });
}
