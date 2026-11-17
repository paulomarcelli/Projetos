import type { PoseBoneco, Vec3 } from "./tipos";

/** 0 -> 1 suave a partir de `inicio` (segundos), em `dur` segundos. */
export function entra(seg: number, inicio: number, dur = 0.45) {
  const x = Math.min(1, Math.max(0, (seg - inicio) / dur));
  return x * x * (3 - 2 * x);
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** Movimento lento e contínuo dentro da cena (começa e termina sem tranco). */
export const deslize = (p: number) => p * p * (3 - 2 * p);

export const bonecoParado = (position: Vec3, giro: number): PoseBoneco => ({
  position,
  giro,
  olharCima: 0,
  bracoDireito: 0.12,
  bracoEsquerdo: 0.12,
  apontar: 0,
  pulo: 0,
});
