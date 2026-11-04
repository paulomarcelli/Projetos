import './nav.css'
import { assinatura as marca } from '../brand/assinatura.js'

export function nav() {
  return `
  <header class="nav" data-nav>
    <div class="nav__veu" aria-hidden="true"></div>
    <a class="nav__marca marca" href="#topo" aria-label="Paulo Marcelli, início">${marca}</a>
    <nav class="nav__links" aria-label="Seções">
      <a class="pilula" href="#projetos">Projetos</a>
      <a class="pilula" href="#sobre">Sobre</a>
      <a class="pilula" href="#contato">Contato</a>
    </nav>
  </header>`
}
