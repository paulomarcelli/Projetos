// A nav troca para tinta quando a folha cor de osso passa por baixo dela, e volta a luz nas aberturas de tela
// inteira ([data-aberta]). Nos furos pequenos da folha ela continua tinta: a nav piscaria a cada janela.
import { rolagem } from './rolagem.js';

export function nav() {
  const el = document.querySelector('[data-nav]');
  const folha = document.querySelector('.folha');
  const aberturas = [...document.querySelectorAll('[data-aberta]')];
  // texto das aberturas (sem a faixa de osso): some por marco ao chegar na altura da nav, volta ao descer
  const sob = [...document.querySelectorAll('[data-aberta] h2, [data-aberta] li')];
  let agora = null;
  const confere = () => {
    const meio = el.offsetHeight / 2;
    const aberta = aberturas.some(a => { const r = a.getBoundingClientRect(); return r.top <= meio && r.bottom > meio; });
    const sim = folha.getBoundingClientRect().top <= meio && !aberta;
    if (sim !== agora) { el.classList.toggle('is-clara', sim); agora = sim; }
    const limite = el.offsetHeight + 12;
    for (const t of sob) t.classList.toggle('is-sob', t.getBoundingClientRect().top < limite);
    return false;
  };
  rolagem(confere);
  addEventListener('resize', confere, { passive: true });
  confere();
}
