import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { sorteador } from "./aleatorio";
import { ORLA_Z } from "./Cidade";
import { mundo } from "./paleta";

// A areia desce do calçadão (y = 0) até y = -3 em 36 m; o mar sobe e desce nessa rampa.
export const AREIA_INICIO_Z = ORLA_Z - 8;
const AREIA_FIM_Z = AREIA_INICIO_Z - 36;
const AREIA_QUEDA = 3;
/** Nível da água para uma maré de `mare` metros. */
export const nivelAgua = (mare: number) => -2.2 + mare;
/** Altura da areia em z. */
export const alturaAreia = (z: number) => -AREIA_QUEDA * Math.min(1, Math.max(0, (AREIA_INICIO_Z - z) / (AREIA_INICIO_Z - AREIA_FIM_Z)));

/** Onde fica a régua da maré (para os rótulos). */
export const REGUA: [number, number, number] = [16, 0, AREIA_INICIO_Z - 28];

function geometriaMar() {
  const colunas = 90;
  const linhas = 46;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let k = 0; k <= linhas; k++) {
    const z = AREIA_INICIO_Z + 2 - Math.pow(k / linhas, 2.2) * 1700;
    for (let i = 0; i <= colunas; i++) pos.push(-900 + (i / colunas) * 1800, 0, z);
  }
  for (let k = 0; k < linhas; k++) {
    for (let i = 0; i < colunas; i++) {
      const a = k * (colunas + 1) + i;
      idx.push(a, a + 1, a + colunas + 1, a + 1, a + colunas + 2, a + colunas + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

function texturaCaminhoLuar() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 512;
  const g = c.getContext("2d")!;
  const r = sorteador(3);
  for (let y = 0; y < 512; y += 6) {
    const forca = 0.15 + 0.85 * (1 - y / 512);
    const larg = 10 + r() * 40 * (1 - y / 600);
    g.fillStyle = `rgba(255,245,210,${(0.35 + r() * 0.5) * forca})`;
    g.fillRect(32 - larg / 2 + (r() - 0.5) * 10, y, larg, 3);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

type Props = { tempo: number; mare: number; luar: number; reguaVisivel: number };

export const Praia: React.FC<Props> = ({ tempo, mare, luar, reguaVisivel }) => {
  const geo = useMemo(geometriaMar, []);
  const base = useMemo(() => Float32Array.from(geo.getAttribute("position").array as Float32Array), [geo]);
  const luarTex = useMemo(texturaCaminhoLuar, []);
  useEffect(() => () => geo.dispose(), [geo]);

  // Ondas guiadas pelo tempo do vídeo (nunca pelo relógio), para o render sair igual.
  const nivel = nivelAgua(mare);
  const attr = geo.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < attr.count; i++) {
    const x = base[i * 3];
    const z = base[i * 3 + 2];
    const y =
      0.32 * Math.sin(x * 0.11 + tempo * 1.1 + z * 0.05) +
      0.22 * Math.sin(z * 0.17 - tempo * 1.6) +
      0.12 * Math.sin((x + z) * 0.3 + tempo * 2.3);
    attr.setY(i, nivel + y);
  }
  attr.needsUpdate = true;
  geo.computeVertexNormals();

  const marcas = [0, 1, 2, 3];
  return (
    <group>
      {/* Areia em rampa */}
      <mesh position={[0, -AREIA_QUEDA / 2, (AREIA_INICIO_Z + AREIA_FIM_Z) / 2]} rotation={[-Math.PI / 2 - Math.atan(AREIA_QUEDA / 36), 0, 0]} receiveShadow>
        <planeGeometry args={[1800, Math.hypot(36, AREIA_QUEDA) + 0.5]} />
        <meshLambertMaterial color={mundo.areia} />
      </mesh>
      <mesh position={[0, -AREIA_QUEDA - 0.01, AREIA_FIM_Z - 400]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1800, 800]} />
        <meshLambertMaterial color="#b9a26a" />
      </mesh>
      {/* Mar */}
      <mesh geometry={geo} receiveShadow>
        <meshLambertMaterial color={mundo.mar} flatShading />
      </mesh>
      {/* Caminho de luar na água */}
      {luar > 0.01 ? (
        <mesh position={[-14, nivel + 0.45, AREIA_INICIO_Z - 330]} rotation={[-Math.PI / 2, 0, -0.1]}>
          <planeGeometry args={[70, 600]} />
          <meshBasicMaterial map={luarTex} transparent opacity={0.6 * luar} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ) : null}
      {/* Régua da maré */}
      {reguaVisivel > 0.01 ? (
        <group position={[REGUA[0], -AREIA_QUEDA, REGUA[2]]} scale={[1, reguaVisivel, 1]}>
          <mesh position={[0, 2.6, 0]} castShadow>
            <boxGeometry args={[0.7, 5.2, 0.3]} />
            <meshLambertMaterial color="#ffffff" />
          </mesh>
          {marcas.map((m) => (
            <mesh key={m} position={[0, 0.8 + m, 0.17]}>
              <boxGeometry args={[0.72, 0.5, 0.04]} />
              <meshLambertMaterial color={m % 2 === 0 ? "#e5383b" : "#1a1a1a"} />
            </mesh>
          ))}
          <mesh position={[0, 5.3, 0]}>
            <boxGeometry args={[1.4, 0.3, 0.4]} />
            <meshLambertMaterial color="#ffd21f" />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};
