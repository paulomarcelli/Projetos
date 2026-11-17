import { useMemo } from "react";
import * as THREE from "three";
import { sorteador } from "./aleatorio";
import { DiscoLua } from "./Lua";
import { corMundo } from "./paleta";

// Terra de brinquedo no espaço, bem acima do mundo (a névoa esconde o chão lá embaixo).
export const TERRA_POS: [number, number, number] = [0, 2600, -300];
export const TERRA_RAIO = 26;
export const INCLINACAO = (23.4 * Math.PI) / 180;
/** Lua no espaço (Q6): 27% do diâmetro da Terra; distância fora de escala. */
export const LUA_ESPACO_OFFSET: [number, number, number] = [74, 52, -20];
export const LUA_ESPACO_DIAMETRO = TERRA_RAIO * 2 * 0.27;

const fixo = { dia: 1, noite: 0, breu: 0 };

function geometriaTerra() {
  const g = new THREE.IcosahedronGeometry(1, 4).toNonIndexed();
  const r = sorteador(11);
  const manchas = Array.from({ length: 8 }, () => ({
    c: new THREE.Vector3(r() - 0.5, (r() - 0.5) * 1.2, r() - 0.5).normalize(),
    raio: 0.3 + r() * 0.3,
  }));
  const pos = g.getAttribute("position");
  const cores: number[] = [];
  const mar = new THREE.Color(corMundo("mundo/terra/oceano", fixo));
  const terra = new THREE.Color(corMundo("mundo/terra/continente", fixo));
  const gelo = new THREE.Color(corMundo("mundo/terra/gelo", fixo));
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    v.set(0, 0, 0);
    for (let k = 0; k < 3; k++) v.add(new THREE.Vector3().fromBufferAttribute(pos, i + k));
    v.normalize();
    const cor = Math.abs(v.y) > 0.9 ? gelo : manchas.some((m) => v.distanceTo(m.c) < m.raio) ? terra : mar;
    for (let k = 0; k < 3; k++) cores.push(cor.r, cor.g, cor.b);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(cores, 3));
  return g;
}

/** Elipse tracejada que passa pela Lua (vista meio de lado). */
function orbita() {
  const u = new THREE.Vector3(...LUA_ESPACO_OFFSET);
  const v = new THREE.Vector3().crossVectors(u, new THREE.Vector3(0, 1, 0)).normalize().multiplyScalar(u.length() * 0.6);
  const pts = Array.from({ length: 129 }, (_, i) => {
    const a = (i / 128) * Math.PI * 2;
    return u.clone().multiplyScalar(Math.cos(a)).add(v.clone().multiplyScalar(Math.sin(a)));
  });
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  const l = new THREE.Line(g, new THREE.LineDashedMaterial({ color: "#ffffff", dashSize: 3, gapSize: 3, transparent: true, opacity: 0.55, fog: false }));
  l.computeLineDistances();
  return l;
}

type Props = { tempo: number; balanco: number; luaEspaco: number; visivel: number };

export const Terra: React.FC<Props> = ({ tempo, balanco, luaEspaco, visivel }) => {
  const geo = useMemo(geometriaTerra, []);
  const matTerra = useMemo(() => new THREE.MeshLambertMaterial({ vertexColors: true, fog: false }), []);
  const matEixo = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff", fog: false }), []);
  const linha = useMemo(orbita, []);
  if (visivel <= 0.001) return null;
  const luaPos: [number, number, number] = [TERRA_POS[0] + LUA_ESPACO_OFFSET[0], TERRA_POS[1] + LUA_ESPACO_OFFSET[1], TERRA_POS[2] + LUA_ESPACO_OFFSET[2]];
  return (
    <group>
      <group position={TERRA_POS}>
        <group rotation={[0, 0, -(INCLINACAO + balanco)]}>
          <mesh geometry={geo} material={matTerra} scale={TERRA_RAIO} rotation={[0, tempo * 0.25, 0]} />
          <mesh material={matEixo}>
            <cylinderGeometry args={[0.35, 0.35, TERRA_RAIO * 3, 6]} />
          </mesh>
        </group>
        {luaEspaco > 0.01 ? (
          <primitive object={linha} />
        ) : null}
      </group>
      <DiscoLua position={luaPos} diametro={LUA_ESPACO_DIAMETRO} opacidade={luaEspaco} />
    </group>
  );
};

/** Ponta do eixo (polo norte) no mundo, para prender rótulos. */
export const poloNorte = (balanco: number): [number, number, number] => {
  const a = -(INCLINACAO + balanco);
  const h = TERRA_RAIO * 1.5;
  return [TERRA_POS[0] - Math.sin(a) * h, TERRA_POS[1] + Math.cos(a) * h, TERRA_POS[2]];
};
