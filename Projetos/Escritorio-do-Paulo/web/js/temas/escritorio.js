// Tema "escritório": o mapa original, com salas, lounge, reunião, jogos, estúdio, copa e jardim.
import { LARGURA, ALTURA } from './medidas.js';

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

// TV com corridinha e fliperama piscando quando alguém está jogando
function animar(q, { figuras, tique }) {
  // TV: corridinha colorida; fliperama: naves piscando
  const jogando = figuras.some(f => !f.caminho.length && (f.noPonto === 'game-1' || f.noPonto === 'game-2'));
  if (jogando) {
    q.fillStyle = '#1b2a4a'; q.fillRect(139, 137, 28, 13);
    q.fillStyle = '#4cc38a'; q.fillRect(139, 146, 28, 4);
    q.fillStyle = '#ffd25a'; q.fillRect(141 + (tique * 2) % 22, 143, 3, 3);
    q.fillStyle = '#ff6f91'; q.fillRect(141 + (tique * 2 + 9) % 22, 143, 3, 3);
    q.fillStyle = '#9fd6ff'; q.fillRect(142 + (tique * 3) % 24, 139, 2, 1);
  }
  const noFliper = figuras.some(f => !f.caminho.length && f.noPonto === 'fliper');
  if (noFliper) {
    q.fillStyle = '#141022'; q.fillRect(184, 150, 10, 8);
    q.fillStyle = tique % 2 ? '#ff4a6a' : '#ffd25a'; q.fillRect(186 + (tique % 3) * 2, 151, 2, 2);
    q.fillStyle = '#4cc3ff'; q.fillRect(188, 155, 2, 2);
  }
}

export default {
  id: 'escritorio',
  nome: 'Escritório',
  descricao: 'Mapa do escritório, visto de cima: sala da equipe, lounge, reunião, jogos, estúdio, copa e jardim',
  fundo: '#bfdcf2',
  zonas: [['Equipe', 101, 88], ['Lounge', 252, 94], ['Reunião', 358, 100], ['Jogos', 101, 248], ['Estúdio', 252, 256], ['Copa', 358, 256], ['Jardim', 446, 148]],
  mesas: MESAS, pontos: PONTOS, ligacoes: LIGACOES, lazer: LAZER,
  moradia: ['lanche-1', 'lanche-2', 'cafe', 'agua', 'co-centro'],
  reuniao: ['reuniao-1', 'reuniao-2'],
  telasDeJogo: ['game-1', 'game-2'],
  par: { a: 'pong-a', b: 'pong-b', raquete: true, bola: { altura: 196, sombra: 203 } },
  desenhar: desenharCenario,
  animar,
};
