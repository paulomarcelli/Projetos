import './estudio.css'

// [palavra] = foto pequena no lugar da palavra; {n:palavra} = palavra-âncora da nota n da margem
export const manifesto = 'Sou Paulo, tenho 20 anos e {1:estudo} Análise e Desenvolvimento de Sistemas na FECAP. {2:Atendo} clientes da Europa em três idiomas e construo projetos com [telas]{3::} sites, jogos e [inteligência artificial] que explica de onde vem cada resposta.'

const fotos = {
  'telas': { src: 'trabalhos/t02.webp', pos: '50% 26%', tam: '150%' },
  'inteligência artificial': { src: 'trabalhos/t04.webp', pos: '58% 62%', tam: '190%' },
}
const notas = { 1: 'FECAP · 2º semestre, noturno', 2: 'Apex America, desde jan. 2025', 3: '11 projetos em 2026' }
// as cores dos projetos: F.R.E.Y.A., Iris, LUNA MIND, KFKA, Geometry Heroes, os sites
const cores = ['#c8102e', '#f2c45a', '#8fa4ff', '#2f6feb', '#e63946', '#ff5fa2']

function palavras(texto, base) {
  return texto.split(/(\[[^\]]+\]|\{\d+:[^}]+\}|\s+)/).filter(Boolean).map((p) => {
    if (/^\s+$/.test(p)) return ' '
    const foto = p.match(/^\[(.+)\]$/)
    if (foto) {
      const f = fotos[foto[1]]
      return `<span class="m-palavra"><span class="m-foto" role="img" aria-label="${foto[1]}" style="background-image:url(${base}${f.src});background-position:${f.pos};background-size:${f.tam}"></span></span>`
    }
    const ancora = p.match(/^\{(\d+):(.+)\}$/)
    if (ancora) return `<span class="m-palavra" data-ancora="${ancora[1]}">${ancora[2]}</span>`
    return `<span class="m-palavra">${p}</span>`
  }).join('')
}

export function estudio(base) {
  return `
  <section class="estudio" id="sobre" aria-labelledby="estudio-rotulo">
    <div class="estudio__texto">
      <p class="rotulo" id="estudio-rotulo">Sobre</p>
      <p class="estudio__manifesto">${palavras(manifesto, base)}</p>
      <ul class="estudio__equipe" aria-label="As cores dos projetos">
        ${cores.map((c) => `<li style="background:${c}"></li>`).join('')}
      </ul>
    </div>
    <aside class="estudio__margem" aria-label="Notas">
      <ul>
        ${Object.entries(notas).map(([n, t]) => `<li class="nota" data-nota="${n}"><span class="nota__ponto" aria-hidden="true"></span>${t}</li>`).join('')}
      </ul>
    </aside>
    <svg class="estudio__fios" aria-hidden="true"></svg>
  </section>`
}
