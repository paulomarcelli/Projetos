import type { AnaliseProspectiva } from "../../types/api";
import { SeloEpistemico, cx } from "../ui";
import { ListaDeChips } from "./Evidencias";

export interface RespostaDaAnaliseProps {
  analise: AnaliseProspectiva;
  className?: string;
}

/** A resposta da F.R.E.Y.A. como no chat: parágrafos corridos, cada um com seu tipo epistêmico e as evidências que cita. */
export function RespostaDaAnalise({ analise: a, className }: RespostaDaAnaliseProps) {
  const paragrafos = a.resposta ?? [];
  return (
    <article aria-label="Resposta da F.R.E.Y.A." className={cx("flex items-start gap-4", className)}>
      <span className="fr-avatar hidden shrink-0 sm:grid" aria-hidden="true">
        F
      </span>
      <div className="min-w-0 flex-1 rounded-3xl rounded-tl-lg border border-vidro-borda bg-vidro px-5 py-5 shadow-baixa backdrop-blur-vidro sm:px-6">
        <p className="mb-4 text-xs text-texto-fraco">
          F.R.E.Y.A. respondeu{a.modelo ? ` · ${a.modelo}` : a.modo === "deterministico" ? " · sem modelo de linguagem" : ""}
        </p>
        <div className="flex flex-col gap-5">
          {paragrafos.map((p, i) => (
            <div key={i} data-tipo-epistemico={p.tipo}>
              <p className="text-[0.9375rem] leading-relaxed text-pretty text-texto">{p.texto}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <SeloEpistemico tipo={p.tipo} compacto />
                <ListaDeChips ids={p.evidencias} />
              </div>
            </div>
          ))}
        </div>
        {a.limitacoes.length > 0 && (
          <details className="mt-6 border-t border-borda pt-3 text-sm text-texto-suave">
            <summary className="cursor-pointer text-xs text-texto-fraco select-none">Limites desta análise ({a.limitacoes.length})</summary>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
              {a.limitacoes.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </article>
  );
}
