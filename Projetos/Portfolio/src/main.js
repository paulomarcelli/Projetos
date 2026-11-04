import './styles/tokens.css'
import './styles/base.css'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { nav } from './sections/nav.js'
import { hero } from './sections/hero.js'
import { estudio } from './sections/estudio.js'
import { metodo } from './sections/metodo.js'
import { indice } from './sections/indice.js'
import { rodape } from './sections/rodape.js'

import pecas from './data/pecas.json'
import { casos } from './data/casos.js'
import { criarCena } from './motion/cena.js'
import { criarPercurso } from './motion/percurso.js'
import { animarEstudio } from './motion/estudio.js'
import { animarMetodo } from './motion/metodo.js'
import { animarIndice } from './motion/indice.js'
import { animarRodape } from './motion/rodape.js'
import { animarNav } from './motion/nav.js'
import { criarSuave } from './motion/suave.js'

gsap.registerPlugin(ScrollTrigger)

const base = import.meta.env.BASE_URL
const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches

document.querySelector('#app').innerHTML = `
  ${nav()}
  <main>
    ${hero()}
    ${estudio(base)}
    ${metodo(base)}
    ${indice(base)}
  </main>
  ${rodape(base)}`

// 1. os pins, na ordem da página (túnel, depois método)
const secaoHero = document.querySelector('.hero')
const cena = criarCena({ canvas: secaoHero.querySelector('canvas'), pecas, destaques: casos, base, reduzido })
criarPercurso({ secao: secaoHero, cena })
animarEstudio({ secao: document.querySelector('.estudio'), reduzido })
animarMetodo({ secao: document.querySelector('.metodo') })
animarIndice({ secao: document.querySelector('.indice'), reduzido })
animarRodape({ reduzido })
animarNav()

// 2. só então o scroll suave
if (!reduzido) criarSuave()

// 3. as fontes mudam as medidas: recalcula tudo quando carregarem
document.fonts.ready.then(() => ScrollTrigger.refresh())
window.addEventListener('load', () => ScrollTrigger.refresh())
