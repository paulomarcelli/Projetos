import { useMemo } from "react";
import * as THREE from "three";
import { corToken } from "./materiais";

// Sol: esfera emissiva (o Bloom do pós-processamento pega o brilho) com um halo. A cor vem do token
// `mundo/janela/acesa` (o amarelo emissivo do Design System; ainda não há um token próprio do Sol).
// `brilho` 1 = aceso; 0 = apagado (a esfera fica escura, quase da cor do espaço, e o halo some).

function texturaHalo() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  // O disco ocupa 22% do raio do halo; o brilho cai rápido logo fora dele e some devagar até a borda.
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0.2, "rgba(255,255,255,1)");
  r.addColorStop(0.3, "rgba(255,255,255,0.55)");
  r.addColorStop(0.5, "rgba(255,255,255,0.18)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let halo: THREE.CanvasTexture | null = null;
const pegarHalo = () => (halo ??= texturaHalo());

/** Quanto a esfera acesa passa do branco do quadro (acima do limiar do Bloom, 0,82). */
const INTENSIDADE = 6;
/** Esfera apagada: o mesmo amarelo bem escuro, para ainda dar para ver onde o Sol estava. */
const APAGADO = 0.04;

type PropsDisco = { position: [number, number, number]; diametro: number; brilho: number; opacidade?: number; escala?: number };

export const DiscoSol: React.FC<PropsDisco> = ({ position, diametro, brilho, opacidade = 1, escala = 1 }) => {
  const texHalo = useMemo(pegarHalo, []);
  const material = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, fog: false, toneMapped: false }), []);
  const matHalo = useMemo(
    () => new THREE.SpriteMaterial({ map: texHalo, transparent: true, depthWrite: false, fog: false, toneMapped: false, blending: THREE.AdditiveBlending }),
    [texHalo],
  );
  if (opacidade <= 0.001) return null;
  const cor = corToken("mundo/janela/acesa");
  const k = APAGADO + (INTENSIDADE - APAGADO) * brilho;
  material.color.copy(cor).multiplyScalar(k);
  material.opacity = opacidade;
  matHalo.color.copy(cor);
  matHalo.opacity = opacidade * brilho;
  const raio = (diametro / 2) * escala;
  return (
    <group position={position}>
      {brilho > 0.001 ? <sprite material={matHalo} scale={[raio * 9, raio * 9, 1]} renderOrder={-5} /> : null}
      <mesh material={material} scale={raio}>
        <sphereGeometry args={[1, 48, 24]} />
      </mesh>
    </group>
  );
};

/** Sol no céu, visto da laje: no alto, à direita da Lua, sobre o mar. Do mesmo tamanho aparente que a Lua, como no céu de verdade. */
export const POSICAO_SOL: [number, number, number] = [190, 560, -1100];
export const DIAMETRO_SOL = 200;

/** O Sol do céu. `visivel` 0 a 1 (some encolhendo um pouco, como a Lua em `mov/lua-some`). */
export const SolNoCeu: React.FC<{ visivel: number }> = ({ visivel }) => (
  <DiscoSol position={POSICAO_SOL} diametro={DIAMETRO_SOL} brilho={1} opacidade={visivel} escala={0.96 + 0.04 * visivel} />
);
