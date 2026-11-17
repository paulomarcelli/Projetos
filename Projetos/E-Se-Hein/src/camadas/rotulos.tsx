import React from "react";
import { Easing, spring } from "remotion";
import { FONTE } from "../fontes";
import { medidas as M, rotulo } from "../mundo/paleta";
import { larguraTexto } from "./medir";

// Componentes de rótulo do Design System (página Componentes do Figma). Medidas em px no quadro 1080 × 1920.

/** Área livre para rótulos: x 72 a 900, y 210 até acima da faixa da legenda (que começa em y 1210). */
export const AREA = { esquerda: M["zona/margem"], direita: 1080 - M["zona/direita"], topo: M["zona/topo"], base: 1190 };

/** Prende o centro (x, y) de uma caixa w × h dentro da área livre. */
export function prender(x: number, y: number, w = 0, h = 0) {
  return {
    x: Math.min(AREA.direita - w / 2, Math.max(AREA.esquerda + w / 2, x)),
    y: Math.min(AREA.base - h / 2, Math.max(AREA.topo + h / 2, y)),
  };
}

const FPS = 30;
const sai = Easing.bezier(0.4, 0, 1, 1);

/** Janela de vida de um rótulo, em segundos desde o começo da cena. */
export type Janela = [number, number];

/** Entrada (mov/rotulo-entrada: mola, 0 -> 108% -> 100%) e saída (mov/rotulo-saida: 6 quadros). */
export function animRotulo(seg: number, [ini, fim]: Janela): { escala: number; opacidade: number } | null {
  if (seg < ini) return null;
  if (seg >= fim) {
    const u = ((seg - fim) * FPS) / 6;
    if (u >= 1) return null;
    const e = sai(u);
    return { escala: 1 - 0.1 * e, opacidade: 1 - e };
  }
  const escala = spring({ frame: (seg - ini) * FPS, fps: FPS, config: { damping: 12, mass: 0.6, stiffness: 180 } });
  return { escala, opacidade: Math.min(1, ((seg - ini) * FPS) / 2) };
}

const sombraDura = `0 ${M["rotulo/sombra-y"]}px 0 rgba(17,17,17,0.35)`;

type Base = { x: number; y: number; seg: number; janela: Janela };

export const Pilula: React.FC<Base & { texto: string; cor: "vermelho" | "verde"; tamanho?: "G" | "P"; giro?: number }> = ({
  texto,
  cor,
  tamanho = "G",
  giro = 0,
  x,
  y,
  seg,
  janela,
}) => {
  const a = animRotulo(seg, janela);
  if (!a) return null;
  const g = tamanho === "G";
  const fonte = g ? M["rotulo/pilula-g/fonte"] : M["rotulo/pilula-p/fonte"];
  const altura = g ? M["rotulo/pilula-g/altura"] : M["rotulo/pilula-p/altura"];
  const respiro = g ? M["rotulo/pilula-g/padding-x"] : M["rotulo/pilula-p/padding-x"];
  const largura = larguraTexto(texto.toUpperCase(), fonte, 800, 0.02) + respiro * 2;
  const p = prender(x, y, largura + 12, altura + 12);
  return (
    <div
      style={{
        position: "absolute",
        left: p.x - largura / 2,
        top: p.y - altura / 2,
        width: largura,
        height: altura,
        boxSizing: "border-box",
        scale: String(a.escala),
        rotate: `${giro}deg`,
        opacity: a.opacidade,
        background: rotulo[cor],
        color: "#fff",
        fontFamily: FONTE,
        fontWeight: 800,
        fontSize: fonte,
        letterSpacing: "0.02em",
        lineHeight: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        border: `${M["rotulo/borda-largura"]}px solid #fff`,
        boxShadow: `0 0 0 ${M["rotulo/contorno-largura"]}px ${rotulo.contorno}, 0 ${M["rotulo/sombra-y"]}px 0 ${M["rotulo/contorno-largura"]}px rgba(17,17,17,0.35)`,
        whiteSpace: "nowrap",
        textTransform: "uppercase",
      }}
    >
      {texto}
    </div>
  );
};

/**
 * Texto amarelo preso a um objeto. Com guia, o ponto fica exatamente sobre o objeto (x, y)
 * e o texto fica acima da linha; sem guia, o texto fica centrado em (x, y).
 */
export const TextoPreso: React.FC<Base & { texto: string; guia?: boolean; giro?: number }> = ({ texto, guia, giro = 0, x, y, seg, janela }) => {
  const a = animRotulo(seg, janela);
  if (!a) return null;
  const fonte = M["rotulo/texto-preso/fonte"];
  const largura = larguraTexto(texto.toUpperCase(), fonte, 900, 0.01) + 12;
  const LINHA = 96;
  const PONTO = 24;
  const alturaTotal = guia ? fonte + LINHA + PONTO / 2 : fonte;
  // Centro do texto: acima da guia, ou no próprio ponto.
  const cy = guia ? y - LINHA - fonte / 2 : y;
  const p = prender(x, cy, largura, fonte + 16);
  const deslocY = p.y - cy;
  const deslocX = p.x - x;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: a.opacidade }}>
      {guia ? (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <g style={{ transformOrigin: `${x}px ${y}px`, scale: String(a.escala) }}>
            <line x1={x + deslocX} y1={y - LINHA + deslocY} x2={x} y2={y} stroke={rotulo.contorno} strokeWidth={6} strokeLinecap="round" />
            <circle cx={x} cy={y} r={PONTO / 2} fill={rotulo.amarelo} stroke={rotulo.contorno} strokeWidth={5} />
          </g>
        </svg>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: p.x - largura / 2,
          top: p.y - fonte / 2,
          width: largura,
          height: alturaTotal > 0 ? fonte : 0,
          textAlign: "center",
          scale: String(a.escala),
          rotate: `${giro}deg`,
          color: rotulo.amarelo,
          fontFamily: FONTE,
          fontWeight: 900,
          fontSize: fonte,
          lineHeight: 1,
          letterSpacing: "0.01em",
          WebkitTextStroke: `${M["rotulo/contorno-largura"] * 2}px ${rotulo.contorno}`,
          paintOrder: "stroke fill",
          textShadow: sombraDura,
          whiteSpace: "nowrap",
          textTransform: "uppercase",
        }}
      >
        {texto}
      </div>
    </div>
  );
};

type CorSeta = "vermelho" | "verde" | "amarelo";
const cresce = Easing.bezier(0, 0, 0.2, 1);
const ESPESSURA = M["rotulo/seta/espessura"];
const CONTORNO = M["rotulo/contorno-largura"];

/** Quanto a seta já cresceu (mov/seta-entrada, 10 quadros) e a oscilação de 6 px a cada 1,2 s. */
function animSeta(seg: number, janela: Janela) {
  const a = animRotulo(seg, janela);
  if (!a) return null;
  const t = Math.min(1, ((seg - janela[0]) * FPS) / 10);
  const depois = Math.max(0, seg - janela[0] - 10 / FPS);
  return { cresceu: cresce(t), oscila: Math.sin((depois / 1.2) * Math.PI * 2) * 3 + 3, opacidade: a.opacidade };
}

/** Seta reta, do pé (de) à ponta (para). */
export const Seta: React.FC<{ de: [number, number]; para: [number, number]; cor: CorSeta; seg: number; janela: Janela }> = ({ de, para, cor, seg, janela }) => {
  const a = animSeta(seg, janela);
  if (!a) return null;
  const ang = Math.atan2(para[1] - de[1], para[0] - de[0]);
  const ox = Math.cos(ang) * a.oscila;
  const oy = Math.sin(ang) * a.oscila;
  const cab = 34;
  const ponta = { x: de[0] + (para[0] - de[0]) * a.cresceu + ox, y: de[1] + (para[1] - de[1]) * a.cresceu + oy };
  const corpoFim = { x: ponta.x - Math.cos(ang) * cab * 0.8, y: ponta.y - Math.sin(ang) * cab * 0.8 };
  const pt = (r: number, d: number) => `${ponta.x + Math.cos(ang + d) * r},${ponta.y + Math.sin(ang + d) * r}`;
  const cabeca = `M ${pt(0, 0)} L ${pt(-cab * 1.3, 0.62)} L ${pt(-cab * 1.3, -0.62)} Z`;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: a.opacidade }}>
      <line x1={de[0] + ox} y1={de[1] + oy} x2={corpoFim.x} y2={corpoFim.y} stroke={rotulo.contorno} strokeWidth={ESPESSURA + CONTORNO * 2} strokeLinecap="round" />
      <path d={cabeca} fill={rotulo.contorno} stroke={rotulo.contorno} strokeWidth={CONTORNO * 2} strokeLinejoin="round" />
      <line x1={de[0] + ox} y1={de[1] + oy} x2={corpoFim.x} y2={corpoFim.y} stroke={rotulo[cor]} strokeWidth={ESPESSURA} strokeLinecap="round" />
      <path d={cabeca} fill={rotulo[cor]} />
    </svg>
  );
};

/** Seta curva, girando no sentido horário em volta de (cx, cy), de `de` até `ate` (radianos). */
export const SetaCurva: React.FC<{ cx: number; cy: number; raio: number; de: number; ate: number; cor: CorSeta; seg: number; janela: Janela }> = ({
  cx,
  cy,
  raio,
  de,
  ate,
  cor,
  seg,
  janela,
}) => {
  const a = animSeta(seg, janela);
  if (!a) return null;
  const fim = de + (ate - de) * a.cresceu + (a.oscila / raio) * Math.sign(ate - de);
  const pt = (ang: number) => [cx + Math.cos(ang) * raio, cy + Math.sin(ang) * raio];
  const recuo = (Math.sign(ate - de) * 26) / raio;
  const [x0, y0] = pt(de);
  const [x1, y1] = pt(fim - recuo);
  const [px, py] = pt(fim);
  const grande = Math.abs(fim - de) > Math.PI ? 1 : 0;
  const horario = ate > de ? 1 : 0;
  const d = `M ${x0} ${y0} A ${raio} ${raio} 0 ${grande} ${horario} ${x1} ${y1}`;
  const tg = fim + (horario ? Math.PI / 2 : -Math.PI / 2);
  const q = (r: number, dd: number) => `${px + Math.cos(tg + dd) * r},${py + Math.sin(tg + dd) * r}`;
  const cabeca = `M ${q(14, 0)} L ${q(-30, 0.95)} L ${q(-30, -0.95)} Z`;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: a.opacidade }}>
      <path d={d} fill="none" stroke={rotulo.contorno} strokeWidth={ESPESSURA * 0.7 + CONTORNO * 2} strokeLinecap="round" />
      <path d={cabeca} fill={rotulo.contorno} stroke={rotulo.contorno} strokeWidth={CONTORNO * 2} strokeLinejoin="round" />
      <path d={d} fill="none" stroke={rotulo[cor]} strokeWidth={ESPESSURA * 0.7} strokeLinecap="round" />
      <path d={cabeca} fill={rotulo[cor]} />
    </svg>
  );
};

/** Linha pontilhada amarela (ex.: a gravidade ligando a Lua à Terra). */
export const LinhaPontilhada: React.FC<{ de: [number, number]; para: [number, number]; seg: number; janela: Janela }> = ({ de, para, seg, janela }) => {
  const a = animRotulo(seg, janela);
  if (!a) return null;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: a.opacidade }}>
      <line x1={de[0]} y1={de[1]} x2={para[0]} y2={para[1]} stroke={rotulo.amarelo} strokeWidth={7} strokeDasharray="2 16" strokeLinecap="round" />
    </svg>
  );
};

/** Linha tracejada branca de referência (a vertical do eixo). */
export const LinhaTracejada: React.FC<{ de: [number, number]; para: [number, number]; opacidade: number }> = ({ de, para, opacidade }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: opacidade * 0.6 }}>
    <line x1={de[0]} y1={de[1]} x2={para[0]} y2={para[1]} stroke="#ffffff" strokeWidth={4} strokeDasharray="14 12" />
  </svg>
);

type ItemCartao = { icone: React.ReactNode; texto: string };

/** Cartão branco com ícones: tipo Um, Dois ("OU" entre eles) ou Antes e depois (seta amarela entre eles). */
export const Cartao: React.FC<{ tipo: "um" | "dois" | "antes-depois"; itens: ItemCartao[]; y?: number; seg: number; janela: Janela }> = ({
  tipo,
  itens,
  y = 560,
  seg,
  janela,
}) => {
  const a = animRotulo(seg, janela);
  if (!a) return null;
  const meio =
    tipo === "dois" ? (
      <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "0.02em", alignSelf: "center", marginTop: -40 }}>OU</div>
    ) : tipo === "antes-depois" ? (
      <svg width={96} height={60} viewBox="0 0 96 60" style={{ alignSelf: "center", marginTop: -40 }}>
        <path d="M 8 30 L 70 30" stroke={rotulo.contorno} strokeWidth={22} strokeLinecap="round" />
        <path d="M 62 10 L 90 30 L 62 50 Z" fill={rotulo.contorno} stroke={rotulo.contorno} strokeWidth={10} strokeLinejoin="round" />
        <path d="M 8 30 L 70 30" stroke={rotulo.amarelo} strokeWidth={12} strokeLinecap="round" />
        <path d="M 64 16 L 84 30 L 64 44 Z" fill={rotulo.amarelo} />
      </svg>
    ) : null;
  return (
    <div
      style={{
        position: "absolute",
        left: 540,
        top: Math.min(900, Math.max(300, y)),
        translate: "-50% -50%",
        scale: String(a.escala),
        opacity: a.opacidade,
        background: rotulo.cartao,
        borderRadius: M["rotulo/cartao/raio"],
        border: `6px solid ${rotulo.contorno}`,
        boxShadow: sombraDura,
        padding: M["rotulo/cartao/padding"],
        display: "flex",
        gap: 28,
        fontFamily: FONTE,
        color: rotulo.contorno,
      }}
    >
      {itens.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 ? meio : null}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            {it.icone}
            <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1, letterSpacing: "0.02em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{it.texto}</div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};
