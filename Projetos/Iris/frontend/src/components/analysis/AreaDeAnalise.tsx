/**
 * Área "Análise": o ponto de entrada da investigação. Tudo numa só página, sem abas internas
 * nem acordeões, na ordem em que um analista lê:
 *   B. Em síntese                → o fenômeno em 30–60 s, com horizonte, principal incerteza e
 *                                  os futuros considerados ao lado;
 *   C. O que determina           → fatores (estado atual e por que importa), o que ainda não se
 *                                  sabe, quem age e os eventos mais recentes;
 *   D. Três futuros possíveis    → os três cenários lado a lado, com o essencial visível;
 *   E. Comparação                → matriz das incertezas, direções dos fatores, sinais de
 *                                  alerta e linha do tempo compartilhada;
 *   F. Evidências e fontes       → área técnica própria, recolhida no fim.
 * (A, o cabeçalho, está em features/investigacao/components/CabecalhoDaInvestigacao.tsx.)
 *
 * Regra de densidade: o essencial sempre visível; o complementar compacto (uma linha por item);
 * o aprofundamento a um clique, no painel contextual (ator, evento, evidência, cenário).
 * A densidade é resolvida por estrutura, nunca encolhendo a letra: nada aqui fica abaixo do
 * token "micro" (13 px no tamanho padrão).
 *
 * Origem dos dados: tudo vem do resultado da investigação (`r`). A ordem dos atores é contável
 * (relações registradas) e não é apresentada como importância. Nenhuma probabilidade.
 */
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useResultado } from "./investigacao/contexto";
import { AreaDeEvidencias } from "./evidencias/Evidencias";
import { Bloco } from "./blocos";
import { Determinantes } from "./Determinantes";
import { ComparacaoDosCenarios } from "./prospectiva/ComparacaoDeCenarios";
import { TresCenarios } from "./prospectiva/TresCenarios";

/**
 * Índice da análise, em uma linha: cada item leva à sua seção (âncora real; a rolagem suave vem
 * do CSS e respeita "reduzir movimento"). Texto, não fichas: navegação, não filtro.
 */
function Indice() {
  const { r } = useResultado();
  const itens: [string, string, number | null][] = [
    ["sec-t-sintese", "Síntese", null],
    ["sec-t-fatores", "Fatores", r.variaveis.length],
    ["sec-t-cenarios", "Cenários", r.cenarios.length],
    ["sec-t-comparacao", "Comparação", null],
    ["t-fontes", "Evidências", r.evidencias.length],
  ];
  return (
    <nav aria-label="Nesta análise" className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-corpo">
      <span className="text-legenda text-texto-3">Nesta análise</span>
      {itens.map(([alvo, nome, n]) => (
        <a key={alvo} href={`#${alvo}`} className="inline-flex min-h-9 items-center gap-1.5 text-texto-2 underline-offset-4 transition-colors duration-150 hover:text-texto hover:underline">
          {nome}
          {n !== null && <span className="numeros text-legenda text-texto-3">{n}</span>}
        </a>
      ))}
    </nav>
  );
}

/**
 * B. Síntese executiva: o fenômeno em texto editorial e, ao lado, os três dados que situam a
 * leitura (horizonte, principal incerteza, futuros considerados). Lê-se em menos de um minuto.
 */
function Sintese() {
  const { r, vista, setVista } = useResultado();
  const principal = r.incertezas.find((i) => i.id === r.principalIncerteza);
  return (
    <section id="sec-t-sintese" aria-labelledby="t-sintese" className="grid scroll-mt-28 gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="flex flex-col gap-3 lg:col-span-8">
        <h2 id="t-sintese" className="rotulo">
          Em síntese
        </h2>
        <p className="max-w-[62ch] font-editorial text-secao leading-[1.55] text-texto">{r.sintese}</p>
      </div>
      <dl className="m-0 flex flex-col gap-5 lg:col-span-4 lg:border-l lg:border-linha lg:pl-8">
        <div className="flex flex-col gap-1">
          <dt className="text-micro font-medium text-texto-3">Horizonte</dt>
          <dd className="m-0 text-corpo text-texto">
            <span className="numeros font-dados text-ambar">
              {r.horizonte.inicio}–{r.horizonte.fim}
            </span>{" "}
            · {r.escopo}
          </dd>
        </div>
        {principal && (
          <div className="flex flex-col gap-1">
            <dt className="text-micro font-medium text-texto-3">Principal incerteza</dt>
            <dd className="m-0 text-corpo text-texto">{principal.pergunta}</dd>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <dt className="text-micro font-medium text-texto-3">Futuros considerados</dt>
          <dd className="m-0 flex flex-col gap-1">
            {r.cenarios.map((c) => (
              <a
                key={c.id}
                href="#sec-t-cenarios"
                onClick={() => setVista(c.id)}
                className={`w-fit text-corpo underline-offset-4 hover:underline ${vista === c.id ? "text-ciano-texto" : "text-texto"}`}
              >
                <span className="font-dados text-ambar">{c.id}</span> {c.nome}
              </a>
            ))}
            <span className="text-micro text-texto-3">Alternativos, sem probabilidade atribuída.</span>
          </dd>
        </div>
      </dl>
    </section>
  );
}

/** F. Evidências recolhidas: a verificação está a um clique, sem ocupar a leitura. */
function Fontes({ abertaInicial }: { abertaInicial: boolean }) {
  const { r } = useResultado();
  const [aberta, setAberta] = useState(abertaInicial);
  return (
    <section aria-labelledby="t-fontes" className="scroll-mt-28 rounded-painel bg-grafite/35 px-5 py-2 sm:px-6">
      <h2 id="t-fontes" className="m-0">
        <button
          type="button"
          aria-expanded={aberta}
          aria-controls="conteudo-fontes"
          onClick={() => setAberta((x) => !x)}
          className="flex min-h-16 w-full items-center justify-between gap-3 py-2 text-left"
        >
          <span className="flex flex-col gap-0.5">
            <span className="font-editorial text-secao text-texto">Evidências e fontes</span>
            <span className="text-legenda text-texto-3">
              {r.evidencias.length} afirmações rastreadas até {r.fontes.length} fontes
            </span>
          </span>
          <ChevronDown size={20} aria-hidden="true" className={`shrink-0 text-texto-3 transition-transform duration-200 ${aberta ? "rotate-180" : ""}`} />
        </button>
      </h2>
      {aberta && (
        <div id="conteudo-fontes" className="pt-4 pb-6">
          <AreaDeEvidencias />
        </div>
      )}
    </section>
  );
}

export function AreaDeAnalise({ fontesAbertas = false }: { fontesAbertas?: boolean }) {
  return (
    <div className="flex flex-col gap-16 pt-2 lg:gap-20">
      <div className="flex flex-col gap-10">
        <Indice />
        <Sintese />
      </div>
      <Determinantes />
      <Bloco
        id="t-cenarios"
        titulo="Três futuros possíveis"
        descricao="Os três lado a lado, com o essencial de cada um. O detalhe completo abre ao lado, sem sair da página."
        acao={<p className="text-legenda text-texto-3">Alternativos, sem probabilidade atribuída</p>}
      >
        <TresCenarios />
      </Bloco>
      <Bloco id="t-comparacao" titulo="Comparação entre os cenários">
        <ComparacaoDosCenarios />
      </Bloco>
      <Fontes abertaInicial={fontesAbertas} />
    </div>
  );
}
