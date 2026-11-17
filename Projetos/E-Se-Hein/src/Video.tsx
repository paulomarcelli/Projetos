import { Audio } from "@remotion/media";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { Contexto } from "./camadas/Contexto";
import { Fechamento } from "./camadas/Fechamento";
import { Legenda } from "./camadas/Legenda";
import { MarcaDagua } from "./camadas/MarcaDagua";
import { buscarCena } from "./cenas";
import type { Pose, PoseBoneco, Projetar, PropsCena } from "./cenas/tipos";
import { entra, lerp, lerp3 } from "./cenas/util";
import "./fontes";
import { criarAos, limitesDasCenas, misturaDeCenas } from "./lib/tempo";
import { misturarAmbiente } from "./mundo/ambiente";
import { Mundo } from "./mundo/Mundo";
import type { DadosVideo } from "./tipos";

/** Segundos de abertura (a Lua aparecendo) antes da voz. */
export const ABERTURA = 1;
/** Segundos de fechamento (logo e pergunta) depois da voz. */
export const FECHAMENTO = 4;
/** Duração da passagem de câmera entre duas cenas. */
const PASSAGEM = 1.8;

export const duracaoTotal = (dados: DadosVideo) => ABERTURA + dados.duracaoAudio + FECHAMENTO;

function misturarPose(a: Pose, b: Pose, t: number): Pose {
  // Arco: a câmera sobe um pouco no meio da passagem, como um voo.
  const dist = Math.hypot(a.pos[0] - b.pos[0], a.pos[1] - b.pos[1], a.pos[2] - b.pos[2]);
  const pos = lerp3(a.pos, b.pos, t);
  pos[1] += Math.sin(Math.PI * t) * Math.min(40, dist * 0.18);
  return { pos, alvo: lerp3(a.alvo, b.alvo, t), fov: lerp(a.fov, b.fov, t) };
}

function misturarBoneco(a: PoseBoneco | null, b: PoseBoneco | null, t: number): PoseBoneco | null {
  if (a && b) {
    const r = { ...a, position: lerp3(a.position, b.position, t) };
    for (const k of ["giro", "olharCima", "bracoDireito", "bracoEsquerdo", "apontar", "pulo"] as const) r[k] = lerp(a[k], b[k], t);
    return r;
  }
  return t < 0.5 ? a : b;
}

export const VideoEseHein: React.FC<{ dados: DadosVideo }> = ({ dados }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const tempo = frame / fps;
  const tVoz = Math.min(dados.duracaoAudio, Math.max(0, tempo - ABERTURA));

  const limites = useMemo(() => limitesDasCenas(dados.trechos, dados.duracaoAudio), [dados]);
  const aos = useMemo(
    // O trecho i corresponde ao parágrafo i do roteiro.
    () => limites.map(([ini, fim], i) => criarAos(dados.palavras, i, ini, fim - ini)),
    [dados, limites],
  );

  const m = misturaDeCenas(limites, tVoz, PASSAGEM);
  const props = (i: number, p: number, peso: number): PropsCena => ({
    p,
    seg: tVoz - limites[i][0],
    dur: limites[i][1] - limites[i][0],
    tempo,
    peso,
    aos: aos[i],
  });
  const cenaA = buscarCena(dados.trechos[m.a].cena);
  const propsA = props(m.a, m.pa, 1 - m.mistura);
  const cenaB = m.b === null ? null : buscarCena(dados.trechos[m.b].cena);
  const propsB = m.b === null ? null : props(m.b, m.pb, m.mistura);

  let pose = cenaA.camera(propsA);
  let amb = cenaA.ambiente(propsA);
  let boneco = cenaA.boneco?.(propsA) ?? null;
  if (cenaB && propsB) {
    pose = misturarPose(pose, cenaB.camera(propsB), m.mistura);
    amb = misturarAmbiente(amb, cenaB.ambiente(propsB), m.mistura);
    boneco = misturarBoneco(boneco, cenaB.boneco?.(propsB) ?? null, m.mistura);
  }

  // Projeção 3D -> tela, com a mesma câmera do mundo, para prender os rótulos aos objetos.
  const projetar: Projetar = useMemo(() => {
    const cam = new THREE.PerspectiveCamera(pose.fov, width / height, 0.5, 5000);
    cam.position.set(...pose.pos);
    cam.lookAt(...pose.alvo);
    cam.updateMatrixWorld();
    cam.updateProjectionMatrix();
    return (v) => {
      const p = new THREE.Vector3(...v).project(cam);
      return { x: ((p.x + 1) / 2) * width, y: ((1 - p.y) / 2) * height, visivel: p.z < 1 };
    };
  }, [pose, width, height]);

  const nascer = entra(tempo, 0, ABERTURA);
  const fimVoz = ABERTURA + dados.duracaoAudio;
  const contextoA = cenaA.contexto?.(propsA) ?? "";
  const contextoB = cenaB && propsB ? (cenaB.contexto?.(propsB) ?? "") : "";
  const contexto = m.mistura < 0.5 ? contextoA : contextoB;
  const opContexto = (cenaB ? Math.abs(m.mistura - 0.5) * 2 : 1) * entra(tempo, ABERTURA * 0.6, 0.4) * (1 - entra(tempo, fimVoz, 0.3));

  const ObjetosA = cenaA.Objetos;
  const ObjetosB = cenaB?.Objetos;
  const RotulosA = cenaA.Rotulos;
  const RotulosB = cenaB?.Rotulos;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b1a45" }}>
      <Mundo pose={pose} amb={amb} tempo={tempo} boneco={boneco} nascer={nascer} width={width} height={height}>
        {ObjetosA ? <ObjetosA {...propsA} /> : null}
        {ObjetosB && propsB ? <ObjetosB {...propsB} /> : null}
      </Mundo>

      <AbsoluteFill style={{ opacity: 1 - m.mistura }}>{RotulosA ? <RotulosA {...propsA} projetar={projetar} /> : null}</AbsoluteFill>
      {RotulosB && propsB ? (
        <AbsoluteFill style={{ opacity: m.mistura }}>
          <RotulosB {...propsB} projetar={projetar} />
        </AbsoluteFill>
      ) : null}

      <Contexto texto={contexto} opacidade={opContexto} />
      <MarcaDagua opacidade={1 - entra(tempo, fimVoz, 0.3)} />
      <Legenda palavras={dados.palavras} inicioVoz={ABERTURA} />

      <Sequence name="Voz da Maia" from={Math.round(ABERTURA * fps)} layout="none">
        <Audio src={staticFile(dados.audio)} />
      </Sequence>
      <Sequence name="Fechamento" from={Math.round(fimVoz * fps)}>
        <Fechamento pergunta={dados.pergunta} />
      </Sequence>
    </AbsoluteFill>
  );
};
