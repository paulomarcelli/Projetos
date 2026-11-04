// A nav some ao rolar para baixo (depois de meia tela) e volta ao rolar para cima, com o véu quando está no meio da página.
export function animarNav() {
  const nav = document.querySelector('[data-nav]')
  let ultimo = window.scrollY
  let pedido = false
  function atualizar() {
    pedido = false
    const y = window.scrollY
    const meia = window.innerHeight / 2
    const desce = y > ultimo + 2
    const sobe = y < ultimo - 2
    if (y < meia) nav.classList.remove('is-escondida')
    else if (desce) nav.classList.add('is-escondida')
    else if (sobe) nav.classList.remove('is-escondida')
    nav.classList.toggle('com-veu', y > meia)
    ultimo = y
  }
  window.addEventListener('scroll', () => { if (!pedido) { pedido = true; requestAnimationFrame(atualizar) } }, { passive: true })
  // foco do teclado dentro da nav: ela aparece
  nav.addEventListener('focusin', () => nav.classList.remove('is-escondida'))
}
