import { useMemo } from "react";
import * as THREE from "three";

// Lua com a textura real da NASA (mapa LROC), numa esfera sem luz própria: vista da Terra, a Lua cheia é
// toda iluminada. Atrás dela, o halo do storyboard. A esfera gira para mostrar a face visível para a câmera.
function texturaHalo() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(128, 128, 60, 128, 128, 128);
  r.addColorStop(0, "rgba(190,205,245,0.42)");
  r.addColorStop(0.45, "rgba(170,185,230,0.16)");
  r.addColorStop(1, "rgba(170,185,230,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

let halo: THREE.CanvasTexture | null = null;
const pegarHalo = () => (halo ??= texturaHalo());

/** Brilho da superfície: o mapa LROC é albedo (cinza escuro); a Lua no céu parece quase branca. */
const BRILHO_LUA = 1.9;

/** Lua de diâmetro `diametro` (o halo ocupa 2,2×). `mapa` é a textura da NASA. */
export const DiscoLua: React.FC<{ position: [number, number, number]; diametro: number; mapa: THREE.Texture; opacidade?: number; escala?: number }> = ({
  position,
  diametro,
  mapa,
  opacidade = 1,
  escala = 1,
}) => {
  const texHalo = useMemo(pegarHalo, []);
  const material = useMemo(
    () => new THREE.MeshBasicMaterial({ map: mapa, color: new THREE.Color(BRILHO_LUA, BRILHO_LUA, BRILHO_LUA * 1.03), transparent: true, fog: false, toneMapped: false }),
    [mapa],
  );
  if (opacidade <= 0.001) return null;
  material.opacity = opacidade;
  const raio = (diametro / 2) * escala;
  return (
    <group position={position}>
      <sprite scale={[raio * 4.4, raio * 4.4, 1]} renderOrder={-5}>
        <spriteMaterial map={texHalo} transparent opacity={opacidade} depthWrite={false} fog={false} toneMapped={false} />
      </sprite>
      {/* u = 0,5 do mapa (face visível) aponta para +x; girar -90° a vira para +z, onde fica a câmera. */}
      <mesh material={material} scale={raio} rotation={[0.12, -Math.PI / 2, 0]}>
        <sphereGeometry args={[1, 64, 32]} />
      </mesh>
    </group>
  );
};

export const POSICAO_LUA: [number, number, number] = [-90, 300, -1100];
export const DIAMETRO_LUA = 230;

/** A Lua do céu. Some com `mov/lua-some`: escala 100% para 96% e opacidade para 0. */
export const LuaNoCeu: React.FC<{ visivel: number; mapa: THREE.Texture }> = ({ visivel, mapa }) => (
  <DiscoLua position={POSICAO_LUA} diametro={DIAMETRO_LUA} mapa={mapa} opacidade={visivel} escala={0.96 + 0.04 * visivel} />
);
