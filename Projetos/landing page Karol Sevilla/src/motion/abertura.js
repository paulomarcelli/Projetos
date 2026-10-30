// Abertura: o logo KS no marinho, o grau enche como balão enquanto a contagem desce de 100 a 000;
// no fim o grau estufa e estoura, e a cortina sobe.
import { gsap } from 'gsap';

export function abertura() {
  const el = document.querySelector('.intro');
  if (!document.documentElement.classList.contains('intro-on')) return Promise.resolve();
  const grau = el.querySelector('.intro__grau');
  const conta = el.querySelector('.intro__conta');
  const n = { v: 100 };
  return new Promise((resolve) => {
    gsap.timeline({ onComplete: resolve })
      .to(grau, { scale: 1, duration: 1.6, ease: 'elastic.out(1, 0.45)' }, 0)
      .to(n, { v: 0, duration: 1.7, ease: 'power2.inOut', onUpdate: () => (conta.textContent = String(Math.round(n.v)).padStart(3, '0')) }, 0)
      .to(grau, { scale: 1.35, duration: 0.25, ease: 'power2.out' }, 1.75)
      .to(grau, { scale: 0, duration: 0.18, ease: 'power3.in' }, 2.0)
      .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut' }, 2.1);
  });
}
