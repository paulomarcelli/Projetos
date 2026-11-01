import { BookOpen, ChevronDown, Printer } from "lucide-react";
import { useState } from "react";
import { useResultado } from "./contexto";
import { irParaSecao } from "./secoes";
import { Citacoes } from "./pecas";

function dataLegivel(d: string) {
  const [a, m, dia] = d.split("-");
  const meses = ["jan.", "fev.", "mar.", "abr.", "maio", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
  return dia ? `${Number(dia)} ${meses[Number(m) - 1]} ${a}` : a;
}

/**
 * Cabeçalho da investigação, a abertura da seção 01: a pergunta original, o escopo, a data da análise (versão e
 * atualização), o aviso de contexto e a investigação em números (horizonte, cenários, incertezas, sinais, evidências).
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
          <p className="text-legenda text-texto-2">{r.escopo}</p>
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
          <span className="order-last min-w-0 basis-full sm:order-none sm:basis-0 sm:flex-1">
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
      <FaixaDeNumeros />
    </header>
  );
}

/**
 * A investigação em números, numa faixa: horizonte, cenários, incertezas críticas, sinais a observar e evidências.
 * Números grandes, rótulos pequenos e filetes entre eles, sem caixas (a cor fica no dado: o ouro no horizonte).
 * Cada número leva ao lugar onde o conjunto está; todos vêm do próprio resultado, nada é estimado.
 */
function FaixaDeNumeros() {
  const { r, irPara } = useResultado();
  const itens: { rotulo: string; valor: string; ouro?: boolean; ir?: () => void; destino?: string }[] = [
    { rotulo: "Horizonte", valor: `${r.horizonte.inicio}–${r.horizonte.fim}`, ouro: true },
    {
      rotulo: r.cenarios.length === 1 ? "Cenário" : "Cenários",
      valor: String(r.cenarios.length),
      ir: () => irParaSecao("sec-cenarios"),
      destino: "02 Cenários",
    },
    {
      rotulo: r.incertezas.length === 1 ? "Incerteza crítica" : "Incertezas críticas",
      valor: String(r.incertezas.length),
      ir: () => irParaSecao("sec-diagnostico"),
      destino: "01 Diagnóstico",
    },
    { rotulo: "Sinais a observar", valor: String(r.sinais.length), ir: () => irParaSecao("sec-monitoramento"), destino: "04 Monitoramento" },
    { rotulo: "Evidências", valor: String(r.evidencias.length), ir: () => irPara("evidencias"), destino: "05 Evidências e fontes" },
  ];
  return (
    <ul aria-label="A investigação em números" className="m-0 grid list-none p-0 grid-cols-2 border-y border-linha sm:grid-cols-3 lg:grid-cols-5">
      {itens.map((x, i) => {
        const conteudo = (
          <>
            <span className="text-micro text-texto-3">{x.rotulo}</span>
            <span className={`font-dados text-[calc(1.375rem*var(--escala-titulo))] leading-tight numeros ${x.ouro ? "text-ouro" : "text-texto"}`}>
              {x.valor}
            </span>
          </>
        );
        // filete à esquerda de cada número, menos o primeiro de cada linha
        const filete = i === 0 ? "" : "lg:border-l lg:border-linha";
        return x.ir ? (
          <li key={x.rotulo} className={`flex ${filete}`}>
            <button
              type="button"
              onClick={x.ir}
              aria-label={`${x.valor} ${x.rotulo.toLowerCase()}: ir para ${x.destino}`}
              className="group flex w-full flex-col items-start gap-1 py-3 pr-4 text-left lg:px-4 transition-colors duration-150 hover:bg-grafite/40 print:pointer-events-none"
            >
              {conteudo}
            </button>
          </li>
        ) : (
          <li key={x.rotulo} className={`flex flex-col gap-1 py-3 pr-4 lg:px-4 lg:first:pl-0 ${filete}`}>
            {conteudo}
          </li>
        );
      })}
    </ul>
  );
}
