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
import { useFontesProntas } from "./fontes";
import { criarAos, limitesDasCenas, misturaDeCenas } from "./lib/tempo";
import { misturarAmbiente } from "./mundo/ambiente";
import { POSICAO_LUA } from "./mundo/Lua";
import { Mundo } from "./mundo/Mundo";
import type { DadosVideo } from "./tipos";

/** Segundos antes da voz. O Design System sugeriu começar direto no Q1. */
export const ABERTURA = 0;
/** Segundos de fechamento (logo e pergunta) depois da voz. */
export const FECHAMENTO = 4;
/** Passagem de câmera e de modo de cor entre dois trechos: 45 quadros (mov/camera-transicao, mov/modo-cor). */
const PASSAGEM = 1.5;

export const duracaoTotal = (dados: DadosVideo) => ABERTURA + dados.duracaoAudio + FECHAMENTO;

function misturarPose(a: Pose, b: Pose, t: number, alvoSobe: number): Pose {
  // Arco: a câmera sobe um pouco no meio da passagem; o alvo pode subir também (tilt para o céu).
  const dist = Math.hypot(a.pos[0] - b.pos[0], a.pos[1] - b.pos[1], a.pos[2] - b.pos[2]);
  const pos = lerp3(a.pos, b.pos, t);
  pos[1] += Math.sin(Math.PI * t) * Math.min(40, dist * 0.12);
  const alvo = lerp3(a.alvo, b.alvo, t);
  alvo[1] += Math.sin(Math.PI * t) * alvoSobe;
  return { pos, alvo, fov: lerp(a.fov, b.fov, t) };
}

function misturarBoneco(a: PoseBoneco | null, b: PoseBoneco | null, t: number): PoseBoneco | null {
  if (a && b) {
    // Lugares diferentes: o boneco troca de lugar no meio da passagem, quando a câmera não o vê.
    const longe = Math.hypot(a.position[0] - b.position[0], a.position[2] - b.position[2]) > 20;
    if (longe) return t < 0.5 ? a : b;
    const r = { ...a, position: lerp3(a.position, b.position, t) };
    for (const k of ["giro", "olharCima", "bracoDireito", "bracoEsquerdo", "apontar", "ombros", "pulo"] as const) r[k] = lerp(a[k], b[k], t);
    return r;
  }
  return t < 0.5 ? a : b;
}

const criarProjecao = (pose: Pose, width: number, height: number): Projetar => {
  const cam = new THREE.PerspectiveCamera(pose.fov, width / height, 0.3, 6000);
  cam.position.set(...pose.pos);
  cam.lookAt(...pose.alvo);
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  return (v) => {
    const p = new THREE.Vector3(...v).project(cam);
    return { x: ((p.x + 1) / 2) * width, y: ((1 - p.y) / 2) * height, visivel: p.z < 1 };
  };
};

export const VideoEseHein: React.FC<{ dados: DadosVideo }> = ({ dados }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const fontes = useFontesProntas();
  const tempo = frame / fps;
  const tVoz = Math.min(dados.duracaoAudio, Math.max(0, tempo - ABERTURA));
  const fimVoz = ABERTURA + dados.duracaoAudio;

  const limites = useMemo(() => limitesDasCenas(dados.trechos, dados.duracaoAudio), [dados]);
  // O trecho i corresponde ao parágrafo i do roteiro.
  const aos = useMemo(() => limites.map(([ini, fim], i) => criarAos(dados.palavras, i, ini, fim - ini)), [dados, limites]);

  const m = misturaDeCenas(limites, tVoz, PASSAGEM);
  const props = (i: number, p: number, peso: number): PropsCena => {
    const dur = limites[i][1] - limites[i][0];
    return { p, seg: tVoz - limites[i][0], dur, tempo, peso, aos: aos[i], saida: i === limites.length - 1 ? dur + 1 : dur - PASSAGEM / 2 - 0.1 };
  };
  const cenaA = buscarCena(dados.trechos[m.a].cena);
  const propsA = props(m.a, m.pa, 1 - m.mistura);
  const cenaB = m.b === null ? null : buscarCena(dados.trechos[m.b].cena);
  const propsB = m.b === null ? null : props(m.b, m.pb, m.mistura);

  let pose = cenaA.camera(propsA);
  let amb = cenaA.ambiente(propsA);
  let boneco = cenaA.boneco?.(propsA) ?? null;
  if (cenaB && propsB) {
    pose = misturarPose(pose, cenaB.camera(propsB), m.mistura, cenaA.passagemAlvoSobe ?? 0);
    amb = misturarAmbiente(amb, cenaB.ambiente(propsB), m.mistura);
    boneco = misturarBoneco(boneco, cenaB.boneco?.(propsB) ?? null, m.mistura);
  }

  // Projeção 3D -> tela com a mesma câmera do mundo, para prender os rótulos aos objetos.
  const projetar = useMemo(() => criarProjecao(pose, width, height), [pose, width, height]);
  // O círculo laranja do fechamento nasce da Lua, onde ela está no último quadro da voz.
  const origemFechamento = useMemo(() => {
    const ultimo = buscarCena(dados.trechos[limites.length - 1].cena);
    const i = limites.length - 1;
    const pr = props(i, 1, 1);
    pr.seg = limites[i][1] - limites[i][0];
    const p = criarProjecao(ultimo.camera(pr), width, height)(POSICAO_LUA);
    return { x: Math.min(1080, Math.max(0, p.x)), y: Math.min(1920, Math.max(0, p.y)) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados, limites, width, height]);

  const ctxA = cenaA.contexto?.(propsA);
  const ctxB = cenaB && propsB ? cenaB.contexto?.(propsB) : undefined;
  const ctx = m.mistura < 0.5 ? ctxA : ctxB;
  const opContexto = (cenaB ? Math.abs(m.mistura - 0.5) * 2 : 1) * (1 - entra(tempo, fimVoz - 0.2, 0.2));

  const ObjetosA = cenaA.Objetos;
  const ObjetosB = cenaB?.Objetos;
  const RotulosA = cenaA.Rotulos;
  const RotulosB = cenaB?.Rotulos;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b1a45" }}>
      <Mundo pose={pose} amb={amb} tempo={tempo} boneco={boneco} width={width} height={height}>
        {ObjetosA ? <ObjetosA {...propsA} /> : null}
        {ObjetosB && propsB ? <ObjetosB {...propsB} /> : null}
      </Mundo>

      {fontes ? (
        <>
          {RotulosA ? <RotulosA {...propsA} projetar={projetar} /> : null}
          {RotulosB && propsB ? <RotulosB {...propsB} projetar={projetar} /> : null}
          <Contexto texto={ctx?.texto ?? ""} tempo={ctx?.tempo} opacidade={opContexto} />
          <MarcaDagua opacidade={tempo < fimVoz ? 1 : 0} />
          <Legenda palavras={dados.palavras} trechos={dados.trechos} inicioVoz={ABERTURA} />
          <Sequence name="Fechamento" from={Math.round(fimVoz * fps)}>
            <Fechamento pergunta={dados.pergunta} origem={origemFechamento} />
          </Sequence>
        </>
      ) : null}

      <Sequence name="Voz da Maia" from={Math.round(ABERTURA * fps)} layout="none">
        <Audio src={staticFile(dados.audio)} />
      </Sequence>
    </AbsoluteFill>
  );
};
