/**
 * Gramática visual das relações (traço, cor, seta e espessura por tipo) e as legendas de
 * referência. Uma definição só, usada pelo mapa, pelo painel contextual e pelo design system.
 * Não contém dados; por isso é sempre rotulada como estrutura, nunca como resultado.
 */

import { EPISTEMICO, GlifoEpistemico, type TipoEpistemico } from "../common/Epistemico";
import type { TipoRelacao } from "../../types/relacao";
export type { TipoRelacao };

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
