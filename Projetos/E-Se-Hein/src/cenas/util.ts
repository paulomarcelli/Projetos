import type { Janela } from "../camadas/rotulos";
import type { PoseBoneco, PropsCena, Vec3 } from "./tipos";

/** 0 -> 1 suave a partir de `inicio` (segundos), em `dur` segundos. */
export function entra(seg: number, inicio: number, dur = 0.45) {
  const x = Math.min(1, Math.max(0, (seg - inicio) / dur));
  return x * x * (3 - 2 * x);
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const somar = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** Alvo da câmera a partir da posição, de um rumo (graus a partir de -z, positivo para -x) e da inclinação (graus). */
export function mirar(pos: Vec3, rumoGraus: number, inclinacaoGraus: number, dist = 100): Vec3 {
  const r = (rumoGraus * Math.PI) / 180;
  const i = (inclinacaoGraus * Math.PI) / 180;
  return [pos[0] - Math.sin(r) * dist, pos[1] + Math.tan(i) * dist, pos[2] - Math.cos(r) * dist];
}

/**
 * Janela de um rótulo: entra no segundo `ini`, fica no mínimo 1,5 s e sai antes da passagem de câmera
 * (Design System, regra de quantidade).
 */
export function janela(props: Pick<PropsCena, "saida">, ini: number, fim = Infinity): Janela {
  // Palavra tarde demais para 1,5 s antes da passagem: o rótulo entra mais cedo.
  const entrada = Math.max(0, Math.min(ini, props.saida - 1.5));
  return [entrada, Math.min(props.saida, Math.max(entrada + 1.5, fim))];
}

export const bonecoParado = (position: Vec3, giro: number): PoseBoneco => ({
  position,
  giro,
  olharCima: 0,
  bracoDireito: 0.08,
  bracoEsquerdo: 0.08,
  apontar: 0,
  ombros: 0,
  pulo: 0,
});
