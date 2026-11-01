/**
 * "Veja a Iris investigar": uma janela que encena a conversa quando chega na tela. Pergunta digitada → etapas do
 * processamento → análise (linhas com marcas de fato, inferência e hipótese e citações) → três cenários → rede de
 * atores. É uma ILUSTRAÇÃO da interface: o texto da análise aparece como linhas, não como afirmações inventadas.
 * Repete enquanto está visível; com "reduzir movimento", mostra o quadro final parado.
 */
import { Check } from "lucide-react";
import { m, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Marca } from "../common/Marca";
import { CENARIOS } from "./conteudo";

const PERGUNTA = "Como a disputa entre EUA e China pode afetar o comércio do Brasil até 2030?";
const ETAPAS = ["Lendo a pergunta e delimitando o escopo", "Reunindo evidências e fontes", "Mapeando atores e relações", "Construindo os cenários"];
// marcos da encenação (ms desde o início do ciclo)
const T = { pergunta: 0, etapas: 2600, analise: 5200, cenarios: 7000, rede: 8400, fim: 13000 };

const LINHAS: { largura: string; marca?: "Fato" | "Inferência" | "Hipótese"; cita?: string }[] = [
  { largura: "92%", marca: "Fato", cita: "[1]" },
  { largura: "78%" },
  { largura: "86%", marca: "Inferência", cita: "[2,3]" },
  { largura: "64%" },
  { largura: "88%", marca: "Hipótese", cita: "[4]" },
];
const COR_MARCA = { Fato: "#a9b5d4", Inferência: "#7fa2ff", Hipótese: "#f5c451" };

function useCiclo(ativo: boolean, parado: boolean) {
  const [t, setT] = useState(parado ? T.fim : 0);
  useEffect(() => {
    if (parado || !ativo) return;
    const inicio = performance.now();
    let quadro = 0;
    const laco = () => {
      setT((performance.now() - inicio) % T.fim);
      quadro = window.setTimeout(laco, 100);
    };
    laco();
    return () => window.clearTimeout(quadro);
  }, [ativo, parado]);
  return t;
}

export function Demonstracao() {
  const caixa = useRef<HTMLDivElement>(null);
  const visivel = useInView(caixa, { margin: "-15% 0px" });
  const parado = !!useReducedMotion();
  const t = useCiclo(visivel, parado);
  const letras = parado ? PERGUNTA.length : Math.min(PERGUNTA.length, Math.floor(t / 30));
  const etapaAtual = parado ? ETAPAS.length : Math.min(ETAPAS.length, Math.floor((t - T.etapas) / 600));

  return (
    <div ref={caixa} className="lp-painel overflow-hidden shadow-[0_40px_120px_-40px_rgba(79,125,255,0.45)]">
      {/* barra da janela */}
      <div className="flex items-center gap-3 border-b border-[color:var(--lp-linha)] px-4 py-3">
        <span className="flex gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-2.5 rounded-full bg-[color:var(--lp-linha-forte)]" />
          ))}
        </span>
        <Marca altura={18} />
        <span className="ml-auto text-[0.75rem] text-[color:var(--lp-texto-3)]">Ilustração da interface</span>
      </div>

      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          {/* pergunta */}
          <div>
            <p className="text-[0.75rem] text-[color:var(--lp-texto-3)]">Pergunta</p>
            <p className="mt-1 min-h-[3.2em] text-[1.0625rem] leading-snug text-[color:var(--lp-texto)]">
              <span className={letras < PERGUNTA.length ? "lp-cursor" : ""}>{PERGUNTA.slice(0, letras)}</span>
            </p>
          </div>

          {/* etapas */}
          <ol className="m-0 flex list-none flex-col gap-2 p-0" aria-label="Etapas da investigação">
            {ETAPAS.map((e, i) => {
              const feita = t >= T.etapas && i < etapaAtual;
              const agora = t >= T.etapas && i === etapaAtual && !parado;
              return (
                <li key={e} className={`flex items-center gap-2.5 text-[0.8125rem] transition-colors duration-300 ${feita ? "text-[color:var(--lp-texto-2)]" : agora ? "text-[color:var(--lp-texto)]" : "text-[color:var(--lp-texto-3)]/60"}`}>
                  <span className="grid size-4 place-items-center">
                    {feita ? <Check size={13} className="text-[color:var(--lp-ouro)]" /> : agora ? <span className="lp-pulso size-2 rounded-full bg-[color:var(--lp-ouro)]" /> : <span className="size-1 rounded-full bg-current" />}
                  </span>
                  {e}
                </li>
              );
            })}
          </ol>

          {/* análise: linhas com as marcas epistêmicas e as citações */}
          <div className="flex flex-col gap-2.5" aria-label="Análise (ilustração)">
            {LINHAS.map((l, i) => (
              <m.div
                key={i}
                initial={false}
                animate={t >= T.analise + i * 220 ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
                transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                className="flex items-center gap-2"
              >
                {l.marca && (
                  <span className="shrink-0 rounded-full border px-2 py-0.5 text-[0.6875rem]" style={{ color: COR_MARCA[l.marca], borderColor: `${COR_MARCA[l.marca]}55` }}>
                    {l.marca}
                  </span>
                )}
                <span className="h-2 rounded-full bg-[color:var(--lp-linha-forte)]" style={{ width: l.largura }} />
                {l.cita && <span className="shrink-0 font-mono text-[0.6875rem] text-[color:var(--lp-ouro)]">{l.cita}</span>}
              </m.div>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {/* cenários */}
          <div className="flex flex-col gap-2">
            <p className="text-[0.75rem] text-[color:var(--lp-texto-3)]">Cenários prospectivos</p>
            {CENARIOS.map((c, i) => (
              <m.div
                key={c.id}
                initial={false}
                animate={t >= T.cenarios + i * 260 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="flex items-center gap-3 rounded-xl border border-[color:var(--lp-linha)] bg-[color:var(--lp-marinho)]/60 px-3 py-2.5"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-md border border-[color:var(--lp-ouro)]/40 font-mono text-[0.8125rem] text-[color:var(--lp-ouro)]">{c.id}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.875rem] text-[color:var(--lp-texto)]">Cenário {c.id}</span>
                  <span className="block truncate text-[0.75rem] text-[color:var(--lp-texto-3)]">{c.tipo}</span>
                </span>
                <span className="text-[0.6875rem] text-[color:var(--lp-texto-3)]">Sem probabilidade</span>
              </m.div>
            ))}
          </div>

          {/* rede de atores */}
          <RedeDeAtores acesa={t >= T.rede} />
        </div>
      </div>
    </div>
  );
}

const NOS = [
  { id: "Brasil", x: 80, y: 120 },
  { id: "EUA", x: 40, y: 40 },
  { id: "China", x: 230, y: 50 },
  { id: "UE", x: 150, y: 20 },
  { id: "Mercosul", x: 180, y: 130 },
];
const LIGACOES: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [1, 2],
  [3, 2],
];

function RedeDeAtores({ acesa }: { acesa: boolean }) {
  return (
    <div className="rounded-xl border border-[color:var(--lp-linha)] bg-[color:var(--lp-marinho)]/40 p-3">
      <p className="mb-1 text-[0.75rem] text-[color:var(--lp-texto-3)]">Mapa de relações</p>
      <svg viewBox="0 0 270 160" className="h-auto w-full" role="img" aria-label="Rede ilustrativa de atores: Brasil, EUA, China, UE e Mercosul">
        {LIGACOES.map(([a, b], i) => (
          <m.line
            key={i}
            x1={NOS[a].x}
            y1={NOS[a].y}
            x2={NOS[b].x}
            y2={NOS[b].y}
            stroke={i < 4 ? "#f5c451" : "rgba(160,190,255,0.35)"}
            strokeWidth={i < 4 ? 1.4 : 1}
            strokeDasharray={i === 4 ? "4 4" : undefined}
            initial={false}
            animate={{ pathLength: acesa ? 1 : 0, opacity: acesa ? 1 : 0 }}
            transition={{ duration: 0.9, delay: acesa ? i * 0.12 : 0, ease: [0.23, 1, 0.32, 1] }}
          />
        ))}
        {NOS.map((n, i) => (
          <m.g key={n.id} initial={false} animate={{ opacity: acesa ? 1 : 0.35 }} transition={{ duration: 0.4, delay: acesa ? i * 0.08 : 0 }}>
            <circle cx={n.x} cy={n.y} r={i === 0 ? 7 : 5} fill={i === 0 ? "#f5c451" : "#0a1a3a"} stroke={i === 0 ? "#ffdd85" : "#a9b5d4"} strokeWidth="1.2" />
            <text x={n.x} y={n.y - 11} textAnchor="middle" fontSize="10" fill="#eef2ff">
              {n.id}
            </text>
          </m.g>
        ))}
      </svg>
    </div>
  );
}
