import './rodape.css'
import { assinatura as marca } from '../brand/assinatura.js'

// 14 telas flutuando em profundidade em volta da frase: [foto, esquerda %, topo %, profundidade 0..1]
const flutuantes = [
  ['t01', 4, 8, 0.9], ['t09', 22, 3, 0.25], ['t15', 71, 6, 0.75], ['t06', 88, 18, 0.3],
  ['t03', 9, 42, 0.35], ['t12', 87, 56, 0.95], ['t19', 2, 72, 0.6], ['t20', 90, 70, 0.2],
  ['t08', 30, 82, 0.4], ['t22', 62, 86, 0.85], ['t14', 44, 1, 0.15], ['t16', 56, 18, 0.45],
  ['t02', 16, 22, 0.55], ['t13', 76, 30, 0.1],
]

const email = 'paulosvlla@yahoo.com'

export function rodape(base) {
  return `
  <section class="depoimento" aria-label="Princípio">
    <div class="depoimento__fotos" aria-hidden="true">
      ${flutuantes.map(([f, x, y, p]) => `<img class="flutua" data-prof="${p}" src="${base}trabalhos/${f}.webp" alt="" loading="lazy" style="left:${x}%;top:${y}%;width:${(4 + p * 10).toFixed(1)}vw;filter:blur(${((1 - p) * 6).toFixed(1)}px);opacity:${(0.45 + p * 0.55).toFixed(2)}">`).join('')}
    </div>
    <blockquote class="depoimento__frase">
      <p>“Uma resposta só vale quando mostra de onde veio.”</p>
      <footer>Paulo Marcelli, sobre a F.R.E.Y.A.</footer>
    </blockquote>
  </section>
  <footer class="rodape" id="contato">
    <div class="rodape__colunas">
      <div>
        <p class="rodape__chamada">Tem uma vaga ou um projeto?</p>
        <a class="pilula-preta rodape__botao" href="mailto:${email}">Escrever para o Paulo</a>
      </div>
      <div class="rodape__contato">
        <a href="mailto:${email}">${email}</a>
        <p>São Paulo, SP · português, inglês e espanhol</p>
      </div>
      <ul class="rodape__redes">
        <li><a class="sublinha" href="https://github.com/paulomarcelli" target="_blank" rel="noopener">GitHub</a></li>
        <li><a class="sublinha" href="https://www.linkedin.com/in/paulo-marcelli-06a7bb304/" target="_blank" rel="noopener">LinkedIn</a></li>
      </ul>
    </div>
    <div class="rodape__marca marca" aria-hidden="true">${marca}</div>
  </footer>`
}
