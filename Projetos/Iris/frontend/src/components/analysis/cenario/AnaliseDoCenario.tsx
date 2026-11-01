/**
 * Análise do Cenário: o segundo nível da investigação. Cada cenário é tratado como um objeto de inteligência próprio,
 * conectado à análise original, com tese, lógica causal, trajetória no tempo, dinâmicas, consequências, pontos de
 * inflexão, indicadores, premissas e vulnerabilidades.
 *
 * Regra de honestidade: aprofundar não é inventar detalhe. Tudo aqui vem do próprio resultado da investigação (o
 * cenário, as relações entre atores, a linha do tempo, os sinais e as evidências), montado de outro jeito: nada é
 * estimado nem completado. Cada afirmação mantém o tipo (fato, inferência, hipótese) e as fontes. Quando o motor
 * existir, ele recupera o raciocínio que originou o cenário e aprofunda pelo mesmo contrato
 * (docs/CONTRATO-ANALISE-DO-CENARIO.md); a tela não muda.
 */
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { IMPACTO } from "../../../config/semantica";
import { ROTAS } from "../../../config/rotas";
import type { Cenario, CenarioId, Efeito } from "../../../types/cenario";
import type { EventoTempo } from "../../../types/evento";
import type { Mudanca } from "../../../types/relacao";
import { Epistemico } from "../../common/Epistemico";
import { Etiqueta } from "../../common/Etiqueta";
import { Frase, NomeDoAtor } from "../conversa/resposta/partes";
import { useResultado } from "../investigacao/contexto";
import { Citacoes, Letra } from "../investigacao/pecas";
import { RotuloDeSecao } from "../secoes/RotuloDeSecao";

/** As oito partes, na ordem em que um analista aprofunda um futuro. O índice e os testes usam esta lista. */
export const PARTES_DO_CENARIO = [
  { id: "cen-tese", numero: "1", nome: "Tese do cenário", pergunta: "Qual futuro está sendo descrito?" },
  { id: "cen-logica", numero: "2", nome: "Lógica de evolução", pergunta: "Por que e como ele poderia acontecer?" },
  { id: "cen-trajetoria", numero: "3", nome: "Desenvolvimento temporal", pergunta: "Como ele evolui ao longo do horizonte?" },
  { id: "cen-dinamicas", numero: "4", nome: "Dinâmicas estratégicas", pergunta: "Quem age, com que interesses, e o que muda entre eles?" },
  { id: "cen-consequencias", numero: "5", nome: "Consequências", pergunta: "Quais impactos ele produz, e onde?" },
  { id: "cen-inflexao", numero: "6", nome: "Pontos de inflexão", pergunta: "O que pode acelerar, desviar ou interromper a trajetória?" },
  { id: "cen-indicadores", numero: "7", nome: "Indicadores", pergunta: "Quais sinais devemos acompanhar?" },
  { id: "cen-premissas", numero: "8", nome: "Premissas e vulnerabilidades", pergunta: "O que sustenta este cenário e onde o raciocínio pode falhar?" },
] as const;

const EFEITO: Record<Efeito, { rotulo: string; simbolo: string; cor: string }> = {
  aproximacao: { rotulo: "aproximação", simbolo: "+", cor: "text-ciano-texto" },
  atrito: { rotulo: "atrito", simbolo: "!", cor: "text-ambar" },
  misto: { rotulo: "misto", simbolo: "±", cor: "text-texto-2" },
  neutro: { rotulo: "sem mudança", simbolo: "=", cor: "text-texto-3" },
};

const MUDANCA: Record<Mudanca, string> = {
  mantida: "Mantida",
  reforcada: "Reforçada",
  enfraquecida: "Enfraquecida",
  transformada: "Transformada",
  nova: "Nova",
  ausente: "Ausente",
};

/**
 * Fases da trajetória: os eventos que a investigação projetou para este cenário (e os condicionais dele), agrupados
 * pelo rótulo de data e em ordem de ano. São hipóteses de desenvolvimento, não eventos confirmados.
 */
function fasesDaTrajetoria(eventos: EventoTempo[], c: Cenario) {
  const doCenario = eventos.filter((e) => e.cenarios?.includes(c.id) && (e.categoria === "projetado" || e.categoria === "condicional"));
  const fases = new Map<string, { data: string; ano: number; eventos: EventoTempo[] }>();
  for (const e of [...doCenario].sort((a, b) => a.ano - b.ano)) {
    const f = fases.get(e.data) ?? { data: e.data, ano: e.ano, eventos: [] };
    f.eventos.push(e);
    fases.set(e.data, f);
  }
  return [...fases.values()];
}

export function AnaliseDoCenario({ id }: { id: CenarioId }) {
  const { r } = useResultado();
  const c = r.cenarios.find((x) => x.id === id);
  if (!c) return null;
  return (
    <article className="flex flex-col gap-10">
      <Cabecalho c={c} />
      <IndiceDoCenario />
      <div className="flex flex-col gap-14">
        <Tese c={c} />
        <Logica c={c} />
        <Trajetoria c={c} />
        <Dinamicas c={c} />
        <Consequencias c={c} />
        <Inflexao c={c} />
        <Indicadores c={c} />
        <Premissas c={c} />
      </div>
      <Rodape c={c} />
    </article>
  );
}

/* ------------------------------------------------------------------ cabeçalho, troca de cenário e índice */

function Cabecalho({ c }: { c: Cenario }) {
  const { r } = useResultado();
  return (
    <header className="flex flex-col gap-5">
      {/* trilha: de onde se veio (a análise principal) e onde se está (este cenário) */}
      <nav aria-label="Trilha" className="text-micro font-medium tracking-[0.12em] text-texto-3 uppercase">
        <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
          <li>
            <Link to={ROTAS.investigacao(r.id)} className="hover:text-texto">
              Iris
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to={ROTAS.investigacao(r.id)} className="hover:text-texto">
              Cenários
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-texto-2">
            Cenário {c.id}
          </li>
        </ol>
      </nav>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="flex min-w-0 flex-col gap-3">
          <p className="text-micro font-medium tracking-[0.06em] text-ouro">Análise aprofundada</p>
          <h1 className="max-w-[26ch] font-editorial text-[calc(1.75rem*var(--escala-titulo))] leading-[1.15] font-medium tracking-[-0.015em] text-balance text-texto sm:text-[calc(2.375rem*var(--escala-titulo))]">
            {c.nome}
          </h1>
          <p className="flex flex-wrap items-center gap-x-2 text-legenda text-texto-2">
            <span>Cenário {c.id}</span>
            <span aria-hidden="true">·</span>
            <span>{c.arquetipo}</span>
            <span aria-hidden="true">·</span>
            <span>
              Horizonte{" "}
              <span className="numeros font-dados text-ouro">
                {r.horizonte.inicio}–{r.horizonte.fim}
              </span>
            </span>
          </p>
        </div>
        <TrocaDeCenario atual={c.id} />
      </div>
      <Link to={ROTAS.investigacao(r.id)} className="inline-flex w-fit items-center gap-1.5 text-legenda text-texto-2 hover:text-texto print:hidden">
        <ArrowLeft size={14} aria-hidden="true" />
        Voltar aos {r.cenarios.length} cenários
      </Link>
    </header>
  );
}

/** Os cenários lado a lado numa pílula: trocar de cenário sem voltar à análise principal. */
function TrocaDeCenario({ atual }: { atual: CenarioId }) {
  const { r } = useResultado();
  return (
    <nav aria-label="Outros cenários" className="print:hidden">
      <ul className="m-0 flex w-fit list-none gap-0.5 rounded-full border border-linha bg-mar/70 p-1">
        {r.cenarios.map((x) => (
          <li key={x.id}>
            <Link
              to={ROTAS.cenarioDaInvestigacao(r.id, x.id)}
              aria-current={x.id === atual ? "page" : undefined}
              aria-label={`Cenário ${x.id}: ${x.nome}`}
              className={`flex min-h-9 items-center gap-2 rounded-full px-3 text-legenda transition-colors duration-150 ${
                x.id === atual ? "bg-grafite-alto text-texto shadow-cartao" : "text-texto-2 hover:text-texto"
              }`}
            >
              <Letra id={x.id} ativa={x.id === atual} />
              <span className="hidden sm:inline">{x.nome}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function IndiceDoCenario() {
  return (
    <nav
      aria-label="Partes da análise do cenário"
      className="sticky top-[var(--altura-topo,0px)] z-20 -mx-1 border-b border-linha bg-abismo px-1 py-2 print:hidden"
    >
      <ol className="m-0 flex list-none gap-1 overflow-x-auto p-0 pr-8 [mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)] [scrollbar-width:none]">
        {PARTES_DO_CENARIO.map((p) => (
          <li key={p.id} className="shrink-0">
            <a
              href={`#${p.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(p.id);
                const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
                el?.scrollIntoView?.({ behavior: reduzir ? "auto" : "smooth", block: "start" });
                el?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
              }}
              className="flex min-h-9 items-center gap-1.5 rounded-full px-3 text-legenda whitespace-nowrap text-texto-2 transition-colors duration-150 hover:bg-grafite hover:text-texto"
            >
              <span className="numeros font-dados text-micro text-texto-3">{p.numero}</span>
              {p.nome}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------------ peças */

/** Uma parte da análise: rótulo ("3 · Desenvolvimento temporal"), a pergunta que ela responde e o conteúdo. */
function Parte({ indice, children }: { indice: number; children: ReactNode }) {
  const p = PARTES_DO_CENARIO[indice];
  return (
    <section id={p.id} aria-label={p.nome} className="flex scroll-mt-[calc(var(--altura-topo,0px)+4rem)] flex-col gap-5">
      <div className="flex flex-col gap-2">
        <RotuloDeSecao numero={p.numero} nome={p.nome} nucleo={indice === 0} />
        <h2 tabIndex={-1} className="font-editorial text-secao font-medium text-balance text-texto outline-none">
          {p.pergunta}
        </h2>
      </div>
      {children}
    </section>
  );
}

/** Subtítulo pequeno dentro de uma parte. */
function Rotulo({ children, cor = "text-texto-3" }: { children: ReactNode; cor?: string }) {
  return <h3 className={`text-micro font-medium tracking-[0.06em] uppercase ${cor}`}>{children}</h3>;
}

function Nada({ children }: { children: ReactNode }) {
  return <p className="text-legenda text-texto-3">{children}</p>;
}

/* ------------------------------------------------------------------ 1. tese */

function Tese({ c }: { c: Cenario }) {
  return (
    <Parte indice={0}>
      <div className="flex flex-col gap-3 border-l-2 border-ouro/70 pl-5">
        <Rotulo>Tese central</Rotulo>
        <p className="max-w-[62ch] font-editorial text-[calc(1.1875rem*var(--escala-titulo))] leading-[1.55] text-pretty text-texto">{c.sintese}</p>
      </div>
      <dl className="m-0 grid max-w-[72ch] gap-1 text-corpo">
        <dt className="text-micro text-texto-3">Impacto principal</dt>
        <dd className="m-0 text-texto-2">{c.impacto}</dd>
      </dl>
    </Parte>
  );
}

/* ------------------------------------------------------------------ 2. lógica de evolução */

function Logica({ c }: { c: Cenario }) {
  return (
    <Parte indice={1}>
      <div className="flex flex-col gap-3">
        <Rotulo cor="text-ambar">Lógica do cenário</Rotulo>
        {c.mecanismos.length ? (
          <ol className="m-0 flex list-none flex-col gap-4 p-0">
            {c.mecanismos.map((m, i) => (
              <li key={i} className="flex gap-4">
                <span className="numeros pt-0.5 font-dados text-micro text-texto-3">{i + 1}</span>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-corpo text-texto">
                    <span>{m.condicao}</span>
                    <ArrowRight size={14} aria-label="leva a" className="text-texto-3" />
                    <span className="font-medium">{m.consequencia}</span>
                  </p>
                  <p className="text-legenda text-texto-2">
                    <span className="mr-1.5 inline-block align-[-2px]">
                      <Epistemico tipo={m.tipo} compacto />
                    </span>
                    {m.mecanismo}
                    <Citacoes ids={m.evidencias} />
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <Nada>A investigação não descreveu os mecanismos deste cenário.</Nada>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Rotulo>Condições necessárias</Rotulo>
        {c.condicoes.length ? (
          <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-corpo text-texto-2 marker:text-texto-3">
            {c.condicoes.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        ) : (
          <Nada>Nenhuma condição declarada.</Nada>
        )}
      </div>
    </Parte>
  );
}

/* ------------------------------------------------------------------ 3. desenvolvimento temporal */

function Trajetoria({ c }: { c: Cenario }) {
  const { r, ix } = useResultado();
  const fases = fasesDaTrajetoria(r.linhaDoTempo, c);
  return (
    <Parte indice={2}>
      <p className="text-legenda text-texto-3">
        Trajetória prospectiva do cenário {c.id}. Os marcos são hipóteses de desenvolvimento, não eventos confirmados nem datas previstas.
      </p>
      {fases.length ? (
        <ol className="m-0 flex list-none flex-col p-0">
          {fases.map((f, i) => (
            <li key={f.data} className="group/fase grid gap-x-4 gap-y-1 pb-7 last:pb-0 sm:grid-cols-[6.5rem_1.25rem_minmax(0,1fr)]">
              <p className="numeros pt-0.5 font-dados text-micro text-ouro sm:text-right">{f.data}</p>
              <span aria-hidden="true" className="relative hidden justify-center sm:flex">
                <span className="absolute top-2 -bottom-7 w-px bg-linha-forte group-last/fase:hidden" />
                <span className="relative mt-1 size-3 rounded-full border-2 border-ouro bg-abismo" />
              </span>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {f.eventos.map((e) => (
                  <li key={e.id} className="flex flex-col gap-1">
                    <p className="text-corpo text-texto">
                      <span className="sr-only">Fase {i + 1}: </span>
                      {e.texto}
                      <Citacoes ids={e.evidencias} />
                    </p>
                    {(e.categoria === "condicional" || e.inflexao) && (
                      <p className="text-micro text-ambar">
                        {e.inflexao ? "Ponto de inflexão" : "Condicional"}
                        {e.condicao ? `: ${e.condicao}` : ""}
                      </p>
                    )}
                    {e.atores.length > 0 && (
                      <p className="flex flex-wrap gap-x-2 text-micro text-texto-3">
                        {e.atores.map((a) => (ix.atores.get(a) ? <span key={a}>{ix.atores.get(a)!.curto}</span> : null))}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      ) : (
        <Nada>A investigação não projetou marcos no tempo para este cenário.</Nada>
      )}
    </Parte>
  );
}

/* ------------------------------------------------------------------ 4. dinâmicas */

function Dinamicas({ c }: { c: Cenario }) {
  const { r, ix } = useResultado();
  // só as relações que este cenário muda (as mantidas ficam de fora, para o que importa aparecer)
  const mudam = r.relacoes.filter((x) => x.cenarios[c.id] && x.cenarios[c.id].mudanca !== "mantida");
  return (
    <Parte indice={3}>
      <div className="flex flex-col gap-2">
        <Rotulo>Atores decisivos</Rotulo>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-corpo">
          {c.atoresDecisivos.map((a) =>
            ix.atores.get(a) ? (
              <NomeDoAtor key={a} id={a}>
                {ix.atores.get(a)!.nome}
              </NomeDoAtor>
            ) : null,
          )}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Rotulo>Relações que este cenário muda</Rotulo>
        {mudam.length ? (
          <ul className="m-0 flex list-none flex-col p-0">
            {mudam.map((x) => {
              const e = x.cenarios[c.id];
              return (
                <li key={x.id} className="grid gap-x-6 gap-y-1 border-t border-linha py-3 first:border-t-0 first:pt-0 md:grid-cols-[14rem_minmax(0,1fr)]">
                  <p className="text-corpo font-medium text-texto">
                    {ix.atores.get(x.de)?.curto ?? x.de} <span className="text-texto-3">↔</span> {ix.atores.get(x.para)?.curto ?? x.para}
                    <span className="mt-0.5 block text-micro font-normal text-ambar">{MUDANCA[e.mudanca]}</span>
                  </p>
                  <p className="text-legenda text-texto-2">
                    {e.texto}
                    <Citacoes ids={e.evidencias} />
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <Nada>Neste cenário, as relações entre os atores se mantêm como no presente.</Nada>
        )}
      </div>
    </Parte>
  );
}

/* ------------------------------------------------------------------ 5. consequências */

function Consequencias({ c }: { c: Cenario }) {
  return (
    <Parte indice={4}>
      {c.consequencias.length ? (
        <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
          {c.consequencias.map((q) => {
            const e = EFEITO[q.efeito];
            return (
              <li key={q.regiao} className="cartao flex flex-col gap-1.5 p-4">
                <p className="flex items-center justify-between gap-3 text-corpo font-medium text-texto">
                  {q.regiao}
                  <span className={`inline-flex items-center gap-1.5 text-micro font-normal ${e.cor}`}>
                    <span aria-hidden="true" className="font-dados">
                      {e.simbolo}
                    </span>
                    {e.rotulo}
                  </span>
                </p>
                <p className="text-legenda text-texto-2">{q.texto}</p>
              </li>
            );
          })}
        </ul>
      ) : (
        <Nada>A investigação não descreveu consequências por região.</Nada>
      )}
    </Parte>
  );
}

/* ------------------------------------------------------------------ 6. pontos de inflexão */

function Inflexao({ c }: { c: Cenario }) {
  const { r } = useResultado();
  const inflexoes = r.linhaDoTempo.filter((e) => e.cenarios?.includes(c.id) && (e.inflexao || e.categoria === "condicional"));
  return (
    <Parte indice={5}>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Rotulo cor="text-ciano-texto">O que pode acelerar ou desencadear</Rotulo>
          {c.gatilhos.length ? (
            <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-corpo text-texto-2 marker:text-texto-3">
              {c.gatilhos.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          ) : (
            <Nada>Nenhum gatilho declarado.</Nada>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Rotulo cor="text-negativo">O que poderia desviar ou invalidar</Rotulo>
          {c.revisao.length ? (
            <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-corpo text-texto-2 marker:text-texto-3">
              {c.revisao.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          ) : (
            <Nada>Nada declarado.</Nada>
          )}
        </div>
      </div>
      {inflexoes.length > 0 && (
        <div className="flex flex-col gap-2">
          <Rotulo cor="text-ambar">Momentos da trajetória que decidem o rumo</Rotulo>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {inflexoes.map((e) => (
              <li key={e.id} className="flex flex-wrap items-baseline gap-x-3 text-corpo text-texto-2">
                <span className="numeros font-dados text-micro text-ouro">{e.data}</span>
                <span className="text-texto">{e.texto}</span>
                {e.condicao && <span className="text-micro text-ambar">{/^se\b/i.test(e.condicao) ? e.condicao : `Se: ${e.condicao}`}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Parte>
  );
}

/* ------------------------------------------------------------------ 7. indicadores */

function Indicadores({ c }: { c: Cenario }) {
  const { r } = useResultado();
  const sinais = r.sinais.filter((s) => s.favorece.includes(c.id) || s.enfraquece.includes(c.id));
  return (
    <Parte indice={6}>
      <p className="text-legenda text-texto-3">Um sinal dá ou tira força deste cenário; nenhum sinal sozinho o confirma.</p>
      {sinais.length ? (
        <ul className="m-0 flex list-none flex-col p-0">
          {sinais.map((s) => (
            <li key={s.id} className="grid gap-x-6 gap-y-1.5 border-t border-linha py-4 first:border-t-0 first:pt-0 sm:grid-cols-[6.5rem_minmax(0,1fr)_auto]">
              <p className="numeros pt-0.5 font-dados text-micro text-ambar">{s.quando}</p>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-corpo font-medium text-texto">{s.sinal}</p>
                <p className="text-legenda text-texto-2">{s.leitura}</p>
                <p className="text-micro text-texto-3">Onde acompanhar: {s.ondeAcompanhar}</p>
              </div>
              <p className="self-start">
                <Etiqueta estado={s.favorece.includes(c.id) ? IMPACTO.favorece : IMPACTO.enfraquece} />
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <Nada>A investigação não ligou sinais a este cenário.</Nada>
      )}
    </Parte>
  );
}

/* ------------------------------------------------------------------ 8. premissas e vulnerabilidades */

function Premissas({ c }: { c: Cenario }) {
  const { r } = useResultado();
  const incertezas = c.incertezas.map((id) => r.incertezas.find((i) => i.id === id)?.nome ?? id);
  return (
    <Parte indice={7}>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Rotulo>Premissas que sustentam o cenário</Rotulo>
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-corpo text-texto">
              {c.premissas.map((a) => (
                <Frase key={a.texto} a={a} como="li" />
              ))}
            </ul>
          </div>
          {c.favoraveis.length > 0 && (
            <div className="flex flex-col gap-2">
              <Rotulo cor="text-ciano-texto">Evidências a favor</Rotulo>
              <ul className="m-0 flex list-none flex-col gap-2 p-0 text-legenda text-texto-2">
                {c.favoraveis.map((a) => (
                  <Frase key={a.texto} a={a} como="li" />
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Rotulo cor="text-negativo">Onde o raciocínio pode falhar</Rotulo>
            {c.contrarias.length ? (
              <ul className="m-0 flex list-none flex-col gap-2 p-0 text-legenda text-texto-2">
                {c.contrarias.map((a) => (
                  <Frase key={a.texto} a={a} como="li" />
                ))}
              </ul>
            ) : (
              <Nada>Nenhuma evidência contrária registrada.</Nada>
            )}
          </div>
          {(incertezas.length > 0 || c.limitacoes.length > 0) && (
            <div className="flex flex-col gap-2">
              <Rotulo cor="text-ambar">Incertezas e limitações</Rotulo>
              <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-legenda text-texto-2 marker:text-texto-3">
                {incertezas.map((x) => (
                  <li key={x}>{x}</li>
                ))}
                {c.limitacoes.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Parte>
  );
}

/* ------------------------------------------------------------------ rodapé */

function Rodape({ c }: { c: Cenario }) {
  const { r } = useResultado();
  const outros = r.cenarios.filter((x) => x.id !== c.id);
  return (
    <footer className="flex flex-col gap-4 border-t border-linha pt-6">
      <p className="max-w-[80ch] text-legenda text-texto-3">
        Cenário prospectivo, não uma previsão. Esta análise foi montada a partir da investigação original (cenário, relações, linha do tempo, sinais e
        evidências), sem acrescentar fatos. Nenhuma probabilidade é atribuída.
      </p>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-legenda print:hidden">
        <span className="text-texto-3">Outros cenários:</span>
        {outros.map((x) => (
          <Link key={x.id} to={ROTAS.cenarioDaInvestigacao(r.id, x.id)} className="inline-flex items-center gap-2 text-ciano-texto hover:underline">
            <Letra id={x.id} /> {x.nome}
          </Link>
        ))}
      </p>
    </footer>
  );
}
