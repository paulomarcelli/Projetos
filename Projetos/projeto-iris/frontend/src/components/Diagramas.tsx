/**
 * Diagramas de REFERÊNCIA: explicam como cenários e relações serão representados.
 * Não contêm dados; por isso são sempre rotulados como estrutura, nunca como resultado.
 */

import { EPISTEMICO, GlifoEpistemico, type TipoEpistemico } from "./Epistemico";

export function EstruturaDeCenario() {
  const fonte = { font: "500 11px var(--font-interface)" } as const;
  return (
    <figure className="m-0">
      <svg viewBox="0 0 520 150" className="block h-auto w-full" role="img" aria-labelledby="estrutura-cenario-t">
        <title id="estrutura-cenario-t">
          Estrutura de um cenário: do presente, premissas levam a variáveis críticas, que se abrem em
          trajetórias alternativas.
        </title>
        <line x1="8" y1="75" x2="150" y2="75" stroke="var(--color-linha-forte)" />
        <circle cx="8" cy="75" r="5" fill="var(--color-texto)" />
        <text x="2" y="104" textAnchor="start" fill="var(--color-texto-2)" style={fonte}>Presente</text>
        <path d="M150 69 156 75 150 81 144 75Z" fill="none" stroke="var(--color-ambar)" strokeWidth="1.4" />
        <text x="150" y="104" textAnchor="middle" fill="var(--color-texto-2)" style={fonte}>Premissas</text>
        <circle cx="250" cy="75" r="6" fill="none" stroke="var(--color-texto-2)" strokeDasharray="2.4 2" strokeWidth="1.4" />
        <line x1="156" y1="75" x2="244" y2="75" stroke="var(--color-linha-forte)" />
        <text x="250" y="104" textAnchor="middle" fill="var(--color-texto-2)" style={fonte}>Variáveis críticas</text>
        {[
          ["A", 24],
          ["B", 75],
          ["C", 126],
        ].map(([rotulo, y]) => (
          <g key={rotulo}>
            <path d={`M256 75 C 330 75, 340 ${y}, 420 ${y}`} fill="none" stroke="rgb(233 180 91 / 0.6)" strokeDasharray="4 4" strokeWidth="1.3" />
            <path d={`M420 ${Number(y) - 5} 425 ${y} 420 ${Number(y) + 5} 415 ${y}Z`} fill="none" stroke="var(--color-ambar)" strokeWidth="1.3" />
            <text x="434" y={Number(y) + 4} fill="var(--color-texto-2)" style={fonte}>
              Trajetória {rotulo}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="text-micro text-texto-3">Estrutura de referência — sem dados.</figcaption>
    </figure>
  );
}

export type TipoRelacao = "cooperacao" | "competicao" | "conflito" | "dependencia" | "influencia" | "fluxo";

/** Gramática visual das relações entre atores: cada tipo tem traço e cor próprios, nunca só cor. */
export const RELACOES: { tipo: TipoRelacao; rotulo: string; descricao: string; traco: string; seta?: boolean; cor: string; espessura: number }[] = [
  { tipo: "cooperacao", rotulo: "Cooperação / aliança", descricao: "Acordos e alinhamentos declarados", traco: "", cor: "var(--color-ciano)", espessura: 2 },
  { tipo: "competicao", rotulo: "Competição / disputa", descricao: "Interesses em choque, sem confronto aberto", traco: "8 4", cor: "var(--color-texto-2)", espessura: 1.6 },
  { tipo: "conflito", rotulo: "Conflito", descricao: "Confronto aberto, jurídico, político ou armado", traco: "", cor: "var(--color-texto)", espessura: 2.6 },
  { tipo: "dependencia", rotulo: "Dependência", descricao: "Assimetria: a origem depende do destino", traco: "", seta: true, cor: "var(--color-texto-2)", espessura: 1.6 },
  { tipo: "influencia", rotulo: "Influência", descricao: "A origem molda decisões do destino", traco: "6 4", seta: true, cor: "var(--color-ciano)", espessura: 1.6 },
  { tipo: "fluxo", rotulo: "Fluxo", descricao: "Comércio, energia, tecnologia ou capital", traco: "1 5", cor: "var(--color-ciano)", espessura: 2.2 },
];

export function GramaticaDeRelacoes({ tipos }: { tipos?: TipoRelacao[] } = {}) {
  const lista = tipos ? RELACOES.filter((r) => tipos.includes(r.tipo)) : RELACOES;
  return (
    <ul className="flex flex-col gap-3">
      {lista.map((r) => (
        <li key={r.rotulo} className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-4">
          <svg width="72" height="12" viewBox="0 0 72 12" aria-hidden="true">
            <line x1="4" y1="6" x2={r.seta ? 62 : 68} y2="6" stroke={r.cor} strokeWidth={r.espessura} strokeDasharray={r.traco || undefined} strokeLinecap="round" />
            {r.seta && <path d="M60 2 68 6 60 10" fill="none" stroke={r.cor} strokeWidth="1.6" />}
          </svg>
          <span className="min-w-0">
            <span className="block text-corpo text-texto">{r.rotulo}</span>
            <span className="block text-legenda text-texto-2">{r.descricao}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function LegendaEpistemica({ tipos }: { tipos?: TipoEpistemico[] }) {
  const lista = tipos ?? (Object.keys(EPISTEMICO) as TipoEpistemico[]);
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {lista.map((t) => (
        <div key={t} className="grid grid-cols-[18px_minmax(0,1fr)] gap-2">
          <dt className="pt-1">
            <GlifoEpistemico tipo={t} tamanho={16} />
          </dt>
          <dd className="m-0 min-w-0">
            <span className="block text-corpo text-texto">{EPISTEMICO[t].rotulo}</span>
            <span className="block text-legenda text-texto-2">{EPISTEMICO[t].descricao}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
