/**
 * Ilustração conceitual da Iris (hero da landing e painel das telas de entrada).
 *
 * Conta a proposta em uma imagem: à esquerda, atores (nós) e relações (linhas) do presente sobre
 * uma cartografia abstrata; de um ator em foco, três trajetórias tracejadas em âmbar se abrem até o
 * horizonte (A, B, C). Âmbar é a cor de hipótese na plataforma: o futuro nunca aparece como fato.
 *
 * NÃO é dado: posições, ligações e trajetórias são desenho. Quem usa o componente mostra a
 * legenda "Ilustração conceitual" junto dela.
 *
 * Animação (uma vez, ~2,6 s; depois a imagem fica parada, sem movimento de fundo):
 *   1. a cartografia aparece (opacidade);
 *   2. os nós surgem em sequência (opacidade + escala de 0,85 a 1, nunca de 0);
 *   3. as relações são traçadas (pathLength), primeiro as do ator em foco;
 *   4. as três trajetórias se abrem do presente para o horizonte.
 * Com "reduzir movimento" (ou `estatica`), nasce no estado final: `initial={false}`.
 *
 * Reação ao ponteiro (só com mouse/trackpad, `interativa`): passar sobre um ator acende as
 * relações dele e recua as demais; passar sobre um futuro (A, B, C) destaca a trajetória e mostra
 * "hipótese". É a leitura da plataforma em miniatura: foco num elemento, contexto recuado.
 * As áreas de ponteiro são invisíveis e maiores que os nós (alvos de 32 px). O destaque usa só
 * opacidade num <g> por fora do elemento animado, então não briga com a animação de entrada.
 */
import { m, useReducedMotion } from "motion/react";
import { useId, useState, type PointerEvent } from "react";
import { CURVA_MOVIMENTO, CURVA_SAIDA } from "../../../components/ui/movimento";

type P = { x: number; y: number };

const NOS: Record<string, P> = {
  a: { x: 118, y: 152 },
  b: { x: 214, y: 84 },
  foco: { x: 300, y: 214 },
  d: { x: 176, y: 304 },
  e: { x: 86, y: 396 },
  f: { x: 254, y: 428 },
  g: { x: 372, y: 340 },
  h: { x: 392, y: 116 },
  i: { x: 54, y: 258 },
};

/** Relações do presente. As do ator em foco vêm primeiro: são traçadas antes e em ciano. */
const LIGACOES: [string, string][] = [
  ["foco", "b"],
  ["foco", "d"],
  ["foco", "g"],
  ["foco", "h"],
  ["foco", "a"],
  ["a", "b"],
  ["d", "e"],
  ["d", "f"],
  ["a", "i"],
  ["i", "e"],
  ["f", "g"],
  ["b", "h"],
];

/** Polo da projeção cônica, acima do quadro: os paralelos são arcos em torno dele. */
const POLO = { x: 300, y: -560 };

const FUTUROS: { id: string; fim: P; c1: P; c2: P }[] = [
  { id: "A", fim: { x: 596, y: 104 }, c1: { x: 400, y: 214 }, c2: { x: 470, y: 104 } },
  { id: "B", fim: { x: 596, y: 236 }, c1: { x: 420, y: 214 }, c2: { x: 500, y: 236 } },
  { id: "C", fim: { x: 596, y: 372 }, c1: { x: 400, y: 214 }, c2: { x: 470, y: 372 } },
];

/** Curva suave entre dois nós: o ponto de controle sai da reta, como rotas num mapa. */
function arco(p: P, q: P) {
  const mx = (p.x + q.x) / 2;
  const my = (p.y + q.y) / 2;
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  return `M${p.x} ${p.y}Q${mx - dy * 0.18} ${my + dx * 0.18} ${q.x} ${q.y}`;
}

/** Opacidade de quem fica de fora do destaque: recua sem sumir (o contexto continua legível). */
const RECUO = 0.18;

export function RedeIlustrativa({ estatica = false, interativa = false, className = "" }: { estatica?: boolean; interativa?: boolean; className?: string }) {
  const reduzir = useReducedMotion();
  // Ator ("a"…"i", "foco") ou futuro ("A", "B", "C") sob o ponteiro.
  const [ativo, setAtivo] = useState<string | null>(null);
  const ehFuturo = ativo !== null && FUTUROS.some((f) => f.id === ativo);
  const vizinhos = new Set<string>(ativo && !ehFuturo ? [ativo, ...LIGACOES.filter(([a, b]) => a === ativo || b === ativo).flat()] : []);
  const opLigacao = (de: string, para: string) => (!ativo ? 1 : ehFuturo ? RECUO : de === ativo || para === ativo ? 1 : RECUO);
  const opNo = (id: string) => (!ativo ? 1 : ehFuturo ? (id === "foco" ? 1 : 0.45) : vizinhos.has(id) ? 1 : 0.35);
  const opFuturo = (id: string) => (!ativo ? 1 : ehFuturo ? (id === ativo ? 1 : RECUO) : 0.35);
  // Só mouse/trackpad: no toque, "passar por cima" não existe e o destaque ficaria preso.
  const entrar = (alvo: string) => (e: PointerEvent) => {
    if (interativa && e.pointerType === "mouse") setAtivo(alvo);
  };
  const sair = () => setAtivo(null);
  const suave = { transition: "opacity 260ms var(--ease-saida)" } as const;
  const parada = estatica || Boolean(reduzir);
  const titulo = useId();
  // Com `initial={false}` o Motion monta direto no estado `animate`: nada se move.
  const inicio = <T,>(v: T) => (parada ? false : v);
  const foco = NOS.foco;

  return (
    <svg viewBox="0 0 640 520" role="img" aria-labelledby={titulo} className={`h-auto w-full ${className}`}>
      <title id={titulo}>
        Ilustração conceitual: atores e relações no presente; de um ator em foco, três trajetórias alternativas se abrem até o horizonte.
      </title>

      {/* 1. Cartografia abstrata: a grade de uma projeção cônica (paralelos em arco, meridianos que
          convergem para um polo fora do quadro). Lê como mapa, sem virar globo; quase imperceptível. */}
      <defs>
        <clipPath id={`${titulo}-quadro`}>
          <rect x="0" y="24" width="640" height="456" />
        </clipPath>
      </defs>
      <m.g
        initial={inicio({ opacity: 0 })}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        fill="none"
        stroke="color-mix(in srgb, var(--color-texto-3) 13%, transparent)"
        strokeWidth="1"
        clipPath={`url(#${titulo}-quadro)`}
      >
        {[700, 820, 940, 1060].map((r) => (
          <circle key={r} cx={POLO.x} cy={POLO.y} r={r} />
        ))}
        {[-22, -11, 0, 11, 22].map((a) => {
          const rad = (a * Math.PI) / 180;
          return <line key={a} x1={POLO.x + Math.sin(rad) * 640} y1={POLO.y + Math.cos(rad) * 640} x2={POLO.x + Math.sin(rad) * 1150} y2={POLO.y + Math.cos(rad) * 1150} />;
        })}
      </m.g>

      {/* Horizonte: o limite temporal da investigação. */}
      <m.g initial={inicio({ opacity: 0 })} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1.4 }}>
        <line x1="596" y1="56" x2="596" y2="430" stroke="color-mix(in srgb, var(--color-ambar) 35%, transparent)" strokeDasharray="2 5" />
        <text x="596" y="466" textAnchor="middle" fill="var(--color-texto-2)" style={{ font: "500 16px var(--font-interface)" }}>
          horizonte
        </text>
      </m.g>

      {/* 3. Relações do presente (traçadas da origem ao destino). */}
      <g fill="none" strokeLinecap="round">
        {LIGACOES.map(([de, para], i) => {
          const doFoco = de === "foco";
          return (
            <g key={`${de}-${para}`} style={{ ...suave, opacity: opLigacao(de, para) }}>
            <m.path
              d={arco(NOS[de], NOS[para])}
              stroke={doFoco ? "color-mix(in srgb, var(--color-ciano) 75%, transparent)" : "color-mix(in srgb, var(--color-texto-3) 32%, transparent)"}
              strokeWidth={doFoco ? 1.6 : 1.2}
              initial={inicio({ pathLength: 0, opacity: 0 })}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.55 + i * 0.045, ease: CURVA_MOVIMENTO }}
            />
            </g>
          );
        })}
      </g>

      {/* 4. Trajetórias alternativas: tracejadas em âmbar, do ator em foco ao horizonte. */}
      <g fill="none" strokeLinecap="round">
        {FUTUROS.map((f, i) => (
          <g key={f.id} style={{ ...suave, opacity: opFuturo(f.id) }}>
          <m.path
            d={`M${foco.x} ${foco.y}C${f.c1.x} ${f.c1.y} ${f.c2.x} ${f.c2.y} ${f.fim.x} ${f.fim.y}`}
            stroke="color-mix(in srgb, var(--color-ambar) 80%, transparent)"
            strokeWidth={ativo === f.id ? 2.2 : 1.6}
            strokeDasharray="5 6"
            initial={inicio({ pathLength: 0, opacity: 0 })}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.9, delay: 1.5 + i * 0.12, ease: CURVA_MOVIMENTO }}
          />
          </g>
        ))}
      </g>
      {FUTUROS.map((f, i) => (
        <g key={f.id} style={{ ...suave, opacity: opFuturo(f.id) }}>
        <m.g
          initial={inicio({ opacity: 0 })}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 2.2 + i * 0.12 }}
        >
          <path d={`M${f.fim.x} ${f.fim.y - 8}l8 8-8 8-8-8z`} fill="var(--color-abismo)" stroke="var(--color-ambar)" strokeWidth="1.6" />
          <text x={f.fim.x + 16} y={f.fim.y + 5} fill="var(--color-ambar)" style={{ font: "600 18px var(--font-interface)" }}>
            {f.id}
          </text>
          {/* Só no destaque: o futuro é hipótese, nunca previsão. */}
          <text x={f.fim.x} y={f.fim.y + 28} textAnchor="middle" fill="var(--color-ambar)" style={{ ...suave, font: "500 15px var(--font-interface)", opacity: ativo === f.id ? 0.9 : 0 }}>
            hipótese
          </text>
        </m.g>
        </g>
      ))}

      {/* 2. Atores. A escala parte de 0,85 (nada surge do nada) e gira em torno do próprio nó. */}
      {Object.entries(NOS).map(([id, p], i) => (
        <g key={id} style={{ ...suave, opacity: opNo(id) }}>
        <m.circle
          cx={p.x}
          cy={p.y}
          r={id === "foco" ? 7 : 4.5}
          fill={id === "foco" ? "var(--color-texto)" : "var(--color-abismo)"}
          stroke={id === "foco" ? "none" : "var(--color-texto-2)"}
          strokeWidth="1.5"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          initial={inicio({ opacity: 0, transform: "scale(0.85)" })}
          animate={{ opacity: 1, transform: "scale(1)" }}
          transition={{ duration: 0.4, delay: 0.25 + i * 0.05, ease: CURVA_SAIDA }}
        />
        </g>
      ))}
      {/* Anel do ator em foco: o "olhar" da marca aplicado ao mapa. */}
      <m.circle
        cx={foco.x}
        cy={foco.y}
        r="16"
        fill="none"
        stroke="var(--color-ciano)"
        strokeWidth="1.4"
        initial={inicio({ opacity: 0 })}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.1 }}
      />
      <m.text
        x={foco.x - 22}
        y={foco.y + 38}
        fill="var(--color-texto-2)"
        style={{ font: "500 16px var(--font-interface)" }}
        initial={inicio({ opacity: 0 })}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.2 }}
      >
        hoje
      </m.text>

      {/* Áreas de ponteiro (invisíveis, por cima de tudo): nós com raio 16 e as trajetórias com
          traço largo. Ficam fora da árvore de acessibilidade: a interação é só um realce visual. */}
      {interativa && (
        <g aria-hidden="true" fill="transparent" stroke="transparent" onPointerLeave={sair}>
          {FUTUROS.map((f) => (
            <g key={f.id} onPointerEnter={entrar(f.id)}>
              <path d={`M${foco.x + 24} ${foco.y}C${f.c1.x} ${f.c1.y} ${f.c2.x} ${f.c2.y} ${f.fim.x} ${f.fim.y}`} fill="none" strokeWidth="16" />
              <rect x={f.fim.x - 12} y={f.fim.y - 14} width="44" height="28" />
            </g>
          ))}
          {Object.entries(NOS).map(([id, p]) => (
            <circle key={id} cx={p.x} cy={p.y} r="16" onPointerEnter={entrar(id)} />
          ))}
        </g>
      )}
    </svg>
  );
}
