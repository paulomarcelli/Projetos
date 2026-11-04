// Manifesto: as palavras sobem em sequência; as notas da margem se ligam às linhas por fios que se desenham com o scroll.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function animarEstudio({ secao, reduzido }) {
  const texto = secao.querySelector('.estudio__manifesto')
  const palavras = [...texto.querySelectorAll('.m-palavra')]
  const svg = secao.querySelector('.estudio__fios')
  const margem = secao.querySelector('.estudio__margem')
  const notas = [...secao.querySelectorAll('.nota')]
  const celular = () => window.matchMedia('(max-width: 860px)').matches

  if (!reduzido) {
    gsap.from(palavras, {
      yPercent: 45, autoAlpha: 0, duration: 0.7, stagger: 0.022, ease: 'power3.out',
      scrollTrigger: { trigger: texto, start: 'top 80%' },
    })
    gsap.from(secao.querySelectorAll('.estudio__equipe li'), {
      y: 14, scale: 0.4, autoAlpha: 0, duration: 0.6, stagger: 0.07, ease: 'back.out(2.4)',
      scrollTrigger: { trigger: secao.querySelector('.estudio__equipe'), start: 'top 90%' },
    })
  }

  // fim da linha em que está a palavra-âncora: a palavra mais à direita com o mesmo topo
  function fimDaLinha(ancora) {
    const topo = ancora.offsetTop
    return palavras.filter((p) => Math.abs(p.offsetTop - topo) < 4).reduce((a, p) => Math.max(a, p.getBoundingClientRect().right), 0)
  }

  let gatilhos = []
  function desenhar() {
    gatilhos.forEach((g) => g.kill())
    gatilhos = []
    svg.innerHTML = ''
    if (celular()) { gsap.set(notas, { clearProps: 'all' }); return }
    const caixa = secao.getBoundingClientRect()
    const caixaMargem = margem.getBoundingClientRect()
    notas.forEach((nota) => {
      const ancora = texto.querySelector(`[data-ancora="${nota.dataset.nota}"]`)
      const ra = ancora.getBoundingClientRect()
      const y1 = ra.top + ra.height * 0.55 - caixa.top
      const x1 = fimDaLinha(ancora) - caixa.left + 10
      // a nota fica na altura da linha
      nota.style.top = `${y1 + caixa.top - caixaMargem.top - nota.offsetHeight / 2}px`
      const rn = nota.querySelector('.nota__ponto').getBoundingClientRect()
      const x2 = rn.left - caixa.left - 4
      const y2 = rn.top + rn.height / 2 - caixa.top
      const caminho = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      // curva cúbica que desce um pouco e sobe
      caminho.setAttribute('d', `M${x1},${y1} C${x1 + (x2 - x1) * 0.35},${y1 + 46} ${x2 - (x2 - x1) * 0.3},${y2 + 40} ${x2},${y2}`)
      svg.appendChild(caminho)
      const comprimento = caminho.getTotalLength()
      if (reduzido) { gsap.set(nota, { autoAlpha: 1 }); return }
      gsap.set(caminho, { strokeDasharray: comprimento, strokeDashoffset: comprimento })
      gsap.set(nota, { autoAlpha: 0 })
      const tw = gsap.to(caminho, {
        strokeDashoffset: 0, ease: 'none',
        scrollTrigger: {
          trigger: ancora, start: 'top 78%', end: 'top 48%', scrub: true,
          onUpdate: (s) => gsap.to(nota, { autoAlpha: s.progress > 0.96 ? 1 : 0, duration: 0.3, overwrite: true }),
        },
      })
      gatilhos.push(tw.scrollTrigger)
    })
  }

  desenhar()
  ScrollTrigger.addEventListener('refreshInit', () => gsap.set(notas, { clearProps: 'top' }))
  ScrollTrigger.addEventListener('refresh', () => requestAnimationFrame(desenhar))
}
