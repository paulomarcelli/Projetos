import './metodo.css'

export const etapas = [
  { nome: 'Pergunta', frase: 'Todo projeto começa por uma pergunta que alguém precisa responder.' },
  { nome: 'Estrutura', frase: 'Antes da tela, o esqueleto: os dados, as fontes e o que liga uma coisa à outra.' },
  { nome: 'Interface', frase: 'HTML, CSS e JavaScript até a resposta ficar clara para quem lê.' },
  { nome: 'Publicação', frase: 'No ar, no GitHub Pages, para qualquer pessoa abrir.' },
]

// a marca da F.R.E.Y.A. (três estrelas de quatro pontas) sobre uma grade de construção
const grade = `
<svg class="metodo__grade" viewBox="0 0 300 400" role="img" aria-label="A marca da F.R.E.Y.A. sobre a grade de construção">
  <rect width="300" height="400" fill="var(--papel)"/>
  <g stroke="var(--grade)" stroke-width="0.7" fill="none">
    ${[50, 100, 150, 200, 250].map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="400"/>`).join('')}
    ${[80, 130, 180, 230, 280, 330].map((y) => `<line x1="0" y1="${y}" x2="300" y2="${y}"/>`).join('')}
    <circle cx="172" cy="175" r="105"/><circle cx="84" cy="262" r="45"/><circle cx="40" cy="245" r="13"/>
    <line x1="0" y1="0" x2="300" y2="400"/><line x1="300" y1="0" x2="0" y2="400"/>
  </g>
  <g fill="var(--acento)" transform="translate(28 70) scale(0.36)">
    <path d="M395 0C403.7 165.9 520.1 282.3 686 291C520.1 299.7 403.7 416.1 395 582C386.3 416.1 269.9 299.7 104 291C269.9 282.3 386.3 165.9 395 0Z"/>
    <path d="M155 408C161.3 480.8 207.7 527.2 280.5 533.5C207.7 539.8 161.3 586.2 155 659C148.7 586.2 102.3 539.8 29.5 533.5C102.3 527.2 148.7 480.8 155 408Z"/>
    <path d="M35.5 361C37.6 380.9 51.1 394.4 71 396.5C51.1 398.6 37.6 412.1 35.5 432C33.4 412.1 19.9 398.6 0 396.5C19.9 394.4 33.4 380.9 35.5 361Z"/>
  </g>
</svg>`

export function metodo(base) {
  const quadros = [
    `<img src="${base}trabalhos/metodo-pergunta.webp" alt="A F.R.E.Y.A. recebendo uma pergunta" loading="lazy">`,
    grade,
    `<img src="${base}trabalhos/metodo-interface.webp" alt="A interface da Iris" loading="lazy">`,
    `<img src="${base}trabalhos/metodo-publicacao.webp" alt="A LUNA MIND publicada" loading="lazy">`,
  ]
  return `
  <section class="metodo" id="metodo" aria-labelledby="metodo-titulo">
    <div class="metodo__palco">
      <h2 class="metodo__titulo" id="metodo-titulo">Como um projeto nasce aqui</h2>
      <div class="metodo__janela">
        <ol class="metodo__tira">
          ${quadros.map((q, i) => `<li class="metodo__quadro" data-quadro="${i}"><span class="so-leitor">${etapas[i].nome}</span>${q}</li>`).join('')}
        </ol>
      </div>
      <div class="metodo__regua">
        <div class="metodo__fio"><span></span></div>
        <ol class="metodo__etapas">
          ${etapas.map((e, i) => `<li class="metodo__etapa" data-etapa="${i}"><span class="metodo__marca"></span><span class="metodo__nome">${String(i + 1).padStart(2, '0')} ${e.nome}</span><span class="metodo__frase">${e.frase}</span></li>`).join('')}
        </ol>
      </div>
    </div>
  </section>`
}
