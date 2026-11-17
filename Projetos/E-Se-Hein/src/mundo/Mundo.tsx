import { useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ThreeCanvas } from "@remotion/three";
import { ToneMappingMode } from "postprocessing";
import { useEffect, useMemo } from "react";
import { continueRender, delayRender, useCurrentFrame } from "remotion";
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
import { type Texturas, useTexturas } from "./texturas";

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

/**
 * Céu real (HDRI do Poly Haven) só para os reflexos: a água e a areia molhada refletem o céu do modo
 * (Dia ou Noite). A cor dos objetos continua vindo dos tokens; o HDRI não ilumina a cena.
 */
function reflexos(tex: Texturas, dia: number) {
  const hdri = dia >= 0.5 ? tex.hdriDia : tex.hdriNoite;
  hdri.mapping = THREE.EquirectangularReflectionMapping;
  return { hdri, intensidade: dia >= 0.5 ? 0.9 : 2.2 };
}

/**
 * Pós-processamento (versão 2, "mais realista"): brilho nas luzes fortes (Lua, janelas, estrelas), tone
 * mapping neutro (o ACES lavava as cores do Design System: o céu azul virava cinza) e vinheta leve. Nada aqui depende de tempo real nem de
 * sorteio: o mesmo quadro sai sempre igual.
 */
/**
 * Qualidade máxima com placa de vídeo: `REMOTION_GPU=1` liga a oclusão de ambiente (N8AO) e o MSAA 4×.
 * Sem GPU (render na nuvem, WebGL por software) os dois custam ~3 s por quadro e quase triplicam o tempo
 * do vídeo; aí ficam o SMAA e as sombras.
 */
const GPU = process.env.REMOTION_GPU === "1";

const Efeitos: React.FC<{ espaco: number }> = ({ espaco }) => (
  <EffectComposer multisampling={GPU ? 4 : 0}>
    {GPU ? <N8AO aoRadius={3} distanceFalloff={1.2} intensity={espaco > 0.5 ? 0 : 2.2} quality="high" /> : <></>}
    <Bloom mipmapBlur luminanceThreshold={0.82} luminanceSmoothing={0.15} intensity={0.7} radius={0.7} />
    <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    <Vignette offset={0.32} darkness={0.42} />
    {GPU ? <></> : <SMAA />}
  </EffectComposer>
);

/**
 * O Remotion pede o desenho do canvas quando ele nasce e a cada quadro novo, mas o EffectComposer só fica
 * pronto um pouco depois (ele monta no reconciliador do R3F). Sem isto, o quadro sai vazio. Aqui o quadro é
 * desenhado de novo depois que tudo montou, e o render espera esse desenho.
 */
const Redesenhar: React.FC = () => {
  const advance = useThree((s) => s.advance);
  const frame = useCurrentFrame();
  useEffect(() => {
    const h = delayRender(`Desenhando o quadro ${frame} com o pós-processamento`);
    const id = requestAnimationFrame(() => {
      advance(performance.now());
      continueRender(h);
    });
    return () => {
      cancelAnimationFrame(id);
      continueRender(h);
    };
  }, [frame, advance]);
  return null;
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
  const tex = useTexturas();
  const modo = modoDe(amb);
  aplicarModo(modo);
  if (tex) aplicarTexturas(tex);
  const corNevoa = new THREE.Color().copy(corToken("mundo/nevoa")).lerp(corToken("mundo/espaco/fundo"), amb.espaco);
  const naTerra = amb.espaco < 0.999;
  // O canvas só nasce com as texturas prontas: o Remotion desenha o quadro quando o canvas é criado e a cada
  // quadro novo. Se as texturas chegassem depois, a cena completa nunca seria desenhada (o render espera
  // pelo delayRender de useTexturas).
  if (!tex) return null;
  return (
    <ThreeCanvas width={width} height={height} shadows flat gl={{ antialias: false }} camera={{ fov: 50, near: 0.3, far: 6000 }}>
      <Camera pose={pose} />
      <fog attach="fog" args={[corNevoa, 200, 1600]} color={corNevoa} near={200 - 140 * amb.espaco} far={1700 - 1300 * amb.espaco} />
      <hemisphereLight args={["#ffffff", "#9a9a9a", LUZ.ceu]} />
      <Sol pose={pose} sombra={0.25 * modo.dia + 0.4 * (1 - modo.dia)} />
      <Ceu centro={pose.pos} estrelas={amb.estrelas} espaco={amb.espaco} />
      {naTerra ? (
        <>
          <LuaNoCeu visivel={amb.lua * (1 - amb.espaco)} mapa={tex.lua} />
          <Nuvens tempo={tempo} />
          <Cidade domo={modo.breu} />
          <Morro />
          <Praia tempo={tempo} centro={amb.mareCentro} amp={amb.mareAmp} regua={1} normaisAgua={tex.agua} reflexo={reflexos(tex, modo.dia)} />
          {boneco ? <Boneco {...boneco} tempo={tempo} /> : null}
        </>
      ) : null}
      <Terra tempo={tempo} balanco={amb.balanco} luaEspaco={amb.luaEspaco} visivel={amb.terra} mapaTerra={tex.terra} mapaLua={tex.lua} />
      {children}
      <Efeitos espaco={amb.espaco} />
      <Redesenhar />
    </ThreeCanvas>
  );
};
