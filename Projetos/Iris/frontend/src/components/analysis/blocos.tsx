/** Peças de composição da área de análise (seção, parte, link para outra área). */
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

/** Seção da análise: título editorial e, à direita, uma nota ou ação. Sem caixa nem linha. */
export function Bloco({ id, titulo, children, acao, descricao }: { id: string; titulo: string; children: ReactNode; acao?: ReactNode; descricao?: string }) {
  return (
    <section id={`sec-${id}`} aria-labelledby={id} className="flex scroll-mt-28 flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="flex max-w-[68ch] flex-col gap-1.5">
          <h2 id={id} className="font-editorial text-titulo font-medium tracking-[-0.01em] text-texto">
            {titulo}
          </h2>
          {descricao && <p className="text-corpo text-texto-2">{descricao}</p>}
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}

/** Subtítulo dentro de uma seção (h3), para as partes de "O que determina". */
export function Parte({ id, titulo, children, acao }: { id: string; titulo: string; children: ReactNode; acao?: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-4">
      <h3 id={id} className="text-leitura font-medium text-texto">
        {titulo}
      </h3>
      {children}
      {acao}
    </section>
  );
}

export function LinkDeArea({ children, aoClicar }: { children: ReactNode; aoClicar: () => void }) {
  return (
    <button type="button" onClick={aoClicar} className="group inline-flex min-h-9 w-fit items-center gap-1 text-legenda text-ciano-texto hover:underline">
      {children}
      <ArrowRight size={14} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5" />
    </button>
  );
}
