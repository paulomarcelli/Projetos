import { BookOpen, ChevronDown, Printer } from "lucide-react";
import { useState } from "react";
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
  // O aviso fica numa linha; a origem e as fontes abrem sob demanda (e sempre saem na impressão).
  const [contextoAberto, setContextoAberto] = useState(false);
  const botaoMetodo = (
    <button type="button" onClick={() => selecionar({ tipo: "metodo", id: "metodo" })} className="botao botao-secundario botao-pequeno shrink-0 print:hidden">
      <BookOpen size={15} aria-hidden="true" />
      Como esta análise foi feita
    </button>
  );

  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* Natureza, versão e data numa linha só: o contexto da leitura sem ocupar a primeira tela. */}
          <p className="rotulo">
            Investigação prospectiva · {r.natureza} · versão {r.versao} · {dataLegivel(r.atualizadoEm)}
          </p>
          <h1 className="max-w-[52ch] font-editorial text-[calc(1.375rem*var(--escala-titulo))] leading-[1.3] font-medium tracking-[-0.01em] text-balance text-texto sm:text-[calc(1.5rem*var(--escala-titulo))]">
            {r.pergunta}
          </h1>
          <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-legenda text-texto-2">
            <span>
              Horizonte{" "}
              <span className="numeros font-dados text-ambar">
                {r.horizonte.inicio}–{r.horizonte.fim}
              </span>
            </span>
            <span>{r.escopo}</span>
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
      {/* Status epistêmico da investigação inteira: sempre visível, numa faixa âmbar de uma linha. A origem e as fontes
          abrem em "Ver contexto" e saem sempre na impressão. */}
      <div className="max-w-[96ch] rounded-padrao bg-ambar-suave px-3 py-2 text-legenda text-texto-2">
        <p className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
          <span className="font-medium text-ambar">{r.natureza}</span>
          {/* no celular o texto desce para a linha de baixo; do sm em diante fica entre o rótulo e o botão */}
          <span className="order-last min-w-0 basis-full sm:order-none sm:basis-auto sm:flex-1">
            {r.avisoDeContexto.texto}
            <Citacoes ids={r.avisoDeContexto.evidencias} />
          </span>
          <button
            type="button"
            aria-expanded={contextoAberto}
            aria-controls="contexto-da-investigacao"
            onClick={() => setContextoAberto((v) => !v)}
            className="inline-flex min-h-8 items-center gap-1 text-legenda font-medium whitespace-nowrap text-ciano-texto hover:underline print:hidden"
          >
            {contextoAberto ? "Ocultar contexto" : "Ver contexto"}
            <ChevronDown size={14} aria-hidden="true" className={`transition-transform duration-200 ${contextoAberto ? "rotate-180" : ""}`} />
          </button>
        </p>
        <p id="contexto-da-investigacao" className={`mt-1.5 text-texto-3 ${contextoAberto ? "" : "hidden print:block"}`}>
          {r.origem}
        </p>
      </div>
    </header>
  );
}
