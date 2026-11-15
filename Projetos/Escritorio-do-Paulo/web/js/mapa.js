// O mapa do escritório: visto de cima, em pixel art desenhada por código (nenhuma imagem pronta).
// Três ambientes: a sala da equipe (uma mesa por agente), a copa e a sala de reunião. Os personagens são as
// figurinhas da equipe (avatares.js), por cima do cenário, e andam por uma rede de caminhos (corredores e portas).
// O que cada um faz sai do estado real:
//   disponível ou concluído          → passeia: café, geladeira, tapete da copa, quadro da sala de reunião, a mesa de
//                                      um colega, e volta para a própria mesa de vez em quando
//   acabou de entregar uma tarefa    → antes de passear, leva a entrega até a mesa de quem continua o trabalho
//   trabalhando, pensando, pesquisando, em revisão, aguardando, com erro
//                                    → volta andando (mais rápido) para a própria mesa e fica lá; monitor aceso
//   coordenador montando um plano    → vai para a sala de reunião
//   agente sem mesa (do nono em diante) → mora na copa
// Ninguém aparece trabalhando sem uma execução real: passear é só de quem está livre.
import { ROTULOS, ICONES, ESTADOS_ATIVOS } from './telas.js';

export const LARGURA = 336;
export const ALTURA = 176;
const PASSEIO = 30; // pixels do mapa por segundo, andando à toa
const PRESSA = 78; // indo trabalhar

const COR_ESTADO = {
  disponivel: '#7f8a9c', trabalhando: '#4c9aff', pensando: '#b39dff', pesquisando: '#35c9c0',
  aguardando: '#f2b544', revisao: '#ff8f5a', concluido: '#4cc38a', erro: '#ff5d5d',
};

// ---------- lugares e caminhos ----------
const MESAS = [0, 1, 2, 3].map(i => ({ x: 120 + i * 54, y: 25, fileira: 0 })).concat([0, 1, 2, 3].map(i => ({ x: 120 + i * 54, y: 108, fileira: 1 })));
const COLUNAS = [144, 198, 252, 306]; // o centro de cada mesa

// Pontos por onde dá para andar (x, y são os pés da figurinha) e as ligações entre eles.
const PONTOS = {
  'espinha-reuniao': [111, 49], 'espinha-fileira0': [111, 84], 'espinha-copa': [111, 132], 'espinha-fileira1': [111, 166],
  'porta-reuniao': [96, 49], 'reuniao-1': [84, 64], 'reuniao-2': [84, 80], 'quadro': [52, 27],
  'porta-copa': [96, 132], 'copa-centro': [58, 132], 'cafe': [17, 124], 'geladeira': [78, 122], 'tapete-1': [34, 152], 'tapete-2': [66, 160],
  'meio': [225, 84], 'planta-esq': [168, 171], 'planta-dir': [282, 171],
};
const LIGACOES = [
  ['espinha-reuniao', 'espinha-fileira0'], ['espinha-fileira0', 'espinha-copa'], ['espinha-copa', 'espinha-fileira1'],
  ['espinha-reuniao', 'porta-reuniao'], ['porta-reuniao', 'reuniao-1'], ['reuniao-1', 'reuniao-2'], ['porta-reuniao', 'quadro'],
  ['espinha-copa', 'porta-copa'], ['porta-copa', 'copa-centro'], ['copa-centro', 'cafe'], ['copa-centro', 'geladeira'],
  ['copa-centro', 'tapete-1'], ['tapete-1', 'tapete-2'], ['copa-centro', 'tapete-2'],
  ['espinha-fileira0', 'corredor0-0'], ['corredor0-0', 'corredor0-1'], ['corredor0-1', 'meio'], ['meio', 'corredor0-2'], ['corredor0-2', 'corredor0-3'],
  ['espinha-fileira1', 'corredor1-0'], ['corredor1-0', 'planta-esq'], ['planta-esq', 'corredor1-1'], ['corredor1-1', 'corredor1-2'],
  ['corredor1-2', 'planta-dir'], ['planta-dir', 'corredor1-3'],
];
COLUNAS.forEach((x, i) => {
  PONTOS[`corredor0-${i}`] = [x, 84];
  PONTOS[`corredor1-${i}`] = [x, 166];
  PONTOS[`mesa-${i}`] = [x, 70];
  PONTOS[`mesa-${i + 4}`] = [x, 153];
  LIGACOES.push([`corredor0-${i}`, `mesa-${i}`], [`corredor1-${i}`, `mesa-${i + 4}`]);
  // ao lado de cada mesa: onde um colega para para conversar ou entregar um trabalho
  const lado = i === 3 ? x - 24 : x + 24;
  PONTOS[`lado-${i}`] = [lado, 66];
  PONTOS[`lado-${i + 4}`] = [lado, 150];
  LIGACOES.push([`corredor0-${i}`, `lado-${i}`], [`corredor1-${i}`, `lado-${i + 4}`]);
});
const COPA_MORADIA = ['tapete-1', 'tapete-2', 'cafe', 'geladeira', 'copa-centro'];
// Para onde quem está livre gosta de ir (as mesas dos colegas entram na hora do sorteio).
const PASSEIOS = ['cafe', 'geladeira', 'tapete-1', 'tapete-2', 'quadro', 'meio', 'planta-esq', 'planta-dir', 'reuniao-2'];

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
const casaDe = indice => (MESAS[indice] ? `mesa-${indice}` : COPA_MORADIA[(indice - MESAS.length) % COPA_MORADIA.length]);
const frenteDaMesa = indice => (MESAS[indice] ? `lado-${indice}` : 'copa-centro');
const sorteio = (min, max) => min + Math.random() * (max - min);

// O que a figurinha livre está fazendo onde parou (balãozinho). 16 px, traço de 1,6.
const svg = d => `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const AFAZERES = {
  cafe: svg('<path d="M3 6h8v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z"/><path d="M11 7h1.5a1.5 1.5 0 0 1 0 3H11M5.5 2.5v1.500M8.5 2.5v1.500"/>'),
  geladeira: svg('<rect x="4" y="2" width="8" height="12" rx="1.5"/><path d="M4 7h8M6 4.5v1M6 9v2"/>'),
  quadro: svg('<path d="M3 13l1-3.500 7-7 2.500 2.500-7 7z"/><path d="M9.500 4l2.500 2.500"/>'),
  'tapete-1': svg('<path d="M2.500 8.500c0-3 2.500-5 5.500-5s5.500 2 5.500 5-2.500 4-5.500 4c-.8 0-1.600-.1-2.300-.3L3 13.500l.8-2.300c-.8-.7-1.300-1.700-1.300-2.700z"/>'),
  'tapete-2': svg('<path d="M8 3v6M5.500 6.500 8 9l2.500-2.500"/><path d="M3 12.500h10"/>'),
  'planta-esq': svg('<path d="M8 14V7M8 9C8 5.500 5.500 4 3 4c0 3 2 5 5 5zM8 8c0-3 2-4.500 5-4.500 0 3-2 4.500-5 4.500z"/>'),
  'planta-dir': svg('<path d="M8 14V7M8 9C8 5.500 5.500 4 3 4c0 3 2 5 5 5zM8 8c0-3 2-4.500 5-4.500 0 3-2 4.500-5 4.500z"/>'),
  meio: svg('<circle cx="8" cy="8" r="5.500"/><path d="M8 5v3l2 1.500"/>'),
  'reuniao-2': svg('<rect x="2.500" y="3" width="11" height="8" rx="1"/><path d="M5 13.500h6M8 11v2.500"/>'),
  conversa: svg('<path d="M2.500 4.500a1.500 1.500 0 0 1 1.500-1.500h6a1.500 1.500 0 0 1 1.500 1.500v3.500a1.500 1.500 0 0 1-1.500 1.500H6.500L4 11.500V9.500a1.500 1.500 0 0 1-1.500-1.500z"/><path d="M11.500 6h1a1.500 1.500 0 0 1 1.500 1.500V11l-1.800-1.300H9"/>'),
  entrega: svg('<path d="M4 2.500h5.500L12 5v8.500H4z"/><path d="M9.500 2.500V5H12M6 8h4M6 10.500h4"/>'),
};

// ---------- cenário (desenhado uma vez) ----------
function desenharCenario(c) {
  const R = (x, y, w, h, cor) => {
    c.fillStyle = cor;
    c.fillRect(x, y, w, h);
  };
  // piso geral: ladrilho creme
  R(0, 0, LARGURA, ALTURA, '#f4e7d0');
  for (let y = 0; y < ALTURA; y += 8) {
    R(0, y, LARGURA, 1, '#ead9bc');
    for (let x = (y / 8) % 2 ? 8 : 0; x < LARGURA; x += 16) R(x, y, 1, 8, '#ead9bc');
  }
  // carpete da sala da equipe
  for (let y = 18; y < 150; y += 4) for (let x = 116; x < 332; x += 4) R(x, y, 4, 4, ((x + y) / 4) % 2 ? '#b9c3c6' : '#aeb9bc');
  R(116, 18, 216, 1, '#9aa6aa'); R(116, 149, 216, 1, '#9aa6aa'); R(116, 18, 1, 132, '#9aa6aa'); R(331, 18, 1, 132, '#9aa6aa');
  // sala de reunião: carpete lilás em zigue-zague
  for (let y = 12; y < 84; y += 4) for (let x = 0; x < 104; x += 4) R(x, y, 4, 4, ((x >> 2) + ((y >> 3) % 2)) % 2 ? '#8f90d4' : '#8485ca');
  // copa: piso claro
  R(0, 92, 104, 84, '#f5f3f9');
  for (let y = 92; y < ALTURA; y += 12) R(0, y, 104, 1, '#e6e2ee');
  for (let x = 0; x < 104; x += 12) R(x, 92, 1, 84, '#e6e2ee');
  for (let y = 116; y < 176; y += 4) for (let x = 8; x < 96; x += 4) R(x, y, 4, 4, ((x + y) / 4) % 2 ? '#dcd8f0' : '#d3cfea');
  R(8, 116, 88, 1, '#bcb6de'); R(8, 116, 1, 60, '#bcb6de'); R(95, 116, 1, 60, '#bcb6de');

  // paredes
  const parede = (x, y, w, h) => {
    R(x, y, w, h, '#5d6780');
    R(x, y, w, 2, '#8d97ad');
    if (h >= 8) R(x, y + h - 3, w, 3, '#4a5369');
  };
  parede(0, 0, LARGURA, 12);
  parede(0, 84, 104, 8);
  R(104, 0, 4, 40, '#5d6780'); R(104, 58, 4, 64, '#5d6780'); R(104, 142, 4, 34, '#5d6780');
  R(104, 0, 1, 40, '#8d97ad'); R(104, 58, 1, 64, '#8d97ad'); R(104, 142, 1, 34, '#8d97ad');
  R(104, 40, 4, 1, '#3f4759'); R(104, 57, 4, 1, '#3f4759'); R(104, 122, 4, 1, '#3f4759'); R(104, 141, 4, 1, '#3f4759');

  // janelas na parede do fundo
  for (const x of [128, 182, 236, 290]) {
    R(x, 2, 32, 8, '#2f3a55'); R(x + 1, 3, 30, 6, '#7fc4ee'); R(x + 1, 3, 30, 2, '#a9dbf7'); R(x + 15, 3, 2, 6, '#2f3a55');
  }

  // sala de reunião: quadro branco, mesa e cadeiras
  R(26, 2, 52, 9, '#39425a'); R(27, 3, 50, 7, '#f6f8fb'); R(31, 5, 14, 1, '#4c9aff'); R(31, 7, 20, 1, '#9aa5b8'); R(56, 5, 6, 3, '#f2b544'); R(65, 5, 6, 3, '#4cc38a');
  const cadeira = (x, y, cor = '#d9814b') => {
    R(x, y, 10, 9, cor); R(x + 1, y + 1, 8, 5, '#eea06d'); R(x, y + 8, 10, 1, '#a85f33');
  };
  cadeira(38, 30); cadeira(56, 30); cadeira(38, 70); cadeira(56, 70);
  R(34, 42, 36, 24, '#c98a54'); R(35, 43, 34, 20, '#e2a871'); R(34, 65, 36, 2, '#9c6537'); R(44, 49, 9, 6, '#f6f8fb'); R(56, 51, 5, 4, '#4c9aff');
  R(6, 16, 8, 8, '#e07b3a'); R(5, 10, 10, 7, '#3fae5a'); R(7, 8, 6, 3, '#56c873'); // planta

  // copa: balcão, cafeteira, geladeira, sofá, plantas
  R(4, 93, 60, 14, '#c9d1de'); R(4, 93, 60, 10, '#f6f8fb'); R(4, 106, 60, 2, '#8a93a5');
  R(10, 88, 12, 13, '#3a4256'); R(12, 90, 8, 4, '#7fc4ee'); R(13, 96, 6, 4, '#20263a'); R(14, 100, 4, 1, '#ff8f5a'); // cafeteira
  R(28, 95, 5, 6, '#ffffff'); R(29, 96, 3, 1, '#b07a4a'); R(36, 95, 5, 6, '#ff7ab8'); R(37, 96, 3, 1, '#b07a4a'); // xícaras
  R(48, 94, 10, 7, '#e07b3a'); R(49, 95, 8, 2, '#f6c26b'); // bandeja
  R(70, 86, 16, 24, '#dfe5ee'); R(71, 87, 14, 9, '#f6f8fb'); R(71, 97, 14, 12, '#f6f8fb'); R(83, 90, 1, 4, '#8a93a5'); R(83, 100, 1, 6, '#8a93a5'); // geladeira
  R(90, 100, 8, 8, '#e07b3a'); R(89, 93, 10, 8, '#3fae5a'); R(91, 90, 6, 4, '#56c873');

  // mesas da equipe
  MESAS.forEach((m, i) => {
    const cx = m.x + 24;
    R(m.x + 1, m.y + 15, 2, 4, '#8a93a5'); R(m.x + 45, m.y + 15, 2, 4, '#8a93a5');
    R(m.x, m.y, 48, 13, '#ffffff'); R(m.x, m.y + 13, 48, 2, '#c9d1de'); R(m.x, m.y, 48, 1, '#e9edf5');
    R(cx - 1, m.y + 3, 3, 3, '#2b3242'); R(cx - 4, m.y + 5, 9, 1, '#2b3242');
    R(cx - 8, m.y - 8, 17, 11, '#2b3242'); R(cx - 7, m.y - 7, 15, 9, '#414c63');
    R(cx - 6, m.y + 8, 12, 3, '#aab3c2'); R(cx - 5, m.y + 9, 10, 1, '#7a8496'); R(cx + 8, m.y + 9, 3, 2, '#aab3c2');
    // um objeto diferente em cada mesa
    const ox = m.x + 4;
    const oy = m.y + 2;
    const objetos = [
      () => { R(ox, oy + 3, 5, 6, '#2456b8'); R(ox + 1, oy + 4, 3, 1, '#f1f3f7'); }, // caneca
      () => { R(ox, oy + 1, 9, 8, '#2b3242'); R(ox + 1, oy + 2, 7, 6, '#ff7ab8'); R(ox + 3, oy + 4, 3, 2, '#fff'); }, // mesa digitalizadora
      () => { R(ox + 1, oy + 4, 6, 5, '#f0b93a'); R(ox + 3, oy, 2, 5, '#b0121c'); }, // miniatura
      () => { R(ox, oy + 2, 8, 7, '#a51e28'); R(ox + 1, oy + 3, 6, 5, '#f6f8fb'); R(ox + 2, oy + 4, 4, 1, '#9aa5b8'); }, // livro
      () => { R(ox, oy + 4, 7, 5, '#cf2230'); R(ox + 2, oy + 2, 3, 3, '#1f4fb5'); }, // lancheira
      () => { R(ox, oy + 1, 3, 8, '#6fbf4a'); R(ox + 4, oy + 3, 3, 6, '#5d3f8f'); }, // frascos
      () => { R(ox + 1, oy + 3, 6, 6, '#d9304f'); R(ox + 3, oy + 1, 2, 2, '#ff6f86'); }, // vela
      () => { R(ox, oy + 3, 8, 6, '#14161b'); R(ox + 3, oy + 5, 2, 2, '#d92b2b'); }, // pasta
    ];
    objetos[i % objetos.length]();
    R(m.x + 38, m.y + 4, 6, 5, '#e07b3a'); R(m.x + 37, m.y - 1, 8, 6, '#3fae5a'); R(m.x + 39, m.y - 3, 4, 3, '#56c873'); // planta
    // cadeira
    R(cx - 6, m.y + 19, 13, 12, '#2f3747'); R(cx - 5, m.y + 20, 11, 8, '#3d4658'); R(cx - 3, m.y + 22, 7, 4, '#4a5469');
  });

  // plantas grandes e um banco no corredor de baixo
  for (const x of [120, 316]) {
    R(x + 1, 160, 10, 9, '#e07b3a'); R(x, 150, 12, 11, '#3fae5a'); R(x + 2, 146, 8, 5, '#56c873'); R(x + 4, 143, 4, 4, '#3fae5a');
  }
  for (let x = 190; x < 262; x += 6) { R(x, 164, 5, 9, '#3fae5a'); R(x + 1, 161, 3, 4, '#56c873'); }
  R(188, 172, 76, 3, '#2c8a49');
}

// ---------- o mapa ----------
export function criarMapa(moldura, { aoAbrir, figura }) {
  moldura.innerHTML = `
    <div class="mapa__tela">
      <canvas class="mapa__canvas" width="${LARGURA}" height="${ALTURA}" role="img" aria-label="Mapa do escritório, visto de cima"></canvas>
      <div class="mapa__sobre" data-sobre>
        <span class="mapa__zona" style="left:${(52 / LARGURA) * 100}%;top:${(22 / ALTURA) * 100}%">Sala de reunião</span>
        <span class="mapa__zona" style="left:${(52 / LARGURA) * 100}%;top:${(121 / ALTURA) * 100}%">Copa</span>
        <span class="mapa__zona" style="left:${(224 / LARGURA) * 100}%;top:${(88 / ALTURA) * 100}%">Equipe</span>
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
  let ordem = [];
  let fator = 0;
  let ultimo = 0;
  let tique = 0;
  let acumulado = 0;
  let sujo = true;

  function ajustarTamanho() {
    const largura = canvas.clientWidth || LARGURA;
    const novo = Math.max(2, Math.min(8, Math.ceil((largura / LARGURA) * (devicePixelRatio || 1))));
    if (novo !== fator) {
      fator = novo;
      canvas.width = LARGURA * fator;
      canvas.height = ALTURA * fator;
    }
    moldura.style.setProperty('--escala', String(largura / LARGURA));
    sujo = true;
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
    if (f.noPonto === destino && !f.caminho.length) return;
    const origem = f.caminho.length ? pontoMaisPerto(f.x, f.y) : f.noPonto || pontoMaisPerto(f.x, f.y);
    f.noPonto = null;
    f.caminho = rota(origem, destino).map(n => PONTOS[n]);
  }

  // Quem está livre escolhe o próximo lugar: às vezes a própria mesa, às vezes a mesa de um colega, às vezes um
  // canto do escritório. Dois não escolhem o mesmo lugar ao mesmo tempo.
  function proximoPasseio(f) {
    const ocupados = new Set([...figuras.values()].filter(o => o !== f).map(o => o.destino));
    if (Math.random() < 0.3) return casaDe(f.indice);
    const colegas = [...figuras.values()].filter(o => o !== f && MESAS[o.indice]).map(o => frenteDaMesa(o.indice));
    const opcoes = [...PASSEIOS, ...colegas.slice(0, 3)].filter(n => !ocupados.has(n) && n !== f.noPonto);
    return opcoes[Math.floor(Math.random() * opcoes.length)] || casaDe(f.indice);
  }

  const situacaoAntes = new Map(); // tarefa -> situação na última atualização
  function atualizar(equipe, tarefas) {
    ordem = equipe.map(a => a.id);
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
        boneco.innerHTML = '<span class="boneco__corpo"></span><span class="boneco__balao"></span>';
        boneco.addEventListener('click', () => aoAbrir(a.id));
        sobre.append(boneco, cracha);
        f = { id: a.id, x: 0, y: 0, caminho: [], cracha, boneco, passo: 0, frente: true, chaveFigura: '' };
        figuras.set(a.id, f);
      }
      const chaveFigura = `${a.avatar}|${a.avatarPessoal || ''}`;
      if (f.chaveFigura !== chaveFigura) {
        f.chaveFigura = chaveFigura;
        f.boneco.querySelector('.boneco__corpo').innerHTML = figura(a);
      }
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
        f.modo = 'posto';
        f.entrega = null;
        f.levando = false;
        irPara(f, presa, { pressa: true });
      } else {
        if (!f.posicionado) irPara(f, casaDe(indice)); // aparece na própria mesa
        if (f.modo !== 'livre') {
          f.modo = 'livre';
          f.ate = performance.now() + (f.entrega ? 300 : sorteio(1200, 4500));
        }
      }
      f.cracha.dataset.estado = est;
      f.cracha.querySelector('.cracha__nome').textContent = a.nome;
      f.cracha.querySelector('.cracha__estado').textContent = est === 'disponivel' ? '' : ROTULOS[est];
      f.cracha.title = `${a.nome} · ${a.papel} · ${ROTULOS[est]}${a.estado.atividade ? `: ${a.estado.atividade}` : ''}`;
      f.cracha.setAttribute('aria-label', `${f.cracha.title}. Abrir detalhes.`);
    });
    sujo = true;
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
      if (d <= resta) {
        f.x = ax;
        f.y = ay;
        f.caminho.shift();
        resta -= d;
        if (!f.caminho.length) {
          f.noPonto = f.destino;
          if (f.modo === 'livre') f.ate = performance.now() + (f.pausa || sorteio(3500, 9000));
        }
      } else {
        f.x += (dx / d) * resta;
        f.y += (dy / d) * resta;
        if (Math.abs(dx) > 0.5) f.paraEsquerda = dx < 0;
        resta = 0;
      }
    }
  }

  function tela(f, mesa) {
    const cx = mesa.x + 24;
    const x0 = cx - 7;
    const y0 = mesa.y - 7;
    const cor = COR_ESTADO[f.estado];
    q.fillStyle = '#0d1320';
    q.fillRect(x0, y0, 15, 9);
    q.fillStyle = cor;
    if (f.tela === 'figma') {
      q.fillRect(x0 + 1, y0 + 1, 4, 7);
      q.globalAlpha = tique % 4 < 2 ? 1 : 0.55;
      q.fillRect(x0 + 7, y0 + 1, 7, 3);
      q.globalAlpha = 1;
      q.fillRect(x0 + 7 + (tique % 3) * 2, y0 + 5, 3, 3);
    } else if (f.tela === 'rede' || f.tela === 'dados') {
      for (let i = 0; i < 5; i += 1) {
        const h = 2 + ((i * 3 + tique) % 5);
        q.fillRect(x0 + 1 + i * 3, y0 + 8 - h, 2, h);
      }
    } else {
      for (let l = 0; l < 4; l += 1) q.fillRect(x0 + 1 + (l % 2), y0 + 1 + l * 2, 3 + ((l * 5 + tique) % 9), 1);
    }
  }

  function fioDeEspera(de, para) {
    // linha tracejada entre quem espera e quem está sendo esperado
    const x0 = Math.round(de.x);
    const y0 = Math.round(de.y) - 18;
    const x1 = Math.round(para.x);
    const y1 = Math.round(para.y) - 18;
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
        q.fillRect(m.x + 17, m.y - 7, 15, 9);
        q.fillStyle = COR_ESTADO[f.estado];
        q.fillRect(m.x + 23, m.y - 4, 3, 3);
      }
    }
    for (const f of lista) for (const id of f.esperando) if (figuras.has(id) && f.estado === 'aguardando') fioDeEspera(figuras.get(id), f);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(quadro, 0, 0, canvas.width, canvas.height);
    for (const f of figuras.values()) {
      const andando = f.caminho.length > 0;
      f.boneco.style.left = f.cracha.style.left = `${(f.x / LARGURA) * 100}%`;
      f.boneco.style.top = `${(f.y / ALTURA) * 100}%`;
      f.boneco.style.zIndex = String(Math.round(f.y));
      f.cracha.style.top = `${((f.y - 34) / ALTURA) * 100}%`;
      f.cracha.style.zIndex = String(400 + Math.round(f.y));
      f.boneco.toggleAttribute('data-andando', andando);
      f.boneco.toggleAttribute('data-fora', !andando && f.noPonto !== casaDe(f.indice) && f.modo === 'livre');
      f.boneco.dataset.lugar = andando ? '' : f.noPonto || '';
      // Balão: o estado, quando há um; para quem está livre, o que está fazendo onde parou.
      let balao = f.estado === 'disponivel' ? '' : ICONES[f.estado] || '';
      if (f.modo === 'livre' && f.estado === 'disponivel') {
        if (f.levando) balao = AFAZERES.entrega;
        else if (!andando && f.noPonto && f.noPonto !== casaDe(f.indice)) balao = AFAZERES[f.noPonto] || (f.noPonto.startsWith('lado-') ? AFAZERES.conversa : '');
      } else if (f.modo === 'livre' && f.levando) {
        balao = AFAZERES.entrega;
      }
      if (f.balao !== balao) {
        f.balao = balao;
        f.boneco.querySelector('.boneco__balao').innerHTML = balao;
        f.boneco.toggleAttribute('data-afazer', Boolean(balao) && f.modo === 'livre' && (f.estado === 'disponivel' || f.levando));
      }
      f.boneco.toggleAttribute('data-esquerda', andando && Boolean(f.paraEsquerda));
    }
  }

  function ciclo(agora) {
    const dt = Math.min(0.1, (agora - ultimo) / 1000 || 0);
    ultimo = agora;
    let andando = false;
    for (const f of figuras.values()) {
      if (f.modo === 'livre' && !f.caminho.length && f.ate && agora >= f.ate && !parado.matches) {
        if (f.entrega && figuras.has(f.entrega)) {
          // leva a entrega: para na frente da mesa do colega um pouco mais
          irPara(f, frenteDaMesa(figuras.get(f.entrega).indice), { parar: 2600 });
          f.levando = true;
          f.entrega = null;
        } else {
          f.levando = false;
          irPara(f, proximoPasseio(f));
        }
      }
      if (f.caminho.length) {
        mover(f, dt);
        andando = true;
      }
    }
    acumulado += dt;
    const vivo = [...figuras.values()].some(f => f.ativo || f.estado === 'aguardando');
    if (acumulado >= 0.14) {
      acumulado = 0;
      if (andando || (vivo && !parado.matches)) {
        tique += 1;
        sujo = true;
      }
    }
    if (andando) sujo = true;
    if (sujo) {
      sujo = false;
      desenhar();
    }
    requestAnimationFrame(ciclo);
  }
  ajustarTamanho();
  requestAnimationFrame(ciclo);

  return { atualizar, marcarAberto };
}
