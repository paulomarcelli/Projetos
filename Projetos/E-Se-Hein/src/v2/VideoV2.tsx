import { Audio } from "@remotion/media";
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { MarcaDagua } from "../camadas/MarcaDagua";
import { FPS, frasesDaLegenda, limitesDosPlanos } from "../lib/v2";
import type { DadosVideo } from "../tipos";
import { CeuND, DadoNoCanto, FechamentoV2, Fato, LegendaV2, Titulo, Veu } from "./camadas";
import { useFontesV2 } from "./fontes";
import type { ConfigV2 } from "./tipos";

/** Correção de cor por modo (tokens v2.cor), aplicada por cima do render do Blender (vista AgX). */
const GRADE: Record<string, { filtro: string; ceu: number }> = {
  dia: { filtro: "brightness(0.95) contrast(1.06) saturate(0.92)", ceu: 0.55 },
  noite: { filtro: "brightness(0.92) contrast(1.1) saturate(0.62)", ceu: 0.45 },
  frio: { filtro: "brightness(1.1) contrast(0.84) saturate(0.3)", ceu: 0.08 },
};

export type PropsV2 = { dados: DadosVideo; config: ConfigV2; fonte?: "video" | "quadros" };

/**
 * Vídeo no estilo realista (v2): os planos renderizados no Blender (public/<pasta>/<plano>.mp4) e, por cima, nesta
 * ordem: correção de cor, filtro do céu, véu de leitura, contador, fato, título, legenda, marca-d'água e fechamento.
 * Com fonte "quadros", usa os quadros soltos da conferência (public/<pasta>/quadros/<plano>/<quadro>.jpg).
 */
export const VideoV2: React.FC<PropsV2> = ({ dados, config, fonte = "video" }) => {
  const f = useCurrentFrame();
  useFontesV2();
  const t = f / FPS;
  const planos = useMemo(() => limitesDosPlanos(dados, config.spec), [dados, config]);
  const frases = useMemo(() => frasesDaLegenda(dados.palavras), [dados]);
  const fimVoz = Math.round(dados.duracaoAudio * FPS);
  const noFechamento = f >= fimVoz;
  const plano = planos.find((p) => f >= p.deQuadro && f < p.deQuadro + p.quadros) ?? planos[planos.length - 1];
  const grade = GRADE[plano.modo] ?? GRADE.dia;
  const origem = useOrigemDoFechamento(config, planos[planos.length - 1].deQuadro, fimVoz);
  // o texto sai junto com o círculo laranja (12 quadros)
  const visivel = noFechamento ? Math.max(0, 1 - (f - fimVoz) / 6) : 1;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {fonte === "quadros" ? (
        <Img
          src={staticFile(`${config.pastaBlender}/quadros/${plano.id}/${String(Math.min(plano.quadros, f - plano.deQuadro + 1)).padStart(4, "0")}.jpg`)}
          style={{ width: 1080, height: 1920, filter: grade.filtro }}
        />
      ) : (
        planos.map((p) => (
          <Sequence key={p.id} from={p.deQuadro} durationInFrames={p.quadros} layout="none">
            <OffthreadVideo src={staticFile(`${config.pastaBlender}/${p.id}.mp4`)} muted style={{ position: "absolute", width: 1080, height: 1920, filter: (GRADE[p.modo] ?? GRADE.dia).filtro }} />
          </Sequence>
        ))
      )}
      {config.comCeu.includes(plano.id) ? <CeuND forca={grade.ceu} /> : null}
      <Veu />
      <div style={{ position: "absolute", inset: 0, opacity: visivel }}>
        <DadoNoCanto estados={config.canto} t={t} visivel={1} />
        <Fato fatos={config.fatos} t={t} />
        <Titulo texto={config.titulo.texto} t={t} ini={config.titulo.inicio} fim={config.titulo.fim} />
        <LegendaV2 frases={frases} t={t} />
        <MarcaDagua opacidade={1} />
      </div>
      {noFechamento ? <FechamentoV2 pergunta={dados.pergunta} origem={origem} f={f - fimVoz} /> : null}
      <Audio src={staticFile(dados.audio)} />
    </AbsoluteFill>
  );
};

/** Onde o "você" está na tela no último quadro da voz (gravado pelo Blender em public/<pasta>/<último plano>.json). */
function useOrigemDoFechamento(config: ConfigV2, deQuadro: number, fimVoz: number) {
  const ultimo = config.spec.planos[config.spec.planos.length - 1].id;
  const [origem, setOrigem] = useState({ x: 540, y: 1110 });
  const [handle] = useState(() => delayRender("Lendo a posição do você"));
  useEffect(() => {
    fetch(staticFile(`${config.pastaBlender}/${ultimo}.json`))
      .then((r) => (r.ok ? r.json() : null))
      .then((info: { voce?: Record<string, { x: number; y: number }> } | null) => {
        if (info?.voce) {
          const alvo = fimVoz - deQuadro + 1;
          const chaves = Object.keys(info.voce).map(Number);
          const perto = chaves.reduce((a, b) => (Math.abs(b - alvo) < Math.abs(a - alvo) ? b : a), chaves[0]);
          setOrigem(info.voce[String(perto)]);
        }
      })
      .catch(() => undefined)
      .finally(() => continueRender(handle));
  }, [config, deQuadro, fimVoz, handle, ultimo]);
  return origem;
}
