import { FONTE } from "../fontes";
import { medidas as M, rotulo } from "../mundo/paleta";

// Rótulo de contexto do canto superior esquerdo (x 72, y 236). Tipo Texto ou Tempo (com relógio).
export const Contexto: React.FC<{ texto: string; tempo?: boolean; opacidade: number }> = ({ texto, tempo, opacidade }) =>
  texto ? (
    <div
      style={{
        position: "absolute",
        left: M["zona/margem"],
        top: 236,
        opacity: opacidade,
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: FONTE,
        fontWeight: 800,
        fontSize: M["rotulo/contexto/fonte"],
        lineHeight: 1,
        letterSpacing: "0.04em",
        color: "#fff",
        WebkitTextStroke: `${M["rotulo/contorno-largura"] * 2}px ${rotulo.contorno}`,
        paintOrder: "stroke fill",
        textShadow: `0 ${M["rotulo/sombra-y"]}px 0 rgba(17,17,17,0.35)`,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {tempo ? (
        <svg width={48} height={48} viewBox="0 0 48 48" style={{ filter: `drop-shadow(0 6px 0 rgba(17,17,17,0.35))` }}>
          <circle cx={24} cy={24} r={18} fill="#fff" stroke={rotulo.contorno} strokeWidth={6} />
          <path d="M 24 14 L 24 25 L 31 29" fill="none" stroke={rotulo.contorno} strokeWidth={5} strokeLinecap="round" />
        </svg>
      ) : null}
      <span>{texto}</span>
    </div>
  ) : null;
