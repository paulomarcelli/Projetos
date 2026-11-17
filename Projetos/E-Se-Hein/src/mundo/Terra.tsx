import { useMemo } from "react";
import * as THREE from "three";
import { sorteador } from "./aleatorio";
import { geometriaLua } from "./Lua";
import { mundo } from "./paleta";

// Terra de brinquedo flutuando no céu noturno, acima do mar.
export const TERRA_POS: [number, number, number] = [0, 300, -420];
export const TERRA_RAIO = 26;
export const INCLINACAO = (23.4 * Math.PI) / 180;

function geometriaTerra() {
  const g = new THREE.IcosahedronGeometry(1, 3).toNonIndexed();
  const r = sorteador(11);
  const manchas = Array.from({ length: 9 }, () => ({
    c: new THREE.Vector3(r() - 0.5, (r() - 0.5) * 1.4, r() - 0.5).normalize(),
    raio: 0.32 + r() * 0.35,
  }));
  const pos = g.getAttribute("position");
  const cores: number[] = [];
  const mar = new THREE.Color(mundo.terraMar);
  const terra = new THREE.Color(mundo.terraContinente);
  const gelo = new THREE.Color(mundo.terraGelo);
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    v.set(0, 0, 0);
    for (let k = 0; k < 3; k++) v.add(new THREE.Vector3().fromBufferAttribute(pos, i + k));
    v.normalize();
    let cor = mar;
    if (Math.abs(v.y) > 0.86) cor = gelo;
    else if (manchas.some((m) => v.distanceTo(m.c) < m.raio)) cor = terra;
    for (let k = 0; k < 3; k++) cores.push(cor.r, cor.g, cor.b);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(cores, 3));
  return g;
}

/** Lua pequena em órbita, relativa ao centro da Terra. */
const orbita = (tempo: number): [number, number, number] => {
  const a = tempo * 0.6;
  return [Math.cos(a) * TERRA_RAIO * 2, Math.sin(a) * TERRA_RAIO * 2 * 0.12, Math.sin(a) * TERRA_RAIO * 2];
};

/** Posição da Lua pequena no mundo (para prender o rótulo). */
export const posicaoLuaOrbita = (tempo: number): [number, number, number] => {
  const o = orbita(tempo);
  return [TERRA_POS[0] + o[0], TERRA_POS[1] + o[1], TERRA_POS[2] + o[2]];
};

type Props = {
  tempo: number;
  /** Balanço do eixo em radianos, somado à inclinação de 23,4°. */
  balanco: number;
  /** Lua pequena em órbita (0 = sem Lua). */
  luaOrbita: number;
  visivel: number;
};

export const Terra: React.FC<Props> = ({ tempo, balanco, luaOrbita, visivel }) => {
  const geo = useMemo(geometriaTerra, []);
  const geoLua = useMemo(() => geometriaLua(2), []);
  if (visivel <= 0.001) return null;
  return (
    <group position={TERRA_POS} scale={visivel}>
      <group rotation={[0, 0, INCLINACAO + balanco]}>
        <mesh geometry={geo} scale={TERRA_RAIO} rotation={[0, tempo * 0.35, 0]}>
          <meshLambertMaterial vertexColors flatShading emissive="#1d2f55" />
        </mesh>
        {/* Eixo */}
        <mesh>
          <cylinderGeometry args={[0.7, 0.7, TERRA_RAIO * 2.9, 8]} />
          <meshLambertMaterial color="#ffd21f" emissive="#6b5400" />
        </mesh>
        {[1, -1].map((l) => (
          <mesh key={l} position={[0, l * TERRA_RAIO * 1.45, 0]}>
            <sphereGeometry args={[1.5, 10, 8]} />
            <meshLambertMaterial color="#ffd21f" emissive="#6b5400" />
          </mesh>
        ))}
      </group>
      {luaOrbita > 0.01 ? (
        <group>
          <mesh rotation={[Math.PI / 2 - 0.12, 0, 0]}>
            <torusGeometry args={[TERRA_RAIO * 2, 0.25, 6, 96]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.35 * luaOrbita} />
          </mesh>
          <mesh
            geometry={geoLua}
            position={orbita(tempo)}
            scale={7 * luaOrbita}
          >
            <meshLambertMaterial vertexColors flatShading emissive="#6f6b5c" />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};
