import { useMemo } from "react";
import * as THREE from "three";
import { Pilula, TextoPreso } from "../camadas/rotulos";
import { corToken } from "../mundo/materiais";
import { DiscoSol } from "../mundo/Sol";
import { TERRA_POS, TERRA_RAIO } from "../mundo/Terra";
import { ambienteDia, caminhoDaLuz, CronometroSol } from "./sol";
import type { Cena, Vec3 } from "./tipos";
import { janela, lerp3, somar } from "./util";

// Sol · Q2 · A luz a caminho (espaço). O Sol, já apagado, no alto à esquerda; a Terra embaixo à direita, na
// órbita de sempre (sem o Sol aceso a massa continua lá: a Terra não sai da órbita). Entre os dois, a última luz
// que o Sol soltou ainda viaja até a Terra: a ponta de trás da faixa anda do Sol até a Terra no ritmo do
// cronômetro (chega em "apaga", no Q3). Tamanhos e distância fora de escala.
const SOL: Vec3 = somar(TERRA_POS, [-79, 126, 0]);
const RAIO_SOL = 48;
const ALVO: Vec3 = somar(TERRA_POS, [-32.3, 7.2, 0]);
const CAMERA: Vec3 = somar(ALVO, [0, 0, 370]);

const v = (a: Vec3) => new THREE.Vector3(...a);
const DIR = v(TERRA_POS).sub(v(SOL)).normalize();
/** Começo (borda do Sol) e fim (borda da atmosfera) do caminho da luz. */
const INICIO = v(SOL).addScaledVector(DIR, RAIO_SOL);
const FIM = v(TERRA_POS).addScaledVector(DIR, -TERRA_RAIO * 1.06);
const ponto = (f: number): Vec3 => INICIO.clone().lerp(FIM, f).toArray() as Vec3;

/** Órbita da Terra em volta do Sol (elipse tracejada que passa pela Terra), vista inclinada. */
function orbita() {
  const u = v(TERRA_POS).sub(v(SOL));
  const lado = new THREE.Vector3(-u.y, u.x, 0).normalize();
  const w = lado.multiplyScalar(0.42).add(new THREE.Vector3(0, 0, 0.9)).normalize().multiplyScalar(u.length());
  const pts = Array.from({ length: 257 }, (_, i) => {
    const a = (i / 256) * Math.PI * 2;
    return u.clone().multiplyScalar(Math.cos(a)).add(w.clone().multiplyScalar(Math.sin(a))).add(v(SOL));
  });
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: "#ffffff", dashSize: 5, gapSize: 5, transparent: true, opacity: 0.5, fog: false }));
  l.computeLineDistances();
  return l;
}

let linhaOrbita: THREE.Line | null = null;
const pegarOrbita = () => (linhaOrbita ??= orbita());

const RAIO_FAIXA = 5;

/** A faixa de luz: cilindro emissivo (o Bloom pega) da ponta de trás `f` até a Terra. */
const Faixa: React.FC<{ f: number; opacidade: number }> = ({ f, opacidade }) => {
  const material = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, fog: false, toneMapped: false }), []);
  const cauda = v(ponto(f));
  const comp = cauda.distanceTo(FIM);
  if (comp < 0.5 || opacidade < 0.01) return null;
  material.color.copy(corToken("mundo/janela/acesa")).multiplyScalar(2.2);
  material.opacity = opacidade;
  const meio = cauda.clone().lerp(FIM, 0.5);
  const giro = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), DIR);
  return (
    <mesh position={meio} quaternion={giro} material={material}>
      <cylinderGeometry args={[RAIO_FAIXA, RAIO_FAIXA, comp, 24, 1]} />
    </mesh>
  );
};

export const solLuz: Cena = {
  camera: ({ p }) => {
    // Deriva: recua devagar (3%).
    const pos = lerp3(CAMERA, somar(CAMERA, [0, 0, 14]), p);
    return { pos, alvo: ALVO, fov: 50 };
  },
  ambiente: () => ({ ...ambienteDia, lua: 0, sol: 0, estrelas: 1, espaco: 1, terra: 1, eixo: 0 }),
  boneco: () => null,
  Objetos: ({ tempo, peso }) => {
    return (
      <group>
        <DiscoSol position={SOL} diametro={RAIO_SOL * 2} brilho={0} opacidade={peso > 0.02 ? 1 : 0} />
        <primitive object={pegarOrbita()} />
        <Faixa f={caminhoDaLuz(tempo)} opacidade={Math.min(1, peso * 2)} />
      </group>
    );
  },
  Rotulos: (props) => {
    const { seg, aos, projetar, tempo } = props;
    const f = caminhoDaLuz(tempo);
    const luz = projetar(ponto(f + (1 - f) * 0.45));
    const meio = projetar(ponto(0.5));
    const sol = projetar(somar(SOL, [8, -RAIO_SOL * 0.72, 0]));
    return (
      <>
        <TextoPreso texto="Luz" guia x={luz.x} y={luz.y} seg={seg} janela={janela(props, Math.max(aos("luz"), 0.8))} />
        <TextoPreso texto="8 minutos" x={meio.x - 150} y={meio.y + 170} seg={seg} janela={janela(props, aos("oito"), aos("veria"))} />
        <Pilula texto="Sol apagado" cor="vermelho" x={sol.x} y={sol.y} seg={seg} janela={janela(props, aos("apagou"))} />
        <CronometroSol {...props} />
      </>
    );
  },
};
