import type { Modo } from "./paleta";

// Estado do mundo que cada cena define e que se mistura na passagem entre cenas.
export type Ambiente = {
  /** Modo de cor: peso do Dia e do Breu (a Noite é o resto). */
  dia: number;
  breu: number;
  /** 0 = na Terra; 1 = no espaço (céu e névoa viram o fundo do espaço). */
  espaco: number;
  /** Lua grande no céu (0 = sumiu). */
  lua: number;
  /** Estrelas visíveis. */
  estrelas: number;
  /** Maré: nível médio e meia-amplitude em metros (a água sobe e desce na régua). */
  mareCentro: number;
  mareAmp: number;
  /** Terra de brinquedo no espaço (0 = escondida). */
  terra: number;
  /** Balanço do eixo da Terra, em radianos. */
  balanco: number;
  /** Lua no espaço, ao lado da Terra (0 a 1). */
  luaEspaco: number;
};

export const MARE_CENTRO = -1.2;
export const MARE_AMP_COM_LUA = 1.05;
/** Sem a Lua sobra a maré do Sol: cerca de 46% (conferido pela Sabrina). */
export const MARE_AMP_SEM_LUA = MARE_AMP_COM_LUA * 0.46;

export const ambienteNoite: Ambiente = {
  dia: 0,
  breu: 0,
  espaco: 0,
  lua: 1,
  estrelas: 0.35,
  mareCentro: MARE_CENTRO,
  mareAmp: MARE_AMP_COM_LUA,
  terra: 0,
  balanco: 0,
  luaEspaco: 0,
};

export function misturarAmbiente(a: Ambiente, b: Ambiente, t: number): Ambiente {
  const r = { ...a };
  for (const k of Object.keys(a) as (keyof Ambiente)[]) r[k] = a[k] + (b[k] - a[k]) * t;
  return r;
}

export function modoDe(a: Ambiente): Modo {
  const dia = Math.min(1, Math.max(0, a.dia));
  const breu = Math.min(1 - dia, Math.max(0, a.breu));
  return { dia, breu, noite: 1 - dia - breu };
}
