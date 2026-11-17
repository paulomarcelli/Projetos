import { useMemo } from "react";
import * as THREE from "three";

// Lua com a cor real do LRO (NASA CGI Moon Kit, domínio público), esfera lisa de 96 segmentos.
// No céu da Terra ela é emissiva (lua cheia, com bloom); no espaço, recebe a luz do Sol (mostra a fase).

function texturaHalo() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 60, 128, 128, 128);
  grad.addColorStop(0, "rgba(200,215,255,0.35)");
  grad.addColorStop(1, "rgba(200,215,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

type Props = { position: [number, number, number]; raio: number; textura: THREE.Texture; emissiva?: boolean; opacidade?: number; escala?: number };

export const EsferaLua: React.FC<Props> = ({ position, raio, textura, emissiva, opacidade = 1, escala = 1 }) => {
  const material = useMemo(
    () =>
      emissiva
        ? new THREE.MeshStandardMaterial({ color: "#000000", emissive: "#ffffff", emissiveMap: textura, emissiveIntensity: 1.35, fog: false, transparent: true })
        : new THREE.MeshStandardMaterial({ map: textura, bumpMap: textura, bumpScale: 2, roughness: 1, metalness: 0, fog: false }),
    [emissiva, textura],
  );
  const halo = useMemo(texturaHalo, []);
  if (opacidade <= 0.001) return null;
  material.opacity = opacidade;
  return (
    <group position={position} scale={escala}>
      {/* rotação: a face visível da Lua (longitude 0) virada para a Terra (+z) */}
      <mesh material={material} rotation={[0, -Math.PI / 2, 0]}>
        <sphereGeometry args={[raio, 96, 64]} />
      </mesh>
      {emissiva ? (
        <sprite scale={[raio * 3.4, raio * 3.4, 1]}>
          <spriteMaterial map={halo} transparent opacity={opacidade} depthWrite={false} fog={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ) : null}
    </group>
  );
};

export const POSICAO_LUA: [number, number, number] = [-90, 300, -1100];
export const DIAMETRO_LUA = 230;

/** A Lua do céu. Some com `mov/lua-some`: escala 100% para 96% e opacidade para 0. */
export const LuaNoCeu: React.FC<{ visivel: number; textura: THREE.Texture }> = ({ visivel, textura }) => (
  <EsferaLua position={POSICAO_LUA} raio={DIAMETRO_LUA / 2} textura={textura} emissiva opacidade={visivel} escala={0.96 + 0.04 * visivel} />
);
