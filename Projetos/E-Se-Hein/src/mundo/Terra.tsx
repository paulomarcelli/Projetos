import { useMemo } from "react";
import * as THREE from "three";
import { sorteador } from "./aleatorio";
import { EsferaLua } from "./Lua";

// Terra no espaço com o NASA Blue Marble (domínio público), nuvens leves e atmosfera fina.
// Fica bem acima do mundo; a névoa esconde o chão lá embaixo.
export const TERRA_POS: [number, number, number] = [0, 2600, -300];
export const TERRA_RAIO = 26;
export const INCLINACAO = (23.4 * Math.PI) / 180;
/** Lua no espaço (Q6): 27% do diâmetro da Terra; distância fora de escala. */
export const LUA_ESPACO_OFFSET: [number, number, number] = [74, 52, -20];
export const LUA_ESPACO_DIAMETRO = TERRA_RAIO * 2 * 0.27;

/** Nuvens geradas (manchas suaves); não há mapa de nuvens pequeno em domínio público à mão. */
function texturaNuvens() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = c.getContext("2d")!;
  const r = sorteador(13);
  for (let i = 0; i < 520; i++) {
    const y = 60 + r() * 392;
    const x = r() * 1024;
    const raio = 6 + r() * 26;
    const grad = g.createRadialGradient(x, y, 0, x, y, raio);
    grad.addColorStop(0, `rgba(255,255,255,${0.22 + r() * 0.3})`);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.beginPath();
    g.ellipse(x, y, raio * 2.2, raio, 0, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function materialAtmosfera() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
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
        float borda = pow(clamp(1.0 + dot(vNormal, vVista) * 1.0, 0.0, 1.0), 3.0);
        gl_FragColor = vec4(vec3(0.35, 0.65, 1.0) * borda * 1.4, borda);
      }`,
  });
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

type Props = { tempo: number; balanco: number; luaEspaco: number; visivel: number; terra: THREE.Texture; lua: THREE.Texture };

export const Terra: React.FC<Props> = ({ tempo, balanco, luaEspaco, visivel, terra, lua }) => {
  const matTerra = useMemo(() => new THREE.MeshStandardMaterial({ map: terra, roughness: 0.75, metalness: 0, fog: false }), [terra]);
  const matNuvens = useMemo(() => new THREE.MeshStandardMaterial({ map: texturaNuvens(), transparent: true, depthWrite: false, roughness: 1, fog: false }), []);
  const matAtmosfera = useMemo(materialAtmosfera, []);
  const matEixo = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff", fog: false }), []);
  const linha = useMemo(orbita, []);
  if (visivel <= 0.001) return null;
  const luaPos: [number, number, number] = [TERRA_POS[0] + LUA_ESPACO_OFFSET[0], TERRA_POS[1] + LUA_ESPACO_OFFSET[1], TERRA_POS[2] + LUA_ESPACO_OFFSET[2]];
  return (
    <group>
      <group position={TERRA_POS}>
        <group rotation={[0, 0, -(INCLINACAO + balanco)]}>
          <mesh material={matTerra} rotation={[0, -1.2 + tempo * 0.12, 0]}>
            <sphereGeometry args={[TERRA_RAIO, 96, 64]} />
          </mesh>
          <mesh material={matNuvens} rotation={[0, tempo * 0.16, 0]}>
            <sphereGeometry args={[TERRA_RAIO * 1.012, 96, 64]} />
          </mesh>
          <mesh material={matEixo}>
            <cylinderGeometry args={[0.3, 0.3, TERRA_RAIO * 3, 8]} />
          </mesh>
        </group>
        <mesh material={matAtmosfera}>
          <sphereGeometry args={[TERRA_RAIO * 1.07, 64, 48]} />
        </mesh>
        {luaEspaco > 0.01 ? <primitive object={linha} /> : null}
      </group>
      {luaEspaco > 0.01 ? <EsferaLua position={luaPos} raio={LUA_ESPACO_DIAMETRO / 2} textura={lua} opacidade={1} /> : null}
    </group>
  );
};

/** Ponta do eixo (polo norte) no mundo, para prender rótulos. */
export const poloNorte = (balanco: number): [number, number, number] => {
  const a = -(INCLINACAO + balanco);
  const h = TERRA_RAIO * 1.5;
  return [TERRA_POS[0] - Math.sin(a) * h, TERRA_POS[1] + Math.cos(a) * h, TERRA_POS[2]];
};
