import { useMemo } from "react";
import * as THREE from "three";
import { sorteador } from "./aleatorio";
import { mundo } from "./paleta";

// Cidade de brinquedo à beira-mar. O mar fica para o lado -z; a cidade cresce para +z.
export const ORLA_Z = -30;
const CELULA = 18;
const ANDAR = 3;

type Fachada = { mat: THREE.MeshLambertMaterial };
const cache = new Map<string, Fachada>();

/** Material de fachada com janelas desenhadas; as acesas brilham (emissive). */
function fachada(cor: string, colunas: number, andares: number, semente: number): Fachada {
  const chave = `${cor}-${colunas}-${andares}-${semente % 3}`;
  const existente = cache.get(chave);
  if (existente) return existente;
  const px = 32;
  const base = document.createElement("canvas");
  base.width = colunas * px;
  base.height = andares * px;
  const brilho = document.createElement("canvas");
  brilho.width = base.width;
  brilho.height = base.height;
  const g = base.getContext("2d")!;
  const b = brilho.getContext("2d")!;
  g.fillStyle = cor;
  g.fillRect(0, 0, base.width, base.height);
  b.fillStyle = "#000";
  b.fillRect(0, 0, brilho.width, brilho.height);
  const r = sorteador(semente);
  for (let a = 0; a < andares; a++) {
    for (let c = 0; c < colunas; c++) {
      const acesa = r() < 0.55;
      g.fillStyle = "rgba(255,255,255,0.75)";
      g.fillRect(c * px + 7, a * px + 6, 18, 20);
      g.fillStyle = acesa ? mundo.janelaAcesa : mundo.janelaApagada;
      g.fillRect(c * px + 9, a * px + 8, 14, 16);
      if (acesa) {
        b.fillStyle = "#fff";
        b.fillRect(c * px + 9, a * px + 8, 14, 16);
      }
    }
  }
  const mapa = new THREE.CanvasTexture(base);
  mapa.colorSpace = THREE.SRGBColorSpace;
  mapa.magFilter = THREE.NearestFilter;
  const emissivo = new THREE.CanvasTexture(brilho);
  emissivo.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshLambertMaterial({ map: mapa, emissive: new THREE.Color(mundo.janelaAcesa), emissiveMap: emissivo });
  const f = { mat };
  cache.set(chave, f);
  return f;
}

const matTopo = new THREE.MeshLambertMaterial({ color: "#d9d4ca" });

type Lote =
  | { tipo: "predio"; x: number; z: number; w: number; d: number; andares: number; cor: string; semente: number; caixa: boolean }
  | { tipo: "casa"; x: number; z: number; w: number; d: number; andares: number; cor: string; semente: number; giro: number }
  | { tipo: "praca"; x: number; z: number; arvores: [number, number, number][] };

function planejar(): Lote[] {
  const r = sorteador(42);
  const lotes: Lote[] = [];
  for (let iz = 0; iz < 15; iz++) {
    for (let ix = -9; ix <= 9; ix++) {
      const x = ix * CELULA + (r() - 0.5) * 2;
      const z = ORLA_Z + 14 + iz * CELULA;
      const perto = iz < 2;
      const cor = mundo.predios[Math.floor(r() * mundo.predios.length)];
      const semente = Math.floor(r() * 1000);
      const sorte = r();
      if (sorte < 0.1) {
        const arvores: [number, number, number][] = Array.from({ length: 3 }, () => [x + (r() - 0.5) * 10, z + (r() - 0.5) * 10, 1.6 + r() * 1.2]);
        lotes.push({ tipo: "praca", x, z, arvores });
      } else if (perto || sorte < 0.45) {
        lotes.push({ tipo: "casa", x, z, w: 8 + Math.round(r() * 2) * 2, d: 8, andares: 1 + Math.round(r()), cor, semente, giro: r() < 0.5 ? 0 : Math.PI / 2 });
      } else {
        const alto = Math.min(12, 3 + Math.floor(r() * (4 + iz * 0.6)));
        lotes.push({ tipo: "predio", x, z, w: 10 + Math.round(r() * 2) * 2, d: 10 + Math.round(r()) * 2, andares: alto, cor, semente, caixa: r() < 0.4 });
      }
    }
  }
  return lotes;
}

const Arvore: React.FC<{ x: number; z: number; tam: number }> = ({ x, z, tam }) => (
  <group position={[x, 0, z]}>
    <mesh position={[0, tam * 0.6, 0]} castShadow>
      <cylinderGeometry args={[0.25 * tam, 0.3 * tam, tam * 1.2, 6]} />
      <meshLambertMaterial color={mundo.tronco} />
    </mesh>
    <mesh position={[0, tam * 1.7, 0]} castShadow>
      <icosahedronGeometry args={[tam, 1]} />
      <meshLambertMaterial color={mundo.arvore} flatShading />
    </mesh>
  </group>
);

export const Cidade: React.FC<{ janelas: number }> = ({ janelas }) => {
  const lotes = useMemo(planejar, []);
  const orla = useMemo(() => {
    const r = sorteador(9);
    // Sem árvores no trecho da orla onde fica o boneco (a câmera passa por ali).
    return Array.from({ length: 22 }, (_, i) => ({ x: -190 + i * 18 + (r() - 0.5) * 4, tam: 1.4 + r() * 0.6 })).filter((a) => Math.abs(a.x - 5) > 30);
  }, []);

  // Uma só intensidade para todas as janelas acesas.
  for (const f of cache.values()) f.mat.emissiveIntensity = 0.15 + 0.95 * janelas;

  return (
    <group>
      {/* Terreno e ruas */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, ORLA_Z + 400]} receiveShadow>
        <planeGeometry args={[1200, 800]} />
        <meshLambertMaterial color={mundo.chao} />
      </mesh>
      {Array.from({ length: 19 }, (_, i) => (
        <mesh key={`rx${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[(i - 9) * CELULA + CELULA / 2, 0.02, ORLA_Z + 150]} receiveShadow>
          <planeGeometry args={[5, 320]} />
          <meshLambertMaterial color={mundo.rua} />
        </mesh>
      ))}
      {Array.from({ length: 15 }, (_, i) => (
        <mesh key={`rz${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, ORLA_Z + 5 + i * CELULA]} receiveShadow>
          <planeGeometry args={[400, 5]} />
          <meshLambertMaterial color={mundo.rua} />
        </mesh>
      ))}
      {/* Calçadão da orla */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, ORLA_Z - 4]} receiveShadow>
        <planeGeometry args={[1200, 8]} />
        <meshLambertMaterial color={mundo.calcada} />
      </mesh>
      {orla.map((a, i) => (
        <Arvore key={`o${i}`} x={a.x} z={ORLA_Z - 1} tam={a.tam} />
      ))}

      {lotes.map((l, i) => {
        if (l.tipo === "praca") {
          return (
            <group key={i}>
              {l.arvores.map(([x, z, t], k) => (
                <Arvore key={k} x={x} z={z} tam={t} />
              ))}
            </group>
          );
        }
        const altura = l.andares * ANDAR + (l.tipo === "casa" ? 0.8 : 0);
        const frente = fachada(l.cor, Math.round(l.w / 3), l.andares, l.semente).mat;
        const lado = fachada(l.cor, Math.round(l.d / 3), l.andares, l.semente + 1).mat;
        const mats = [lado, lado, matTopo, matTopo, frente, frente];
        return (
          <group key={i} position={[l.x, 0, l.z]} rotation={[0, l.tipo === "casa" ? l.giro : 0, 0]}>
            <mesh position={[0, altura / 2, 0]} material={mats} castShadow receiveShadow>
              <boxGeometry args={[l.w, altura, l.d]} />
            </mesh>
            {l.tipo === "casa" ? (
              <mesh position={[0, altura + 1.9, 0]} rotation={[0, Math.PI / 4, 0]} scale={[l.w * 0.75, 1, l.d * 0.75]} castShadow>
                <coneGeometry args={[1, 3.8, 4]} />
                <meshLambertMaterial color={mundo.telhado} flatShading />
              </mesh>
            ) : l.caixa ? (
              <mesh position={[l.w * 0.2, altura + 1, -l.d * 0.2]} castShadow>
                <cylinderGeometry args={[1.1, 1.1, 2, 10]} />
                <meshLambertMaterial color="#4f86c9" />
              </mesh>
            ) : null}
          </group>
        );
      })}
    </group>
  );
};
