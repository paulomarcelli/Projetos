// Links internos pelo Lenis (a rolagem suave não segue o pulo nativo da âncora).
import { lenis } from './rolagem.js';

export function links() {
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const alvo = document.querySelector(a.getAttribute('href'));
    if (!alvo) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(alvo, { duration: 1.4 });
    else alvo.scrollIntoView();
    history.replaceState(null, '', a.getAttribute('href'));
  }));
}
