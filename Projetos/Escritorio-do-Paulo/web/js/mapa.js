// O mapa do escritório: visto de cima, em pixel art desenhada por código (nenhuma imagem pronta).
// Três ambientes: a sala da equipe (uma mesa por agente), a copa e a sala de
// reunião (onde o coordenador monta os planos). Os personagens são as figurinhas da equipe (avatares.js), por cima
// do cenário. Cada agente tem a sua mesa; o lugar e o movimento de cada um saem do estado real:
//   disponível                                  → na própria mesa, parado, monitor apagado
//   trabalhando, pensando, pesquisando, revisão → na própria mesa, se mexendo, com o monitor aceso
//   aguardando, concluído, com erro             → na mesa, monitor com o sinal do estado e o balão
//   coordenador montando um plano               → vai até a sala de reunião e volta quando termina
//   agente sem mesa (do nono em diante)         → fica na copa
// Ninguém anda ou digita sem uma mudança de estado vinda do servidor.
import { ROTULOS, ICONES, ESTADOS_ATIVOS } from './telas.js';

export const LARGURA = 336;
export const ALTURA = 176;
const VELOCIDADE = 96; // pixels do mapa por segundo
const ESPINHA = 111; // corredor entre os ambientes da esquerda e a sala da equipe

const COR_ESTADO = {
  disponivel: '#7f8a9c', trabalhando: '#4c9aff', pensando: '#b39dff', pesquisando: '#35c9c0',
  aguardando: '#f2b544', revisao: '#ff8f5a', concluido: '#4cc38a', erro: '#ff5d5d',
};

// ---------- lugares ----------
const MESAS = [0, 1, 2, 3].map(i => ({ x: 120 + i * 54, y: 25, fileira: 0 })).concat([0, 1, 2, 3].map(i => ({ x: 120 + i * 54, y: 108, fileira: 1 })));
const assento = mesa => ({ x: mesa.x + 24, y: mesa.y + 45 }); // os pés da figurinha, logo à frente da mesa
const CORREDOR = [84, 166]; // por onde se chega a cada fileira de mesas
const COPA = [[22, 140], [52, 140], [82, 140], [22, 160], [52, 160], [82, 160], [37, 174], [67, 174]];
const REUNIAO = [[22, 62], [84, 62], [22, 80], [84, 80]];
const PORTA = { copa: 132, reuniao: 49 };

function lugarDe(indice, tipo) {
  if (tipo === 'mesa' && MESAS[indice]) {
    const mesa = MESAS[indice];
    const a = assento(mesa);
    const y = CORREDOR[mesa.fileira];
    return { tipo, x: a.x, y: a.y, acesso: [[ESPINHA, y], [a.x, y]] };
  }
  if (tipo === 'reuniao') {
    const [x, y] = REUNIAO[indice % REUNIAO.length];
    return { tipo, x, y, acesso: [[ESPINHA, PORTA.reuniao], [96, PORTA.reuniao], [x, PORTA.reuniao]] };
  }
  const [x, y] = COPA[indice % COPA.length];
  return { tipo: 'copa', x, y, acesso: [[ESPINHA, PORTA.copa], [96, PORTA.copa], [x, PORTA.copa]] };
}

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

  function irPara(f, destino) {
    if (f.lugar && f.lugar.tipo === destino.tipo && f.lugar.x === destino.x && f.lugar.y === destino.y) return;
    const saida = f.lugar ? [...f.lugar.acesso].reverse() : [];
    f.lugar = destino;
    if (!f.posicionado || parado.matches) {
      f.x = destino.x;
      f.y = destino.y;
      f.caminho = [];
      f.posicionado = true;
      return;
    }
    // Se já estava andando, corta direto para o corredor; senão sai pelo acesso do lugar onde estava.
    const inicio = f.caminho.length ? [[ESPINHA, f.y]] : saida;
    f.caminho = [...inicio, ...destino.acesso, [destino.x, destino.y]];
  }

  function atualizar(equipe, tarefas) {
    ordem = equipe.map(a => a.id);
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
      const tipo = !MESAS[indice] ? 'copa' : ativo && tarefa?.tipo === 'plano' ? 'reuniao' : 'mesa';
      if (f.estado && f.estado !== est) {
        f.boneco.classList.remove('acabou-de-mudar');
        void f.boneco.offsetWidth;
        f.boneco.classList.add('acabou-de-mudar');
      }
      f.estado = est;
      f.boneco.dataset.estado = est;
      f.boneco.querySelector('.boneco__balao').innerHTML = est === 'disponivel' ? '' : ICONES[est] || '';
      f.ativo = ativo;
      f.esperando = a.estado.esperandoAgora || [];
      f.tela = a.tela;
      f.indice = indice;
      irPara(f, lugarDe(indice, tipo));
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
    let resta = VELOCIDADE * dt;
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
      const naMesa = f.lugar?.tipo === 'mesa' && !f.caminho.length;
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
      f.boneco.toggleAttribute('data-esquerda', andando && Boolean(f.paraEsquerda));
    }
  }

  function ciclo(agora) {
    const dt = Math.min(0.1, (agora - ultimo) / 1000 || 0);
    ultimo = agora;
    let andando = false;
    for (const f of figuras.values()) {
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
