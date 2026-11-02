// Linhas com máscara (SplitText com mask: 'lines'). A máscara tem folga em cima e embaixo (base.css, .ln-mask),
// então a linha escondida precisa sair mais que 100% da própria altura: HIDE = 140% passa da folga com acento.
// O estado (visível ou não) sobrevive ao re-split do autoSplit (resize, troca de fonte).
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { EASE } from './ease.js';

gsap.registerPlugin(SplitText);

export const HIDE = 140;

export function split(el) {
  if (el._ln) return el._ln;
  const state = { lines: [], shown: false, el };
  el._ln = state;
  SplitText.create(el, {
    type: 'lines', mask: 'lines', linesClass: 'ln', autoSplit: true,
    onSplit(self) {
      state.lines = self.lines;
      gsap.set(self.lines, { yPercent: state.shown ? 0 : HIDE });
    },
  });
  return state;
}

/** entra: cada linha sobe de dentro da máscara. dir 1 = vem de baixo, −1 = vem de cima */
export function showLines(el, { delay = 0, stagger = 0.075, duration = 1.05, dir = 1, instant = false } = {}) {
  const s = split(el);
  s.shown = true;
  gsap.killTweensOf(s.lines);
  if (instant) return gsap.set(s.lines, { yPercent: 0 });
  return gsap.fromTo(s.lines, { yPercent: HIDE * dir }, { yPercent: 0, duration, ease: EASE.out, stagger, delay, overwrite: true });
}

/** sai: as linhas deixam a máscara pelo lado oposto ao que entraram (dir 1 = para cima) */
export function hideLines(el, { delay = 0, stagger = 0.035, duration = 0.42, dir = 1, instant = false } = {}) {
  const s = split(el);
  s.shown = false;
  gsap.killTweensOf(s.lines);
  if (instant) return gsap.set(s.lines, { yPercent: HIDE });
  return gsap.to(s.lines, { yPercent: -HIDE * dir, duration, ease: EASE.in, stagger, delay, overwrite: true });
}
