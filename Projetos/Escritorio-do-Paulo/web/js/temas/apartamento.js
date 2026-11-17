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
  { X: 373, Y: 190, cadeira: 201 },                                      // mesa redonda da Monica (cadeira de baixo, à esquerda)
  { X: 66, Y: 242, cadeira: 236, dir: 'frente', telaY: 244 },            // escrivaninha do Chandler
  { X: 437, Y: 110, cadeira: 121 },                                      // mesinha do banco da janela (cadeira rosa)
  { X: 537, Y: 232, cadeira: 230, dir: 'frente', telaY: 234 },           // escrivaninha da Rachel (cadeira verde)
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
  porta: [321, 224], 'm-foyer': [346, 231], 'm-centro': [384, 218], 'm-passagem': [399, 210], 'm-meio': [399, 165], 'm-norte': [396, 141],
  geladeira: [369, 161], pia: [341, 157], cozinhar: [342, 190], 'k-meio': [357, 187], 'k-sul': [358, 214], 'reuniao-1': [390, 202], 'r-1': [391, 214],
  vinil: [387, 227], 'm-sul': [399, 232],
  // banheiro (pela porta do corredorzinho)
  'b-porta': [383, 112], 'pia-banho': [366, 104],
  // sala
  'l-sul': [426, 230], 'l-centro': [437, 206], 'l-sofa': [428, 199], 'sofa-1': [416, 184], 'sofa-2': [416, 201],
  'poltrona-2': [451, 222], 'poltrona-rosa': [461, 232], 'l-leste': [459, 190], 'l-ne': [459, 160], poltrona: [436, 154],
  // canto do banco da janela, corredorzinho do armário "?" e varanda
  'n-entrada': [424, 132], 'n-leste': [460, 126], banco: [459, 102], 'poltrona-amarela': [414, 121],
  'm-hall': [394, 120], armario: [393, 68], 'v-janela': [403, 76], 'v-fora': [420, 70], espreguicadeira: [440, 73], parapeito: [452, 52],
  // quarto da Monica
  'mo-porta': [477, 127], 'mo-dentro': [489, 128], 'cama-1': [520, 124], penteadeira: [490, 159],
  // quarto da Rachel
  'ra-porta': [475, 188], 'ra-dentro': [487, 190], 'ra-meio': [492, 208], 'ra-sul': [517, 214], 'cama-2': [532, 207], 'poltrona-ra': [496, 239],
};
const LIGACOES = [
  ['h-19', 'h-meio'], ['h-meio', 'h-20'], ['h-meio', 'h-norte'], ['h-norte', 'escada'], ['h-meio', 'h-sul'],
  ['h-19', 'j-porta'], ['h-20', 'porta'],
  ['j-porta', 'j-cozinha'], ['j-cozinha', 'pia-j'], ['j-porta', 'pebolim-b'], ['j-cozinha', 'j-sul'], ['j-sul', 'pebolim-a'],
  ['j-sul', 'j-centro'], ['j-centro', 'banqueta-1'], ['j-centro', 'banqueta-2'], ['j-centro', 'sofa-j2'], ['sofa-j2', 'sofa-j1'],
  ['j-centro', 'reclinavel-1'], ['reclinavel-1', 'reclinavel-2'], ['j-centro', 'j-oeste'], ['j-oeste', 'sofa-j1'], ['j-oeste', 'j-so'],
  ['j-oeste', 'c-porta'], ['c-porta', 'c-dentro'], ['c-dentro', 'c-sul'], ['c-sul', 'cama-c'],
  ['j-so', 'jo-porta'], ['jo-porta', 'jo-dentro'], ['jo-dentro', 'cama-j'], ['j-so', 'reclinavel-2'],
  ['porta', 'm-foyer'], ['m-foyer', 'm-centro'], ['m-centro', 'm-passagem'], ['m-passagem', 'm-meio'], ['m-meio', 'm-norte'],
  ['m-meio', 'geladeira'], ['geladeira', 'pia'], ['cozinhar', 'k-meio'], ['k-meio', 'k-sul'], ['k-sul', 'm-centro'], ['k-sul', 'm-foyer'], ['m-centro', 'r-1'], ['r-1', 'reuniao-1'],
  ['m-centro', 'm-sul'], ['m-sul', 'vinil'], ['m-sul', 'l-sul'], ['l-sul', 'l-centro'], ['l-centro', 'l-sofa'], ['l-sofa', 'sofa-1'],
  ['l-sofa', 'sofa-2'], ['l-centro', 'poltrona-2'], ['l-sul', 'poltrona-rosa'], ['l-centro', 'l-leste'], ['l-leste', 'l-ne'],
  ['l-ne', 'poltrona'], ['l-ne', 'n-leste'], ['n-leste', 'n-entrada'], ['n-entrada', 'm-norte'], ['n-leste', 'banco'],
  ['n-entrada', 'poltrona-amarela'], ['m-norte', 'm-hall'], ['m-hall', 'b-porta'], ['b-porta', 'pia-banho'], ['m-hall', 'armario'],
  ['m-hall', 'v-janela'], ['v-janela', 'v-fora'], ['v-fora', 'espreguicadeira'], ['v-fora', 'parapeito'],
  ['n-leste', 'mo-porta'], ['mo-porta', 'mo-dentro'], ['mo-dentro', 'cama-1'], ['mo-dentro', 'penteadeira'],
  ['l-leste', 'ra-porta'], ['ra-porta', 'ra-dentro'], ['ra-dentro', 'ra-meio'], ['ra-meio', 'ra-sul'], ['ra-sul', 'cama-2'], ['ra-meio', 'poltrona-ra'],
];
// cada cadeira de trabalho liga ao corredor atrás dela
const LADOS = [[372, 214, 'm-centro'], [58, 224, 'c-sul'], [437, 132, 'n-entrada'], [522, 222, 'ra-sul']];
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
  'pia-banho': { dir: 'costas', icone: 'espelho', tempo: [4, 8] },
  'sofa-1': { pose: 'sentado', dir: 'lado', icone: 'conversa', tempo: [12, 22] },
  'sofa-2': { pose: 'sentado', dir: 'lado', icone: 'conversa', tempo: [12, 22] },
  poltrona: { pose: 'sentado', dir: 'frente', icone: 'livro', tempo: [10, 18] },
  'poltrona-2': { pose: 'sentado', dir: 'lado', esquerda: true, icone: 'conversa', tempo: [10, 18] },
  'poltrona-rosa': { pose: 'sentado', dir: 'lado', esquerda: true, icone: 'conversa', tempo: [10, 18] },
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
  // retângulo girado (graus) pixel a pixel, sem borrar: carrinho, pia do canto, poltronas tortas
  const girado = (Xc, Yc, W, H, graus, cor) => {
    const a = graus * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a), r = Math.hypot(W, H) / 2 + 1;
    c.fillStyle = cor;
    for (let y = py(Yc - r); y <= py(Yc + r); y += 1) for (let x = px(Xc - r); x <= px(Xc + r); x += 1) {
      const dX = (x + 0.5) / SX + 25 - Xc, dY = y + 0.5 + 30 - Yc;
      if (Math.abs(dX * cs + dY * sn) <= W / 2 && Math.abs(-dX * sn + dY * cs) <= H / 2) c.fillRect(x, y, 1, 1);
    }
  };
  const interrogacao = (x, y, cor) => ['111', '001', '011', '000', '010'].forEach((l, j) => [...l].forEach((p, i) => p === '1' && R(x + i, y + j, 1, 1, cor)));

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
  piso(315, 141, 163, 104, '#f0dcd2', '#e5cbbf');            // cozinha, jantar e sala
  piso(408, 91, 70, 50, '#f0dcd2', '#e5cbbf');               // canto do banco da janela
  piso(380, 61, 28, 81, '#f0dcd2', '#e5cbbf');               // corredorzinho do armário
  piso(315, 209, 66, 46, '#f0dcd2', '#e5cbbf');              // entrada
  Q(381, 137, 85, 1, '#dcc2b4');                             // degrau entre o canto da janela e a sala
  piso(381, 34, 27, 27, '#cdb39a', '#c0a48a');               // o armário "?"
  xadrez(343, 91, 34, 28, 4, '#f6f6f6', '#4a4a56');          // banheiro xadrez
  xadrez(343, 119, 34, 18, 4, '#d8c8e8', '#a88ac4');         // e o lilás em volta da banheira
  piso(476, 169, 84, 77, '#e9dccb', '#ddccb6');              // quarto da Rachel
  piso(479, 91, 81, 85, '#ecd6d6', '#e0c4c4');               // quarto da Monica (com o canto da penteadeira)
  xadrez(415, 44, 57, 42, 5, '#d8d3ca', '#cbc5ba');          // varanda

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
  // cozinha: parede grossa da esquerda e a quina em diagonal, com janela
  parede(309, 140, 13, 74);
  for (let Y = 140; Y < 158; Y += 1) {
    const xe = px(338 - (Y - 140)); R(px(309), py(Y), xe - px(309), 1, PAREDE);
    if (Y >= 142 && Y < 156) { R(xe - 4, py(Y), 1, 1, '#f3efe6'); R(xe - 3, py(Y), 2, 1, '#8fc6e8'); }
  }
  parede(309, 234, 6, 24); parede(309, 253, 72, 5); parede(377, 228, 4, 30);                        // entrada
  parede(380, 242, 96, 5); parede(472, 245, 93, 5);                                                   // fundo da sala e da Rachel
  parede(335, 87, 8, 55); parede(335, 87, 46, 4); parede(343, 137, 38, 5); janela(335, 105, 4, 13);    // banheiro
  parede(377, 26, 4, 78); parede(377, 119, 4, 26); Q(377, 104, 4, 15, '#ebd3c8'); Q(377, 145, 3, 12, '#9a6a3a');   // porta do banheiro e batente
  parede(374, 26, 41, 8); parede(408, 26, 7, 45); janela(408, 71, 7, 11); parede(408, 82, 11, 21);    // armário e corredorzinho
  parede(398, 60, 10, 4); Q(382, 60, 16, 2, '#9a6a3a');                                              // porta do armário
  parede(415, 86, 50, 5); janela(419, 86, 41, 4);                                                    // janela do banco
  parede(465, 79, 15, 24); parede(480, 85, 23, 17); parede(503, 85, 62, 6); parede(560, 85, 5, 165);
  janela(561, 131, 4, 18); janela(561, 201, 4, 18);
  parede(475, 103, 4, 16); parede(475, 134, 4, 45); parede(475, 175, 30, 4);                        // quarto da Monica: porta e canto
  parede(501, 165, 59, 4); parede(501, 165, 5, 14); parede(501, 179, 2, 22);                        // entre os quartos
  parede(472, 196, 4, 51);                                                                            // quarto da Rachel: porta acima
  // grade da varanda e escada de incêndio
  Q(415, 43, 58, 1.5, '#1f2430'); Q(471.5, 43, 1.5, 43, '#1f2430'); Q(423, 39, 9, 12, '#3a3f4f'); for (let Y = 41; Y < 51; Y += 3) Q(423, Y, 9, 1, '#6b7184');

  // portas 19 e 20 (abertas, com o número do lado de fora)
  Q(262, 220, 4, 18, '#6e3aa8'); numero('19', px(266) + 1, py(240), '#f2c230');
  Q(309, 214, 6, 20, '#6e3aa8'); Q(311, 221, 2.5, 4, '#f2c230'); Q(312, 222, 1, 2, '#2a1a3a'); numero('20', px(298), py(226), '#f2c230');

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
  // cozinha em ângulo: bancada laranja com a pia no canto, armário e geladeira; bancada turquesa com o fogão; carrinho branco
  for (let Y = 142; Y < 181; Y += 1) {
    const ini = Y < 158 ? Math.max(322, 338 - (Y - 140)) : Y < 160 ? 323 : 330;
    const fim = Y < 150 ? 350 : Y < 158 ? 350 - (Y - 150) * 1.75 : 336;
    Q(ini, Y, fim - ini, 1, '#d98a3a');
  }
  girado(334, 153, 8, 8, 45, '#a9b4c2'); girado(334, 153, 6, 6, 45, '#d6e8f4');
  Q(350, 142, 10, 12, '#9a6a3a'); Q(352, 144, 6, 7, '#4a4650');
  Q(361, 142, 16, 15, '#c9c2b0'); Q(362, 142, 14, 14, '#fbf8f0'); Q(362, 146, 14, 1, '#d8d0bc');
  Q(323, 160, 7, 40, '#5fc4cf'); Q(323, 160, 2, 40, '#86d8e0');
  Q(323, 200, 29, 9, '#5fc4cf'); Q(323, 200, 29, 2, '#86d8e0'); O(327, 205, 2.4, 2.4, '#ffffff'); O(327, 205, 1.2, 1.2, '#a9b4c2');
  Q(332, 203, 1.5, 3, '#ffffff'); Q(335, 203, 1.5, 3, '#ffffff');
  Q(330, 183, 7, 15, '#3a3a44'); for (const Y of [186, 194]) { O(332, Y, 1.5, 1.5, '#15151c'); O(335.5, Y, 1.5, 1.5, '#15151c'); }
  girado(346, 167, 10, 10, 30, '#c9cfd8'); girado(346, 167, 8, 8, 30, '#f6f8fb');
  O(386, 146, 4, 6.5, '#d9b23a'); O(386, 146, 3, 5.5, '#f2d25a');                     // pufe amarelo
  // mesa redonda com tapete redondo e quatro cadeiras em X
  O(382, 187, 22, 20, '#f6efe6'); O(382, 187, 21, 19, '#efe2d4');
  for (const [X, Y] of [[367, 175], [390, 175], [370, 197], [391, 196]]) { O(X, Y, 4, 4, '#c89a9a'); O(X, Y, 3, 3, '#f0c8c4'); }
  O(380, 187, 10, 9, '#d98a3a'); O(380, 187, 8.5, 7.5, '#e8a050'); O(380, 187, 2, 2, '#4a9fb0');
  // sala: tapete grande, sofá virado para a direita com almofadas, mesinha com abajur, banquinho turquesa, mesa de centro
  Q(413, 150, 51, 80, '#f6f0f6'); Q(414, 151, 49, 78, '#ece2f0');
  for (let Y = 156; Y < 228; Y += 8) for (let X = 418; X < 462; X += 8) Q(X, Y, 1, 1, '#bfe2f4');
  Q(404, 164, 19, 43, '#d9d0e2'); Q(409, 167, 13, 37, '#f3eef7'); Q(409, 185, 13, 1, '#d9d0e2');
  Q(411, 168, 6, 6, '#9a6ad0'); Q(411, 175, 6, 6, '#e0407a'); Q(411, 197, 6, 6, '#9a6ad0');
  Q(407, 156, 13, 8, '#c86a4a'); O(413.5, 160, 2.5, 2.5, '#f6efe0');
  Q(407, 210, 14, 14, '#5fc4cf'); Q(409, 212, 10, 10, '#9fe0e6');
  Q(432, 176, 19, 19, '#d9a23a'); Q(433, 177, 17, 17, '#f2c84b'); O(437, 181, 2, 2, '#ffffff'); Q(440, 188, 2, 2, '#5a3a24'); Q(444, 190, 2, 2, '#5a3a24');
  // poltrona de cima com a mesinha, armário com planta, cadeiras verde e rosa, mesinha redonda, aparador, vitrola
  Q(427, 136, 20, 19, '#d9c8a8'); Q(428, 137, 18, 17, '#efe4cc'); Q(431, 140, 12, 11, '#f8f2e4'); Q(435, 143, 5, 4, '#9a6ad0');
  Q(448, 140, 7, 11, '#c86a4a'); O(451.5, 144, 1.5, 1.5, '#f6dc8a');
  Q(466, 143, 9, 29, '#7a5232'); Q(467, 144, 7, 27, '#9a6a3a'); Q(468, 158, 5, 8, '#5a5f6e'); planta(470.5, 139, 0.9);
  O(451, 218, 6.5, 6.5, '#2f8a52'); O(451, 218, 5.5, 5.5, '#4aa86a');
  O(461, 228, 8, 8, '#d88890'); O(461, 228, 7, 7, '#f0a0a8');
  O(466, 208, 3.5, 3.5, '#7a5232'); O(466, 208, 2.5, 2.5, '#9a6a3a');
  Q(432, 236, 19, 7, '#d9a23a'); Q(433, 237, 17, 5, '#f2c06a'); Q(453, 240, 11, 2, '#a9b0bc'); O(467, 240, 2, 2, '#f2d25a');
  O(386, 234, 5, 4.5, '#2b2b33'); O(386, 234, 1.5, 1.5, '#e8564f');
  planta(419, 238, 0.9);
  // entrada: tapete, aparador branco e duas cadeiras
  Q(334, 220, 27, 23, '#cfe2e4'); Q(335, 221, 25, 21, '#e6f2f2'); O(347.5, 231.5, 6, 6, '#bcd8dc'); O(347.5, 231.5, 5, 5, '#e6f2f2');
  Q(336, 243, 25, 9, '#c9c2b0'); Q(337, 243, 23, 8, '#ffffff'); O(342, 247, 2.5, 2.5, '#2b2b33'); O(342, 247, 1, 1, '#ffffff');
  Q(350, 246, 2, 2, '#a9b4c2'); Q(353, 246, 2, 2, '#a9b4c2');
  for (const X of [326.5, 368.5]) { O(X, 247.5, 4, 4, '#c89a9a'); O(X, 247.5, 3, 3, '#f0c8c4'); }
  // banheiro: vaso, pia, tapetinho e a banheira oval
  Q(347, 91, 9, 4, '#dde8ee'); Q(348, 91, 7, 3, '#ffffff'); O(351.5, 99, 4, 4.5, '#ffffff'); O(351.5, 99.5, 2.5, 3, '#dde8ee');
  Q(361, 91, 10, 8, '#ffffff'); Q(362, 92, 8, 5, '#d6e8f4');
  O(348.5, 117.5, 3.7, 3.7, '#f2c230');
  O(360, 129, 15, 6.5, '#ffffff'); O(360, 129, 12.5, 4.6, '#bfe2f4');
  // corredorzinho: passadeira, baú verde, planta, caixinha e o armário "?"
  Q(387, 69, 14, 64, '#e2d6dc'); Q(388, 70, 12, 62, '#fbf7f2'); for (let Y = 74; Y < 130; Y += 6) Q(393, Y, 2, 1, '#e8c8d4');
  Q(381, 72, 8, 23, '#3f8f6a'); Q(382, 73, 6, 21, '#7fd4ac'); for (const Y of [77, 83, 89]) Q(384, Y, 2, 1, '#2f6a50');
  planta(402.5, 69, 0.8); Q(381, 126, 6, 6, '#b8582a'); Q(382, 127, 4, 4, '#d9703a');
  interrogacao(px(394) - 1, py(38), '#d8403a');
  // canto do banco da janela: tapete, banco com almofadas, mesinha com cadeira rosa, poltrona amarela, banquinho
  Q(414, 108, 52, 26, '#e8dccc'); Q(415, 109, 50, 24, '#f8f2e6'); O(440, 121, 18, 9, '#ead8c0'); O(440, 121, 17, 8, '#f8f2e6');
  Q(415, 91, 50, 12, '#b8c47a'); Q(416, 92, 48, 10, '#e4ecc0');
  Q(416, 93, 8, 7, '#9a6ad0'); Q(442, 93, 5, 4, '#9a6ad0'); Q(441, 97, 10, 4, '#e0407a'); Q(455, 93, 8, 7, '#b38ae0');
  Q(425, 103, 26, 11, '#d9a23a'); Q(426, 104, 24, 9, '#f2c06a');
  O(437, 118, 5, 4.5, '#b82a5a'); O(437, 118, 4, 3.5, '#e0407a');
  girado(413, 116, 13, 15, -30, '#d9a23a'); girado(413, 116, 9, 11, -30, '#fbe48a');
  O(470.5, 109.5, 3.5, 4, '#7a5232'); O(470.5, 109.5, 2.5, 3, '#9a6a3a');
  // varanda: a mesinha comprida
  Q(428, 76, 24, 5, '#b8a890'); Q(429, 77, 22, 3, '#e9dcc4');
  // quarto da Monica: tapete, cama rosa, criados, banco ao pé, escrivaninha, cômoda, poltrona rosa, penteadeira, plantas
  Q(505, 104, 49, 46, '#e8c8dc'); Q(506, 105, 47, 44, '#faf2f6');
  for (const [X, Y] of [[508, 107], [550, 107], [508, 146], [550, 146]]) Q(X, Y, 2, 1, '#c890b8');
  cama(516, 93, 27, 38, '#f0b8d8'); Q(526, 100, 7, 4, '#e0407a');
  for (const [X, Y] of [[521, 110], [533, 115], [525, 122], [538, 106], [530, 127]]) Q(X, Y, 1, 1, '#c87aa8');
  criado(506, 91); criado(545, 91);
  Q(522, 132, 15, 9, '#d9b23a'); Q(523, 133, 13, 7, '#f2d25a'); Q(523, 136, 13, 1, '#d9b23a');
  Q(482, 103, 17, 9, '#7a5232'); Q(483, 104, 15, 7, '#c8905a'); Q(486, 106, 3, 2, '#f6efe0'); Q(492, 106, 4, 1, '#5a3a24');
  Q(513, 153, 33, 12, '#b8b0a4'); Q(514, 154, 31, 10, '#ece8e2'); O(522, 159, 3, 3, '#b8b0a4'); O(522, 159, 2, 2, '#ffffff');
  O(535, 159, 3, 3, '#b8b0a4'); O(535, 159, 2, 2, '#ffffff');
  O(552, 159, 4, 4, '#c8602a'); O(552, 159, 3, 3, '#e8803a');
  planta(507, 159, 0.9);
  O(490, 155, 5, 5.5, '#b82a5a'); O(490, 155, 4, 4.5, '#e0407a');
  O(483, 143, 2, 2, '#f2d25a');
  Q(481, 164, 17, 11, '#8fb4c4'); Q(482, 165, 15, 9, '#cdeaf2'); Q(485, 166, 1, 3, '#ffffff'); Q(488, 169, 1, 3, '#ffffff');
  // quarto da Rachel: tapete, cama, criado, abajur, mesinha redonda, cadeira amarela, cômodas, poltrona redonda com pufe, escrivaninha
  Q(494, 203, 60, 41, '#d8dcb8'); Q(495, 204, 58, 39, '#eef0d8');
  cama(523, 169, 28, 40, '#f6efe0'); Q(524, 170, 26, 8, '#c8d890'); Q(526, 171, 9, 5, '#a8c840'); Q(539, 171, 9, 5, '#a8c840');
  Q(552, 173, 5, 7, '#d9a23a'); O(555, 195, 3, 3, '#d9b23a'); O(555, 195, 1.5, 1.5, '#fbe48a');
  O(514.5, 174.5, 4.5, 4.5, '#2b2b33'); O(514.5, 174.5, 1.5, 1.5, '#e8e0c8');
  Q(503, 183, 10, 13, '#d9a23a'); Q(504, 184, 8, 11, '#f2c84b');
  Q(493, 183, 8, 13, '#c8b896'); Q(494, 184, 6, 11, '#efe2c8');
  Q(476, 214, 10, 25, '#d9a23a'); Q(477, 215, 8, 23, '#f2c84b');
  girado(505, 226, 8, 8, 20, '#c8c0b0'); girado(505, 226, 6, 6, 20, '#f6f2ea');
  O(496, 236, 6.5, 6.5, '#c8c0b0'); O(496, 236, 5.5, 5.5, '#f6efe0'); O(496, 237, 3.5, 3, '#c8d890');
  Q(524, 233, 26, 10, '#7a5232'); Q(525, 234, 24, 8, '#c8905a');
  O(536.5, 228.5, 4.5, 4, '#7a9a30'); O(536.5, 228.5, 3.5, 3, '#a8c840');
  O(554, 238, 3, 3, '#c8c0b0'); O(554, 238, 2, 2, '#ffffff');
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
    R(px(332), py(185), 2, 2, tique % 2 ? '#ff8f3a' : '#ffd25a'); R(px(335.5), py(193), 2, 2, tique % 2 ? '#ffd25a' : '#ff8f3a');
    R(px(333) + (tique % 3), py(181) - (tique % 4), 1, 2, '#ffffffaa');
  }
  if (em('pia') || em('pia-j')) R(px(em('pia') ? 334 : 237) + (tique % 2), py(em('pia') ? 150 : 195) - (tique % 3), 1, 2, '#ffffffaa');
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
