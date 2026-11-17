import { useThree } from "@react-three/fiber";
import {
  Bloom,
  EffectComposer,
  N8AO,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { ThreeCanvas } from "@remotion/three";
import { ToneMappingMode } from "postprocessing";
import { useMemo } from "react";
import * as THREE from "three";
import type { Pose, PoseBoneco } from "../cenas/tipos";
import { type Ambiente, modoDe } from "./ambiente";
import { Boneco } from "./Boneco";
import { Ceu } from "./Ceu";
import { Cidade } from "./Cidade";
import { LuaNoCeu } from "./Lua";
import { aplicarModo, aplicarTexturas, corToken } from "./materiais";
import { Morro } from "./Morro";
import { Nuvens } from "./Nuvens";
import { Praia } from "./Praia";
import { Terra } from "./Terra";
import type { Texturas } from "./texturas";

/** Direção da luz principal (Sol de dia, Lua à noite), de cima, à esquerda e da frente. */
const DIRECAO = new THREE.Vector3(-0.45, 0.8, 0.55).normalize();
const QUENTE = new THREE.Color("#ffe9c9");
const FRIA = new THREE.Color("#bcd0ff");

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

/** HDRI do Poly Haven como luz ambiente e reflexo (céu noturno ou céu limpo de dia). */
const Iluminacao: React.FC<{ tex: Texturas; dia: number; espaco: number }> = ({
  tex,
  dia,
  espaco,
}) => {
  const { gl, scene } = useThree();
  const envs = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    tex.hdriNoite.mapping = THREE.EquirectangularReflectionMapping;
    tex.hdriDia.mapping = THREE.EquirectangularReflectionMapping;
    const r = {
      noite: pmrem.fromEquirectangular(tex.hdriNoite).texture,
      dia: pmrem.fromEquirectangular(tex.hdriDia).texture,
    };
    pmrem.dispose();
    return r;
  }, [gl, tex]);
  scene.environment = dia > 0.5 ? envs.dia : envs.noite;
  // O HDRI noturno é muito escuro: compensa para a tela não ficar preta no celular.
  scene.environmentIntensity = (dia > 0.5 ? 0.9 : 6) * (1 - 0.7 * espaco);
  return null;
};

/** Luz direcional com sombra suave (PCF), focada no pedaço de chão que a câmera vê. */
const LuzPrincipal: React.FC<{
  pose: Pose;
  dia: number;
  espaco: number;
  sombra: number;
}> = ({ pose, dia, espaco, sombra }) => {
  const luz = useMemo(() => {
    const l = new THREE.DirectionalLight("#ffffff", 1);
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
    l.shadow.normalBias = 0.02;
    l.shadow.radius = 6;
    return l;
  }, []);
  const dir = new THREE.Vector3(...pose.alvo)
    .sub(new THREE.Vector3(...pose.pos))
    .setY(0);
  if (dir.lengthSq() < 1e-6) dir.set(0, 0, -1);
  dir.normalize();
  const foco = new THREE.Vector3(...pose.pos).addScaledVector(dir, 14);
  foco.y = Math.min(foco.y, pose.pos[1]) - 1.5;
  luz.target.position.copy(foco);
  luz.position.copy(foco).addScaledVector(DIRECAO, 200);
  // Quente de dia (Sol), fria à noite (Lua); no espaço, Sol branco forte.
  luz.color
    .copy(FRIA)
    .lerp(QUENTE, dia)
    .lerp(new THREE.Color("#ffffff"), espaco);
  luz.intensity = THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(1.1, 2.6, dia),
    3.2,
    espaco,
  );
  luz.shadow.intensity = sombra;
  return (
    <>
      <primitive object={luz} />
      <primitive object={luz.target} />
    </>
  );
};

type Props = {
  /** Texturas já carregadas: o canvas só monta com elas prontas (no render, ele só redesenha quando o quadro muda). */
  tex: Texturas;
  pose: Pose;
  amb: Ambiente;
  tempo: number;
  boneco: PoseBoneco | null;
  children?: React.ReactNode;
  width: number;
  height: number;
};

export const Mundo: React.FC<Props> = ({
  tex,
  pose,
  amb,
  tempo,
  boneco,
  children,
  width,
  height,
}) => {
  const modo = modoDe(amb);
  aplicarModo(modo);
  aplicarTexturas(tex);
  const corNevoa = new THREE.Color()
    .copy(corToken("mundo/nevoa"))
    .lerp(corToken("mundo/espaco/fundo"), amb.espaco);
  const naTerra = amb.espaco < 0.999;
  return (
    <ThreeCanvas
      width={width}
      height={height}
      shadows
      flat
      gl={{ antialias: false, powerPreference: "high-performance" }}
      camera={{ fov: 50, near: 0.3, far: 6000 }}
    >
      <Camera pose={pose} />
      <>
        <Iluminacao tex={tex} dia={modo.dia} espaco={amb.espaco} />
        <fog
          attach="fog"
          args={[corNevoa, 200, 1600]}
          color={corNevoa}
          near={200 - 140 * amb.espaco}
          far={1700 - 1300 * amb.espaco}
        />
        <hemisphereLight
          args={["#dfe8ff", "#6b6256", 0.35 + 0.25 * modo.dia]}
        />
        <LuzPrincipal
          pose={pose}
          dia={modo.dia}
          espaco={amb.espaco}
          sombra={0.3 * modo.dia + 0.45 * (1 - modo.dia)}
        />
        <Ceu
          centro={pose.pos}
          estrelas={amb.estrelas}
          espaco={amb.espaco}
          viaLactea={Math.max(modo.breu * 0.9, amb.espaco * 0.55)}
        />
        {naTerra ? (
          <>
            <LuaNoCeu visivel={amb.lua * (1 - amb.espaco)} textura={tex.lua} />
            <Nuvens tempo={tempo} />
            <Cidade domo={modo.breu} />
            <Morro />
            <Praia
              tempo={tempo}
              centro={amb.mareCentro}
              amp={amb.mareAmp}
              regua={1}
              normaisAgua={tex.agua}
            />
            {boneco ? <Boneco {...boneco} tempo={tempo} /> : null}
          </>
        ) : null}
        <Terra
          tempo={tempo}
          balanco={amb.balanco}
          luaEspaco={amb.luaEspaco}
          visivel={amb.terra}
          terra={tex.terra}
          lua={tex.lua}
        />
        {children}
        {/* Pós-processamento: AO para profundidade, bloom leve (Lua e janelas), vinheta e ACES. */}
        <EffectComposer multisampling={4}>
          <N8AO halfRes aoRadius={2.5} distanceFalloff={1} intensity={2.2} />
          <Bloom
            mipmapBlur
            luminanceThreshold={0.82}
            luminanceSmoothing={0.15}
            intensity={0.75}
          />
          <Vignette offset={0.32} darkness={0.42} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </>
    </ThreeCanvas>
  );
};
