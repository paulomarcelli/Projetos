/**
 * Modelo do explorador: nós e arestas da API + posições da simulação de forças (d3-force).
 * A simulação roda em passos contados (nunca solta): assenta de uma vez ao montar e, ao arrastar ou
 * expandir, volta por alguns quadros até se acomodar, e para.
 */
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type Simulation, type SimulationLinkDatum, type SimulationNodeDatum } from "d3-force";
import type { ArestaVisual, CaminhosEntreNos, Evidencia, ExpansaoDoGrafo, GrafoDaInvestigacao, NoVisual } from "../../types/api";
import { rotuloDoId, tipoDoId } from "../../hooks/formatacao";

export interface NoSim extends SimulationNodeDatum {
  id: string;
  raio: number;
}

export interface ArestaSim extends SimulationLinkDatum<NoSim> {
  id: string;
}

export interface DadosDoGrafo {
  nos: NoVisual[];
  arestas: ArestaVisual[];
  evidencias: Record<string, Evidencia>;
}

export function raioDoNo(no: Pick<NoVisual, "relevancia" | "grau" | "papel">, compacto = false): number {
  const base = compacto ? 4 : 6;
  const r = base + no.relevancia * (compacto ? 5 : 8) + Math.min(compacto ? 3 : 6, Math.log2((no.grau || 0) + 1));
  return no.papel === "focal" ? r + (compacto ? 3 : 5) : r;
}

/** Junta a expansão (ou um caminho) ao grafo sem duplicar; nós novos chegam com papel `expansao`. */
export function mesclar(dados: DadosDoGrafo, extra: { nos?: NoVisual[]; arestas?: ArestaVisual[]; evidencias?: Record<string, Evidencia> }): DadosDoGrafo {
  const idsNos = new Set(dados.nos.map((n) => n.id));
  const idsArestas = new Set(dados.arestas.map((a) => a.id));
  const nos = [...dados.nos];
  for (const n of extra.nos ?? []) if (!idsNos.has(n.id)) (nos.push(n), idsNos.add(n.id));
  const arestas = [...dados.arestas];
  for (const a of extra.arestas ?? []) {
    if (idsArestas.has(a.id)) continue;
    // uma aresta só entra se as duas pontas existem (o caminho pode citar um nó que o grafo ainda não tem)
    for (const ponta of [a.origem, a.destino]) {
      if (!idsNos.has(ponta)) {
        nos.push(noDoId(ponta));
        idsNos.add(ponta);
      }
    }
    arestas.push(a);
    idsArestas.add(a.id);
  }
  return { nos, arestas, evidencias: { ...dados.evidencias, ...(extra.evidencias ?? {}) } };
}

/** Nó mínimo para um id citado por um caminho que o grafo não trazia (rótulo derivado do id, sem descrição). */
export function noDoId(id: string): NoVisual {
  return { id, rotulo: rotuloDoId(id), tipo: tipoDoId(id), papel: "expansao", relevancia: 0.3, grau: 0, descricao: null, atributos: {}, cenarios: [] };
}

export function daExpansao(e: ExpansaoDoGrafo) {
  return { nos: e.nos.map((n) => ({ ...n, papel: "expansao" })), arestas: e.arestas, evidencias: e.evidencias };
}

export function doCaminho(c: CaminhosEntreNos) {
  return { arestas: c.caminhos.flatMap((p) => p.arestas), evidencias: c.evidencias };
}

export function dadosIniciais(g: GrafoDaInvestigacao): DadosDoGrafo {
  return { nos: g.nos, arestas: g.arestas, evidencias: g.evidencias };
}

/** Vizinhos de cada nó (para destacar ao passar o ponteiro). */
export function vizinhanca(arestas: ArestaVisual[]): Map<string, Set<string>> {
  const m = new Map<string, Set<string>>();
  const ligar = (a: string, b: string) => {
    if (!m.has(a)) m.set(a, new Set());
    m.get(a)!.add(b);
  };
  for (const a of arestas) {
    ligar(a.origem, a.destino);
    ligar(a.destino, a.origem);
  }
  return m;
}

/**
 * Curvatura de cada aresta: arestas paralelas entre o mesmo par (Thor–Loki tem várias) se abrem em leque,
 * para nenhuma esconder a outra. 0 = reta.
 */
export function curvaturas(arestas: ArestaVisual[]): Map<string, number> {
  const pares = new Map<string, ArestaVisual[]>();
  for (const a of arestas) {
    const k = a.origem < a.destino ? `${a.origem}|${a.destino}` : `${a.destino}|${a.origem}`;
    if (!pares.has(k)) pares.set(k, []);
    pares.get(k)!.push(a);
  }
  const c = new Map<string, number>();
  for (const lista of pares.values()) {
    const n = lista.length;
    lista.forEach((a, i) => {
      const desloc = n === 1 ? 0 : (i - (n - 1) / 2) * 16;
      // a direção da curva acompanha o sentido canônico do par, não o da aresta
      c.set(a.id, a.origem < a.destino ? desloc : -desloc);
    });
  }
  return c;
}

/** Ordem de leitura para o teclado e para a lista: focais, pontes, depois relevância e grau. */
export function ordemDeLeitura(nos: NoVisual[]): NoVisual[] {
  const peso: Record<string, number> = { focal: 0, ponte: 1, contexto: 2, trajetoria: 3, expansao: 4 };
  return [...nos].sort((a, b) => (peso[a.papel] ?? 5) - (peso[b.papel] ?? 5) || b.relevancia - a.relevancia || b.grau - a.grau || a.rotulo.localeCompare(b.rotulo, "pt-BR"));
}

/** Os nós que ganham rótulo sem interação: focais, pontes e os de maior peso. */
export function nosComRotulo(nos: NoVisual[], quantos: number): Set<string> {
  const s = new Set<string>();
  for (const n of nos) if (n.papel === "focal" || n.papel === "ponte") s.add(n.id);
  const resto = [...nos].filter((n) => !s.has(n.id)).sort((a, b) => b.relevancia + Math.log2(b.grau + 1) / 10 - (a.relevancia + Math.log2(a.grau + 1) / 10));
  for (const n of resto.slice(0, Math.max(0, quantos - s.size))) s.add(n.id);
  return s;
}

export interface Simulador {
  sim: Simulation<NoSim, ArestaSim>;
  porId: Map<string, NoSim>;
}

/** Monta a simulação (parada) para os dados; mantém as posições de nós que já existiam. */
export function montarSimulador(dados: DadosDoGrafo, compacto: boolean, anterior?: Map<string, NoSim>): Simulador {
  const focais = dados.nos.filter((n) => n.papel === "focal");
  const porId = new Map<string, NoSim>();
  const nosSim: NoSim[] = dados.nos.map((n, i) => {
    const velho = anterior?.get(n.id);
    const raio = raioDoNo(n, compacto);
    if (velho) {
      velho.raio = raio;
      porId.set(n.id, velho);
      return velho;
    }
    const s: NoSim = { id: n.id, raio };
    const iFocal = focais.indexOf(n);
    if (iFocal >= 0) {
      // focais começam lado a lado no centro
      s.x = (iFocal - (focais.length - 1) / 2) * (compacto ? 70 : 120);
      s.y = 0;
    } else if (n.papel === "expansao") {
      // perto de quem a trouxe: o primeiro vizinho que já tem posição
      const ar = dados.arestas.find((a) => (a.origem === n.id && porIdOuAnterior(a.destino)) || (a.destino === n.id && porIdOuAnterior(a.origem)));
      const pai = ar ? porIdOuAnterior(ar.origem === n.id ? ar.destino : ar.origem) : undefined;
      if (pai?.x !== undefined && pai.y !== undefined) {
        const ang = (i * 2.399) % (2 * Math.PI);
        s.x = pai.x + Math.cos(ang) * 40;
        s.y = pai.y + Math.sin(ang) * 40;
      }
    }
    porId.set(n.id, s);
    return s;
  });

  function porIdOuAnterior(id: string) {
    return porId.get(id) ?? anterior?.get(id);
  }

  const arestasSim: ArestaSim[] = dados.arestas.map((a) => ({ id: a.id, source: a.origem, target: a.destino }));
  const distancia = compacto ? 34 : 56;
  const sim = forceSimulation<NoSim, ArestaSim>(nosSim)
    .force(
      "ligacao",
      forceLink<NoSim, ArestaSim>(arestasSim)
        .id((d) => d.id)
        .distance((l) => distancia + (l.source as NoSim).raio + (l.target as NoSim).raio)
        .strength(0.5),
    )
    .force("carga", forceManyBody<NoSim>().strength((d) => -(compacto ? 40 : 90) - d.raio * 4).distanceMax(compacto ? 260 : 420))
    .force("colisao", forceCollide<NoSim>((d) => d.raio + (compacto ? 2 : 4)).iterations(2))
    .force("x", forceX<NoSim>(0).strength(0.05))
    .force("y", forceY<NoSim>(0).strength(compacto ? 0.09 : 0.06))
    .stop();
  return { sim, porId };
}

/** Roda a simulação até assentar (ou até `maximo` passos), sem desenhar nada no meio. */
export function assentar(sim: Simulation<NoSim, ArestaSim>, alfa = 1, maximo = 320): void {
  sim.alpha(alfa);
  for (let i = 0; i < maximo && sim.alpha() > sim.alphaMin(); i++) sim.tick();
}

export interface Limites {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export function limites(nos: NoSim[]): Limites {
  if (nos.length === 0) return { x0: -1, y0: -1, x1: 1, y1: 1 };
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const n of nos) {
    const x = n.x ?? 0,
      y = n.y ?? 0;
    x0 = Math.min(x0, x - n.raio);
    y0 = Math.min(y0, y - n.raio);
    x1 = Math.max(x1, x + n.raio);
    y1 = Math.max(y1, y + n.raio);
  }
  return { x0, y0, x1, y1 };
}

export interface Transformacao {
  x: number;
  y: number;
  k: number;
}

export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 4;

/** Enquadra os nós na área (largura × altura), com margem. A origem do SVG fica no centro da área. */
export function enquadrar(nos: NoSim[], largura: number, altura: number, margem = 36, kMax = 1.6): Transformacao {
  const l = limites(nos);
  const w = Math.max(1, l.x1 - l.x0);
  const h = Math.max(1, l.y1 - l.y0);
  const k = Math.max(ZOOM_MIN, Math.min(kMax, (largura - margem * 2) / w, (altura - margem * 2) / h));
  const cx = (l.x0 + l.x1) / 2;
  const cy = (l.y0 + l.y1) / 2;
  return { x: -cx * k, y: -cy * k, k };
}

/** Geometria de uma aresta: reta ou curva quadrática, encurtada para não entrar no nó de destino. */
export function caminhoDaAresta(o: NoSim, d: NoSim, curva: number, dirigida: boolean): { d: string; meio: { x: number; y: number } } {
  const x1 = o.x ?? 0,
    y1 = o.y ?? 0,
    x2 = d.x ?? 0,
    y2 = d.y ?? 0;
  const dx = x2 - x1,
    dy = y2 - y1;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist,
    ny = dx / dist;
  const cx = (x1 + x2) / 2 + nx * curva;
  const cy = (y1 + y2) / 2 + ny * curva;
  // ponto final na borda do destino (mais um respiro para a ponta da seta)
  const recuo = d.raio + (dirigida ? 3 : 0);
  const vx = x2 - cx,
    vy = y2 - cy;
  const vd = Math.hypot(vx, vy) || 1;
  const ex = x2 - (vx / vd) * recuo;
  const ey = y2 - (vy / vd) * recuo;
  const meio = { x: 0.25 * x1 + 0.5 * cx + 0.25 * ex, y: 0.25 * y1 + 0.5 * cy + 0.25 * ey };
  if (curva === 0) return { d: `M${x1.toFixed(1)},${y1.toFixed(1)}L${ex.toFixed(1)},${ey.toFixed(1)}`, meio };
  return { d: `M${x1.toFixed(1)},${y1.toFixed(1)}Q${cx.toFixed(1)},${cy.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`, meio };
}
