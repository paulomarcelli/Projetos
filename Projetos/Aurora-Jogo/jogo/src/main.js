/*
 * Aurora — protótipo jogável (PixiJS 8).
 * Parada: boneco articulado (src/boneco.js). Em movimento: quadros desenhados (assets/sprites).
 * Física: src/fisica.js (passo fixo de 60 Hz).
 */
import {
  AnimatedSprite, Application, Assets, Container, Graphics, Rectangle, Sprite, Text, Texture,
} from '../vendor/pixi.min.mjs';
import { CONST, criarCorpo, passo } from './fisica.js';
import { ALTURA_BONECO, carregarBoneco } from './boneco.js';

const ALTURA_VISUAL = 210;                 // altura da Aurora na tela, em px do mundo
const BASE_CELULA = 372;                   // linha dos pés nas células de 384 px
const ALTURA_QUADRO = 314;                 // altura dela (em pé) dentro das células

const app = new Application();
await app.init({ resizeTo: window, background: '#1b1533', antialias: true });
document.getElementById('jogo').appendChild(app.canvas);

// ---------- mundo de teste ----------
const mundo = [
  { x: -400, y: 640, w: 3600, h: 400 },        // chão
  { x: 520, y: 500, w: 260, h: 40 },
  { x: 900, y: 400, w: 200, h: 40 },
  { x: 1240, y: 300, w: 260, h: 40 },
  { x: 1650, y: 480, w: 64, h: 160 },          // pilar
  { x: 1900, y: 420, w: 320, h: 40 },
  { x: -400, y: 0, w: 60, h: 640 },            // parede esquerda
  { x: 3140, y: 0, w: 60, h: 640 },            // parede direita
];

const fundo = new Container();
const camada1 = new Graphics();                 // céu, lua e estrelas (quase parado)
const camada2 = new Graphics();                 // montanhas distantes
const camada3 = new Graphics();                 // árvores
const cena = new Container();                   // mundo jogável (segue a câmera)
app.stage.addChild(fundo, cena);
fundo.addChild(camada1, camada2, camada3);

function desenharFundo() {
  const W = app.screen.width, H = app.screen.height;
  camada1.clear();
  const faixas = ['#120d26', '#1b1533', '#241c45', '#2e2456', '#3a2d66'];
  faixas.forEach((c, i) => camada1.rect(0, (H * i) / faixas.length, W, H / faixas.length + 1).fill(c));
  camada1.circle(W * 0.78, H * 0.2, 70).fill({ color: '#e8e4ff', alpha: 0.12 });
  camada1.circle(W * 0.78, H * 0.2, 46).fill('#f2efff');
  for (let i = 0; i < 90; i++) {
    const x = (i * 197) % W, y = (i * 113) % (H * 0.6);
    camada1.circle(x, y, (i % 3) * 0.6 + 0.6).fill({ color: '#ffffff', alpha: 0.3 + (i % 5) * 0.12 });
  }
  camada2.clear();
  for (let i = -1; i < 12; i++) {
    const x = i * 360;
    camada2.poly([x, H, x + 180, H * 0.45 + (i % 3) * 40, x + 360, H]).fill('#2a2150');
  }
  camada3.clear();
  for (let i = -1; i < 30; i++) {
    const x = i * 170 + (i % 2) * 40, h = 160 + (i % 4) * 40;
    camada3.poly([x, H, x + 50, H - h, x + 100, H]).fill('#1d1840');
  }
}
desenharFundo();
window.addEventListener('resize', desenharFundo);

const chao = new Graphics();
for (const r of mundo) {
  chao.rect(r.x, r.y, r.w, r.h).fill('#3a3157').stroke({ color: '#17112b', width: 3 });
  chao.rect(r.x, r.y, r.w, 10).fill('#6f8f57');                  // musgo no topo
  chao.rect(r.x, r.y + 10, r.w, 4).fill({ color: '#000000', alpha: 0.25 });
  for (let x = r.x + 20; x < r.x + r.w - 10; x += 46) chao.circle(x, r.y + 30 + (x % 3) * 9, 3).fill({ color: '#bfe6ff', alpha: 0.18 });
}
cena.addChild(chao);

// ---------- Aurora ----------
const boneco = await carregarBoneco();
const escalaBoneco = ALTURA_VISUAL / ALTURA_BONECO;
cena.addChild(boneco.raiz);

const folha = await Assets.load('assets/sprites/aurora_folha.png');
const meta = await (await fetch('assets/sprites/aurora_folha.json')).json();
const animacoes = {};
for (const [nome, a] of Object.entries(meta.animacoes)) {
  animacoes[nome] = {
    ...a,
    texturas: a.quadros.map(([x, y, w, h]) => new Texture({ source: folha.source, frame: new Rectangle(x, y, w, h) })),
  };
}
const quadros = new AnimatedSprite(animacoes.parada.texturas);
quadros.anchor.set(0.5, BASE_CELULA / 384);
const escalaQuadros = ALTURA_VISUAL / ALTURA_QUADRO;
cena.addChild(quadros);

const texFlecha = await Assets.load('assets/sprites/flecha/flecha_voando.png');
const texFlechaCravada = await Assets.load('assets/sprites/flecha/flecha_cravada.png');
const flechas = [];

const corpo = criarCorpo(60, 640 - CONST.ALTURA);
let estado = 'parada', acao = null, tempoAcao = 0, tempoAterrissar = 0, flechaSolta = false;

function tocar(nome) {
  if (estado === nome) return;
  estado = nome;
  if (nome === 'boneco') return;
  const a = animacoes[nome];
  quadros.textures = a.texturas;
  quadros.loop = a.loop;
  quadros.animationSpeed = a.fps / 60;
  quadros.gotoAndPlay(0);
}

// ---------- entrada ----------
const teclas = new Set();
const apertou = new Set();
const MAPA = {
  ArrowLeft: 'esquerda', KeyA: 'esquerda', ArrowRight: 'direita', KeyD: 'direita',
  Space: 'pular', ArrowUp: 'pular', KeyW: 'pular', ShiftLeft: 'esquiva', KeyC: 'esquiva',
  KeyJ: 'lamina', KeyZ: 'lamina', KeyK: 'arco', KeyX: 'arco', KeyH: 'dano', KeyV: 'vitoria', KeyL: 'lupa',
};
window.addEventListener('keydown', (e) => {
  const acaoTecla = MAPA[e.code]; if (!acaoTecla) return;
  e.preventDefault();
  if (!teclas.has(acaoTecla)) apertou.add(acaoTecla);
  teclas.add(acaoTecla);
});
window.addEventListener('keyup', (e) => { const a = MAPA[e.code]; if (a) teclas.delete(a); });
window.addEventListener('blur', () => teclas.clear());

// ---------- HUD ----------
const ajuda = new Text({
  text: '←/→ andar · Espaço pular (2x no ar: Salto da Lua) · Shift esquivar · J lâmina · K arco · L lupa · H dano · V vitória',
  style: { fill: '#e8e4ff', fontSize: 15, fontFamily: 'system-ui, sans-serif' },
});
ajuda.position.set(16, 12);
app.stage.addChild(ajuda);

// ---------- laço do jogo ----------
let acumulado = 0, lupa = false, vxAntes = 0, vyAntes = 0;
const camera = { x: 0, y: 0, zoom: 1 };

function passoFixo() {
  const entrada = {
    esquerda: teclas.has('esquerda') && !acao, direita: teclas.has('direita') && !acao,
    pular: apertou.has('pular') && !acao, pularSegurado: teclas.has('pular'),
    esquiva: apertou.has('esquiva') && !acao,
  };
  if (apertou.has('lupa')) lupa = !lupa;
  if (!acao && corpo.noChao && corpo.esquiva === 0) {
    if (apertou.has('lamina')) { acao = 'ataque_lamina'; tempoAcao = 0.32; }
    else if (apertou.has('arco')) { acao = 'arco'; tempoAcao = 0.4 + 5 / 12; flechaSolta = false; }
    else if (apertou.has('dano')) { acao = 'dano'; tempoAcao = 0.34; }
    else if (apertou.has('vitoria')) { acao = 'vitoria'; tempoAcao = 2.0; }
  }
  apertou.clear();
  if (acao) corpo.vx *= 0.7;
  passo(corpo, entrada, mundo);
  if (corpo.aterrissou) tempoAterrissar = 0.13;

  const ax = (corpo.vx - vxAntes) / CONST.DT, ay = (corpo.vy - vyAntes) / CONST.DT;
  vxAntes = corpo.vx; vyAntes = corpo.vy;
  boneco.sentir(ax, ay, corpo.direcao);
}

function escolherAnimacao(dt) {
  if (acao) {
    tempoAcao -= dt;
    if (acao === 'arco') {
      tocar(tempoAcao > 5 / 12 ? 'arco_preparar' : 'arco_atirar');
      if (estado === 'arco_atirar' && quadros.currentFrame >= 3 && !flechaSolta) { flechaSolta = true; atirar(); }
    } else tocar(acao);
    if (tempoAcao <= 0) acao = null;
    return;
  }
  if (corpo.esquiva > 0) return tocar('esquiva');
  if (!corpo.noChao) {
    if (corpo.saltoDuplo && corpo.vy < 200) return tocar('cambalhota');
    return tocar(corpo.vy < 0 ? 'pulo' : 'queda');
  }
  if (tempoAterrissar > 0) { tempoAterrissar -= dt; return tocar('aterrissar'); }
  if (Math.abs(corpo.vx) > 30) {
    tocar('correndo');
    quadros.animationSpeed = (animacoes.correndo.fps / 60) * Math.max(0.5, Math.abs(corpo.vx) / CONST.VEL_CORRIDA);
    return;
  }
  tocar('boneco');
}

function atirar() {
  const s = new Sprite(texFlecha);
  s.anchor.set(0.5);
  const pes = { x: corpo.x + CONST.LARGURA / 2, y: corpo.y + CONST.ALTURA };
  s.position.set(pes.x + corpo.direcao * 70, pes.y - ALTURA_VISUAL * 0.58);
  s.scale.x = corpo.direcao;
  cena.addChild(s);
  flechas.push({ s, vx: corpo.direcao * 1150, vy: -40, vida: 4, cravada: false });
}

function atualizarFlechas(dt) {
  for (const f of flechas) {
    f.vida -= dt;
    if (!f.cravada) {
      f.vy += 380 * dt;
      f.s.x += f.vx * dt; f.s.y += f.vy * dt;
      f.s.rotation = Math.atan2(f.vy, Math.abs(f.vx)) * Math.sign(f.vx);
      const ponta = { x: f.s.x + Math.sign(f.vx) * 70, y: f.s.y };
      if (mundo.some((r) => ponta.x > r.x && ponta.x < r.x + r.w && ponta.y > r.y && ponta.y < r.y + r.h)) {
        f.cravada = true; f.s.texture = texFlechaCravada; f.s.rotation = 0; f.s.scale.x = Math.sign(f.vx) > 0 ? 1 : -1;
      }
    }
    if (f.vida < 0.5) f.s.alpha = Math.max(0, f.vida / 0.5);
  }
  for (let i = flechas.length - 1; i >= 0; i--) if (flechas[i].vida <= 0) { flechas[i].s.destroy(); flechas.splice(i, 1); }
}

app.ticker.add((ticker) => {
  const dt = Math.min(ticker.deltaMS / 1000, 0.1);
  acumulado += dt;
  while (acumulado >= CONST.DT) { passoFixo(); acumulado -= CONST.DT; }

  escolherAnimacao(dt);
  const pes = { x: corpo.x + CONST.LARGURA / 2, y: corpo.y + CONST.ALTURA };
  const mostrarBoneco = estado === 'boneco';
  boneco.raiz.visible = mostrarBoneco;
  quadros.visible = !mostrarBoneco;
  boneco.raiz.position.set(pes.x, pes.y);
  boneco.raiz.scale.set(escalaBoneco * corpo.direcao, escalaBoneco);
  quadros.position.set(pes.x, pes.y);
  quadros.scale.set(escalaQuadros * corpo.direcao, escalaQuadros);
  boneco.atualizar(dt);
  atualizarFlechas(dt);

  // câmera: segue com suavidade e olha um pouco para a frente; a lupa aproxima
  const zoomAlvo = lupa ? 2.6 : 1;
  camera.zoom += (zoomAlvo - camera.zoom) * Math.min(1, dt * 6);
  const alvoX = pes.x + corpo.direcao * (lupa ? 0 : 120);
  const alvoY = pes.y - ALTURA_VISUAL * (lupa ? 0.55 : 0.9);
  camera.x += (alvoX - camera.x) * Math.min(1, dt * 5);
  camera.y += (alvoY - camera.y) * Math.min(1, dt * 4);
  cena.scale.set(camera.zoom);
  cena.position.set(app.screen.width / 2 - camera.x * camera.zoom, app.screen.height * 0.55 - camera.y * camera.zoom);
  camada2.x = -camera.x * 0.15 % 360; camada3.x = -camera.x * 0.35 % 340;
});

// ganchos para os testes automáticos
window.__jogo = { corpo, get estado() { return estado; }, boneco, app, teclas, apertou };
