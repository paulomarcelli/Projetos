import tokens from "../../docs/tokens.json";

// Cores do Design System da Sofia (docs/tokens.json, gerado do Figma). Não escreva cor solta no código:
// use um token daqui. O mundo tem três modos (Dia, Noite, Breu), misturados nas passagens.

export type TokenMundo = keyof typeof tokens.mundo.cores;

/** Peso de cada modo (somam 1). */
export type Modo = { dia: number; noite: number; breu: number };

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/** Cor do token no modo misturado, em "#rrggbb". */
export function corMundo(token: TokenMundo, modo: Modo): string {
  const [dia, noite, breu] = (tokens.mundo.cores[token] as string[]).slice(0, 3).map(hex);
  const c = dia.map((_, k) => Math.round(dia[k] * modo.dia + noite[k] * modo.noite + breu[k] * modo.breu));
  return "#" + c.map((v) => Math.min(255, Math.max(0, v)).toString(16).padStart(2, "0")).join("");
}

export const tokensMundo = Object.keys(tokens.mundo.cores) as TokenMundo[];

const m = tokens.marca.cores;
export const marca = {
  laranja: m["marca/laranja"][0],
  tinta: m["marca/tinta"][0],
  branco: m["marca/branco"][0],
};

export const rotulo = {
  vermelho: m["rotulo/vermelho"][0],
  verde: m["rotulo/verde"][0],
  amarelo: m["rotulo/amarelo"][0],
  cartao: m["rotulo/cartao"][0],
  contorno: m["rotulo/contorno"][0],
};

/** Medidas em px no quadro 1080 × 1920 (legenda, rótulos, zonas seguras). */
export const medidas = Object.fromEntries(Object.entries(tokens.medidas).map(([k, v]) => [k, v[0] as number])) as Record<
  keyof typeof tokens.medidas,
  number
>;
