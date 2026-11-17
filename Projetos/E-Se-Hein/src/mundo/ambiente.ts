// Estado do "clima" do mundo, que cada cena define e que se mistura na passagem entre cenas.
export type Ambiente = {
  /** Lua grande no céu: 0 = sumiu, 1 = inteira. */
  lua: number;
  /** Luz da Lua (sombras e brilho no mar). */
  luar: number;
  /** Estrelas visíveis. */
  estrelas: number;
  /** 0 = noite azul com Lua; 1 = breu. */
  breu: number;
  /** Altura da maré em metros (régua da praia). */
  mare: number;
  /** Janelas acesas na cidade (0 a 1). */
  janelas: number;
  /** Terra de brinquedo no céu (0 = escondida). */
  terra: number;
  /** Balanço do eixo da Terra, em radianos. */
  balanco: number;
  /** Lua pequena em órbita da Terra (0 a 1). */
  luaOrbita: number;
};

export const ambientePadrao: Ambiente = {
  lua: 1,
  luar: 1,
  estrelas: 0.35,
  breu: 0,
  mare: 1.2,
  janelas: 1,
  terra: 0,
  balanco: 0,
  luaOrbita: 0,
};

export function misturarAmbiente(a: Ambiente, b: Ambiente, t: number): Ambiente {
  const r = { ...a };
  for (const k of Object.keys(a) as (keyof Ambiente)[]) r[k] = a[k] + (b[k] - a[k]) * t;
  return r;
}
