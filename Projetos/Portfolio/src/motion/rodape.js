// Depoimento: fotos em parallax pela profundidade (eco do túnel). Rodapé: o wordmark sobe por baixo.
import { gsap } from 'gsap'

export function animarRodape({ reduzido }) {
  const secao = document.querySelector('.depoimento')
  if (!reduzido) {
    secao.querySelectorAll('.flutua').forEach((f) => {
      const p = Number(f.dataset.prof)
      gsap.fromTo(f, { y: 160 * p }, { y: -160 * p, ease: 'none', scrollTrigger: { trigger: secao, start: 'top bottom', end: 'bottom top', scrub: true } })
    })
    gsap.from('.rodape__marca', {
      yPercent: 45, ease: 'none',
      scrollTrigger: { trigger: '.rodape', start: 'top bottom', end: 'bottom bottom', scrub: true },
    })
  }
}
