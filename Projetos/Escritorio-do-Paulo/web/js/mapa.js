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
import { LARGURA, ALTURA } from './temas/medidas.js';
import escritorio from './temas/escritorio.js';
import apartamento from './temas/apartamento.js';

export { LARGURA, ALTURA };
export const TEMAS = { apartamento, escritorio };
export const TEMA_PADRAO = 'apartamento';

const PASSEIO = 26; // pixels do mapa por segundo, andando à toa
const PRESSA = 70; // indo trabalhar

const COR_ESTADO = {
  disponivel: '#7f8a9c', trabalhando: '#4c9aff', pensando: '#b39dff', pesquisando: '#35c9c0',
  aguardando: '#f2b544', revisao: '#ff8f5a', concluido: '#4cc38a', erro: '#ff5d5d',
};

// O tema em uso (salas, mesas, rede de caminhos, lugares de lazer e o desenho do cenário) e o que sai dele.
let T = TEMAS[TEMA_PADRAO];
let PONTOS, LAZER, MESAS, DIVERSAO, VIZINHOS;
function aplicarTema(tema) {
  T = tema;
  ({ pontos: PONTOS, lazer: LAZER, mesas: MESAS } = tema);
  DIVERSAO = Object.keys(LAZER).filter(n => !T.par || n !== T.par.b);
  VIZINHOS = {};
  for (const [a, b] of tema.ligacoes) {
    (VIZINHOS[a] ||= []).push(b);
    (VIZINHOS[b] ||= []).push(a);
  }
}
aplicarTema(T);


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
// quem não tem mesa (do último lugar em diante) mora num canto de lazer do tema
const casaDe = indice => (MESAS[indice] ? `mesa-${indice}` : T.moradia[(indice - MESAS.length) % T.moradia.length]);
const frenteDaMesa = indice => (MESAS[indice] ? `lado-${indice}` : T.moradia[T.moradia.length - 1]);
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
  panela: svg('<path d="M3 7h10v3a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z"/><path d="M1.5 8H3M13 8h1.5M6 4.5c0-1 1-1 1-2M9.5 4.5c0-1 1-1 1-2"/>'),
  olho: svg('<path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/>'),
  musica: svg('<path d="M6 12V3.5l7-1.5V10"/><circle cx="4.5" cy="12" r="1.8"/><circle cx="11.5" cy="10" r="1.8"/>'),
  tv: svg('<rect x="2" y="4" width="12" height="8" rx="1"/><path d="M5.5 14h5M6 1.5l2 2.5 2-2.5"/>'),
  cartas: svg('<rect x="2.5" y="3.5" width="7" height="10" rx="1" transform="rotate(-10 6 8.5)"/><rect x="7" y="3" width="7" height="10" rx="1"/><path d="M10.5 6.5v3M9 8h3"/>'),
  cama: svg('<path d="M2 12V5M2 9h12v3M14 12V9a2 2 0 0 0-2-2H7v2"/><circle cx="4.5" cy="7.5" r="1.2"/>'),
  espelho: svg('<ellipse cx="8" cy="7" rx="4" ry="5"/><path d="M8 12v2.5M5.5 14.5h5M6.5 5l2-1.5"/>'),
  entrega: svg('<path d="M4 2.5h5.5L12 5v8.5H4z"/><path d="M9.5 2.5V5H12M6 8h4M6 10.5h4"/>'),
};


// ---------- o mapa ----------
export function criarMapa(moldura, { aoAbrir, tema = TEMA_PADRAO }) {
  aplicarTema(TEMAS[tema] || TEMAS[TEMA_PADRAO]);
  const zona = ([nome, x, y]) => `<span class="mapa__zona" style="left:${(x / LARGURA) * 100}%;top:${(y / ALTURA) * 100}%">${nome}</span>`;
  moldura.innerHTML = `
    <div class="mapa__tela">
      <canvas class="mapa__canvas" width="${LARGURA}" height="${ALTURA}" role="img" aria-label="${T.descricao}"></canvas>
      <div class="mapa__sobre" data-sobre>
        <div class="mapa__zonas" data-zonas>${T.zonas.map(zona).join('')}</div>
      </div>
    </div>`;
  const canvas = moldura.querySelector('canvas');
  const sobre = moldura.querySelector('[data-sobre]');
  const ctx = canvas.getContext('2d');
  const cenario = document.createElement('canvas');
  cenario.width = LARGURA;
  cenario.height = ALTURA;
  T.desenhar(cenario.getContext('2d'));
  moldura.dataset.tema = T.id;
  moldura.style.setProperty('--fundo-mapa', T.fundo);
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
    const par = T.par;
    if (par && !ocupados.has(par.a) && !ocupados.has(par.b) && Math.random() < 0.4) {
      const parceiros = [...figuras.values()].filter(o => o !== f && o.modo === 'livre' && !o.par && !o.levando && !o.entrega);
      if (parceiros.length) {
        const o = parceiros[Math.floor(Math.random() * parceiros.length)];
        const tempo = sorteio(...LAZER[par.a].tempo) * 1000;
        f.par = o.id; o.par = f.id;
        irPara(o, par.b, { parar: tempo });
        return { destino: par.a, parar: tempo };
      }
    }
    const opcoes = DIVERSAO.filter(n => (!par || n !== par.a) && !ocupados.has(n) && n !== f.noPonto);
    const destino = opcoes[Math.floor(Math.random() * opcoes.length)] || f.noPonto || DIVERSAO[0];
    const lazer = LAZER[destino];
    return { destino, parar: lazer ? sorteio(...lazer.tempo) * 1000 : 0 };
  }

  const situacaoAntes = new Map(); // tarefa -> situação na última atualização
  let ultimaEquipe = [];
  let ultimasTarefas = [];
  function atualizar(equipe, tarefas) {
    ultimaEquipe = equipe;
    ultimasTarefas = tarefas;
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
      const presa = ativo && tarefa?.tipo === 'plano' ? T.reuniao[0] : casaDe(indice);
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
    if (lugar.startsWith('mesa-')) return { pose: 'sentado', dir: MESAS[Number(lugar.slice(5))]?.dir || 'costas' };
    if (T.reuniao.includes(lugar)) return { pose: 'sentado', dir: 'costas' };
    if (lugar.startsWith('lado-')) return { pose: 'em-pe', dir: 'costas' };
    const l = LAZER[lugar];
    if (l) return { pose: l.pose || 'em-pe', dir: l.dir, esquerda: Boolean(l.esquerda) };
    return { pose: 'em-pe', dir: 'frente' };
  }

  // monitor da mesa, a TV do videogame e o fliperama
  function tela(f, mesa) {
    const x0 = mesa.x - 7;
    const y0 = mesa.telaY ?? mesa.y - 8;   // telaY: mesas em que a pessoa senta de frente, com a tela abaixo dela
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
  // pingue-pongue: a bolinha vai e volta quando os dois estão nos lugares
  function bolinha() {
    const par = T.par;
    if (!par?.bola) return null;
    const a = [...figuras.values()].find(f => !f.caminho.length && f.noPonto === par.a);
    const b = a && a.par ? figuras.get(a.par) : null;
    if (!a || !b || b.caminho.length || b.noPonto !== par.b) return null;
    const periodo = 1.3;
    const fase = (relogio % periodo) / periodo;            // 0..1 ida e volta
    const ida = fase < 0.5 ? fase * 2 : 2 - fase * 2;      // 0 em a, 1 em b
    const x0 = PONTOS[par.a][0] + 7, x1 = PONTOS[par.b][0] - 7;
    const x = x0 + (x1 - x0) * ida;
    // quica uma vez no lado do outro: dois arcos por travessia
    const meio = ida < 0.5 ? ida * 2 : (ida - 0.5) * 2;
    const y = par.bola.altura - Math.sin(meio * Math.PI) * (ida < 0.5 === fase < 0.5 ? 9 : 6);
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
        const ty = m.telaY ?? m.y - 8;
        q.fillRect(m.x - 7, ty, 14, 8);
        q.fillStyle = COR_ESTADO[f.estado];
        q.fillRect(m.x - 1, ty + 3, 3, 3);
      }
    }
    T.animar?.(q, { figuras: [...figuras.values()], tique, relogio });
    const bola = bolinha();
    // bonecos de trás para a frente (quem está mais embaixo fica na frente)
    for (const f of [...lista].sort((a, b) => a.y - b.y)) {
      const p = pose(f);
      let pulo = 0;
      if (bola && ((f.noPonto === T.par.a && bola.quemBate === 'a') || (f.noPonto === T.par.b && bola.quemBate === 'b'))) pulo = 1;
      if (!f.caminho.length && T.telasDeJogo.includes(f.noPonto) && tique % 6 === 0) pulo = 1;   // vibra com o jogo
      desenharBoneco(q, f.agente, f.x, f.y, { direcao: p.dir, esquerda: p.esquerda, pose: p.pose, passo: p.passo || 0, pulo });
      // raquete na mão de quem joga
      if (T.par?.raquete && !f.caminho.length && (f.noPonto === T.par.a || f.noPonto === T.par.b) && f.par) {
        const lado = f.noPonto === T.par.a ? 1 : -1;
        q.fillStyle = f.noPonto === T.par.a ? '#d93a3a' : '#2a55c8';
        q.fillRect(Math.round(f.x) + lado * 5 - 1, Math.round(f.y) - 11 - pulo, 3, 3);
        q.fillStyle = '#8c5f36';
        q.fillRect(Math.round(f.x) + lado * 4, Math.round(f.y) - 8 - pulo, 1, 2);
      }
    }
    if (bola) {
      q.fillStyle = 'rgba(20,16,30,.25)'; q.fillRect(Math.round(bola.x) - 1, T.par.bola.sombra, 2, 1);
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

  // Troca o cenário ao vivo: redesenha o fundo e cada uma reaparece no lugar certo do tema novo.
  function trocarTema(id) {
    const tema = TEMAS[id];
    if (!tema || tema === T) return;
    aplicarTema(tema);
    T.desenhar(cenario.getContext('2d'));
    moldura.dataset.tema = T.id;
    moldura.style.setProperty('--fundo-mapa', T.fundo);
    canvas.setAttribute('aria-label', T.descricao);
    moldura.querySelector('[data-zonas]').innerHTML = T.zonas.map(zona).join('');
    for (const f of figuras.values()) {
      soltarPar(f);
      Object.assign(f, { posicionado: false, caminho: [], noPonto: null, destino: null, modo: null, ate: 0, levando: false, entrega: null });
    }
    atualizar(ultimaEquipe, ultimasTarefas);
  }

  return { atualizar, marcarAberto, trocarTema, tema: () => T.id };
}
