import { BookOpen, Printer } from "lucide-react";
import { useResultado } from "./contexto";
import { Citacoes } from "./pecas";

function dataLegivel(d: string) {
  const [a, m, dia] = d.split("-");
  const meses = ["jan.", "fev.", "mar.", "abr.", "maio", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
  return dia ? `${Number(dia)} ${meses[Number(m) - 1]} ${a}` : a;
}

/**
 * Cabeçalho da investigação, a abertura da seção 01: a pergunta original, o horizonte, o escopo, a data da análise
 * (versão e atualização) e o aviso de contexto.
 * Ações: só as que existem de fato (método no painel; impressão/PDF, que tem folha de estilo
 * própria). Nada de "compartilhar" ou "exportar" sem implementação por trás.
 */
export function CabecalhoDaInvestigacao() {
  const { r, selecionar } = useResultado();
  const botaoMetodo = (
    <button type="button" onClick={() => selecionar({ tipo: "metodo", id: "metodo" })} className="botao botao-secundario botao-pequeno shrink-0 print:hidden">
      <BookOpen size={15} aria-hidden="true" />
      Como esta análise foi feita
    </button>
  );

  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <p className="rotulo">Investigação prospectiva · {r.natureza}</p>
          <h1 className="max-w-[40ch] font-editorial text-[calc(1.5rem*var(--escala-titulo))] leading-[1.25] font-medium sm:text-titulo tracking-[-0.012em] text-balance text-texto">{r.pergunta}</h1>
          <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-legenda text-texto-2">
            <span>
              Horizonte{" "}
              <span className="numeros font-dados text-ambar">
                {r.horizonte.inicio}–{r.horizonte.fim}
              </span>
            </span>
            <span>{r.escopo}</span>
            <span>
              Análise de {dataLegivel(r.atualizadoEm)} · versão {r.versao}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 print:hidden">
          {botaoMetodo}
          <button type="button" onClick={() => window.print()} className="botao botao-fantasma botao-pequeno">
            <Printer size={15} aria-hidden="true" />
            Imprimir ou salvar PDF
          </button>
        </div>
      </div>
      {/* Status epistêmico da investigação inteira: sempre visível, numa linha de apoio. */}
      <p className="max-w-[88ch] border-l-2 border-ambar/50 pl-3 text-legenda text-texto-2">
        <span className="font-medium text-texto">{r.natureza}. </span>
        {r.avisoDeContexto.texto}
        <Citacoes ids={r.avisoDeContexto.evidencias} />
        <span className="text-texto-3"> {r.origem}</span>
      </p>
    </header>
  );
}
