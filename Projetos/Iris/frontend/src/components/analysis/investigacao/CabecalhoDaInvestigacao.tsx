import { BookOpen, Printer } from "lucide-react";
import { useResultado } from "./contexto";

/**
 * Cabeçalho da investigação: só o rótulo ("Iris · Investigação prospectiva") e a pergunta. A tela de análise está sendo
 * refeita por partes, e a abertura fica no essencial: o que foi perguntado.
 * Ações: só as que existem de fato (o método, no painel; impressão/PDF, que tem folha de estilo própria). A origem do
 * exemplo e as fontes ficam em "Como esta análise foi feita".
 */
export function CabecalhoDaInvestigacao() {
  const { r, selecionar } = useResultado();
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <p className="text-micro font-medium tracking-[0.12em] text-texto-3 uppercase">Iris · Investigação prospectiva</p>
        <h1 className="max-w-[30ch] font-editorial text-[calc(1.75rem*var(--escala-titulo))] leading-[1.18] font-medium tracking-[-0.015em] text-balance text-texto sm:text-[calc(2.125rem*var(--escala-titulo))]">
          {r.pergunta}
        </h1>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 print:hidden">
        <button type="button" onClick={() => selecionar({ tipo: "metodo", id: "metodo" })} className="botao botao-secundario botao-pequeno">
          <BookOpen size={15} aria-hidden="true" />
          Como esta análise foi feita
        </button>
        <button type="button" onClick={() => window.print()} className="botao botao-fantasma botao-pequeno">
          <Printer size={15} aria-hidden="true" />
          Imprimir ou salvar PDF
        </button>
      </div>
    </header>
  );
}
