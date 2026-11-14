// Reel: <dialog> em tela cheia com a montagem. Abre por qualquer [data-abre-reel]; fecha no botão, no Esc
// ou clicando fora do vídeo. A rolagem para enquanto está aberto e o foco volta para quem abriu.
import { lenis } from './rolagem.js';

export function reel() {
  const d = document.querySelector('[data-reel]');
  const v = d.querySelector('video');
  let quem = null;
  const abre = e => {
    quem = e.currentTarget;
    if (!v.getAttribute('src')) v.src = import.meta.env.BASE_URL + 'video/montagem.mp4'; // base do Vite (GitHub Pages)
    d.showModal();
    lenis?.stop();
    v.currentTime = 0;
    v.play().catch(() => {});
  };
  const fecha = () => d.close();
  d.addEventListener('close', () => { v.pause(); lenis?.start(); quem?.focus({ preventScroll: true }); });
  document.querySelectorAll('[data-abre-reel]').forEach(b => b.addEventListener('click', abre));
  d.querySelector('[data-fecha-reel]').addEventListener('click', fecha);
  d.addEventListener('click', e => { if (e.target === d) fecha(); });
}
