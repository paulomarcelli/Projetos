// Tema "apartamento": um apartamento de Nova York visto de cima, inspirado num sitcom dos anos 90 (desenho próprio,
// sem nomes nem personagens). Paredes lilás, porta roxa com moldura amarela no olho mágico, cozinha aberta com balcão,
// mesa de jantar grande, sala com sofá e janelão, varanda com vista para os prédios, dois quartos e o banheiro.
// Trabalho: notebooks na mesa de jantar e no balcão, e a escrivaninha de cada quarto.
import { LARGURA, ALTURA } from './medidas.js';

// ---------- planta ----------
const CORREDOR = 116;          // linha de passagem entre a cozinha, a mesa de jantar e a sala
const QUARTOS_Y = 150;         // parede de cima dos quartos e do banheiro
const QUARTOS = {
  q1: { x: 4, w: 92, porta: [40, 56] },
  banho: { x: 100, w: 44, porta: [114, 130] },
  q2: { x: 148, w: 114, porta: [186, 202] },
};
const VARANDA = { x: 408, y: 70, w: 68, h: 106 };

// Lugares de trabalho (x do centro, y do topo do tampo, y dos pés na cadeira). A ordem é a de ocupação: as três
// primeiras ficam afastadas para os crachás não se encostarem.
const MESAS = [
  { x: 172, y: 70, cadeira: 102, tipo: 'notebook' },   // mesa de jantar, ponta esquerda
  { x: 58, y: 88, cadeira: 108, tipo: 'notebook' },    // balcão da cozinha
  { x: 244, y: 70, cadeira: 102, tipo: 'notebook' },   // mesa de jantar, ponta direita
  { x: 106, y: 88, cadeira: 108, tipo: 'notebook' },   // balcão da cozinha
  { x: 75, y: 214, cadeira: 240, tipo: 'monitor' },    // escrivaninha do quarto 1
  { x: 176, y: 214, cadeira: 240, tipo: 'monitor' },   // escrivaninha do quarto 2
];

const PONTOS = {
  // cozinha
  'k-oeste': [20, CORREDOR], 'k-no': [20, 66], 'k-meio': [82, 66], 'k-ne': [146, 66],
  geladeira: [17, 62], cozinhar: [66, 52], cafe: [129, 52],
  // corredor e mesa de jantar
  'c-q1': [48, CORREDOR], 'c-meio': [146, CORREDOR], 'c-q2': [194, CORREDOR], 'c-sala': [270, CORREDOR],
  'reuniao-1': [196, 102], 'reuniao-2': [220, 102], 'r-1': [196, CORREDOR], 'r-2': [220, CORREDOR],
  'd-no': [152, 46], 'd-ne': [262, 46], porta: [178, 38], 'jantar-1': [184, 58], 'jantar-2': [232, 58],
  // quarto 1
  'q1-porta': [48, 150], 'q1-dentro': [50, 176], 'q1-pe': [50, 214], 'q1-baixo': [50, 252], 'cama-1': [36, 214],
  // quarto 2
  'q2-porta': [194, 150], 'q2-dentro': [196, 176], 'q2-pe': [200, 214], 'q2-baixo': [200, 252], 'cama-2': [226, 214], espelho: [160, 172],
  // sala
  's-norte': [300, 100], 'janela': [344, 44], 's-leste': [384, 100], 's-oeste': [290, 138],
  'sofa-1': [314, 138], 'sofa-2': [334, 138], 'sofa-3': [354, 138],
  's-sw': [292, 190], 's-se': [372, 190], 's-sul': [332, 200],
  poltrona: [282, 172], 'cartas-a': [304, 164], 'cartas-b': [362, 164], 'game-1': [322, 232], 'game-2': [342, 232], vinil: [288, 216],
  // varanda
  'porta-varanda': [400, 108], 'v-dentro': [420, 120], 'varanda-1': [434, 98], 'varanda-2': [434, 142], parapeito: [462, 120], vasos: [452, 164],
};
const LIGACOES = [
  // cozinha: contorna o balcão pelos dois lados
  ['k-oeste', 'k-no'], ['k-no', 'geladeira'], ['k-no', 'cozinhar'], ['cozinhar', 'k-meio'], ['k-meio', 'cafe'], ['cafe', 'k-ne'],
  ['k-ne', 'c-meio'], ['k-ne', 'd-no'],
  // mesa de jantar, porta de entrada
  ['d-no', 'porta'], ['d-no', 'jantar-1'], ['jantar-1', 'jantar-2'], ['jantar-2', 'd-ne'], ['d-ne', 'c-sala'],
  ['r-1', 'reuniao-1'], ['r-2', 'reuniao-2'],
  // quartos
  ['c-q1', 'q1-porta'], ['q1-porta', 'q1-dentro'], ['q1-dentro', 'q1-pe'], ['q1-pe', 'cama-1'], ['q1-pe', 'q1-baixo'],
  ['c-q2', 'q2-porta'], ['q2-porta', 'q2-dentro'], ['q2-dentro', 'espelho'], ['q2-dentro', 'q2-pe'], ['q2-pe', 'cama-2'], ['q2-pe', 'q2-baixo'],
  // sala
  ['c-sala', 's-norte'], ['c-sala', 's-oeste'], ['s-norte', 'janela'], ['s-norte', 's-leste'], ['janela', 's-leste'],
  ['s-oeste', 'sofa-1'], ['sofa-1', 'sofa-2'], ['sofa-2', 'sofa-3'], ['s-oeste', 's-sw'],
  ['s-sw', 'poltrona'], ['s-sw', 'cartas-a'], ['s-sw', 'vinil'], ['s-sw', 's-sul'], ['s-sul', 's-se'], ['s-se', 'cartas-b'],
  ['s-sul', 'game-1'], ['s-sul', 'game-2'], ['s-se', 's-leste'],
  // varanda
  ['s-leste', 'porta-varanda'], ['porta-varanda', 'v-dentro'], ['v-dentro', 'varanda-1'], ['v-dentro', 'varanda-2'],
  ['v-dentro', 'parapeito'], ['v-dentro', 'vasos'],
];
// cada cadeira liga ao corredor atrás dela; o corredor de cima vira uma linha só, de oeste para leste
MESAS.forEach((m, i) => {
  PONTOS[`mesa-${i}`] = [m.x, m.cadeira];
  PONTOS[`lado-${i}`] = [m.x, i < 4 ? CORREDOR : 252];
  LIGACOES.push([`mesa-${i}`, `lado-${i}`]);
});
LIGACOES.push(['lado-4', 'q1-baixo'], ['lado-5', 'q2-baixo']);
const linha = Object.keys(PONTOS).filter(n => PONTOS[n][1] === CORREDOR).sort((a, b) => PONTOS[a][0] - PONTOS[b][0]);
for (let i = 1; i < linha.length; i += 1) LIGACOES.push([linha[i - 1], linha[i]]);

const LAZER = {
  geladeira: { dir: 'costas', icone: 'geladeira', tempo: [4, 8] },
  cozinhar: { dir: 'costas', icone: 'panela', tempo: [10, 18] },
  cafe: { dir: 'costas', icone: 'cafe', tempo: [5, 10] },
  porta: { dir: 'costas', icone: 'olho', tempo: [3, 6] },
  'jantar-1': { pose: 'sentado', dir: 'frente', icone: 'lanche', tempo: [10, 18] },
  'jantar-2': { pose: 'sentado', dir: 'frente', icone: 'lanche', tempo: [10, 18] },
  'sofa-1': { pose: 'sentado', dir: 'frente', icone: 'conversa', tempo: [12, 22] },
  'sofa-2': { pose: 'sentado', dir: 'frente', icone: 'conversa', tempo: [12, 22] },
  'sofa-3': { pose: 'sentado', dir: 'frente', icone: 'conversa', tempo: [12, 22] },
  poltrona: { pose: 'sentado', dir: 'lado', icone: 'livro', tempo: [10, 18] },
  janela: { dir: 'costas', icone: 'janela', tempo: [5, 9] },
  vinil: { dir: 'lado', esquerda: true, icone: 'musica', tempo: [8, 14] },
  'game-1': { pose: 'sentado', dir: 'frente', icone: 'tv', tempo: [14, 24] },
  'game-2': { pose: 'sentado', dir: 'frente', icone: 'tv', tempo: [14, 24] },
  'cartas-a': { pose: 'sentado', dir: 'lado', icone: 'cartas', tempo: [16, 26], par: 'cartas-b' },
  'cartas-b': { pose: 'sentado', dir: 'lado', esquerda: true, icone: 'cartas', tempo: [16, 26], par: 'cartas-a' },
  'cama-1': { pose: 'sentado', dir: 'frente', icone: 'cama', tempo: [10, 18] },
  'cama-2': { pose: 'sentado', dir: 'frente', icone: 'cama', tempo: [10, 18] },
  espelho: { dir: 'costas', icone: 'espelho', tempo: [4, 8] },
  'varanda-1': { pose: 'sentado', dir: 'lado', icone: 'sol', tempo: [10, 18] },
  'varanda-2': { pose: 'sentado', dir: 'lado', icone: 'sol', tempo: [10, 18] },
  parapeito: { dir: 'lado', icone: 'janela', tempo: [6, 10] },
  vasos: { dir: 'frente', icone: 'regador', tempo: [5, 9] },
};

// ---------- cenário ----------
const ROXO = { face: '#9a7bc8', luz: '#bba3e2', sombra: '#73559f', linha: '#5d4386' };

function desenhar(c) {
  const R = (x, y, w, h, cor) => { c.fillStyle = cor; c.fillRect(x, y, w, h); };
  const ovo = (x, y, rx, ry, cor) => { c.fillStyle = cor; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); };
  const tabuas = (x, y, w, h, a, b, linha) => {
    for (let j = 0; j < h; j += 6) {
      R(x, y + j, w, Math.min(6, h - j), (j / 6) % 2 ? a : b);
      R(x, y + j + 5, w, 1, linha);
      for (let i = x + ((j / 6) % 3) * 11 + 6; i < x + w; i += 34) R(i, y + j, 1, 5, linha);
    }
  };
  const ladrilho = (x, y, w, h, t, a, b) => {
    for (let j = 0; j < h; j += t) for (let i = 0; i < w; i += t) R(x + i, y + j, Math.min(t, w - i), Math.min(t, h - j), ((i + j) / t) % 2 ? a : b);
  };
  const planta = (x, y, g = 1) => {
    R(x + 1, y - 6 * g, 6 * g, 6 * g, '#c4643a'); R(x + 1, y - 6 * g, 6 * g, 1, '#e08a5a');
    R(x, y - 12 * g, 8 * g, 7 * g, '#3f9a4a'); R(x + 2 * g, y - 15 * g, 4 * g, 4 * g, '#56b45c'); R(x + 1, y - 11 * g, 2, 2, '#7fd08a');
  };

  // ----- lá fora: o corredor do prédio em cima e a cidade à direita -----
  R(0, 0, LARGURA, ALTURA, '#5d6577');
  for (let y = 0; y < ALTURA; y += 2) for (let x = 404; x < LARGURA; x += 2) if (((x * 3 + y * 5) >> 1) % 7 === 0) R(x, y, 1, 1, '#687184');
  // prédio da frente (telhado e janelinhas acesas), em cima e embaixo da varanda
  R(412, 0, 68, 60, '#8a4e3c'); R(412, 58, 68, 2, '#6a3a2c');
  R(412, 186, 68, 86, '#7d4636'); R(412, 186, 68, 2, '#a15c46');
  for (let y = 6; y < 54; y += 12) for (let x = 418; x < 476; x += 12) R(x, y, 6, 6, (x + y) % 3 ? '#3b2a33' : '#f2d27a');
  for (let y = 194; y < 268; y += 12) for (let x = 418; x < 476; x += 12) R(x, y, 6, 6, (x * y) % 5 ? '#3b2a33' : '#f2d27a');
  // caixa-d'água no telhado
  ovo(452, 222, 9, 5, '#5a3a24'); R(443, 210, 18, 12, '#7a5232'); for (let x = 445; x < 461; x += 4) R(x, 210, 1, 12, '#5a3a24'); ovo(452, 210, 9, 4, '#4a2e1c');
  // corredor do prédio (ladrilho cinza) e a porta do vizinho em frente
  R(0, 0, 404, 18, '#cfc6b6'); for (let x = 0; x < 404; x += 8) R(x, 0, 1, 18, '#bdb3a2'); R(0, 9, 404, 1, '#bdb3a2');
  R(160, 0, 22, 6, '#6e4a9e'); R(161, 0, 20, 5, '#7f58b2'); R(170, 2, 2, 2, '#f2c230');
  R(8, 2, 34, 14, '#9b9282'); for (let x = 10; x < 40; x += 5) R(x, 3, 3, 12, '#b3aa98');   // escada

  // ----- pisos -----
  ladrilho(4, 28, 144, 88, 6, '#ece0c6', '#e1d1b1');                         // cozinha
  tabuas(148, 28, 256, 240, '#c79a68', '#bf9160', '#a8794b');                // jantar, corredor e sala
  tabuas(4, 116, 144, 34, '#c79a68', '#bf9160', '#a8794b');                  // corredor da cozinha
  tabuas(QUARTOS.q1.x, QUARTOS_Y, QUARTOS.q1.w, 118, '#d8b487', '#d0aa7c', '#bb9365');
  ladrilho(QUARTOS.banho.x, QUARTOS_Y, QUARTOS.banho.w, 118, 4, '#eef4f7', '#d6e6ef');
  tabuas(QUARTOS.q2.x, QUARTOS_Y, QUARTOS.q2.w, 118, '#d8b487', '#d0aa7c', '#bb9365');
  ladrilho(VARANDA.x, VARANDA.y, VARANDA.w, VARANDA.h, 6, '#c8734f', '#bb6744');   // varanda

  // ----- paredes lilás -----
  // de cima, com a face à mostra
  R(4, 18, 400, 10, ROXO.face); R(4, 18, 400, 2, ROXO.luz); R(4, 26, 400, 2, ROXO.sombra);
  // laterais e de baixo
  R(2, 18, 2, 252, ROXO.linha); R(404, 18, 2, 74, ROXO.linha); R(404, 124, 2, 146, ROXO.linha); R(2, 268, 404, 2, ROXO.linha);
  // dos quartos (face à mostra, com as portas abertas) e as divisórias entre eles
  for (const s of Object.values(QUARTOS)) {
    const [p0, p1] = s.porta;
    R(s.x, QUARTOS_Y, p0 - s.x, 10, ROXO.face); R(p1, QUARTOS_Y, s.x + s.w - p1, 10, ROXO.face);
    R(s.x, QUARTOS_Y, p0 - s.x, 2, ROXO.luz); R(p1, QUARTOS_Y, s.x + s.w - p1, 2, ROXO.luz);
    R(s.x, QUARTOS_Y + 8, p0 - s.x, 2, ROXO.sombra); R(p1, QUARTOS_Y + 8, s.x + s.w - p1, 2, ROXO.sombra);
    R(p0 - 1, QUARTOS_Y, 1, 10, ROXO.linha); R(p1, QUARTOS_Y, 1, 10, ROXO.linha);
    R(s.x + s.w, QUARTOS_Y, 4, 118, ROXO.linha);
  }
  R(96, QUARTOS_Y, 4, 118, ROXO.linha); R(144, QUARTOS_Y, 4, 118, ROXO.linha);

  // porta de entrada roxa, com a moldura amarela em volta do olho mágico
  R(168, 18, 20, 10, '#5b2f8f'); R(169, 19, 18, 9, '#6e3aa8'); R(169, 19, 18, 1, '#8a5ac4');
  R(176, 20, 4, 1, '#f2c230'); R(175, 21, 6, 4, '#f2c230'); R(176, 25, 4, 1, '#f2c230'); R(176, 22, 4, 2, '#d9a21a'); R(177, 22, 2, 2, '#2a1a3a'); R(185, 23, 1, 2, '#e8d07a');
  R(166, 28, 24, 6, '#7a3d4a'); R(167, 29, 22, 4, '#a4565f');                       // capacho

  // janelão da sala (vários vidros, arco no meio) na parede de cima
  R(282, 18, 116, 10, '#f3efe6');
  for (let x = 284; x < 396; x += 8) { R(x, 19, 7, 8, '#8fc6e8'); R(x, 19, 7, 2, '#c4e4f6'); }
  R(330, 18, 20, 10, '#f3efe6'); R(332, 19, 16, 8, '#a8d4ee'); R(339, 19, 2, 8, '#f3efe6'); R(332, 22, 16, 1, '#f3efe6');
  // porta-janela para a varanda, na parede da direita
  R(404, 92, 4, 32, '#f3efe6'); R(405, 94, 2, 28, '#8fc6e8');
  // grade e floreira da varanda
  R(VARANDA.x, VARANDA.y - 2, VARANDA.w + 2, 2, '#2c2f3a'); R(VARANDA.x, VARANDA.y + VARANDA.h, VARANDA.w + 2, 2, '#2c2f3a');
  R(VARANDA.x + VARANDA.w, VARANDA.y, 2, VARANDA.h, '#2c2f3a');
  for (let y = VARANDA.y; y < VARANDA.y + VARANDA.h; y += 4) R(VARANDA.x + VARANDA.w + 2, y, 2, 1, '#454a59');
  for (let x = VARANDA.x; x < VARANDA.x + VARANDA.w; x += 4) { R(x, VARANDA.y - 4, 1, 2, '#454a59'); R(x, VARANDA.y + VARANDA.h + 2, 1, 2, '#454a59'); }

  // ----- cozinha: geladeira retrô, bancada com fogão e pia, armários coloridos, balcão com banquetas -----
  for (let x = 28; x < 146; x += 14) { R(x, 19, 13, 8, x % 28 ? '#45b6ae' : '#f2c84b'); R(x + 1, 20, 11, 1, '#ffffff55'); R(x + 10, 23, 2, 1, '#2a3a44'); }
  R(8, 28, 18, 30, '#efe6d0'); R(9, 29, 16, 10, '#fbf5e6'); R(9, 40, 16, 17, '#fbf5e6'); R(22, 32, 1, 5, '#a89f8a'); R(22, 43, 1, 8, '#a89f8a');
  R(11, 44, 3, 3, '#e8564f'); R(15, 47, 3, 2, '#4c9aff'); R(12, 50, 2, 3, '#f2c230');                  // ímãs
  R(26, 28, 120, 14, '#d9cdb5'); R(26, 28, 120, 11, '#f4efe4'); R(26, 41, 120, 1, '#a89f8a');           // bancada
  R(56, 29, 22, 10, '#3a3a44'); for (const [x, y] of [[61, 32], [72, 32], [61, 36], [72, 36]]) ovo(x, y, 3, 1.6, '#202028');   // fogão
  R(96, 30, 18, 8, '#a9b4c2'); R(97, 31, 16, 6, '#d6e8f4'); R(104, 28, 2, 3, '#7a8496');               // pia
  R(124, 28, 10, 10, '#3a4256'); R(126, 30, 6, 3, '#9fd2ff'); R(127, 34, 4, 3, '#20263a');             // cafeteira
  R(84, 31, 6, 5, '#ffffff'); R(85, 32, 4, 1, '#b07a4a'); R(138, 31, 5, 5, '#f2c84b');                // xícara e pote
  // balcão
  R(30, 82, 106, 16, '#8a5a34'); R(30, 82, 106, 13, '#b98654'); R(30, 82, 106, 2, '#d4a06b');
  planta(124, 86, 0.6);
  // banquetas (só nos lugares de trabalho do balcão)
  for (const i of [1, 3]) { const m = MESAS[i]; ovo(m.x, m.cadeira - 4, 5, 3, '#5a3a24'); ovo(m.x, m.cadeira - 5, 4, 2, '#e0566e'); }

  // ----- mesa de jantar: tampo de madeira, cadeiras de cores diferentes, fruteira -----
  R(160, 60, 96, 34, '#7a4e2c'); R(160, 60, 96, 31, '#a8703f'); R(160, 60, 96, 2, '#c28a52');
  for (let x = 166; x < 256; x += 18) R(x, 63, 1, 26, '#93602f');
  ovo(208, 76, 7, 4, '#e8e2d4'); R(204, 73, 3, 3, '#e8564f'); R(208, 72, 3, 3, '#f2c230'); R(211, 74, 3, 3, '#6fbf4a');   // fruteira
  const cadeira = (x, y, cor, encostoEmCima) => {
    R(x - 5, y - 6, 10, 7, cor); R(x - 4, y - 5, 8, 4, '#ffffff33');
    if (encostoEmCima) R(x - 5, y - 9, 10, 3, cor); else R(x - 5, y + 1, 10, 3, cor);
  };
  cadeira(184, 56, '#4a8f6a', true); cadeira(232, 56, '#d9814b', true);                                 // de cima
  cadeira(172, 102, '#c9435b', false); cadeira(196, 102, '#4a7fc4', false); cadeira(220, 102, '#e2b24a', false); cadeira(244, 102, '#7a5bb0', false);
  R(194, 66, 9, 7, '#f6f8fb'); R(195, 67, 7, 1, '#9aa5b8'); R(222, 68, 6, 4, '#f2b544');               // bloco e post-it (reunião)

  // ----- sala: tapete, sofá, poltrona, mesa de centro, TV, vitrola, plantas e luminária -----
  R(286, 116, 96, 92, '#2f6a86'); R(288, 118, 92, 88, '#3a7d9c');
  for (let y = 122; y < 204; y += 10) for (let x = 292; x < 378; x += 10) R(x, y, 2, 2, '#f2c84b');
  // sofá (encosto em cima, assentos virados para a TV)
  R(300, 118, 68, 8, '#d9cbb0'); R(300, 118, 68, 2, '#efe4cf'); R(296, 120, 6, 18, '#c8b896'); R(366, 120, 6, 18, '#c8b896');
  R(302, 126, 64, 10, '#ece1ca'); R(302, 135, 64, 2, '#c8b896'); R(323, 126, 1, 10, '#c8b896'); R(344, 126, 1, 10, '#c8b896');
  R(304, 121, 7, 5, '#e8564f'); R(357, 121, 7, 5, '#f2c230');                                          // almofadas
  // poltrona (virada para a direita)
  R(268, 160, 6, 16, '#4a8f6a'); R(272, 158, 12, 4, '#4a8f6a'); R(272, 174, 12, 4, '#4a8f6a'); R(274, 162, 10, 12, '#63a882');
  // mesa de centro
  R(312, 152, 40, 14, '#6d4627'); R(312, 152, 40, 12, '#8c5f36'); R(312, 152, 40, 1, '#a8774a');
  R(316, 155, 8, 6, '#f6f8fb'); R(342, 155, 5, 5, '#ffffff'); R(343, 156, 3, 1, '#b07a4a');
  // TV e rack (encostados na parede de baixo)
  R(306, 252, 52, 14, '#5a3a24'); R(306, 252, 52, 2, '#7a5232'); R(316, 244, 32, 10, '#1d2130'); R(317, 245, 30, 8, '#2f3a55');
  R(318, 260, 10, 4, '#d9dde8');                                                                           // videogame
  // vitrola e discos na estante da parede da esquerda
  R(268, 196, 12, 40, '#7a5232'); R(268, 196, 12, 2, '#9a6a3a');
  ovo(274, 206, 4, 4, '#1a1a1f'); ovo(274, 206, 1.2, 1.2, '#e8564f');
  for (let y = 214; y < 234; y += 2) R(269, y, 10, 1, ['#e8564f', '#4c9aff', '#f2c230', '#6fbf4a', '#b47cff'][(y / 2) % 5]);
  // luminária de chão, plantas
  R(395, 140, 2, 22, '#3d445a'); ovo(396, 138, 5, 4, '#f6dc8a'); ovo(396, 137, 3, 2, '#fff2c4');
  planta(392, 66, 1.1); planta(286, 66, 0.9); planta(392, 262, 1); planta(268, 262, 0.9);
  // quadro na parede (moldura dourada) ao lado da porta
  R(212, 19, 22, 8, '#c9a24a'); R(213, 20, 20, 6, '#4a7fc4'); R(215, 21, 6, 3, '#f2c230'); R(224, 22, 7, 3, '#e8564f');

  // ----- quarto 1: cama, criado-mudo, escrivaninha, tapete -----
  const cama = (x, y, colcha, faixa) => {
    R(x, y, 34, 38, '#7a5232'); R(x + 2, y + 2, 30, 34, colcha); R(x + 2, y + 2, 30, 9, '#f6f2ea');
    R(x + 4, y + 3, 11, 6, '#ffffff'); R(x + 19, y + 3, 11, 6, '#ffffff'); R(x + 2, y + 20, 30, 3, faixa);
  };
  cama(10, 166, '#b47cff', '#8f5ad6');
  R(46, 166, 10, 10, '#9a6a3a'); ovo(51, 170, 3, 3, '#f6dc8a');
  R(12, 222, 30, 18, '#e9a1b8'); R(14, 224, 26, 14, '#f2b8ca');
  // ----- quarto 2 -----
  cama(214, 166, '#5fa8d8', '#3f86b8');
  R(204, 166, 10, 10, '#9a6a3a'); ovo(209, 170, 3, 3, '#f6dc8a');
  R(152, 151, 14, 8, '#c9d6e2'); R(153, 152, 12, 6, '#e6f0f8'); R(154, 153, 4, 1, '#ffffff');           // espelho na parede
  R(218, 222, 32, 18, '#9fd0b8'); R(220, 224, 28, 14, '#b8e0cb');
  // escrivaninhas dos quartos
  for (const i of [4, 5]) {
    const m = MESAS[i];
    R(m.x - 18, m.y + 2, 36, 10, '#f4efe4'); R(m.x - 18, m.y + 12, 36, 2, '#c9bda5');
    R(m.x - 18, m.y + 14, 2, 3, '#8a7a62'); R(m.x + 16, m.y + 14, 2, 3, '#8a7a62');
    R(m.x - 6, m.y + 7, 12, 3, '#aab3c2'); R(m.x - 15, m.y + 4, 5, 6, '#f2c84b');
    R(m.x - 5, m.cadeira - 7, 10, 8, '#2f3747'); R(m.x - 4, m.cadeira - 6, 8, 5, '#414c63');
  }

  // notebooks e monitores (a tela acende por cima, em mapa.js, quando alguém trabalha)
  MESAS.forEach(m => {
    R(m.x - 8, m.y - 9, 16, 10, '#2b3242'); R(m.x - 7, m.y - 8, 14, 8, '#414c63');
    if (m.tipo === 'notebook') { R(m.x - 9, m.y + 1, 18, 4, '#9aa3b2'); R(m.x - 8, m.y + 2, 16, 2, '#c4ccd9'); }
    else R(m.x - 1, m.y + 1, 2, 2, '#2b3242');
  });

  // ----- banheiro: banheira, vaso, pia -----
  R(104, 162, 36, 16, '#d6e2ea'); R(106, 164, 32, 12, '#ffffff'); R(108, 166, 28, 8, '#bfe2f4');
  R(132, 240, 10, 12, '#ffffff'); ovo(137, 238, 5, 4, '#f2f6f8'); R(134, 252, 6, 3, '#d6e2ea');
  R(104, 220, 12, 9, '#ffffff'); R(106, 222, 8, 5, '#d6e8f4');
  R(102, 196, 4, 18, '#e8564f'); R(102, 200, 4, 1, '#ffffff');                                          // toalha

  // ----- varanda: cadeiras viradas para a cidade, vasos -----
  for (const y of [98, 142]) { R(426, y - 8, 4, 12, '#2c2f3a'); R(428, y - 7, 10, 9, '#3a3f4f'); R(429, y - 6, 8, 6, '#e0566e'); }
  R(446, 128, 12, 12, '#2c2f3a'); ovo(452, 134, 6, 6, '#3a3f4f'); R(449, 132, 4, 3, '#ffffff');        // mesinha
  for (const x of [416, 440, 464]) planta(x, VARANDA.y + VARANDA.h - 2, 0.8);
  planta(414, VARANDA.y + 14, 0.8);
}

// ---------- o que mexe ----------
function animar(q, { figuras, tique }) {
  const em = nome => figuras.some(f => !f.caminho.length && f.noPonto === nome);
  // TV: uma série passando (cores mudando) para quem está no tapete
  if (em('game-1') || em('game-2')) {
    const cenas = [['#f2c84b', '#e8564f'], ['#4c9aff', '#f6f8fb'], ['#6fbf4a', '#b47cff'], ['#e8564f', '#2f3a55']];
    const [a, b] = cenas[Math.floor(tique / 10) % cenas.length];
    q.fillStyle = a; q.fillRect(317, 245, 30, 8);
    q.fillStyle = b; q.fillRect(319 + (tique % 20), 247, 6, 4);
    q.fillStyle = '#ffffff'; q.fillRect(318, 251, 28, 1);
  }
  // vitrola girando
  if (em('vinil')) {
    q.fillStyle = '#e8564f';
    const a = (tique % 8) * (Math.PI / 4);
    q.fillRect(Math.round(274 + Math.cos(a) * 3), Math.round(206 + Math.sin(a) * 3), 1, 1);
    q.fillStyle = '#f2c84b'; q.fillRect(278, 198 - (tique % 6), 1, 1); q.fillRect(281, 200 - ((tique + 3) % 6), 1, 1);   // notinhas
  }
  // fogo do fogão e vapor da panela
  if (em('cozinhar')) {
    q.fillStyle = tique % 2 ? '#ff8f3a' : '#ffd25a'; q.fillRect(60, 31, 3, 2);
    q.fillStyle = '#c4c9d4'; q.fillRect(58, 30, 7, 4);
    q.fillStyle = '#ffffffaa'; q.fillRect(60 + (tique % 3), 25 - (tique % 4), 1, 2); q.fillRect(63 - (tique % 2), 24 - ((tique + 2) % 4), 1, 2);
  }
  if (em('cafe')) { q.fillStyle = '#ffffffaa'; q.fillRect(128 + (tique % 2), 25 - (tique % 3), 1, 2); }
  // cartas na mesa de centro quando a dupla está jogando
  if (em('cartas-a') && em('cartas-b')) {
    for (const [x, y, cor] of [[322, 157, '#f6f8fb'], [327, 158, '#f6f8fb'], [332, 156, '#f6f8fb'], [337, 158, '#e8564f']]) {
      q.fillStyle = cor; q.fillRect(x, y, 4, 5); q.fillStyle = '#c9435b'; q.fillRect(x + 1, y + 1, 1, 1);
    }
    q.fillStyle = '#f6f8fb'; q.fillRect(326 + (tique % 2) * 6, 162, 4, 3);
  }
}

export default {
  id: 'apartamento',
  nome: 'Apartamento',
  descricao: 'Mapa do apartamento, visto de cima: cozinha aberta, mesa de jantar, sala com sofá, varanda, dois quartos e banheiro',
  fundo: '#c9b6e8',
  zonas: [['Cozinha', 76, 140], ['Jantar', 208, 140], ['Sala', 380, 210], ['Quarto', 50, 262], ['Banho', 122, 262], ['Quarto', 230, 262], ['Varanda', 442, 186]],
  mesas: MESAS, pontos: PONTOS, ligacoes: LIGACOES, lazer: LAZER,
  moradia: ['sofa-1', 'sofa-3', 'poltrona', 'jantar-1', 'varanda-1', 'c-sala'],
  reuniao: ['reuniao-1', 'reuniao-2'],
  telasDeJogo: ['game-1', 'game-2'],
  par: { a: 'cartas-a', b: 'cartas-b', raquete: false, bola: null },
  desenhar,
  animar,
};
