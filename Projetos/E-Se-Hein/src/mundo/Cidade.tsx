import { useMemo } from "react";
import * as THREE from "three";
import { sorteador } from "./aleatorio";
import { corToken, mat } from "./materiais";
import { Plano } from "./Plano";
import type { TokenMundo } from "./paleta";

// Cidade de brinquedo à beira-mar. O mar fica para o lado -z; a cidade cresce para +z.
export const ORLA_Z = -30;
const CELULA = 18;
const ANDAR = 3;

/** Prédio alto com laje onde o "você" fica no Q1 e no Q7. */
// 9 andares: mais alta que qualquer prédio entre ela e o mar (no máximo 7), para a Lua aparecer inteira no Q1.
export const LAJE = { x: 0, z: ORLA_Z + 14 + 4 * CELULA, lado: 14, andares: 9 };
export const ALTURA_LAJE = LAJE.andares * ANDAR;
export const BONECO_LAJE: [number, number, number] = [LAJE.x, ALTURA_LAJE, LAJE.z - 3.5];
/** Centro da cidade, para o domo de luz e o rótulo "CIDADE". */
export const CENTRO_CIDADE: [number, number, number] = [0, 30, 90];

const PREDIOS: TokenMundo[] = ["mundo/predio/1", "mundo/predio/2", "mundo/predio/3", "mundo/predio/4", "mundo/predio/5", "mundo/predio/6"];

// Fachada: a textura é uma máscara (R = parede, G = vidro apagado, B = janela acesa).
// O shader pinta com as cores do modo atual; a janela acesa é emissiva e não muda com a luz.
const cacheFachada = new Map<string, THREE.MeshStandardMaterial>();
/** Geada no vidro apagado (0 a 1), igual para todas as fachadas; cor do token `mundo/terra/gelo`. */
const uGeada = { value: 0 };

function fachada(predio: number, colunas: number, andares: number, semente: number) {
  const chave = `${predio}-${colunas}-${andares}-${semente % 4}`;
  const existente = cacheFachada.get(chave);
  if (existente) return existente;
  const px = 32;
  const base = document.createElement("canvas");
  base.width = colunas * px;
  base.height = andares * px;
  const acesas = document.createElement("canvas");
  acesas.width = base.width;
  acesas.height = base.height;
  const g = base.getContext("2d")!;
  const a = acesas.getContext("2d")!;
  g.fillStyle = "#ff0000";
  g.fillRect(0, 0, base.width, base.height);
  a.fillStyle = "#000";
  a.fillRect(0, 0, acesas.width, acesas.height);
  const r = sorteador(semente);
  for (let y = 0; y < andares; y++) {
    for (let c = 0; c < colunas; c++) {
      const acesa = r() < 0.5;
      g.fillStyle = acesa ? "#000000" : "#00ff00";
      g.fillRect(c * px + 8, y * px + 7, 16, 18);
      if (acesa) {
        a.fillStyle = "#fff";
        a.fillRect(c * px + 8, y * px + 7, 16, 18);
      }
    }
  }
  const mascara = new THREE.CanvasTexture(base);
  mascara.colorSpace = THREE.NoColorSpace;
  mascara.magFilter = THREE.NearestFilter;
  const brilho = new THREE.CanvasTexture(acesas);
  brilho.magFilter = THREE.NearestFilter;
  const m = new THREE.MeshStandardMaterial({ map: mascara, emissiveMap: brilho, emissive: corToken("mundo/janela/acesa"), emissiveIntensity: 1.6, roughness: 0.8, metalness: 0 });
  const parede = corToken(PREDIOS[predio]);
  const vidro = corToken("mundo/janela/apagada");
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uParede = { value: parede };
    shader.uniforms.uVidro = { value: vidro };
    shader.uniforms.uGeada = uGeada;
    shader.uniforms.uGelo = { value: corToken("mundo/terra/gelo") };
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uParede;\nuniform vec3 uVidro;\nuniform float uGeada;\nuniform vec3 uGelo;")
      .replace(
        "#include <map_fragment>",
        "#ifdef USE_MAP\n vec4 mascara = texture2D( map, vMapUv );\n diffuseColor.rgb = mascara.r * uParede + mascara.g * mix(uVidro, uGelo, uGeada);\n#endif",
      );
  };
  m.customProgramCacheKey = () => "fachada";
  cacheFachada.set(chave, m);
  return m;
}

type Lote =
  | { tipo: "predio"; x: number; z: number; w: number; d: number; andares: number; cor: number; semente: number; caixa: boolean }
  | { tipo: "casa"; x: number; z: number; w: number; d: number; andares: number; cor: number; semente: number; giro: number }
  | { tipo: "praca"; x: number; z: number; arvores: [number, number, number][] };

function planejar(): Lote[] {
  const r = sorteador(42);
  const lotes: Lote[] = [];
  for (let iz = 0; iz < 14; iz++) {
    for (let ix = -9; ix <= 9; ix++) {
      const x = ix * CELULA + (r() - 0.5) * 2;
      const z = ORLA_Z + 14 + iz * CELULA;
      const cor = Math.floor(r() * PREDIOS.length);
      const semente = Math.floor(r() * 1000);
      const sorte = r();
      if (ix === 0 && iz === 4) continue; // a laje
      if (sorte < 0.1) {
        lotes.push({ tipo: "praca", x, z, arvores: Array.from({ length: 3 }, () => [x + (r() - 0.5) * 10, z + (r() - 0.5) * 10, 1.6 + r() * 1.2]) });
      } else if (iz < 2 || sorte < 0.45) {
        lotes.push({ tipo: "casa", x, z, w: 8 + Math.round(r() * 2) * 2, d: 8, andares: 1 + Math.round(r()), cor, semente, giro: r() < 0.5 ? 0 : Math.PI / 2 });
      } else {
        const alto = Math.min(9, 3 + Math.floor(r() * (3 + iz * 0.4)));
        lotes.push({ tipo: "predio", x, z, w: 10 + Math.round(r() * 2) * 2, d: 10 + Math.round(r()) * 2, andares: alto, cor, semente, caixa: r() < 0.4 });
      }
    }
  }
  return lotes;
}

export const Arvore: React.FC<{ x: number; y?: number; z: number; tam: number }> = ({ x, y = 0, z, tam }) => (
  <group position={[x, y, z]}>
    <mesh position={[0, tam * 0.6, 0]} material={mat("mundo/arvore/tronco")} castShadow>
      <cylinderGeometry args={[0.25 * tam, 0.3 * tam, tam * 1.2, 6]} />
    </mesh>
    <mesh position={[0, tam * 1.7, 0]} material={mat("mundo/arvore/copa")} castShadow>
      <icosahedronGeometry args={[tam, 1]} />
    </mesh>
  </group>
);

const Predio: React.FC<{ x: number; z: number; w: number; d: number; andares: number; cor: number; semente: number; giro?: number; telhado?: boolean; caixa?: boolean }> = ({
  x,
  z,
  w,
  d,
  andares,
  cor,
  semente,
  giro = 0,
  telhado,
  caixa,
}) => {
  const altura = andares * ANDAR + (telhado ? 0.8 : 0);
  const frente = fachada(cor, Math.max(1, Math.round(w / 3)), andares, semente);
  const lado = fachada(cor, Math.max(1, Math.round(d / 3)), andares, semente + 1);
  const topo = mat("mundo/chao/calcada");
  return (
    <group position={[x, 0, z]} rotation={[0, giro, 0]}>
      <mesh position={[0, altura / 2, 0]} material={[lado, lado, topo, topo, frente, frente]} castShadow receiveShadow>
        <boxGeometry args={[w, altura, d]} />
      </mesh>
      {telhado ? (
        <mesh position={[0, altura + 1.9, 0]} rotation={[0, Math.PI / 4, 0]} scale={[w * 0.75, 1, d * 0.75]} material={mat("mundo/telhado/base")} castShadow>
          <coneGeometry args={[1, 3.8, 4]} />
        </mesh>
      ) : caixa ? (
        <mesh position={[w * 0.2, altura + 1, -d * 0.2]} material={mat("mundo/predio/5")} castShadow>
          <cylinderGeometry args={[1.1, 1.1, 2, 10]} />
        </mesh>
      ) : null}
    </group>
  );
};

/** Laje: prédio alto com mureta baixa no topo. */
const Laje: React.FC = () => {
  const { x, z, lado, andares } = LAJE;
  const h = andares * ANDAR;
  const mureta = mat("mundo/chao/calcada");
  return (
    <group>
      <Predio x={x} z={z} w={lado} d={lado} andares={andares} cor={3} semente={5} />
      {[
        [0, -lado / 2, lado, 0.3],
        [0, lado / 2, lado, 0.3],
        [-lado / 2, 0, 0.3, lado],
        [lado / 2, 0, 0.3, lado],
      ].map(([dx, dz, w, d], i) => (
        <mesh key={i} position={[x + dx, h + 0.45, z + dz]} material={mureta} castShadow receiveShadow>
          <boxGeometry args={[w, 0.9, d]} />
        </mesh>
      ))}
      <mesh position={[x + 4, h + 1.2, z + 4]} material={mat("mundo/predio/5")} castShadow>
        <cylinderGeometry args={[1.3, 1.3, 2.4, 10]} />
      </mesh>
    </group>
  );
};

function texturaDomo() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, "rgba(255,255,255,0.85)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.35)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 128);
  return new THREE.CanvasTexture(c);
}

export const Cidade: React.FC<{ domo: number; geada?: number }> = ({ domo, geada = 0 }) => {
  uGeada.value = geada;
  const lotes = useMemo(planejar, []);
  const texDomo = useMemo(texturaDomo, []);
  const orla = useMemo(() => {
    const r = sorteador(9);
    return Array.from({ length: 22 }, (_, i) => ({ x: -190 + i * 18 + (r() - 0.5) * 4, tam: 1.4 + r() * 0.6 }));
  }, []);
  const rua = mat("mundo/chao/rua");
  return (
    <group>
      {/* Terreno, ruas e calçadão */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, ORLA_Z + 600]} material={mat("mundo/chao/grama")} receiveShadow>
        <Plano w={3000} h={1200} metros={14} />
      </mesh>
      {Array.from({ length: 19 }, (_, i) => (
        <mesh key={`rx${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[(i - 9) * CELULA + CELULA / 2, 0.02, ORLA_Z + 130]} material={rua} receiveShadow>
          <Plano w={5} h={270} metros={5} />
        </mesh>
      ))}
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={`rz${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, ORLA_Z + 5 + i * CELULA]} material={rua} receiveShadow>
          <Plano w={340} h={5} metros={5} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, ORLA_Z - 4]} material={mat("mundo/chao/calcada")} receiveShadow>
        <Plano w={3000} h={8} metros={4} />
      </mesh>
      {orla.map((a, i) => (
        <Arvore key={`o${i}`} x={a.x} z={ORLA_Z - 1} tam={a.tam} />
      ))}
      {lotes.map((l, i) =>
        l.tipo === "praca" ? (
          <group key={i}>
            {l.arvores.map(([x, z, t], k) => (
              <Arvore key={k} x={x} z={z} tam={t} />
            ))}
          </group>
        ) : l.tipo === "casa" ? (
          <Predio key={i} {...l} telhado />
        ) : (
          <Predio key={i} {...l} />
        ),
      )}
      <Laje />
      {domo > 0.01 ? (
        <sprite position={[CENTRO_CIDADE[0], 40, CENTRO_CIDADE[2]]} scale={[620, 260, 1]}>
          <spriteMaterial map={texDomo} color={corToken("mundo/ceu/brilho-cidade")} transparent opacity={0.8 * domo} depthWrite={false} fog={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ) : null}
    </group>
  );
};
