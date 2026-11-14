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

// ---------- arte do Prólogo (gerada no Figma, montada por ferramentas/montar_folha_prologo.py) ----------
const X0 = -400;
const folhaP = nitida(await Assets.load('assets/sprites/prologo_folha.png'));
const metaP = await (await fetch('assets/sprites/prologo_folha.json')).json();
const texP = {};
for (const [n, p] of Object.entries(metaP.pecas)) {
  const [x, y, w, h] = p.quadro;
  texP[n] = new Texture({ source: folhaP.source, frame: new Rectangle(x, y, w, h) });
}
/** sprite de uma peça da folha, com a âncora nos pés (x, y = onde os pés tocam o chão) */
function peca(nome, x = 0, y = CHAO, { virar = false } = {}) {
  const s = new Sprite(texP[nome]);
  trocarPeca(s, nome);
  const e = 1 / metaP.resolucao;
  s.scale.set(virar ? -e : e, e); s.position.set(x, y);
  return s;
}
function trocarPeca(s, nome) {
  const p = metaP.pecas[nome];
  s.texture = texP[nome];
  s.anchor.set(p.ancora[0] / p.quadro[2], p.ancora[1] / p.quadro[3]);
}

// fundos pintados: um painel por sala. A linha do chão pintado (linha 730 de 768) fica no chão do jogo.
const FUNDO_CHAO = 730 / 768, ALTURA_PAINEL = 900 / FUNDO_CHAO;
const texFundo = Object.fromEntries(await Promise.all(['castelo_salao_festa', 'castelo_corredor', 'castelo_capela', 'cena_neve_bram']
  .map(async (n) => [n, nitida(await Assets.load(`assets/fundos/${n}.jpg`))])));
const LARGURA_PAINEL = ALTURA_PAINEL * texFundo.castelo_corredor.width / texFundo.castelo_corredor.height;
function painel(nome, x, virar = false) {
  const s = new Sprite(texFundo[nome]);
  const e = ALTURA_PAINEL / s.texture.height;
  s.anchor.set(virar ? 1 : 0, FUNDO_CHAO);
  s.scale.set(virar ? -e : e, e);
  s.position.set(x, CHAO);
  return s;
}
// onde estão as janelas pintadas em cada painel (fração da largura): o luar entra por elas no escuro
const JANELAS = { castelo_salao_festa: [0.17, 0.5, 0.82], castelo_corredor: [0.18, 0.5, 0.75], castelo_capela: [0.16, 0.5, 0.84] };
const paineis = [
  ['castelo_salao_festa', X0, false],
  ['castelo_corredor', X0 + LARGURA_PAINEL, false],
  ['castelo_corredor', X0 + 2 * LARGURA_PAINEL, true],
  ['castelo_capela', fase.altar.x - LARGURA_PAINEL / 2, false],
];
const janelas = [];
for (const [nome, x, virar] of paineis) {
  for (const f of JANELAS[nome]) janelas.push(x + (virar ? 1 - f : f) * LARGURA_PAINEL);
}

function desenharChao(estruturas) {
  const g = new Graphics();
  for (const s of mundo) {
    if (s.tipo === 'invisivel') continue;
    const piso = !s.umaVia && !s.tipo;
    if (piso !== !estruturas) continue;
    if (s.umaVia) {
      // galeria de madeira: piso, balaústres e mãos-francesas na parede
      g.rect(s.x, s.y, s.w, s.h).fill(0x4a2f1c);
      g.rect(s.x, s.y, s.w, 6).fill(0x7a5234);
      g.rect(s.x, s.y + s.h - 4, s.w, 4).fill(0x2a1a10);
      g.rect(s.x, s.y - 58, s.w, 9).fill(0x7a5234);
      g.rect(s.x, s.y - 50, s.w, 2).fill(0x2a1a10);
      for (let x = s.x + 10; x < s.x + s.w - 6; x += 26) g.roundRect(x, s.y - 49, 8, 49, 3).fill(0x5e3d26).rect(x + 2, s.y - 47, 2, 45).fill({ color: 0x8a6244, alpha: 0.7 });
      for (let x = s.x + 40; x < s.x + s.w; x += 160) g.poly([x, s.y + s.h, x + 16, s.y + s.h, x + 16, s.y + 96, x, s.y + s.h + 6]).fill(0x3a2414);
      continue;
    }
    if (s.tipo === 'arco') continue;   // a coluna da emenda da capela já mostra a parede (ela só bloqueia a visão)
    if (s.tipo === 'degrau') {
      g.rect(s.x, s.y, s.w, CHAO - s.y).fill(0x625878);
      g.rect(s.x, s.y, s.w, 6).fill(0x8a80a6);
      for (let y = s.y + 30; y < CHAO; y += 30) g.moveTo(s.x, y).lineTo(s.x + s.w, y).stroke({ width: 2, color: 0x3e3654, alpha: 0.8 });
      continue;
    }
    // piso de pedra abaixo do chão pintado
    g.rect(s.x, s.y + 40, s.w, 420).fill(0x2a2236);
    for (let x = s.x; x < s.x + s.w; x += 96) g.moveTo(x, s.y + 44).lineTo(x - 14, s.y + 120).stroke({ width: 2, color: 0x1c1626, alpha: 0.8 });
  }
  return g;
}

atras.addChild(desenharChao(false));
for (const [nome, x, virar] of paineis) atras.addChild(painel(nome, x, virar));
// colunas de pedra escondem as emendas entre os painéis
for (const x of [X0 + LARGURA_PAINEL, X0 + 2 * LARGURA_PAINEL, fase.altar.x - LARGURA_PAINEL / 2]) {
  const c = peca('coluna', x); c.tint = 0xb8b4c8; atras.addChild(c);
}
// tapete do salão da festa
atras.addChild(new Graphics().rect(-240, CHAO - 2, 1120, 12).fill({ color: 0x7a2a4a, alpha: 0.85 }).rect(-240, CHAO - 2, 1120, 2).fill({ color: COR.ouro, alpha: 0.7 }));
atras.addChild(desenharChao(true));

// ---------- a festa: convidados, mesa e Elias ----------
const convidados = [];
for (const [nome, x, virar] of [['convidada_idosa', 40, false], ['convidado_lorde', 220, true], ['convidada_vinho', 320, false], ['musico', 720, true]]) {
  const p = peca(nome, x, CHAO, { virar }); meio.addChild(p); convidados.push({ p, fase: x * 0.013 });
}
const ilaria = peca('ilaria', -90); meio.addChild(ilaria); convidados.push({ p: ilaria, fase: 0.4 });
const mesaFesta = peca('mesa', 530); mesaFesta.scale.set(mesaFesta.scale.x * 1.15); meio.addChild(mesaFesta);
const elias = peca('elias', 260); meio.addChild(elias);
let eliasSumiu = false;

// ---------- esconderijos (na frente da menina: ela fica atrás) ----------
const esconderijos = fase.esconderijos.map((e) => {
  const g = peca(e.tipo, e.x + e.w / 2);
  frente.addChild(g);
  return { ...e, g };
});

// altar da capela
const altar = peca('altar', fase.altar.x);
frente.addChild(altar);

// a cena do altar: a mãe ajoelhada e os três homens (aparecem só no fim)
const tableau = new Container(); tableau.visible = false;
{
  const ax = fase.altar.x;
  tableau.addChild(
    peca('luvas_brancas', ax - 640, CHAO, { virar: true }),
    peca('carneiro', ax - 530, CHAO, { virar: true }),
    peca('caius', ax - 400, CHAO, { virar: true }),
    peca('ilaria_ajoelhada', ax - 200, CHAO, { virar: true }),
  );
}
meio.addChild(tableau);
const luzAltar = new Graphics().circle(fase.altar.x - 320, CHAO - 120, 360).fill({ color: 0xffc46a, alpha: 0.07 })
  .circle(fase.altar.x - 320, CHAO - 120, 190).fill({ color: 0xffd890, alpha: 0.07 });
luzAltar.visible = false; luz.addChild(luzAltar);

// ---------- velas (pontos de retorno) ----------
const velas = fase.velas.map((v) => {
  meio.addChild(peca('castical', v.x));
  const chama = new Graphics().ellipse(0, 0, 5, 9).fill({ color: 0xffd27a, alpha: 0.5 });
  chama.position.set(v.x, CHAO - 118);
  const brilho = new Graphics().circle(0, 0, 90).fill({ color: 0xffb04a, alpha: 0.10 }).circle(0, 0, 40).fill({ color: 0xffc46a, alpha: 0.14 });
  brilho.position.set(v.x, CHAO - 118);
  luz.addChild(brilho, chama);
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
for (const x of janelas) luar.poly([x - 50, 330, x + 50, 330, x + 170, CHAO, x + 30, CHAO]).fill({ color: 0x8fa6ff, alpha: 0.07 });
luz.addChild(luar);
// os lustres pintados no salão da festa brilham até as velas se apagarem
const brilhoLustres = new Graphics();
for (const f of [0.2, 0.81]) {
  const x = X0 + f * LARGURA_PAINEL;
  brilhoLustres.circle(x, -70, 200).fill({ color: 0xffc46a, alpha: 0.07 }).circle(x, -70, 80).fill({ color: 0xffd890, alpha: 0.10 });
}
luz.addChild(brilhoLustres);

// ---------- soldados da Lança Dourada ----------
const PASSOS = [0, 1, 2, 3, 4, 5, 7];               // quadros da caminhada (o 7º da folha saiu sem a lança)
const OLHAR = [0, 1, 1, 2, 2, 3, 3, 0];              // parado na ponta: ergue a lanterna, olha em volta, olha para trás
class Soldado {
  constructor(dados) {
    this.dados = dados;
    this.g = criarGuarda(dados);
    this.alerta = 0;
    this.spr = peca('soldado_parado_0', dados.x);
    this.marca = new Text({ text: '', style: { fill: '#ffd27a', fontSize: 34, fontFamily: fonte, fontWeight: '800', stroke: { color: '#120d26', width: 5 } } });
    this.marca.anchor.set(0.5, 1);
    this.cone = new Graphics();
    meio.addChild(this.spr, this.marca); luz.addChild(this.cone);
    this.visivel = false;
  }
  reiniciar() { Object.assign(this.g, criarGuarda(this.dados)); this.alerta = 0; this.pegou = false; this.olhando = false; }
  set visivel(v) { this.spr.visible = this.marca.visible = this.cone.visible = v; }
  get visivel() { return this.spr.visible; }
  /** ouviu passos correndo atrás dele: vira e fica olhando */
  ouvir(xMenina) {
    const g = this.g, lado = Math.sign(xMenina - g.x);
    if (lado === g.dir || g.estado === 'olhando') return;
    g.dir = lado; g.estado = 'olhando'; g.relogio = 1.4;
    this.ouviuT = 1.4;
  }
  desenhar(dt) {
    const g = this.g;
    if (g.estado === 'olhando' && !this.olhando) { this.olhando = true; this.duracaoOlhar = Math.max(0.1, g.relogio); }
    if (g.estado !== 'olhando') this.olhando = false;
    let nome;
    if (this.pegou) nome = 'soldado_parado_5';
    else if (this.alerta > 0.45) nome = 'soldado_parado_4';
    else if (g.estado === 'andando') nome = `soldado_andando_${PASSOS[Math.floor(g.t * 7.5) % PASSOS.length]}`;
    else nome = `soldado_parado_${OLHAR[Math.min(OLHAR.length - 1, Math.floor((1 - g.relogio / this.duracaoOlhar) * OLHAR.length))]}`;
    trocarPeca(this.spr, nome);
    const e = 1 / metaP.resolucao;
    this.spr.position.set(g.x, g.y);
    this.spr.scale.set(e * g.dir, e);
    this.ouviuT = Math.max(0, (this.ouviuT ?? 0) - dt);
    this.marca.text = this.alerta >= 1 || this.pegou ? '!' : this.alerta > 0.05 || this.ouviuT > 0 ? '?' : '';
    this.marca.style.fill = this.alerta > 0.6 ? '#ff6b6b' : '#ffd27a';
    this.marca.position.set(g.x, g.y - 300 - Math.abs(Math.sin(g.t * 8)) * 4 * Math.min(1, this.alerta * 3));
    // cone da lanterna: o que ele enxerga (e, mais forte, até onde vê a menina abaixada)
    const ox = g.x + 26 * g.dir, oy = g.y - VISAO.OLHOS, A = VISAO.ABERTURA;
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
      .poly(pontos(VISAO.ALCANCE)).fill({ color: cor, alpha: 0.08 + this.alerta * 0.08 })
      .poly(pontos(VISAO.ALCANCE * VISAO.AGACHADA)).fill({ color: cor, alpha: 0.07 })
      .circle(ox, oy, 30).fill({ color: 0xffc46a, alpha: 0.22 });
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

// cena da neve: a pintura do Figma (a menina coberta de cinzas e o Bram), com flocos caindo por cima
const quadroNeve = new Sprite(texFundo.cena_neve_bram), flocos = [];
quadroNeve.anchor.set(0.5);
neve.addChild(quadroNeve);
for (let i = 0; i < 140; i++) { const f = new Graphics().circle(0, 0, 1 + (i % 3)).fill({ color: 0xffffff, alpha: 0.8 }); neve.addChild(f); flocos.push({ f, x: Math.random(), y: Math.random(), v: 0.04 + Math.random() * 0.08 }); }

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
  soldado.alerta = 1; soldado.pegou = true;
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
  // no esconderijo dela, o objeto fica translúcido; na cena do altar o banco some (ficava na frente dos homens)
  for (const e of esconderijos) e.g.alpha += ((estado === 'final' && e.tipo === 'banco' ? 0 : (escondida && esconderijoAqui() === e) ? 0.7 : 1) - e.g.alpha) * Math.min(1, dt * 8);

  // a festa: convidados balançam; o Elias corre na frente com a fita até sumir pela porta
  for (const c of convidados) { c.p.skew.x = Math.sin(t * 1.6 + c.fase) * 0.025; }
  if (!eliasSumiu) {
    const alvoE = estado === 'festa' ? 260 : Math.min(fase.apagar.x + 60, Math.max(elias.x, cx + 190));
    elias.x += (alvoE - elias.x) * Math.min(1, dt * 3);
    elias.y = CHAO - Math.abs(Math.sin(t * 9)) * 6 * Math.min(1, Math.abs(alvoE - elias.x) / 20);   // pulinhos da corrida
    if (estado === 'apagando' || estado === 'furtivo') { elias.alpha -= dt * 2; if (elias.alpha <= 0) { eliasSumiu = true; elias.visible = false; } }
  }

  // escuridão: depois do apagar, o salão escurece e os convidados fogem
  const alvoEscuro = estado === 'festa' || estado === 'livre' ? 0 : 1;
  escuridao += (alvoEscuro - escuridao) * Math.min(1, dt * 1.6);
  escuro.clear().rect(0, 0, W, H).fill({ color: 0x05040c, alpha: 0.62 * escuridao });
  brilhoLustres.alpha = 1 - escuridao;
  luar.alpha = escuridao;
  for (const c of convidados) c.p.alpha = Math.max(0, 1 - escuridao * 1.4);
  mesaFesta.alpha = 1;

  for (const v of velas) {
    v.flare = Math.max(0, v.flare - dt * 1.2);
    const tremula = 1 + Math.sin(t * 13 + v.x) * 0.08 + Math.sin(t * 7.3 + v.x * 0.3) * 0.06;
    v.chama.scale.set(1, tremula * (1 + v.flare * 0.6)); v.chama.alpha = 0.5 + escuridao * 0.5;
    v.brilho.scale.set(tremula * (1 + v.flare * 0.8));
    v.brilho.alpha = 0.6 + escuridao * 0.4 + v.flare * 0.5;
  }
  for (const s of soldados) if (s.visivel) s.desenhar(dt);

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
    // cobre a tela e aproxima devagar
    const e = Math.max(W / quadroNeve.texture.width, H / quadroNeve.texture.height) * (1.02 + Math.min(0.06, tEstado * 0.006));
    quadroNeve.scale.set(e); quadroNeve.position.set(W / 2, H * 0.5);
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
