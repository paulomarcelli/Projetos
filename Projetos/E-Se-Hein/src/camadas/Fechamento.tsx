import { Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTE } from "../fontes";
import { marca } from "../mundo/paleta";

// 4 s depois da voz: fundo laranja da marca, logo "E Se, Hein?" e a pergunta do vídeo.
// Conteúdo entre x 90 e 900 e acima de y 1450 (fora da interface do TikTok).
export const Fechamento: React.FC<{ pergunta: string }> = ({ pergunta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ent = (ini: number, dur = 0.5) =>
    interpolate(frame, [ini * fps, (ini + dur) * fps], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  return (
    <div style={{ position: "absolute", inset: 0, background: marca.laranja, opacity: ent(0, 0.35) }}>
      <div
        style={{
          position: "absolute",
          left: 90,
          width: 810,
          top: 470,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 70,
        }}
      >
        <Img
          src={staticFile("marca/a-lockup.svg")}
          style={{ width: 760, opacity: ent(0.15), translate: `0 ${(1 - ent(0.15)) * 60}px` }}
        />
        <div
          style={{
            fontFamily: FONTE,
            fontWeight: 800,
            fontSize: 64,
            lineHeight: 1.15,
            color: marca.tinta,
            textAlign: "center",
            opacity: ent(0.5),
            translate: `0 ${(1 - ent(0.5)) * 50}px`,
          }}
        >
          {pergunta}
        </div>
        <div
          style={{
            fontFamily: FONTE,
            fontWeight: 900,
            fontSize: 40,
            color: marca.branco,
            background: marca.tinta,
            borderRadius: 999,
            padding: "16px 40px",
            textTransform: "uppercase",
            scale: String(ent(0.9, 0.4)),
          }}
        >
          Comenta aí
        </div>
      </div>
    </div>
  );
};
