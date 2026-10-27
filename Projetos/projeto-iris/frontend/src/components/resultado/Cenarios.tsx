import { ArrowDown, ArrowRight, Map as IconeMapa } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Epistemico } from "../Epistemico";
import { MapaMundo } from "../MapaMundo";
import type { RegiaoId } from "../../geo/regioes-def";
import type { Cenario, CenarioId, Efeito } from "../../lib/investigacao";
import { relacaoNaVista, useResultado } from "./contexto";
import { ChipAtor, Citacoes, Letra, LinhaAfirmacao, Rotulo } from "./pecas";

const EFEITO: Record<Efeito, { rotulo: string; cor: string }> = {
  aproximacao: { rotulo: "Aproximação", cor: "rgb(82 199 232 / 0.46)" },
  atrito: { rotulo: "Atrito", cor: "rgb(233 180 91 / 0.5)" },
  misto: { rotulo: "Misto", cor: "url(#hachura-misto)" },
  neutro: { rotulo: "Sem mudança relevante", cor: "rgb(154 170 192 / 0.3)" },
};

/** Lógica dos cenários: a matriz das duas incertezas críticas. */
export function LogicaDosCenarios() {
  const { r, vista, setVista } = useResultado();
  const [i1, i2] = r.incertezas;
  const celula = (c: Cenario | undefined, extra = "") =>
    c ? (
      <button
        type="button"
        onClick={() => setVista(c.id)}
        aria-pressed={vista === c.id}
        className={`flex min-h-24 flex-col items-start gap-1 rounded-padrao border p-3 text-left transition-colors ${extra} ${
          vista === c.id ? "border-ambar/60 bg-ambar-suave" : "border-linha hover:border-linha-forte"
        }`}
      >
        <span className="flex items-center gap-2">
          <Letra id={c.id} ativa={vista === c.id} />
          <span className="text-micro text-texto-3">{c.arquetipo}</span>
        </span>
        <span className="font-editorial text-corpo text-texto">{c.nome}</span>
      </button>
    ) : null;
  const porPos = (a: 0 | 1, b: 0 | 1) => r.cenarios.find((c) => (c.posicao[i1.id] === a || c.posicao[i1.id] === null) && c.posicao[i2.id] === b);
  const c00 = porPos(0, 0);
  const c10 = porPos(1, 0);
  const cAberto = r.cenarios.find((c) => c.posicao[i2.id] === 1 && c.posicao[i1.id] === null);
  return (
    <figure className="m-0 flex flex-col gap-3">
      <div className="grid grid-cols-[1.75rem_minmax(0,1fr)_minmax(0,1fr)] gap-2">
        <span />
        <p className="text-center text-micro text-texto-3">{i1.polos[0]}</p>
        <p className="text-center text-micro text-texto-3">{i1.polos[1]}</p>
        <p className="row-span-2 flex items-center justify-center text-micro text-texto-3 [writing-mode:vertical-rl] rotate-180">{i2.nome}</p>
        {celula(c00)}
        {celula(c10)}
        {cAberto ? celula(cAberto, "col-span-2") : null}
      </div>
      <figcaption className="flex flex-col gap-1 text-micro text-texto-3">
        <span>
          Eixo horizontal: <span className="text-texto-2">{i1.nome}</span>. Eixo vertical: <span className="text-texto-2">{i2.nome}</span> (contido em cima, aberto embaixo).
        </span>
        {r.quadranteNaoDesenvolvido && <span>{r.quadranteNaoDesenvolvido}</span>}
      </figcaption>
    </figure>
  );
}

function Secao({ titulo, children, aberta = false }: { titulo: string; children: ReactNode; aberta?: boolean }) {
  return (
    <details open={aberta} className="group border-t border-linha">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-2 text-corpo text-texto hover:text-ciano-texto [&::-webkit-details-marker]:hidden">
        {titulo}
        <ArrowDown size={15} aria-hidden="true" className="shrink-0 text-texto-3 transition-transform group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-3 pb-5">{children}</div>
    </details>
  );
}

function CadeiaCausal({ m }: { m: Cenario["mecanismos"][number] }) {
  const caixa = (rotulo: string, texto: string) => (
    <div className="min-w-0 flex-1 rounded-padrao border border-linha p-2.5">
      <p className="text-micro text-texto-3">{rotulo}</p>
      <p className="text-legenda text-texto">{texto}</p>
    </div>
  );
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-stretch">
        {caixa("Condição", m.condicao)}
        <ArrowRight size={14} aria-hidden="true" className="shrink-0 self-center text-texto-3 max-sm:rotate-90" />
        {caixa("Mecanismo", m.mecanismo)}
        <ArrowRight size={14} aria-hidden="true" className="shrink-0 self-center text-texto-3 max-sm:rotate-90" />
        {caixa("Consequência", m.consequencia)}
      </div>
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
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
      <figure className="m-0 flex min-w-0 flex-col gap-2">
        <div className="rounded-padrao border border-linha p-2">
          <MapaMundo
            rotulo={`Consequências geopolíticas do cenário ${c.id} por região`}
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
        <figcaption className="flex flex-col gap-1.5">
          <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0">
            {(Object.keys(EFEITO) as Efeito[]).map((e) => (
              <li key={e} className="inline-flex items-center gap-1.5 text-micro text-texto-2">
                <svg width="14" height="10" aria-hidden="true">
                  <defs>
                    <pattern id={`leg-${e}`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <rect width="4" height="4" fill="rgb(82 199 232 / 0.6)" />
                      <rect width="2" height="4" fill="rgb(233 180 91 / 0.8)" />
                    </pattern>
                  </defs>
                  <rect x="0.5" y="0.5" width="13" height="9" rx="2" fill={e === "misto" ? `url(#leg-${e})` : EFEITO[e].cor} stroke="rgb(154 170 192 / 0.4)" />
                </svg>
                {EFEITO[e].rotulo}
              </li>
            ))}
          </ul>
          <p className="text-micro text-texto-3">As cores pintam regiões inteiras: “China” colore toda a Ásia-Pacífico. O contorno branco é o Brasil.</p>
        </figcaption>
      </figure>
      <ul className="m-0 flex list-none flex-col divide-y divide-linha p-0">
        {c.consequencias.map((e) => (
          <li key={e.regiao} className="flex flex-col gap-0.5 py-2.5 first:pt-0">
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
  const { r, ix, selecao, selecionar, setVista, irPara } = useResultado();
  const mudancas = r.relacoes.map((x) => relacaoNaVista(x, c.id)).filter((x) => x.mudou);
  const atorSel = selecao?.tipo === "ator" ? ix.atores.get(selecao.id) : null;
  return (
    <article className="flex flex-col gap-5" aria-labelledby={`cen-${c.id}`}>
      <header className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <Letra id={c.id} ativa tamanho="grande" />
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-texto-3">
              <span className="rotulo">{c.arquetipo}</span>
              <span className="numeros font-dados text-ambar">
                {r.horizonte.inicio}–{r.horizonte.fim}
              </span>
              <Epistemico tipo="cenario" />
            </p>
            <h3 id={`cen-${c.id}`} className="mt-1 font-editorial text-secao text-texto">
              {c.nome}
            </h3>
          </div>
        </div>
        <p className="max-w-[68ch] font-editorial text-leitura text-texto">{c.sintese}</p>
        <p className="text-micro text-texto-3">Sem probabilidade atribuída: não há método nem dados que a sustentem.</p>
      </header>

      {atorSel && (
        <div className="flex flex-wrap items-start gap-3 rounded-padrao border border-ciano/35 bg-ciano-suave p-3">
          <div className="min-w-0 flex-1">
            <p className="text-micro text-ciano-texto">Ator selecionado no mapa</p>
            <p className="text-legenda text-texto">
              <span className="font-medium">{atorSel.curto}</span> neste cenário: {atorSel.implicacoes[c.id]}
            </p>
          </div>
          <button type="button" className="botao botao-fantasma botao-pequeno" onClick={() => selecionar({ tipo: "ator", id: atorSel.id })}>
            Abrir ator
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-padrao border border-linha p-3">
        <p className="text-legenda text-texto-2">
          <span className="numeros font-dados text-ambar">{mudancas.length}</span> de {r.relacoes.length} relações mudam em relação ao presente.
        </p>
        <button
          type="button"
          className="botao botao-secundario botao-pequeno"
          onClick={() => {
            setVista(c.id);
            irPara("sistema");
          }}
        >
          <IconeMapa size={14} aria-hidden="true" />
          Ver no mapa
        </button>
      </div>

      <div>
        <Secao titulo="Premissas fundamentais" aberta>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {c.premissas.map((p, i) => (
              <li key={i}>
                <LinhaAfirmacao a={p} compacta />
              </li>
            ))}
          </ul>
        </Secao>
        <Secao titulo="Mecanismos causais" aberta>
          {c.mecanismos.map((m, i) => (
            <CadeiaCausal key={i} m={m} />
          ))}
        </Secao>
        <Secao titulo="Tendências relevantes">
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {c.tendencias.map((t, i) => (
              <li key={i}>
                <LinhaAfirmacao a={t} compacta />
              </li>
            ))}
          </ul>
        </Secao>
        <Secao titulo="Variáveis e incertezas críticas">
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {r.variaveis.map((v) => (
              <li key={v.id} className="grid gap-1 text-legenda sm:grid-cols-[12rem_minmax(0,1fr)]">
                <span className="text-texto-2">{v.nome}</span>
                <span className="text-texto">{v.direcao[c.id]}</span>
              </li>
            ))}
          </ul>
          <Rotulo>Incertezas deste cenário</Rotulo>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {c.incertezas.map((t) => (
              <li key={t} className="flex gap-2 text-legenda text-texto">
                <Epistemico tipo="incerteza" compacto /> {t}
              </li>
            ))}
          </ul>
        </Secao>
        <Secao titulo="Atores decisivos">
          <div className="flex flex-wrap gap-1.5">{c.atoresDecisivos.map((a) => <ChipAtor key={a} id={a} />)}</div>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {c.atoresDecisivos.map((a) => (
              <li key={a} className="text-legenda text-texto-2">
                <span className="text-texto">{ix.atores.get(a)?.curto}:</span> {ix.atores.get(a)?.implicacoes[c.id]}
              </li>
            ))}
          </ul>
        </Secao>
        <Secao titulo="Eventos desencadeadores e condições necessárias">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Rotulo>Gatilhos</Rotulo>
              <ul className="m-0 flex list-none flex-col gap-1 p-0 text-legenda text-texto">
                {c.gatilhos.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
            <div>
              <Rotulo>Condições necessárias</Rotulo>
              <ul className="m-0 flex list-none flex-col gap-1 p-0 text-legenda text-texto">
                {c.condicoes.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
          </div>
        </Secao>
        <Secao titulo="Consequências geopolíticas">
          <EfeitosNoMundo c={c} />
        </Secao>
        <Secao titulo="Indicadores de acompanhamento">
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {c.indicadores.map((sid) => {
              const s = ix.sinais.get(sid)!;
              return (
                <li key={sid} className="rounded-padrao border border-linha p-3 text-legenda">
                  <p className="text-texto">{s.sinal}</p>
                  <p className="text-texto-2">{s.leitura}</p>
                  <p className="mt-1 text-micro text-texto-3">
                    {s.ondeAcompanhar} · {s.quando}
                  </p>
                </li>
              );
            })}
          </ul>
        </Secao>
        <Secao titulo="Evidências favoráveis e contrárias">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Rotulo>Favoráveis</Rotulo>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {c.favoraveis.map((a, i) => (
                  <li key={i}>
                    <LinhaAfirmacao a={a} compacta />
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Rotulo>Contrárias</Rotulo>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {c.contrarias.map((a, i) => (
                  <li key={i}>
                    <LinhaAfirmacao a={a} compacta />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Secao>
        <Secao titulo="Limitações e condições de revisão">
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {c.limitacoes.map((t) => (
              <li key={t} className="flex gap-2 text-legenda text-texto">
                <Epistemico tipo="limitacao" compacto /> {t}
              </li>
            ))}
          </ul>
          <Rotulo>Revisar ou descartar este cenário se</Rotulo>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {c.revisao.map((t) => (
              <li key={t} className="text-legenda text-texto">
                {t}
              </li>
            ))}
          </ul>
        </Secao>
      </div>
    </article>
  );
}

function Comparacao() {
  const { r, ix, vista, setVista } = useResultado();
  const [i1, i2] = r.incertezas;
  const linhas: { rotulo: string; valor: (c: Cenario) => ReactNode; grupo?: string }[] = [
    { rotulo: "Arquétipo", valor: (c) => c.arquetipo },
    { rotulo: "Síntese", valor: (c) => c.sintese },
    { rotulo: i1.nome, valor: (c) => (c.posicao[i1.id] === null ? "Indiferente" : i1.polos[c.posicao[i1.id]!]), grupo: "Incertezas críticas" },
    { rotulo: i2.nome, valor: (c) => (c.posicao[i2.id] === null ? "Indiferente" : i2.polos[c.posicao[i2.id]!]) },
    ...r.variaveis.map((v, i) => ({ rotulo: v.nome, valor: (c: Cenario) => v.direcao[c.id], grupo: i === 0 ? "Variáveis" : undefined })),
    { rotulo: "Atores decisivos", valor: (c) => c.atoresDecisivos.map((a) => ix.atores.get(a)?.curto).join(", "), grupo: "Dinâmica" },
    { rotulo: "Mecanismo principal", valor: (c) => `${c.mecanismos[0].condicao} → ${c.mecanismos[0].consequencia}` },
    { rotulo: "Gatilho", valor: (c) => c.gatilhos[0] },
    { rotulo: "Condição necessária", valor: (c) => c.condicoes[0] },
    { rotulo: "Relações que mudam", valor: (c) => `${r.relacoes.filter((x) => relacaoNaVista(x, c.id).mudou).length} de ${r.relacoes.length}` },
    { rotulo: "Indicador decisivo", valor: (c) => ix.sinais.get(c.indicadores[0])?.sinal, grupo: "Fundamentação" },
    { rotulo: "Evidência contrária", valor: (c) => <LinhaAfirmacao a={c.contrarias[0]} compacta /> },
    { rotulo: "Revisar se", valor: (c) => c.revisao[0] },
  ];
  return (
    <div className="relative overflow-x-auto rounded-padrao border border-linha" tabIndex={0} role="region" aria-label="Comparação dos cenários pelos mesmos critérios">
      <table className="w-full min-w-[760px] border-collapse text-left text-legenda">
        <caption className="sr-only">Comparação dos cenários A, B e C pelos mesmos critérios</caption>
        <thead>
          <tr className="bg-institucional">
            <th scope="col" className="w-44 border-b border-linha p-3 font-normal text-texto-3">
              Critério
            </th>
            {r.cenarios.map((c) => (
              <th key={c.id} scope="col" className={`border-b border-l border-linha p-3 font-normal ${vista === c.id ? "bg-ambar-suave" : ""}`}>
                <button type="button" onClick={() => setVista(c.id)} className="flex items-center gap-2 text-left text-texto hover:text-ambar">
                  <Letra id={c.id} ativa={vista === c.id} /> {c.nome}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <FragmentoLinha key={l.rotulo} grupo={l.grupo} colunas={r.cenarios.length + 1}>
              <tr className="border-b border-linha align-top">
                <th scope="row" className="p-3 font-normal text-texto-2">
                  {l.rotulo}
                </th>
                {r.cenarios.map((c) => (
                  <td key={c.id} className={`border-l border-linha p-3 text-texto ${vista === c.id ? "bg-ambar-suave" : ""}`}>
                    {l.valor(c)}
                  </td>
                ))}
              </tr>
            </FragmentoLinha>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FragmentoLinha({ grupo, colunas, children }: { grupo?: string; colunas: number; children: ReactNode }) {
  return (
    <>
      {grupo && (
        <tr>
          <th colSpan={colunas} scope="colgroup" className="border-b border-linha bg-grafite/50 px-3 py-1.5 text-micro font-medium tracking-[0.06em] text-texto-3 uppercase">
            {grupo}
          </th>
        </tr>
      )}
      {children}
    </>
  );
}

export function AreaDeCenarios() {
  const { r, vista, setVista, irPara } = useResultado();
  const [modo, setModo] = useState<"detalhar" | "comparar">("detalhar");
  const atual: CenarioId = vista === "presente" ? "A" : vista;
  const c = r.cenarios.find((x) => x.id === atual)!;
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="t-logica" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        <div className="flex flex-col gap-2">
          <h2 id="t-logica" className="font-editorial text-secao text-texto">
            Lógica dos cenários
          </h2>
          <p className="max-w-[60ch] text-legenda text-texto-2">
            Os cenários não são três narrativas soltas: saem do cruzamento de duas incertezas críticas. Cada célula é um futuro condicional, não uma previsão.
          </p>
          <ul className="m-0 mt-1 flex list-none flex-col gap-1.5 p-0">
            {r.incertezas.map((i) => (
              <li key={i.id} className="text-legenda text-texto">
                {i.nome}
                <span className="text-texto-2">: {i.pergunta}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="mt-1 w-fit text-legenda text-ciano-texto hover:underline" onClick={() => irPara("fatores")}>
            Ver as incertezas e as evidências em Fatores de mudança
          </button>
        </div>
        <LogicaDosCenarios />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-linha-forte pt-5">
        <div role="group" aria-label="Modo de leitura" className="flex flex-wrap gap-1.5">
          {(
            [
              ["detalhar", "Detalhar um cenário"],
              ["comparar", "Comparar A, B e C"],
            ] as const
          ).map(([m, nome]) => (
            <button key={m} type="button" className="ficha min-h-9" aria-pressed={modo === m} onClick={() => setModo(m)}>
              {nome}
            </button>
          ))}
        </div>
        {modo === "detalhar" && (
          <div role="group" aria-label="Cenário detalhado" className="flex gap-1.5">
            {r.cenarios.map((x) => (
              <button key={x.id} type="button" className="ficha min-h-9" aria-pressed={atual === x.id} onClick={() => setVista(x.id)} title={x.nome}>
                <span className="font-dados">{x.id}</span>
                <span className="hidden sm:inline">{x.arquetipo}</span>
                <span className="sr-only">: {x.nome}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {modo === "detalhar" ? <DetalheDoCenario c={c} /> : <Comparacao />}
    </div>
  );
}
