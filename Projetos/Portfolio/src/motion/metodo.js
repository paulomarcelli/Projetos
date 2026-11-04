// Método: seção presa; o scroll desliza a tira de filme e a régua acompanha a etapa ativa.
import { gsap } from 'gsap'

export function animarMetodo({ secao }) {
  const palco = secao.querySelector('.metodo__palco')
  const janela = secao.querySelector('.metodo__janela')
  const tira = secao.querySelector('.metodo__tira')
  const quadros = [...secao.querySelectorAll('.metodo__quadro')]
  const etapas = [...secao.querySelectorAll('.metodo__etapa')]
  const fio = secao.querySelector('.metodo__fio span')
  let ativa = -1

  function marcar(i) {
    if (i === ativa) return
    ativa = i
    quadros.forEach((q, k) => q.classList.toggle('is-ativo', k === i))
    etapas.forEach((e, k) => e.classList.toggle('is-ativa', k === i))
  }

  // o quadro ativo passa pelo centro, sem deixar vazio nas pontas
  function deslocamento(p) {
    const largura = quadros[0].offsetWidth
    const total = largura * quadros.length
    const janelaW = janela.clientWidth
    const x = janelaW / 2 - (p * (quadros.length - 1) + 0.5) * largura
    return Math.min(0, Math.max(janelaW - total, x))
  }

  gsap.timeline({
    scrollTrigger: {
      trigger: secao, pin: palco, start: 'top top', end: () => '+=' + window.innerHeight * 2.6,
      scrub: true, invalidateOnRefresh: true,
      onUpdate: (s) => {
        gsap.set(tira, { x: deslocamento(s.progress) })
        gsap.set(fio, { scaleX: s.progress })
        marcar(Math.min(quadros.length - 1, Math.round(s.progress * (quadros.length - 1))))
      },
      onRefresh: (s) => gsap.set(tira, { x: deslocamento(s.progress) }),
    },
  })
  marcar(0)
}
