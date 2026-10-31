/** Peças comuns aos painéis do PainelContextual. */
import { ChevronDown } from "lucide-react";
import { createContext, useContext, type ReactNode } from "react";
import { RELACOES } from "../../../relacoes/components/Gramatica";
import type { CenarioId } from "../../../../types/cenario";
import type { Fonte } from "../../../../types/fonte";
import { useResultado } from "../../contexto";
import { Letra } from "../pecas";

export const ESTILO = new Map(RELACOES.map((x) => [x.tipo, x]));
export const NATUREZA: Record<Fonte["natureza"], string> = {
  primaria: "Fonte primária",
  secundaria: "Fonte secundária",
  terciaria: "Fonte terciária",
};

/** No painel flutuante do mapa, o essencial vem primeiro; o resto fica a um clique. */
export const Compacto = createContext(false);

export function MaisDetalhes({ children }: { children: ReactNode }) {
  const compacto = useContext(Compacto);
  if (!compacto) return <>{children}</>;
  return (
    <details className="group border-t border-linha pt-3">
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between text-legenda text-ciano-texto [&::-webkit-details-marker]:hidden">
        Evidências e detalhes
        <ChevronDown size={15} aria-hidden="true" className="transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-4 pt-2">{children}</div>
    </details>
  );
}

export function Bloco({ n, titulo, children }: { n?: number; titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-t border-linha pt-4">
      <h3 className="flex items-baseline gap-2 text-micro font-medium tracking-[0.06em] text-texto-3 uppercase">
        {n !== undefined && <span className="numeros font-dados">{n}</span>}
        {titulo}
      </h3>
      {children}
    </section>
  );
}

/** Lista de evidências como botões que abrem a cadeia completa. */
export function ListaDeEvidencias({ ids }: { ids: string[] }) {
  const { ix, selecionar } = useResultado();
  const unicos = [...new Set(ids)];
  if (unicos.length === 0) return <p className="text-legenda text-ambar">Nenhuma evidência vinculada. Trate como interpretação a confirmar.</p>;
  return (
    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
      {unicos.map((id) => {
        const e = ix.evidencias.get(id);
        if (!e) return null;
        return (
          <li key={id}>
            <button type="button" onClick={() => selecionar({ tipo: "evidencia", id })} className="flex w-full items-start gap-2 rounded-padrao border border-linha p-2.5 text-left text-legenda text-texto hover:border-linha-forte">
              <span className="min-w-0 flex-1">{e.afirmacao}</span>
              <span className="shrink-0 font-dados text-micro text-ciano-texto">[{e.fontes.map((f) => ix.numero.get(f)).join(",")}]</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function Implicacoes({ textos }: { textos: Record<CenarioId, string> }) {
  const { vista } = useResultado();
  return (
    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
      {(Object.keys(textos) as CenarioId[]).map((c) => (
        <li key={c} className={`flex gap-2 rounded-padrao p-2 text-legenda ${vista === c ? "bg-ciano-suave text-texto" : "text-texto-2"}`}>
          <Letra id={c} ativa={vista === c} />
          <span className="min-w-0">{textos[c]}</span>
        </li>
      ))}
    </ul>
  );
}
