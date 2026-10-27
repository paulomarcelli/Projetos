import { ArrowRight, ChevronDown, Columns3, Map as IconeMapa } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Epistemico } from "../Epistemico";
import { MapaMundo } from "../MapaMundo";
import type { RegiaoId } from "../../geo/regioes-def";
import type { Cenario, CenarioId, Efeito } from "../../lib/investigacao";
import { relacaoNaVista, useResultado } from "./contexto";
import { ChipAtor, Citacoes, Letra, LinhaAfirmacao } from "./pecas";

const EFEITO: Record<Efeito, { rotulo: string; cor: string }> = {
  aproximacao: { rotulo: "Aproximação", cor: "rgb(82 199 232 / 0.46)" },
  atrito: { rotulo: "Atrito", cor: "rgb(233 180 91 / 0.5)" },
  misto: { rotulo: "Misto", cor: "url(#hachura-misto)" },
  neutro: { rotulo: "Sem mudança", cor: "rgb(154 170 192 / 0.3)" },
};

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

// ------------------------------------------------------------------ cartão de cenário

function CartaoCenario({ c, ativo, aoAbrir }: { c: Cenario; ativo: boolean; aoAbrir: () => void }) {
  const { r, ix } = useResultado();
  return (
    <article
      aria-labelledby={`nome-${c.id}`}
      className={`flex h-full flex-col gap-3 rounded-painel border p-4 transition-[border-color,background-color] duration-200 ${
        ativo ? "border-ambar/55 bg-ambar-suave" : "border-linha bg-institucional hover:border-linha-forte"
      }`}
    >
      <header className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-micro text-texto-3">
          <Letra id={c.id} ativa={ativo} /> {c.arquetipo}
        </span>
        <span className="numeros font-dados text-micro text-ambar">
          {r.horizonte.inicio}–{r.horizonte.fim}
        </span>
      </header>
      <h3 id={`nome-${c.id}`} className="font-editorial text-secao text-texto">
        {c.nome}
      </h3>
      <p className="text-corpo text-texto">{c.ideia}</p>
      <div className="flex flex-col gap-1">
        <p className="text-micro text-texto-3">Impacto principal</p>
        <p className="text-legenda text-texto-2">{c.impacto}</p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-micro text-texto-3">Sinais a observar</p>
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {c.indicadores.slice(0, 2).map((sid) => (
            <li key={sid} className="flex gap-2 text-legenda text-texto-2">
              <span aria-hidden="true" className="mt-[0.55em] h-px w-2.5 shrink-0 bg-ambar" />
              {ix.sinais.get(sid)?.sinal}
            </li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={aoAbrir}
        aria-expanded={ativo}
        aria-controls="detalhe-cenario"
        className="botao botao-fantasma botao-pequeno mt-auto w-fit"
      >
        {ativo ? "Detalhes abertos abaixo" : "Ver detalhes"}
        <ChevronDown size={14} aria-hidden="true" className={`transition-transform duration-200 ${ativo ? "rotate-180" : ""}`} />
      </button>
    </article>
  );
}

// ------------------------------------------------------------------ detalhe (sob demanda)

function Secao({ titulo, children, aberta = false }: { titulo: string; children: ReactNode; aberta?: boolean }) {
  return (
    <details open={aberta} className="group border-t border-linha">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-2 text-corpo text-texto hover:text-ciano-texto [&::-webkit-details-marker]:hidden">
        {titulo}
        <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-texto-3 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-3 pb-5">{children}</div>
    </details>
  );
}

function CadeiaCausal({ m }: { m: Cenario["mecanismos"][number] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-legenda text-texto">
        <span>{m.condicao}</span>
        <ArrowRight size={13} aria-hidden="true" className="text-texto-3" />
        <span className="text-texto-2">{m.mecanismo}</span>
        <ArrowRight size={13} aria-hidden="true" className="text-texto-3" />
        <span>{m.consequencia}</span>
      </p>
      <p className="flex flex-wrap items-center gap-1 text-micro">
        <Epistemico tipo={m.tipo} />
        <Citacoes ids={m.evidencias} />
      </p>
    </div>
  );
}

function EfeitosNoMundo({ c }: { c: Cenario }) {
  const porRegiao = new Map<RegiaoId, Efeito>();
  for (const e of c.consequencias) for (const g of e.regioes) if (!porRegiao.has(g)) porRegiao.set(g, e.efeito);
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start">
      <figure className="m-0 flex min-w-0 flex-col gap-2">
        <div className="rounded-padrao border border-linha p-2">
          <MapaMundo
            rotulo={`Consequências do cenário ${c.id} por região: ${c.consequencias.map((e) => `${e.regiao}, ${EFEITO[e.efeito].rotulo}`).join("; ")}`}
            corDaRegiao={(g) => (g && porRegiao.has(g) ? EFEITO[porRegiao.get(g)!].cor : undefined)}
            destaque={["076"]}
            defs={
              <pattern id="hachura-misto" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" fill="rgb(82 199 232 / 0.4)" />
                <rect width="3" height="6" fill="rgb(233 180 91 / 0.5)" />
              </pattern>
            }
          />
        </div>
        <figcaption className="text-micro text-texto-3">Cores por região inteira. Contorno branco: Brasil.</figcaption>
      </figure>
      <ul className="m-0 flex list-none flex-col divide-y divide-linha p-0">
        {c.consequencias.map((e) => (
          <li key={e.regiao} className="flex flex-col gap-0.5 py-2 first:pt-0">
            <span className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-legenda font-medium text-texto">{e.regiao}</span>
              <span className={`rounded-full border px-2 text-micro ${e.efeito === "aproximacao" ? "border-ciano/40 text-ciano-texto" : e.efeito === "atrito" ? "border-ambar/40 text-ambar" : "border-linha-forte text-texto-2"}`}>
                {EFEITO[e.efeito].rotulo}
              </span>
            </span>
            <span className="text-legenda text-texto-2">{e.texto}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DetalheDoCenario({ c }: { c: Cenario }) {
  const { r, ix, selecao, setVista, irPara } = useResultado();
  const mudancas = r.relacoes.filter((x) => relacaoNaVista(x, c.id).mudou).length;
  const atorSel = selecao?.tipo === "ator" ? ix.atores.get(selecao.id) : null;
  return (
    <section id="detalhe-cenario" aria-labelledby="t-detalhe" className="aparecer flex flex-col gap-4 rounded-painel border border-linha p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-micro text-texto-3">
            <Letra id={c.id} ativa /> Detalhes do cenário · <Epistemico tipo="cenario" />
          </p>
          <h3 id="t-detalhe" className="mt-1 font-editorial text-leitura text-texto">
            {c.nome}
          </h3>
          <p className="mt-1 max-w-[70ch] text-legenda text-texto-2">{c.sintese}</p>
        </div>
        <button
          type="button"
          className="botao botao-secundario botao-pequeno"
          onClick={() => {
            setVista(c.id);
            irPara("visao");
          }}
        >
          <IconeMapa size={14} aria-hidden="true" />
          Ver no mapa ({mudancas} mudanças)
        </button>
      </header>

      {atorSel && (
        <p className="rounded-padrao border border-ciano/35 bg-ciano-suave px-3 py-2 text-legenda text-texto">
          <span className="text-ciano-texto">{atorSel.curto} neste cenário:</span> {atorSel.implicacoes[c.id]}
        </p>
      )}

      <div>
        <Secao titulo="Premissas" aberta>
          {c.premissas.map((p, i) => (
            <LinhaAfirmacao key={i} a={p} compacta />
          ))}
        </Secao>
        <Secao titulo="Como chegaria lá: mecanismos e gatilhos">
          {c.mecanismos.map((m, i) => (
            <CadeiaCausal key={i} m={m} />
          ))}
          <p className="text-legenda text-texto-2">
            <span className="text-texto-3">Gatilhos: </span>
            {c.gatilhos.join("; ")}. <span className="text-texto-3">Condições: </span>
            {c.condicoes.join("; ")}.
          </p>
        </Secao>
        <Secao titulo="Consequências no mundo">
          <EfeitosNoMundo c={c} />
        </Secao>
        <Secao titulo="Atores decisivos">
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {c.atoresDecisivos.map((a) => (
              <li key={a} className="flex flex-wrap items-baseline gap-2 text-legenda text-texto-2">
                <ChipAtor id={a} /> {ix.atores.get(a)?.implicacoes[c.id]}
              </li>
            ))}
          </ul>
        </Secao>
        <Secao titulo="Evidências a favor e contra">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-3">
              <p className="text-micro text-texto-3">A favor</p>
              {c.favoraveis.map((a, i) => (
                <LinhaAfirmacao key={i} a={a} compacta />
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-micro text-texto-3">Contra</p>
              {c.contrarias.map((a, i) => (
                <LinhaAfirmacao key={i} a={a} compacta />
              ))}
            </div>
          </div>
        </Secao>
        <Secao titulo="Variáveis, tendências e incertezas">
          <dl className="m-0 grid gap-x-4 gap-y-1.5 text-legenda sm:grid-cols-[12rem_minmax(0,1fr)]">
            {r.variaveis.map((v) => (
              <div key={v.id} className="contents">
                <dt className="text-texto-3">{v.nome}</dt>
                <dd className="m-0 text-texto">{v.direcao[c.id]}</dd>
              </div>
            ))}
          </dl>
          {c.tendencias.map((t, i) => (
            <LinhaAfirmacao key={i} a={t} compacta />
          ))}
          <p className="text-legenda text-texto-2">
            <span className="text-texto-3">Incertezas: </span>
            {c.incertezas.join("; ")}.
          </p>
        </Secao>
        <Secao titulo="Limitações e quando rever">
          <ul className="m-0 flex list-none flex-col gap-1 p-0 text-legenda text-texto">
            {c.limitacoes.map((t) => (
              <li key={t} className="flex gap-2">
                <Epistemico tipo="limitacao" compacto /> {t}
              </li>
            ))}
          </ul>
          <p className="text-legenda text-texto-2">
            <span className="text-texto-3">Rever se: </span>
            {c.revisao.join("; ")}.
          </p>
        </Secao>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ comparação

function Comparacao() {
  const { r, ix, vista } = useResultado();
  const linhas: { rotulo: string; valor: (c: Cenario) => ReactNode }[] = [
    { rotulo: "Ideia central", valor: (c) => c.ideia },
    { rotulo: "Impacto principal", valor: (c) => c.impacto },
    ...r.variaveis.map((v) => ({ rotulo: v.nome, valor: (c: Cenario) => v.direcao[c.id] })),
    { rotulo: "Atores decisivos", valor: (c) => c.atoresDecisivos.map((a) => ix.atores.get(a)?.curto).join(", ") },
    { rotulo: "Gatilho", valor: (c) => c.gatilhos[0] },
    { rotulo: "Sinal decisivo", valor: (c) => ix.sinais.get(c.indicadores[0])?.sinal },
    { rotulo: "Rever se", valor: (c) => c.revisao[0] },
  ];
  return (
    <div className="relative overflow-x-auto rounded-padrao border border-linha" tabIndex={0} role="region" aria-label="Comparação dos cenários pelos mesmos critérios">
      <table className="w-full min-w-[720px] border-collapse text-left text-legenda">
        <caption className="sr-only">Comparação dos cenários A, B e C pelos mesmos critérios</caption>
        <thead>
          <tr className="bg-institucional">
            <th scope="col" className="w-40 border-b border-linha p-3 font-normal text-texto-3">
              Critério
            </th>
            {r.cenarios.map((c) => (
              <th key={c.id} scope="col" className={`border-b border-l border-linha p-3 font-normal text-texto ${vista === c.id ? "bg-ambar-suave" : ""}`}>
                <span className="flex items-center gap-2">
                  <Letra id={c.id} ativa={vista === c.id} /> {c.nome}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.rotulo} className="border-b border-linha align-top">
              <th scope="row" className="p-3 font-normal text-texto-2">
                {l.rotulo}
              </th>
              {r.cenarios.map((c) => (
                <td key={c.id} className={`border-l border-linha p-3 text-texto ${vista === c.id ? "bg-ambar-suave" : ""}`}>
                  {l.valor(c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ------------------------------------------------------------------ área

export function AreaDeCenarios() {
  const { r, vista, setVista } = useResultado();
  const [comparar, setComparar] = useState(false);
  const aberto: CenarioId | null = vista === "presente" ? null : vista;
  const c = aberto ? r.cenarios.find((x) => x.id === aberto)! : null;
  return (
    <div className="flex flex-col gap-6">
      <FatoresDecisivos />

      <section aria-labelledby="t-cenarios" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="t-cenarios" className="rotulo">
            Três futuros condicionais · sem probabilidade atribuída
          </h2>
          <button type="button" className="ficha min-h-9" aria-pressed={comparar} onClick={() => setComparar((x) => !x)}>
            <Columns3 size={14} aria-hidden="true" />
            Comparar lado a lado
          </button>
        </div>
        {comparar ? (
          <Comparacao />
        ) : (
          <ol className="m-0 grid list-none gap-3 p-0 lg:grid-cols-3">
            {r.cenarios.map((x) => (
              <li key={x.id}>
                <CartaoCenario c={x} ativo={aberto === x.id} aoAbrir={() => setVista(aberto === x.id ? "presente" : x.id)} />
              </li>
            ))}
          </ol>
        )}
      </section>

      {c && !comparar && <DetalheDoCenario key={c.id} c={c} />}
    </div>
  );
}
