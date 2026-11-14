// Rolagem suave com Lenis (a posição continua sendo o scrollY da página, sem pin) e um laço
// de rAF só para tudo que segue a rolagem (nav, paralaxe, barra). O laço dorme quando nada precisa
// de quadro novo e acorda no evento de scroll. Com movimento reduzido, a rolagem é a nativa.
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const mq = matchMedia('(prefers-reduced-motion: reduce)');
export const reduzido = () => mq.matches;

export const lenis = reduzido() ? null : new Lenis({ autoRaf: true, lerp: 0.05, wheelMultiplier: 0.8, touchMultiplier: 1.1 });

const quem = new Set();
let vivo = false;

function laco() {
  let mais = false;
  for (const f of quem) mais = f() || mais;
  if (mais) requestAnimationFrame(laco);
  else vivo = false;
}
export function acorda() {
  if (vivo) return;
  vivo = true;
  requestAnimationFrame(laco);
}
/** fn roda a cada quadro enquanto a página rola; devolve true se ainda está suavizando */
export function rolagem(fn) {
  quem.add(fn);
  acorda();
}

// .is-scrolling: rolando com o cursor parado, o hover não acende (é assim que a prévia é gravada).
// Sai no primeiro movimento real do mouse (o Safari zera movementX, então compara a posição).
const html = document.documentElement;
let px = -1, py = -1;
addEventListener('scroll', () => { html.classList.add('is-scrolling'); acorda(); }, { passive: true });
addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  if (Math.abs(e.clientX - px) + Math.abs(e.clientY - py) > 2 && px >= 0) html.classList.remove('is-scrolling');
  px = e.clientX; py = e.clientY;
}, { passive: true });

// no iOS o :active só acende com um ouvinte de toque registrado
addEventListener('touchstart', () => {}, { passive: true });
