/**
 * Área "Timeline prospectiva" da investigação, de cima para baixo:
 *   1. a timeline (visualização; o passado e as três faixas de cenário);
 *   2. o cenário em foco: o detalhe (DetalheDoCenario) ou a comparação lado a lado;
 *   3. o que separa os futuros: as incertezas críticas e onde cada cenário se posiciona.
 * O cenário em foco é a `vista` do estado compartilhado: é o mesmo que o mapa e a análise mostram.
 */
import { Columns3 } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Cenario } from "../../../types/cenario";
import { DetalheDoCenario } from "../../prospectiva/components/DetalheDoCenario";
import { TabelaComparativa } from "../../prospectiva/components/TabelaComparativa";
import { useResultado } from "../../investigacao/contexto";
import { Letra, LinhaAfirmacao } from "../../investigacao/components/pecas";
import { TimelineProspectiva } from "./TimelineProspectiva";

// ------------------------------------------------------------------ fatores que definem os cenários

/** As duas incertezas críticas, como barras com a posição de cada cenário. */
function FatoresDecisivos() {
  const { r, vista, setVista } = useResultado();
  return (
    <section aria-labelledby="t-fatores" className="flex flex-col gap-3">
      <h2 id="t-fatores" className="rotulo">
        O que separa os futuros
      </h2>
      <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
        {r.incertezas.map((i) => {
          const em = (polo: 0 | 1) => r.cenarios.filter((c) => c.posicao[i.id] === polo);
          const indiferentes = r.cenarios.filter((c) => c.posicao[i.id] === null);
          return (
            <li key={i.id} className="flex flex-col gap-2.5 rounded-padrao border border-linha p-3.5">
              <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-corpo font-medium text-texto">{i.nome}</span>
                {i.id === r.principalIncerteza && <span className="text-micro text-ambar">principal</span>}
              </p>
              <div className="relative h-7" aria-hidden="true">
                <span className="absolute inset-x-3 top-1/2 h-px bg-linha-forte" />
                {([0, 1] as const).map((polo) => (
                  <span key={polo} className={`absolute top-1/2 flex -translate-y-1/2 gap-1 ${polo === 0 ? "left-0" : "right-0"}`}>
                    {em(polo).map((c) => (
                      <Letra key={c.id} id={c.id} ativa={vista === c.id} />
                    ))}
                  </span>
                ))}
              </div>
              <div className="flex justify-between gap-4 text-micro text-texto-2">
                <span className="max-w-[46%]">{i.polos[0]}</span>
                <span className="max-w-[46%] text-right">{i.polos[1]}</span>
              </div>
              <p className="sr-only">
                {i.polos[0]}: cenários {em(0).map((c) => c.id).join(", ") || "nenhum"}. {i.polos[1]}: cenários {em(1).map((c) => c.id).join(", ") || "nenhum"}.
              </p>
              {indiferentes.length > 0 && (
                <p className="text-micro text-texto-3">
                  {indiferentes.map((c) => (
                    <button key={c.id} type="button" onClick={() => setVista(c.id)} className="mr-1 align-middle">
                      <Letra id={c.id} ativa={vista === c.id} />
                    </button>
                  ))}
                  não depende deste fator.
                </p>
              )}
              <details>
                <summary className="cursor-pointer text-micro text-texto-3 hover:text-texto-2">Por que este fator</summary>
                <div className="pt-2">
                  <LinhaAfirmacao a={i.porQue} compacta />
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ------------------------------------------------------------------ comparação

/** Comparação lado a lado na timeline: a mesma tabela da análise (TresCenarios), outros critérios. */
function Comparacao() {
  const { r, ix } = useResultado();
  const linhas: { rotulo: string; valor: (c: Cenario) => ReactNode }[] = [
    { rotulo: "Ideia central", valor: (c) => c.ideia },
    { rotulo: "Impacto principal", valor: (c) => c.impacto },
    ...r.variaveis.map((v) => ({ rotulo: v.nome, valor: (c: Cenario) => v.direcao[c.id] })),
    { rotulo: "Atores decisivos", valor: (c) => c.atoresDecisivos.map((a) => ix.atores.get(a)?.curto).join(", ") },
    { rotulo: "Gatilho", valor: (c) => c.gatilhos[0] },
    { rotulo: "Sinal decisivo", valor: (c) => ix.sinais.get(c.indicadores[0])?.sinal },
    { rotulo: "Rever se", valor: (c) => c.revisao[0] },
  ];
  return <TabelaComparativa linhas={linhas} legenda="Comparação dos cenários A, B e C pelos mesmos critérios" />;
}

// ------------------------------------------------------------------ área

/**
 * Área "Timeline prospectiva": a visualização do tempo (TimelineProspectiva) e, abaixo, o
 * cenário em foco. Os cenários vivem aqui (e não numa aba própria) porque um cenário É uma
 * trajetória no tempo: escolher uma faixa na timeline e ler o seu detalhe são o mesmo gesto.
 * Abaixo do detalhe, "O que separa os futuros" mostra as incertezas que distinguem as faixas.
 */
export function AreaDaTimeline() {
  const { r, vista, setVista } = useResultado();
  const [comparar, setComparar] = useState(false);
  const c = vista === "presente" ? null : r.cenarios.find((x) => x.id === vista)!;
  return (
    <div className="flex flex-col gap-12">
      <TimelineProspectiva />

      <section aria-labelledby="t-cenario-foco" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="t-cenario-foco" className="font-editorial text-secao text-texto">
            Cenário em foco
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Escolher o cenário" className="flex flex-wrap gap-1.5">
              {r.cenarios.map((x) => (
                <button key={x.id} type="button" className="ficha min-h-9" aria-pressed={vista === x.id} onClick={() => (setComparar(false), setVista(x.id))}>
                  <span className="font-dados">{x.id}</span>
                  <span className="hidden sm:inline">{x.nome}</span>
                  <span className="sr-only sm:hidden">: {x.nome}</span>
                </button>
              ))}
            </div>
            <button type="button" className="ficha min-h-9" aria-pressed={comparar} onClick={() => setComparar((v) => !v)}>
              <Columns3 size={14} aria-hidden="true" />
              Comparar lado a lado
            </button>
          </div>
        </div>
        {comparar ? (
          <Comparacao />
        ) : c ? (
          <DetalheDoCenario key={c.id} c={c} />
        ) : (
          <p className="rounded-padrao bg-grafite/40 px-4 py-3 text-corpo text-texto-2">
            Escolha uma faixa na timeline, ou um cenário acima, para ler premissas, gatilhos, consequências e indicadores.
          </p>
        )}
      </section>

      <FatoresDecisivos />
    </div>
  );
}
