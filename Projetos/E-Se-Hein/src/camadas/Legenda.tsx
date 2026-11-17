import { useCurrentFrame, useVideoConfig } from "remotion";
import { FONTE } from "../fontes";
import { formatarPalavra, palavraAtiva } from "../lib/tempo";
import type { Palavra } from "../tipos";

// Uma palavra por vez, branca, grossa, com contorno escuro, a ~68 % da altura.
// Faixa horizontal 110–910 px: fora da coluna de botões do TikTok (direita).
const CENTRO_Y = 0.68;
const ESQUERDA = 110;
const LARGURA = 800;

export const Legenda: React.FC<{ palavras: Palavra[]; inicioVoz: number }> = ({ palavras, inicioVoz }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const ms = (frame / fps - inicioVoz) * 1000;
  const i = palavraAtiva(palavras, ms);
  if (i < 0) return null;
  const texto = formatarPalavra(palavras[i].texto);
  const tamanho = Math.min(108, LARGURA / (texto.length * 0.68));
  const desde = Math.min(1, (ms - palavras[i].inicioMs) / 110);
  const escala = 0.84 + 0.16 * (1 - Math.pow(1 - desde, 3));
  return (
    <div
      style={{
        position: "absolute",
        left: ESQUERDA,
        width: LARGURA,
        top: height * CENTRO_Y,
        translate: "0 -50%",
        textAlign: "center",
        fontFamily: FONTE,
        fontWeight: 800,
        fontSize: tamanho,
        lineHeight: 1,
        color: "#fff",
        WebkitTextStroke: `${Math.round(tamanho * 0.16)}px #141414`,
        paintOrder: "stroke fill",
        textShadow: "0 7px 0 rgba(0,0,0,0.35)",
        scale: String(escala),
        whiteSpace: "nowrap",
      }}
    >
      {texto}
    </div>
  );
};
