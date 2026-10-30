// Marcos de texto presos a um pin: cada um tem uma janela [a, b) no progresso do pin.
// O texto não é scrubado: quando o progresso entra na janela, ele entra por tempo (máscara de linha, expo.out);
// quando sai, sai por tempo (power3.in). Rolando para baixo, entra de baixo e sai por cima; rolando para cima,
// o contrário. Assim nenhum título fica parado a meio caminho da máscara.
import { gsap } from 'gsap';
import { showLines, hideLines, split } from './split.js';

export function beats(items, { reduced = false } = {}) {
  const list = items.map(({ el, a, b }) => {
    const parts = el.matches('[data-split]') ? [el] : [...el.querySelectorAll('[data-split]')];
    parts.forEach(split);
    return { el, a, b, parts, timer: null };
  });
  let active = -1;

  function enter(i, dir) {
    const it = list[i];
    it.timer?.kill();
    gsap.set(it.el, { visibility: 'visible' });
    it.el.classList.add('is-on');
    // rótulo, título e apoio entram em cascata
    it.parts.forEach((p, k) => showLines(p, { dir, delay: k * 0.07 + (dir > 0 ? 0.08 : 0), instant: reduced }));
  }
  function leave(i, dir) {
    const it = list[i];
    it.el.classList.remove('is-on');
    it.parts.forEach((p) => hideLines(p, { dir, instant: reduced }));
    it.timer = gsap.delayedCall(reduced ? 0 : 0.6, () => gsap.set(it.el, { visibility: 'hidden' }));
  }

  return {
    update(p, dir = 1) {
      const next = list.findIndex((it) => p >= it.a && p < it.b);
      if (next === active) return;
      if (active >= 0) leave(active, dir);
      if (next >= 0) enter(next, dir);
      active = next;
    },
    get active() { return active; },
  };
}
