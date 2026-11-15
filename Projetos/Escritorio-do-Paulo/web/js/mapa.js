// O mapa do escritório: visto de cima, em pixel art desenhada por código (nenhuma imagem pronta), com a equipe em
// bonequinhos de pixel art (sprites.js) que andam pelos corredores, sentam e se divertem.
// Ambientes: sala da equipe (mesas em ilhas), lounge (sofá e estante), sala de reunião, sala de jogos (pingue-pongue,
// videogame e fliperama), estúdio (mais mesas), copa (café, geladeira, água e mesa de lanche) e o jardim.
// O que cada um faz sai do estado real:
//   disponível ou concluído          → se diverte: pingue-pongue em dupla, videogame, fliperama, sofá, estante,
//                                      café, lanche, jardim; visita a mesa de um colega; volta à própria mesa às vezes
//   acabou de entregar uma tarefa    → antes, leva a entrega até a mesa de quem continua o trabalho
//   trabalhando, pensando, pesquisando, em revisão, aguardando, com erro
//                                    → volta andando (mais rápido) para a própria mesa e senta; monitor aceso
//   coordenador montando um plano    → vai para a sala de reunião
//   agente sem mesa (do 13º em diante) → mora na copa
// Ninguém aparece trabalhando sem uma execução real: se divertir é só de quem está livre.
import { ROTULOS, ICONES, ESTADOS_ATIVOS } from './telas.js';
import { desenharBoneco, ALTURA_SPRITE } from './sprites.js';

export const LARGURA = 480;
export const ALTURA = 272;
const PASSEIO = 26; // pixels do mapa por segundo, andando à toa
const PRESSA = 70; // indo trabalhar

const COR_ESTADO = {
  disponivel: '#7f8a9c', trabalhando: '#4c9aff', pensando: '#b39dff', pesquisando: '#35c9c0',
  aguardando: '#f2b544', revisao: '#ff8f5a', concluido: '#4cc38a', erro: '#ff5d5d',
};

// ---------- salas ----------
const SALAS = {
  equipe: { x: 6, y: 10, w: 192, h: 110, nome: 'Equipe', porta: [92, 110] },
  lounge: { x: 204, y: 10, w: 96, h: 110, nome: 'Lounge', porta: [244, 260] },
  reuniao: { x: 306, y: 10, w: 104, h: 110, nome: 'Reunião', porta: [350, 366] },
  jogos: { x: 6, y: 134, w: 192, h: 132, nome: 'Jogos', porta: [92, 110], embaixo: true },
  estudio: { x: 204, y: 134, w: 96, h: 132, nome: 'Estúdio', porta: [244, 260], embaixo: true },
  copa: { x: 306, y: 134, w: 104, h: 132, nome: 'Copa', porta: [350, 366], embaixo: true },
};
const JARDIM = { x: 416, y: 0, w: 64, h: ALTURA };

// Mesas: 8 na sala da equipe (duas ilhas, duas fileiras) e 4 no estúdio. (x do centro, y do topo do tampo)
// A ordem é a ordem de ocupação: as três primeiras ficam afastadas, para os crachás não se encostarem.
const MESAS = [
  { x: 32, y: 30, cadeira: 54 }, { x: 134, y: 30, cadeira: 54 }, { x: 68, y: 74, cadeira: 98 },
  { x: 170, y: 74, cadeira: 98 }, { x: 68, y: 30, cadeira: 54 }, { x: 170, y: 30, cadeira: 54 },
  { x: 32, y: 74, cadeira: 98 }, { x: 134, y: 74, cadeira: 98 },
  ...[228, 276].map(x => ({ x, y: 156, cadeira: 178 })),
  ...[228, 276].map(x => ({ x, y: 202, cadeira: 224 })),
];

// Pontos da rede de caminhos (pés do boneco) e as ligações entre eles.
const PONTOS = {
  // corredor do meio e a entrada do jardim
  'ha-0': [101, 127], 'ha-1': [252, 127], 'ha-2': [358, 127], 'ha-3': [418, 127],
  // portas
  'eq-porta': [101, 110], 'lo-porta': [252, 110], 're-porta': [358, 110],
  'jo-porta': [101, 150], 'es-porta': [252, 150], 'co-porta': [358, 150],
  // sala da equipe: corredores entre as fileiras
  'eq-c1': [101, 60], 'eq-c2': [101, 110],
  // lounge
  'lo-centro': [252, 80], 'sofa-1': [222, 40], 'sofa-2': [238, 40], 'sofa-3': [254, 40], 'estante': [282, 66], 'lo-planta': [214, 100],
  // reunião
  're-centro': [358, 92], 'reuniao-1': [346, 84], 'reuniao-2': [370, 84], 'quadro': [358, 32], 're-janela': [394, 60],
  // jogos
  'jo-centro': [101, 200], 'jo-baixo': [56, 240], 'pong-a': [20, 204], 'pong-b': [92, 204],
  'jo-tv': [153, 206], 'game-1': [144, 190], 'game-2': [162, 190], 'fliper': [172, 168],
  // estúdio
  'es-c1': [252, 186], 'es-c2': [252, 240],
  // copa
  'co-centro': [358, 182], 'cafe': [322, 168], 'geladeira': [394, 176], 'agua': [326, 204],
  'lanche-1': [358, 202], 'lanche-2': [358, 240], 'co-baixo': [384, 240],
  // jardim
  'jd-trilha': [446, 127], 'jd-norte': [446, 70], 'banco': [465, 106], 'jd-sul': [446, 200], 'flores': [428, 206], 'jd-lago': [446, 238],
};
const LIGACOES = [
  ['ha-0', 'ha-1'], ['ha-1', 'ha-2'], ['ha-2', 'ha-3'], ['ha-3', 'jd-trilha'],
  ['ha-0', 'eq-porta'], ['ha-0', 'jo-porta'], ['ha-1', 'lo-porta'], ['ha-1', 'es-porta'], ['ha-2', 're-porta'], ['ha-2', 'co-porta'],
  ['eq-porta', 'eq-c2'], ['eq-c2', 'eq-c1'],
  ['lo-porta', 'lo-centro'], ['lo-centro', 'sofa-1'], ['lo-centro', 'sofa-2'], ['lo-centro', 'sofa-3'], ['lo-centro', 'estante'], ['lo-porta', 'lo-planta'],
  ['re-porta', 're-centro'], ['re-centro', 'reuniao-1'], ['re-centro', 'reuniao-2'], ['re-centro', 're-janela'], ['re-janela', 'quadro'],
  ['jo-porta', 'jo-centro'], ['jo-centro', 'pong-b'], ['jo-centro', 'jo-baixo'], ['jo-baixo', 'pong-a'], ['jo-centro', 'jo-tv'],
  ['jo-tv', 'game-1'], ['jo-tv', 'game-2'], ['jo-tv', 'fliper'],
  ['es-porta', 'es-c1'], ['es-c1', 'es-c2'],
  ['co-porta', 'co-centro'], ['co-centro', 'cafe'], ['co-centro', 'geladeira'], ['co-centro', 'agua'], ['co-centro', 'lanche-1'],
  ['agua', 'lanche-2'], ['lanche-2', 'co-baixo'], ['co-baixo', 'geladeira'],
  ['jd-trilha', 'jd-norte'], ['jd-norte', 'banco'], ['jd-trilha', 'jd-sul'], ['jd-sul', 'flores'], ['jd-sul', 'jd-lago'],
];
// corredores das mesas: cada cadeira liga ao corredor atrás dela
MESAS.forEach((m, i) => {
  PONTOS[`mesa-${i}`] = [m.x, m.cadeira];
  const corredor = i < 4 ? 60 : i < 8 ? 110 : i < 10 ? 186 : 240;
  PONTOS[`lado-${i}`] = [m.x, corredor];
  LIGACOES.push([`mesa-${i}`, `lado-${i}`]);
});
for (const [a, b, c] of [['lado-0', 'lado-1', 'eq-c1'], ['lado-2', 'lado-3', 'eq-c1'], ['lado-4', 'lado-5', 'eq-c2'], ['lado-6', 'lado-7', 'eq-c2'],
  ['lado-8', 'lado-9', 'es-c1'], ['lado-10', 'lado-11', 'es-c2']]) {
  const [ax] = PONTOS[a], [bx] = PONTOS[b];
  if (ax < PONTOS[c][0] && bx < PONTOS[c][0]) LIGACOES.push([a, b], [b, c]);
  else if (ax > PONTOS[c][0] && bx > PONTOS[c][0]) LIGACOES.push([b, a], [a, c]);
  else LIGACOES.push([a, c], [b, c]);
}

// O que se faz em cada lugar de diversão: pose, para onde olha, ícone do balão e quanto tempo fica (s).
const LAZER = {
  cafe: { dir: 'costas', icone: 'cafe', tempo: [5, 10] },
  geladeira: { dir: 'costas', icone: 'geladeira', tempo: [4, 8] },
  agua: { dir: 'lado', esquerda: true, icone: 'agua', tempo: [4, 8] },
  'lanche-1': { pose: 'sentado', dir: 'frente', icone: 'lanche', tempo: [10, 18] },
  'lanche-2': { pose: 'sentado', dir: 'costas', icone: 'lanche', tempo: [10, 18] },
  'sofa-1': { pose: 'sentado', dir: 'frente', icone: 'conversa', tempo: [10, 20] },
  'sofa-2': { pose: 'sentado', dir: 'frente', icone: 'conversa', tempo: [10, 20] },
  'sofa-3': { pose: 'sentado', dir: 'frente', icone: 'conversa', tempo: [10, 20] },
  estante: { dir: 'costas', icone: 'livro', tempo: [8, 14] },
  quadro: { dir: 'costas', icone: 'quadro', tempo: [6, 10] },
  're-janela': { dir: 'lado', icone: 'janela', tempo: [5, 9] },
  'game-1': { pose: 'sentado', dir: 'costas', icone: 'controle', tempo: [14, 24] },
  'game-2': { pose: 'sentado', dir: 'costas', icone: 'controle', tempo: [14, 24] },
  fliper: { dir: 'lado', icone: 'fliperama', tempo: [10, 16] },
  'pong-a': { dir: 'lado', icone: 'raquete', tempo: [16, 26], par: 'pong-b' },
  'pong-b': { dir: 'lado', esquerda: true, icone: 'raquete', tempo: [16, 26], par: 'pong-a' },
  banco: { pose: 'sentado', dir: 'frente', icone: 'sol', tempo: [10, 18] },
  flores: { dir: 'costas', icone: 'regador', tempo: [6, 10] },
  'jd-lago': { dir: 'frente', icone: 'sol', tempo: [6, 10] },
  'lo-planta': { dir: 'costas', icone: 'regador', tempo: [4, 7] },
};
const DIVERSAO = Object.keys(LAZER).filter(n => n !== 'pong-b');

const VIZINHOS = {};
for (const [a, b] of LIGACOES) {
  (VIZINHOS[a] ||= []).push(b);
  (VIZINHOS[b] ||= []).push(a);
}
const distancia = (a, b) => Math.hypot(PONTOS[a][0] - PONTOS[b][0], PONTOS[a][1] - PONTOS[b][1]);

// Menor caminho entre dois pontos da rede (Dijkstra; a rede é pequena).
function rota(de, para) {
  const custo = { [de]: 0 };
  const veio = {};
  const abertos = new Set([de]);
  while (abertos.size) {
    let atual = null;
    for (const n of abertos) if (atual === null || custo[n] < custo[atual]) atual = n;
    abertos.delete(atual);
    if (atual === para) break;
    for (const v of VIZINHOS[atual] || []) {
      const c = custo[atual] + distancia(atual, v);
      if (custo[v] === undefined || c < custo[v]) {
        custo[v] = c;
        veio[v] = atual;
        abertos.add(v);
      }
    }
  }
  const caminho = [para];
  while (caminho[0] !== de && veio[caminho[0]]) caminho.unshift(veio[caminho[0]]);
  return caminho[0] === de ? caminho : [de, para];
}
function pontoMaisPerto(x, y) {
  let melhor = null;
  let menor = Infinity;
  for (const [nome, [px, py]] of Object.entries(PONTOS)) {
    const d = Math.hypot(px - x, py - y);
    if (d < menor) {
      menor = d;
      melhor = nome;
    }
  }
  return melhor;
}
const COPA_MORADIA = ['lanche-1', 'lanche-2', 'cafe', 'agua', 'co-centro'];
const casaDe = indice => (MESAS[indice] ? `mesa-${indice}` : COPA_MORADIA[(indice - MESAS.length) % COPA_MORADIA.length]);
const frenteDaMesa = indice => (MESAS[indice] ? `lado-${indice}` : 'co-centro');
const sorteio = (min, max) => min + Math.random() * (max - min);

// Balõezinhos do que a figurinha livre está fazendo. 16 px, traço de 1,6.
const svg = d => `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const AFAZERES = {
  cafe: svg('<path d="M3 6h8v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z"/><path d="M11 7h1.5a1.5 1.5 0 0 1 0 3H11M5.5 2.5v1.5M8.5 2.5v1.5"/>'),
  geladeira: svg('<rect x="4" y="2" width="8" height="12" rx="1.5"/><path d="M4 7h8M6 4.5v1M6 9v2"/>'),
  agua: svg('<path d="M8 2.5c2.5 3 4 5 4 7a4 4 0 0 1-8 0c0-2 1.5-4 4-7z"/>'),
  lanche: svg('<path d="M2.5 9h11M3.5 9a4.5 4.5 0 0 1 9 0M4 11.5h8l-.8 2H4.8z"/>'),
  quadro: svg('<path d="M3 13l1-3.5 7-7 2.5 2.5-7 7z"/><path d="M9.5 4l2.5 2.5"/>'),
  janela: svg('<rect x="3" y="2.5" width="10" height="11" rx="1"/><path d="M8 2.5v11M3 8h10"/>'),
  livro: svg('<path d="M2.5 3.5c2 0 4 .5 5.5 1.5 1.5-1 3.5-1.5 5.5-1.5v9c-2 0-4 .5-5.5 1.5-1.5-1-3.5-1.5-5.5-1.5zM8 5v9"/>'),
  controle: svg('<path d="M4.5 5h7a3 3 0 0 1 2.8 4l-.9 2.5a1.5 1.5 0 0 1-2.6.4L9.5 10h-3l-1.3 1.9a1.5 1.5 0 0 1-2.6-.4L1.7 9a3 3 0 0 1 2.8-4z"/><path d="M5 7v2M4 8h2M11 7.5h.01M12.5 8.5h.01"/>'),
  fliperama: svg('<path d="M4 14V5l1.5-2.5h5L12 5v9z"/><rect x="5.5" y="5" width="5" height="3.5" rx=".5"/><path d="M6.5 11.5h.01M9.5 11v1.5"/>'),
  raquete: svg('<circle cx="6.5" cy="6.5" r="4"/><path d="M9.5 9.5l4 4"/><circle cx="13" cy="4" r="1.2"/>'),
  conversa: svg('<path d="M2.5 4.5a1.5 1.5 0 0 1 1.5-1.5h6a1.5 1.5 0 0 1 1.5 1.5v3.5a1.5 1.5 0 0 1-1.5 1.5H6.5L4 11.5V9.5a1.5 1.5 0 0 1-1.5-1.5z"/><path d="M11.5 6h1a1.5 1.5 0 0 1 1.5 1.5V11l-1.8-1.3H9"/>'),
  sol: svg('<circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1"/>'),
  regador: svg('<path d="M3 7h7v6H3zM10 9l3.5-3M5 7V5a1.5 1.5 0 0 1 3 0v2"/><path d="M13.5 4.5v1M14.5 6h.01"/>'),
  entrega: svg('<path d="M4 2.5h5.5L12 5v8.5H4z"/><path d="M9.5 2.5V5H12M6 8h4M6 10.5h4"/>'),
};

// ---------- cenário (desenhado uma vez) ----------
function desenharCenario(c) {
  const R = (x, y, w, h, cor) => {
    c.fillStyle = cor;
    c.fillRect(x, y, w, h);
  };
  const xadrez = (x, y, w, h, t, a, b) => {
    for (let j = 0; j < h; j += t) for (let i = 0; i < w; i += t) R(x + i, y + j, Math.min(t, w - i), Math.min(t, h - j), ((i + j) / t) % 2 ? a : b);
  };
  // piso de fora: ladrilho creme
  R(0, 0, LARGURA, ALTURA, '#f3e6cc');
  for (let y = 0; y < ALTURA; y += 8) {
    R(0, y, JARDIM.x, 1, '#e9d8b8');
    for (let x = (y / 8) % 2 ? 8 : 0; x < JARDIM.x; x += 16) R(x, y, 1, 8, '#e9d8b8');
  }

  // pisos das salas
  const { equipe, lounge, reuniao, jogos, estudio, copa } = SALAS;
  xadrez(equipe.x, equipe.y, equipe.w, equipe.h, 6, '#b9c3cf', '#b0bbc8');
  R(lounge.x, lounge.y, lounge.w, lounge.h, '#f2eff6');
  for (let y = lounge.y; y < lounge.y + lounge.h; y += 10) R(lounge.x, y, lounge.w, 1, '#e3dfec');
  for (let x = lounge.x; x < lounge.x + lounge.w; x += 10) R(x, lounge.y, 1, lounge.h, '#e3dfec');
  xadrez(reuniao.x, reuniao.y, reuniao.w, reuniao.h, 6, '#9a9be0', '#8f90d6');
  for (let y = jogos.y; y < jogos.y + jogos.h; y += 6) R(jogos.x, y, jogos.w, 6, (y / 6) % 2 ? '#8f97da' : '#878fd2');
  for (let y = estudio.y; y < estudio.y + estudio.h; y += 6) {
    R(estudio.x, y, estudio.w, 6, '#e3c595'); R(estudio.x, y + 5, estudio.w, 1, '#d4b380');
    for (let x = estudio.x + ((y / 6) % 2 ? 9 : 25); x < estudio.x + estudio.w; x += 32) R(x, y, 1, 5, '#d4b380');
  }
  R(copa.x, copa.y, copa.w, copa.h, '#f6f5fa');
  for (let y = copa.y; y < copa.y + copa.h; y += 8) R(copa.x, y, copa.w, 1, '#e6e3ee');
  for (let x = copa.x; x < copa.x + copa.w; x += 8) R(x, copa.y, 1, copa.h, '#e6e3ee');

  // paredes: a de cima com a face à mostra, as dos lados e a de baixo finas, com a porta aberta
  for (const s of Object.values(SALAS)) {
    const [p0, p1] = s.porta;
    // face da parede de cima
    if (s.embaixo) {
      R(s.x, s.y, p0 - s.x, 10, '#5b6482'); R(p1, s.y, s.x + s.w - p1, 10, '#5b6482');
      R(s.x, s.y, p0 - s.x, 2, '#8a93ad'); R(p1, s.y, s.x + s.w - p1, 2, '#8a93ad');
      R(s.x, s.y + 8, p0 - s.x, 2, '#454d66'); R(p1, s.y + 8, s.x + s.w - p1, 2, '#454d66');
      R(p0 - 1, s.y, 1, 10, '#3d445a'); R(p1, s.y, 1, 10, '#3d445a');
    } else {
      R(s.x, s.y, s.w, 10, '#5b6482'); R(s.x, s.y, s.w, 2, '#8a93ad'); R(s.x, s.y + 8, s.w, 2, '#454d66');
    }
    // laterais
    R(s.x - 2, s.y, 2, s.h, '#5b6482'); R(s.x + s.w, s.y, 2, s.h, '#5b6482');
    // de baixo (salas de cima: com a porta) ou de baixo de tudo
    if (!s.embaixo) {
      R(s.x - 2, s.y + s.h, p0 - s.x + 2, 2, '#5b6482'); R(p1, s.y + s.h, s.x + s.w + 2 - p1, 2, '#5b6482');
    } else R(s.x - 2, s.y + s.h, s.w + 4, 2, '#5b6482');
  }
  // janelas nas faces das paredes de cima
  const janela = (x, y, w = 22) => { R(x, y + 1, w, 6, '#2f3a55'); R(x + 1, y + 2, w - 2, 4, '#7fc4ee'); R(x + 1, y + 2, w - 2, 1, '#b4e2f8'); R(x + (w >> 1), y + 2, 1, 4, '#2f3a55'); };
  for (const x of [18, 48, 120, 150]) janela(x, 11);
  janela(216, 11); janela(270, 11, 20); janela(392, 11, 14); janela(150, 135); janela(20, 135, 28); janela(214, 135); janela(278, 135, 16);

  const planta = (x, y, g = 1) => {
    R(x + 1, y - 6 * g, 6 * g, 6 * g, '#d9773a'); R(x + 1, y - 6 * g, 6 * g, 1, '#f0955a');
    R(x, y - 12 * g, 8 * g, 7 * g, '#3fae5a'); R(x + 2 * g, y - 15 * g, 4 * g, 4 * g, '#56c873'); R(x + 1, y - 11 * g, 2, 2, '#7fdc8c');
  };
  const cadeiraEscritorio = (cx, y) => { R(cx - 5, y - 9, 10, 8, '#2f3747'); R(cx - 4, y - 8, 8, 5, '#414c63'); R(cx - 1, y - 1, 2, 2, '#2f3747'); };

  // ----- sala da equipe e estúdio: mesas em ilhas -----
  MESAS.forEach((m, i) => {
    const x0 = m.x - 18, y0 = m.y;
    // monitor (aceso quando alguém trabalha: desenhado por cima, em tela())
    R(m.x - 8, y0 - 9, 16, 10, '#2b3242'); R(m.x - 7, y0 - 8, 14, 8, '#414c63'); R(m.x - 1, y0 + 1, 2, 2, '#2b3242');
    // tampo
    R(x0, y0 + 2, 36, 10, '#ffffff'); R(x0, y0 + 2, 36, 1, '#eef1f6'); R(x0, y0 + 12, 36, 2, '#c4ccd9'); R(x0, y0 + 14, 2, 3, '#8a93a5'); R(x0 + 34, y0 + 14, 2, 3, '#8a93a5');
    R(m.x - 6, y0 + 7, 12, 3, '#aab3c2'); R(m.x - 5, y0 + 8, 10, 1, '#7a8496'); R(m.x + 8, y0 + 8, 3, 2, '#aab3c2');
    // um objeto diferente em cada mesa
    const ox = x0 + 3, oy = y0 + 3;
    [
      () => { R(ox, oy + 2, 4, 5, '#2456b8'); R(ox + 1, oy + 3, 2, 1, '#f1f3f7'); },
      () => { R(ox, oy + 1, 8, 6, '#2b3242'); R(ox + 1, oy + 2, 6, 4, '#ff7ab8'); },
      () => { R(ox + 1, oy + 3, 5, 4, '#f0b93a'); R(ox + 3, oy, 1, 4, '#b0121c'); },
      () => { R(ox, oy + 2, 7, 5, '#a51e28'); R(ox + 1, oy + 3, 5, 3, '#f6f8fb'); },
      () => { R(ox, oy + 3, 6, 4, '#cf2230'); R(ox + 2, oy + 1, 2, 2, '#1f4fb5'); },
      () => { R(ox, oy + 1, 2, 6, '#6fbf4a'); R(ox + 3, oy + 3, 2, 4, '#5d3f8f'); },
      () => { R(ox + 1, oy + 2, 5, 5, '#d9304f'); R(ox + 3, oy, 1, 2, '#ffb43a'); },
      () => { R(ox, oy + 3, 7, 4, '#14161b'); R(ox + 3, oy + 4, 1, 1, '#d92b2b'); },
    ][i % 8]();
    planta(x0 + 28, y0 + 9, 0.5);
    cadeiraEscritorio(m.x, m.cadeira + 2);
  });
  // divisórias baixas entre as ilhas e plantas nos cantos da sala
  planta(10, 116); planta(186, 116); planta(208, 262); planta(288, 262);
  R(14, 46, 72, 1, '#9aa6b4'); R(116, 46, 72, 1, '#9aa6b4');

  // ----- lounge: sofá, mesa de centro, tapete, estante, luminária -----
  R(212, 50, 56, 22, '#d7cfe6'); R(213, 51, 54, 20, '#e4dcf1');                 // tapete
  R(212, 22, 50, 8, '#e0566e'); R(212, 22, 50, 2, '#f07a8e'); R(210, 24, 4, 14, '#c9435b'); R(260, 24, 4, 14, '#c9435b');   // encosto e braços
  R(214, 30, 46, 7, '#ec6a80'); R(214, 36, 46, 2, '#c9435b'); R(229, 30, 1, 7, '#c9435b'); R(245, 30, 1, 7, '#c9435b');      // assentos
  R(226, 54, 26, 12, '#b98654'); R(226, 54, 26, 2, '#d4a06b'); R(228, 66, 2, 2, '#8c5f36'); R(248, 66, 2, 2, '#8c5f36');      // mesa de centro
  R(231, 57, 6, 4, '#f6f8fb'); R(240, 56, 4, 5, '#4c9aff'); R(241, 55, 2, 1, '#9fd2ff');
  R(278, 20, 18, 40, '#8c5f36'); for (let y = 24; y < 58; y += 9) { R(279, y + 7, 16, 2, '#6d4627'); for (let x = 280; x < 294; x += 3) R(x, y, 2, 7, ['#c44a4a', '#4a7fc4', '#e2b24a', '#4ab07a', '#9a6ad0'][(x + y) % 5]); }
  R(270, 70, 2, 30, '#3d445a'); R(266, 66, 10, 5, '#f6dc8a'); R(267, 67, 8, 2, '#fff2c4');                                 // luminária
  planta(208, 106); planta(286, 106);

  // ----- reunião: quadro branco, mesa comprida, cadeiras -----
  R(330, 11, 56, 8, '#39425a'); R(331, 12, 54, 6, '#f6f8fb'); R(334, 13, 14, 1, '#4c9aff'); R(334, 15, 22, 1, '#9aa5b8'); R(362, 13, 6, 3, '#f2b544'); R(372, 13, 6, 3, '#4cc38a');
  R(334, 46, 48, 26, '#c98a54'); R(335, 47, 46, 22, '#e2a871'); R(334, 71, 48, 2, '#9c6537');
  R(344, 54, 9, 6, '#f6f8fb'); R(362, 56, 6, 4, '#4c9aff'); R(372, 52, 4, 5, '#2b3242');
  for (const [x, y] of [[340, 36], [356, 36], [372, 36], [340, 76], [356, 76], [372, 76]]) { R(x - 4, y, 9, 8, '#d9814b'); R(x - 3, y + 1, 7, 4, '#eea06d'); }
  planta(312, 116); planta(396, 116);

  // ----- jogos: mesa de pingue-pongue, TV com videogame e pufes, fliperama, tapete, alvo de dardos -----
  R(26, 186, 60, 30, '#1f6e4e'); R(28, 188, 56, 26, '#2f9a6c'); R(28, 200, 56, 1, '#f6f8fb'); R(28, 188, 56, 1, '#f6f8fb'); R(28, 213, 56, 1, '#f6f8fb');
  R(28, 188, 1, 26, '#f6f8fb'); R(83, 188, 1, 26, '#f6f8fb'); R(55, 185, 2, 32, '#e8ecf3'); R(55, 185, 2, 1, '#9aa5b8');       // rede
  R(30, 216, 2, 4, '#3d445a'); R(80, 216, 2, 4, '#3d445a');
  R(128, 176, 52, 30, '#6d5bc4'); R(130, 178, 48, 26, '#7a68d0');                                                         // tapete
  R(140, 150, 26, 4, '#3a2a20'); R(142, 154, 22, 4, '#5a4030');                                                          // rack
  R(138, 136, 30, 16, '#20263a'); R(139, 137, 28, 13, '#2f3a55');                                                         // TV (tela em tela())
  R(150, 152, 6, 2, '#d9dde8');                                                                                          // console
  R(136, 182, 14, 10, '#f07a3a'); R(137, 183, 12, 4, '#ff9a5a'); R(156, 182, 14, 10, '#3aa0f0'); R(157, 183, 12, 4, '#6ab8ff');   // pufes
  R(182, 146, 14, 26, '#2a1f4a'); R(183, 147, 12, 24, '#3d2e6e'); R(184, 150, 10, 8, '#141022'); R(184, 161, 10, 3, '#5a4a9a'); R(186, 159, 2, 2, '#ff4a6a'); R(191, 160, 1, 3, '#2a1f4a');  // fliperama
  R(14, 150, 10, 10, '#f6f8fb'); R(15, 151, 8, 8, '#d93a3a'); R(17, 153, 4, 4, '#f6f8fb'); R(18, 154, 2, 2, '#2f9a6c');      // alvo de dardos
  planta(10, 262); planta(186, 262); planta(116, 262);

  // ----- estúdio: mesa de desenho e um mural -----
  R(232, 136, 40, 7, '#f6f8fb'); R(234, 137, 6, 4, '#ff7ab8'); R(242, 137, 6, 4, '#4c9aff'); R(250, 137, 6, 4, '#f2b544'); R(258, 137, 10, 2, '#9aa5b8');

  // ----- copa: balcão com cafeteira e pia, geladeira, filtro de água, mesa redonda, banquetas -----
  R(312, 146, 70, 14, '#c9d1de'); R(312, 146, 70, 10, '#f6f8fb'); R(312, 159, 70, 1, '#8a93a5');
  R(316, 138, 12, 14, '#3a4256'); R(318, 140, 8, 3, '#7fc4ee'); R(319, 145, 6, 4, '#20263a'); R(320, 149, 4, 1, '#ff8f5a');   // cafeteira
  R(338, 149, 14, 6, '#9aa5b8'); R(339, 150, 12, 4, '#cfe6f6'); R(344, 146, 2, 4, '#7a8496');                                  // pia
  R(358, 150, 5, 5, '#ffffff'); R(359, 151, 3, 1, '#b07a4a'); R(366, 150, 5, 5, '#ff7ab8'); R(367, 151, 3, 1, '#b07a4a');      // xícaras
  R(386, 138, 18, 30, '#dfe5ee'); R(387, 139, 16, 11, '#f6f8fb'); R(387, 151, 16, 16, '#f6f8fb'); R(400, 142, 1, 5, '#8a93a5'); R(400, 154, 1, 7, '#8a93a5');   // geladeira
  R(308, 190, 10, 18, '#c9d1de'); R(309, 186, 8, 7, '#7fc4ee'); R(310, 187, 6, 2, '#b4e2f8'); R(311, 199, 4, 2, '#4c9aff');   // filtro
  c.fillStyle = '#c98a54'; c.beginPath(); c.ellipse(358, 218, 18, 12, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#e2a871'; c.beginPath(); c.ellipse(358, 217, 16, 10, 0, 0, Math.PI * 2); c.fill();
  R(352, 213, 5, 4, '#f6f8fb'); R(361, 215, 6, 3, '#f0b93a');
  for (const [x, y] of [[358, 196], [358, 238]]) { R(x - 4, y - 4, 8, 5, '#3a4256'); R(x - 3, y - 4, 6, 2, '#5a6480'); }
  planta(396, 262); planta(312, 262);

  // ----- jardim: grama, trilha, árvores, banco, canteiro de flores, laguinho -----
  R(JARDIM.x, 0, JARDIM.w, ALTURA, '#8dcd68');
  for (let y = 0; y < ALTURA; y += 4) for (let x = JARDIM.x; x < LARGURA; x += 4) if (((x * 7 + y * 13) >> 2) % 5 === 0) R(x + 1, y + 1, 1, 2, '#78ba57');
  R(JARDIM.x - 2, 0, 2, 120, '#5b6482'); R(JARDIM.x - 2, 134, 2, ALTURA - 134, '#5b6482');                                    // muro
  R(440, 0, 12, ALTURA, '#e8d6a8'); R(JARDIM.x, 121, 30, 12, '#e8d6a8');
  for (let y = 3; y < ALTURA; y += 9) R(441 + (y % 2), y, 3, 2, '#d8c290');
  const arvore = (x, y, r = 12) => {
    R(x - 2, y - 2, 4, 8, '#7a5230'); c.fillStyle = 'rgba(20,40,20,.18)'; c.beginPath(); c.ellipse(x, y + 6, r, 3, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#3f9a4a'; c.beginPath(); c.arc(x, y - r + 2, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#56b45c'; c.beginPath(); c.arc(x - 3, y - r - 1, r * 0.7, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#74cb72'; c.beginPath(); c.arc(x - 5, y - r - 4, r * 0.32, 0, Math.PI * 2); c.fill();
  };
  arvore(428, 40, 11); arvore(468, 30, 12); arvore(470, 166, 11); arvore(426, 112, 8); arvore(466, 262, 10);
  R(456, 92, 20, 4, '#9a6a3a'); R(456, 96, 20, 4, '#b98654'); R(457, 100, 2, 4, '#6d4627'); R(473, 100, 2, 4, '#6d4627');   // banco
  R(418, 188, 20, 12, '#7a5230'); for (let x = 419; x < 437; x += 3) { R(x, 186 + (x % 2), 2, 2, ['#ff6f91', '#ffd25a', '#ffffff', '#b47cff'][x % 4]); R(x, 189, 1, 3, '#3f9a4a'); }   // flores
  c.fillStyle = '#4a9fd8'; c.beginPath(); c.ellipse(462, 236, 12, 7, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#7fc4ee'; c.beginPath(); c.ellipse(460, 234, 7, 3, 0, 0, Math.PI * 2); c.fill();
  R(456, 238, 3, 1, '#3fae5a');
}

// ---------- o mapa ----------
export function criarMapa(moldura, { aoAbrir }) {
  const zona = (nome, x, y) => `<span class="mapa__zona" style="left:${(x / LARGURA) * 100}%;top:${(y / ALTURA) * 100}%">${nome}</span>`;
  moldura.innerHTML = `
    <div class="mapa__tela">
      <canvas class="mapa__canvas" width="${LARGURA}" height="${ALTURA}" role="img" aria-label="Mapa do escritório, visto de cima: sala da equipe, lounge, reunião, jogos, estúdio, copa e jardim"></canvas>
      <div class="mapa__sobre" data-sobre>
        ${zona('Equipe', 101, 88)}${zona('Lounge', 252, 94)}${zona('Reunião', 358, 100)}
        ${zona('Jogos', 101, 248)}${zona('Estúdio', 252, 256)}${zona('Copa', 358, 256)}${zona('Jardim', 446, 148)}
      </div>
    </div>`;
  const canvas = moldura.querySelector('canvas');
  const sobre = moldura.querySelector('[data-sobre]');
  const ctx = canvas.getContext('2d');
  const cenario = document.createElement('canvas');
  cenario.width = LARGURA;
  cenario.height = ALTURA;
  desenharCenario(cenario.getContext('2d'));
  const quadro = document.createElement('canvas');
  quadro.width = LARGURA;
  quadro.height = ALTURA;
  const q = quadro.getContext('2d');

  const parado = matchMedia('(prefers-reduced-motion: reduce)');
  const figuras = new Map(); // id -> personagem
  let fator = 0;
  let ultimo = 0;
  let tique = 0;
  let acumulado = 0;
  let relogio = 0;

  function ajustarTamanho() {
    const largura = canvas.clientWidth || LARGURA;
    const novo = Math.max(2, Math.min(8, Math.ceil((largura / LARGURA) * (devicePixelRatio || 1))));
    if (novo !== fator) {
      fator = novo;
      canvas.width = LARGURA * fator;
      canvas.height = ALTURA * fator;
    }
    moldura.style.setProperty('--escala', String(largura / LARGURA));
  }
  new ResizeObserver(ajustarTamanho).observe(canvas);

  // Leva a figurinha até um ponto da rede, pelo menor caminho. "pressa" é para quando ela vai trabalhar.
  function irPara(f, destino, { pressa = false, parar = 0 } = {}) {
    f.destino = destino;
    f.velocidade = pressa ? PRESSA : PASSEIO;
    f.ate = 0;
    f.pausa = parar;
    if (!f.posicionado || parado.matches) {
      [f.x, f.y] = PONTOS[destino];
      f.caminho = [];
      f.posicionado = true;
      f.noPonto = destino;
      return;
    }
    if (f.noPonto === destino && !f.caminho.length) {
      // já está lá: só marca quanto tempo fica (sem isso, quem sorteava o lugar onde já estava ficava parado para sempre)
      if (f.modo === 'livre') f.ate = performance.now() + (parar || sorteio(3500, 9000));
      return;
    }
    const origem = f.caminho.length ? pontoMaisPerto(f.x, f.y) : f.noPonto || pontoMaisPerto(f.x, f.y);
    f.noPonto = null;
    f.caminho = rota(origem, destino).map(n => PONTOS[n]);
  }

  // Desfaz a dupla do pingue-pongue (quando um sai, o outro também larga a raquete)
  function soltarPar(f) {
    if (!f.par) return;
    const o = figuras.get(f.par);
    f.par = null;
    if (o && o.par === f.id) {
      o.par = null;
      if (o.modo === 'livre') o.ate = Math.min(o.ate || Infinity, performance.now() + sorteio(300, 1200));
    }
  }

  // Quem está livre fica no lazer: vai de uma diversão para outra (às vezes em dupla, no pingue-pongue) e só volta
  // para a mesa quando tem trabalho. Dois não escolhem o mesmo lugar ao mesmo tempo.
  function proximoPasseio(f) {
    const ocupados = new Set([...figuras.values()].filter(o => o !== f).map(o => o.destino));
    // pingue-pongue: só com um parceiro livre e parado
    if (!ocupados.has('pong-a') && !ocupados.has('pong-b') && Math.random() < 0.4) {
      const parceiros = [...figuras.values()].filter(o => o !== f && o.modo === 'livre' && !o.par && !o.levando && !o.entrega);
      if (parceiros.length) {
        const o = parceiros[Math.floor(Math.random() * parceiros.length)];
        const tempo = sorteio(...LAZER['pong-a'].tempo) * 1000;
        f.par = o.id; o.par = f.id;
        irPara(o, 'pong-b', { parar: tempo });
        return { destino: 'pong-a', parar: tempo };
      }
    }
    const opcoes = DIVERSAO.filter(n => n !== 'pong-a' && !ocupados.has(n) && n !== f.noPonto);
    const destino = opcoes[Math.floor(Math.random() * opcoes.length)] || f.noPonto || DIVERSAO[0];
    const lazer = LAZER[destino];
    return { destino, parar: lazer ? sorteio(...lazer.tempo) * 1000 : 0 };
  }

  const situacaoAntes = new Map(); // tarefa -> situação na última atualização
  function atualizar(equipe, tarefas) {
    const ordem = equipe.map(a => a.id);
    // Quem acabou de entregar leva a entrega até a mesa de quem continua (as tarefas que dependiam da dela).
    const primeiraVez = situacaoAntes.size === 0;
    for (const t of tarefas) {
      const antes = situacaoAntes.get(t.id);
      situacaoAntes.set(t.id, t.status);
      if (primeiraVez || antes === t.status || t.status !== 'concluida' || !t.agente) continue;
      const seguinte = tarefas.find(o => o.dependeDe.includes(t.id) && o.agente && o.agente !== t.agente);
      const quem = figuras.get(t.agente);
      if (seguinte && quem) quem.entrega = seguinte.agente;
    }
    for (const id of [...figuras.keys()]) {
      if (!ordem.includes(id)) {
        soltarPar(figuras.get(id));
        figuras.get(id).cracha.remove();
        figuras.get(id).boneco.remove();
        figuras.delete(id);
      }
    }
    equipe.forEach((a, indice) => {
      let f = figuras.get(a.id);
      if (!f) {
        const cracha = document.createElement('button');
        cracha.type = 'button';
        cracha.className = 'cracha';
        cracha.dataset.agente = a.id;
        cracha.innerHTML = '<i class="cracha__ponto"></i><span class="cracha__nome"></span><span class="cracha__estado"></span>';
        cracha.addEventListener('click', () => aoAbrir(a.id));
        const boneco = document.createElement('span');
        boneco.className = 'boneco';
        boneco.setAttribute('aria-hidden', 'true');
        boneco.innerHTML = '<span class="boneco__balao"></span>';
        boneco.addEventListener('click', () => aoAbrir(a.id));
        sobre.append(boneco, cracha);
        f = { id: a.id, x: 0, y: 0, caminho: [], cracha, boneco, andou: 0, dir: 'frente', esquerda: false };
        figuras.set(a.id, f);
      }
      f.agente = a;
      const est = a.estado.estado;
      const tarefa = a.estado.tarefaId ? tarefas.find(t => t.id === a.estado.tarefaId) : null;
      const ativo = ESTADOS_ATIVOS.includes(est);
      if (f.estado && f.estado !== est) {
        f.boneco.classList.remove('acabou-de-mudar');
        void f.boneco.offsetWidth;
        f.boneco.classList.add('acabou-de-mudar');
      }
      f.estado = est;
      f.boneco.dataset.estado = est;
      f.balao = null; // o desenhar refaz o balão
      f.ativo = ativo;
      f.esperando = a.estado.esperandoAgora || [];
      f.tela = a.tela;
      f.indice = indice;
      // Onde ela tem de estar agora
      const livre = est === 'disponivel' || est === 'concluido';
      const presa = ativo && tarefa?.tipo === 'plano' ? 'reuniao-1' : casaDe(indice);
      if (!livre || parado.matches) {
        if (f.modo !== 'posto') soltarPar(f);
        f.modo = 'posto';
        f.entrega = null;
        f.levando = false;
        irPara(f, presa, { pressa: true });
      } else {
        if (!f.posicionado) {
          // quem chega livre já aparece no lazer, fazendo alguma coisa
          f.modo = 'livre';
          const { destino, parar } = proximoPasseio(f);
          irPara(f, destino);
          f.ate = performance.now() + (parar || sorteio(6000, 14000));
        }
        if (f.modo !== 'livre') {
          f.modo = 'livre';
          f.ate = performance.now() + (f.entrega ? 300 : sorteio(1500, 5000));
        }
      }
      f.cracha.dataset.estado = est;
      f.cracha.querySelector('.cracha__nome').textContent = a.nome;
      f.cracha.querySelector('.cracha__estado').textContent = est === 'disponivel' ? '' : ROTULOS[est];
      f.cracha.title = `${a.nome} · ${a.papel} · ${ROTULOS[est]}${a.estado.atividade ? `: ${a.estado.atividade}` : ''}`;
      f.cracha.setAttribute('aria-label', `${f.cracha.title}. Abrir detalhes.`);
    });
  }

  function marcarAberto(id) {
    for (const f of figuras.values()) f.cracha.setAttribute('aria-pressed', String(f.id === id));
  }

  function mover(f, dt) {
    let resta = (f.velocidade || PASSEIO) * dt;
    while (resta > 0 && f.caminho.length) {
      const [ax, ay] = f.caminho[0];
      const dx = ax - f.x;
      const dy = ay - f.y;
      const d = Math.hypot(dx, dy);
      if (d > 0.01) {
        if (Math.abs(dx) >= Math.abs(dy)) { f.dir = 'lado'; f.esquerda = dx < 0; } else { f.dir = dy < 0 ? 'costas' : 'frente'; f.esquerda = false; }
      }
      if (d <= resta) {
        f.x = ax;
        f.y = ay;
        f.caminho.shift();
        resta -= d;
        f.andou += d;
        if (!f.caminho.length) {
          f.noPonto = f.destino;
          if (f.modo === 'livre') f.ate = performance.now() + (f.pausa || sorteio(3500, 9000));
        }
      } else {
        f.x += (dx / d) * resta;
        f.y += (dy / d) * resta;
        f.andou += resta;
        resta = 0;
      }
    }
  }

  // Pose de quem está parado: sentado na cadeira da mesa, no sofá, no pufe; de costas para o monitor; etc.
  function pose(f) {
    if (f.caminho.length) return { pose: 'em-pe', dir: f.dir, esquerda: f.esquerda, passo: Math.floor(f.andou / 3) % 4 };
    const lugar = f.noPonto || '';
    if (lugar.startsWith('mesa-') || lugar === 'reuniao-1' || lugar === 'reuniao-2') return { pose: 'sentado', dir: 'costas' };
    if (lugar.startsWith('lado-')) return { pose: 'em-pe', dir: 'costas' };
    const l = LAZER[lugar];
    if (l) return { pose: l.pose || 'em-pe', dir: l.dir, esquerda: Boolean(l.esquerda) };
    return { pose: 'em-pe', dir: 'frente' };
  }

  // monitor da mesa, a TV do videogame e o fliperama
  function tela(f, mesa) {
    const x0 = mesa.x - 7;
    const y0 = mesa.y - 8;
    const cor = COR_ESTADO[f.estado];
    q.fillStyle = '#0d1320';
    q.fillRect(x0, y0, 14, 8);
    q.fillStyle = cor;
    if (f.tela === 'figma') {
      q.fillRect(x0 + 1, y0 + 1, 3, 6);
      q.globalAlpha = tique % 4 < 2 ? 1 : 0.55;
      q.fillRect(x0 + 6, y0 + 1, 7, 2);
      q.globalAlpha = 1;
      q.fillRect(x0 + 6 + (tique % 3) * 2, y0 + 4, 3, 3);
    } else if (f.tela === 'rede' || f.tela === 'dados') {
      for (let i = 0; i < 4; i += 1) {
        const h = 2 + ((i * 3 + tique) % 5);
        q.fillRect(x0 + 1 + i * 3, y0 + 7 - h, 2, h);
      }
    } else {
      for (let l = 0; l < 3; l += 1) q.fillRect(x0 + 1 + (l % 2), y0 + 1 + l * 2, 3 + ((l * 5 + tique) % 8), 1);
    }
  }
  function telaJogo() {
    // TV: corridinha colorida; fliperama: naves piscando
    const jogando = [...figuras.values()].some(f => !f.caminho.length && (f.noPonto === 'game-1' || f.noPonto === 'game-2'));
    if (jogando) {
      q.fillStyle = '#1b2a4a'; q.fillRect(139, 137, 28, 13);
      q.fillStyle = '#4cc38a'; q.fillRect(139, 146, 28, 4);
      q.fillStyle = '#ffd25a'; q.fillRect(141 + (tique * 2) % 22, 143, 3, 3);
      q.fillStyle = '#ff6f91'; q.fillRect(141 + (tique * 2 + 9) % 22, 143, 3, 3);
      q.fillStyle = '#9fd6ff'; q.fillRect(142 + (tique * 3) % 24, 139, 2, 1);
    }
    const noFliper = [...figuras.values()].some(f => !f.caminho.length && f.noPonto === 'fliper');
    if (noFliper) {
      q.fillStyle = '#141022'; q.fillRect(184, 150, 10, 8);
      q.fillStyle = tique % 2 ? '#ff4a6a' : '#ffd25a'; q.fillRect(186 + (tique % 3) * 2, 151, 2, 2);
      q.fillStyle = '#4cc3ff'; q.fillRect(188, 155, 2, 2);
    }
  }

  // pingue-pongue: a bolinha vai e volta quando os dois estão nos lugares
  function bolinha() {
    const a = [...figuras.values()].find(f => !f.caminho.length && f.noPonto === 'pong-a');
    const b = a && a.par ? figuras.get(a.par) : null;
    if (!a || !b || b.caminho.length || b.noPonto !== 'pong-b') return null;
    const periodo = 1.3;
    const fase = (relogio % periodo) / periodo;            // 0..1 ida e volta
    const ida = fase < 0.5 ? fase * 2 : 2 - fase * 2;      // 0 em a, 1 em b
    const x0 = PONTOS['pong-a'][0] + 7, x1 = PONTOS['pong-b'][0] - 7;
    const x = x0 + (x1 - x0) * ida;
    // quica uma vez no lado do outro: dois arcos por travessia
    const meio = ida < 0.5 ? ida * 2 : (ida - 0.5) * 2;
    const y = 196 - Math.sin(meio * Math.PI) * (ida < 0.5 === fase < 0.5 ? 9 : 6);
    return { x, y, quemBate: fase < 0.08 || fase > 0.92 ? 'a' : Math.abs(fase - 0.5) < 0.08 ? 'b' : '' };
  }

  function fioDeEspera(de, para) {
    // linha tracejada entre quem espera e quem está sendo esperado
    const x0 = Math.round(de.x);
    const y0 = Math.round(de.y) - 24;
    const x1 = Math.round(para.x);
    const y1 = Math.round(para.y) - 24;
    const passos = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    q.fillStyle = COR_ESTADO.aguardando;
    for (let i = 0; i <= passos; i += 1) {
      if ((i + tique * 2) % 6 > 2) continue;
      q.fillRect(Math.round(x0 + ((x1 - x0) * i) / passos), Math.round(y0 + ((y1 - y0) * i) / passos), 1, 1);
    }
  }

  function desenhar() {
    q.drawImage(cenario, 0, 0);
    const lista = [...figuras.values()];
    for (const f of lista) {
      const naMesa = MESAS[f.indice] && f.noPonto === casaDe(f.indice) && !f.caminho.length;
      if (naMesa && f.ativo) tela(f, MESAS[f.indice]);
      else if (naMesa && (f.estado === 'erro' || f.estado === 'concluido' || f.estado === 'aguardando')) {
        const m = MESAS[f.indice];
        q.fillStyle = '#0d1320';
        q.fillRect(m.x - 7, m.y - 8, 14, 8);
        q.fillStyle = COR_ESTADO[f.estado];
        q.fillRect(m.x - 1, m.y - 5, 3, 3);
      }
    }
    telaJogo();
    const bola = bolinha();
    // bonecos de trás para a frente (quem está mais embaixo fica na frente)
    for (const f of [...lista].sort((a, b) => a.y - b.y)) {
      const p = pose(f);
      let pulo = 0;
      if (bola && ((f.noPonto === 'pong-a' && bola.quemBate === 'a') || (f.noPonto === 'pong-b' && bola.quemBate === 'b'))) pulo = 1;
      if (!f.caminho.length && (f.noPonto === 'game-1' || f.noPonto === 'game-2') && tique % 6 === 0) pulo = 1;   // vibra com o jogo
      desenharBoneco(q, f.agente, f.x, f.y, { direcao: p.dir, esquerda: p.esquerda, pose: p.pose, passo: p.passo || 0, pulo });
      // raquete na mão de quem joga
      if (!f.caminho.length && (f.noPonto === 'pong-a' || f.noPonto === 'pong-b') && f.par) {
        const lado = f.noPonto === 'pong-a' ? 1 : -1;
        q.fillStyle = f.noPonto === 'pong-a' ? '#d93a3a' : '#2a55c8';
        q.fillRect(Math.round(f.x) + lado * 5 - 1, Math.round(f.y) - 11 - pulo, 3, 3);
        q.fillStyle = '#8c5f36';
        q.fillRect(Math.round(f.x) + lado * 4, Math.round(f.y) - 8 - pulo, 1, 2);
      }
    }
    if (bola) {
      q.fillStyle = 'rgba(20,16,30,.25)'; q.fillRect(Math.round(bola.x) - 1, 203, 2, 1);
      q.fillStyle = '#ffffff'; q.fillRect(Math.round(bola.x) - 1, Math.round(bola.y) - 1, 2, 2);
    }
    for (const f of lista) for (const id of f.esperando) if (figuras.has(id) && f.estado === 'aguardando') fioDeEspera(figuras.get(id), f);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(quadro, 0, 0, canvas.width, canvas.height);
    for (const f of figuras.values()) {
      const andando = f.caminho.length > 0;
      const sentado = !andando && pose(f).pose === 'sentado';
      f.boneco.style.left = f.cracha.style.left = `${(f.x / LARGURA) * 100}%`;
      f.boneco.style.top = `${(f.y / ALTURA) * 100}%`;
      f.boneco.style.zIndex = String(Math.round(f.y));
      f.cracha.style.top = `${((f.y - ALTURA_SPRITE - (sentado ? -1 : 2)) / ALTURA) * 100}%`;
      f.cracha.style.zIndex = String(400 + Math.round(f.y));
      f.boneco.toggleAttribute('data-andando', andando);
      f.boneco.dataset.lugar = andando ? '' : f.noPonto || '';
      // Balão: o estado, quando há um; para quem está livre, o que está fazendo onde parou.
      let balao = f.estado === 'disponivel' ? '' : ICONES[f.estado] || '';
      if (f.modo === 'livre' && (f.estado === 'disponivel' || f.levando)) {
        if (f.levando) balao = AFAZERES.entrega;
        else if (!andando && f.noPonto && f.noPonto !== casaDe(f.indice)) {
          const l = LAZER[f.noPonto];
          balao = l ? AFAZERES[l.icone] : f.noPonto.startsWith('lado-') ? AFAZERES.conversa : '';
        }
      }
      if (f.balao !== balao) {
        f.balao = balao;
        f.boneco.querySelector('.boneco__balao').innerHTML = balao;
        f.boneco.toggleAttribute('data-afazer', Boolean(balao) && f.modo === 'livre' && (f.estado === 'disponivel' || f.levando));
      }
    }
  }

  function ciclo(agora) {
    const dt = Math.min(0.1, (agora - ultimo) / 1000 || 0);
    ultimo = agora;
    relogio += dt;
    for (const f of figuras.values()) {
      if (f.modo === 'livre' && !f.caminho.length && f.ate && agora >= f.ate && !parado.matches) {
        if (f.entrega && figuras.has(f.entrega)) {
          // leva a entrega: para atrás da cadeira do colega um pouco mais
          soltarPar(f);
          irPara(f, frenteDaMesa(figuras.get(f.entrega).indice), { parar: 2600 });
          f.levando = true;
          f.entrega = null;
        } else {
          f.levando = false;
          soltarPar(f);
          const { destino, parar } = proximoPasseio(f);
          irPara(f, destino, { parar });
        }
      }
      if (f.caminho.length) mover(f, dt);
    }
    acumulado += dt;
    if (acumulado >= 0.14) {
      acumulado = 0;
      tique += 1;
    }
    // ~30 quadros por segundo bastam para a pixel art (e poupam a bateria)
    if (!ciclo.ultimoDesenho || agora - ciclo.ultimoDesenho > 32) {
      ciclo.ultimoDesenho = agora;
      desenhar();
    }
    requestAnimationFrame(ciclo);
  }
  ajustarTamanho();
  requestAnimationFrame(ciclo);

  return { atualizar, marcarAberto };
}
