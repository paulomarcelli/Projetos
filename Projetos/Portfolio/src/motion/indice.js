// Índice: filtros e a foto do projeto que segue o cursor.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function animarIndice({ secao, reduzido }) {
  const linhas = [...secao.querySelectorAll('.linha')]
  const botoes = [...secao.querySelectorAll('.filtro')]
  const conta = secao.querySelector('[data-conta]')

  botoes.forEach((b) => b.addEventListener('click', () => {
    const f = b.dataset.filtro
    botoes.forEach((x) => { const sim = x === b; x.classList.toggle('is-ativo', sim); x.setAttribute('aria-pressed', String(sim)) })
    let n = 0
    linhas.forEach((l) => { const mostra = f === 'todos' || l.dataset.filtro === f; l.hidden = !mostra; if (mostra) n++ })
    conta.textContent = n
    ScrollTrigger.refresh()
  }))

  if (!window.matchMedia('(pointer: fine)').matches) return
  const caixa = secao.querySelector('.indice__foto')
  const img = caixa.querySelector('img')
  const lista = secao.querySelector('.indice__lista')
  const dur = reduzido ? 0 : 0.55
  const xTo = gsap.quickTo(caixa, 'x', { duration: dur, ease: 'power3.out' })
  const yTo = gsap.quickTo(caixa, 'y', { duration: dur, ease: 'power3.out' })
  let dentro = false

  const posicionar = (cx, cy) => { xTo(cx + 140); yTo(cy - caixa.offsetHeight / 2) }

  function mostrar(linha, cx, cy) {
    img.src = linha.dataset.foto
    if (!dentro) {
      dentro = true
      gsap.set(caixa, { x: cx + 140, y: cy - caixa.offsetHeight / 2 })
      gsap.to(caixa, { scale: 1, autoAlpha: 1, rotation: gsap.utils.random(-5, 5), duration: reduzido ? 0 : 0.4, ease: 'power3.out', overwrite: 'auto' })
    } else {
      gsap.to(caixa, { rotation: gsap.utils.random(-5, 5), duration: reduzido ? 0 : 0.4, ease: 'power3.out' })
    }
  }

  linhas.forEach((l) => {
    const link = l.querySelector('.linha__link')
    link.addEventListener('pointerenter', (e) => mostrar(l, e.clientX, e.clientY))
    // teclado: a foto aparece ao lado da linha em foco
    link.addEventListener('focus', () => { const r = link.getBoundingClientRect(); mostrar(l, r.left + r.width * 0.45, r.top + r.height / 2); posicionar(r.left + r.width * 0.45, r.top + r.height / 2) })
  })
  lista.addEventListener('pointermove', (e) => posicionar(e.clientX, e.clientY))
  const esconder = () => { dentro = false; gsap.to(caixa, { scale: 0, autoAlpha: 0, duration: reduzido ? 0 : 0.35, ease: 'power2.in' }) }
  lista.addEventListener('pointerleave', esconder)
  lista.addEventListener('focusout', (e) => { if (!lista.contains(e.relatedTarget)) esconder() })
}
