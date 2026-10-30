import '@fontsource/archivo-black/400.css';
import '@fontsource-variable/inter-tight';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/secoes.css';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { hero } from './motion/hero.js';
import { fotos } from './motion/fotos.js';
import { fisica } from './motion/fisica.js';
import { contato } from './motion/contato.js';
import { entradas } from './motion/entradas.js';
import { abertura } from './motion/abertura.js';
import { formulario } from './motion/formulario.js';
import { smoothScroll } from './motion/smooth.js';

gsap.registerPlugin(ScrollTrigger);
history.scrollRestoration = 'manual';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// a nav troca de cor quando passa por cima de uma seção escura
function nav() {
  const el = document.querySelector('.nav');
  document.querySelectorAll('[data-tema]:not(.nav)').forEach((s) => {
    ScrollTrigger.create({
      trigger: s,
      start: 'top 40px',
      end: 'bottom 40px',
      onToggle: (self) => self.isActive && el.classList.toggle('nav--escuro', s.dataset.tema === 'escuro'),
    });
  });
}

async function iniciar() {
  const [caixa, image] = await Promise.all([
    fetch('infla/caixa.json').then((r) => r.json()),
    fetch('infla/cheio.webp').then((r) => r.blob()).then((b) => createImageBitmap(b)),
    document.fonts.load('400 100px "Archivo Black"'),
  ]);

  hero({ section: document.querySelector('.hero'), image, caixa });
  fotos({ section: document.querySelector('.fotos'), reduced });
  fisica({ section: document.querySelector('.servicos'), reduced });
  contato({ section: document.querySelector('.contato'), reduced });
  entradas({ reduced });
  formulario(document.querySelector('.cartao'));
  nav();

  const lenis = reduced ? null : smoothScroll();
  document.querySelectorAll('a[href^="#"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      const alvo = document.querySelector(a.getAttribute('href'));
      if (!alvo) return;
      e.preventDefault();
      lenis ? lenis.scrollTo(alvo, { duration: 1.4 }) : alvo.scrollIntoView();
    }),
  );

  await abertura();
  document.documentElement.classList.remove('intro-on');
  if (!reduced) gsap.from('.entra', { opacity: 0, y: 14, duration: 1, ease: 'expo.out', stagger: 0.06 });
  ScrollTrigger.refresh();
}

iniciar();
