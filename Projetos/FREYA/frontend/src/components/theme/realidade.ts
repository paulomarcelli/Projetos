/**
 * Scarlet Reality Shift — a troca de tema como magia do caos escarlate.
 *
 * Interação rara (algumas vezes por dia, no máximo): está no orçamento de "encanto", por isso pode
 * passar do teto de 300ms da interface. Linha do tempo (~850ms):
 *
 *   0–90ms     concentração: o núcleo de energia acende no botão e faíscas convergem para ele;
 *   90ms       a troca acontece. Com View Transitions, o DOM novo é capturado e revelado por um recorte
 *              orgânico (polígono ondulado de 96 vértices) que se expande a partir do botão em 640ms
 *              (curva --ease-drawer); a camada nova entra de scale(1.03) → 1 e a antiga é empurrada pela
 *              onda (1 → 1.015), como se a superfície se reorganizasse;
 *   junto      uma <canvas> transitória desenha a frente de energia exatamente sobre a borda do recorte
 *              (anel com brilho em três passadas, dois ecos, um véu na borda, 9 filamentos em espiral
 *              e ~96 fragmentos — hexágonos, losangos e estrelinhas de quatro pontas da logo);
 *   +120ms     dissipação: os fragmentos apagam e a canvas é removida.
 *
 * Sem View Transitions: o mesmo efeito na canvas, com o tema trocado por baixo num esmaecimento de cor de
 * 420ms. Com movimento reduzido (sistema ou preferência): nada se move — o tema troca na hora e as cores
 * esmaecem em 180ms.
 *
 * Desempenho: no DOM só clip-path, transform e opacity (nas pseudo-camadas da transição); a canvas tem
 * DPR limitado a 1,75, trabalho fixo por quadro e nenhuma leitura de layout durante a animação.
 * Cliques repetidos enquanto o efeito roda são ignorados (a promessa em andamento é devolvida).
 */

export interface Ponto {
  x: number;
  y: number;
}

export interface OpcoesDoRealityShift {
  /** true = sem partículas nem anéis: só um esmaecimento curto de cor. */
  reduzido?: boolean;
  /**
   * O tema de destino. Quando informado, o data-tema do <html> é aplicado já dentro da captura da
   * View Transition (o contexto aplica o mesmo valor logo depois), o que evita esperar o efeito do
   * React e congelar a tela por um ou dois quadros.
   */
  temaNovo?: "claro" | "escuro";
}

const CONCENTRAR = 90;
const REVELAR = 640;
const DISSIPAR = 120;
const SUAVE = 180;
const SUAVE_SEM_VT = 420;
const VERTICES = 96;
const QUADROS_DO_RECORTE = 32;
const NOME_DA_TELA = "realidade-energia";

let emAndamento: Promise<void> | null = null;

/** true enquanto o efeito roda (útil para desabilitar o botão visualmente, se quiser). */
export function realityShiftEmAndamento() {
  return emAndamento !== null;
}

export function executarRealityShift(origem: Ponto, trocarTema: () => void, opcoes: OpcoesDoRealityShift = {}): Promise<void> {
  if (emAndamento) return emAndamento;
  const reduzido = opcoes.reduzido ?? movimentoReduzidoNoDocumento();
  let execucao: Promise<void>;
  try {
    execucao = reduzido || typeof document === "undefined" ? trocaSuave(trocarTema, SUAVE) : trocaCompleta(origem, trocarTema, opcoes.temaNovo);
  } catch {
    trocarTema();
    execucao = Promise.resolve();
  }
  const p = execucao.finally(() => {
    emAndamento = null;
  });
  emAndamento = p;
  return p;
}

/* ── Movimento reduzido: só cor ──────────────────────────────────── */

function trocaSuave(trocarTema: () => void, duracao: number): Promise<void> {
  const raiz = document.documentElement;
  raiz.style.setProperty("--troca-duracao", `${duracao}ms`);
  raiz.setAttribute("data-troca-suave", "");
  trocarTema(); // imediato
  return esperar(duracao + 40).then(() => {
    raiz.removeAttribute("data-troca-suave");
    raiz.style.removeProperty("--troca-duracao");
  });
}

function movimentoReduzidoNoDocumento() {
  if (typeof document === "undefined") return true;
  if (document.documentElement.dataset.movimento === "reduzido") return true;
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ── Efeito completo ─────────────────────────────────────────────── */

async function trocaCompleta(origem: Ponto, trocarTema: () => void, temaNovo?: "claro" | "escuro"): Promise<void> {
  const raiz = document.documentElement;
  const tela = criarTela();
  if (!tela) return trocaSuave(trocarTema, SUAVE_SEM_VT);
  const { canvas, ctx, largura, altura } = tela;

  const temVT = typeof (document as unknown as DocumentoComVT).startViewTransition === "function" && !document.hidden;
  const raioMax = Math.hypot(Math.max(origem.x, largura - origem.x), Math.max(origem.y, altura - origem.y)) * 1.1;
  const indoParaEscuro = temaNovo ? temaNovo === "escuro" : raiz.dataset.tema !== "escuro";
  const desenho = new Energia(ctx, origem, raioMax, largura, altura, indoParaEscuro);

  let trocou = false;
  const trocar = () => {
    if (trocou) return;
    trocou = true;
    trocarTema();
  };

  const laco = desenho.iniciar();
  await esperar(CONCENTRAR);

  try {
    if (temVT) {
      raiz.setAttribute("data-realidade", "");
      raiz.setAttribute("data-sem-transicao", "");
      const vt = (document as unknown as DocumentoComVT).startViewTransition!(async () => {
        const mudou = temaMudou();
        trocar();
        if (temaNovo) raiz.dataset.tema = temaNovo;
        await mudou;
      });
      await vt.ready;
      desenho.liberarFrente(performance.now());
      animarCamadas(raiz, origem, raioMax);
      await vt.finished;
    } else {
      raiz.style.setProperty("--troca-duracao", `${SUAVE_SEM_VT}ms`);
      raiz.setAttribute("data-troca-suave", "");
      desenho.liberarFrente(performance.now());
      trocar();
      await esperar(SUAVE_SEM_VT);
    }
  } catch {
    trocar();
    desenho.liberarFrente(performance.now());
  } finally {
    raiz.removeAttribute("data-realidade");
    raiz.removeAttribute("data-sem-transicao");
    raiz.removeAttribute("data-troca-suave");
    raiz.style.removeProperty("--troca-duracao");
  }

  await laco;
  canvas.remove();
}

/* Recorte orgânico e transformação das superfícies, nas pseudo-camadas da View Transition. */
function animarCamadas(raiz: HTMLElement, origem: Ponto, raioMax: number) {
  const quadros: Keyframe[] = [];
  for (let k = 0; k < QUADROS_DO_RECORTE; k++) {
    const p = k / (QUADROS_DO_RECORTE - 1);
    quadros.push({ clipPath: poligono(origem, raioMax * easeDrawer(p), p) });
  }
  const opcoes = { duration: REVELAR, easing: "linear", fill: "both" as FillMode };
  raiz.animate(quadros, { ...opcoes, pseudoElement: "::view-transition-new(root)" });
  const centro = `${origem.x}px ${origem.y}px`;
  raiz.animate(
    [
      { transform: "scale(1.03)", transformOrigin: centro },
      { transform: "scale(1)", transformOrigin: centro },
    ],
    { duration: REVELAR, easing: "cubic-bezier(0.23, 1, 0.32, 1)", pseudoElement: "::view-transition-new(root)" },
  );
  raiz.animate(
    [
      { transform: "scale(1)", transformOrigin: centro },
      { transform: "scale(1.015)", transformOrigin: centro },
    ],
    { duration: REVELAR, easing: "cubic-bezier(0.32, 0.72, 0, 1)", fill: "both", pseudoElement: "::view-transition-old(root)" },
  );
}

/** Raio ondulado da frente: o mesmo para o recorte (CSS) e para o anel (canvas), para casarem. */
function raioOndulado(raio: number, angulo: number, p: number) {
  const amplitude = 0.085 * (1 - p) + 0.025;
  const onda = 0.6 * Math.sin(3 * angulo + 5.2 * p + 0.7) + 0.4 * Math.sin(7 * angulo - 8.4 * p + 2.1);
  return raio * (1 + amplitude * onda);
}

function poligono(o: Ponto, raio: number, p: number) {
  const pts: string[] = [];
  for (let i = 0; i < VERTICES; i++) {
    const a = (i / VERTICES) * Math.PI * 2;
    const r = raioOndulado(raio, a, p);
    pts.push(`${(o.x + Math.cos(a) * r).toFixed(1)}px ${(o.y + Math.sin(a) * r).toFixed(1)}px`);
  }
  return `polygon(${pts.join(", ")})`;
}

/* ── Canvas de energia ───────────────────────────────────────────── */

interface Fragmento {
  angulo: number;
  deriva: number;
  fator: number;
  vida: number;
  tamanho: number;
  giro0: number;
  giro: number;
  forma: 0 | 1 | 2; // hexágono, losango, estrela de quatro pontas
  cor: string;
}

const CORES = ["#ff2d55", "#e11d48", "#c8102e", "#ff5468", "#ff8fa0", "#ffc2cc"];

class Energia {
  private t0 = performance.now();
  private tFrente: number | null = null;
  private fragmentos: Fragmento[];
  private filamentos: { angulo: number; giro: number; torcao: number }[];
  private faiscas: number[];

  constructor(
    private ctx: CanvasRenderingContext2D,
    private o: Ponto,
    private raioMax: number,
    private largura: number,
    private altura: number,
    private indoParaEscuro: boolean,
  ) {
    const aleatorio = semente(Math.round(o.x * 31 + o.y * 17));
    this.fragmentos = Array.from({ length: 96 }, () => {
      const r = aleatorio();
      return {
        angulo: aleatorio() * Math.PI * 2,
        deriva: (aleatorio() - 0.5) * 0.9,
        fator: 0.45 + aleatorio() * 0.6,
        vida: 0.45 + aleatorio() * 0.55,
        tamanho: 2.2 + aleatorio() * 4.2,
        giro0: aleatorio() * Math.PI,
        giro: (aleatorio() - 0.5) * 9,
        forma: r < 0.55 ? 0 : r < 0.85 ? 1 : 2,
        cor: CORES[Math.floor(aleatorio() * CORES.length)],
      };
    });
    this.filamentos = Array.from({ length: 9 }, (_, i) => ({
      angulo: (i / 9) * Math.PI * 2 + aleatorio() * 0.5,
      giro: 0.6 + aleatorio() * 0.8,
      torcao: 0.5 + aleatorio() * 0.7,
    }));
    this.faiscas = Array.from({ length: 14 }, (_, i) => (i / 14) * Math.PI * 2 + aleatorio() * 0.3);
  }

  liberarFrente(t: number) {
    if (this.tFrente === null) this.tFrente = t;
  }

  /** Roda até a dissipação terminar. */
  iniciar(): Promise<void> {
    return new Promise((resolver) => {
      const quadro = (agora: number) => {
        const fim = this.tFrente !== null && agora - this.tFrente > REVELAR + DISSIPAR;
        // Salvaguarda: se a frente nunca for liberada, encerra mesmo assim.
        const travado = agora - this.t0 > 4000;
        this.desenhar(agora);
        if (fim || travado) {
          this.ctx.clearRect(0, 0, this.largura, this.altura);
          resolver();
        } else proximoQuadro(quadro);
      };
      proximoQuadro(quadro);
    });
  }

  private desenhar(agora: number) {
    const { ctx, o } = this;
    ctx.clearRect(0, 0, this.largura, this.altura);
    ctx.globalCompositeOperation = "source-over";

    const g = Math.min(1, (agora - this.t0) / CONCENTRAR);
    const p = this.tFrente === null ? 0 : Math.min(1, (agora - this.tFrente) / REVELAR);
    const q = this.tFrente === null ? 0 : Math.min(1, (agora - this.tFrente) / (REVELAR + DISSIPAR));

    // Núcleo: acende na concentração, apaga conforme a frente se afasta.
    const forcaDoNucleo = this.tFrente === null ? g : Math.pow(1 - p, 2);
    if (forcaDoNucleo > 0.01) {
      const rn = 16 + 26 * g + 60 * p;
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, rn);
      grad.addColorStop(0, `rgba(255, 214, 220, ${0.9 * forcaDoNucleo})`);
      grad.addColorStop(0.3, `rgba(255, 45, 85, ${0.55 * forcaDoNucleo})`);
      grad.addColorStop(1, "rgba(200, 16, 46, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, rn, 0, Math.PI * 2);
      ctx.fill();
    }

    // Faíscas convergindo (só antes da frente).
    if (this.tFrente === null || p < 0.08) {
      const alfa = this.tFrente === null ? g : 1 - p / 0.08;
      for (const a of this.faiscas) {
        const r = 64 * (1 - g) + 10;
        const ang = a + g * 1.4;
        estrela(ctx, o.x + Math.cos(ang) * r, o.y + Math.sin(ang) * r, 3.2, ang, `rgba(255, 84, 104, ${0.9 * alfa})`);
      }
    }

    if (this.tFrente === null) return;

    const raio = this.raioMax * easeDrawer(p);
    const apagar = 1 - suavizar(0.72, 1, p);

    if (raio > 2 && apagar > 0) {
      const pts = this.pontosDaFrente(raio, p);

      // Véu na borda interna: as superfícies ainda carregadas de energia.
      const veu = ctx.createRadialGradient(o.x, o.y, raio * 0.55, o.x, o.y, raio * 1.02);
      const tom = this.indoParaEscuro ? "225, 29, 72" : "200, 16, 46";
      veu.addColorStop(0, `rgba(${tom}, 0)`);
      veu.addColorStop(0.85, `rgba(${tom}, ${0.1 * apagar})`);
      veu.addColorStop(1, `rgba(${tom}, ${0.16 * apagar})`);
      ctx.fillStyle = veu;
      ctx.beginPath();
      tracar(ctx, pts);
      ctx.arc(o.x, o.y, raio * 0.55, 0, Math.PI * 2, true);
      ctx.fill("evenodd");

      // Ecos (ondas de distorção atrás da frente).
      for (const [f, w, a] of [
        [0.8, 2, 0.32],
        [0.6, 1.5, 0.18],
      ] as const) {
        ctx.strokeStyle = `rgba(255, 84, 104, ${a * apagar})`;
        ctx.lineWidth = w;
        ctx.beginPath();
        tracar(ctx, this.pontosDaFrente(raio * f, Math.min(1, p + 0.2)));
        ctx.stroke();
      }

      // A frente: brilho largo, médio e o fio do núcleo.
      ctx.lineJoin = "round";
      for (const [w, cor] of [
        [28, `rgba(225, 29, 72, ${0.1 * apagar})`],
        [11, `rgba(255, 45, 85, ${0.24 * apagar})`],
        [3, `rgba(239, 35, 71, ${0.9 * apagar})`],
        [1.2, `rgba(255, 214, 220, ${0.75 * apagar})`],
      ] as const) {
        ctx.strokeStyle = cor;
        ctx.lineWidth = w;
        ctx.beginPath();
        tracar(ctx, pts);
        ctx.stroke();
      }

      // Filamentos em espiral, presos à frente.
      ctx.lineCap = "round";
      for (const fl of this.filamentos) {
        ctx.beginPath();
        for (let s = 0; s <= 10; s++) {
          const t = s / 10;
          const ang = fl.angulo + fl.giro * p * 1.6 + fl.torcao * t;
          const r = raioOndulado(raio * (0.6 + 0.38 * t), ang, p);
          const x = o.x + Math.cos(ang) * r;
          const y = o.y + Math.sin(ang) * r;
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(255, 84, 104, ${0.45 * apagar})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
    }

    // Fragmentos lançados pela frente, girando e apagando.
    const raioFinal = this.raioMax * easeDrawer(Math.min(1, q * 1.19));
    for (const fr of this.fragmentos) {
      const vida = q / fr.vida;
      if (vida >= 1) continue;
      const alfa = Math.pow(1 - vida, 1.3);
      const ang = fr.angulo + fr.deriva * q;
      const r = raioOndulado(raioFinal * fr.fator, ang, p);
      const x = o.x + Math.cos(ang) * r;
      const y = o.y + Math.sin(ang) * r;
      if (x < -20 || y < -20 || x > this.largura + 20 || y > this.altura + 20) continue;
      ctx.globalAlpha = alfa;
      const giro = fr.giro0 + fr.giro * q;
      if (fr.forma === 0) hexagono(ctx, x, y, fr.tamanho, giro, fr.cor);
      else if (fr.forma === 1) losango(ctx, x, y, fr.tamanho, giro, fr.cor);
      else estrela(ctx, x, y, fr.tamanho * 1.4, giro, fr.cor);
    }
    ctx.globalAlpha = 1;
  }

  private pontosDaFrente(raio: number, p: number) {
    const pts = new Float32Array(VERTICES * 2);
    for (let i = 0; i < VERTICES; i++) {
      const a = (i / VERTICES) * Math.PI * 2;
      const r = raioOndulado(raio, a, p);
      pts[i * 2] = this.o.x + Math.cos(a) * r;
      pts[i * 2 + 1] = this.o.y + Math.sin(a) * r;
    }
    return pts;
  }
}

function tracar(ctx: CanvasRenderingContext2D, pts: Float32Array) {
  const n = pts.length / 2;
  // Curvas pelos pontos médios: borda lisa, sem quinas do polígono.
  const mx = (i: number) => (pts[(i % n) * 2] + pts[((i + 1) % n) * 2]) / 2;
  const my = (i: number) => (pts[(i % n) * 2 + 1] + pts[((i + 1) % n) * 2 + 1]) / 2;
  ctx.moveTo(mx(0), my(0));
  for (let i = 1; i <= n; i++) ctx.quadraticCurveTo(pts[(i % n) * 2], pts[(i % n) * 2 + 1], mx(i), my(i));
  ctx.closePath();
}

function hexagono(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, giro: number, cor: string) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = giro + (i * Math.PI) / 3;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r * 0.82;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = cor;
  ctx.fill();
}

function losango(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, giro: number, cor: string) {
  const c = Math.cos(giro);
  const s = Math.sin(giro);
  ctx.beginPath();
  const pts: [number, number][] = [
    [0, -r * 1.3],
    [r * 0.55, 0],
    [0, r * 1.3],
    [-r * 0.55, 0],
  ];
  pts.forEach(([px, py], i) => {
    const X = x + px * c - py * s;
    const Y = y + px * s + py * c;
    if (i === 0) ctx.moveTo(X, Y);
    else ctx.lineTo(X, Y);
  });
  ctx.closePath();
  ctx.fillStyle = cor;
  ctx.fill();
}

/** Estrela côncava de quatro pontas, a mesma família da logo. */
function estrela(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, giro: number, cor: string) {
  const c = Math.cos(giro);
  const s = Math.sin(giro);
  const P = (px: number, py: number): [number, number] => [x + px * c - py * s, y + px * s + py * c];
  const k = 0.12 * r;
  ctx.beginPath();
  ctx.moveTo(...P(0, -r));
  ctx.quadraticCurveTo(...P(k, -k), ...P(r, 0));
  ctx.quadraticCurveTo(...P(k, k), ...P(0, r));
  ctx.quadraticCurveTo(...P(-k, k), ...P(-r, 0));
  ctx.quadraticCurveTo(...P(-k, -k), ...P(0, -r));
  ctx.closePath();
  ctx.fillStyle = cor;
  ctx.fill();
}

/* ── Utilidades ──────────────────────────────────────────────────── */

type DocumentoComVT = {
  startViewTransition?: (atualizar: () => Promise<void> | void) => {
    ready: Promise<void>;
    finished: Promise<void>;
    updateCallbackDone: Promise<void>;
  };
};

function criarTela() {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvas.getContext("2d");
  } catch {
    ctx = null;
  }
  if (!ctx) return null;
  const largura = window.innerWidth;
  const altura = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  canvas.width = Math.round(largura * dpr);
  canvas.height = Math.round(altura * dpr);
  canvas.setAttribute("aria-hidden", "true");
  canvas.className = "fr-realidade-tela";
  canvas.style.setProperty("view-transition-name", NOME_DA_TELA);
  ctx.scale(dpr, dpr);
  document.body.appendChild(canvas);
  return { canvas, ctx, largura, altura };
}

/** Resolve quando o contexto aplicar o novo data-tema no <html> (ou após 400ms). */
function temaMudou(): Promise<void> {
  const raiz = document.documentElement;
  const antes = raiz.dataset.tema;
  return new Promise((resolver) => {
    const obs = new MutationObserver(() => {
      if (raiz.dataset.tema !== antes) {
        obs.disconnect();
        clearTimeout(limite);
        resolver();
      }
    });
    obs.observe(raiz, { attributes: true, attributeFilter: ["data-tema"] });
    const limite = setTimeout(() => {
      obs.disconnect();
      resolver();
    }, 400);
  });
}

function esperar(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function proximoQuadro(f: (t: number) => void) {
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(f);
  else setTimeout(() => f(performance.now()), 16);
}

function suavizar(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Gerador pseudoaleatório com semente (mulberry32): o efeito é variado, mas determinístico por origem. */
function semente(s: number) {
  let a = s >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** cubic-bezier(x1, y1, x2, y2) resolvido em JS, idêntico ao do CSS. */
function curva(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const X = (t: number) => ((ax * t + bx) * t + cx) * t;
  const Y = (t: number) => ((ay * t + by) * t + cy) * t;
  const dX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = X(t) - x;
      const d = dX(t);
      if (Math.abs(e) < 1e-5) return Y(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 20; i++) {
      const v = X(t);
      if (Math.abs(v - x) < 1e-5) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return Y(t);
  };
}

/** --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1) */
const easeDrawer = curva(0.32, 0.72, 0, 1);
