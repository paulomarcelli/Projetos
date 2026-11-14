/*
 * Aurora — protótipo jogável (PixiJS 8).
 * Parada: desenho inteiro deformado (src/aurora_viva.js). Em movimento: quadros desenhados (assets/sprites).
 * Física: src/fisica.js (passo fixo de 60 Hz).
 */
import {
  Application, Assets, Container, Graphics, Rectangle, Sprite, Text, Texture, TilingSprite,
} from '../vendor/pixi.min.mjs';
import { CONST, criarCorpo, passo } from './fisica.js';
import { carregarAuroraViva, nitida } from './aurora_viva.js';
import { Brilhos, Faiscas, Impacto, NeveNosPes, Numeros, Vinheta } from './efeitos.js';
import { lerPesos } from './pesos.js';
import { Fogueira } from './fogueira.js';
import { carregarSombras, Sombra } from './inimigos.js';
import { MenuFogueira, Painel, carregarHud } from './hud.js';
import { QuadrosVivos, Vento } from './vento.js';
import { normalizar } from './nivel.js';
import { Fauna } from './animais.js';
import { Luz } from './luz.js';
import { Sentar } from './sentar.js';
import { Alvo, CenaFinal, Cervo, Nevoa, Titulo, carregarArteFloresta, criarPlaca, desenharCenario, desenharRastros, desenharTerreno } from './fase.js';
import { derivados, desserializar, evoluir, novoProgresso, serializar } from './progresso.js';

const ALTURA_VISUAL = 210;                 // altura da Aurora na tela, em px do mundo
const BASE_CELULA = 372;                   // linha dos pés nas células de 384 px
const ALTURA_QUADRO = 314;                 // altura dela (em pé) dentro das células

const app = new Application();
// resolução da tela do aparelho (até 2×): em celular e notebook com tela de alta densidade a Aurora fica nítida
await app.init({ resizeTo: window, background: '#1b1533', antialias: true, resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true });
document.getElementById('jogo').appendChild(app.canvas);

// ---------- fase (dados em fases/*.json; verificações em testes/fase1.test.mjs) ----------
const fase = normalizar(await (await fetch('fases/fase1.json')).json());
const mundo = fase.solidos;

// arte pintada (Figma): céu com lua e montanhas, faixa de floresta, terreno, pinheiros, placas, alvos, cervo
const arte = await carregarArteFloresta();
const fundo = new Container();
const camada1 = new Graphics();                 // degradê por baixo de tudo
const camada2 = new Sprite(arte.ceu);           // céu, lua e montanhas: uma imagem só (não repete: a lua é única), quase parada
const camada3 = new TilingSprite({ texture: arte.meio, width: 10, height: 10 });    // floresta ao longe
const cena = new Container();                   // mundo jogável (segue a câmera)
const vento = new Vento({ neve: fase.clima === 'neve' });
const luz = new Luz();   // noite, luz das fogueiras, raios de luar e vinheta
app.stage.addChild(fundo, vento.atras, cena, luz.noite, luz.mundo, vento.frente, luz.raios, luz.vinheta);
fundo.addChild(camada1, camada2, camada3);

const FOLGA_CEU = 420;                           // px que o céu desliza de uma ponta à outra da fase
function desenharFundo() {
  const W = app.screen.width, H = app.screen.height;
  camada1.clear();
  const faixas = ['#120d26', '#1b1533', '#241c45', '#2e2456', '#3a2d66'];
  faixas.forEach((c, i) => camada1.rect(0, (H * i) / faixas.length, W, H / faixas.length + 1).fill(c));
  // céu: cobre a tela e sobra um pouco na largura para deslizar devagar (parallax) sem repetir
  camada2.scale.set(Math.max(H / arte.ceu.height, (W + FOLGA_CEU) / arte.ceu.width));
  // floresta: faixa na parte de baixo da tela, com névoa entre as árvores
  const eMeio = (H * 0.62) / arte.meio.height;
  camada3.width = W; camada3.height = H * 0.62; camada3.y = H * 0.4; camada3.tileScale.set(eMeio);
  camada3.tint = 0xb9bcd8;
}
desenharFundo();
window.addEventListener('resize', desenharFundo);

cena.addChild(desenharCenario(fase), desenharTerreno(fase), desenharRastros(fase));
for (const p of fase.placas ?? []) cena.addChild(criarPlaca(p));
const alvos = (fase.alvos ?? []).map((a) => new Alvo(a.x, a.y));
for (const a of alvos) cena.addChild(a.raiz);
const cervo = fase.cervo ? new Cervo(fase.cervo.x, fase.cervo.y, fase.cervo.direcao) : null;
if (cervo) cena.addChild(cervo.raiz);
const fauna = new Fauna(fase);   // lebres e pássaros que fogem quando ela chega perto
cena.addChild(fauna.raiz);
let fimDaFase = -1;   // segundos desde que o cervo foi abatido (-1 = ainda não)

const fogueiras = fase.fogueiras.map((f) => new Fogueira(f.id, f.x, f.y));
for (const f of fogueiras) { cena.addChild(f.raiz); luz.fogueira(f.x, f.chaoY); }
await carregarSombras();
const sombras = fase.sombras.map((s) => new Sombra(s.x, s.y, s.limite, s.moedas));
for (const s of sombras) cena.addChild(s.raiz);
const aviso = new Text({ text: 'E  descansar', style: { fill: '#efeaff', fontSize: 16, fontFamily: 'system-ui, sans-serif', fontWeight: '600' } });
aviso.anchor.set(0.5, 1);
cena.addChild(aviso);

// ---------- Aurora ----------
// parada: um desenho inteiro deformado por regiões (src/aurora_viva.js)
const boneco = await carregarAuroraViva();
const escalaBoneco = ALTURA_VISUAL / boneco.altura;
cena.addChild(boneco.raiz);

// duas camadas (ferramentas/pesos_cabelo.py): corpo fixo + cabelo que balança (meia resolução), ver QuadrosVivos
const [folhaCorpo, folhaMecha] = await Promise.all(['corpo', 'mecha'].map(async (c) => nitida(await Assets.load(`assets/sprites/aurora_folha_${c}.png`))));
const pesosFolha = await lerPesos('assets/sprites/aurora_folha_cabelo.png');
const meta = await (await fetch('assets/sprites/aurora_folha.json')).json();
const animacoes = {};
const recorte = (fonte, [x, y, w, h], e = 1) => new Texture({ source: fonte.source, frame: new Rectangle(x * e, y * e, w * e, h * e) });
for (const [nome, a] of Object.entries(meta.animacoes)) {
  animacoes[nome] = {
    ...a,
    texturas: a.quadros.map((q) => recorte(folhaCorpo, q)),
    mechas: a.quadros.map((q) => recorte(folhaMecha, q, 0.5)),
  };
}
// (sentar/levantar na fogueira: ver src/sentar.js)
// dano: 3 quadros do Gemini (impacto, cambaleia, recupera); clarão, recuo e faíscas por código
// animações desenhadas numa malha, para o cabelo seguir o vento e o movimento
const quadros = new QuadrosVivos(animacoes.parada.texturas[0], animacoes.parada.mechas[0], BASE_CELULA, pesosFolha, 0.25);
// sentar na fogueira: os desenhos dela (src/sentar.js), com o corpo encostado no chão
const sentar = new Sentar(animacoes, pesosFolha, BASE_CELULA, ALTURA_VISUAL / ALTURA_QUADRO);
cena.addChild(sentar.raiz);
const escalaQuadros = ALTURA_VISUAL / ALTURA_QUADRO;
cena.addChild(quadros.raiz);

const texFlecha = nitida(await Assets.load('assets/sprites/flecha/flecha_voando.png'));
const texFlechaCravada = nitida(await Assets.load('assets/sprites/flecha/flecha_cravada.png'));
// a flecha tem ~45% da altura dela (antes saía com 150 px, 71% da altura: parecia uma lança)
const ESCALA_FLECHA = 0.62;
const PONTA_FLECHA = (texFlecha.width / 2) * ESCALA_FLECHA;

// efeitos de impacto
const faiscas = new Faiscas(), numeros = new Numeros(), vinheta = new Vinheta(), impacto = new Impacto();
cena.addChild(faiscas.raiz, numeros.raiz);
// neve que levanta nos passos, no pulo e na aterrissagem; pegadas no chão (atrás da Aurora)
const neve = new NeveNosPes();
const brilhos = new Brilhos(arte.tex);   // efeitos pintados: corte, impacto, estrela, poeira
const orbeArco = new Sprite(arte.tex.fx_orbe); orbeArco.anchor.set(0.5); orbeArco.blendMode = 'add'; orbeArco.visible = false;
cena.addChildAt(neve.pegadas, 3);
cena.addChild(neve.raiz, brilhos.raiz, orbeArco);
let achatar = 0, passoT = 0, ladoPe = 0;   // achatar > 0: amassa ao pousar; < 0: estica ao pular
const nevoa = new Nevoa(fase);
cena.addChild(nevoa.raiz);
let clarao = 0, recuo = 0;   // clarão vermelho na Aurora e inclinação para trás ao apanhar
const flechas = [];

// ---------- progresso (salvo no navegador) ----------
const CHAVE_SAVE = 'aurora_save';
let progresso = (() => { try { return desserializar(localStorage.getItem(CHAVE_SAVE) || '') || novoProgresso(); } catch { return novoProgresso(); } })();
function salvar() { try { localStorage.setItem(CHAVE_SAVE, serializar(progresso)); } catch { /* sem armazenamento: segue sem salvar */ } }
let stats = derivados(progresso);
let vida = stats.vidaMax, mana = stats.manaMax, invulneravel = 0, sentada = false, levantando = 0;
let indoSentar = null;            // { f, x }: andando até o lugar ao lado da fogueira antes de sentar
let cabeloImpulso = 0;            // empurrão no cabelo (continuação do movimento ao sentar e levantar)
const CUSTO_SALTO_LUA = 12;
const fogueiraInicial = fogueiras.find((f) => f.id === progresso.fogueira);
const corpo = criarCorpo(fogueiraInicial ? fogueiraInicial.x + 60 : fase.inicio.x, (fogueiraInicial ? fogueiraInicial.chaoY : fase.inicio.y) - CONST.ALTURA);
let seguro = { x: corpo.x, y: corpo.y };   // último lugar firme onde ela pisou (volta para cá se cair no abismo)
if (fogueiraInicial) fogueiraInicial.acesa = true;
let estado = 'parada', acao = null, tempoAcao = 0, tempoAterrissar = 0, flechaSolta = false, golpeAcertou = false;
let guarda = 0, corteMostrado = false, carga = 0;   // depois do golpe de lâmina ela fica um instante em guarda (folha H); andar, pular ou golpear cancela
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
  KeyE: 'interagir', Enter: 'interagir', KeyR: 'recomecar', Digit1: 'evoluir1', Digit2: 'evoluir2', Digit3: 'evoluir3', Digit4: 'evoluir4',
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
ajuda.alpha = 0.75;   // dica de controles no pé da tela (o painel de vida fica em cima)
app.stage.addChild(ajuda);
const painel = new Painel(await carregarHud());
const menu = new MenuFogueira();
const titulo = new Titulo(fase);
const cenaFinal = new CenaFinal(fase);
app.stage.addChild(vinheta.g, painel.raiz, menu.raiz, titulo.raiz, cenaFinal.raiz);

// ---------- laço do jogo ----------
let acumulado = 0, lupa = false, vxAntes = 0, vyAntes = 0, escalaTempo = 1, direcaoAntes = 1;
const camera = { x: corpo.x + CONST.LARGURA / 2 + 120, y: corpo.y + CONST.ALTURA - ALTURA_VISUAL * 0.9, zoom: 1 };   // já começa nela

function fogueiraPerto() {
  const cx = corpo.x + CONST.LARGURA / 2;
  return fogueiras.find((f) => Math.abs(f.x - cx) < 90 && Math.abs(f.chaoY - (corpo.y + CONST.ALTURA)) < 4 && corpo.noChao);
}

/** apertou E na fogueira: ela anda até o lugar dela (antes era teletransportada) e só então senta */
function descansar(f) {
  acao = null;
  // senta do lado de onde chegou (não atravessa o fogo); o arco deitado e os joelhos ficam fora da chama
  const lado = corpo.x + CONST.LARGURA / 2 >= f.x ? 1 : -1;
  // do lado esquerdo fica a pedra da lua: ali ela senta mais longe, depois da pedra
  indoSentar = { f, x: f.x + (lado > 0 ? 100 : -165) - CONST.LARGURA / 2, lado };
}

function sentarDeVez(f) {
  corpo.vx = 0; corpo.direcao = -(indoSentar?.lado ?? 1);   // olhando para o fogo
  sentada = true; indoSentar = null;
  f.acesa = true;
  progresso = { ...progresso, fogueira: f.id };
  stats = derivados(progresso);
  for (const s of sombras) s.reiniciar();     // as criaturas voltam quando ela descansa
  salvar();
  menu.mostrar(progresso, stats, app.screen.width, app.screen.height);
}

function levantar() {
  sentada = false; menu.esconder();
  levantando = sentar.duracaoSubir;
  achatar = 0.45;           // antecipação: afunda um pouco antes de empurrar o chão
  sentar.levantar(() => { achatar = -0.5; cabeloImpulso = -9; });   // termina esticando; o cabelo fica para trás
}

function morrer() {
  const f = fogueiras.find((x) => x.id === progresso.fogueira);
  corpo.x = (f ? f.x + 60 : fase.inicio.x); corpo.y = (f ? f.chaoY : fase.inicio.y) - CONST.ALTURA; corpo.vx = corpo.vy = 0;
  seguro = { x: corpo.x, y: corpo.y };
  vida = stats.vidaMax; mana = stats.manaMax; invulneravel = 1.5; acao = null;
  for (const s of sombras) s.reiniciar();
}

function passoFixo() {
  if (cenaFinal.ativa) {
    if (apertou.has('interagir')) cenaFinal.avancar();
    if (apertou.has('recomecar') && cenaFinal.acabou) { progresso = { ...progresso, fogueira: null }; salvar(); location.reload(); }
    apertou.clear();
    return;
  }
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
  if (indoSentar) {
    // anda devagar até o lugar; chegando, para e senta (os controles esperam)
    const falta = indoSentar.x - corpo.x;
    apertou.clear();
    if (Math.abs(falta) < 5 && corpo.noChao) { corpo.x = indoSentar.x; sentarDeVez(indoSentar.f); return; }
    passo(corpo, { esquerda: falta < 0, direita: falta > 0, pular: false, pularSegurado: false, esquiva: false, lento: Math.min(0.5, 0.18 + Math.abs(falta) / 200) }, mundo);
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
    // lâmina: ela avança um passo no golpe (antes golpeava parada, colada na criatura)
    if (apertou.has('lamina')) { acao = 'ataque_lamina'; tempoAcao = 0.36; golpeAcertou = false; corteMostrado = false; corpo.vx = corpo.direcao * 330; }
    else if (apertou.has('arco')) { acao = 'arco'; tempoAcao = 0.4 + 5 / 12; flechaSolta = false; }
    else if (apertou.has('dano')) { acao = 'dano'; tempoAcao = 0.34; }
    else if (apertou.has('vitoria')) { acao = 'vitoria'; tempoAcao = 2.0; }
  }
  apertou.clear();
  if (acao === 'ataque_lamina') corpo.vx *= 0.86;   // o avanço freia aos poucos
  else if (acao) corpo.vx *= 0.7;
  passo(corpo, entrada, mundo);
  if (corpo.noChao && corpo.esquiva === 0) seguro = { x: corpo.x, y: corpo.y };
  if (corpo.y > fase.abismo) {
    // caiu no abismo: perde um pouco de vida e volta para onde pisou por último
    corpo.x = seguro.x; corpo.y = seguro.y; corpo.vx = corpo.vy = 0;
    // volta um pouco para dentro da plataforma (o último pisão costuma ser na beirada, e cairia de novo)
    const base = mundo.find((s) => Math.abs(s.y - (seguro.y + CONST.ALTURA)) < 1 && seguro.x + CONST.LARGURA > s.x && seguro.x < s.x + s.w);
    if (base) corpo.x = Math.min(Math.max(corpo.x, base.x + 30), base.x + base.w - CONST.LARGURA - 30);
    vida -= fase.danoQueda; invulneravel = 1.2; clarao = 1; vinheta.piscar(1);
    numeros.mostrar(corpo.x + CONST.LARGURA / 2, corpo.y - 20, '-' + fase.danoQueda, '#ff6b7d');
    if (vida <= 0) { morrer(); return; }
  }
  if (corpo.aterrissou) tempoAterrissar = 0.13;
  pisarNaNeve();
  if (corpo.pulouNoAr) mana -= CUSTO_SALTO_LUA;
  mana = Math.min(stats.manaMax, mana + 2 * CONST.DT);
  invulneravel = Math.max(0, invulneravel - CONST.DT);

  // golpe de lâmina: acerta na frente dela, uma vez por golpe
  if (acao === 'ataque_lamina' && tempoAcao < 0.2 && !corteMostrado) {
    // o arco de luz da lâmina, na frente dela, na altura do golpe
    corteMostrado = true;
    brilhos.corte(corpo.x + CONST.LARGURA / 2 + corpo.direcao * 78, corpo.y + CONST.ALTURA * 0.48, corpo.direcao);
  }
  if (acao === 'ataque_lamina' && tempoAcao < 0.16 && tempoAcao > 0.02 && !golpeAcertou) {   // acerta na estocada (4º quadro, 0,21 s depois de apertar)
    const cx = corpo.x + CONST.LARGURA / 2;
    // alcance de 140 px na frente (cobre também a criatura encostada nela)
    const area = { x: corpo.direcao > 0 ? cx - 10 : cx - 130, y: corpo.y + 20, w: 140, h: CONST.ALTURA - 20 };
    for (const a of alvos) if (a.inteiro && sobrepoe(area, a.caixa)) { golpeAcertou = true; quebrarAlvo(a, corpo.direcao); }
    if (cervo?.vivo && sobrepoe(area, cervo.caixa)) { golpeAcertou = true; abaterCervo(); }
    for (const s of sombras) {
      if (!s.viva || !sobrepoe(area, s.caixa)) continue;
      golpeAcertou = true;
      acertar(s, stats.danoLamina, corpo.direcao, 0.06, 5);
      corpo.vx = -corpo.direcao * 120;                  // pequeno recuo dela: as duas se afastam
    }
  }
  // toque de criatura: dano e empurrão
  const eu = { x: corpo.x, y: corpo.y, w: CONST.LARGURA, h: CONST.ALTURA };
  if (invulneravel <= 0 && corpo.esquiva === 0) {
    for (const s of sombras) {
      if (!s.viva || !sobrepoe(eu, s.caixaToque)) continue;
      const lado = corpo.x + CONST.LARGURA / 2 < s.x ? -1 : 1;
      vida -= 14; invulneravel = 1.0;
      corpo.vx = lado * 420; corpo.vy = -380;
      acao = 'dano'; tempoAcao = 0.34;
      apanhar(14, corpo.x + CONST.LARGURA / 2 - lado * 18, corpo.y + CONST.ALTURA * 0.42, lado);
      if (vida <= 0) morrer();
      break;
    }
  }

  const ax = (corpo.vx - vxAntes) / CONST.DT, ay = (corpo.vy - vyAntes) / CONST.DT;
  vxAntes = corpo.vx; vyAntes = corpo.vy;
  boneco.sentir(ax, ay, corpo.direcao, CONST.DT);
  // o cabelo sente a inércia do corpo (pulo, queda, pouso, arrancada) e chicoteia quando ela vira
  quadros.empurrar(ax * corpo.direcao, ay, CONST.DT);
  if (corpo.direcao !== direcaoAntes) {
    const f = Math.min(1, 0.35 + Math.abs(corpo.vx) / CONST.VEL_CORRIDA);
    quadros.virar(f); boneco.virar(f);
    direcaoAntes = corpo.direcao;
  }
}

/** detalhes do movimento: neve levantando, pegadas, amassar ao pousar e esticar ao pular */
function pisarNaNeve() {
  const pe = { x: corpo.x + CONST.LARGURA / 2, y: corpo.y + CONST.ALTURA };
  const chao = corpo.noChao ? mundo.find((s) => Math.abs(s.y - pe.y) < 1 && pe.x > s.x && pe.x < s.x + s.w) : null;
  const fofa = chao && (chao.tipo === 'neve' || chao.tipo === 'rocha' || chao.tipo === 'tronco');   // galho tem pouca neve
  if (corpo.aterrissou) {
    const f = Math.min(1, Math.abs(vyAntes) / 950);
    if (fofa) neve.levantar(pe.x, pe.y, 5 + Math.round(9 * f), 0, 0.55 + f * 0.6);
    achatar = 0.35 + f * 0.65;
  }
  if (corpo.pulou) { if (fofa || !chao) neve.levantar(pe.x, pe.y, 6, corpo.direcao, 0.7); achatar = -0.7; }
  if (corpo.pulouNoAr) achatar = -0.5;
  if (corpo.esquiva > 0 && corpo.tick % 3 === 0 && fofa) neve.levantar(pe.x, pe.y, 2, corpo.direcao, 0.65);
  const v = Math.abs(corpo.vx);
  if (corpo.noChao && v > 150 && corpo.esquiva === 0) {
    passoT -= CONST.DT;
    if (passoT <= 0) {
      passoT = 0.3 * (CONST.VEL_CORRIDA / v);           // um passo a cada ~0,3 s na corrida
      ladoPe ^= 1;
      if (fofa) {
        neve.levantar(pe.x - corpo.direcao * 10, pe.y, 2, corpo.direcao, 0.4);
        if (chao.tipo === 'neve') neve.marcar(pe.x - corpo.direcao * 6, pe.y + (ladoPe ? 2 : -1), corpo.direcao);
      }
    }
  } else passoT = 0;
}

function quebrarAlvo(a, dir) {
  if (!a.quebrar()) return;
  const c = a.caixa;
  faiscas.explodir(c.x + c.w / 2, c.y + c.h / 2, 0xe0c27a, 18, dir);
  brilhos.impacto(c.x + c.w / 2, c.y + c.h / 2, 0.45);
  impacto.golpe(0.03, 3);
}

function abaterCervo() {
  if (!cervo.ferir()) return;
  const c = cervo.caixa;
  faiscas.explodir(c.x + c.w / 2, c.y + c.h * 0.4, 0xefe6ff, 14);
  impacto.golpe(0.08, 4);
  fimDaFase = 0;
}

/** golpe que acerta uma criatura: dano, faíscas, número, pausa e tremor */
function acertar(s, dano, dir, pausa, tremor) {
  const c = s.caixa;
  faiscas.explodir(c.x + c.w / 2 - dir * 14, c.y + c.h * 0.45, 0xd9ccff, 12, dir);
  brilhos.impacto(c.x + c.w / 2 - dir * 10, c.y + c.h * 0.45, 0.55);
  numeros.mostrar(c.x + c.w / 2, c.y - 10, String(dano), '#efeaff');
  impacto.golpe(pausa, tremor);
  if (s.ferir(dano, dir)) { ganhar(s); faiscas.explodir(c.x + c.w / 2, c.y + c.h / 2, 0x8f7cff, 22); }
}

/** a Aurora apanha: clarão vermelho, recuo, faíscas, número, vinheta, pausa e tremor */
function apanhar(dano, x, y, lado) {
  clarao = 1; recuo = 1;
  faiscas.explodir(x, y, 0xff5a6e, 16, lado);
  numeros.mostrar(x, y - 70, '-' + dano, '#ff6b7d');
  vinheta.piscar(1);
  impacto.golpe(0.09, 9);
}

function escolherAnimacao(dt) {
  // sentar/levantar: src/sentar.js mostra os quadros no lugar da Aurora
  if (sentada && !sentar.ativo) {
    achatar = 0.3;                                         // antecipação: afunda antes de descer
    sentar.comecar(() => {
      achatar = 0.6; cabeloImpulso = 11;                   // continuação: assenta no chão
      neve.levantar(corpo.x + CONST.LARGURA / 2, corpo.y + CONST.ALTURA, 7, 0, 0.45);
    });
  }
  if (sentar.ativo && sentar.estado !== 'saindo') {
    if (!sentada && (Math.abs(corpo.vx) > 30 || !corpo.noChao)) sentar.parar();   // saiu andando no meio do levantar
    else { estado = 'figma'; return; }
  }
  if (levantando > 0) levantando -= dt;
  if (acao) {
    tempoAcao -= dt;
    if (acao === 'arco') {
      tocar(tempoAcao > 5 / 12 ? 'arco_preparar' : 'arco_atirar');
      carga = Math.min(1, carga + dt * 2.6);
      if (estado === 'arco_atirar' && quadros.currentFrame >= 3 && !flechaSolta) { flechaSolta = true; atirar(); }
    } else tocar(acao);
    if (tempoAcao <= 0) { guarda = acao === 'ataque_lamina' ? 0.45 : 0; acao = null; }
    return;
  }
  if (corpo.esquiva > 0 || !corpo.noChao || Math.abs(corpo.vx) > 30) guarda = 0;
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
  if (guarda > 0) { guarda -= dt; return tocar('lamina_guarda'); }
  tocar('boneco');
}

function atirar() {
  const s = new Sprite(texFlecha);
  s.anchor.set(0.5); s.scale.y = ESCALA_FLECHA;
  const pes = { x: corpo.x + CONST.LARGURA / 2, y: corpo.y + CONST.ALTURA };
  s.position.set(pes.x + corpo.direcao * 70, pes.y - ALTURA_VISUAL * 0.76);   // na altura da flecha do desenho (arco v2: corda no canto da boca)
  s.scale.x = corpo.direcao * ESCALA_FLECHA;
  // rastro de luz atrás da flecha (some quando ela crava ou acerta)
  const rastro = new Sprite(arte.tex.fx_rastro);
  rastro.anchor.set(1, 0.5); rastro.blendMode = 'add'; rastro.alpha = 0.75; rastro.tint = 0xdcd4ff;
  cena.addChild(rastro, s);
  brilhos.estrela(s.x, s.y, 0.5);
  impacto.golpe(0, 2);
  flechas.push({ s, rastro, vx: corpo.direcao * 1150, vy: -40, vida: 4, cravada: false });
}

function atualizarFlechas(dt) {
  for (const f of flechas) {
    f.vida -= dt;
    if (!f.cravada) {
      f.vy += 380 * dt;
      f.s.x += f.vx * dt; f.s.y += f.vy * dt;
      f.s.rotation = Math.atan2(f.vy, Math.abs(f.vx)) * Math.sign(f.vx);
      const ponta = { x: f.s.x + Math.sign(f.vx) * PONTA_FLECHA, y: f.s.y };
      const alvo = sombras.find((s) => s.viva && sobrepoe({ x: ponta.x - 4, y: ponta.y - 4, w: 8, h: 8 }, s.caixa));
      if (alvo) { acertar(alvo, stats.danoFlecha, Math.sign(f.vx), 0.04, 3); f.vida = 0; if (f.rastro) f.rastro.alpha = 0; continue; }
      const pontaCaixa = { x: ponta.x - 4, y: ponta.y - 4, w: 8, h: 8 };
      const palha = alvos.find((a) => a.inteiro && sobrepoe(pontaCaixa, a.caixa));
      if (palha) { quebrarAlvo(palha, Math.sign(f.vx)); f.vida = 0; if (f.rastro) f.rastro.alpha = 0; continue; }
      if (cervo?.vivo && sobrepoe(pontaCaixa, cervo.caixa)) { brilhos.impacto(ponta.x, ponta.y, 0.5); abaterCervo(); f.vida = 0; if (f.rastro) f.rastro.alpha = 0; continue; }
      if (mundo.some((r) => !r.umaVia && ponta.x > r.x && ponta.x < r.x + r.w && ponta.y > r.y && ponta.y < r.y + r.h)) {
        brilhos.poeira(ponta.x, ponta.y, -Math.sign(f.vx)); brilhos.estrela(ponta.x, ponta.y, 0.3);
        f.cravada = true; f.s.texture = texFlechaCravada; f.s.rotation = 0; f.s.scale.set((Math.sign(f.vx) > 0 ? 1 : -1) * ESCALA_FLECHA, ESCALA_FLECHA);
      }
    }
    if (f.vida < 0.5) f.s.alpha = Math.max(0, f.vida / 0.5);
    // rastro: segue a cauda da flecha, alinhado com o voo; some depressa quando ela para
    if (f.rastro) {
      if (!f.cravada) {
        const ang = Math.atan2(f.vy, f.vx);     // direção do voo; o rastro sai da cauda para trás
        f.rastro.position.set(f.s.x - Math.cos(ang) * PONTA_FLECHA * 0.85, f.s.y - Math.sin(ang) * PONTA_FLECHA * 0.85);
        f.rastro.rotation = ang; f.rastro.scale.set(0.42, 0.35);
      }
      if (f.cravada || f.vida <= 0) f.rastro.alpha = Math.max(0, f.rastro.alpha - dt * 6);
    }
  }
  for (let i = flechas.length - 1; i >= 0; i--) if (flechas[i].vida <= 0) { flechas[i].s.destroy(); flechas[i].rastro?.destroy(); flechas.splice(i, 1); }
}

app.ticker.add((ticker) => {
  const dtReal = Math.min(ticker.deltaMS / 1000, 0.1) * escalaTempo;   // escalaTempo < 1: câmera lenta (testes)
  // hit-stop: no impacto o jogo para por um instante (os efeitos continuam)
  const parado = impacto.atualizar(dtReal);
  const dt = parado ? 0 : dtReal;
  acumulado += dt;
  while (acumulado >= CONST.DT) { passoFixo(); acumulado -= CONST.DT; }

  escolherAnimacao(dt);
  const pes = { x: corpo.x + CONST.LARGURA / 2, y: corpo.y + CONST.ALTURA };
  const mostrarBoneco = estado === 'boneco';
  boneco.raiz.visible = mostrarBoneco;
  quadros.raiz.visible = !mostrarBoneco && estado !== 'figma';
  sentar.atualizar(dt, vento.forca * corpo.direcao * 9, Math.abs(vento.forca));   // o vento também mexe o cabelo dela sentada
  boneco.raiz.position.set(pes.x, pes.y);
  // amassa um pouco ao pousar e estica ao pular (volta rápido): dá peso ao movimento
  achatar += (0 - achatar) * Math.min(1, dt * 9);
  // sentada: respira devagar (o peito sobe e o corpo afina um pouco)
  const resp = sentar.estado === 'sentada' ? Math.sin(performance.now() / 1000 * 1.7) * 0.012 : 0;
  const sy = (1 - 0.07 * achatar) * (1 + resp), sx = (1 + 0.05 * achatar) * (1 - resp * 0.35);
  boneco.raiz.scale.set(escalaBoneco * corpo.direcao * sx, escalaBoneco * sy);
  quadros.raiz.position.set(pes.x, pes.y);
  quadros.raiz.scale.set(escalaQuadros * corpo.direcao * sx, escalaQuadros * sy);
  sentar.posicionar(pes.x, pes.y, corpo.direcao, sx, sy);
  // vento e movimento empurram o cabelo (no lado para onde ela olha)
  const ventoLocal = vento.forca * corpo.direcao;
  const corrida = Math.abs(corpo.vx) / CONST.VEL_CORRIDA;
  cabeloImpulso += (0 - cabeloImpulso) * Math.min(1, dt * 2.5);
  quadros.atualizar(dt, ventoLocal * 9 - corrida * 7 + cabeloImpulso, Math.abs(vento.forca));
  boneco.atualizar(dt, ventoLocal);
  atualizarFlechas(dt);
  faiscas.atualizar(dtReal); numeros.atualizar(dtReal); neve.atualizar(dt); brilhos.atualizar(dtReal);
  // luz juntando na flecha enquanto ela puxa a corda (some ao soltar)
  if (acao !== 'arco' || flechaSolta) carga = Math.max(0, carga - dt * 8);
  orbeArco.visible = carga > 0.02;
  if (orbeArco.visible) {
    orbeArco.position.set(pes.x + corpo.direcao * 62, pes.y - ALTURA_VISUAL * 0.76);
    orbeArco.scale.set(0.12 + carga * 0.22 + Math.sin(performance.now() / 60) * 0.01);
    orbeArco.alpha = carga * 0.9; orbeArco.tint = 0xd8d0ff;
  }
  vinheta.atualizar(dtReal, app.screen.width, app.screen.height, vida / stats.vidaMax);
  // clarão vermelho que volta ao normal e recuo (inclina para trás e volta)
  clarao = Math.max(0, clarao - dtReal * 3.2); recuo = Math.max(0, recuo - dtReal * 3.2);
  const tint = clarao > 0 ? (0xff << 16) | (Math.round(255 - 165 * clarao) << 8) | Math.round(255 - 150 * clarao) : 0xffffff;
  // perto da Fogueira Lunar, a luz violeta tremula nela (luz natural)
  const fogoPerto = fogueiras.find((f) => f.acesa && Math.abs(f.x - pes.x) < 280);
  if (clarao <= 0 && fogoPerto) {
    const perto = 1 - Math.abs(fogoPerto.x - pes.x) / 280;
    const tr = 0.5 + 0.3 * Math.sin(performance.now() / 90) + 0.2 * Math.sin(performance.now() / 37);
    const k = perto * (0.10 + 0.07 * tr);
    quadros.tint = sentar.tint = (Math.round(255 - 30 * k * 2) << 16) | (Math.round(255 - 50 * k * 2) << 8) | 255;
  } else quadros.tint = sentar.tint = tint;
  for (const m of boneco.raiz.children) m.tint = tint;
  const inclina = -corpo.direcao * 0.12 * Math.sin(Math.min(1, recuo) * Math.PI) * (estado === 'boneco' ? 0 : 1);
  quadros.raiz.rotation = inclina;
  const perto = fogueiraPerto();
  for (const f of fogueiras) f.atualizar(dt, f === perto, vento.forca);
  for (const s of sombras) s.atualizar(dt);
  for (const a of alvos) a.atualizar(dt);
  cervo?.perceber(pes.x, corpo.vx);
  cervo?.atualizar(dt);
  fauna.atualizar(dt, pes.x, pes.y);
  nevoa.atualizar(dt, vento.forca);
  titulo.atualizar(dtReal, app.screen.width, app.screen.height);
  if (fimDaFase >= 0) { fimDaFase += dtReal; if (fimDaFase > 1.4 && !cenaFinal.ativa) cenaFinal.comecar(); }
  cenaFinal.atualizar(dtReal, app.screen.width, app.screen.height);
  aviso.visible = !!perto && !sentada && !indoSentar;
  if (perto) aviso.position.set(perto.x, perto.chaoY - 150);
  for (const x of textosFlutuantes) { x.vida -= dt; x.t.y -= 40 * dt; x.t.alpha = Math.max(0, x.vida); }
  for (let i = textosFlutuantes.length - 1; i >= 0; i--) if (textosFlutuantes[i].vida <= 0) { textosFlutuantes[i].t.destroy(); textosFlutuantes.splice(i, 1); }
  ajuda.position.set(16, app.screen.height - 26);
  painel.atualizar(vida, stats.vidaMax, mana, stats.manaMax, progresso.moedas, progresso.nivel);
  // invulnerável: pisca devagar (antes piscava rápido e "apagava" a Aurora)
  quadros.raiz.alpha = boneco.raiz.alpha = invulneravel > 0 && !sentada && clarao <= 0 ? 0.72 + 0.28 * Math.cos(invulneravel * 22) : 1;

  // câmera: segue com suavidade e olha um pouco para a frente; a lupa aproxima
  const zoomAlvo = lupa ? 2.6 : 1;
  camera.zoom += (zoomAlvo - camera.zoom) * Math.min(1, dt * 6);
  // sentada na fogueira: câmera desloca para a Aurora ficar à esquerda e o menu à direita
  const alvoX = sentada ? pes.x + app.screen.width * 0.22 / camera.zoom : pes.x + corpo.direcao * (lupa ? 0 : 120);
  const alvoY = pes.y - ALTURA_VISUAL * (lupa ? 0.55 : 0.9);
  camera.x += (alvoX - camera.x) * Math.min(1, dt * 5);
  camera.y += (alvoY - camera.y) * Math.min(1, dt * 4);
  cena.scale.set(camera.zoom);
  cena.position.set(app.screen.width / 2 - camera.x * camera.zoom + impacto.dx, app.screen.height * 0.55 - camera.y * camera.zoom + impacto.dy);
  camada2.x = -FOLGA_CEU * Math.min(1, Math.max(0, (camera.x - fase.inicio.x) / 9000)); camada3.tilePosition.x = -camera.x * 0.22;
  // a lua do céu pintado (fração 0,734 × 0,226 da imagem) é a origem dos raios de luar
  const luaTela = { x: camada2.x + 0.734 * camada2.width, y: 0.226 * camada2.height };
  luz.atualizar(dt, app.screen.width, app.screen.height, cena, luaTela);
  vento.atualizar(dt, app.screen.width, app.screen.height, (camera.x - (camera.xAntes ?? camera.x)) * camera.zoom);
  camera.xAntes = camera.x;
});

// ganchos para os testes automáticos
window.__jogo = {
  vento, quadros, impacto, faiscas,
  corpo, boneco, app, teclas, apertou, sombras, fogueiras, fase, alvos, cervo, cenaFinal, brilhos, fauna,
  set escalaTempo(v) { escalaTempo = v; },
  get estado() { return estado; }, get sentada() { return sentada; }, get indoSentar() { return indoSentar; },
  get vida() { return vida; }, get mana() { return mana; }, get progresso() { return progresso; },
  darMoedas(n) { progresso = { ...progresso, moedas: progresso.moedas + n }; },
};
