/**
 * Legenda do mapa de relações. Também filtra: cada tipo de relação liga e desliga a sua camada, e
 * cada bloco destaca os seus membros. Fica embaixo do mapa, para não cobrir nada.
 */
import { List } from "lucide-react";
import type { Bloco } from "../../../types/investigacao";
import type { Vista } from "../../../types/cenario";
import type { TipoRelacao } from "./Gramatica";
import { RELACOES } from "./Gramatica";

export function LegendaDoMapa({
  presentes,
  ocultas,
  aoAlternarTipo,
  bases,
  blocos,
  blocoAtivo,
  vista,
  nome,
  aoEscolherBloco,
  listaAberta,
  aoAlternarLista,
}: {
  presentes: typeof RELACOES;
  ocultas: Set<TipoRelacao>;
  aoAlternarTipo: (t: TipoRelacao) => void;
  bases: Set<string>;
  blocos: Bloco[];
  blocoAtivo: string | null;
  vista: Vista;
  nome: (id: string) => string;
  aoEscolherBloco: (b: Bloco) => void;
  listaAberta: boolean;
  aoAlternarLista: () => void;
}) {
  return (
      <div className="flex flex-col gap-1.5 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-4">
        <div role="group" aria-label="Tipos de relação (clique para ocultar ou mostrar)" className="relative -mx-1 flex items-center gap-0.5 overflow-x-auto px-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
          {presentes.map((e) => {
            const ativa = !ocultas.has(e.tipo);
            return (
              <button
                key={e.tipo}
                type="button"
                aria-pressed={ativa}
                title={`${e.rotulo}: ${e.descricao}. Clique para ${ativa ? "ocultar" : "mostrar"}.`}
                onClick={() => aoAlternarTipo(e.tipo)}
                className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-fino px-2 text-micro whitespace-nowrap transition-opacity duration-150 hover:bg-grafite ${ativa ? "text-texto" : "text-texto-3 line-through opacity-55"}`}
              >
                <svg width="20" height="8" aria-hidden="true">
                  <line x1="1" y1="4" x2={e.seta ? 14 : 19} y2="4" stroke={e.cor} strokeWidth={e.espessura} strokeDasharray={e.traco || undefined} strokeLinecap="round" />
                  {e.seta && <path d="M13 1 18 4 13 7" fill="none" stroke={e.cor} strokeWidth="1.5" />}
                </svg>
                {e.rotulo.split(" / ")[0]}
              </button>
            );
          })}
          {(["inferida", "condicional"] as const)
            .filter((b) => bases.has(b))
            .map((b) => (
              <span key={b} className="inline-flex min-h-8 shrink-0 items-center gap-1 px-1.5 text-micro whitespace-nowrap text-texto-2" title={b === "inferida" ? "Interpretação do analista, sem fonte direta" : "Só vale dentro do cenário"}>
                <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
                  {b === "inferida" ? (
                    <circle cx="6" cy="6" r="4" fill="none" stroke="var(--color-texto-2)" strokeWidth="1.3" strokeDasharray="2 1.6" />
                  ) : (
                    <path d="M6 1.5 10.5 6 6 10.5 1.5 6Z" fill="none" stroke="var(--color-ambar)" strokeWidth="1.3" />
                  )}
                </svg>
                {b === "inferida" ? "inferida" : "hipótese"}
              </span>
            ))}
        </div>
        <div className="flex min-w-0 items-center gap-2 lg:flex-1">
          {blocos.length > 0 && (
            <div role="group" aria-label="Blocos: destacar os membros no mapa" className="relative -mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 lg:mx-0 lg:flex-none lg:px-0">
              <span className="shrink-0 pr-0.5 text-micro text-texto-3">Blocos</span>
              {blocos.map((b) => {
                const ativo = blocoAtivo === b.id;
                const n = b.membros[vista].length;
                const delta = n - b.membros.presente.length;
                return (
                  <button
                    key={b.id}
                    type="button"
                    aria-pressed={ativo}
                    onClick={() => aoEscolherBloco(b)}
                    title={`${b.nome}: ${b.membros[vista].map(nome).join(", ")}`}
                    className={`inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-micro whitespace-nowrap transition-colors duration-150 ${
                      ativo ? "border-ciano/60 bg-ciano-suave text-ciano-texto" : "border-linha text-texto-2 hover:border-linha-forte hover:text-texto"
                    }`}
                  >
                    <span aria-hidden="true" className="size-2.5 rounded-[3px] border border-ciano/60 bg-[repeating-linear-gradient(45deg,color-mix(in_srgb,var(--color-ciano-texto)_55%,transparent)_0_1px,transparent_1px_3px)]" />
                    {b.nome.replace(" das Américas", "")}
                    <span className="numeros font-dados text-texto-3" aria-label={`${n} membros`}>
                      {n}
                    </span>
                    {delta !== 0 && (
                      <span className="numeros font-dados text-ambar" aria-label={`${delta > 0 ? "ganha" : "perde"} ${Math.abs(delta)} neste cenário`}>
                        {delta > 0 ? `+${delta}` : `−${-delta}`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <button
            type="button"
            aria-expanded={listaAberta}
            onClick={aoAlternarLista}
            className="ml-auto inline-flex min-h-8 shrink-0 items-center gap-1 rounded-fino px-2 text-micro text-texto-2 hover:bg-grafite"
            title="Lista de relações em texto"
          >
            <List size={13} aria-hidden="true" /> Lista
          </button>
        </div>
      </div>
  );
}
