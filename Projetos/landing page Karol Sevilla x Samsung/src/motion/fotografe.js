// 05 Fotografe: a tela do aparelho vira a câmera. Clique (ou toque) na tela do 3D, ou aperte espaço, e ele
// "fotografa": um clarão, a próxima foto da Karol entra e o contador sobe. As setas trocam o zoom (0,6 · 1× · 3× · 5×).
// Se ninguém fotografar por 6 s (e sempre no celular), ele fotografa sozinho, a cada 2,4 s.
import { gsap } from 'gsap';

const ZOOMS = ['0,6', '1×', '3×', '5×'];

export function fotografe({ root, stage, photos, mobile, reduced }) {
  const screen = stage.phone.screen;
  const countEl = root.querySelector('.shots');
  const zoomEl = root.querySelector('.zoomnow');
  const lastEl = root.querySelector('.ultima');
  let active = false, idx = 0, shots = 0, z = 1, lastAct = 0, autoT = 0;
  const flash = { v: 0 };

  function shoot() {
    idx = (idx + 1) % photos.length;
    shots++;
    countEl.textContent = String(shots).padStart(4, '0');
    lastEl.textContent = photos[idx].alt;
    screen.set({ img: photos[idx].img, shots });
    if (reduced) { stage.invalidate(); return; }
    gsap.fromTo(flash, { v: 0.9 }, { v: 0, duration: 0.45, ease: 'power2.out', overwrite: true,
      onUpdate: () => { screen.set({ flash: flash.v }); stage.invalidate(); } });
  }
  function zoom(d) {
    z = Math.min(ZOOMS.length - 1, Math.max(0, z + d));
    zoomEl.textContent = ZOOMS[z];
    screen.set({ zoom: ZOOMS[z] });
    stage.invalidate();
  }
  const user = () => { lastAct = performance.now(); };

  addEventListener('keydown', (e) => {
    if (!active || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); user(); shoot(); }
    else if (e.code === 'ArrowRight' || e.code === 'ArrowUp') { e.preventDefault(); user(); zoom(1); }
    else if (e.code === 'ArrowLeft' || e.code === 'ArrowDown') { e.preventDefault(); user(); zoom(-1); }
  });
  addEventListener('pointerdown', (e) => {
    if (!active) return;
    const nx = (e.clientX / innerWidth) * 2 - 1, ny = -(e.clientY / innerHeight) * 2 + 1;
    if (stage.pickScreen(nx, ny)) { user(); shoot(); }
  });
  root.querySelector('.disparar')?.addEventListener('click', () => { user(); shoot(); });

  return {
    set(on) {
      if (on === active) return;
      active = on;
      screen.set({ mode: on ? 'camera' : 'foto' });
      stage.invalidate();
      if (on) lastAct = performance.now() - (mobile() ? 6000 : 0);
    },
    tick(now) {
      if (!active || reduced) return;
      if (now - lastAct > 6000 && now - autoT > 2400) { autoT = now; shoot(); }
    },
  };
}
