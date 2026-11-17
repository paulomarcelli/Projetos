import { Easing, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTE } from "../fontes";
import { ehDestaque, formatarPalavra, palavraAtiva, tamanhoLegenda } from "../lib/tempo";
import { medidas as M, rotulo } from "../mundo/paleta";
import type { Palavra, Trecho } from "../tipos";
import { larguraTexto } from "./medir";

// Legenda de uma palavra (Design System): centro x 540, y 1280; Rubik 900 112 px, encolhe medindo a largura
// real até caber em 720 px (mínimo 84); contorno 12 px por fora, sombra dura; destaque amarelo.
const entrada = Easing.bezier(0.34, 1.56, 0.64, 1);

export const Legenda: React.FC<{ palavras: Palavra[]; trechos: Trecho[]; inicioVoz: number }> = ({ palavras, trechos, inicioVoz }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps - inicioVoz) * 1000;
  const i = palavraAtiva(palavras, ms);
  if (i < 0) return null;
  const texto = formatarPalavra(palavras[i].texto);
  const tamanho = tamanhoLegenda((t) => larguraTexto(texto, t, 900, -0.01));
  const quadros = Math.max(0, ((ms - palavras[i].inicioMs) / 1000) * fps);
  const escala = 0.86 + 0.14 * entrada(Math.min(1, quadros / 4));
  return (
    <div
      style={{
        position: "absolute",
        left: M["legenda/centro-x"] - 540,
        width: 1080,
        top: M["legenda/centro-y"],
        translate: "0 -50%",
        textAlign: "center",
        fontFamily: FONTE,
        fontWeight: 900,
        fontSize: tamanho,
        lineHeight: 1,
        letterSpacing: "-0.01em",
        color: ehDestaque(palavras, i, trechos) ? rotulo.amarelo : "#fff",
        WebkitTextStroke: `${M["legenda/contorno-largura"] * 2}px ${rotulo.contorno}`,
        paintOrder: "stroke fill",
        strokeLinejoin: "round",
        textShadow: `0 ${M["legenda/sombra-y"]}px 0 rgba(17,17,17,0.35)`,
        scale: String(escala),
        opacity: Math.min(1, quadros / 2),
        whiteSpace: "nowrap",
      }}
    >
      {texto}
    </div>
  );
};
