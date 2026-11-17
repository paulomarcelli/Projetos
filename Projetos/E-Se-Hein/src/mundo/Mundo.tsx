import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import * as THREE from "three";
import type { Pose, PoseBoneco } from "../cenas/tipos";
import { type Ambiente, modoDe } from "./ambiente";
import { Boneco } from "./Boneco";
import { Ceu } from "./Ceu";
import { Cidade } from "./Cidade";
import { LuaNoCeu } from "./Lua";
import { aplicarModo, corToken } from "./materiais";
import { Morro } from "./Morro";
import { Nuvens } from "./Nuvens";
import { Praia } from "./Praia";
import { Terra } from "./Terra";

/** Luz fixa e neutra, só para dar volume (Design System, regra 2: a cor vem do modo, não da luz). */
const LUZ = { ceu: 1.15, sol: 1.25, direcao: new THREE.Vector3(-0.45, 0.8, 0.55).normalize() };

/** Coloca a câmera na pose do quadro. Roda no render, antes do Remotion pedir o desenho. */
const Camera: React.FC<{ pose: Pose }> = ({ pose }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  camera.position.set(...pose.pos);
  camera.fov = pose.fov;
  camera.near = 0.3;
  camera.far = 6000;
  camera.updateProjectionMatrix();
  camera.lookAt(...pose.alvo);
  return null;
};

/** Luz direcional com sombra suave, focada no pedaço de chão que a câmera vê. */
const Sol: React.FC<{ pose: Pose; sombra: number }> = ({ pose, sombra }) => {
  const luz = useMemo(() => {
    const l = new THREE.DirectionalLight("#ffffff", LUZ.sol);
    l.castShadow = true;
    l.shadow.mapSize.set(2048, 2048);
    const c = l.shadow.camera;
    c.left = -45;
    c.right = 45;
    c.top = 45;
    c.bottom = -45;
    c.near = 1;
    c.far = 500;
    l.shadow.bias = -0.0006;
    l.shadow.radius = 5;
    return l;
  }, []);
  const dir = new THREE.Vector3(...pose.alvo).sub(new THREE.Vector3(...pose.pos)).setY(0);
  if (dir.lengthSq() < 1e-6) dir.set(0, 0, -1);
  dir.normalize();
  const foco = new THREE.Vector3(...pose.pos).addScaledVector(dir, 14);
  foco.y = Math.min(foco.y, pose.pos[1]) - 1.5;
  luz.target.position.copy(foco);
  luz.position.copy(foco).addScaledVector(LUZ.direcao, 200);
  luz.shadow.intensity = sombra;
  return (
    <>
      <primitive object={luz} />
      <primitive object={luz.target} />
    </>
  );
};

type Props = {
  pose: Pose;
  amb: Ambiente;
  tempo: number;
  boneco: PoseBoneco | null;
  children?: React.ReactNode;
  width: number;
  height: number;
};

export const Mundo: React.FC<Props> = ({ pose, amb, tempo, boneco, children, width, height }) => {
  const modo = modoDe(amb);
  aplicarModo(modo);
  const corNevoa = new THREE.Color().copy(corToken("mundo/nevoa")).lerp(corToken("mundo/espaco/fundo"), amb.espaco);
  const naTerra = amb.espaco < 0.999;
  return (
    <ThreeCanvas width={width} height={height} shadows flat gl={{ antialias: true }} camera={{ fov: 50, near: 0.3, far: 6000 }}>
      <Camera pose={pose} />
      <fog attach="fog" args={[corNevoa, 200, 1600]} color={corNevoa} near={200 - 140 * amb.espaco} far={1700 - 1300 * amb.espaco} />
      <hemisphereLight args={["#ffffff", "#9a9a9a", LUZ.ceu]} />
      <Sol pose={pose} sombra={0.25 * modo.dia + 0.4 * (1 - modo.dia)} />
      <Ceu centro={pose.pos} estrelas={amb.estrelas} espaco={amb.espaco} />
      {naTerra ? (
        <>
          <LuaNoCeu visivel={amb.lua * (1 - amb.espaco)} />
          <Nuvens tempo={tempo} />
          <Cidade domo={modo.breu} />
          <Morro />
          <Praia tempo={tempo} centro={amb.mareCentro} amp={amb.mareAmp} regua={1} />
          {boneco ? <Boneco {...boneco} tempo={tempo} /> : null}
        </>
      ) : null}
      <Terra tempo={tempo} balanco={amb.balanco} luaEspaco={amb.luaEspaco} visivel={amb.terra} />
      {children}
    </ThreeCanvas>
  );
};
