import { BookOpen, Printer } from "lucide-react";
import { useResultado } from "./contexto";
import { Citacoes } from "./pecas";

function dataLegivel(d: string) {
  const [a, m, dia] = d.split("-");
  const meses = ["jan.", "fev.", "mar.", "abr.", "maio", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
  return dia ? `${Number(dia)} ${meses[Number(m) - 1]} ${a}` : a;
}

/**
 * Cabeçalho da investigação. No mapa e na timeline ele encolhe para uma linha (pergunta
 * truncada, com o texto completo no `title`), porque ali a prioridade é a visualização; na análise
 * mostra a pergunta inteira, o horizonte, a versão e o aviso de contexto.
 * Ações: só as que existem de fato (método no painel; impressão/PDF, que tem folha de estilo
 * própria). Nada de "compartilhar" ou "exportar" sem implementação por trás.
 */
export function CabecalhoDaInvestigacao() {
  const { r, aba, selecionar } = useResultado();
  // Nas duas visualizações (mapa e timeline) o cabeçalho encolhe: a tela é delas.
  const compacto = aba !== "analise";
  const botaoMetodo = (
    <button type="button" onClick={() => selecionar({ tipo: "metodo", id: "metodo" })} className="botao botao-secundario botao-pequeno shrink-0 print:hidden">
      <BookOpen size={15} aria-hidden="true" />
      Como esta análise foi feita
    </button>
  );

  if (compacto) {
    return (
      // No celular, título e botão empilham: a pergunta usa a largura toda antes de truncar.
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="min-w-0 sm:flex-1">
          <p className="rotulo">
            Investigação prospectiva · <span className="numeros font-dados text-ambar">{r.horizonte.inicio}–{r.horizonte.fim}</span>
          </p>
          <h1 className="truncate font-editorial text-leitura text-texto sm:text-secao" title={r.pergunta}>
            {r.pergunta}
          </h1>
        </div>
        {botaoMetodo}
      </header>
    );
  }

  return (
    <header className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <p className="rotulo">Investigação prospectiva · {r.natureza}</p>
          <h1 className="max-w-[40ch] font-editorial text-titulo font-medium tracking-[-0.012em] text-balance text-texto">{r.pergunta}</h1>
          <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-legenda text-texto-2">
            <span>
              Horizonte{" "}
              <span className="numeros font-dados text-ambar">
                {r.horizonte.inicio}–{r.horizonte.fim}
              </span>
            </span>
            {/* O escopo fica na síntese (ao lado do horizonte); aqui, só o que situa a versão. */}
            <span>
              Versão {r.versao}, atualizada em {dataLegivel(r.atualizadoEm)}
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
