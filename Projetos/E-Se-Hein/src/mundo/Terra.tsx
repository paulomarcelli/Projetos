import { useMemo } from "react";
import * as THREE from "three";
import { DiscoLua } from "./Lua";

// Terra no espaço com a foto real da NASA (Blue Marble), bem acima do mundo (a névoa esconde o chão lá embaixo).
export const TERRA_POS: [number, number, number] = [0, 2600, -300];
export const TERRA_RAIO = 26;
export const INCLINACAO = (23.4 * Math.PI) / 180;
/** Lua no espaço (Q6): 27% do diâmetro da Terra; distância fora de escala. */
export const LUA_ESPACO_OFFSET: [number, number, number] = [74, 52, -20];
export const LUA_ESPACO_DIAMETRO = TERRA_RAIO * 2 * 0.27;

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

type Props = { tempo: number; balanco: number; luaEspaco: number; visivel: number; mapaTerra: THREE.Texture; mapaLua: THREE.Texture };

export const Terra: React.FC<Props> = ({ tempo, balanco, luaEspaco, visivel, mapaTerra, mapaLua }) => {
  const matTerra = useMemo(() => new THREE.MeshStandardMaterial({ map: mapaTerra, roughness: 0.75, metalness: 0, fog: false }), [mapaTerra]);
  // Atmosfera: uma casca um pouco maior, azul, que brilha mais na borda.
  const matAr = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        fog: false,
        vertexShader: /* glsl */ `
          varying vec3 vNormal;
          varying vec3 vVista;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vVista = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          varying vec3 vNormal;
          varying vec3 vVista;
          void main() {
            float borda = pow(1.0 - abs(dot(vNormal, vVista)), 2.2);
            gl_FragColor = vec4(vec3(0.35, 0.6, 1.0) * borda * 1.4, borda);
          }`,
      }),
    [],
  );
  const matEixo = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff", fog: false }), []);
  const linha = useMemo(orbita, []);
  if (visivel <= 0.001) return null;
  const luaPos: [number, number, number] = [TERRA_POS[0] + LUA_ESPACO_OFFSET[0], TERRA_POS[1] + LUA_ESPACO_OFFSET[1], TERRA_POS[2] + LUA_ESPACO_OFFSET[2]];
  return (
    <group>
      <group position={TERRA_POS}>
        <group rotation={[0, 0, -(INCLINACAO + balanco)]}>
          <mesh material={matTerra} scale={TERRA_RAIO} rotation={[0, tempo * 0.25, 0]}>
            <sphereGeometry args={[1, 96, 48]} />
          </mesh>
          <mesh material={matAr} scale={TERRA_RAIO * 1.06}>
            <sphereGeometry args={[1, 64, 32]} />
          </mesh>
          <mesh material={matEixo}>
            <cylinderGeometry args={[0.35, 0.35, TERRA_RAIO * 3, 6]} />
          </mesh>
        </group>
        {luaEspaco > 0.01 ? (
          <primitive object={linha} />
        ) : null}
      </group>
      <DiscoLua position={luaPos} diametro={LUA_ESPACO_DIAMETRO} mapa={mapaLua} opacidade={luaEspaco} />
    </group>
  );
};

/** Ponta do eixo (polo norte) no mundo, para prender rótulos. */
export const poloNorte = (balanco: number): [number, number, number] => {
  const a = -(INCLINACAO + balanco);
  const h = TERRA_RAIO * 1.5;
  return [TERRA_POS[0] - Math.sin(a) * h, TERRA_POS[1] + Math.cos(a) * h, TERRA_POS[2]];
};
