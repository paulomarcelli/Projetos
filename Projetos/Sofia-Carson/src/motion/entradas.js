// Entradas por marco: cada .entra ganha .is-in quando chega a 85% da tela, uma vez só.
export function entradas() {
  const io = new IntersectionObserver(es => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -15% 0px' });
  document.querySelectorAll('.entra').forEach(el => io.observe(el));
}
