/*
 * Aurora — protótipo jogável (PixiJS 8).
 * Parada: boneco articulado (src/boneco.js). Em movimento: quadros desenhados (assets/sprites).
 * Física: src/fisica.js (passo fixo de 60 Hz).
 */
import {
  Application, Assets, Container, Graphics, Rectangle, Sprite, Text, Texture,
} from '../vendor/pixi.min.mjs';
import { CONST, criarCorpo, passo } from './fisica.js';
import { carregarAuroraViva } from './aurora_viva.js';
import { Fogueira } from './fogueira.js';
import { Sombra } from './inimigos.js';
import { MenuFogueira, Painel } from './hud.js';
import { QuadrosVivos, Vento } from './vento.js';
import { derivados, desserializar, evoluir, novoProgresso, serializar } from './progresso.js';

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
const vento = new Vento();
app.stage.addChild(fundo, vento.atras, cena, vento.frente);
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

const fogueiras = [new Fogueira('fogueira_1', 250, 640), new Fogueira('fogueira_2', 2700, 640)];
for (const f of fogueiras) cena.addChild(f.raiz);
const sombras = [
  new Sombra(1150, 640, 160, 35), new Sombra(1500, 640, 120, 45),
  new Sombra(2060, 420, 120, 60), new Sombra(2450, 640, 150, 50),
];
for (const s of sombras) cena.addChild(s.raiz);
const aviso = new Text({ text: 'E  descansar', style: { fill: '#efeaff', fontSize: 16, fontFamily: 'system-ui, sans-serif', fontWeight: '600' } });
aviso.anchor.set(0.5, 1);
cena.addChild(aviso);

// ---------- Aurora ----------
// parada: um desenho inteiro deformado por regiões (src/aurora_viva.js)
const boneco = await carregarAuroraViva();
const escalaBoneco = ALTURA_VISUAL / boneco.altura;
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
// animações desenhadas numa malha, para o cabelo seguir o vento e o movimento
const quadros = new QuadrosVivos(animacoes.parada.texturas[0], BASE_CELULA);
const escalaQuadros = ALTURA_VISUAL / ALTURA_QUADRO;
cena.addChild(quadros.raiz);

const texFlecha = await Assets.load('assets/sprites/flecha/flecha_voando.png');
const texFlechaCravada = await Assets.load('assets/sprites/flecha/flecha_cravada.png');
const flechas = [];

// ---------- progresso (salvo no navegador) ----------
const CHAVE_SAVE = 'aurora_save';
let progresso = (() => { try { return desserializar(localStorage.getItem(CHAVE_SAVE) || '') || novoProgresso(); } catch { return novoProgresso(); } })();
function salvar() { try { localStorage.setItem(CHAVE_SAVE, serializar(progresso)); } catch { /* sem armazenamento: segue sem salvar */ } }
let stats = derivados(progresso);
let vida = stats.vidaMax, mana = stats.manaMax, invulneravel = 0, sentada = false;
const CUSTO_SALTO_LUA = 12;
const fogueiraInicial = fogueiras.find((f) => f.id === progresso.fogueira);
const corpo = criarCorpo(fogueiraInicial ? fogueiraInicial.x + 60 : 60, 640 - CONST.ALTURA);
if (fogueiraInicial) fogueiraInicial.acesa = true;
let estado = 'parada', acao = null, tempoAcao = 0, tempoAterrissar = 0, flechaSolta = false, golpeAcertou = false;
const sobrepoe = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const textosFlutuantes = [];
function ganhar(s) {
  progresso = { ...progresso, moedas: progresso.moedas + s.moedas };
  const t = new Text({ text: '+' + s.moedas, style: { fill: '#e8e4ff', fontSize: 18, fontWeight: '700', fontFamily: 'system-ui, sans-serif' } });
  t.anchor.set(0.5); t.position.set(s.x, s.chaoY - 90); cena.addChild(t);
  textosFlutuantes.push({ t, vida: 1.2 });
}

function tocar(nome) {
  if (estado === nome) return;
  estado = nome;
  if (nome === 'boneco') return;
  quadros.tocar(animacoes[nome]);
}

// ---------- entrada ----------
const teclas = new Set();
const apertou = new Set();
const MAPA = {
  ArrowLeft: 'esquerda', KeyA: 'esquerda', ArrowRight: 'direita', KeyD: 'direita',
  Space: 'pular', ArrowUp: 'pular', KeyW: 'pular', ShiftLeft: 'esquiva', KeyC: 'esquiva',
  KeyJ: 'lamina', KeyZ: 'lamina', KeyK: 'arco', KeyX: 'arco', KeyH: 'dano', KeyV: 'vitoria', KeyL: 'lupa',
  KeyE: 'interagir', Digit1: 'evoluir1', Digit2: 'evoluir2', Digit3: 'evoluir3', Digit4: 'evoluir4',
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
  text: '←/→ andar · Espaço pular (2x no ar: Salto da Lua, gasta mana) · Shift esquivar · J lâmina · K arco · E fogueira · L lupa',
  style: { fill: '#e8e4ff', fontSize: 15, fontFamily: 'system-ui, sans-serif' },
});
ajuda.position.set(16, 12);
app.stage.addChild(ajuda);
const painel = new Painel();
const menu = new MenuFogueira();
app.stage.addChild(painel.raiz, menu.raiz);

// ---------- laço do jogo ----------
let acumulado = 0, lupa = false, vxAntes = 0, vyAntes = 0;
const camera = { x: 0, y: 0, zoom: 1 };

function fogueiraPerto() {
  const cx = corpo.x + CONST.LARGURA / 2;
  return fogueiras.find((f) => Math.abs(f.x - cx) < 90 && corpo.noChao);
}

function descansar(f) {
  sentada = true; acao = null;
  corpo.vx = 0; corpo.x = f.x + 62 - CONST.LARGURA / 2; corpo.direcao = -1;  // ao lado do fogo, olhando para ele
  f.acesa = true;
  progresso = { ...progresso, fogueira: f.id };
  stats = derivados(progresso);
  for (const s of sombras) s.reiniciar();     // as criaturas voltam quando ela descansa
  salvar();
  menu.mostrar(progresso, stats, app.screen.width, app.screen.height);
}

function levantar() { sentada = false; menu.esconder(); }

function morrer() {
  const f = fogueiras.find((x) => x.id === progresso.fogueira);
  corpo.x = (f ? f.x + 60 : 60); corpo.y = 640 - CONST.ALTURA; corpo.vx = corpo.vy = 0;
  vida = stats.vidaMax; mana = stats.manaMax; invulneravel = 1.5; acao = null;
  for (const s of sombras) s.reiniciar();
}

function passoFixo() {
  if (sentada) {
    vida = Math.min(stats.vidaMax, vida + stats.vidaMax * CONST.DT * 1.2);
    mana = Math.min(stats.manaMax, mana + stats.manaMax * CONST.DT * 1.2);
    for (let i = 1; i <= 4; i++) {
      if (!apertou.has('evoluir' + i)) continue;
      const chave = ['vigor', 'foco', 'forca', 'precisao'][i - 1];
      const r = evoluir(progresso, chave);
      if (r.ok) { progresso = r.progresso; stats = derivados(progresso); vida = stats.vidaMax; mana = stats.manaMax; salvar(); menu.mensagem = 'Nível ' + progresso.nivel + '!'; }
      else menu.mensagem = 'Moedas insuficientes.';
      menu.mostrar(progresso, stats, app.screen.width, app.screen.height);
    }
    if (apertou.has('interagir')) levantar();
    apertou.clear();
    corpo.vx = 0;
    passo(corpo, { esquerda: false, direita: false, pular: false, pularSegurado: false, esquiva: false }, mundo);
    return;
  }
  if (apertou.has('interagir') && !acao) { const f = fogueiraPerto(); if (f) { apertou.clear(); descansar(f); return; } }
  const entrada = {
    esquerda: teclas.has('esquerda') && !acao, direita: teclas.has('direita') && !acao,
    pular: apertou.has('pular') && !acao, pularSegurado: teclas.has('pular'),
    esquiva: apertou.has('esquiva') && !acao,
    podeSaltoDuplo: mana >= CUSTO_SALTO_LUA,
  };
  if (apertou.has('lupa')) lupa = !lupa;
  if (!acao && corpo.noChao && corpo.esquiva === 0) {
    if (apertou.has('lamina')) { acao = 'ataque_lamina'; tempoAcao = 0.32; golpeAcertou = false; }
    else if (apertou.has('arco')) { acao = 'arco'; tempoAcao = 0.4 + 5 / 12; flechaSolta = false; }
    else if (apertou.has('dano')) { acao = 'dano'; tempoAcao = 0.34; }
    else if (apertou.has('vitoria')) { acao = 'vitoria'; tempoAcao = 2.0; }
  }
  apertou.clear();
  if (acao) corpo.vx *= 0.7;
  passo(corpo, entrada, mundo);
  if (corpo.aterrissou) tempoAterrissar = 0.13;
  if (corpo.pulouNoAr) mana -= CUSTO_SALTO_LUA;
  mana = Math.min(stats.manaMax, mana + 2 * CONST.DT);
  invulneravel = Math.max(0, invulneravel - CONST.DT);

  // golpe de lâmina: acerta na frente dela, uma vez por golpe
  if (acao === 'ataque_lamina' && tempoAcao < 0.22 && tempoAcao > 0.08 && !golpeAcertou) {
    const cx = corpo.x + CONST.LARGURA / 2;
    const area = { x: corpo.direcao > 0 ? cx : cx - 110, y: corpo.y + 20, w: 110, h: CONST.ALTURA - 20 };
    for (const s of sombras) if (s.viva && sobrepoe(area, s.caixa)) { golpeAcertou = true; if (s.ferir(stats.danoLamina, corpo.direcao)) ganhar(s); }
  }
  // toque de criatura: dano e empurrão
  const eu = { x: corpo.x, y: corpo.y, w: CONST.LARGURA, h: CONST.ALTURA };
  if (invulneravel <= 0 && corpo.esquiva === 0) {
    for (const s of sombras) {
      if (!s.viva || !sobrepoe(eu, s.caixa)) continue;
      vida -= 14; invulneravel = 1.0;
      corpo.vx = (corpo.x + CONST.LARGURA / 2 < s.x ? -1 : 1) * 420; corpo.vy = -380;
      acao = 'dano'; tempoAcao = 0.34;
      if (vida <= 0) morrer();
      break;
    }
  }

  const ax = (corpo.vx - vxAntes) / CONST.DT, ay = (corpo.vy - vyAntes) / CONST.DT;
  vxAntes = corpo.vx; vyAntes = corpo.vy;
  boneco.sentir(ax, ay, corpo.direcao);
}

function escolherAnimacao(dt) {
  if (sentada) { tocar('aterrissar'); quadros.parar(0); return; } // provisório até chegarem as poses sentada
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
    quadros.velocidade = Math.max(0.5, Math.abs(corpo.vx) / CONST.VEL_CORRIDA);
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
      const alvo = sombras.find((s) => s.viva && sobrepoe({ x: ponta.x - 4, y: ponta.y - 4, w: 8, h: 8 }, s.caixa));
      if (alvo) { if (alvo.ferir(stats.danoFlecha, Math.sign(f.vx))) ganhar(alvo); f.vida = 0; continue; }
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
  quadros.raiz.visible = !mostrarBoneco;
  boneco.raiz.position.set(pes.x, pes.y);
  boneco.raiz.scale.set(escalaBoneco * corpo.direcao, escalaBoneco);
  quadros.raiz.position.set(pes.x, pes.y);
  quadros.raiz.scale.set(escalaQuadros * corpo.direcao, escalaQuadros);
  // vento e movimento empurram o cabelo (no lado para onde ela olha)
  const ventoLocal = vento.forca * corpo.direcao;
  const corrida = Math.abs(corpo.vx) / CONST.VEL_CORRIDA;
  quadros.atualizar(dt, ventoLocal * 9 - corrida * 7 - (corpo.vy < -100 ? 0 : 0));
  boneco.atualizar(dt, ventoLocal);
  atualizarFlechas(dt);
  const perto = fogueiraPerto();
  for (const f of fogueiras) f.atualizar(dt, f === perto, vento.forca);
  for (const s of sombras) s.atualizar(dt);
  aviso.visible = !!perto && !sentada;
  if (perto) aviso.position.set(perto.x, 640 - 110);
  for (const x of textosFlutuantes) { x.vida -= dt; x.t.y -= 40 * dt; x.t.alpha = Math.max(0, x.vida); }
  for (let i = textosFlutuantes.length - 1; i >= 0; i--) if (textosFlutuantes[i].vida <= 0) { textosFlutuantes[i].t.destroy(); textosFlutuantes.splice(i, 1); }
  painel.atualizar(vida, stats.vidaMax, mana, stats.manaMax, progresso.moedas, progresso.nivel);
  quadros.raiz.alpha = boneco.raiz.alpha = invulneravel > 0 && !sentada ? 0.55 + 0.45 * Math.sin(invulneravel * 40) : 1;

  // câmera: segue com suavidade e olha um pouco para a frente; a lupa aproxima
  const zoomAlvo = lupa ? 2.6 : 1;
  camera.zoom += (zoomAlvo - camera.zoom) * Math.min(1, dt * 6);
  // sentada na fogueira: câmera desloca para a Aurora ficar à esquerda e o menu à direita
  const alvoX = sentada ? pes.x + app.screen.width * 0.22 / camera.zoom : pes.x + corpo.direcao * (lupa ? 0 : 120);
  const alvoY = pes.y - ALTURA_VISUAL * (lupa ? 0.55 : 0.9);
  camera.x += (alvoX - camera.x) * Math.min(1, dt * 5);
  camera.y += (alvoY - camera.y) * Math.min(1, dt * 4);
  cena.scale.set(camera.zoom);
  cena.position.set(app.screen.width / 2 - camera.x * camera.zoom, app.screen.height * 0.55 - camera.y * camera.zoom);
  camada2.x = -camera.x * 0.15 % 360; camada3.x = -camera.x * 0.35 % 340;
  vento.atualizar(dt, app.screen.width, app.screen.height, (camera.x - (camera.xAntes ?? camera.x)) * camera.zoom);
  camera.xAntes = camera.x;
});

// ganchos para os testes automáticos
window.__jogo = {
  vento, quadros,
  corpo, boneco, app, teclas, apertou, sombras, fogueiras,
  get estado() { return estado; }, get sentada() { return sentada; },
  get vida() { return vida; }, get mana() { return mana; }, get progresso() { return progresso; },
  darMoedas(n) { progresso = { ...progresso, moedas: progresso.moedas + n }; },
};
