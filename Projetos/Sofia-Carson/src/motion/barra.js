// Barra de rolagem própria: fina, sobreposta, aparece ao rolar ou com o mouse perto da borda; dá para arrastar.
import { lenis, rolagem } from './rolagem.js';

export function barra() {
  const el = document.querySelector('[data-barra]');
  if (!el || matchMedia('(hover: none)').matches) { el?.remove(); return; }
  const pega = el.querySelector('i');
  let some = 0, arrastando = false, y0 = 0, s0 = 0;
  const mede = () => {
    const vh = innerHeight, total = document.documentElement.scrollHeight;
    const h = Math.max(36, (vh / total) * (vh - 16));
    const y = 8 + (scrollY / Math.max(1, total - vh)) * (vh - 16 - h);
    pega.style.height = `${h}px`;
    pega.style.transform = `translate3d(0, ${y}px, 0)`;
    return { vh, total, h };
  };
  const mostra = () => {
    el.classList.add('is-on');
    clearTimeout(some);
    some = setTimeout(() => { if (!arrastando && !el.matches(':hover')) el.classList.remove('is-on'); }, 1100);
  };
  rolagem(() => { mede(); return false; });
  addEventListener('scroll', mostra, { passive: true });
  addEventListener('resize', mede, { passive: true });
  addEventListener('pointermove', e => { if (e.clientX > innerWidth - 22) mostra(); }, { passive: true });
  pega.addEventListener('pointerdown', e => {
    arrastando = true; y0 = e.clientY; s0 = scrollY;
    pega.setPointerCapture(e.pointerId);
    el.classList.add('is-arrastando');
    document.documentElement.style.scrollBehavior = 'auto';
  });
  pega.addEventListener('pointermove', e => {
    if (!arrastando) return;
    const { vh, total, h } = mede();
    const y = s0 + ((e.clientY - y0) / (vh - 16 - h)) * (total - vh);
    if (lenis) lenis.scrollTo(y, { immediate: true }); else scrollTo(0, y);
  });
  const solta = () => { arrastando = false; el.classList.remove('is-arrastando'); document.documentElement.style.scrollBehavior = ''; mostra(); };
  pega.addEventListener('pointerup', solta);
  pega.addEventListener('pointercancel', solta);
  mede();
}
