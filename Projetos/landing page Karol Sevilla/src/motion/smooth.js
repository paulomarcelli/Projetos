// Lenis ligado ao ticker do GSAP. Chamar depois de criar os pins (ou ele guarda o limite errado).
// É a única suavização do scroll: os pins e o vídeo seguem o Lenis direto (sem scrub com atraso por cima).
// lerp 0.1 → ~0,45 s até assentar depois de um toque de roda.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function smoothScroll() {
  const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, touchMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  ScrollTrigger.addEventListener('refresh', () => lenis.resize());
  return lenis;
}
