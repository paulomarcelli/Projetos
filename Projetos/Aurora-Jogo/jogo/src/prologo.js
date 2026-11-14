/*
 * Prólogo — A Noite das Lanças (PixiJS 8). Nove anos antes: a Aurora criança, sem armas, no castelo da Casa Selênia.
 * Festa de inverno → as velas se apagam → atravessar o castelo sem ser vista → altar da capela → neve, Bram, título.
 * Dados em fases/prologo.json (verificado em testes/prologo.test.mjs); visão e patrulha em src/furtividade.js.
 * Separado de main.js de propósito: a Fase 1 (adulta, com combate) não muda.
 */
import { Application, Assets, Container, Graphics, Rectangle, Sprite, Text, Texture } from '../vendor/pixi.min.mjs';
import { CONST, criarCorpo, passo } from './fisica.js';
import { nitida } from './aurora_viva.js';
import { normalizar } from './nivel.js';
import { Titulo } from './fase.js';
import { VISAO, atualizarAlerta, atualizarGuarda, criarGuarda, enxerga, linhaDeVisao } from './furtividade.js';
import { CaixaDialogo } from './dialogo.js';

const app = new Application();
await app.init({ resizeTo: window, background: '#0e0b1c', antialias: true, resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true });
document.getElementById('jogo').appendChild(app.canvas);

const fase = normalizar(await (await fetch('fases/prologo.json')).json());
const mundo = fase.solidos;
const P = fase.personagem;                         // { altura_visual, largura, altura, velCorrida, lento }
const CHAO = 640;
const fonte = 'system-ui, sans-serif';
const COR = { pedra: 0x2a2340, pedraClara: 0x352c50, junta: 0x1d1830, madeira: 0x3a2618, ouro: 0xc9a24a, violeta: 0x4b2f7a, prata: 0xd9dcf0 };

// ---------- camadas ----------
const fundo = new Graphics();                       // degradê atrás de tudo
const cena = new Container();                       // mundo (segue a câmera)
const atras = new Container(), meio = new Container(), frente = new Container();
cena.addChild(atras, meio, frente);
const escuro = new Graphics();                      // a noite cai sobre o salão depois que as velas se apagam
const luz = new Container(); luz.blendMode = 'add'; // luzes somadas por cima do escuro (mesma câmera do mundo)
const hud = new Container();
app.stage.addChild(fundo, cena, escuro, luz, hud);

function desenharFundoTela() {
  const W = app.screen.width, H = app.screen.height;
  fundo.clear();
  ['#0e0b1c', '#141026', '#1a1430'].forEach((c, i) => fundo.rect(0, (H * i) / 3, W, H / 3 + 1).fill(c));
}
desenharFundoTela();
window.addEventListener('resize', desenharFundoTela);

// ---------- castelo (desenhado por código, uma vez) ----------
const X0 = -400, X1 = 6400;
const salas = fase.batidas.map((b) => ({ nome: b.trecho, de: b.de, ate: b.ate }));
const janelas = [];
for (let x = 120; x < 5600; x += 560) if (x < 4650 || x > 4800) janelas.push(x);

function desenharCastelo() {
  const g = new Graphics();
  // parede de pedra com juntas desencontradas
  g.rect(X0, -200, X1 - X0, CHAO + 200).fill(COR.pedra);
  for (let y = -200, linha = 0; y < CHAO - 100; y += 44, linha++) {
    g.moveTo(X0, y).lineTo(X1, y).stroke({ width: 2, color: COR.junta, alpha: 0.7 });
    for (let x = X0 + (linha % 2) * 46; x < X1; x += 92) g.moveTo(x, y).lineTo(x, y + 44).stroke({ width: 2, color: COR.junta, alpha: 0.6 });
  }
  // algumas pedras mais claras (variação, para não parecer papel de parede)
  for (let i = 0; i < 260; i++) {
    const x = X0 + ((i * 523) % (X1 - X0)), y = -200 + ((i * 131) % (CHAO - 100 + 200));
    g.rect(x - (x % 92) + 3, y - (y % 44) + 3, 86, 38).fill({ color: COR.pedraClara, alpha: 0.35 });
  }
  // lambri de madeira embaixo
  g.rect(X0, CHAO - 100, X1 - X0, 100).fill(0x2a1c14);
  g.rect(X0, CHAO - 104, X1 - X0, 8).fill(0x4a3424);
  for (let x = X0; x < X1; x += 120) g.rect(x + 10, CHAO - 86, 100, 72).stroke({ width: 2, color: 0x1a110c, alpha: 0.8 });
  // janelas altas em arco, com o luar e a neve lá fora
  for (const x of janelas) {
    const w = 110, topo = 110, base = 430;
    g.rect(x - w / 2 - 14, topo, w + 28, base - topo + 14).fill(0x1a1528);
    g.rect(x - w / 2, topo + w / 2, w, base - topo - w / 2).fill(0x26305a);
    g.circle(x, topo + w / 2, w / 2).fill(0x26305a);
    g.rect(x - w / 2, base - 70, w, 70).fill({ color: 0x3a4a80, alpha: 0.6 });
    for (let k = 0; k < 14; k++) g.circle(x - w / 2 + ((k * 37) % w), topo + 40 + ((k * 61) % (base - topo - 50)), 1.6).fill({ color: 0xffffff, alpha: 0.7 });
    g.rect(x - 3, topo, 6, base - topo).fill(0x1a1528);
    g.rect(x - w / 2, topo + 150, w, 6).fill(0x1a1528);
    g.rect(x - w / 2 - 20, base, w + 40, 16).fill(0x3d3456);
  }
  // estandartes da Casa Selênia: violeta com a lua crescente de prata
  for (let x = 400; x < 5500; x += 560) {
    if (x > 4600 && x < 4800) continue;
    g.rect(x - 4, 150, 8, 12).fill(COR.ouro);
    g.poly([x - 38, 160, x + 38, 160, x + 38, 360, x, 390, x - 38, 360]).fill(COR.violeta);
    g.poly([x - 38, 160, x + 38, 160, x + 38, 170, x - 38, 170]).fill(COR.ouro);
    g.circle(x, 255, 26).fill(COR.prata);
    g.circle(x + 11, 248, 23).fill(COR.violeta);
  }
  // arcos de pedra entre as salas
  for (const s of salas.slice(1)) {
    const x = s.de;
    g.rect(x - 34, 180, 22, CHAO - 180).fill(0x3d3456);
    g.rect(x + 12, 180, 22, CHAO - 180).fill(0x3d3456);
    g.rect(x - 40, 160, 80, 28).fill(0x463c62);
  }
  // capela: rosácea violeta e prata por cima do altar
  const rx = fase.altar.x, ry = 230;
  g.circle(rx, ry, 92).fill(0x1a1528);
  g.circle(rx, ry, 80).fill(0x3b2a6a);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    g.moveTo(rx, ry).lineTo(rx + Math.cos(a) * 80, ry + Math.sin(a) * 80).stroke({ width: 4, color: 0x1a1528 });
    g.circle(rx + Math.cos(a) * 52, ry + Math.sin(a) * 52, 12).fill({ color: k % 2 ? 0x7a62c8 : 0xb7b4e0, alpha: 0.8 });
  }
  g.circle(rx, ry, 24).fill(COR.prata); g.circle(rx + 9, ry - 4, 20).fill(0x3b2a6a);
  return g;
}

function desenharChao() {
  const g = new Graphics();
  for (const s of mundo) {
    if (s.tipo === 'invisivel') continue;
    if (s.umaVia) {
      // galeria de madeira: piso, balaústres e mãos-francesas na parede
      g.rect(s.x, s.y, s.w, s.h).fill(COR.madeira);
      g.rect(s.x, s.y, s.w, 5).fill(0x5a3c26);
      g.rect(s.x, s.y - 56, s.w, 7).fill(0x5a3c26);
      for (let x = s.x + 8; x < s.x + s.w; x += 24) g.rect(x, s.y - 50, 6, 50).fill(0x4a311f);
      for (let x = s.x + 40; x < s.x + s.w; x += 160) g.poly([x, s.y + s.h, x + 14, s.y + s.h, x + 14, s.y + 90, x, s.y + s.h + 4]).fill(0x2e1e13);
      continue;
    }
    if (s.tipo === 'arco') {
      g.rect(s.x - 30, s.y, s.w + 60, s.h).fill(0x463c62);
      g.rect(s.x - 30, s.y + s.h - 14, s.w + 60, 14).fill(0x524774);
      continue;
    }
    if (s.tipo === 'degrau') {
      g.rect(s.x, s.y, s.w, CHAO - s.y).fill(0x463c62);
      g.rect(s.x, s.y, s.w, 5).fill(0x5d5284);
      continue;
    }
    // piso de pedra em lajotas
    g.rect(s.x, s.y, s.w, 460).fill(0x2f2745);
    g.rect(s.x, s.y, s.w, 6).fill(0x51467a);
    for (let x = s.x; x < s.x + s.w; x += 64) g.moveTo(x, s.y + 6).lineTo(x - 10, s.y + 60).stroke({ width: 2, color: 0x1e192e });
    g.moveTo(s.x, s.y + 30).lineTo(s.x + s.w, s.y + 30).stroke({ width: 2, color: 0x1e192e, alpha: 0.7 });
  }
  // tapete do salão da festa
  g.rect(-220, CHAO + 2, 1080, 10).fill({ color: 0x6a2a4a, alpha: 0.9 });
  return g;
}

atras.addChild(desenharCastelo(), desenharChao());

// lustres do salão: acesos durante a festa, apagam com as velas
const lustres = [150, 520].map((x) => ({ x, y: 120 }));
const gLustres = new Graphics();
for (const l of lustres) {
  gLustres.moveTo(l.x, -200).lineTo(l.x, l.y).stroke({ width: 3, color: 0x111 });
  gLustres.ellipse(l.x, l.y + 10, 70, 10).stroke({ width: 5, color: COR.ouro });
  for (let k = -3; k <= 3; k++) gLustres.rect(l.x + k * 20 - 2, l.y - 6, 4, 14).fill(0xf2ead2);
}
atras.addChild(gLustres);

// ---------- mesa, convidados e Elias (a festa) ----------
function pessoa(cor, altura, { saia = false, cabelo = null, cabeca = altura * 0.075 } = {}) {
  const c = new Container(), g = new Graphics();
  const ombro = -altura * 0.78;
  if (saia) g.poly([-28, 0, 28, 0, 12, ombro, -12, ombro]).fill(cor);
  else { g.rect(-14, ombro + 10, 28, -ombro - 50).fill(cor); g.rect(-12, -42, 9, 42).fill(0x1a1424); g.rect(3, -42, 9, 42).fill(0x1a1424); }
  g.roundRect(-16, ombro - 2, 32, 30, 10).fill(cor);
  g.circle(0, ombro - 18, cabeca).fill(0xd8c3b0);
  if (cabelo) g.circle(-2, ombro - 22, cabeca * 1.07).fill(cabelo);
  c.addChild(g);
  return c;
}
const convidados = [];
const coresFesta = [0x5b3a7a, 0x7a3a4a, 0x2f4a6a, 0x6a5a2a, 0x4a2f5a, 0x3a5a4a];
[60, 230, 330, 470, 610, 700].forEach((x, i) => {
  const p = pessoa(coresFesta[i], 200 + (i % 3) * 14, { saia: i % 2 === 0, cabelo: i % 2 ? 0x2a1a12 : 0x5a3a22 });
  p.position.set(x, CHAO); p.scale.x = i % 2 ? -1 : 1;
  meio.addChild(p); convidados.push({ p, fase: i * 1.3 });
});
// Lady Ilaria: cabelo prateado e vestido violeta, perto da mesa
const ilaria = pessoa(0x4b2f7a, 214, { saia: true, cabelo: 0xd9dcf0 });
ilaria.position.set(-60, CHAO); meio.addChild(ilaria); convidados.push({ p: ilaria, fase: 0.4 });
// mesa do banquete
const mesaFesta = new Graphics()
  .rect(380, CHAO - 72, 260, 12).fill(0x5a3c26).rect(392, CHAO - 60, 10, 60).fill(0x3a2618).rect(618, CHAO - 60, 10, 60).fill(0x3a2618)
  .rect(380, CHAO - 76, 260, 6).fill(0xe8e0cc);
meio.addChild(mesaFesta);
// Elias, o irmão: corre na frente com a fita dela
const elias = pessoa(0x2f4a6a, 132, { cabelo: 0x2a1a12 });
const fita = new Graphics().rect(10, -100, 26, 4).fill(0x9b6bff);
elias.addChild(fita);
elias.position.set(260, CHAO); meio.addChild(elias);
let eliasSumiu = false;

// ---------- esconderijos (na frente da menina: ela fica atrás) ----------
const esconderijos = fase.esconderijos.map((e) => {
  const g = new Graphics();
  if (e.tipo === 'cortina') {
    g.rect(e.x - 10, 120, e.w + 20, 10).fill(COR.ouro);
    for (let k = 0; k < 5; k++) g.rect(e.x + k * (e.w / 5), 128, e.w / 5 + 1, CHAO - 128).fill(k % 2 ? 0x5a2340 : 0x6a2a4a);
    g.rect(e.x, CHAO - 26, e.w, 26).fill(0x4a1c34);
  } else if (e.tipo === 'mesa') {
    g.rect(e.x - 10, CHAO - 80, e.w + 20, 10).fill(0x5a3c26);
    g.rect(e.x - 10, CHAO - 72, e.w + 20, 64).fill(0xd8d0bc);
    g.poly([e.x - 10, CHAO - 8, e.x + e.w + 10, CHAO - 8, e.x + e.w + 10, CHAO - 72, e.x - 10, CHAO - 72]).fill({ color: 0xcfc6b0, alpha: 1 });
    g.rect(e.x - 10, CHAO - 74, e.w + 20, 4).fill(0xb9ae94);
  } else if (e.tipo === 'coluna') {
    g.rect(e.x, -200, e.w, CHAO + 200).fill(0x443a62);
    g.rect(e.x + 8, -200, 10, CHAO + 200).fill({ color: 0x5a4f80, alpha: 0.6 });
    g.rect(e.x - 10, CHAO - 30, e.w + 20, 30).fill(0x524774);
  } else {
    // banco da capela
    g.rect(e.x - 10, CHAO - 96, e.w + 20, 70).fill(0x3a2618);
    g.rect(e.x - 10, CHAO - 44, e.w + 20, 10).fill(0x5a3c26);
    g.rect(e.x - 4, CHAO - 34, 8, 34).fill(0x2e1e13); g.rect(e.x + e.w - 4, CHAO - 34, 8, 34).fill(0x2e1e13);
  }
  frente.addChild(g);
  return { ...e, g };
});

// altar da capela
const altar = new Graphics()
  .rect(fase.altar.x - 90, CHAO - 96, 180, 96).fill(0x3d3456)
  .rect(fase.altar.x - 100, CHAO - 104, 200, 12).fill(0x524774)
  .rect(fase.altar.x - 80, CHAO - 92, 160, 50).fill(0xe8e0cc)
  .rect(fase.altar.x - 14, CHAO - 92, 28, 50).fill(0x4b2f7a);
frente.addChild(altar);

// a cena do altar: a mãe ajoelhada e os três homens (aparecem só no fim)
const tableau = new Container(); tableau.visible = false;
{
  const ax = fase.altar.x;
  const mae = pessoa(0x5b3a8a, 130, { saia: true, cabelo: 0xd9dcf0, cabeca: 16 }); mae.scale.x = -1; mae.position.set(ax - 210, CHAO);   // ajoelhada
  const caius = pessoa(0x4a3446, 236, { cabelo: 0x2a2a2a }); caius.scale.x = 1; caius.position.set(ax - 400, CHAO);
  caius.addChild(new Graphics().rect(-16, -150, 32, 6).fill(COR.ouro));                        // faixa dourada do comandante
  const carneiro = pessoa(0x5a5070, 250, {}); carneiro.position.set(ax - 520, CHAO);
  const elmo = new Graphics().circle(0, -214, 19).fill(0x6a6084);
  elmo.moveTo(-14, -228).arc(-22, -220, 11, -Math.PI * 0.3, Math.PI * 1.2, true).stroke({ width: 6, color: 0xc9b89a });
  elmo.moveTo(14, -228).arc(22, -220, 11, Math.PI * 1.3, Math.PI * -0.2).stroke({ width: 6, color: 0xc9b89a });
  carneiro.addChild(elmo);   // elmo com chifres de carneiro   // elmo com chifres de carneiro
  const luvas = pessoa(0x4a4a5c, 228, { cabelo: 0x9a9a9a }); luvas.position.set(ax - 610, CHAO);
  luvas.addChild(new Graphics().circle(-18, -96, 7).fill(0xf4f4f4).circle(18, -96, 7).fill(0xf4f4f4));   // luvas brancas
  tableau.addChild(luvas, carneiro, caius, mae);
}
meio.addChild(tableau);
const luzAltar = new Graphics().circle(fase.altar.x - 300, CHAO - 120, 340).fill({ color: 0xffc46a, alpha: 0.06 })
  .circle(fase.altar.x - 300, CHAO - 120, 180).fill({ color: 0xffd890, alpha: 0.06 });
luzAltar.visible = false; luz.addChild(luzAltar);

// ---------- velas (pontos de retorno) ----------
const velas = fase.velas.map((v) => {
  const g = new Graphics()
    .rect(v.x - 2, CHAO - 76, 4, 76).fill(0x1b1724)
    .rect(v.x - 16, CHAO - 4, 32, 4).fill(0x1b1724)
    .rect(v.x - 12, CHAO - 80, 24, 6).fill(0x2a2433)
    .rect(v.x - 5, CHAO - 108, 10, 28).fill(0xf0e6cc);
  const chama = new Graphics().ellipse(0, 0, 4, 9).fill(0xffd27a).ellipse(0, 2, 2, 5).fill(0xfff4d0);
  chama.position.set(v.x, CHAO - 116);
  meio.addChild(g, chama);
  const brilho = new Graphics().circle(0, 0, 90).fill({ color: 0xffb04a, alpha: 0.10 }).circle(0, 0, 40).fill({ color: 0xffc46a, alpha: 0.14 });
  brilho.position.set(v.x, CHAO - 116);
  luz.addChild(brilho);
  return { ...v, chama, brilho, alcancada: false, flare: 0 };
});

// placas (texto de ajuda pintado na parede)
for (const p of fase.placas) {
  const t = new Text({ text: p.texto, style: { fill: '#d9d2f2', fontSize: 15, fontFamily: fonte, fontWeight: '600' } });
  t.anchor.set(0, 1); t.alpha = 0.9; t.position.set(p.x, p.y - 196);
  t.style.stroke = { color: '#120d26', width: 4 };
  frente.addChild(t);
}

// luar entrando pelas janelas (só aparece no escuro)
const luar = new Graphics();
for (const x of janelas) luar.poly([x - 55, 430, x + 55, 430, x + 160, CHAO, x + 20, CHAO]).fill({ color: 0x8fa6ff, alpha: 0.07 });
luz.addChild(luar);
const brilhoLustres = new Graphics();
for (const l of lustres) brilhoLustres.circle(l.x, l.y + 10, 160).fill({ color: 0xffc46a, alpha: 0.08 }).circle(l.x, l.y + 10, 70).fill({ color: 0xffd890, alpha: 0.12 });
luz.addChild(brilhoLustres);

// ---------- soldados da Lança Dourada ----------
class Soldado {
  constructor(dados) {
    this.dados = dados;
    this.g = criarGuarda(dados);
    this.alerta = 0;
    this.raiz = new Container();
    const corpo = new Graphics();
    // lança (atrás), pernas, armadura, sobreveste dourada, elmo com penacho
    corpo.rect(-24, -290, 5, 270).fill(0x5a3c26);
    corpo.poly([-21.5, -318, -13, -292, -30, -292]).fill(COR.ouro);
    this.pernaA = new Graphics().rect(-7, 0, 14, 104).fill(0x24202e).rect(-9, 92, 20, 12).fill(0x14111a);
    this.pernaB = new Graphics().rect(-7, 0, 14, 104).fill(0x2c2738).rect(-9, 92, 20, 12).fill(0x14111a);
    this.pernaA.position.set(-6, -104); this.pernaB.position.set(6, -104);
    const tronco = new Graphics()
      .poly([-26, -100, 26, -100, 22, -186, -22, -186]).fill(0x3b3550)
      .poly([-16, -100, 16, -100, 14, -170, -14, -170]).fill(COR.ouro)
      .poly([-16, -100, 16, -100, 14, -112, -14, -112]).fill(0x8a6a2a)
      .circle(-24, -182, 12).fill(0x4a4462).circle(24, -182, 12).fill(0x4a4462)
      .circle(0, -208, 18).fill(0x4a4462)
      .rect(2, -212, 18, 5).fill(0x0c0a12)
      .poly([-4, -226, 4, -226, -10, -250, -22, -244]).fill(COR.ouro);
    this.braco = new Graphics().rect(-4, 0, 9, 62).fill(0x3b3550);
    this.braco.position.set(18, -180);
    this.lanterna = new Graphics().moveTo(0, 0).lineTo(0, 10).stroke({ width: 2, color: 0x111 })
      .rect(-7, 10, 14, 18).fill(0x2a2433).rect(-5, 13, 10, 12).fill(0xffd27a);
    this.lanterna.position.set(26, -128);
    this.raiz.addChild(this.pernaB, corpo, tronco, this.pernaA, this.braco, this.lanterna);
    this.marca = new Text({ text: '', style: { fill: '#ffd27a', fontSize: 34, fontFamily: fonte, fontWeight: '800', stroke: { color: '#120d26', width: 5 } } });
    this.marca.anchor.set(0.5, 1);
    this.cone = new Graphics();
    meio.addChild(this.raiz); meio.addChild(this.marca); luz.addChild(this.cone);
    this.visivel = false;
  }
  reiniciar() { Object.assign(this.g, criarGuarda(this.dados)); this.alerta = 0; }
  set visivel(v) { this.raiz.visible = this.marca.visible = this.cone.visible = v; }
  get visivel() { return this.raiz.visible; }
  /** ouviu passos correndo atrás dele: vira e fica olhando */
  ouvir(xMenina) {
    const g = this.g, lado = Math.sign(xMenina - g.x);
    if (lado === g.dir || g.estado === 'olhando') return;
    g.dir = lado; g.estado = 'olhando'; g.relogio = 1.4;
    this.ouviuT = 1.4;
  }
  desenhar(dt) {
    const g = this.g;
    this.raiz.position.set(g.x, g.y);
    this.raiz.scale.x = g.dir;
    const passoAng = g.estado === 'andando' ? Math.sin(g.t * 6.2) * 0.32 : 0;
    this.pernaA.rotation = passoAng; this.pernaB.rotation = -passoAng;
    this.braco.rotation = -0.5 + passoAng * 0.3;
    this.lanterna.rotation = -passoAng * 0.6;
    this.lanterna.position.set(26 + Math.sin(-0.5) * -10, -128);
    this.ouviuT = Math.max(0, (this.ouviuT ?? 0) - dt);
    this.marca.text = this.alerta >= 1 ? '!' : this.alerta > 0.05 || this.ouviuT > 0 ? '?' : '';
    this.marca.style.fill = this.alerta > 0.6 ? '#ff6b6b' : '#ffd27a';
    this.marca.position.set(g.x, g.y - 262 - Math.abs(Math.sin(g.t * 8)) * 4 * Math.min(1, this.alerta * 3));
    // cone da lanterna: o que ele enxerga (e, mais fraco, até onde vê a menina abaixada)
    const ox = g.x, oy = g.y - VISAO.OLHOS, A = VISAO.ABERTURA;
    const cor = mistura(0xffe7a0, 0xff4a4a, Math.min(1, this.alerta * 1.3));
    const pontos = (R) => {
      const p = [ox, oy];
      for (let k = 0; k <= 14; k++) {
        const a = -A + (2 * A * k) / 14;
        p.push(ox + Math.cos(a) * R * g.dir, Math.min(CHAO, oy + Math.sin(a) * R));
      }
      return p;
    };
    this.cone.clear()
      .poly(pontos(VISAO.ALCANCE)).fill({ color: cor, alpha: 0.10 + this.alerta * 0.08 })
      .poly(pontos(VISAO.ALCANCE * VISAO.AGACHADA)).fill({ color: cor, alpha: 0.09 })
      .circle(g.x + 26 * g.dir, g.y - 108, 26).fill({ color: 0xffc46a, alpha: 0.25 });
  }
}
const mistura = (a, b, t) => {
  const c = (s) => [(s >> 16) & 255, (s >> 8) & 255, s & 255];
  const [r1, g1, b1] = c(a), [r2, g2, b2] = c(b);
  return (Math.round(r1 + (r2 - r1) * t) << 16) | (Math.round(g1 + (g2 - g1) * t) << 8) | Math.round(b1 + (b2 - b1) * t);
};
const soldados = fase.guardas.map((d) => new Soldado(d));

// ---------- Aurora criança ----------
const folha = nitida(await Assets.load('assets/sprites/crianca_folha.png'));
const metaC = await (await fetch('assets/sprites/crianca_folha.json')).json();
const anims = {};
for (const [nome, a] of Object.entries(metaC.animacoes)) {
  anims[nome] = { ...a, texturas: a.quadros.map(([x, y, w, h]) => new Texture({ source: folha.source, frame: new Rectangle(x, y, w, h) })) };
}
const menina = new Sprite(anims.parada.texturas[0]);
menina.anchor.set(0.5, metaC.base / metaC.celula);
const ESCALA = P.altura_visual / metaC.altura_em_pe;
meio.addChild(menina);
// ela fica atrás dos esconderijos, mas na frente dos soldados quando não está escondida
meio.setChildIndex(menina, meio.children.length - 1);

let anim = 'parada', tAnim = 0, velAnim = 1;
function tocar(nome, vel = 1) { if (anim !== nome) { anim = nome; tAnim = 0; } velAnim = vel; }
function quadroAtual(dt) {
  const a = anims[anim];
  tAnim += dt * velAnim;
  let i = Math.floor(tAnim * a.fps);
  i = a.loop ? i % a.texturas.length : Math.min(i, a.texturas.length - 1);
  menina.texture = a.texturas[i];
}

const brilhoMenina = new Graphics().circle(0, 0, 120).fill({ color: 0x9fb0ff, alpha: 0.05 }).circle(0, 0, 60).fill({ color: 0xc8d0ff, alpha: 0.05 });
luz.addChild(brilhoMenina);
const corpo = criarCorpo(fase.inicio.x, fase.inicio.y - P.altura, P);
let retorno = { x: corpo.x, y: corpo.y };

// ---------- entrada ----------
const teclas = new Set(), apertou = new Set();
const MAPA = {
  ArrowLeft: 'esquerda', KeyA: 'esquerda', ArrowRight: 'direita', KeyD: 'direita',
  Space: 'pular', ArrowUp: 'pular', KeyW: 'pular', ArrowDown: 'abaixar', KeyS: 'abaixar',
  KeyE: 'continuar', Enter: 'continuar', Tab: 'pularPrologo',
};
window.addEventListener('keydown', (e) => {
  const a = MAPA[e.code]; if (!a) return;
  e.preventDefault();
  if (!teclas.has(a)) apertou.add(a);
  teclas.add(a);
});
window.addEventListener('keyup', (e) => { const a = MAPA[e.code]; if (a) teclas.delete(a); });
window.addEventListener('blur', () => teclas.clear());

// ---------- HUD, diálogo e cenas ----------
const estiloHud = (t, c = '#e8e4ff', p = '600') => ({ fill: c, fontSize: t, fontFamily: fonte, fontWeight: p });
const ajuda = new Text({ text: '← → andar · Espaço pular · segure ↓ andar abaixada · parada num esconderijo, ↓ esconder · Tab pular o prólogo', style: estiloHud(14, '#cfc6f0') });
ajuda.position.set(16, 12);
const objetivo = new Text({ text: '', style: estiloHud(17, '#f4f0ff', '700') });
objetivo.position.set(16, 36);
const situacao = new Text({ text: '', style: { ...estiloHud(15, '#b9a8ff', '700'), letterSpacing: 2 } });
situacao.anchor.set(0.5, 0);
const aviso = new Text({ text: '', style: { ...estiloHud(26, '#f4f0ff', '700'), stroke: { color: '#120d26', width: 6 }, align: 'center' } });
aviso.anchor.set(0.5);
let avisoT = 0;
function avisar(texto, s = 3) { aviso.text = texto; avisoT = s; }
const dica = new Text({ text: '↓  esconder', style: { ...estiloHud(15, '#f4f0ff', '700'), stroke: { color: '#120d26', width: 4 } } });
dica.anchor.set(0.5, 1); dica.visible = false;
frente.addChild(dica);
const veu = new Graphics();                                  // vermelho quando é pega, preto nas transições
const neve = new Container(); neve.visible = false;          // última cena: a menina na neve, o Bram
const tituloFinal = new Text({ text: 'AURORA', style: { ...estiloHud(84, '#f4f0ff', '700'), letterSpacing: 18, stroke: { color: '#120d26', width: 8 } } });
tituloFinal.anchor.set(0.5); tituloFinal.visible = false;
const fimTexto = new Text({ text: 'E  começar a Fase 1 · O Cervo Branco', style: estiloHud(16, '#cfc6f0') });
fimTexto.anchor.set(0.5); fimTexto.visible = false;
const titulo = new Titulo(fase);
const dialogo = new CaixaDialogo();
hud.addChild(ajuda, objetivo, situacao, aviso, veu, neve, tituloFinal, fimTexto, titulo.raiz, dialogo.raiz);

// cena da neve (desenhada na hora, ocupa a tela toda)
const gNeve = new Graphics(), flocos = [];
neve.addChild(gNeve);
for (let i = 0; i < 140; i++) { const f = new Graphics().circle(0, 0, 1 + (i % 3)).fill({ color: 0xffffff, alpha: 0.8 }); neve.addChild(f); flocos.push({ f, x: Math.random(), y: Math.random(), v: 0.04 + Math.random() * 0.08 }); }
function desenharNeve(W, H, t) {
  gNeve.clear();
  ['#2a3050', '#3a4268', '#525c86', '#7a84aa'].forEach((c, i) => gNeve.rect(0, (H * 0.62 * i) / 4, W, H * 0.62 / 4 + 1).fill(c));
  gNeve.rect(0, H * 0.62, W, H * 0.38).fill(0xe6e9f6);
  gNeve.poly([0, H * 0.62, W * 0.3, H * 0.57, W * 0.6, H * 0.63, W, H * 0.58, W, H * 0.66, 0, H * 0.66]).fill(0xd4d8ea);
  for (let i = 0; i < 9; i++) { const x = (i / 8) * W, h = 120 + (i % 3) * 50; gNeve.poly([x, H * 0.62 - h, x + 34, H * 0.62, x - 34, H * 0.62]).fill(0x1e2440); }
  // a menina (pequena, cabelo prateado, cinzas) e o Bram (grande, capa escura) que vem ao encontro dela
  const chega = Math.min(1, t / 4);
  const mx = W * 0.42, bx = W * (0.78 - chega * 0.26), y = H * 0.66;
  gNeve.rect(mx - 9, y - 70, 18, 52).fill(0x5a5466).circle(mx, y - 82, 11).fill(0xd8c3b0).circle(mx - 2, y - 86, 12).fill(0xd9dcf0);
  gNeve.rect(mx - 8, y - 18, 6, 18).fill(0x3a3446).rect(mx + 2, y - 18, 6, 18).fill(0x3a3446);
  gNeve.poly([bx - 30, y, bx + 30, y, bx + 22, y - 150, bx - 22, y - 150]).fill(0x2a2230);
  gNeve.circle(bx, y - 166, 17).fill(0xc9a890).poly([bx - 18, y - 160, bx + 18, y - 160, bx, y - 128]).fill(0x5a4030);
}

// ---------- estados da história ----------
// 'festa' (falas no início) → 'livre' (anda na festa) → 'apagando' → 'furtivo' → 'pega' (volta à vela) → 'final'
let estado = 'festa', tEstado = 0, cenaNeve = false, mostrarTitulo = false, fimPronto = false;
function mudar(e) { estado = e; tEstado = 0; }
let escuridao = 0;                                            // 0 festa iluminada … 1 noite
let ultimoAterrissar = 0, escondida = false, abaixada = false;

setTimeout(() => dialogo.comecar(fase.festa, { aoTerminar: () => { mudar('livre'); objetivo.text = 'Pegue a fita de volta: siga o Elias'; } }), 1600);

function apagar() {
  mudar('apagando');
  avisar(fase.apagar.texto, 3.2);
  objetivo.text = 'Chegue à capela sem ser vista';
}

function serPega(soldado) {
  if (estado !== 'furtivo') return;
  soldado.alerta = 1;
  mudar('pega');
  avisar('Um soldado a viu!', 1.6);
}

function voltarAVela() {
  corpo.x = retorno.x; corpo.y = retorno.y; corpo.vx = corpo.vy = 0; corpo.direcao = 1;
  for (const s of soldados) s.reiniciar();
  mudar('furtivo');
}

function chegarNoAltar() {
  mudar('final');
  objetivo.text = '';
  corpo.vx = 0;
  corpo.x = fase.altar.x - P.largura / 2; corpo.direcao = -1;
  tableau.visible = luzAltar.visible = true;
  for (const s of soldados) s.visivel = false;
  dialogo.comecar(fase.fim, {
    aoMostrar: (f) => {
      if (f.cena === 'neve') { cenaNeve = true; tEstado = 0; }
      if (f.cena === 'titulo') { mostrarTitulo = true; dialogo.oculta = true; }
    },
    aoTerminar: () => {
      fimPronto = true;
      try { localStorage.setItem('aurora_prologo', 'feito'); } catch { /* sem armazenamento */ }
    },
  });
}

function irParaFase1() {
  try { localStorage.setItem('aurora_prologo', 'feito'); } catch { /* sem armazenamento */ }
  location.search = '?fase=1';
}

const sobrepoe = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const esconderijoAqui = () => {
  const cx = corpo.x + P.largura / 2;
  return corpo.noChao ? esconderijos.find((e) => cx >= e.x - 6 && cx <= e.x + e.w + 6) : null;
};

function passoFixo() {
  const dt = CONST.DT;
  tEstado += dt;
  if (apertou.has('pularPrologo')) { apertou.clear(); irParaFase1(); return; }
  if (dialogo.ativa) {
    if (apertou.has('continuar') || apertou.has('pular')) dialogo.avancar();
    apertou.clear();
    passo(corpo, { esquerda: false, direita: false, pular: false, pularSegurado: false }, mundo);
    return;
  }
  if (fimPronto) { if (apertou.has('continuar')) irParaFase1(); apertou.clear(); return; }
  if (estado === 'pega') {
    apertou.clear(); corpo.vx = 0;
    passo(corpo, {}, mundo);
    if (tEstado > 1.7) voltarAVela();
    return;
  }

  const lugar = esconderijoAqui();
  abaixada = teclas.has('abaixar') && corpo.noChao;
  const andando = teclas.has('esquerda') !== teclas.has('direita');
  escondida = estado === 'furtivo' && abaixada && !andando && !!lugar && Math.abs(corpo.vx) < 40;
  const entrada = {
    esquerda: teclas.has('esquerda'), direita: teclas.has('direita'),
    pular: apertou.has('pular'), pularSegurado: teclas.has('pular'),
    esquiva: false, podeSaltoDuplo: false,
    lento: abaixada ? P.lento : 1,
  };
  apertou.clear();
  passo(corpo, entrada, mundo);
  if (corpo.aterrissou) ultimoAterrissar = 0.12;

  const cx = corpo.x + P.largura / 2;
  if (estado === 'livre' && cx >= fase.apagar.x) apagar();
  if (estado === 'apagando' && tEstado > 1.4) { mudar('furtivo'); for (const s of soldados) s.visivel = true; }

  if (estado === 'furtivo') {
    // velas: ao passar por uma, ela vira o ponto de retorno
    for (const v of velas) {
      if (!v.alcancada && cx >= v.x) {
        v.alcancada = true; v.flare = 1;
        retorno = { x: v.x - P.largura / 2 + 30, y: CHAO - P.altura };
        avisar('Uma vela ainda acesa. (ponto de retorno)', 1.8);
      }
    }
    const alvo = { x: corpo.x, y: corpo.y, w: P.largura, h: P.altura, agachada: abaixada, escondida };
    const correndo = !abaixada && corpo.noChao && Math.abs(corpo.vx) > 200;
    for (const s of soldados) {
      atualizarGuarda(s.g, dt);
      const { ox, oy, ax, ay } = linhaDeVisao(s.g, alvo);
      const dist = Math.hypot(ax - ox, ay - oy);
      if (correndo && Math.abs(ax - ox) < 190 && Math.abs(ay - oy) < 160) s.ouvir(ax);
      const visto = enxerga(s.g, alvo, mundo);
      s.alerta = atualizarAlerta(s.alerta, visto, dt, Math.min(1, dist / VISAO.ALCANCE));
      const toque = { x: s.g.x - 18, y: s.g.y - 230, w: 36, h: 230 };
      if (s.alerta >= 1 || (!escondida && sobrepoe(alvo, toque))) { serPega(s); break; }
    }
    if (cx >= fase.altar.x - 40) chegarNoAltar();
  }
}

function escolherAnimacao(dt) {
  if (estado === 'final') return tocar(soldados.length ? 'escondida_medo' : 'escondida');
  if (estado === 'pega') return tocar('escondida_medo');
  if (escondida) {
    const perto = soldados.some((s) => s.visivel && Math.abs(s.g.x - (corpo.x + P.largura / 2)) < 280);
    return tocar(perto ? 'escondida_medo' : 'escondida');
  }
  if (!corpo.noChao) return tocar(corpo.vy < 0 ? 'pulo' : 'queda');
  if (ultimoAterrissar > 0) { ultimoAterrissar -= dt; return tocar('aterrissar'); }
  const v = Math.abs(corpo.vx);
  if (abaixada) return tocar('furtiva', v > 15 ? Math.max(0.5, v / (P.velCorrida * P.lento)) : 0);
  if (v > 30) return tocar('correndo', Math.max(0.55, v / P.velCorrida));
  tocar('parada');
}

// ---------- laço ----------
let acumulado = 0, t = 0;
const camera = { x: corpo.x + 200, y: CHAO - 140 };
app.ticker.add((ticker) => {
  const dt = Math.min(ticker.deltaMS / 1000, 0.1);
  t += dt;
  acumulado += dt;
  while (acumulado >= CONST.DT) { passoFixo(); acumulado -= CONST.DT; }
  const W = app.screen.width, H = app.screen.height;

  escolherAnimacao(dt);
  quadroAtual(dt);
  const cx = corpo.x + P.largura / 2;
  menina.position.set(cx, corpo.y + P.altura);
  const respira = anim === 'parada' ? 1 + Math.sin(t * 2.4) * 0.008 : 1;
  menina.scale.set(ESCALA * corpo.direcao, ESCALA * respira);
  menina.alpha = escondida ? 0.9 : 1;
  brilhoMenina.position.set(cx, corpo.y + P.altura * 0.45); brilhoMenina.alpha = escuridao;
  altar.alpha += ((estado === 'final' ? 0.72 : 1) - altar.alpha) * Math.min(1, dt * 4);
  for (const e of esconderijos) e.g.alpha += (((escondida && esconderijoAqui() === e) ? 0.7 : 1) - e.g.alpha) * Math.min(1, dt * 8);

  // a festa: convidados balançam; o Elias corre na frente com a fita até sumir pela porta
  for (const c of convidados) c.p.rotation = Math.sin(t * 1.8 + c.fase) * 0.04;
  if (!eliasSumiu) {
    const alvoE = estado === 'festa' ? 260 : Math.min(fase.apagar.x + 60, Math.max(elias.x, cx + 190));
    elias.x += (alvoE - elias.x) * Math.min(1, dt * 3);
    elias.rotation = Math.sin(t * 12) * 0.05 * Math.min(1, Math.abs(alvoE - elias.x) / 20);
    if (estado === 'apagando' || estado === 'furtivo') { elias.alpha -= dt * 2; if (elias.alpha <= 0) { eliasSumiu = true; elias.visible = false; } }
  }

  // escuridão: depois do apagar, o salão escurece e os convidados fogem
  const alvoEscuro = estado === 'festa' || estado === 'livre' ? 0 : 1;
  escuridao += (alvoEscuro - escuridao) * Math.min(1, dt * 1.6);
  escuro.clear().rect(0, 0, W, H).fill({ color: 0x05040c, alpha: 0.62 * escuridao });
  gLustres.alpha = 1 - escuridao * 0.6;
  brilhoLustres.alpha = 1 - escuridao;
  luar.alpha = escuridao;
  for (const c of convidados) c.p.alpha = Math.max(0, 1 - escuridao * 1.4);
  mesaFesta.alpha = 1;

  for (const v of velas) {
    v.flare = Math.max(0, v.flare - dt * 1.2);
    const tremula = 1 + Math.sin(t * 13 + v.x) * 0.08 + Math.sin(t * 7.3 + v.x * 0.3) * 0.06;
    v.chama.scale.set(1, tremula * (1 + v.flare * 0.6));
    v.brilho.scale.set(tremula * (1 + v.flare * 0.8));
    v.brilho.alpha = 0.6 + escuridao * 0.4 + v.flare * 0.5;
  }
  for (const s of soldados) s.desenhar(dt);

  // dica de esconderijo (some depois que ela já se escondeu algumas vezes)
  const lugar = esconderijoAqui();
  dica.visible = estado === 'furtivo' && !!lugar && !escondida;
  if (lugar) dica.position.set(lugar.x + lugar.w / 2, CHAO - 170);
  situacao.text = estado !== 'furtivo' ? '' : escondida ? 'ESCONDIDA' : abaixada ? 'ABAIXADA' : '';
  situacao.position.set(W / 2, 14);

  // câmera: segue a menina, olhando um pouco à frente
  const alvoX = estado === 'final' ? fase.altar.x - 280 : cx + corpo.direcao * 110;
  camera.x += (alvoX - camera.x) * Math.min(1, dt * 4);
  camera.y += (Math.min(CHAO - 140, corpo.y + P.altura - 140) - camera.y) * Math.min(1, dt * 3);
  const zoom = Math.max(0.75, Math.min(1.15, H / 760));
  cena.scale.set(zoom); luz.scale.set(zoom);
  const meiaTela = W / 2 / zoom;
  const camX = Math.min(Math.max(camera.x, X0 + 140 + meiaTela), fase.porId.parede_dir.x + 60 - meiaTela);
  cena.position.set(W / 2 - camX * zoom, H * 0.58 - camera.y * zoom);
  luz.position.copyFrom(cena.position);

  // avisos, véu (vermelho ao ser pega), cena da neve e título
  avisoT = Math.max(0, avisoT - dt);
  aviso.alpha = Math.min(1, avisoT * 2); aviso.position.set(W / 2, H * 0.3);
  veu.clear();
  if (estado === 'pega') {
    const a = tEstado < 0.25 ? tEstado * 2 : tEstado > 1.1 ? Math.min(1, (tEstado - 1.1) * 2) : 0.4;
    veu.rect(0, 0, W, H).fill({ color: tEstado > 1.1 ? 0x05040c : 0x7a1020, alpha: a });
  }
  if (estado === 'final') veu.rect(0, 0, W, H).fill({ color: 0x05040c, alpha: Math.min(0.3, tEstado * 0.3) });
  neve.visible = cenaNeve;
  if (cenaNeve) {
    desenharNeve(W, H, tEstado);
    for (const f of flocos) { f.y += f.v * dt; f.x += Math.sin(t + f.v * 40) * 0.0008; if (f.y > 1) f.y -= 1; f.f.position.set(f.x * W, f.y * H); }
  }
  tituloFinal.visible = mostrarTitulo; fimTexto.visible = fimPronto;
  if (mostrarTitulo) {
    veu.rect(0, 0, W, H).fill({ color: 0x05040c, alpha: 0.6 });
    tituloFinal.position.set(W / 2, H * 0.42);
    fimTexto.position.set(W / 2, H * 0.42 + 80);
    fimTexto.alpha = 0.6 + 0.4 * Math.sin(t * 3);
  }
  titulo.atualizar(dt, W, H);
  dialogo.atualizar(dt, W, H);
});

// ganchos para os testes automáticos (Playwright)
window.__jogo = {
  app, corpo, fase, soldados, velas, dialogo, teclas, apertou,
  get estado() { return estado; }, get escondida() { return escondida; }, get abaixada() { return abaixada; },
  get retorno() { return retorno; }, get anim() { return anim; },
  /** leva a menina para x (testes), já no chão */
  irPara(x) { corpo.x = x - P.largura / 2; corpo.y = CHAO - P.altura; corpo.vx = corpo.vy = 0; camera.x = x; },
};
