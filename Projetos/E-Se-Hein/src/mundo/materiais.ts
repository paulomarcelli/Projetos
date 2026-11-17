import * as THREE from "three";
import { corMundo, type Modo, type TokenMundo, tokensMundo } from "./paleta";
import type { Pbr, Texturas } from "./texturas";

// Um material por token. A cor vem do modo ativo (Dia, Noite, Breu): a cada quadro `aplicarModo`
// mistura os modos e todas as peças mudam juntas. O material é PBR (MeshStandardMaterial), para
// receber a luz do HDRI; chão, areia e asfalto ganham o relevo das texturas do Poly Haven.

const cores = new Map<TokenMundo, THREE.Color>(tokensMundo.map((t) => [t, new THREE.Color(corMundo(t, { dia: 0, noite: 1, breu: 0 }))]));

/** Cor compartilhada do token (o mesmo objeto é atualizado a cada quadro). */
export const corToken = (t: TokenMundo) => cores.get(t)!;

export function aplicarModo(modo: Modo) {
  for (const t of tokensMundo) cores.get(t)!.set(corMundo(t, modo));
}

const cache = new Map<string, THREE.MeshStandardMaterial>();

/** Material sem brilho especular forte, cor do token. */
export function mat(t: TokenMundo, opcoes: { lisa?: boolean; emissivo?: boolean } = {}) {
  const chave = `${t}|${opcoes.lisa ? 1 : 0}|${opcoes.emissivo ? 1 : 0}`;
  let m = cache.get(chave);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ flatShading: !opcoes.lisa, roughness: 0.85, metalness: 0 });
    m.color = corToken(t);
    if (opcoes.emissivo) {
      m.color = new THREE.Color("#000000");
      m.emissive = corToken(t);
    }
    cache.set(chave, m);
  }
  return m;
}

const comPbr = (m: THREE.MeshStandardMaterial, p: Pbr, relevo: number) => {
  m.map = p.detalhe;
  m.normalMap = p.normal;
  m.normalScale.set(relevo, relevo);
  m.roughnessMap = p.rugosidade;
  m.roughness = 1;
  m.flatShading = false;
  m.needsUpdate = true;
};

let texturasAplicadas = false;

/** Liga as texturas PBR aos materiais de chão (uma vez). */
export function aplicarTexturas(tex: Texturas) {
  if (texturasAplicadas) return;
  texturasAplicadas = true;
  comPbr(mat("mundo/areia/seca"), tex.areia, 1);
  comPbr(mat("mundo/areia/molhada"), tex.areia, 0.6);
  mat("mundo/areia/molhada").roughness = 0.45;
  comPbr(mat("mundo/chao/grama"), tex.grama, 1.2);
  comPbr(mat("mundo/chao/rua"), tex.asfalto, 1);
  comPbr(mat("mundo/chao/calcada"), tex.asfalto, 0.4);
}

/** Multiplica as coordenadas de textura para repetir a cada `metros` (planos grandes). */
export function escalarUV<G extends THREE.BufferGeometry>(g: G, largura: number, altura: number, metros = 6): G {
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * largura) / metros, (uv.getY(i) * altura) / metros);
  uv.needsUpdate = true;
  return g;
}
