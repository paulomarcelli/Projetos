// Regras de tempo e texto do estilo realista (v2). Funções puras, testadas em tests/v2.test.ts.

export const FPS = 30;

type TrechoTempo = { inicio: number; fim: number };
type PlanoSpec = { id: string; cena: string; modo: string; trechos: number[]; fim_do_video?: boolean };

export type Plano = PlanoSpec & { inicio: number; fim: number; deQuadro: number; quadros: number };

/**
 * Onde cada plano começa e termina. Mesma regra do Blender (blender/comum.py): o corte fica no meio da pausa entre
 * dois trechos; o primeiro começa em 0; o último vai até 1 s depois da voz (o fechamento laranja cobre o resto).
 * Os quadros ficam sem buraco: o plano ocupa round(inicio*30) .. round(fim*30) - 1.
 */
export function limitesDosPlanos(
  dados: { duracaoAudio: number; trechos: TrechoTempo[] },
  spec: { fechamento?: number; planos: PlanoSpec[] },
): Plano[] {
  const t = dados.trechos;
  return spec.planos.map((p) => {
    const i0 = p.trechos[0] - 1;
    const i1 = p.trechos[p.trechos.length - 1] - 1;
    const inicio = i0 === 0 ? 0 : (t[i0 - 1].fim + t[i0].inicio) / 2;
    const fim = i1 === t.length - 1 ? dados.duracaoAudio + (p.fim_do_video ? 1 : (spec.fechamento ?? 4)) : (t[i1].fim + t[i1 + 1].inicio) / 2;
    const deQuadro = Math.round(inicio * FPS);
    return { ...p, inicio, fim, deQuadro, quadros: Math.round(fim * FPS) - deQuadro };
  });
}

type PalavraTempo = { texto: string; inicioMs: number; fimMs: number; paragrafo: number };
export type Frase = { texto: string; inicio: number; fim: number };

/** Trocas da fala para a legenda: o ano dito por extenso vira número (pedido do Paulo e da PASSAGEM). */
const TROCAS: [RegExp, string][] = [[/mil novecentos e oitenta e seis/gi, "1986"]];
const MAX_CARACTERES = 60;
const CONJUNCOES = new Set(["e", "se", "que", "mas", "ou"]);
const SOBRA = 0.5;

const fimDeFrase = (w: string) => /[.?!]["”']?$/.test(w) && !/\.\.\.$|…$/.test(w);
const juntar = (ws: PalavraTempo[]) => TROCAS.reduce((s, [de, para]) => s.replace(de, para), ws.map((w) => w.texto).join(" "));

function partir(ws: PalavraTempo[]): PalavraTempo[][] {
  const texto = juntar(ws);
  if (texto.length <= MAX_CARACTERES) return [ws];
  const meio = texto.length / 2;
  let melhor = -1;
  let melhorDist = Infinity;
  let pos = 0;
  ws.forEach((w, i) => {
    pos += w.texto.length + 1;
    if (i < ws.length - 1 && /,$/.test(w.texto) && Math.abs(pos - meio) < melhorDist) {
      melhor = i;
      melhorDist = Math.abs(pos - meio);
    }
  });
  if (melhor < 0) {
    // sem vírgula: quebra antes de uma conjunção (a linha nova começa com ela)
    pos = 0;
    ws.forEach((w, i) => {
      if (i > 0 && i < ws.length - 1 && CONJUNCOES.has(w.texto) && Math.abs(pos - meio) < melhorDist) {
        melhor = i - 1;
        melhorDist = Math.abs(pos - meio);
      }
      pos += w.texto.length + 1;
    });
  }
  if (melhor < 0) return [ws];
  return [...partir(ws.slice(0, melhor + 1)), ...partir(ws.slice(melhor + 1))];
}

/**
 * Legenda de frase inteira (Design System v2): uma frase por vez, quebrada no . ? ! (não nas reticências). Frase com
 * mais de 60 caracteres quebra na vírgula mais perto do meio. Fica na tela da primeira palavra até a próxima frase,
 * no máximo 0,5 s depois da fala.
 */
export function frasesDaLegenda(palavras: PalavraTempo[]): Frase[] {
  const grupos: PalavraTempo[][] = [];
  let atual: PalavraTempo[] = [];
  palavras.forEach((w, i) => {
    atual.push(w);
    const proxima = palavras[i + 1];
    if (fimDeFrase(w.texto) || !proxima || proxima.paragrafo !== w.paragrafo) {
      grupos.push(...partir(atual));
      atual = [];
    }
  });
  const frases = grupos.map((g) => ({ texto: juntar(g), inicio: g[0].inicioMs / 1000, fimFala: g[g.length - 1].fimMs / 1000 }));
  return frases.map((f, i) => ({
    texto: f.texto,
    inicio: f.inicio,
    fim: Math.min(frases[i + 1]?.inicio ?? Infinity, round3(f.fimFala + SOBRA)),
  }));
}

const round3 = (x: number) => Math.round(x * 1000) / 1000;

/** Número do contador de população, do jeito brasileiro: 8,3 bilhões · 42 milhões · 3 mil · 1. */
export function formatarContagem(v: number): { numero: string; unidade: string } {
  if (v >= 1e9) return { numero: (v / 1e9).toFixed(1).replace(".", ","), unidade: "bilhões" };
  if (v >= 1e6) return { numero: String(Math.round(v / 1e6)), unidade: "milhões" };
  if (v >= 1e3) return { numero: String(Math.round(v / 1e3)), unidade: "mil" };
  return { numero: String(Math.max(1, Math.round(v))), unidade: "" };
}

/** Valor da contagem no progresso p (0 a 1), em escala logarítmica: passa por bilhões, milhões e mil. */
export function valorDaContagem(de: number, para: number, p: number): number {
  if (p <= 0) return de;
  if (p >= 1) return para;
  return Math.pow(10, Math.log10(de) + (Math.log10(para) - Math.log10(de)) * p);
}

/** O estado do contador (ou do fato) no tempo t: o último que já começou, e o anterior. */
export function estadoNoTempo<T extends { inicio: number }>(estados: T[], t: number): { atual: T; anterior?: T; indice: number } {
  let i = 0;
  for (let k = 0; k < estados.length; k++) if (estados[k].inicio <= t) i = k;
  return { atual: estados[i], anterior: i > 0 ? estados[i - 1] : undefined, indice: i };
}
