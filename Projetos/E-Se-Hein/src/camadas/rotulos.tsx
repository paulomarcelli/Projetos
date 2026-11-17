import React from "react";
import { FONTE } from "../fontes";
import { rotulo } from "../mundo/paleta";

// Rótulos explicativos no estilo da referência. Posições em pixels do quadro 1080 × 1920.
// Ficam dentro da área segura: longe da coluna de botões (direita) e do texto do post (embaixo).
export const AREA = { esquerda: 90, direita: 880, topo: 190, base: 1180 };

const prender = (x: number, y: number) => ({
  x: Math.min(AREA.direita, Math.max(AREA.esquerda, x)),
  y: Math.min(AREA.base, Math.max(AREA.topo, y)),
});

/** Escala com um pequeno "pulo" na entrada. */
const pulinho = (a: number) => {
  if (a <= 0) return 0;
  if (a >= 1) return 1;
  const c1 = 1.70158;
  return 1 + (c1 + 1) * Math.pow(a - 1, 3) + c1 * Math.pow(a - 1, 2);
};

type Base = { x: number; y: number; aparece: number };

export const Pilula: React.FC<Base & { texto: string; cor: "vermelho" | "verde" }> = ({ texto, cor, x, y, aparece }) => {
  if (aparece <= 0) return null;
  const p = prender(x, y);
  return (
    <div
      style={{
        position: "absolute",
        left: p.x,
        top: p.y,
        translate: "-50% -50%",
        scale: String(pulinho(aparece)),
        opacity: Math.min(1, aparece * 2),
        background: rotulo[cor],
        color: "#fff",
        fontFamily: FONTE,
        fontWeight: 900,
        fontSize: 40,
        letterSpacing: 1,
        padding: "12px 30px",
        borderRadius: 999,
        border: "4px solid #fff",
        boxShadow: "0 6px 0 rgba(0,0,0,0.35)",
        whiteSpace: "nowrap",
        textTransform: "uppercase",
      }}
    >
      {texto}
    </div>
  );
};

export const TextoPreso: React.FC<Base & { texto: string; tamanho?: number }> = ({ texto, x, y, aparece, tamanho = 50 }) => {
  if (aparece <= 0) return null;
  const p = prender(x, y);
  return (
    <div
      style={{
        position: "absolute",
        left: p.x,
        top: p.y,
        translate: "-50% -50%",
        scale: String(pulinho(aparece)),
        opacity: Math.min(1, aparece * 2),
        color: rotulo.amarelo,
        fontFamily: FONTE,
        fontWeight: 900,
        fontSize: tamanho,
        WebkitTextStroke: `${Math.round(tamanho * 0.2)}px ${rotulo.contorno}`,
        paintOrder: "stroke fill",
        whiteSpace: "nowrap",
        textTransform: "uppercase",
        rotate: "-4deg",
      }}
    >
      {texto}
    </div>
  );
};

type CorSeta = "vermelho" | "verde" | "amarelo";

/** Seta reta que se desenha do começo à ponta. */
export const Seta: React.FC<{ de: [number, number]; para: [number, number]; cor: CorSeta; aparece: number }> = ({ de, para, cor, aparece }) => {
  if (aparece <= 0) return null;
  const a = prender(...de);
  const b0 = prender(...para);
  const b = { x: a.x + (b0.x - a.x) * aparece, y: a.y + (b0.y - a.y) * aparece };
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const ponta = (r: number, d: number) => `${b.x + Math.cos(ang + d) * r},${b.y + Math.sin(ang + d) * r}`;
  const cabeca = `M ${ponta(0, 0)} L ${ponta(-34, 0.55)} L ${ponta(-34, -0.55)} Z`;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={rotulo.contorno} strokeWidth={22} strokeLinecap="round" />
      <path d={cabeca} fill={rotulo.contorno} stroke={rotulo.contorno} strokeWidth={10} strokeLinejoin="round" />
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={rotulo[cor]} strokeWidth={12} strokeLinecap="round" />
      <path d={cabeca} fill={rotulo[cor]} />
    </svg>
  );
};

/** Seta em arco (para giros e balanços), centrada em (cx, cy). */
export const SetaArco: React.FC<{ cx: number; cy: number; raio: number; de: number; ate: number; cor: CorSeta; aparece: number }> = ({
  cx,
  cy,
  raio,
  de,
  ate,
  cor,
  aparece,
}) => {
  if (aparece <= 0) return null;
  const fim = de + (ate - de) * aparece;
  const pt = (ang: number, r = raio) => [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r];
  const [x0, y0] = pt(de);
  const [x1, y1] = pt(fim);
  const grande = Math.abs(fim - de) > Math.PI ? 1 : 0;
  const sentido = fim > de ? 1 : 0;
  const d = `M ${x0} ${y0} A ${raio} ${raio} 0 ${grande} ${sentido} ${x1} ${y1}`;
  const tangente = fim + (sentido ? Math.PI / 2 : -Math.PI / 2);
  const ponta = (r: number, dd: number) => `${x1 + Math.cos(tangente + dd) * r},${y1 + Math.sin(tangente + dd) * r}`;
  const cabeca = `M ${ponta(18, 0)} L ${ponta(-22, 0.9)} L ${ponta(-22, -0.9)} Z`;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
      <path d={d} fill="none" stroke={rotulo.contorno} strokeWidth={22} strokeLinecap="round" />
      <path d={cabeca} fill={rotulo.contorno} stroke={rotulo.contorno} strokeWidth={10} strokeLinejoin="round" />
      <path d={d} fill="none" stroke={rotulo[cor]} strokeWidth={12} strokeLinecap="round" />
      <path d={cabeca} fill={rotulo[cor]} />
    </svg>
  );
};

/** Cartão branco com ícones simples, como o "quadrado / triângulo" da referência. */
export const Cartao: React.FC<Base & { itens: { icone: React.ReactNode; texto: string }[]; separador?: string }> = ({
  itens,
  separador,
  x,
  y,
  aparece,
}) => {
  if (aparece <= 0) return null;
  const p = prender(x, y);
  return (
    <div
      style={{
        position: "absolute",
        left: p.x,
        top: p.y,
        translate: "-50% -50%",
        scale: String(pulinho(aparece)),
        opacity: Math.min(1, aparece * 2),
        background: "#fff",
        borderRadius: 28,
        border: `5px solid ${rotulo.contorno}`,
        boxShadow: "0 8px 0 rgba(0,0,0,0.3)",
        padding: "22px 34px",
        display: "flex",
        alignItems: "center",
        gap: 30,
        fontFamily: FONTE,
        fontWeight: 900,
        color: rotulo.contorno,
      }}
    >
      {itens.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && separador ? <div style={{ fontSize: 40, color: "#777" }}>{separador}</div> : null}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            {it.icone}
            <div style={{ fontSize: 30, textTransform: "uppercase", whiteSpace: "nowrap" }}>{it.texto}</div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};
