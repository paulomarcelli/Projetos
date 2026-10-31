/**
 * O globo da landing, desenhado num canvas 2D: pontos de terra firme numa projeção ortográfica que gira devagar, e
 * rotas entre capitais (arcos de grande círculo) que acendem em ouro uma de cada vez. Funções puras, sem DOM além
 * do contexto recebido: o componente (Globo.tsx) decide quando desenhar.
 */
import pontosBrutos from "./pontos.json";

const GRAU = Math.PI / 180;
const INCLINACAO = -0.38; // mostra um pouco mais do hemisfério norte
const CICLO_ARCO = 3.2; // segundos: acende, fica, apaga
const INTERVALO_ARCOS = 0.75;

type V3 = [number, number, number];

const paraVetor = (lon: number, lat: number): V3 => [Math.cos(lat * GRAU) * Math.sin(lon * GRAU), Math.sin(lat * GRAU), Math.cos(lat * GRAU) * Math.cos(lon * GRAU)];

/** Capitais e sedes multilaterais (longitude, latitude). */
const LUGARES = {
  brasilia: [-47.9, -15.8],
  washington: [-77.0, 38.9],
  novaYork: [-74.0, 40.7],
  bruxelas: [4.35, 50.85],
  genebra: [6.14, 46.2],
  pequim: [116.4, 39.9],
  moscou: [37.6, 55.75],
  novaDelhi: [77.2, 28.6],
  pretoria: [28.2, -25.7],
  toquio: [139.7, 35.7],
  cairo: [31.2, 30.0],
  buenosAires: [-58.4, -34.6],
} as const satisfies Record<string, readonly [number, number]>;
type Lugar = keyof typeof LUGARES;

const ROTAS: [Lugar, Lugar][] = [
  ["brasilia", "washington"],
  ["bruxelas", "pequim"],
  ["novaYork", "genebra"],
  ["brasilia", "pretoria"],
  ["pequim", "moscou"],
  ["washington", "toquio"],
  ["novaDelhi", "bruxelas"],
  ["cairo", "genebra"],
  ["buenosAires", "brasilia"],
  ["moscou", "novaDelhi"],
];

const PONTOS: V3[] = [];
for (let i = 0; i < pontosBrutos.length; i += 2) PONTOS.push(paraVetor(pontosBrutos[i], pontosBrutos[i + 1]));

/** Cada rota como polilinha 3D, já elevada acima da superfície no meio do caminho. */
const ARCOS: V3[][] = ROTAS.map(([a, b]) => {
  const p = paraVetor(LUGARES[a][0], LUGARES[a][1]);
  const q = paraVetor(LUGARES[b][0], LUGARES[b][1]);
  const angulo = Math.acos(Math.min(1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2]));
  const passos = 56;
  return Array.from({ length: passos + 1 }, (_, i) => {
    const t = i / passos;
    const s = Math.sin(angulo) || 1;
    const k1 = Math.sin((1 - t) * angulo) / s;
    const k2 = Math.sin(t * angulo) / s;
    const altura = 1 + Math.sin(Math.PI * t) * 0.12 * angulo;
    return [(k1 * p[0] + k2 * q[0]) * altura, (k1 * p[1] + k2 * q[1]) * altura, (k1 * p[2] + k2 * q[2]) * altura] as V3;
  });
});

const NIVEIS = 6;
const FAIXAS: number[][] = Array.from({ length: NIVEIS }, () => []);
const COR_DA_FAIXA = FAIXAS.map((_, n) => `rgba(178, 202, 255, ${(0.3 + ((n + 0.5) / NIVEIS) * 0.6).toFixed(3)})`);

let cacheDegrades: { chave: string; halo: CanvasGradient; disco: CanvasGradient } | null = null;
function degrades(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number) {
  const chave = `${cx}|${cy}|${R}`;
  if (cacheDegrades?.chave === chave) return cacheDegrades;
  const halo = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.22);
  halo.addColorStop(0, "rgba(79, 125, 255, 0.16)");
  halo.addColorStop(1, "rgba(79, 125, 255, 0)");
  const disco = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
  disco.addColorStop(0, "rgba(30, 58, 120, 0.55)");
  disco.addColorStop(1, "rgba(8, 20, 48, 0.35)");
  cacheDegrades = { chave, halo, disco };
  return cacheDegrades;
}

export interface Quadro {
  ctx: CanvasRenderingContext2D;
  largura: number;
  altura: number;
  /** segundos desde o início */
  tempo: number;
  /** giro em radianos */
  giro: number;
  /** true: arcos completos e parados (movimento reduzido) */
  estatico?: boolean;
  /** "horizonte": a esfera nasce de baixo, com o centro abaixo da tela (só o topo do planeta aparece) */
  enquadramento?: "inteiro" | "horizonte";
}

function projetar([x, y, z]: V3, giro: number) {
  const cg = Math.cos(giro);
  const sg = Math.sin(giro);
  const x1 = x * cg + z * sg;
  const z1 = -x * sg + z * cg;
  const ci = Math.cos(INCLINACAO);
  const si = Math.sin(INCLINACAO);
  return { x: x1, y: y * ci - z1 * si, z: y * si + z1 * ci };
}

export function desenharGlobo({ ctx, largura, altura, tempo, giro, estatico = false, enquadramento = "inteiro" }: Quadro) {
  const horizonte = enquadramento === "horizonte";
  const R = horizonte ? largura * 0.34 : Math.min(largura, altura) * 0.42;
  const cx = largura / 2;
  const cy = horizonte ? altura * 0.1 + R : altura / 2;
  ctx.clearRect(0, 0, largura, altura);

  // atmosfera e disco: degradês criados uma vez por tamanho, não a cada quadro
  const { halo, disco } = degrades(ctx, cx, cy, R);
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, largura, altura);
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = disco;
  ctx.fill();

  // terra firme: pontos que clareiam quando ficam de frente. Agrupados em faixas de brilho, um preenchimento por
  // faixa (antes, uma cor e um preenchimento por ponto: 2.376 por quadro).
  for (const f of FAIXAS) f.length = 0;
  for (const p of PONTOS) {
    const v = projetar(p, giro);
    if (v.z <= 0) continue;
    FAIXAS[Math.min(NIVEIS - 1, Math.floor(v.z * NIVEIS))].push(cx + v.x * R, cy - v.y * R);
  }
  FAIXAS.forEach((faixa, n) => {
    if (!faixa.length) return;
    const z = (n + 0.5) / NIVEIS;
    const tam = 0.9 + z * 1.3;
    ctx.beginPath();
    for (let k = 0; k < faixa.length; k += 2) ctx.rect(faixa[k] - tam / 2, faixa[k + 1] - tam / 2, tam, tam);
    ctx.fillStyle = COR_DA_FAIXA[n];
    ctx.fill();
  });

  // rotas: cada uma acende, fica e apaga, uma depois da outra
  ctx.lineCap = "round";
  ARCOS.forEach((arco, i) => {
    let progresso = 1;
    let opacidade = 0.85;
    if (!estatico) {
      const fase = (tempo - i * INTERVALO_ARCOS) % (ARCOS.length * INTERVALO_ARCOS);
      if (fase < 0 || fase > CICLO_ARCO) return;
      progresso = Math.min(1, fase / 1.2);
      opacidade = fase < 2.2 ? 0.95 : 0.95 * (1 - (fase - 2.2) / (CICLO_ARCO - 2.2));
    }
    const ate = Math.max(1, Math.round(progresso * (arco.length - 1)));
    ctx.beginPath();
    let aberto = false;
    let ponta: { x: number; y: number } | null = null;
    for (let j = 0; j <= ate; j++) {
      const v = projetar(arco[j], giro);
      const sx = cx + v.x * R;
      const sy = cy - v.y * R;
      if (v.z < -0.05) {
        aberto = false;
        continue;
      }
      if (aberto) ctx.lineTo(sx, sy);
      else ctx.moveTo(sx, sy);
      aberto = true;
      ponta = { x: sx, y: sy };
    }
    ctx.strokeStyle = `rgba(245, 196, 81, ${opacidade.toFixed(3)})`;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    if (ponta && progresso < 1) {
      ctx.beginPath();
      ctx.arc(ponta.x, ponta.y, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 224, 140, ${opacidade.toFixed(3)})`;
      ctx.fill();
    }
    // as duas capitais da rota
    for (const extremo of [arco[0], arco[arco.length - 1]]) {
      const v = projetar(extremo, giro);
      if (v.z <= 0) continue;
      ctx.beginPath();
      ctx.arc(cx + v.x * R, cy - v.y * R, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245, 196, 81, ${opacidade.toFixed(3)})`;
      ctx.fill();
    }
  });
}
