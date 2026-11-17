import { Easing, interpolate, spring, useCurrentFrame } from "remotion";
import { FONTE } from "../fontes";
import { marca } from "../mundo/paleta";
import { LOCKUP_PONTO, LOCKUP_PONTO_CENTRO, LOCKUP_SEM_PONTO, LOCKUP_VIEWBOX, SIMBOLO, SIMBOLO_VIEWBOX } from "./marca";

// Fechamento (4 s): círculo laranja nascendo da Lua (0–12), assinatura (8–18, mola), pergunta (14–26),
// chamada (30), pílula (40) e o ponto do "?" quicando (70). Alinhado à esquerda em x 100, no meio da área livre.
const curva = Easing.bezier(0.65, 0, 0.35, 1);

export const Fechamento: React.FC<{ pergunta: string; origem: { x: number; y: number } }> = ({ pergunta, origem }) => {
  const f = useCurrentFrame();
  const ent = (ini: number, dur = 12) =>
    interpolate(f, [ini, ini + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const raioMax = Math.hypot(Math.max(origem.x, 1080 - origem.x), Math.max(origem.y, 1920 - origem.y));
  const raio = interpolate(f, [0, 12], [60, raioMax + 20], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: curva });
  const assinatura = spring({ frame: f - 8, fps: 30, config: { damping: 12, mass: 0.6, stiffness: 180 } });
  const quique = f >= 70 && f < 86 ? -Math.sin(((f - 70) / 16) * Math.PI) * 26 : 0;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: origem.x - raio,
          top: origem.y - raio,
          width: raio * 2,
          height: raio * 2,
          borderRadius: "50%",
          background: marca.laranja,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 100,
          width: 780,
          top: 210,
          height: 1210,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          fontFamily: FONTE,
          color: marca.tinta,
        }}
      >
        <svg viewBox={LOCKUP_VIEWBOX} width={600} style={{ marginLeft: -12, scale: String(assinatura), transformOrigin: "left center", overflow: "visible" }}>
          <path d={LOCKUP_SEM_PONTO} fill={marca.tinta} />
          <path d={LOCKUP_PONTO} fill={marca.tinta} style={{ translate: `0 ${quique}px`, transformOrigin: `${LOCKUP_PONTO_CENTRO.x}px ${LOCKUP_PONTO_CENTRO.y}px` }} />
        </svg>
        <div style={{ marginTop: 56, fontWeight: 900, fontSize: 120, lineHeight: 0.96, letterSpacing: "-0.01em", opacity: ent(14), translate: `0 ${(1 - ent(14)) * 40}px` }}>
          {pergunta}
        </div>
        <div style={{ marginTop: 36, fontWeight: 800, fontSize: 44, lineHeight: 1.1, letterSpacing: "0.02em", textTransform: "uppercase", opacity: ent(30, 8) }}>
          Responde aqui nos comentários
        </div>
        <div
          style={{
            marginTop: 72,
            display: "flex",
            alignItems: "center",
            gap: 20,
            background: marca.tinta,
            color: marca.branco,
            borderRadius: 999,
            padding: "26px 44px",
            fontWeight: 800,
            fontSize: 44,
            lineHeight: 1,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            scale: String(spring({ frame: f - 40, fps: 30, config: { damping: 12, mass: 0.6, stiffness: 180 } })),
            transformOrigin: "left center",
          }}
        >
          <span>Segue para mais “E se”</span>
          <svg viewBox={SIMBOLO_VIEWBOX} width={56} height={56}>
            <path d={SIMBOLO} fill={marca.laranja} />
          </svg>
        </div>
      </div>
    </div>
  );
};
