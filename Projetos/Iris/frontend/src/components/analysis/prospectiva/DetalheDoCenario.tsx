/**
 * Detalhe completo de um cenário, em seções recolhíveis: premissas, fatores e gatilhos,
 * consequências no mundo, indicadores, atores, evidências a favor e contra, limitações.
 * Usado no "Cenário em foco" da timeline e no painel contextual (aberto pelos cartões).
 */
import { ArrowRight, ChevronDown, Map as IconeMapa } from "lucide-react";
import { useId, type ReactNode } from "react";
import { Epistemico } from "../../common/Epistemico";
import { MapaMundo } from "../../relations/MapaMundo";
import type { RegiaoId } from "../../relations/geo/regioes-def";
import type { Cenario, Efeito } from "../../../types/cenario";
import { relacaoNaVista, useResultado } from "../investigacao/contexto";
import { ChipAtor, Citacoes, Letra, LinhaAfirmacao } from "../investigacao/pecas";

const EFEITO: Record<Efeito, { rotulo: string; cor: string }> = {
  aproximacao: { rotulo: "Aproximação", cor: "color-mix(in srgb, var(--color-ciano) 46%, transparent)" },
  atrito: { rotulo: "Atrito", cor: "color-mix(in srgb, var(--color-ambar) 50%, transparent)" },
  misto: { rotulo: "Misto", cor: "url(#hachura-misto)" },
  neutro: { rotulo: "Sem mudança", cor: "color-mix(in srgb, var(--color-texto-3) 30%, transparent)" },
};

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
                <rect width="6" height="6" fill="color-mix(in srgb, var(--color-ciano) 40%, transparent)" />
                <rect width="3" height="6" fill="color-mix(in srgb, var(--color-ambar) 50%, transparent)" />
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

/**
 * Detalhe completo de um cenário. Dois lugares, o mesmo componente: a timeline ("Cenário em
 * foco") e o painel contextual (aberto pelos cartões da análise, `embutido`: sem moldura).
 */
export function DetalheDoCenario({ c, embutido = false }: { c: Cenario; embutido?: boolean }) {
  const { r, ix, selecao, setVista, irPara } = useResultado();
  const titulo = useId();
  const mudancas = r.relacoes.filter((x) => relacaoNaVista(x, c.id).mudou).length;
  const atorSel = selecao?.tipo === "ator" ? ix.atores.get(selecao.id) : null;
  return (
    <section aria-labelledby={titulo} className={`aparecer flex flex-col gap-4 ${embutido ? "" : "rounded-painel border border-linha p-4 sm:p-5"}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-micro text-texto-3">
            <Letra id={c.id} ativa /> Detalhes do cenário · <Epistemico tipo="cenario" />
          </p>
          <h3 id={titulo} className="mt-1 font-editorial text-leitura text-texto">
            {c.nome}
          </h3>
          <p className="mt-1 max-w-[70ch] text-legenda text-texto-2">{c.sintese}</p>
        </div>
        <button
          type="button"
          className="botao botao-secundario botao-pequeno"
          onClick={() => {
            setVista(c.id);
            irPara("relacoes");
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
        <Secao titulo="Fatores de mudança e eventos desencadeadores">
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
        <Secao titulo="Indicadores de monitoramento">
          <Indicadores c={c} />
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
        <Secao titulo="Incertezas, limitações e o que invalidaria">
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

/**
 * Sinais que o cenário manda acompanhar. Cada sinal declara a quais cenários favorece ou
 * enfraquece: é isso que permite monitorar os futuros como alternativos, e não como previsões.
 */
function Indicadores({ c }: { c: Cenario }) {
  const { ix } = useResultado();
  const sinais = c.indicadores.map((id) => ix.sinais.get(id)).filter((x) => x !== undefined);
  if (sinais.length === 0) return <p className="text-legenda text-ambar">Nenhum indicador registrado para este cenário.</p>;
  return (
    <ul className="m-0 flex list-none flex-col divide-y divide-linha p-0">
      {sinais.map((s) => (
        <li key={s.id} className="flex flex-col gap-1 py-2.5 first:pt-0">
          <p className="text-legenda font-medium text-texto">{s.sinal}</p>
          <p className="text-legenda text-texto-2">{s.leitura}</p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-texto-3">
            {s.favorece.length > 0 && (
              <span className="inline-flex items-center gap-1">
                favorece {s.favorece.map((x) => <Letra key={x} id={x} ativa={x === c.id} />)}
              </span>
            )}
            {s.enfraquece.length > 0 && (
              <span className="inline-flex items-center gap-1">
                enfraquece {s.enfraquece.map((x) => <Letra key={x} id={x} />)}
              </span>
            )}
            <span>onde: {s.ondeAcompanhar}</span>
            <span>quando: {s.quando}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}
