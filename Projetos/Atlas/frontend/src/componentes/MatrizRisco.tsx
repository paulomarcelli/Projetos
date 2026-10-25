import type { ItemMatriz, Nivel } from "../api/tipos";
import { CENARIO, NIVEL } from "../lib/rotulos";
import { SeloNivel } from "./Selos";

const NIVEIS: Nivel[] = ["baixo", "moderado", "alto"];
const PESO: Record<Nivel, number> = { baixo: 0, moderado: 1, alto: 2 };

function tom(p: Nivel, i: Nivel) {
  const s = PESO[p] + PESO[i];
  return s >= 3 ? "bg-alto/15" : s === 2 ? "bg-moderado/10" : "bg-baixo/[0.07]";
}

/** Matriz qualitativa 3×3 (probabilidade × impacto). Classificações, não percentuais. */
export function MatrizRisco({ itens }: { itens: ItemMatriz[] }) {
  const numerados = itens.map((it, i) => ({ ...it, n: i + 1 }));
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_1fr]">
      <div className="grid grid-cols-[1.6rem_repeat(3,1fr)] grid-rows-[repeat(3,minmax(74px,auto))_1.6rem] gap-1" role="table" aria-label="Matriz de probabilidade e impacto">
        {[...NIVEIS].reverse().map((p) => (
          <div key={p} className="contents" role="row">
            <div className="flex items-center justify-center text-2xs text-suave [writing-mode:vertical-rl] rotate-180" role="rowheader">{NIVEL[p]}</div>
            {NIVEIS.map((im) => {
              const aqui = numerados.filter((x) => x.probabilidade === p && x.impacto === im);
              return (
                <div key={im} role="cell" aria-label={`Probabilidade ${p}, impacto ${im}: ${aqui.length} itens`} className={`flex flex-wrap content-start gap-1 rounded-md border border-borda p-1.5 ${tom(p, im)}`}>
                  {aqui.map((x) => (
                    <span key={x.n} title={x.titulo} className={`grid h-7 min-w-7 place-items-center rounded-full px-1.5 font-mono text-xs font-medium ${x.tipo === "risco" ? "bg-alto/90 text-fundo" : "bg-baixo/90 text-fundo"}`}>
                      {x.tipo === "risco" ? "R" : "O"}{x.n}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
        <div />
        {NIVEIS.map((im) => <div key={im} className="text-center text-2xs text-suave">{NIVEL[im]}</div>)}
        <p className="col-span-4 mt-1 text-center text-2xs text-suave">Eixo vertical: probabilidade · horizontal: impacto</p>
      </div>
      {numerados.length === 0 ? (
        <p className="text-sm text-suave">Nenhum risco ou oportunidade foi identificado.</p>
      ) : (
        <ul className="space-y-2">
          {numerados.map((x) => (
            <li key={x.n} className="rounded-lg border border-borda bg-fundo/40 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-mono text-xs font-semibold ${x.tipo === "risco" ? "text-alto" : "text-baixo"}`}>{x.tipo === "risco" ? "Risco" : "Oportunidade"} {x.tipo === "risco" ? "R" : "O"}{x.n}</span>
                <SeloNivel nivel={x.probabilidade} prefixo="Prob." />
                <SeloNivel nivel={x.impacto} prefixo="Impacto" />
              </div>
              <p className="mt-1.5 text-sm font-medium quebra">{x.titulo}</p>
              <p className="mt-0.5 text-sm text-suave quebra">{x.justificativa}</p>
              {x.cenarios.length > 0 && <p className="mt-1 text-xs text-suave">Cenários: {x.cenarios.map((c) => CENARIO[c].rotulo).join(", ")}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
