// Tema "apartamento da Monica": a planta do apartamento do sitcom, vista de cima e redesenhada em pixel art (homenagem de
// fã, desenho próprio). Como no set: a porta roxa com a moldura amarela no olho mágico na parede do fundo, a cozinha à
// esquerda, a mesa de jantar no meio, a sala à direita com o sofá virado para a TV, o janelão do fundo com a varanda do
// lado de fora, e as portas dos dois quartos e do banheiro na parede da direita. Lá fora, o corredor do prédio com a
// porta do apartamento da frente.
// Trabalho: notebooks na mesa de jantar e no balcão da cozinha, e a escrivaninha de cada quarto.
import { LARGURA, ALTURA } from './medidas.js';

// ---------- planta ----------
const FUNDO_Y = 36;            // parede do fundo (com a porta e o janelão)
const DIREITA_X = 358;         // parede da direita (portas dos quartos e do banheiro)
const CORREDOR = 162;          // passagem entre o balcão, a mesa de jantar e a sala
const QUARTOS = {
  q1: { y: 10, h: 114, porta: [92, 108] },
  banho: { y: 128, h: 38, porta: [140, 154] },
  q2: { y: 170, h: 98, porta: [186, 202] },
};
const VARANDA = { x: 230, y: 4, w: 126, h: 30 };

// Lugares de trabalho (x do centro, y do topo do tampo, y dos pés na cadeira). A ordem é a de ocupação: as três
// primeiras ficam afastadas para os crachás não se encostarem.
const MESAS = [
  { x: 150, y: 112, cadeira: 146, tipo: 'notebook' },  // mesa de jantar, ponta esquerda
  { x: 46, y: 120, cadeira: 142, tipo: 'notebook' },   // balcão da cozinha
  { x: 210, y: 112, cadeira: 146, tipo: 'notebook' },  // mesa de jantar, ponta direita
  { x: 90, y: 120, cadeira: 142, tipo: 'notebook' },   // balcão da cozinha
  { x: 392, y: 34, cadeira: 62, tipo: 'monitor' },     // escrivaninha do quarto 1
  { x: 400, y: 188, cadeira: 214, tipo: 'monitor' },   // escrivaninha do quarto 2
];

const PONTOS = {
  // cozinha (contorna o balcão pelos dois lados)
  'c-oeste': [14, CORREDOR], geladeira: [14, 92], cozinhar: [60, 70], 'k-meio': [82, 92], cafe: [104, 70], 'k-leste': [118, 92],
  'c-k': [118, CORREDOR],
  // mesa de jantar e porta de entrada
  'd-no': [130, 80], porta: [160, 58], 'jantar-1': [164, 100], 'jantar-2': [196, 100], 'd-ne': [228, 80],
  'reuniao-1': [170, 146], 'reuniao-2': [190, 146], 'r-1': [170, CORREDOR], 'r-2': [190, CORREDOR],
  // canto de baixo: telefone com secretária eletrônica, estante e vitrola
  telefone: [28, 204], 'b-meio': [130, 214], 'b-leste': [196, 214], livros: [146, 246], vinil: [196, 246],
  // sala
  'c-sala': [232, CORREDOR], 's-norte': [240, 100], janela: [268, 58], 'v-janela': [310, 56], 's-leste': [346, 100],
  's-oeste': [240, 170], 'sofa-1': [262, 170], 'sofa-2': [285, 170], 'sofa-3': [308, 170],
  's-sw': [244, 214], 's-sul': [286, 214], 's-se': [342, 214],
  poltrona: [330, 198], 'cartas-a': [254, 194], 'cartas-b': [314, 194], 'game-1': [276, 236], 'game-2': [296, 236],
  // varanda (pelo janelão)
  'v-fora': [310, 30], 'varanda-1': [262, 28], 'varanda-2': [340, 28], parapeito: [290, 16],
  // quarto 1
  'q1-porta': [362, 100], 'q1-dentro': [376, 100], 'q1-pe': [430, 100], 'cama-1': [449, 72],
  // quarto 2
  'q2-porta': [362, 194], 'q2-dentro': [376, 226], 'q2-pe': [430, 232], 'cama-2': [449, 224], espelho: [460, 250],
};
const LIGACOES = [
  ['c-oeste', 'geladeira'], ['geladeira', 'cozinhar'], ['cozinhar', 'k-meio'], ['k-meio', 'cafe'], ['cafe', 'k-leste'],
  ['k-leste', 'c-k'], ['k-leste', 'd-no'],
  ['d-no', 'porta'], ['d-no', 'jantar-1'], ['jantar-1', 'jantar-2'], ['jantar-2', 'd-ne'], ['d-ne', 'c-sala'], ['porta', 'jantar-1'],
  ['r-1', 'reuniao-1'], ['r-2', 'reuniao-2'],
  ['c-oeste', 'telefone'], ['telefone', 'b-meio'], ['c-k', 'b-meio'], ['b-meio', 'livros'], ['b-meio', 'b-leste'], ['b-leste', 'vinil'],
  ['c-sala', 's-norte'], ['c-sala', 's-oeste'], ['s-norte', 'janela'], ['janela', 'v-janela'], ['v-janela', 's-leste'], ['s-norte', 's-leste'],
  ['v-janela', 'v-fora'], ['v-fora', 'varanda-1'], ['v-fora', 'varanda-2'], ['v-fora', 'parapeito'],
  ['s-oeste', 'sofa-1'], ['sofa-1', 'sofa-2'], ['sofa-2', 'sofa-3'], ['s-oeste', 's-sw'],
  ['s-sw', 'cartas-a'], ['s-sw', 's-sul'], ['s-sul', 'game-1'], ['s-sul', 'game-2'], ['s-sul', 's-se'],
  ['s-se', 'cartas-b'], ['s-se', 'poltrona'], ['s-se', 's-leste'], ['s-se', 'q2-porta'], ['b-leste', 's-sw'],
  ['s-leste', 'q1-porta'], ['q1-porta', 'q1-dentro'], ['q1-dentro', 'q1-pe'], ['q1-pe', 'cama-1'],
  ['q2-porta', 'q2-dentro'], ['q2-dentro', 'q2-pe'], ['q2-pe', 'cama-2'], ['q2-pe', 'espelho'],
];
// cada cadeira liga ao corredor atrás dela; o corredor vira uma linha só, de oeste para leste
MESAS.forEach((m, i) => {
  PONTOS[`mesa-${i}`] = [m.x, m.cadeira];
  PONTOS[`lado-${i}`] = i < 4 ? [m.x, CORREDOR] : [m.x, m.cadeira + 14];
  LIGACOES.push([`mesa-${i}`, `lado-${i}`]);
});
LIGACOES.push(['lado-4', 'q1-dentro'], ['lado-5', 'q2-dentro']);
const linha = Object.keys(PONTOS).filter(n => PONTOS[n][1] === CORREDOR).sort((a, b) => PONTOS[a][0] - PONTOS[b][0]);
for (let i = 1; i < linha.length; i += 1) LIGACOES.push([linha[i - 1], linha[i]]);

const LAZER = {
  geladeira: { dir: 'costas', icone: 'geladeira', tempo: [4, 8] },
  cozinhar: { dir: 'costas', icone: 'panela', tempo: [10, 18] },
  cafe: { dir: 'costas', icone: 'cafe', tempo: [5, 10] },
  porta: { dir: 'costas', icone: 'olho', tempo: [3, 6] },
  'jantar-1': { pose: 'sentado', dir: 'frente', icone: 'lanche', tempo: [10, 18] },
  'jantar-2': { pose: 'sentado', dir: 'frente', icone: 'lanche', tempo: [10, 18] },
  telefone: { dir: 'lado', esquerda: true, icone: 'conversa', tempo: [6, 12] },
  livros: { dir: 'frente', icone: 'livro', tempo: [6, 12] },
  vinil: { dir: 'frente', icone: 'musica', tempo: [8, 14] },
  'sofa-1': { pose: 'sentado', dir: 'frente', icone: 'conversa', tempo: [12, 22] },
  'sofa-2': { pose: 'sentado', dir: 'frente', icone: 'conversa', tempo: [12, 22] },
  'sofa-3': { pose: 'sentado', dir: 'frente', icone: 'conversa', tempo: [12, 22] },
  poltrona: { pose: 'sentado', dir: 'lado', esquerda: true, icone: 'livro', tempo: [10, 18] },
  janela: { dir: 'costas', icone: 'janela', tempo: [5, 9] },
  'game-1': { pose: 'sentado', dir: 'frente', icone: 'tv', tempo: [14, 24] },
  'game-2': { pose: 'sentado', dir: 'frente', icone: 'tv', tempo: [14, 24] },
  'cartas-a': { pose: 'sentado', dir: 'lado', icone: 'cartas', tempo: [16, 26], par: 'cartas-b' },
  'cartas-b': { pose: 'sentado', dir: 'lado', esquerda: true, icone: 'cartas', tempo: [16, 26], par: 'cartas-a' },
  'varanda-1': { pose: 'sentado', dir: 'costas', icone: 'sol', tempo: [10, 18] },
  'varanda-2': { pose: 'sentado', dir: 'costas', icone: 'sol', tempo: [10, 18] },
  parapeito: { dir: 'costas', icone: 'janela', tempo: [6, 10] },
  'cama-1': { pose: 'sentado', dir: 'frente', icone: 'cama', tempo: [10, 18] },
  'cama-2': { pose: 'sentado', dir: 'frente', icone: 'cama', tempo: [10, 18] },
  espelho: { dir: 'lado', icone: 'espelho', tempo: [4, 8] },
};

// ---------- cenário ----------
const ROXO = { face: '#9a7bc8', luz: '#bba3e2', sombra: '#73559f', linha: '#5d4386' };
const VERDE = { face: '#5fb3a3', luz: '#86cfc0', sombra: '#3f8f80' };   // parede da cozinha

function desenhar(c) {
  const R = (x, y, w, h, cor) => { c.fillStyle = cor; c.fillRect(x, y, w, h); };
  const ovo = (x, y, rx, ry, cor) => { c.fillStyle = cor; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); };
  const tabuas = (x, y, w, h, a, b, risco) => {
    for (let j = 0; j < h; j += 6) {
      R(x, y + j, w, Math.min(6, h - j), (j / 6) % 2 ? a : b);
      R(x, y + j + 5, w, 1, risco);
      for (let i = x + ((j / 6) % 3) * 11 + 6; i < x + w; i += 34) R(i, y + j, 1, 5, risco);
    }
  };
  const ladrilho = (x, y, w, h, t, a, b) => {
    for (let j = 0; j < h; j += t) for (let i = 0; i < w; i += t) R(x + i, y + j, Math.min(t, w - i), Math.min(t, h - j), ((i + j) / t) % 2 ? a : b);
  };
  const planta = (x, y, g = 1) => {
    R(x + 1, y - 6 * g, 6 * g, 6 * g, '#c4643a'); R(x + 1, y - 6 * g, 6 * g, 1, '#e08a5a');
    R(x, y - 12 * g, 8 * g, 7 * g, '#3f9a4a'); R(x + 2 * g, y - 15 * g, 4 * g, 4 * g, '#56b45c'); R(x + 1, y - 11 * g, 2, 2, '#7fd08a');
  };
  const face = (x, w, y, cor = ROXO) => { R(x, y, w, 10, cor.face); R(x, y, w, 2, cor.luz); R(x, y + 8, w, 2, cor.sombra); };
  // algarismos de 3 × 5 pixels (o número na porta do vizinho)
  const DIGITOS = { 1: ['010', '110', '010', '010', '111'], 9: ['111', '101', '111', '001', '111'] };
  const numero = (texto, x, y, cor) => [...texto].forEach((d, k) => DIGITOS[d].forEach((l, j) => [...l].forEach((p, i) => p === '1' && R(x + k * 4 + i, y + j, 1, 1, cor))));

  // ----- lá fora -----
  R(0, 0, LARGURA, ALTURA, '#5d6577');
  // corredor do prédio: ladrilho, escada e a porta do apartamento da frente
  R(0, 0, 206, FUNDO_Y, '#cfc6b6');
  for (let x = 0; x < 206; x += 9) R(x, 0, 1, FUNDO_Y, '#bdb3a2');
  for (let y = 9; y < FUNDO_Y; y += 9) R(0, y, 206, 1, '#bdb3a2');
  R(6, 4, 40, 26, '#9b9282'); for (let x = 8; x < 44; x += 5) R(x, 6, 3, 22, '#b3aa98'); R(6, 4, 40, 2, '#7f7768');
  R(148, 0, 24, 8, '#5b2f8f'); R(149, 0, 22, 7, '#6e3aa8'); numero('19', 156, 1, '#f2c230');
  R(66, 4, 10, 6, '#f2d27a'); R(67, 5, 8, 1, '#fff2c4');                                                // luminária do corredor
  // parede de tijolo entre o corredor e a varanda
  R(206, 0, 24, FUNDO_Y, '#8a4e3c'); for (let y = 2; y < FUNDO_Y; y += 4) R(206 + ((y / 4) % 2) * 4, y, 24, 1, '#6a3a2c');
  // varanda (do lado de fora do janelão) e a cidade atrás dela
  R(VARANDA.x, 0, VARANDA.w, 4, '#3b4252');
  ladrilho(VARANDA.x, VARANDA.y, VARANDA.w, VARANDA.h, 6, '#c8734f', '#bb6744');
  R(VARANDA.x, VARANDA.y - 1, VARANDA.w, 2, '#2c2f3a');
  for (let x = VARANDA.x; x < VARANDA.x + VARANDA.w; x += 4) R(x, 0, 1, 3, '#454a59');
  R(VARANDA.x + VARANDA.w, 0, 2, FUNDO_Y, '#2c2f3a');
  // telhados ao lado dos quartos
  R(362, 0, 118, 10, '#7d4636'); for (let x = 366; x < 478; x += 10) R(x, 2, 6, 5, (x / 10) % 3 ? '#3b2a33' : '#f2d27a');

  // ----- pisos -----
  ladrilho(4, 46, 122, 102, 6, '#efe4cc', '#e2d3b4');                         // cozinha
  tabuas(126, 46, 232, 222, '#c79a68', '#bf9160', '#a8794b');                 // jantar e sala
  tabuas(4, 148, 122, 120, '#c79a68', '#bf9160', '#a8794b');
  tabuas(362, QUARTOS.q1.y + 10, 114, QUARTOS.q1.h - 10, '#d8b487', '#d0aa7c', '#bb9365');
  ladrilho(362, QUARTOS.banho.y, 114, QUARTOS.banho.h, 4, '#eef4f7', '#d6e6ef');
  tabuas(362, QUARTOS.q2.y, 114, QUARTOS.q2.h, '#d8b487', '#d0aa7c', '#bb9365');

  // ----- paredes -----
  face(4, 122, FUNDO_Y, VERDE);                    // fundo da cozinha, verde-água
  face(126, DIREITA_X - 126, FUNDO_Y);             // fundo da sala, lilás
  R(2, FUNDO_Y, 2, 234, ROXO.linha); R(2, 268, DIREITA_X + 4, 2, ROXO.linha);
  // parede da direita com as três portas
  const portas = Object.values(QUARTOS).map(q => q.porta);
  let y0 = FUNDO_Y;
  for (const [p0, p1] of portas) { R(DIREITA_X, y0, 4, p0 - y0, ROXO.linha); y0 = p1; }
  R(DIREITA_X, y0, 4, 270 - y0, ROXO.linha);
  for (const [p0, p1] of portas) R(DIREITA_X + 1, p0, 2, p1 - p0, '#e9dcc4');   // batente
  // quartos e banheiro: parede de cima de cada um e a da direita
  face(362, 114, QUARTOS.q1.y);
  R(362, QUARTOS.banho.y - 4, 114, 4, ROXO.linha); R(362, QUARTOS.q2.y - 4, 114, 4, ROXO.linha);
  R(476, QUARTOS.q1.y, 4, 260, ROXO.linha); R(362, 268, 118, 2, ROXO.linha); R(DIREITA_X, QUARTOS.q1.y, 4, FUNDO_Y - QUARTOS.q1.y, ROXO.linha);

  // porta de entrada roxa, com a moldura amarela em volta do olho mágico, e o cabide ao lado
  R(150, FUNDO_Y, 20, 10, '#5b2f8f'); R(151, FUNDO_Y + 1, 18, 9, '#6e3aa8'); R(151, FUNDO_Y + 1, 18, 1, '#8a5ac4');
  R(158, FUNDO_Y + 2, 4, 1, '#f2c230'); R(157, FUNDO_Y + 3, 6, 4, '#f2c230'); R(158, FUNDO_Y + 7, 4, 1, '#f2c230');
  R(158, FUNDO_Y + 4, 4, 2, '#d9a21a'); R(159, FUNDO_Y + 4, 2, 2, '#2a1a3a'); R(167, FUNDO_Y + 5, 1, 2, '#e8d07a');
  R(148, 46, 24, 6, '#7a3d4a'); R(149, 47, 22, 4, '#a4565f');                                           // capacho
  R(178, FUNDO_Y + 1, 2, 9, '#6d4627'); R(176, FUNDO_Y + 2, 6, 2, '#8c5f36'); R(175, FUNDO_Y + 4, 3, 4, '#c9435b');   // cabide e bolsa
  // quadros na parede do fundo
  R(186, FUNDO_Y + 1, 18, 8, '#c9a24a'); R(187, FUNDO_Y + 2, 16, 6, '#4a7fc4'); R(189, FUNDO_Y + 3, 5, 3, '#f2c230'); R(196, FUNDO_Y + 4, 5, 3, '#e8564f');
  // janelão do fundo (com a janela que dá para a varanda aberta)
  R(234, FUNDO_Y, 122, 10, '#f3efe6');
  for (let x = 236; x < 354; x += 8) { R(x, FUNDO_Y + 1, 7, 8, '#8fc6e8'); R(x, FUNDO_Y + 1, 7, 2, '#c4e4f6'); }
  R(300, FUNDO_Y, 20, 10, '#f3efe6'); R(302, FUNDO_Y + 1, 16, 9, '#3a4a5e'); R(302, FUNDO_Y + 1, 16, 1, '#5d6f86');

  // ----- cozinha: armários, bancada com fogão e pia, geladeira, prateleiras, balcão com banquetas -----
  for (let x = 26; x < 120; x += 16) { R(x, FUNDO_Y + 1, 11, 7, '#f4efe4'); R(x + 1, FUNDO_Y + 2, 9, 1, '#ffffff'); R(x + 8, FUNDO_Y + 4, 2, 1, '#8a7a62'); }
  R(6, 46, 18, 34, '#efe6d0'); R(7, 47, 16, 12, '#fbf5e6'); R(7, 60, 16, 19, '#fbf5e6'); R(20, 50, 1, 6, '#a89f8a'); R(20, 63, 1, 9, '#a89f8a');
  R(9, 64, 3, 3, '#e8564f'); R(13, 68, 3, 2, '#4c9aff'); R(10, 72, 2, 3, '#f2c230'); R(15, 62, 4, 3, '#ffffff');   // ímãs e bilhete
  R(24, 46, 98, 14, '#d9cdb5'); R(24, 46, 98, 11, '#f4efe4'); R(24, 59, 98, 1, '#a89f8a');               // bancada
  R(50, 47, 22, 10, '#3a3a44'); for (const [x, y] of [[55, 50], [66, 50], [55, 54], [66, 54]]) ovo(x, y, 3, 1.6, '#202028');   // fogão
  R(80, 48, 16, 8, '#a9b4c2'); R(81, 49, 14, 6, '#d6e8f4'); R(87, 46, 2, 3, '#7a8496');                  // pia
  R(100, 46, 10, 10, '#3a4256'); R(102, 48, 6, 3, '#9fd2ff'); R(103, 52, 4, 3, '#20263a');               // cafeteira
  R(112, 49, 6, 5, '#f2c84b'); R(113, 50, 4, 1, '#ffffff'); R(76, 49, 3, 4, '#e8564f');                  // potes
  // prateleiras abertas na parede da esquerda, cheias de potes coloridos
  R(4, 84, 8, 56, '#9a6a3a');
  for (let y = 86; y < 138; y += 8) { R(4, y + 6, 8, 1, '#6d4627'); for (let x = 5; x < 11; x += 3) R(x, y + 2, 2, 4, ['#e8564f', '#4c9aff', '#f2c230', '#6fbf4a', '#b47cff'][(x + y) % 5]); }
  // balcão com as banquetas (lugares de trabalho)
  R(24, 116, 88, 16, '#8a5a34'); R(24, 116, 88, 13, '#b98654'); R(24, 116, 88, 2, '#d4a06b');
  for (const i of [1, 3]) { const m = MESAS[i]; ovo(m.x, m.cadeira - 4, 5, 3, '#5a3a24'); ovo(m.x, m.cadeira - 5, 4, 2, '#e0566e'); }
  R(66, 118, 8, 6, '#e8e2d4'); R(67, 117, 3, 3, '#f2c230'); R(70, 118, 3, 2, '#6fbf4a');                  // fruteira

  // ----- mesa de jantar: madeira, cadeiras de cores diferentes, flores -----
  R(140, 104, 80, 34, '#7a4e2c'); R(140, 104, 80, 31, '#a8703f'); R(140, 104, 80, 2, '#c28a52');
  for (let x = 146; x < 220; x += 16) R(x, 107, 1, 26, '#93602f');
  ovo(180, 120, 5, 4, '#f6f2ea'); R(178, 115, 2, 3, '#e8564f'); R(181, 114, 2, 3, '#f2c230'); R(176, 117, 2, 2, '#b47cff');   // vaso de flores
  const cadeira = (x, y, cor, encostoEmCima) => {
    R(x - 5, y - 6, 10, 7, cor); R(x - 4, y - 5, 8, 4, '#ffffff33');
    if (encostoEmCima) R(x - 5, y - 9, 10, 3, cor); else R(x - 5, y + 1, 10, 3, cor);
  };
  cadeira(164, 100, '#4a8f6a', true); cadeira(196, 100, '#d9814b', true);
  cadeira(150, 146, '#c9435b', false); cadeira(170, 146, '#4a7fc4', false); cadeira(190, 146, '#e2b24a', false); cadeira(210, 146, '#7a5bb0', false);
  R(166, 126, 8, 6, '#f6f8fb'); R(167, 127, 6, 1, '#9aa5b8'); R(186, 128, 6, 4, '#f2b544');             // bloco e post-it (reunião)

  // ----- canto de baixo: telefone com secretária eletrônica, cristaleira, estante, vitrola, tapete -----
  R(4, 190, 14, 22, '#7a5232'); R(4, 190, 14, 2, '#9a6a3a'); R(6, 194, 9, 6, '#2b2b33'); R(7, 195, 3, 2, '#e8564f'); R(11, 196, 3, 3, '#3a3a44');
  R(6, 203, 9, 5, '#d9dde8'); R(7, 204, 2, 1, '#4cc38a');
  R(4, 220, 12, 44, '#6d4627'); R(5, 222, 10, 40, '#a8d4ee'); for (let y = 230; y < 262; y += 10) R(5, y, 10, 1, '#6d4627');
  for (let y = 224; y < 262; y += 10) { R(7, y, 3, 3, '#ffffff'); R(11, y + 1, 2, 4, '#e8564f'); }
  R(116, 256, 60, 12, '#7a5232'); R(116, 256, 60, 2, '#9a6a3a');
  for (let x = 118, k = 0; x < 174; x += 3, k += 1) R(x, 258, 2, 9, ['#c44a4a', '#4a7fc4', '#e2b24a', '#4ab07a', '#9a6ad0'][k % 5]);
  R(186, 254, 20, 14, '#5a3a24'); ovo(196, 260, 6, 4, '#1a1a1f'); ovo(196, 260, 1.5, 1, '#e8564f');
  R(40, 222, 64, 30, '#d9a36a'); R(42, 224, 60, 26, '#e8b87c'); for (let x = 46; x < 100; x += 8) R(x, 236, 4, 2, '#c44a4a');
  planta(108, 264, 1.1); planta(212, 264, 1);

  // ----- sala: tapete, sofá virado para a TV, poltrona, mesa de centro, TV, luminária, plantas -----
  R(240, 150, 104, 98, '#2f6a86'); R(242, 152, 100, 94, '#3a7d9c');
  for (let y = 156; y < 244; y += 10) for (let x = 246; x < 340; x += 10) R(x, y, 2, 2, '#f2c84b');
  R(250, 150, 70, 8, '#d9cbb0'); R(250, 150, 70, 2, '#efe4cf'); R(246, 152, 6, 18, '#c8b896'); R(318, 152, 6, 18, '#c8b896');
  R(252, 158, 66, 10, '#ece1ca'); R(252, 167, 66, 2, '#c8b896'); R(274, 158, 1, 10, '#c8b896'); R(296, 158, 1, 10, '#c8b896');
  R(254, 153, 7, 5, '#e8564f'); R(309, 153, 7, 5, '#f2c230');                                           // almofadas
  R(322, 186, 16, 4, '#4a8f6a'); R(322, 202, 16, 4, '#4a8f6a'); R(334, 188, 6, 16, '#4a8f6a'); R(322, 190, 12, 12, '#63a882');   // poltrona
  R(264, 184, 40, 14, '#6d4627'); R(264, 184, 40, 12, '#8c5f36'); R(264, 184, 40, 1, '#a8774a');        // mesa de centro
  R(268, 187, 8, 6, '#f6f8fb'); R(294, 187, 5, 5, '#ffffff'); R(295, 188, 3, 1, '#b07a4a');
  R(260, 254, 52, 14, '#5a3a24'); R(260, 254, 52, 2, '#7a5232'); R(270, 246, 32, 10, '#1d2130'); R(271, 247, 30, 8, '#2f3a55');
  R(272, 262, 10, 4, '#d9dde8');
  R(350, 58, 2, 22, '#3d445a'); ovo(351, 56, 5, 4, '#f6dc8a'); ovo(351, 55, 3, 2, '#fff2c4');           // luminária
  planta(238, 66, 1); planta(338, 266, 1); planta(226, 266, 0.9);

  // ----- quarto 1: cama, criado-mudo, escrivaninha, tapete, cômoda -----
  const cama = (x, y, colcha, faixa) => {
    R(x, y, 38, 38, '#7a5232'); R(x + 2, y + 2, 34, 34, colcha); R(x + 2, y + 2, 34, 9, '#f6f2ea');
    R(x + 4, y + 3, 13, 6, '#ffffff'); R(x + 21, y + 3, 13, 6, '#ffffff'); R(x + 2, y + 20, 34, 3, faixa);
  };
  cama(430, 22, '#b47cff', '#8f5ad6'); R(418, 22, 10, 10, '#9a6a3a'); ovo(423, 26, 3, 3, '#f6dc8a');
  R(400, 86, 30, 16, '#e9a1b8'); R(402, 88, 26, 12, '#f2b8ca');
  R(452, 104, 22, 16, '#9a6a3a'); R(453, 105, 20, 6, '#b98654'); R(453, 112, 20, 7, '#b98654'); R(462, 107, 2, 1, '#6d4627'); R(462, 115, 2, 1, '#6d4627');
  // ----- banheiro: banheira, vaso, pia -----
  R(440, 132, 34, 16, '#d6e2ea'); R(442, 134, 30, 12, '#ffffff'); R(444, 136, 26, 8, '#bfe2f4');
  R(380, 150, 10, 12, '#ffffff'); ovo(385, 148, 5, 4, '#f2f6f8');
  R(400, 132, 12, 9, '#ffffff'); R(402, 134, 8, 5, '#d6e8f4'); R(418, 132, 4, 14, '#e8564f');
  // ----- quarto 2: cama, criado-mudo, escrivaninha, espelho de pé -----
  cama(430, 178, '#5fa8d8', '#3f86b8'); R(418, 178, 10, 10, '#9a6a3a'); ovo(423, 182, 3, 3, '#f6dc8a');
  R(470, 240, 4, 18, '#c9d6e2'); R(471, 241, 2, 16, '#e6f0f8');
  R(384, 240, 30, 18, '#9fd0b8'); R(386, 242, 26, 14, '#b8e0cb');
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

  // ----- varanda: cadeiras viradas para a cidade, mesinha, vasos -----
  for (const x of [262, 340]) { R(x - 5, 16, 10, 9, '#3a3f4f'); R(x - 4, 17, 8, 6, '#e0566e'); R(x - 5, 13, 10, 3, '#2c2f3a'); }
  ovo(300, 26, 5, 4, '#3a3f4f'); R(298, 24, 4, 3, '#ffffff');
  planta(236, 32, 0.8); planta(346, 32, 0.8);
}

// ---------- o que mexe ----------
function animar(q, { figuras, tique }) {
  const em = nome => figuras.some(f => !f.caminho.length && f.noPonto === nome);
  // TV: uma série passando para quem está no tapete
  if (em('game-1') || em('game-2')) {
    const cenas = [['#f2c84b', '#e8564f'], ['#4c9aff', '#f6f8fb'], ['#6fbf4a', '#b47cff'], ['#e8564f', '#2f3a55']];
    const [a, b] = cenas[Math.floor(tique / 10) % cenas.length];
    q.fillStyle = a; q.fillRect(271, 247, 30, 8);
    q.fillStyle = b; q.fillRect(273 + (tique % 20), 249, 6, 4);
    q.fillStyle = '#ffffff'; q.fillRect(272, 253, 28, 1);
  }
  // vitrola girando, com notinhas
  if (em('vinil')) {
    const a = (tique % 8) * (Math.PI / 4);
    q.fillStyle = '#e8564f'; q.fillRect(Math.round(196 + Math.cos(a) * 4), Math.round(260 + Math.sin(a) * 2.5), 1, 1);
    q.fillStyle = '#f2c84b'; q.fillRect(202, 252 - (tique % 6), 1, 1); q.fillRect(205, 254 - ((tique + 3) % 6), 1, 1);
  }
  // luzinha da secretária eletrônica piscando
  if (em('telefone') || tique % 8 < 4) { q.fillStyle = '#4cc38a'; q.fillRect(7, 204, 2, 1); } else { q.fillStyle = '#2b2b33'; q.fillRect(7, 204, 2, 1); }
  // fogo do fogão e vapor da panela
  if (em('cozinhar')) {
    q.fillStyle = tique % 2 ? '#ff8f3a' : '#ffd25a'; q.fillRect(54, 49, 3, 2);
    q.fillStyle = '#c4c9d4'; q.fillRect(52, 48, 7, 4);
    q.fillStyle = '#ffffffaa'; q.fillRect(54 + (tique % 3), 43 - (tique % 4), 1, 2); q.fillRect(57 - (tique % 2), 42 - ((tique + 2) % 4), 1, 2);
  }
  if (em('cafe')) { q.fillStyle = '#ffffffaa'; q.fillRect(104 + (tique % 2), 43 - (tique % 3), 1, 2); }
  // cartas na mesa de centro quando a dupla está jogando
  if (em('cartas-a') && em('cartas-b')) {
    for (const [x, y, cor] of [[274, 189, '#f6f8fb'], [279, 190, '#f6f8fb'], [284, 188, '#f6f8fb'], [289, 190, '#e8564f']]) {
      q.fillStyle = cor; q.fillRect(x, y, 4, 5); q.fillStyle = '#c9435b'; q.fillRect(x + 1, y + 1, 1, 1);
    }
  }
}

export default {
  id: 'apartamento',
  nome: 'Apartamento da Monica',
  descricao: 'Mapa do apartamento da Monica, visto de cima: cozinha, mesa de jantar, sala com sofá e TV, varanda pelo janelão, dois quartos e banheiro, e o corredor do prédio lá fora',
  fundo: '#c9b6e8',
  zonas: [['Corredor', 100, 20], ['Varanda', 292, 6], ['Cozinha', 64, 180], ['Jantar', 180, 180], ['Sala', 226, 232],
    ['Quarto', 420, 116], ['Banho', 420, 160], ['Quarto', 420, 262]],
  mesas: MESAS, pontos: PONTOS, ligacoes: LIGACOES, lazer: LAZER,
  moradia: ['sofa-1', 'sofa-3', 'poltrona', 'jantar-1', 'varanda-1', 'c-sala'],
  reuniao: ['reuniao-1', 'reuniao-2'],
  telasDeJogo: ['game-1', 'game-2'],
  par: { a: 'cartas-a', b: 'cartas-b', raquete: false, bola: null },
  desenhar,
  animar,
};
