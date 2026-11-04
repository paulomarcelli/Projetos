import './hero.css'
import { assinatura as marca } from '../brand/assinatura.js'
import { casos, textos } from '../data/casos.js'

const dois = (n) => String(n).padStart(2, '0')

export function hero() {
  const total = dois(casos.length)
  const cases = casos.map((c, k) => `
    <article class="case" data-case="${k}" aria-label="Case ${c.cliente}">
      <div class="case__nevoa" aria-hidden="true"></div>
      <p class="case__num" data-entra>${dois(k + 1)} / ${total}</p>
      <div class="case__base">
        <p class="case__meta" data-entra>${c.ano} · ${c.disciplina} · ${c.cidade}</p>
        <h2 class="case__nome" data-entra>${c.cliente}</h2>
        <p class="case__resumo" data-entra>${c.resumo}</p>
      </div>
      <a class="pilula-preta case__abrir" data-entra href="${c.link}" target="_blank" rel="noopener">${c.acao} →</a>
    </article>`).join('')

  return `
  <section class="hero" id="topo" aria-label="Trabalhos em destaque">
    <canvas class="hero__canvas" aria-hidden="true"></canvas>
    <div class="hero__intro">
      <h1 class="hero__frase"><span>${textos.frase[0]}</span><br><span>${textos.frase[1]}</span></h1>
      <div class="hero__marca marca" aria-hidden="true">${marca}</div>
      <p class="hero__role pilula-vidro">${textos.role}</p>
      <p class="hero__local pilula-vidro">${textos.local}</p>
    </div>
    ${cases}
    <div class="hero__fim">
      <p class="hero__fim-texto">${textos.fim}</p>
      <a class="pilula-preta" href="#projetos">Ver todos os projetos</a>
    </div>
    <div class="hero__progresso" aria-hidden="true"><span></span></div>
  </section>`
}
