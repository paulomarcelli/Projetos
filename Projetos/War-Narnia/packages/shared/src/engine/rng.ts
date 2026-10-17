// Geradores de números aleatórios para o motor (o servidor injeta um com crypto).
import type { Rng } from '../engine-api';

/** RNG determinístico (mulberry32) — para testes e simulações reproduzíveis. */
export function createSeededRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { int: (min, max) => min + Math.floor(next() * (max - min + 1)) };
}

/** RNG baseado em Math.random (útil no cliente/protótipos; o servidor deve usar crypto). */
export const mathRandomRng: Rng = {
  int: (min, max) => min + Math.floor(Math.random() * (max - min + 1)),
};

/** RNG que devolve uma sequência fixa (testes de dados). Repete o último valor ao acabar. */
export function createScriptedRng(values: number[]): Rng {
  let i = 0;
  return {
    int: (min, max) => {
      const v = values[Math.min(i++, values.length - 1)] ?? min;
      if (v < min || v > max) throw new Error(`valor roteirizado ${v} fora de [${min}, ${max}]`);
      return v;
    },
  };
}

/** Embaralha (Fisher–Yates) devolvendo um novo array. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
