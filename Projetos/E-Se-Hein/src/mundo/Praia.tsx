import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { ORLA_Z } from "./Cidade";
import { MARE_AMP_COM_LUA, MARE_AMP_SEM_LUA } from "./ambiente";
import { corToken, mat } from "./materiais";
import { Plano } from "./Plano";
import { rotulo } from "./paleta";

// A areia desce do calçadão (y = 0) até y = -3 em 36 m; a água sobe e desce nessa rampa.
export const AREIA_INICIO_Z = ORLA_Z - 8;
const AREIA_COMPR = 36;
const AREIA_QUEDA = 3;
const AREIA_FIM_Z = AREIA_INICIO_Z - AREIA_COMPR;

/** Altura da areia em z. */
export const alturaAreia = (z: number) => -AREIA_QUEDA * Math.min(1, Math.max(0, (AREIA_INICIO_Z - z) / AREIA_COMPR));
/** z da linha d'água para o nível `y`. */
export const linhaDagua = (y: number) => AREIA_INICIO_Z + (y / AREIA_QUEDA) * AREIA_COMPR;

/** Período da maré na tela (acelerado: horas viram segundos). */
const PERIODO = 3.4;
export const nivelAgua = (tempo: number, centro: number, amp: number) => centro + amp * Math.sin((tempo * 2 * Math.PI) / PERIODO);

/** Régua de maré fincada na água (Q3), perto do morro. */
export const REGUA: [number, number, number] = [-300, 0, AREIA_INICIO_Z - 30];

function geometriaMar() {
  const colunas = 110;
  const linhas = 50;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let k = 0; k <= linhas; k++) {
    const z = AREIA_INICIO_Z + 2 - Math.pow(k / linhas, 2.2) * 2400;
    for (let i = 0; i <= colunas; i++) {
      const x = -1500 + (i / colunas) * 3000;
      pos.push(x, 0, z);
      uv.push(x / 9, z / 9);
    }
  }
  for (let k = 0; k < linhas; k++) {
    for (let i = 0; i < colunas; i++) {
      const a = k * (colunas + 1) + i;
      idx.push(a, a + 1, a + colunas + 1, a + 1, a + colunas + 2, a + colunas + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(new Float32Array(pos.length), 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

const Rampa: React.FC<{ zIni: number; zFim: number; acima: number; material: THREE.Material }> = ({ zIni, zFim, acima, material }) => {
  const y0 = alturaAreia(zIni);
  const y1 = alturaAreia(zFim);
  const compr = Math.hypot(zIni - zFim, y0 - y1);
  return (
    <mesh position={[0, (y0 + y1) / 2 + acima, (zIni + zFim) / 2]} rotation={[-Math.PI / 2 - Math.atan(AREIA_QUEDA / AREIA_COMPR), 0, 0]} material={material} receiveShadow>
      <Plano w={3000} h={compr} metros={5} />
    </mesh>
  );
};

type Props = { tempo: number; centro: number; amp: number; regua: number; normaisAgua: THREE.Texture };

export const Praia: React.FC<Props> = ({ tempo, centro, amp, regua, normaisAgua }) => {
  const geo = useMemo(geometriaMar, []);
  const base = useMemo(() => Float32Array.from(geo.getAttribute("position").array as Float32Array), [geo]);
  useEffect(() => () => geo.dispose(), [geo]);
  // Água: cor do token (raso/fundo) + normais de água em movimento, refletindo o HDRI.
  const matMar = useMemo(
    () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.14, metalness: 0.15, normalMap: normaisAgua, normalScale: new THREE.Vector2(0.6, 0.6), envMapIntensity: 1.3 }),
    [normaisAgua],
  );
  normaisAgua.offset.set(tempo * 0.018, tempo * 0.011);

  // Ondas e cor (raso perto da areia, fundo longe), guiadas pelo tempo do vídeo.
  const nivel = nivelAgua(tempo, centro, amp);
  const raso = corToken("mundo/agua/raso");
  const fundo = corToken("mundo/agua/fundo");
  const attr = geo.getAttribute("position") as THREE.BufferAttribute;
  const cor = geo.getAttribute("color") as THREE.BufferAttribute;
  const c = new THREE.Color();
  for (let i = 0; i < attr.count; i++) {
    const x = base[i * 3];
    const z = base[i * 3 + 2];
    const perto = Math.min(1, Math.max(0, 1 - (AREIA_INICIO_Z - z) / 90));
    const onda = (0.18 + 0.2 * (1 - perto)) * (Math.sin(x * 0.11 + tempo * 1.1 + z * 0.05) + 0.6 * Math.sin(z * 0.17 - tempo * 1.6));
    attr.setY(i, nivel + onda);
    c.copy(fundo).lerp(raso, perto);
    cor.setXYZ(i, c.r, c.g, c.b);
  }
  attr.needsUpdate = true;
  cor.needsUpdate = true;
  geo.computeVertexNormals();

  const zAlta = linhaDagua(centro + MARE_AMP_COM_LUA);
  const zLinha = linhaDagua(nivel);
  const baseRegua = -AREIA_QUEDA - 0.5;
  return (
    <group>
      <Rampa zIni={AREIA_INICIO_Z} zFim={AREIA_FIM_Z} acima={0} material={mat("mundo/areia/seca")} />
      <Rampa zIni={Math.min(AREIA_INICIO_Z, zAlta + 0.6)} zFim={AREIA_FIM_Z} acima={0.03} material={mat("mundo/areia/molhada")} />
      <mesh position={[0, -AREIA_QUEDA - 0.01, AREIA_FIM_Z - 600]} rotation={[-Math.PI / 2, 0, 0]} material={mat("mundo/areia/molhada")}>
        <Plano w={3000} h={1200} metros={5} />
      </mesh>
      <mesh geometry={geo} material={matMar} receiveShadow />
      {/* Espuma na linha da água */}
      <mesh position={[0, nivel + 0.12, zLinha - 0.4]} rotation={[-Math.PI / 2, 0, 0]} material={mat("mundo/agua/espuma")}>
        <planeGeometry args={[3000, 1.3]} />
      </mesh>
      {regua > 0.01 ? (
        <group position={[REGUA[0], 0, REGUA[2]]} scale={[1, regua, 1]}>
          <mesh position={[0, baseRegua + 3.5, 0]} material={mat("mundo/agua/espuma")} castShadow>
            <boxGeometry args={[0.5, 7, 0.25]} />
          </mesh>
          {Array.from({ length: 14 }, (_, k) => (
            <mesh key={k} position={[0.05, baseRegua + 0.25 + k * 0.5, 0.13]} material={mat("mundo/chao/rua")}>
              <boxGeometry args={[k % 2 ? 0.2 : 0.35, 0.06, 0.02]} />
            </mesh>
          ))}
          {/* Faixa verde: quanto a água sobe e desce com a Lua. Vermelha: sem a Lua (~46%). */}
          <mesh position={[-0.4, centro, 0.1]}>
            <boxGeometry args={[0.18, MARE_AMP_COM_LUA * 2, 0.05]} />
            <meshBasicMaterial color={rotulo.verde} />
          </mesh>
          <mesh position={[-0.65, centro, 0.1]}>
            <boxGeometry args={[0.18, MARE_AMP_SEM_LUA * 2, 0.05]} />
            <meshBasicMaterial color={rotulo.vermelho} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};
