import { useMemo } from "react";
import * as THREE from "three";
import { sorteador } from "./aleatorio";
import { mundo } from "./paleta";

/** Lua low-poly com crateras pintadas nas faces. */
export function geometriaLua(detalhe = 3) {
  const g = new THREE.IcosahedronGeometry(1, detalhe).toNonIndexed();
  const r = sorteador(5);
  const crateras = Array.from({ length: 11 }, () => ({
    c: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(),
    raio: 0.15 + r() * 0.28,
  }));
  const pos = g.getAttribute("position");
  const cores: number[] = [];
  const clara = new THREE.Color(mundo.lua);
  const escura = new THREE.Color(mundo.luaCratera);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    v.set(0, 0, 0);
    for (let k = 0; k < 3; k++) v.add(new THREE.Vector3().fromBufferAttribute(pos, i + k));
    v.normalize();
    const naCratera = crateras.some((c) => v.distanceTo(c.c) < c.raio);
    const cor = naCratera ? escura : clara;
    for (let k = 0; k < 3; k++) cores.push(cor.r, cor.g, cor.b);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(cores, 3));
  return g;
}

function texturaHalo() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 40, 128, 128, 128);
  grad.addColorStop(0, "rgba(255,250,225,0.9)");
  grad.addColorStop(0.45, "rgba(200,215,255,0.25)");
  grad.addColorStop(1, "rgba(200,215,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export const POSICAO_LUA: [number, number, number] = [-90, 230, -900];
export const RAIO_LUA = 95;

type Props = { visivel: number; /** 0 a 1: a Lua sobe do horizonte na abertura. */ subir?: number };

/** A Lua grande do céu. `visivel` 0..1 controla o sumiço (sem explosão: só apaga). */
export const LuaNoCeu: React.FC<Props> = ({ visivel, subir = 1 }) => {
  const geo = useMemo(() => geometriaLua(3), []);
  const halo = useMemo(() => texturaHalo(), []);
  if (visivel <= 0.001) return null;
  const escala = RAIO_LUA * (0.92 + 0.08 * visivel);
  return (
    <group position={[POSICAO_LUA[0], POSICAO_LUA[1] - (1 - subir) * 90, POSICAO_LUA[2]]}>
      <mesh geometry={geo} scale={escala} rotation={[0.3, 0.6, 0]}>
        <meshLambertMaterial vertexColors flatShading emissive="#9c9886" transparent opacity={visivel} fog={false} />
      </mesh>
      <sprite scale={[RAIO_LUA * 4.2, RAIO_LUA * 4.2, 1]}>
        <spriteMaterial map={halo} transparent opacity={0.55 * visivel} depthWrite={false} fog={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
};
