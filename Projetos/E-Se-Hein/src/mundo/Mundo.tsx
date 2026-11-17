import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import * as THREE from "three";
import type { PoseBoneco, Pose } from "../cenas/tipos";
import type { Ambiente } from "./ambiente";
import { Boneco } from "./Boneco";
import { Ceu } from "./Ceu";
import { Cidade } from "./Cidade";
import { LuaNoCeu, POSICAO_LUA } from "./Lua";
import { mundo } from "./paleta";
import { Praia } from "./Praia";
import { Terra } from "./Terra";

/** Coloca a câmera na pose do quadro. Roda no render, antes do Remotion pedir o desenho. */
const Camera: React.FC<{ pose: Pose }> = ({ pose }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  camera.position.set(...pose.pos);
  camera.fov = pose.fov;
  camera.near = 0.5;
  camera.far = 5000;
  camera.updateProjectionMatrix();
  camera.lookAt(...pose.alvo);
  return null;
};

/** Luz da Lua com sombra suave, apontada para o pedaço de chão que a câmera vê. */
const LuzDaLua: React.FC<{ pose: Pose; intensidade: number }> = ({ pose, intensidade }) => {
  const luz = useMemo(() => {
    const l = new THREE.DirectionalLight("#dfe8ff", 1);
    l.castShadow = true;
    l.shadow.mapSize.set(2048, 2048);
    const c = l.shadow.camera;
    c.left = -50;
    c.right = 50;
    c.top = 50;
    c.bottom = -50;
    c.near = 1;
    c.far = 600;
    l.shadow.bias = -0.0008;
    l.shadow.radius = 4;
    return l;
  }, []);
  const dir = new THREE.Vector3(...pose.alvo).sub(new THREE.Vector3(...pose.pos)).setY(0).normalize();
  const foco = new THREE.Vector3(...pose.pos).addScaledVector(dir, 22).setY(0);
  const paraLua = new THREE.Vector3(...POSICAO_LUA).normalize();
  luz.target.position.copy(foco);
  luz.position.copy(foco).addScaledVector(paraLua, 250);
  luz.intensity = intensidade;
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
  /** 0 a 1: a Lua nascendo na abertura. */
  nascer: number;
  children?: React.ReactNode;
  width: number;
  height: number;
};

export const Mundo: React.FC<Props> = ({ pose, amb, tempo, boneco, nascer, children, width, height }) => {
  const corNevoa = new THREE.Color(mundo.nevoa).lerp(new THREE.Color(mundo.ceuHorizonteBreu), amb.breu);
  return (
    <ThreeCanvas width={width} height={height} shadows flat gl={{ antialias: true }} camera={{ fov: 52, near: 0.5, far: 5000 }}>
      <Camera pose={pose} />
      <color attach="background" args={[mundo.ceuTopoNoite]} />
      <fog attach="fog" args={[corNevoa, 160, 1500]} color={corNevoa} />
      <hemisphereLight args={["#b4c8ff", "#5a5670", 1]} intensity={2.1 - 0.8 * amb.breu} />
      <ambientLight intensity={0.7} color="#c8d2ff" />
      <LuzDaLua pose={pose} intensidade={0.35 + 1.5 * amb.luar} />
      <Ceu centro={pose.pos} breu={amb.breu} estrelas={amb.estrelas} />
      <LuaNoCeu visivel={amb.lua * nascer} subir={nascer} />
      <Cidade janelas={amb.janelas} />
      <Praia tempo={tempo} mare={amb.mare} luar={amb.luar * amb.lua * nascer} reguaVisivel={1} />
      <Terra tempo={tempo} balanco={amb.balanco} luaOrbita={amb.luaOrbita} visivel={amb.terra} />
      {boneco ? <Boneco {...boneco} /> : null}
      {children}
    </ThreeCanvas>
  );
};
