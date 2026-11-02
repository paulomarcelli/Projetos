// O site inteiro (fora a tela de carga): o palco 3D, o roteiro de poses, os textos por tempo, os rótulos presos ao 3D,
// o HUD da câmera, o Fotografe, a nav, o contador e o menu. A carga é avisada a cada passo e só então entrega a cena.
import { gsap } from 'gsap';
import Lenis from 'lenis';
import { carga } from './motion/loader.js';
import { createStage } from './three/scene.js';
import { blueprint } from './three/blueprint.js';
import { createTrack } from './motion/track.js';
import { beats } from './motion/beats.js';
import { showLines, hideLines, split } from './motion/split.js';
import { callouts } from './motion/callouts.js';
import { cameraHud } from './motion/hud.js';
import { intro, prepareIntro } from './motion/intro.js';
import { fotografe } from './motion/fotografe.js';
import * as THREE from 'three';

carga.step('app');
const q = new URLSearchParams(location.search);
const hd = q.has('hd');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = () => innerWidth < 760;
const $ = (s) => document.querySelector(s);

await Promise.race([Promise.all([document.fonts.load('800 100px "Archivo Variable"'), document.fonts.load('400 12px "Geist Mono Variable"')]), carga.soft]);
carga.step('fontes');

// ---------- palco e fotos
const stage = createStage({ canvas: $('.stage'), quality: mobile() ? 'low' : 'high', hd });
stage.renderer.domElement.style.opacity = '0';
const FOTOS = [
  ['selfie-azul', 'Selfie com o Galaxy azul'], ['espelho-ultra', 'No espelho, com o Ultra'], ['palco', 'No palco'],
  ['espelho', 'Sorriso no espelho'], ['ligacao', 'Ao telefone, fim de tarde'], ['galaxy-ai', 'Campanha Galaxy AI'],
  ['espelho-evento', 'Selfie no evento'],
];
const photos = await Promise.all(FOTOS.map(([f, alt]) => new Promise((res) => {
  const img = new Image(); img.decoding = 'async';
  img.onload = () => res({ img, alt }); img.onerror = () => res({ img: null, alt });
  img.src = `fotos/${f}.webp`;
}))).then((l) => l.filter((p) => p.img));
const relogio = () => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' }).format(new Date());
stage.phone.screen.set({ img: photos[0]?.img, time: relogio() });
carga.step('cena');

// ---------- roteiro
const sections = { hero: $('.hero'), mergulho: $('.mergulho'), camera: $('.camera'), fotografe: $('.fotografe'), campanha: $('.campanha'), ficha: $('.ficha') };
const track = createTrack({ sections, mobile, reduced });
track.resolve();
Object.assign(stage.pose, track.evaluate(0));
if (!reduced) prepareIntro(stage);
await stage.compile();
carga.step('shaders');
stage.frame(1 / 60);
carga.step('quadro');

// ---------- textos
const heroParts = [...document.querySelectorAll('.hero [data-split]')];
heroParts.forEach(split);
const B = {
  mergulho: beats([
    { el: $('.toque'), a: 0.1, b: 0.31 },
    { el: $('.dentro'), a: 0.4, b: 0.97 },
  ], { reduced }),
  specs: beats([{ el: $('.specsbloco'), a: 0.12, b: 0.31 }], { reduced }),
  camera: beats([{ el: $('.cam'), a: 0.18, b: 0.95 }], { reduced }),
  cameraPe: beats([{ el: $('.camera .pe'), a: 0.22, b: 0.95 }], { reduced }),
  foto: beats([{ el: $('.foto'), a: 0.16, b: 0.97 }], { reduced }),
  camp: beats([{ el: $('.camp'), a: 0.22, b: 0.97 }], { reduced }),
  campPe: beats([{ el: $('.campanha .pe'), a: 0.26, b: 0.97 }], { reduced }),
};
const fichaTitulo = $('.ficha .display'), duvTitulo = $('.duvidas .display');
[fichaTitulo, duvTitulo].forEach(split);
const co = callouts({ root: $('.callouts'), svg: $('.fios'), stage, reduced });
const hud = cameraHud($('.camera'));
const foto = fotografe({ root: $('.fotografe'), stage, photos, mobile, reduced });
const tira = $('.tira'), tiraJanela = $('.tira-janela');
gsap.set(tiraJanela, { autoAlpha: 0 });
const vinheta = $('.vinheta');
const cortina = $('.cortina');
const contador = $('.contador'), contCol = $('.contador__col');
const nav = $('.nav'), pilula = $('.pilula');
const marca = $('.rodape__marca');
gsap.set(marca, { yPercent: 60 });

// ---------- rolagem
const lenis = reduced ? null : new Lenis({ lerp: 0.1, wheelMultiplier: 1, touchMultiplier: 1 });
if (lenis) lenis.stop();
const goTo = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.4 }) : scrollTo(0, y));
document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href').slice(1);
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  fecharMenu();
  const p = a.dataset.p ? parseFloat(a.dataset.p) : null;
  if (id === 'topo') goTo(0);
  else if (p != null && track.ranges[id]) goTo(track.at(id, p));
  else if (track.ranges[id] && id !== 'ficha') goTo(track.at(id, 0.2));
  else goTo(el.getBoundingClientRect().top + scrollY);
}));

// ---------- menu
const menu = $('.menu');
function abrirMenu() { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('is-on')); lenis?.stop(); document.querySelectorAll('.menu-abre').forEach((b) => b.setAttribute('aria-expanded', 'true')); menu.querySelector('a').focus(); }
function fecharMenu() { if (menu.hidden) return; menu.classList.remove('is-on'); lenis?.start(); setTimeout(() => (menu.hidden = true), 700); document.querySelectorAll('.menu-abre').forEach((b) => b.setAttribute('aria-expanded', 'false')); }
document.querySelectorAll('.menu-abre').forEach((b) => b.addEventListener('click', abrirMenu));
$('.menu__fecha').addEventListener('click', fecharMenu);
addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharMenu(); });

// ---------- relógio
const setRelogio = () => document.querySelectorAll('.relogio').forEach((el) => (el.textContent = relogio()));
setRelogio(); setInterval(setRelogio, 15000);

// ---------- cursor: inclina o aparelho de leve (só depois da abertura)
let revealed = false;
addEventListener('pointermove', (e) => {
  if (!revealed || reduced) return;
  stage.setTilt(((e.clientY / innerHeight) - 0.5) * 0.18, ((e.clientX / innerWidth) - 0.5) * 0.3);
});

// ---------- laço
let lastY = 0, heroOn = false, navMode = 'cheia', contN = 0, tiraOn = false, fichaOn = false, duvOn = false, marcaOn = false;
const lens = new THREE.Vector3(), sp = { x: 0, y: 0 };
function setHero(on, dir) {
  if (on === heroOn) return; heroOn = on;
  heroParts.forEach((p, k) => (on ? showLines(p, { dir: -1, delay: k * 0.05, instant: reduced, duration: 0.9 }) : hideLines(p, { dir: 1, duration: 0.4, instant: reduced })));
  void dir;
}
function update(dt) {
  const y = lenis ? lenis.scroll : scrollY;
  const dir = y >= lastY ? 1 : -1;
  const pose = track.evaluate(y);
  for (const k in pose) if (k in stage.pose) stage.pose[k] = pose[k];
  stage.setScrollShift(pose.shift);

  if (revealed) setHero(y < 2, dir);
  const pm = track.progress('mergulho', y), pc = track.progress('camera', y), pf = track.progress('fotografe', y), pk = track.progress('campanha', y);
  B.mergulho.update(pm, dir); B.specs.update(pm, dir);
  co.set(pm, dir, [[0.5, 0.97], [0.56, 0.97], [0.62, 0.97], [0.68, 0.97]]);
  co.update();
  B.camera.update(pc, dir); B.cameraPe.update(pc, dir);
  hud(Math.min(1, Math.max(0, (pc - 0.34) / 0.56)));
  B.foto.update(pf, dir);
  foto.set(pf > 0.18 && pf < 0.98);
  foto.tick(performance.now());
  B.camp.update(pk, dir); B.campPe.update(pk, dir);
  const tOn = pk > 0.26 && pk < 0.97;
  if (tOn !== tiraOn) { tiraOn = tOn; gsap.to(tiraJanela, { autoAlpha: tOn ? 1 : 0, y: tOn ? 0 : 30 * dir, duration: tOn ? 1 : 0.4, ease: tOn ? 'expo.out' : 'power3.in', overwrite: true }); }
  gsap.set(tira, { x: -Math.min(1, Math.max(0, (pk - 0.26) / 0.7)) * Math.max(0, tira.scrollWidth - tiraJanela.clientWidth) });

  // vinheta da câmera: foco na lente principal
  vinheta.style.opacity = String(pose.focus);
  if (pose.focus > 0.01) {
    stage.phone.anchorWorld('lente', lens); stage.project(lens, sp);
    vinheta.style.setProperty('--vx', `${sp.x}px`); vinheta.style.setProperty('--vy', `${sp.y}px`);
  }

  // ficha: a cortina sobe com o topo da seção; o título entra por tempo
  const fr = sections.ficha.getBoundingClientRect();
  cortina.style.transform = `translateY(${Math.max(0, fr.top)}px)`;
  const fOn = fr.top < innerHeight * 0.55 && fr.bottom > innerHeight * 0.2;
  if (fOn !== fichaOn) { fichaOn = fOn; fOn ? showLines(fichaTitulo, { dir, instant: reduced }) : hideLines(fichaTitulo, { dir, instant: reduced }); }
  const dr = $('.duvidas').getBoundingClientRect();
  const dOn = dr.top < innerHeight * 0.7 && dr.bottom > 0;
  if (dOn !== duvOn) { duvOn = dOn; dOn ? showLines(duvTitulo, { dir, instant: reduced }) : hideLines(duvTitulo, { dir, instant: reduced }); }
  stage.setVisible(dr.top > 0);
  const mr = marca.getBoundingClientRect();
  const mOn = mr.top < innerHeight;
  if (mOn !== marcaOn) { marcaOn = mOn; gsap.to(marca, { yPercent: mOn ? 0 : 60, duration: reduced ? 0 : mOn ? 1.2 : 0.4, ease: mOn ? 'expo.out' : 'power3.in', overwrite: true }); }

  // nav cheia no hero; depois a pílula, que some ao descer e volta ao subir
  const past = y > innerHeight * 0.5;
  const mode = !past ? 'cheia' : dir > 0 ? 'nada' : 'pilula';
  if (Math.abs(y - lastY) > 2 || !past) {
    if (mode !== navMode) {
      navMode = mode;
      gsap.to(nav, { yPercent: mode === 'cheia' ? 0 : -110, autoAlpha: mode === 'cheia' ? 1 : 0, duration: reduced ? 0 : 0.5, ease: mode === 'cheia' ? 'expo.out' : 'power3.in', overwrite: true });
      pilula.classList.toggle('is-on', mode === 'pilula');
      pilula.querySelectorAll('a,button').forEach((x) => (x.tabIndex = mode === 'pilula' ? 0 : -1));
      pilula.setAttribute('aria-hidden', mode === 'pilula' ? 'false' : 'true');
    }
  }

  // contador de seção 01–08
  let n = 1;
  if (y >= track.ranges.mergulho[0] - innerHeight * 0.5) n = pm < 0.36 ? 2 : 3;
  if (y >= track.ranges.camera[0]) n = 4;
  if (y >= track.ranges.fotografe[0]) n = 5;
  if (y >= track.ranges.campanha[0]) n = 6;
  if (fr.top < innerHeight * 0.5) n = 7;
  if (dr.top < innerHeight * 0.5) n = 8;
  if (n !== contN) { contN = n; contCol.style.transform = `translateY(${-(n - 1) * 32}px)`; }
  contador.classList.toggle('is-off', mr.top < innerHeight);

  lastY = y;
  stage.frame(dt);
}
gsap.ticker.add((t, dtMs) => { if (lenis) lenis.raf(t * 1000); update(Math.min(0.05, dtMs / 1000)); });
gsap.ticker.lagSmoothing(0);
addEventListener('resize', () => { stage.resize(); track.resolve(); stage.invalidate(); });
new ResizeObserver(() => track.resolve()).observe(document.body);

// ---------- entrega: a planta deita até o hero e as camadas caem
await carga.ready;
const reveal = () => {
  revealed = true;
  lenis?.start();
  setHero(true, 1);
  gsap.from(nav, { yPercent: -100, autoAlpha: 0, duration: reduced ? 0 : 1, ease: 'expo.out' });
  gsap.from([contador], { autoAlpha: 0, duration: reduced ? 0 : 0.8, delay: 0.2 });
};
if (reduced || document.documentElement.classList.contains('no-intro')) {
  stage.renderer.domElement.style.opacity = '1';
  if (reduced) await carga.dissolve(0.5);
  intro({ el: $('.intro'), stage, reduced: true, onReveal: () => {} });
  reveal();
} else {
  await carga.handoff(blueprint(stage, carga.plan));
  intro({ el: $('.intro'), stage, reduced, onReveal: reveal, delay: 0, lead: 0.05, fade: 0.6 });
  carga.fade(0.5);
}
