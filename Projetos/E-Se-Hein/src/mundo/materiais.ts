import * as THREE from "three";
import { corMundo, type Modo, type TokenMundo, tokensMundo } from "./paleta";

// Um material por token. A cor vem do modo ativo (Dia, Noite, Breu), não da luz:
// a cada quadro `aplicarModo` mistura os modos e todas as peças mudam juntas.

const cores = new Map<TokenMundo, THREE.Color>(tokensMundo.map((t) => [t, new THREE.Color(corMundo(t, { dia: 0, noite: 1, breu: 0 }))]));

/** Cor compartilhada do token (o mesmo objeto é atualizado a cada quadro). */
export const corToken = (t: TokenMundo) => cores.get(t)!;

export function aplicarModo(modo: Modo) {
  for (const t of tokensMundo) cores.get(t)!.set(corMundo(t, modo));
}

const cache = new Map<string, THREE.MeshLambertMaterial>();

/** Material Lambert sem brilho, com flatShading, cor do token. */
export function mat(t: TokenMundo, opcoes: { lisa?: boolean; emissivo?: boolean } = {}) {
  const chave = `${t}|${opcoes.lisa ? 1 : 0}|${opcoes.emissivo ? 1 : 0}`;
  let m = cache.get(chave);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ flatShading: !opcoes.lisa });
    m.color = corToken(t);
    if (opcoes.emissivo) {
      m.color = new THREE.Color("#000000");
      m.emissive = corToken(t);
    }
    cache.set(chave, m);
  }
  return m;
}
