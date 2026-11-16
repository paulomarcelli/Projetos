// Tema "apartamentos 19 e 20": os dois apartamentos do sitcom, lado a lado como na planta dos fãs, em pixel art própria.
// À esquerda o do Joey e do Chandler (porta 19), no meio o corredor do prédio com a escada, à direita o da Monica e da
// Rachel (porta 20). Tudo é medido nas coordenadas da planta (X e Y da imagem de referência, 600 × 361) e convertido
// para o mapa de 480 × 272 pela função P.
// Trabalho: notebook na mesa redonda da Monica, escrivaninha do Chandler, mesinha do banco da janela e escrivaninha da
// Rachel.
import { LARGURA, ALTURA } from './medidas.js';

const SX = 0.889;                                    // a planta é mais larga: aperta um pouco na horizontal
const px = X => Math.round((X - 25) * SX);
const py = Y => Math.round(Y - 30);
const P = (X, Y) => [px(X), py(Y)];

// ---------- lugares de trabalho (na planta) ----------
const MESAS_PLANTA = [
  { X: 370, Y: 192, cadeira: 204 },                                      // mesa redonda da Monica
  { X: 66, Y: 242, cadeira: 236, dir: 'frente', telaY: 244 },            // escrivaninha do Chandler
  { X: 437, Y: 105, cadeira: 121 },                                      // mesinha do banco da janela
  { X: 540, Y: 232, cadeira: 227, dir: 'frente', telaY: 234 },           // escrivaninha da Rachel
];
const MESAS = MESAS_PLANTA.map(m => ({
  x: px(m.X), y: py(m.Y), cadeira: py(m.cadeira), tipo: 'notebook', ...(m.dir ? { dir: m.dir, telaY: py(m.telaY) } : {}),
}));

// ---------- rede de caminhos (na planta) ----------
const PLANTA = {
  // corredor do prédio
  'h-19': [272, 229], 'h-20': [306, 214], 'h-meio': [290, 222], 'h-norte': [290, 170], escada: [258, 172], 'h-sul': [290, 262],
  // Joey e Chandler: sala, cozinha, pebolim
  'j-porta': [254, 229], 'j-cozinha': [232, 228], 'pia-j': [238, 216], 'j-sul': [210, 245], 'pebolim-a': [212, 257], 'pebolim-b': [254, 257],
  'j-centro': [186, 220], 'banqueta-1': [198, 207], 'banqueta-2': [198, 222],
  'sofa-j1': [148, 188], 'sofa-j2': [169, 188], 'reclinavel-1': [181, 247], 'reclinavel-2': [158, 266],
  'j-oeste': [140, 212], 'j-so': [140, 262],
  // quarto do Chandler
  'c-porta': [122, 206], 'c-dentro': [108, 212], 'c-sul': [100, 228], 'cama-c': [84, 230],
  // quarto do Joey
  'jo-porta': [122, 269], 'jo-dentro': [106, 276], 'cama-j': [84, 282],
  // Monica e Rachel: entrada, cozinha, mesa redonda
  porta: [322, 214], 'm-foyer': [345, 228], 'm-centro': [386, 220], 'm-meio': [398, 160], 'm-norte': [395, 141],
  geladeira: [367, 159], pia: [344, 158], cozinhar: [340, 181], 'reuniao-1': [388, 204], 'r-1': [388, 216],
  vinil: [386, 230], 'm-sul': [400, 236],
  // sala
  'l-sofa': [429, 190], 'sofa-1': [419, 180], 'sofa-2': [419, 202], poltrona: [436, 156], 'l-centro': [442, 212],
  'l-sul': [432, 234], 'poltrona-2': [452, 226], 'l-leste': [458, 180], 'l-ne': [456, 145],
  // canto do banco da janela, corredorzinho do armário "?" e varanda
  'n-entrada': [424, 132], banco: [459, 104], 'poltrona-amarela': [412, 124],
  'm-hall': [395, 120], armario: [394, 66], 'v-janela': [400, 74], 'v-fora': [418, 74], espreguicadeira: [446, 70], parapeito: [466, 50],
  // quarto da Monica
  'mo-porta': [467, 118], 'mo-dentro': [482, 120], 'mo-pe': [510, 140], 'cama-1': [527, 140], penteadeira: [492, 158],
  // quarto da Rachel
  'ra-porta': [469, 184], 'ra-dentro': [486, 192], 'ra-meio': [505, 208], 'cama-2': [541, 214], 'poltrona-ra': [503, 234],
};
const LIGACOES = [
  ['h-19', 'h-meio'], ['h-meio', 'h-20'], ['h-meio', 'h-norte'], ['h-norte', 'escada'], ['h-meio', 'h-sul'],
  ['h-19', 'j-porta'], ['h-20', 'porta'],
  ['j-porta', 'j-cozinha'], ['j-cozinha', 'pia-j'], ['j-porta', 'pebolim-b'], ['j-cozinha', 'j-sul'], ['j-sul', 'pebolim-a'],
  ['j-sul', 'j-centro'], ['j-centro', 'banqueta-1'], ['j-centro', 'banqueta-2'], ['j-centro', 'sofa-j2'], ['sofa-j2', 'sofa-j1'],
  ['j-centro', 'reclinavel-1'], ['reclinavel-1', 'reclinavel-2'], ['j-centro', 'j-oeste'], ['j-oeste', 'sofa-j1'], ['j-oeste', 'j-so'],
  ['j-oeste', 'c-porta'], ['c-porta', 'c-dentro'], ['c-dentro', 'c-sul'], ['c-sul', 'cama-c'],
  ['j-so', 'jo-porta'], ['jo-porta', 'jo-dentro'], ['jo-dentro', 'cama-j'], ['j-so', 'reclinavel-2'],
  ['porta', 'm-foyer'], ['m-foyer', 'm-centro'], ['m-centro', 'm-meio'], ['m-meio', 'm-norte'], ['m-meio', 'geladeira'],
  ['geladeira', 'pia'], ['pia', 'cozinhar'], ['m-centro', 'r-1'], ['r-1', 'reuniao-1'], ['m-centro', 'm-sul'], ['m-sul', 'vinil'],
  ['m-sul', 'l-sul'], ['l-sul', 'l-centro'], ['l-centro', 'l-sofa'], ['l-sofa', 'sofa-1'], ['l-sofa', 'sofa-2'], ['l-centro', 'poltrona-2'],
  ['l-centro', 'l-leste'], ['l-leste', 'l-ne'], ['l-ne', 'poltrona'], ['l-ne', 'n-entrada'], ['n-entrada', 'm-norte'],
  ['n-entrada', 'banco'], ['n-entrada', 'poltrona-amarela'], ['m-norte', 'm-hall'], ['m-hall', 'armario'], ['m-hall', 'v-janela'],
  ['v-janela', 'v-fora'], ['v-fora', 'espreguicadeira'], ['v-fora', 'parapeito'],
  ['l-ne', 'mo-porta'], ['mo-porta', 'mo-dentro'], ['mo-dentro', 'mo-pe'], ['mo-pe', 'cama-1'], ['mo-dentro', 'penteadeira'],
  ['l-leste', 'ra-porta'], ['ra-porta', 'ra-dentro'], ['ra-dentro', 'ra-meio'], ['ra-meio', 'cama-2'], ['ra-meio', 'poltrona-ra'],
];
// cada cadeira de trabalho liga ao corredor atrás dela
const LADOS = [[370, 216, 'm-centro'], [58, 224, 'c-sul'], [437, 132, 'n-entrada'], [520, 220, 'ra-meio']];
MESAS_PLANTA.forEach((m, i) => {
  PLANTA[`mesa-${i}`] = [m.X, m.cadeira];
  PLANTA[`lado-${i}`] = LADOS[i].slice(0, 2);
  LIGACOES.push([`mesa-${i}`, `lado-${i}`], [`lado-${i}`, LADOS[i][2]]);
});
const PONTOS = Object.fromEntries(Object.entries(PLANTA).map(([n, [X, Y]]) => [n, P(X, Y)]));

const LAZER = {
  // Joey e Chandler
  'sofa-j1': { pose: 'sentado', dir: 'frente', icone: 'conversa', tempo: [12, 22] },
  'sofa-j2': { pose: 'sentado', dir: 'frente', icone: 'conversa', tempo: [12, 22] },
  'reclinavel-1': { pose: 'sentado', dir: 'lado', esquerda: true, icone: 'tv', tempo: [14, 24] },
  'reclinavel-2': { pose: 'sentado', dir: 'lado', esquerda: true, icone: 'tv', tempo: [14, 24] },
  'banqueta-1': { pose: 'sentado', dir: 'lado', icone: 'lanche', tempo: [8, 14] },
  'banqueta-2': { pose: 'sentado', dir: 'lado', icone: 'lanche', tempo: [8, 14] },
  'pia-j': { dir: 'costas', icone: 'cafe', tempo: [5, 9] },
  'pebolim-a': { dir: 'lado', icone: 'controle', tempo: [16, 26], par: 'pebolim-b' },
  'pebolim-b': { dir: 'lado', esquerda: true, icone: 'controle', tempo: [16, 26], par: 'pebolim-a' },
  'cama-c': { pose: 'sentado', dir: 'frente', icone: 'cama', tempo: [10, 18] },
  'cama-j': { pose: 'sentado', dir: 'lado', esquerda: true, icone: 'cama', tempo: [10, 18] },
  escada: { dir: 'lado', esquerda: true, icone: 'olho', tempo: [4, 8] },
  // Monica e Rachel
  porta: { dir: 'lado', esquerda: true, icone: 'olho', tempo: [3, 6] },
  geladeira: { dir: 'costas', icone: 'geladeira', tempo: [4, 8] },
  pia: { dir: 'costas', icone: 'cafe', tempo: [5, 10] },
  cozinhar: { dir: 'lado', esquerda: true, icone: 'panela', tempo: [10, 18] },
  vinil: { dir: 'frente', icone: 'musica', tempo: [8, 14] },
  'sofa-1': { pose: 'sentado', dir: 'lado', icone: 'conversa', tempo: [12, 22] },
  'sofa-2': { pose: 'sentado', dir: 'lado', icone: 'conversa', tempo: [12, 22] },
  poltrona: { pose: 'sentado', dir: 'frente', icone: 'livro', tempo: [10, 18] },
  'poltrona-2': { pose: 'sentado', dir: 'lado', esquerda: true, icone: 'conversa', tempo: [10, 18] },
  banco: { pose: 'sentado', dir: 'frente', icone: 'janela', tempo: [8, 14] },
  'poltrona-amarela': { pose: 'sentado', dir: 'lado', icone: 'livro', tempo: [10, 18] },
  armario: { dir: 'costas', icone: 'olho', tempo: [3, 6] },
  espreguicadeira: { pose: 'sentado', dir: 'frente', icone: 'sol', tempo: [10, 18] },
  parapeito: { dir: 'costas', icone: 'janela', tempo: [6, 10] },
  'cama-1': { pose: 'sentado', dir: 'frente', icone: 'cama', tempo: [10, 18] },
  penteadeira: { pose: 'sentado', dir: 'frente', icone: 'espelho', tempo: [5, 9] },
  'cama-2': { pose: 'sentado', dir: 'frente', icone: 'cama', tempo: [10, 18] },
  'poltrona-ra': { pose: 'sentado', dir: 'frente', icone: 'livro', tempo: [10, 18] },
};

// ---------- cenário ----------
const PAREDE = '#2e2638';

function desenhar(c) {
  const R = (x, y, w, h, cor) => { c.fillStyle = cor; c.fillRect(x, y, w, h); };
  // retângulo e elipse nas medidas da planta
  const Q = (X, Y, W, H, cor) => { const x = px(X); R(x, py(Y), Math.max(1, px(X + W) - x), Math.max(1, Math.round(H)), cor); };
  const O = (X, Y, rx, ry, cor) => { c.fillStyle = cor; c.beginPath(); c.ellipse(px(X), py(Y), Math.max(1, rx * SX), Math.max(1, ry), 0, 0, Math.PI * 2); c.fill(); };
  const piso = (X, Y, W, H, a, b) => { Q(X, Y, W, H, a); for (let y = Y + 3; y < Y + H; y += 4) Q(X, y, W, 1, b); };
  const xadrez = (X, Y, W, H, t, a, b) => {
    for (let j = 0; j < H; j += t) for (let i = 0; i < W; i += t) Q(X + i, Y + j, Math.min(t, W - i), Math.min(t, H - j), ((i + j) / t) % 2 ? a : b);
  };
  const parede = (X, Y, W, H) => Q(X, Y, W, H, PAREDE);
  const janela = (X, Y, W, H) => { Q(X, Y, W, H, '#f3efe6'); Q(X + 1, Y + (H > W ? 1 : 0.5), W - 2, Math.max(1, H - 1), '#8fc6e8'); };
  const planta = (X, Y, g = 1) => {
    O(X, Y, 3.5 * g, 3 * g, '#3f9a4a'); O(X - 1, Y - 1, 2 * g, 1.6 * g, '#6fc27a'); O(X + 1.5, Y + 1, 1.5 * g, 1.2 * g, '#2f7a3a');
  };
  const cama = (X, Y, W, H, colcha, cabeceiraEmCima = true) => {
    Q(X, Y, W, H, '#7a5232'); Q(X + 1, Y + 1, W - 2, H - 2, colcha);
    if (cabeceiraEmCima) { Q(X + 1, Y + 1, W - 2, 8, '#f6f2ea'); Q(X + 3, Y + 2, W / 2 - 4, 5, '#ffffff'); Q(X + W / 2 + 1, Y + 2, W / 2 - 4, 5, '#ffffff'); }
    else { Q(X + 1, Y + 1, 9, H - 2, '#f6f2ea'); Q(X + 2, Y + 3, 6, H / 2 - 4, '#ffffff'); Q(X + 2, Y + H / 2 + 1, 6, H / 2 - 4, '#ffffff'); }
  };
  const criado = (X, Y) => { Q(X, Y, 7, 7, '#9a6a3a'); O(X + 3.5, Y + 3.5, 2, 2, '#f6dc8a'); };
  const algarismos = { 1: ['010', '110', '010', '010', '111'], 9: ['111', '101', '111', '001', '111'], 2: ['111', '001', '111', '100', '111'], 0: ['111', '101', '101', '101', '111'] };
  const numero = (texto, x, y, cor) => [...texto].forEach((d, k) => algarismos[d].forEach((l, j) => [...l].forEach((p, i) => p === '1' && R(x + k * 4 + i, y + j, 1, 1, cor))));

  // ----- lá fora: a cidade vista de cima -----
  R(0, 0, LARGURA, ALTURA, '#4d5567');
  for (let y = 0; y < ALTURA; y += 3) for (let x = 0; x < LARGURA; x += 3) if (((x * 7 + y * 11) >> 1) % 9 === 0) R(x, y, 1, 1, '#566078');

  // ----- pisos -----
  // Joey e Chandler
  piso(124, 157, 140, 115, '#e6cdb0', '#d9bc9c');            // sala, cozinha e pebolim
  piso(186, 148, 12, 10, '#e6cdb0', '#d9bc9c');
  piso(32, 174, 90, 84, '#dcc0a0', '#cdae8c');               // quarto do Chandler
  piso(32, 258, 90, 38, '#dcc0a0', '#cdae8c');               // quarto do Joey
  xadrez(185, 102, 39, 48, 4, '#dfeaf0', '#c9dbe6');         // banheiro deles
  // corredor do prédio e escada
  piso(262, 140, 52, 160, '#d4cbbb', '#c6bba8');
  Q(199, 141, 64, 52, '#bfb4a2');
  for (let X = 203; X < 260; X += 5) Q(X, 143, 3, 48, '#d8cfbe');
  Q(199, 165, 64, 3, '#a89c88'); Q(228, 143, 6, 48, '#a89c88');
  // Monica e Rachel
  piso(316, 139, 152, 106, '#f0dcd2', '#e5cbbf');            // sala, cozinha e jantar
  piso(406, 89, 60, 50, '#f0dcd2', '#e5cbbf');               // canto do banco da janela
  piso(380, 57, 27, 82, '#f0dcd2', '#e5cbbf');               // corredorzinho do armário
  piso(316, 218, 64, 38, '#f0dcd2', '#e5cbbf');              // entrada
  piso(380, 32, 27, 24, '#cdb39a', '#c0a48a');               // o armário "?"
  xadrez(336, 88, 43, 50, 4, '#f6f6f6', '#2b2b33');          // banheiro xadrez
  piso(469, 86, 93, 81, '#ecd6d6', '#e0c4c4');               // quarto da Monica
  piso(471, 170, 91, 77, '#e9dccb', '#ddccb6');              // quarto da Rachel
  xadrez(410, 39, 67, 48, 5, '#d8d3ca', '#cbc5ba');          // varanda

  // ----- paredes (escuras, como na planta) -----
  // Joey e Chandler
  parede(29, 171, 95, 4); parede(29, 171, 4, 128); parede(29, 295, 96, 4); parede(33, 256, 88, 3);
  parede(120, 155, 4, 44); parede(120, 215, 4, 46); parede(120, 277, 4, 22);
  parede(120, 154, 66, 4); parede(182, 99, 4, 59); parede(182, 99, 45, 4); parede(223, 99, 4, 43);
  parede(186, 148, 3, 3); parede(202, 148, 22, 3);
  parede(196, 138, 4, 58); parede(196, 138, 67, 4); parede(200, 193, 63, 3);
  parede(262, 195, 4, 25); parede(262, 238, 4, 36); parede(124, 271, 142, 3);
  janela(52, 171, 22, 3); janela(86, 171, 22, 3); janela(134, 154, 16, 3); janela(158, 154, 18, 3); janela(182, 112, 3, 12);
  // corredor do prédio: parede do fundo
  parede(262, 136, 52, 4);
  // Monica e Rachel
  parede(309, 140, 9, 65); parede(309, 224, 9, 38); parede(313, 255, 70, 4); parede(378, 243, 4, 16);
  parede(380, 243, 92, 4);
  for (let k = 0; k < 6; k += 1) parede(318 + k * 3, 140 - k * 2, 4, 4);
  parede(333, 84, 4, 56); parede(333, 84, 49, 4); parede(337, 137, 43, 4); parede(378, 28, 4, 92); parede(378, 132, 4, 9);
  parede(378, 28, 32, 4); parede(406, 28, 4, 38); parede(406, 80, 4, 11); parede(382, 55, 6, 3); parede(400, 55, 6, 3);
  parede(406, 87, 63, 4); janela(412, 87, 52, 3); janela(406, 66, 3, 14);
  parede(465, 82, 4, 28); parede(465, 126, 4, 50); parede(465, 192, 4, 55); parede(465, 82, 100, 4); parede(561, 82, 4, 168);
  parede(469, 166, 92, 4); parede(465, 246, 100, 4);
  janela(561, 120, 3, 18); janela(561, 196, 3, 18); janela(334, 98, 3, 12);
  // grade da varanda e escada de incêndio
  Q(410, 37, 68, 1.5, '#1f2430'); Q(476, 37, 1.5, 51, '#1f2430'); Q(414, 38, 10, 12, '#3a3f4f'); for (let Y = 40; Y < 50; Y += 3) Q(414, Y, 10, 1, '#6b7184');

  // portas 19 e 20 (abertas, com o número do lado de fora)
  Q(262, 220, 4, 18, '#6e3aa8'); numero('19', px(266) + 1, py(240), '#f2c230');
  Q(309, 205, 9, 19, '#6e3aa8'); Q(312, 212, 3, 4, '#f2c230'); Q(313, 213, 1, 2, '#2a1a3a'); numero('20', px(298), py(226), '#f2c230');

  // ----- Joey e Chandler: móveis -----
  // sofá amarelo encostado na parede de cima, mesinha, luminária
  Q(137, 159, 42, 6, '#d9b23a'); Q(137, 164, 42, 18, '#f2cf5a'); Q(137, 164, 3, 18, '#d9b23a'); Q(176, 164, 3, 18, '#d9b23a');
  Q(157, 166, 1, 14, '#d9b23a'); Q(143, 166, 6, 5, '#7fbf6a');
  Q(128, 161, 8, 8, '#9a6a3a'); O(183, 168, 4, 4, '#5a5f6e'); O(183, 168, 2, 2, '#f6dc8a');
  Q(147, 193, 23, 10, '#9fd2e8'); Q(148, 194, 21, 8, '#c4e6f4'); Q(162, 196, 5, 3, '#4a7fc4');            // mesa de centro de vidro
  // TV na parede da esquerda, poltronas reclináveis viradas para ela, mesinha entre elas
  Q(124, 220, 9, 36, '#d9dde8'); Q(125, 226, 5, 24, '#1d2130');
  O(181, 245, 11, 9, '#c86a4a'); O(181, 245, 8, 6, '#e08a6a'); O(173, 238, 4, 3, '#c86a4a');
  O(158, 266, 11, 9, '#c86a4a'); O(158, 266, 8, 6, '#e08a6a'); O(150, 259, 4, 3, '#c86a4a');
  O(177, 259, 3, 3, '#9fd2e8');
  // cozinha: bancada com pia embaixo da escada, península, banquetas verdes
  Q(214, 196, 48, 12, '#efe9dc'); Q(214, 206, 48, 2, '#c9bda5'); Q(230, 198, 14, 7, '#a9b4c2'); Q(231, 199, 12, 5, '#d6e8f4');
  Q(250, 198, 10, 8, '#efe9dc'); Q(252, 199, 6, 6, '#3a3a44');
  Q(205, 196, 11, 40, '#efe9dc'); Q(205, 196, 2, 40, '#c9bda5'); Q(206, 232, 9, 6, '#c86a4a');
  O(198, 207, 4, 3, '#4a8f4a'); O(198, 222, 4, 3, '#4a8f4a');
  // pebolim com as cadeiras amarelas
  Q(222, 242, 26, 28, '#5a3a24'); Q(224, 244, 22, 24, '#4aa84a'); for (let Y = 247; Y < 268; Y += 4) Q(222, Y, 26, 1, '#c9c9d2');
  Q(234, 244, 2, 24, '#f6f8fb');
  Q(196, 260, 16, 8, '#9a6a3a'); planta(190, 262, 1);
  planta(243, 180, 0.8); planta(250, 232, 0.8);
  // banheiro deles: banheira, vaso, pia
  O(200, 112, 13, 6, '#ffffff'); O(200, 112, 10, 4, '#bfe2f4'); Q(208, 128, 8, 10, '#ffffff'); O(212, 127, 4, 3, '#f2f6f8');
  Q(213, 106, 7, 8, '#ffffff'); Q(214, 107, 5, 5, '#d6e8f4');
  // quarto do Chandler: cama azul, criados, escrivaninha, cômoda
  cama(68, 180, 32, 44, '#4a90d0'); criado(59, 180); criado(102, 180);
  Q(48, 240, 34, 14, '#efe9dc'); Q(48, 252, 34, 2, '#c9bda5'); Q(85, 242, 30, 12, '#9a5a34'); Q(87, 244, 12, 8, '#b98654'); Q(100, 244, 12, 8, '#b98654');
  Q(36, 196, 4, 16, '#e2b24a');
  // quarto do Joey: cama laranja de lado, cômoda, poltrona redonda
  cama(36, 266, 40, 26, '#e88a4a', false); Q(57, 260, 40, 6, '#9a5a34'); O(108, 288, 6, 5, '#e0703a'); Q(108, 264, 10, 14, '#b98654');

  // ----- Monica e Rachel: móveis -----
  // cozinha no canto em ângulo: bancada laranja, geladeira, fogão na bancada turquesa da parede
  Q(336, 141, 40, 9, '#d98a3a'); Q(338, 142, 10, 6, '#a9b4c2'); Q(339, 143, 8, 4, '#d6e8f4');
  Q(360, 137, 15, 14, '#fbf5e6'); Q(361, 138, 13, 5, '#ffffff'); Q(372, 140, 1, 8, '#a89f8a');
  Q(318, 150, 12, 52, '#5fc4cf'); Q(318, 150, 12, 2, '#86d8e0'); Q(320, 172, 9, 14, '#3a3a44');
  for (const Y of [175, 182]) { O(322, Y, 1.6, 1.6, '#202028'); O(327, Y, 1.6, 1.6, '#202028'); }
  Q(318, 200, 34, 8, '#5fc4cf'); Q(318, 200, 34, 2, '#86d8e0'); Q(335, 202, 8, 4, '#ffffff');
  Q(336, 153, 10, 6, '#9fd2e8');
  // mesa redonda com tapete redondo e quatro cadeiras
  O(379, 187, 22, 19, '#f6efe6'); O(379, 187, 21, 18, '#efe2d4');
  for (const [X, Y] of [[367, 176], [391, 176], [370, 202], [388, 202]]) O(X, Y, 4, 4, '#e8b4b4');
  O(379, 187, 12, 11, '#d98a3a'); O(379, 187, 10, 9, '#e8a050'); O(379, 187, 2, 2, '#4a9fb0');
  // sofá claro (virado para a direita) com almofadas, mesinha, banquinho turquesa, tapete
  Q(426, 158, 36, 70, '#f3ecf4'); Q(427, 159, 34, 68, '#ebe0f0');
  for (let Y = 162; Y < 226; Y += 8) for (let X = 430; X < 460; X += 8) Q(X, Y, 1, 1, '#bfe2f4');
  Q(404, 160, 6, 48, '#d9d0e2'); Q(410, 162, 12, 44, '#ece6f2'); Q(404, 160, 18, 3, '#d9d0e2'); Q(404, 205, 18, 3, '#d9d0e2');
  Q(412, 168, 6, 7, '#e8564f'); Q(412, 196, 6, 7, '#9a6ad0');
  Q(407, 152, 12, 7, '#c86a4a'); Q(407, 211, 13, 13, '#5fc4cf'); Q(409, 213, 9, 9, '#9fe0e6');
  Q(433, 176, 18, 19, '#d9a23a'); Q(434, 177, 16, 17, '#f2c84b'); Q(438, 184, 2, 2, '#5a3a24'); Q(444, 188, 2, 2, '#5a3a24');
  // poltrona virada para baixo, cadeira verde e rosa, cômoda baixa, vitrola
  Q(427, 138, 18, 15, '#e9dcc4'); Q(430, 141, 12, 9, '#f6efe0'); Q(447, 140, 6, 8, '#c86a4a');
  O(452, 224, 7, 6, '#4aa86a'); O(462, 234, 7, 6, '#f0a0a8');
  Q(432, 236, 22, 7, '#d9a23a'); O(386, 236, 5, 4, '#2b2b33'); O(386, 236, 1.5, 1.5, '#e8564f');
  planta(458, 140, 1); planta(420, 240, 0.9);
  // entrada: tapete, aparador e duas cadeiras
  Q(322, 222, 30, 18, '#e6f0f0'); Q(324, 224, 26, 14, '#d2e6e8'); Q(337, 244, 24, 8, '#ffffff'); Q(339, 246, 6, 3, '#2b2b33');
  O(327, 247, 4, 4, '#e8b4b4'); O(369, 247, 4, 4, '#e8b4b4');
  // canto do banco da janela: banco com almofadas, mesinha com cadeira rosa, poltrona amarela, tapete
  Q(410, 91, 56, 10, '#b8a6d4'); for (let X = 412; X < 464; X += 9) Q(X, 92, 7, 7, ['#9a6ad0', '#f2c84b', '#e8564f', '#7fbf6a', '#ffffff', '#9a6ad0'][((X - 412) / 9) % 6]);
  Q(424, 102, 26, 8, '#d9a23a'); Q(425, 103, 24, 6, '#f2c06a'); O(437, 116, 5, 4, '#e0407a');
  O(412, 116, 7, 8, '#f2d25a'); O(413, 117, 5, 6, '#fbe48a');
  // corredorzinho do armário: estante verde, planta
  Q(383, 66, 8, 22, '#6fbf8a'); Q(384, 67, 6, 20, '#8fd8a8'); planta(402, 62, 0.8);
  // banheiro xadrez: banheira oval, vaso, pia, toalha
  O(356, 128, 16, 7, '#ffffff'); O(356, 128, 13, 5, '#bfe2f4'); Q(341, 91, 8, 9, '#ffffff'); O(345, 101, 4, 3, '#f2f6f8');
  Q(360, 90, 10, 8, '#ffffff'); Q(361, 91, 8, 5, '#d6e8f4'); O(347, 115, 3, 3, '#f2c230');
  // varanda: espreguiçadeira e vasos
  Q(434, 66, 26, 7, '#e9dcc4'); Q(436, 67, 22, 5, '#ffffff'); Q(434, 66, 4, 7, '#c8b896');
  planta(470, 82, 0.9); planta(416, 82, 0.8);
  // quarto da Monica: cama rosa, criados, banco ao pé da cama, cômoda, poltrona rosa
  cama(507, 89, 40, 40, '#f0b8d8'); criado(498, 89); criado(548, 89); Q(518, 131, 18, 6, '#f2d25a');
  Q(513, 152, 32, 12, '#9a6a3a'); O(522, 158, 3, 3, '#ffffff'); O(535, 158, 3, 3, '#ffffff');
  O(492, 160, 6, 5, '#e0407a'); Q(470, 150, 8, 16, '#9a6a3a'); planta(478, 155, 0.8); planta(554, 158, 0.8);
  // quarto da Rachel: cama, criado, poltrona redonda, cômoda, escrivaninha com cadeira verde
  cama(524, 172, 34, 34, '#f6efe0'); Q(525, 173, 32, 8, '#c8d890'); criado(514, 172);
  O(503, 230, 9, 8, '#f6efe0'); O(503, 230, 6, 5, '#e8e0c8'); Q(474, 212, 10, 26, '#e2b24a'); Q(476, 214, 6, 22, '#f2c84b');
  Q(522, 234, 36, 10, '#9a6a3a'); Q(523, 235, 34, 8, '#c8905a'); O(540, 226, 4, 3, '#a8c840');
  O(496, 184, 5, 5, '#2b2b33');
  // notebooks e monitores nos lugares de trabalho (a tela acende por cima, em mapa.js)
  MESAS.forEach(m => {
    const ty = m.telaY ?? m.y - 8;
    R(m.x - 8, ty - 1, 16, 10, '#2b3242'); R(m.x - 7, ty, 14, 8, '#414c63');
    if (!m.dir) { R(m.x - 9, ty + 9, 18, 3, '#9aa3b2'); R(m.x - 8, ty + 10, 16, 1, '#c4ccd9'); }
  });
}

// ---------- o que mexe ----------
function animar(q, { figuras, tique }) {
  const em = nome => figuras.some(f => !f.caminho.length && f.noPonto === nome);
  const R = (x, y, w, h, cor) => { q.fillStyle = cor; q.fillRect(x, y, w, h); };
  // TV do Joey: um jogo de futebol americano passando para quem está nas poltronas
  if (em('reclinavel-1') || em('reclinavel-2')) {
    const x = px(125), y = py(226), h = 24;
    R(x, y, 4, h, '#3a8a3a');
    for (let k = 0; k < h; k += 6) R(x, y + k, 4, 1, '#ffffff');
    R(x + 1, y + ((tique * 2) % h), 2, 2, tique % 2 ? '#e8564f' : '#f2c84b');
  }
  // pebolim: a bolinha corre de um lado para o outro quando a dupla está jogando
  if (em('pebolim-a') && em('pebolim-b')) {
    const x0 = px(225), x1 = px(245), fase = (tique % 12) / 12, ida = fase < 0.5 ? fase * 2 : 2 - fase * 2;
    R(Math.round(x0 + (x1 - x0) * ida), py(254) + ((tique % 3) - 1), 2, 2, '#ffffff');
  }
  // vitrola, fogão e vapor
  if (em('vinil')) {
    const a = (tique % 8) * (Math.PI / 4);
    R(Math.round(px(386) + Math.cos(a) * 3), Math.round(py(236) + Math.sin(a) * 3), 1, 1, '#e8564f');
    R(px(392), py(228) - (tique % 6), 1, 1, '#f2c84b');
  }
  if (em('cozinhar')) {
    R(px(321), py(174), 2, 2, tique % 2 ? '#ff8f3a' : '#ffd25a'); R(px(326), py(181), 2, 2, tique % 2 ? '#ffd25a' : '#ff8f3a');
    R(px(324) + (tique % 3), py(168) - (tique % 4), 1, 2, '#ffffffaa');
  }
  if (em('pia') || em('pia-j')) R(px(em('pia') ? 343 : 237) + (tique % 2), py(em('pia') ? 140 : 195) - (tique % 3), 1, 2, '#ffffffaa');
}

export default {
  id: 'apartamento',
  nome: 'Apartamentos 19 e 20',
  descricao: 'Mapa dos dois apartamentos vistos de cima: à esquerda o do Joey e do Chandler (19), no meio o corredor com a escada, à direita o da Monica e da Rachel (20), com cozinha, mesa redonda, sala, banheiro, armário, varanda e os quartos',
  fundo: '#c9b6e8',
  zonas: [
    ['Joey e Chandler', px(195), py(282)], ['Monica e Rachel', px(425), py(256)], ['Corredor', px(288), py(290)], ['Varanda', px(444), py(48)],
    ['Chandler', px(76), py(162)], ['Joey', px(98), py(293)], ['Monica', px(514), py(76)], ['Rachel', px(512), py(256)],
  ],
  mesas: MESAS, pontos: PONTOS, ligacoes: LIGACOES, lazer: LAZER,
  moradia: ['sofa-j1', 'sofa-1', 'poltrona', 'sofa-j2', 'banco', 'm-centro'],
  reuniao: ['reuniao-1'],
  telasDeJogo: ['reclinavel-1', 'reclinavel-2'],
  par: { a: 'pebolim-a', b: 'pebolim-b', raquete: false, bola: null },
  desenhar,
  animar,
};
