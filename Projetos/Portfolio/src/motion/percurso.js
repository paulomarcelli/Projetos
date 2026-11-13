// A linha do tempo do túnel: o scroll leva a câmera pelo corredor, puxa cada destaque, mostra o case e atravessa a foto.
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Z_DESTAQUES } from './cena.js'

export function criarPercurso({ secao, cena, telas = 11 }) {
  const { estado } = cena
  const intro = secao.querySelectorAll('.hero__intro > *')
  const cases = [...secao.querySelectorAll('.case')]
  const fim = secao.querySelector('.hero__fim')
  const barra = secao.querySelector('.hero__progresso span')

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    onUpdate: cena.pedir,
    scrollTrigger: {
      trigger: secao,
      start: 'top top',
      end: () => '+=' + window.innerHeight * telas,
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (s) => gsap.set(barra, { scaleX: s.progress }),
    },
  })

  // 1. o hero sai
  tl.to(intro, { y: -30, autoAlpha: 0, duration: 0.9 })

  // 2. cada destaque: viagem, puxar, case, segurar, atravessar
  let z = 6
  cases.forEach((caso, k) => {
    const zk = Z_DESTAQUES[k]
    const antes = zk + 10
    tl.to(estado, { camZ: antes, duration: (z - antes) / 9 })
    const rotulo = `puxa${k}`
    tl.addLabel(rotulo)
    tl.to(estado.puxar[k], { v: 1, duration: 1.3, ease: 'power2.inOut' }, rotulo)
    tl.to(estado, { camZ: () => zk + cena.distCobrir(), duration: 1.3, ease: 'power2.inOut' }, rotulo)
    const itens = caso.querySelectorAll('[data-entra]')
    tl.set(caso, { autoAlpha: 1 })
    tl.fromTo(itens, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.06, ease: 'power2.out' })
    tl.to({}, { duration: 1 })
    tl.to(itens, { autoAlpha: 0, duration: 0.3 })
    tl.set(caso, { autoAlpha: 0 })
    tl.to(estado, { camZ: zk - 0.6, duration: 0.9, ease: 'power2.in' })
    tl.set(estado.puxar[k], { v: 0 })
    z = zk - 0.6
  })

  // 3. depois do último: o fundo do corredor e o convite para o índice
  tl.to(estado, { camZ: -88, duration: (z + 88) / 9 })
  tl.set(fim, { autoAlpha: 1 })
  tl.fromTo(fim.children, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.06, ease: 'power2.out' })
  tl.to({}, { duration: 0.8 })

  return tl
}

export { ScrollTrigger }
