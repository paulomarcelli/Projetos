// Bonequinhos em pixel art do mapa (vistos de cima, de leve na diagonal), desenhados por código, pixel a pixel.
// Cada agente tem cabelo, pele, roupa e um acessório que lembram o retrato dela. Quatro direções (frente, costas,
// lado direito e esquerdo, que é o direito espelhado), passos de caminhada e duas poses sentadas (de frente e de costas).
// O desenho tem 12 × 20 pixels (pés no meio da última linha) e ganha um contorno escuro de 1 pixel em volta.
// Os quadros prontos ficam guardados (um canvas pequeno por agente, pose e passo).

export const LARGURA_SPRITE = 14; // 12 + contorno
export const ALTURA_SPRITE = 22;  // 20 + contorno

const PELE = '#f6d2b8';
const CONTORNO = '#2a2233';

// Visual de cada um (pelo id do avatar em equipe.json).
//   cabelo: estilo (curto, longo, coque, rabo, ombro, mascara, capacete-ferro, capacete-azul)
//   acessorio: escudo, capa, oculos, tiara, laco, barba
const VISUAIS = {
  // Sofia (agente 2): cabelo castanho-escuro comprido, vestido preto de alça, anel
  sofia: { pele: '#f8d8c6', cabelo: ['longo', '#3b2721'], roupa: '#18161c', manga: '#f8d8c6', calca: '#18161c', perna: '#f8d8c6', sapato: '#18161c', detalhe: '#d9b48a', acessorio: 'vestido' },
  // Karol (agente 1): cabelo loiro-mel comprido (loira, nunca ruiva) e ondulado, blusa cinza com flor laranja, jaqueta verde, short coral, bota amarela
  karol: { pele: '#f9cfb2', cabelo: ['longo', '#dcc070'], roupa: '#c4c1bb', manga: '#2e7d74', calca: '#f07a50', perna: '#f9cfb2', sapato: '#f2c02a', detalhe: '#f07a3a', acessorio: 'jaqueta' },
  // Sabrina (agente 3): loira com franja e laço preto, regata preta
  sabrina: { pele: '#f8d0b8', cabelo: ['longo', '#f0d38a'], roupa: '#1b1b22', manga: '#f8d0b8', calca: '#2a2a33', perna: '#f8d0b8', sapato: '#1b1b22', detalhe: '#1b1b22', acessorio: 'laco' },
};

// Agente sem visual próprio: cabelo e roupa saem da cor dele, para cada um ser diferente.
function visualPadrao(cor = '#8aa0c8', id = '') {
  const estilos = ['curto', 'longo', 'rabo', 'ombro', 'coque'];
  const n = [...id].reduce((s, c) => s + c.charCodeAt(0), 0);
  const cabelos = ['#2b201c', '#6b4228', '#dcc070', '#1d1820', '#f0d38a'];
  return { pele: PELE, cabelo: [estilos[n % estilos.length], cabelos[n % cabelos.length]], roupa: cor, manga: cor, calca: '#3a4256', sapato: '#2a2a33', detalhe: '#f2f4f8', acessorio: '' };
}

export function visualDe(agente) {
  return agente.visual || VISUAIS[agente.avatar] || VISUAIS[agente.id] || visualPadrao(agente.cor, agente.id);
}

const escurecer = (hex, f = 0.78) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * f));
  return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`;
};

// ---------- desenho de um quadro ----------
// direcao: 'frente' | 'costas' | 'lado' (virado para a direita); pose: 'em-pe' | 'sentado'; passo 0..3
function desenhar(v, direcao, pose, passo) {
  const W = 12, H = 20;
  const px = new Array(W * H).fill(null);
  const p = (x, y, cor) => { if (x >= 0 && x < W && y >= 0 && y < H && cor) px[y * W + x] = cor; };
  const r = (x, y, w, h, cor) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p(x + i, y + j, cor); };
  const sentado = pose === 'sentado';
  const dy = sentado ? 3 : 0;                         // sentado, o corpo desce
  const [estilo, corCabelo] = v.cabelo;
  const sombraCabelo = escurecer(corCabelo, 0.72);
  const pele = v.pele;
  const andandoA = passo === 1, andandoB = passo === 3;
  const balanco = !sentado && (andandoA || andandoB) ? 1 : 0;

  // capa (atrás de tudo)
  if (v.acessorio === 'capa') {
    if (direcao === 'costas') r(2, 9 + dy, 8, sentado ? 8 : 9, v.detalhe);
    else if (direcao === 'lado') r(2, 9 + dy, 3, sentado ? 6 : 8, v.detalhe);
    else { r(2, 9 + dy, 1, sentado ? 6 : 8, v.detalhe); r(9, 9 + dy, 1, sentado ? 6 : 8, v.detalhe); }
  }
  // cabelo comprido atrás dos ombros
  if (estilo === 'longo' || estilo === 'rabo' || estilo === 'ombro') {
    const ate = estilo === 'longo' ? 13 : estilo === 'ombro' ? 10 : 12;
    if (direcao === 'frente') { r(2, 6 + dy, 1, ate - 6, corCabelo); r(9, 6 + dy, 1, ate - 6, corCabelo); }
    if (direcao === 'lado') r(estilo === 'rabo' ? 1 : 2, 5 + dy, 2, ate - 5, corCabelo);
  }

  // pernas
  if (!sentado) {
    const pernaE = andandoA ? -1 : 0, pernaD = andandoB ? -1 : 0;
    if (direcao === 'lado') {
      // passada de lado: uma perna à frente, a outra atrás
      const f = andandoA ? 1 : andandoB ? -1 : 0;
      r(4 + f, 14, 2, 4, v.calca); r(4 + f, 17, 2 + (f >= 0 ? 1 : 0), 1, v.sapato);
      r(6 - f, 14, 2, 4, escurecer(v.calca, 0.85)); r(6 - f, 17, 2 + (f <= 0 ? 1 : 0), 1, escurecer(v.sapato, 0.85));
      if (v.perna) { r(4 + f, 16, 2, 1, v.perna); r(6 - f, 16, 2, 1, escurecer(v.perna, 0.92)); }
    } else {
      r(4, 14, 2, 4 + pernaE, v.calca); r(4, 17 + pernaE, 2, 1, v.sapato);
      r(6, 14, 2, 4 + pernaD, v.calca); r(6, 17 + pernaD, 2, 1, v.sapato);
      if (v.perna) { r(4, 16 + pernaE, 2, 1, v.perna); r(6, 16 + pernaD, 2, 1, v.perna); }
    }
  } else if (direcao === 'frente') {
    r(4, 14 + 1, 4, 1, v.calca); r(4, 16, 1, 1, v.sapato); r(7, 16, 1, 1, v.sapato);   // joelhos para a frente
  }

  // vestido: a saia desce até o joelho por cima das pernas
  if ((v.acessorio === 'vestido' || v.acessorio === 'laco') && direcao !== 'costas') {
    // alças: os ombros ficam de fora
    if (direcao === 'frente') { p(3, 9 + dy, v.pele); p(8, 9 + dy, v.pele); }
  }
  if (v.acessorio === 'vestido') {
    if (!sentado) r(direcao === 'lado' ? 3 : 3, 13, direcao === 'lado' ? 6 : 6, 3, v.roupa);
    else if (direcao === 'frente') r(3, 14, 6, 2, v.roupa);
  }
  // tronco
  const tx = direcao === 'lado' ? 4 : 3, tw = direcao === 'lado' ? 4 : 6;
  r(tx, 9 + dy, tw, 5, v.roupa);
  r(tx, 13 + dy, tw, 1, escurecer(v.roupa, 0.8));
  if (v.acessorio === 'jaqueta') {
    if (direcao === 'frente') { r(3, 9 + dy, 1, 5, v.manga); r(8, 9 + dy, 1, 5, v.manga); p(4, 9 + dy, v.manga); p(7, 9 + dy, v.manga); p(5, 11 + dy, v.detalhe); p(6, 11 + dy, v.detalhe); p(5, 10 + dy, '#ffb25a'); r(4, 13 + dy, 4, 1, v.calca); }
    else if (direcao === 'costas') r(3, 9 + dy, 6, 5, v.manga);
    else { r(4, 9 + dy, 2, 5, v.manga); }
  }
  // detalhes da roupa (de frente)
  if (direcao === 'frente') {
  }
  // braços
  const bracoY = 9 + dy;
  if (direcao === 'lado') {
    const s = sentado ? 1 : andandoA ? -1 : andandoB ? 1 : 0;
    r(5 + s, bracoY + 1, 2, 3, v.manga); p(5 + s, bracoY + 4, v.cabelo[0] === 'mascara' ? v.manga : pele === '#d9262e' ? '#d9262e' : maoDe(v));
  } else {
    const ae = sentado ? 0 : balanco && andandoA ? 1 : 0, ad = sentado ? 0 : balanco && andandoB ? 1 : 0;
    r(2, bracoY + ae, 1, 3, v.manga); p(2, bracoY + 3 + ae, maoDe(v));
    r(9, bracoY + ad, 1, 3, v.manga); p(9, bracoY + 3 + ad, maoDe(v));
  }

  // cabeça (grande, de chibi): linhas 1..8
  const hy = 1 + dy;
  if (direcao === 'lado') r(3, hy + 1, 6, 7, pele); else r(3, hy + 1, 6, 7, pele);
  r(direcao === 'lado' ? 3 : 2, hy + 2, direcao === 'lado' ? 7 : 8, 5, pele);
  // rosto
  const olho = '#2a1d1a';
  if (direcao === 'frente') {
    p(4, hy + 4, olho); p(7, hy + 4, olho);
    p(3, hy + 5, '#ff9fae'); p(8, hy + 5, '#ff9fae');
  } else if (direcao === 'lado') {
    p(7, hy + 4, olho); p(8, hy + 5, '#ff9fae');
  }
  if (v.barba && direcao !== 'costas') { if (direcao === 'frente') { r(4, hy + 6, 4, 1, v.barba); p(5, hy + 7, v.barba); p(6, hy + 7, v.barba); } else { r(6, hy + 6, 3, 1, v.barba); } }

  // cabelo / máscara / capacete
  const C = corCabelo, S = sombraCabelo;
  if (estilo === 'mascara') {
    r(direcao === 'lado' ? 3 : 2, hy + 1, direcao === 'lado' ? 7 : 8, 6, C); r(3, hy, 6, 1, C);
    if (direcao === 'frente') { r(3, hy + 3, 2, 2, '#f4f6fb'); r(7, hy + 3, 2, 2, '#f4f6fb'); p(6, hy + 2, '#1b1b22'); p(5, hy + 5, '#1b1b22'); }
    if (direcao === 'lado') { r(7, hy + 3, 2, 2, '#f4f6fb'); p(5, hy + 2, '#1b1b22'); }
  } else if (estilo === 'capacete-ferro') {
    r(direcao === 'lado' ? 3 : 2, hy + 1, direcao === 'lado' ? 7 : 8, 6, C); r(3, hy, 6, 1, C);
    if (direcao === 'frente') { r(3, hy + 2, 6, 4, v.detalhe); p(4, hy + 3, '#d8fbff'); p(7, hy + 3, '#d8fbff'); r(5, hy + 5, 2, 1, escurecer(v.detalhe)); }
    if (direcao === 'lado') { r(6, hy + 2, 3, 4, v.detalhe); p(7, hy + 3, '#d8fbff'); }
  } else if (estilo === 'capacete-azul') {
    r(direcao === 'lado' ? 3 : 2, hy, direcao === 'lado' ? 6 : 8, 4, C); r(3, hy - 1 < 0 ? 0 : hy - 1, 6, 1, C);
    if (direcao === 'frente') { p(5, hy + 1, '#f2f4f8'); p(6, hy + 1, '#f2f4f8'); p(1, hy + 2, '#f2f4f8'); p(10, hy + 2, '#f2f4f8'); }
    if (direcao === 'costas') r(2, hy, 8, 6, C);
  } else {
    // cabelo comum: topo, franja e laterais
    r(3, hy, 6, 1, C); r(2, hy + 1, 8, 2, C);
    if (direcao === 'frente') {
      p(3, hy + 3, C); p(4, hy + 3, S); p(7, hy + 3, S); p(8, hy + 3, C); p(2, hy + 3, C); p(9, hy + 3, C);
      if (estilo !== 'curto') { r(2, hy + 3, 1, 4, C); r(9, hy + 3, 1, 4, C); }
      else { p(2, hy + 3, C); p(9, hy + 3, C); }
    } else if (direcao === 'lado') {
      r(3, hy + 2, 3, 2, C); r(3, hy + 4, 2, estilo === 'curto' ? 1 : 3, C); p(8, hy + 2, C);
    } else {
      r(2, hy + 1, 8, estilo === 'curto' ? 5 : 7, C);
      if (estilo === 'longo') r(2, hy + 8, 8, 4, C);
      if (estilo === 'ombro') r(2, hy + 8, 8, 1, C);
      r(3, hy + 2, 6, 1, S);
    }
    if (estilo === 'coque') { r(5, hy - 1 < 0 ? 0 : hy - 1, 2, 1, C); if (hy - 1 >= 0) { p(4, hy, C); p(7, hy, C); } p(8, hy, v.detalhe); p(9, hy - 1 >= 0 ? hy - 1 : 0, v.detalhe); }
    if (estilo === 'rabo' && direcao !== 'frente') { if (direcao === 'lado') r(1, hy + 2, 2, 5, C); else r(5, hy + 6, 2, 5, C); }
  }
  if (v.acessorio === 'laco' && direcao === 'frente') { r(3, hy + 2, 6, 1, C); p(5, hy + 3, C); }
  // acessórios por cima
  if (v.acessorio === 'oculos' && direcao === 'frente') { r(3, hy + 4, 2, 1, '#1b1b22'); r(7, hy + 4, 2, 1, '#1b1b22'); p(5, hy + 4, '#1b1b22'); p(6, hy + 4, '#1b1b22'); p(4, hy + 4, '#9fd6ff'); p(7, hy + 4, '#9fd6ff'); }
  if (v.acessorio === 'oculos' && direcao === 'lado') { r(6, hy + 4, 3, 1, '#1b1b22'); p(7, hy + 4, '#9fd6ff'); }
  if (v.acessorio === 'tiara' && direcao !== 'costas') { p(4, hy, v.detalhe); p(7, hy, v.detalhe); r(4, hy + 1, 4, 1, v.detalhe); }
  if (v.acessorio === 'laco') { const lx = direcao === 'lado' ? 3 : 4; r(lx, hy, 4, 1, v.detalhe); p(lx - 1, hy + 1, v.detalhe); p(lx + 4, hy + 1, v.detalhe); }
  if (v.acessorio === 'escudo') {
    if (direcao === 'costas') { r(3, 9 + dy, 6, 5, '#c8323a'); r(4, 10 + dy, 4, 3, '#f2f4f8'); r(5, 11 + dy, 2, 1, '#2f5fb8'); }
    else if (direcao === 'lado') { r(2, 9 + dy, 3, 5, '#c8323a'); p(3, 11 + dy, '#f2f4f8'); }
    else { r(9, 10 + dy, 3, 4, '#c8323a'); p(10, 11 + dy, '#f2f4f8'); p(10, 12 + dy, '#2f5fb8'); }
  }
  return px;
}

const maoDe = v => (v.cabelo[0] === 'mascara' ? '#d9262e' : v.cabelo[0] === 'capacete-ferro' ? v.roupa : v.pele);

// pixels → canvas de 14 × 22 com o contorno
function paraCanvas(px) {
  const W = 12, H = 20;
  const cv = document.createElement('canvas');
  cv.width = LARGURA_SPRITE; cv.height = ALTURA_SPRITE;
  const c = cv.getContext('2d');
  const cheio = (x, y) => x >= 0 && x < W && y >= 0 && y < H && px[y * W + x];
  c.fillStyle = CONTORNO;
  for (let y = -1; y <= H; y++) {
    for (let x = -1; x <= W; x++) {
      if (cheio(x, y)) continue;
      if (cheio(x - 1, y) || cheio(x + 1, y) || cheio(x, y - 1) || cheio(x, y + 1)) c.fillRect(x + 1, y + 1, 1, 1);
    }
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const cor = px[y * W + x];
    if (!cor) continue;
    c.fillStyle = cor;
    c.fillRect(x + 1, y + 1, 1, 1);
  }
  return cv;
}

const guardados = new Map();
/** canvas do quadro (14 × 22). Para a esquerda, quem desenha espelha. */
export function quadroDe(agente, direcao, pose = 'em-pe', passo = 0) {
  const v = visualDe(agente);
  const chave = `${agente.id}|${direcao}|${pose}|${passo}`;
  let cv = guardados.get(chave);
  if (!cv) {
    cv = paraCanvas(desenhar(v, direcao, pose, pose === 'sentado' ? 0 : passo));
    guardados.set(chave, cv);
  }
  return cv;
}

/** desenha o bonequinho com os pés em (x, y) do mapa */
export function desenharBoneco(c, agente, x, y, { direcao = 'frente', esquerda = false, pose = 'em-pe', passo = 0, pulo = 0 } = {}) {
  const cv = quadroDe(agente, direcao, pose, passo);
  const bx = Math.round(x) - 7, by = Math.round(y) - ALTURA_SPRITE + 1 - Math.round(pulo);
  // sombra no chão
  c.fillStyle = 'rgba(20, 16, 30, .22)';
  c.fillRect(Math.round(x) - 4, Math.round(y), 8, 1);
  c.fillRect(Math.round(x) - 3, Math.round(y) + 1, 6, 1);
  if (esquerda) {
    c.save();
    c.translate(bx + LARGURA_SPRITE, by);
    c.scale(-1, 1);
    c.drawImage(cv, 0, 0);
    c.restore();
  } else c.drawImage(cv, bx, by);
}
