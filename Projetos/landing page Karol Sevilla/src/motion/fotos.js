// Fotos: as polaroides e os balões enchem quando a seção chega, depois boiam cada um no seu ritmo,
// fogem do cursor conforme a profundidade (data-depth) e sobem em velocidades diferentes no scroll.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function fotos({ section, reduced }) {
  const itens = [...section.querySelectorAll('[data-depth]')];
  const arco = section.querySelector('.arco');
  if (reduced) return;

  gsap.set(itens, { scale: 0 });
  gsap.set(arco, { clipPath: 'inset(100% 0 0 0)' });
  ScrollTrigger.create({
    trigger: section.querySelector('.fotos__palco'),
    start: 'top 75%',
    onEnter: () => {
      gsap.to(arco, { clipPath: 'inset(0% 0 0 0)', duration: 1.3, ease: 'expo.out' });
      gsap.to(itens, { scale: 1, duration: 1.4, ease: 'elastic.out(1, 0.42)', stagger: 0.09, delay: 0.2 });
    },
    onLeaveBack: () => {
      gsap.to(itens, { scale: 0, duration: 0.35, ease: 'power3.in', overwrite: true });
      gsap.to(arco, { clipPath: 'inset(100% 0 0 0)', duration: 0.4, ease: 'power3.in' });
    },
  });

  // subida no scroll: os mais "perto" sobem mais
  itens.forEach((el) => {
    const d = parseFloat(el.dataset.depth);
    gsap.to(el, { yPercent: -40 * d, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // boiar + fugir do cursor, numa camada própria (o translate não briga com o yPercent do scroll)
  const corpos = itens.map((el, i) => ({ el, d: parseFloat(el.dataset.depth), fase: i * 1.7, x: 0, y: 0, vx: 0, vy: 0 }));
  const m = { x: 0, y: 0, on: false };
  section.addEventListener('pointermove', (e) => { m.x = e.clientX; m.y = e.clientY; m.on = true; });
  section.addEventListener('pointerleave', () => (m.on = false));
  let visivel = false;
  new IntersectionObserver(([e]) => (visivel = e.isIntersecting)).observe(section);
  gsap.ticker.add((t, dtMs) => {
    if (!visivel) return;
    const dt = Math.min(0.05, dtMs / 1000);
    for (const c of corpos) {
      let tx = Math.sin(t * 0.7 + c.fase) * 10 * c.d;
      let ty = Math.cos(t * 0.55 + c.fase) * 14 * c.d;
      if (m.on) {
        const r = c.el.getBoundingClientRect();
        const dx = r.left + r.width / 2 - m.x, dy = r.top + r.height / 2 - m.y;
        const dist = Math.hypot(dx, dy), R = 260;
        if (dist < R) {
          const f = Math.pow(1 - dist / R, 2) * 90 * c.d;
          tx += (dx / (dist || 1)) * f; ty += (dy / (dist || 1)) * f;
        }
      }
      const k = 60, amort = 10;
      c.vx += ((tx - c.x) * k - c.vx * amort) * dt; c.x += c.vx * dt;
      c.vy += ((ty - c.y) * k - c.vy * amort) * dt; c.y += c.vy * dt;
      c.el.style.translate = `${c.x}px ${c.y}px`;
    }
  });
}
