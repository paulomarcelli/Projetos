import './indice.css'
import { projetos, filtros } from '../data/projetos.js'
import { textos } from '../data/casos.js'

export function indice(base) {
  return `
  <section class="indice" id="projetos" aria-labelledby="indice-titulo">
    <div class="indice__topo">
      <h2 class="indice__titulo" id="indice-titulo">Todos os projetos</h2>
      <div class="indice__filtros" role="group" aria-label="Filtrar projetos">
        ${filtros.map((f, i) => `<button type="button" class="pilula filtro${i === 0 ? ' is-ativo' : ''}" data-filtro="${f.id}" aria-pressed="${i === 0}">${f.nome}</button>`).join('')}
      </div>
    </div>
    <ul class="indice__lista">
      ${projetos.map((p) => `
      <li class="linha" data-filtro="${p.filtro}" data-foto="${base}${p.foto}">
        <a class="linha__link" href="${p.link}" target="_blank" rel="noopener">
          <span class="linha__faixa" aria-hidden="true"></span>
          <span class="linha__ano">${p.ano}</span>
          <span class="linha__cliente">${p.cliente}</span>
          <span class="linha__disciplina">${p.disciplina}</span>
          <span class="linha__cidade">${p.cidade}</span>
          <img class="linha__mini" src="${base}${p.foto}" alt="" loading="lazy">
        </a>
      </li>`).join('')}
    </ul>
    <p class="indice__conta" aria-live="polite"><span data-conta>${projetos.length}</span> de ${textos.total} projetos</p>
    <div class="indice__foto" aria-hidden="true"><img alt=""></div>
  </section>`
}
