// Abertura: as seis camadas caem no lugar, de baixo para cima (traseira, bateria, placa, moldura, tela, vidro);
// cada uma assenta com um pequeno quique e o contador vai de 0 a 6. É o próprio hero.
// Começa quando a tela de carga já deitou a planta em cima da tela do 3D: o canvas aparece por baixo dos fios.
import { gsap } from 'gsap';
import { LAYERS } from '../three/dims.js';

const dropFor = (stage) => { const { W, H } = stage.size(); return W / H < 0.8 ? 520 : 200; };

/** as camadas sobem antes do primeiro quadro (que é desenhado ainda escondido, durante a carga) */
export function prepareIntro(stage) {
  const d = dropFor(stage);
  LAYERS.forEach((n, i) => stage.phone.setDrop(n, d + i * 26));
}

export function intro({ el, stage, reduced, onReveal, delay = 0, lead = 0.05, fade = 0.6 }) {
  if (reduced || !el) { LAYERS.forEach((l) => stage.phone.setDrop(l, 0)); el?.remove(); onReveal(); return; }
  const n = el.querySelector('.intro__n');
  const canvas = stage.renderer.domElement;
  prepareIntro(stage);
  let landed = 0;
  gsap.set(canvas, { opacity: 0 });
  const tl = gsap.timeline({ delay, onUpdate: () => stage.invalidate() });
  tl.to(canvas, { opacity: 1, duration: fade, ease: 'power2.out' }, 0);
  LAYERS.forEach((name, i) => {
    const st = { y: stage.phone.layers[name].userData.drop };
    tl.to(st, {
      y: 0, duration: 0.62, ease: 'power3.in',
      onUpdate: () => stage.phone.setDrop(name, st.y),
      onComplete: () => {
        // assenta: afunda 0,8 mm e volta
        gsap.fromTo(st, { y: -0.8 }, { y: 0, duration: 0.35, ease: 'back.out(3)', onUpdate: () => stage.phone.setDrop(name, st.y) });
        landed++;
        n.textContent = String(landed);
      },
    }, lead + i * 0.32);
  });
  tl.add(() => {
    gsap.to(el.querySelector('.intro__count'), { opacity: 0, y: -8, duration: 0.5, ease: 'power3.in', onComplete: () => el.remove() });
    onReveal();
  }, '-=0.35');
}
