// Regras puras do vídeo do Sol (testadas em tests/sol.test.ts).

/** Os 8 minutos que a luz do Sol leva até a Terra, em segundos. */
export const OITO_MINUTOS = 8 * 60;

/** Segundos que faltam no cronômetro no tempo `t`: 8:00 em `inicio`, 0:00 em `fim` (acelerado, em linha reta). */
export function restanteCronometro(t: number, inicio: number, fim: number, total = OITO_MINUTOS): number {
  const x = Math.min(1, Math.max(0, (t - inicio) / (fim - inicio)));
  return total * (1 - x);
}

/**
 * Texto do cronômetro em M:SS. Anda em passos de `passo` segundos e arredonda para cima: mostra 8:00 no começo e
 * 0:00 só no fim. Com 15 s, 8 minutos em 13 s de vídeo trocam o texto menos de 3 vezes por segundo.
 */
export function formatarCronometro(restante: number, passo = 15): string {
  const s = Math.max(0, Math.ceil(restante / passo - 1e-9) * passo);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Nível do termômetro (0 = fundo do tubo, 1 = topo): cai de `de` para `para` entre `inicio` e `fim`, suave. */
export function nivelTermometro(t: number, inicio: number, fim: number, de: number, para: number): number {
  const x = Math.min(1, Math.max(0, (t - inicio) / (fim - inicio)));
  const e = x * x * (3 - 2 * x);
  return de + (para - de) * e;
}
