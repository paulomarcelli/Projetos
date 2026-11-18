import { rotulo } from "../mundo/paleta";
import { animRotulo, type Janela } from "./rotulos";

// Termômetro (vídeo do Sol): tubo branco com contorno tinta 6 px e sombra dura, bulbo e coluna vermelhos
// (vermelho = queda). Uma marca longa no zero e marcas curtas sem número: nada de número novo na tela.

export const TERMOMETRO = { largura: 64, bulbo: 56, coluna: 28 };

/** Altura em px da marca do zero: `yTopo` + parte do tubo acima dela. */
export const yDoNivel = (yTopo: number, altura: number, nivel: number) => yTopo + altura * (1 - nivel);

type Props = {
  /** Centro do tubo. */
  x: number;
  /** Topo do tubo e altura do tubo (sem o bulbo), em px. */
  yTopo: number;
  altura: number;
  /** Nível da coluna (0 = fundo do tubo, 1 = topo). */
  nivel: number;
  /** Onde fica o zero (0 a 1). */
  zero: number;
  seg: number;
  janela: Janela;
};

export const Termometro: React.FC<Props> = ({ x, yTopo, altura, nivel, zero, seg, janela }) => {
  const a = animRotulo(seg, janela);
  if (!a) return null;
  const { largura, bulbo, coluna } = TERMOMETRO;
  const T = rotulo.contorno;
  const yBase = yTopo + altura;
  const yBulbo = yBase + bulbo * 0.6;
  const yNivel = yDoNivel(yTopo, altura, nivel);
  const yZero = yDoNivel(yTopo, altura, zero);
  const tubo = `M ${x - largura / 2} ${yBase} L ${x - largura / 2} ${yTopo + largura / 2} A ${largura / 2} ${largura / 2} 0 0 1 ${x + largura / 2} ${yTopo + largura / 2} L ${x + largura / 2} ${yBase} Z`;
  const marcas = [0.15, 0.3, 0.6, 0.75, 0.9].filter((m) => Math.abs(m - zero) > 0.07);
  return (
    <svg
      width={1080}
      height={1920}
      style={{
        position: "absolute",
        inset: 0,
        opacity: a.opacidade,
        transformOrigin: `${x}px ${yBulbo}px`,
        scale: String(a.escala),
        filter: "drop-shadow(0 8px 0 rgba(17,17,17,0.35))",
      }}
    >
      {/* Contorno: o tubo e o bulbo desenhados mais grossos em tinta, por baixo. */}
      <path d={tubo} fill={T} stroke={T} strokeWidth={12} strokeLinejoin="round" />
      <circle cx={x} cy={yBulbo} r={bulbo} fill={T} stroke={T} strokeWidth={12} />
      <path d={tubo} fill={rotulo.cartao} />
      <circle cx={x} cy={yBulbo} r={bulbo} fill={rotulo.vermelho} />
      <rect x={x - coluna / 2} y={yNivel} width={coluna} height={Math.max(0, yBulbo - yNivel)} rx={coluna / 2} fill={rotulo.vermelho} />
      {marcas.map((m) => (
        <line key={m} x1={x + largura / 2 - 18} x2={x + largura / 2 - 6} y1={yDoNivel(yTopo, altura, m)} y2={yDoNivel(yTopo, altura, m)} stroke={T} strokeWidth={5} strokeLinecap="round" />
      ))}
      <line x1={x - largura / 2 - 22} x2={x + largura / 2 + 22} y1={yZero} y2={yZero} stroke={T} strokeWidth={8} strokeLinecap="round" />
    </svg>
  );
};
