/**
 * Linha de entrega da turma (docs/design-system.md): tipo e título, equipe e o que a entrega usa da investigação,
 * prazo em mono e o estado. "Entregue" é estado real e fica em verde; os outros dois ficam neutros.
 */
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { NOME_DO_TIPO, type Entrega, type EstadoDaEntrega } from "../../types/observatorio";
import { dataDoDia } from "./Versao";

const ESTADO: Record<EstadoDaEntrega, string> = { andamento: "Em andamento", revisao: "Em revisão", entregue: "Entregue" };

/** "2026-11-28" vira "28/11". */
const diaEMes = (d: string) => dataDoDia(d).slice(0, 5);

export function LinhaDeEntrega({ e, acao }: { e: Entrega; acao?: ReactNode }) {
  const entregue = e.estado === "entregue";
  return (
    <li className="flex flex-col gap-2 border-b border-linha px-4 py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="m-0 text-corpo text-texto">
          {NOME_DO_TIPO[e.tipo]} · {e.titulo}
        </p>
        <p className="m-0 text-legenda text-texto-3">
          {e.equipe} · {e.base}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <span className="numeros font-dados text-micro text-texto-2">{entregue ? diaEMes(e.prazo) : `até ${diaEMes(e.prazo)}`}</span>
        <span
          className={`inline-flex min-h-6 items-center gap-1 rounded-full border px-2.5 text-micro ${
            entregue ? "border-positivo/60 text-positivo" : "border-linha-forte text-texto-2"
          }`}
        >
          {entregue && <Check size={13} aria-hidden="true" />}
          {ESTADO[e.estado]}
        </span>
        {acao}
      </div>
    </li>
  );
}
