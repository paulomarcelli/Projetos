import { FONTE } from "../fontes";
import { formatarCronometro, OITO_MINUTOS } from "../lib/sol";
import { medidas as M, rotulo } from "../mundo/paleta";
import { animRotulo, type Janela } from "./rotulos";

// Cronômetro (vídeo do Sol): cartão branco do Design System (borda tinta 6, raio 36, sombra dura) com um relógio
// de 84 px cujo setor amarelo encolhe sem parar e o tempo em M:SS (Rubik 900). Em 0:00 o tempo fica vermelho.
// Entra e sai como os rótulos (mov/rotulo-entrada e mov/rotulo-saida).

const RELOGIO = 84;
const FONTE_TEMPO = 96;

/** Setor do círculo (de cima, no sentido horário) com `fracao` da volta. */
function setor(cx: number, cy: number, r: number, fracao: number) {
  if (fracao >= 0.999) return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  if (fracao <= 0.001) return "";
  const a = fracao * Math.PI * 2;
  const x = cx + Math.sin(a) * r;
  const y = cy - Math.cos(a) * r;
  return `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${fracao > 0.5 ? 1 : 0} 1 ${x} ${y} Z`;
}

type Props = {
  /** Canto esquerdo e topo do cartão, em px no quadro 1080 × 1920. */
  x: number;
  y: number;
  /** Segundos que faltam (8:00 = 480). */
  restante: number;
  seg: number;
  janela: Janela;
};

export const Cronometro: React.FC<Props> = ({ x, y, restante, seg, janela }) => {
  const a = animRotulo(seg, janela);
  if (!a) return null;
  const fracao = restante / OITO_MINUTOS;
  const zerou = restante <= 0;
  const c = RELOGIO / 2;
  const r = 30;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transformOrigin: "left center",
        scale: String(a.escala),
        opacity: a.opacidade,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "16px 34px 16px 22px",
        background: rotulo.cartao,
        border: `${M["rotulo/contorno-largura"]}px solid ${rotulo.contorno}`,
        borderRadius: M["rotulo/cartao/raio"],
        boxShadow: `0 ${M["rotulo/sombra-y"]}px 0 rgba(17,17,17,0.35)`,
      }}
    >
      <svg width={RELOGIO} height={RELOGIO} viewBox={`0 0 ${RELOGIO} ${RELOGIO}`}>
        <rect x={c - 9} y={2} width={18} height={12} rx={4} fill={rotulo.contorno} />
        <circle cx={c} cy={c + 5} r={r + 3} fill={rotulo.cartao} stroke={rotulo.contorno} strokeWidth={6} />
        <path d={setor(c, c + 5, r - 3, fracao)} fill={zerou ? rotulo.vermelho : rotulo.amarelo} />
        <line x1={c} y1={c + 5} x2={c + Math.sin(fracao * Math.PI * 2) * (r - 4)} y2={c + 5 - Math.cos(fracao * Math.PI * 2) * (r - 4)} stroke={rotulo.contorno} strokeWidth={5} strokeLinecap="round" />
        <circle cx={c} cy={c + 5} r={4} fill={rotulo.contorno} />
      </svg>
      <div
        style={{
          fontFamily: FONTE,
          fontWeight: 900,
          fontSize: FONTE_TEMPO,
          lineHeight: 1,
          letterSpacing: "-0.01em",
          fontVariantNumeric: "tabular-nums",
          color: zerou ? rotulo.vermelho : rotulo.contorno,
        }}
      >
        {formatarCronometro(restante)}
      </div>
    </div>
  );
};
