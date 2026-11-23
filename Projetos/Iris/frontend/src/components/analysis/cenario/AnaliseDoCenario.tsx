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
 *
 * A pergunta da tela: "que futuro é este, e que sinais diriam que ele está chegando?". Por isso o impacto principal
 * fica logo abaixo do título e a ficha do cabeçalho leva direto aos indicadores.
 *
 * Composição: a partir de `xl`, duas colunas: a leitura à esquerda e um trilho fixo à direita, com o índice das oito
 * partes (a atual marcada por um traço que desliza até ela) e o lugar deste futuro no leque. Abaixo disso, o índice
 * vira uma faixa fixa no topo, que rola de lado e mantém a parte atual à vista.
 */
import { ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { EFEITO_NA_REGIAO, IMPACTO, MUDANCA_NA_RELACAO, ORDEM_DAS_MUDANCAS, type Estado } from "../../../config/semantica";
import { ROTAS } from "../../../config/rotas";
import type { Cenario, CenarioId } from "../../../types/cenario";
import type { EventoTempo } from "../../../types/evento";
import { Epistemico } from "../../common/Epistemico";
import { Etiqueta } from "../../common/Etiqueta";
import { Frase, NomeDoAtor } from "../conversa/resposta/partes";
import { useResultado } from "../investigacao/contexto";
import { Citacoes, Letra } from "../investigacao/pecas";
import { LequeDosFuturos, posicoesDoCenario } from "../prospectiva/LequeDosFuturos";

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

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Leva até uma parte (rolagem suave, salvo com "reduzir movimento") e põe o foco no título dela. */
function irParaParte(id: string) {
  const el = document.getElementById(id);
  const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  el?.scrollIntoView?.({ behavior: reduzir ? "auto" : "smooth", block: "start" });
  el?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
}

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

/** Evidências distintas citadas pelo cenário (premissas, tendências, mecanismos, a favor, contra). */
function evidenciasDoCenario(c: Cenario) {
  const ids = new Set<string>();
  for (const a of [...c.premissas, ...c.tendencias, ...c.favoraveis, ...c.contrarias, ...c.mecanismos]) for (const e of a.evidencias ?? []) ids.add(e);
  return ids.size;
}

/**
 * A parte que está sendo lida: a primeira, na ordem do texto, que cruza a faixa de leitura (entre 20% e 35% da altura
 * da janela). Sem IntersectionObserver (testes, navegadores antigos), fica a primeira.
 */
function useParteAtual() {
  const [atual, setAtual] = useState<string>(PARTES_DO_CENARIO[0].id);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const visiveis = new Set<string>();
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) (e.isIntersecting ? visiveis.add(e.target.id) : visiveis.delete(e.target.id));
        const primeira = PARTES_DO_CENARIO.find((p) => visiveis.has(p.id));
        if (primeira) setAtual(primeira.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    for (const p of PARTES_DO_CENARIO) {
      const el = document.getElementById(p.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, []);
  return atual;
}

export function AnaliseDoCenario({ id }: { id: CenarioId }) {
  const { r } = useResultado();
  const c = r.cenarios.find((x) => x.id === id);
  const atual = useParteAtual();
  if (!c) return null;
  return (
    <article className="flex flex-col gap-10">
      <Cabecalho c={c} />
      <div className="flex flex-col gap-10 xl:grid xl:grid-cols-[minmax(0,1fr)_15rem] xl:gap-x-14">
        {/* No celular e no tablet, o trilho "some" (display: contents) e o índice vira uma faixa fixa no topo da leitura. */}
        <aside className="contents xl:sticky xl:top-[calc(var(--altura-topo,0px)+1.75rem)] xl:col-start-2 xl:row-start-1 xl:flex xl:flex-col xl:gap-9 xl:self-start print:hidden">
          <IndiceDoCenario atual={atual} />
          <LugarNoLeque c={c} />
        </aside>
        <div className="flex min-w-0 flex-col xl:col-start-1 xl:row-start-1">
          <Tese c={c} />
          <Logica c={c} />
          <Trajetoria c={c} />
          <Dinamicas c={c} />
          <Consequencias c={c} />
          <Inflexao c={c} />
          <Indicadores c={c} />
          <Premissas c={c} />
        </div>
      </div>
      <Rodape c={c} />
    </article>
  );
}

/* ------------------------------------------------------------------ cabeçalho, troca de cenário, índice e trilho */

function Cabecalho({ c }: { c: Cenario }) {
  const { r } = useResultado();
  const sinais = r.sinais.filter((s) => s.favorece.includes(c.id) || s.enfraquece.includes(c.id));
  const favorecem = sinais.filter((s) => s.favorece.includes(c.id)).length;
  const fatos: { rotulo: string; valor: ReactNode }[] = [
    { rotulo: "Arquétipo", valor: c.arquetipo },
    {
      rotulo: "Horizonte",
      valor: (
        <span className="numeros font-dados text-ambar">
          {r.horizonte.inicio}–{r.horizonte.fim}
        </span>
      ),
    },
    { rotulo: "Premissas", valor: <span className="numeros">{c.premissas.length}</span> },
    { rotulo: "Evidências", valor: <span className="numeros">{evidenciasDoCenario(c)}</span> },
    {
      rotulo: "Sinais",
      valor: (
        <span className="numeros">
          {sinais.length}
          {sinais.length > 0 && (
            <span className="font-normal text-texto-3">
              {" "}
              · {favorecem} a favor, {sinais.length - favorecem} contra
            </span>
          )}
        </span>
      ),
    },
  ];
  return (
    <header className="flex flex-col gap-6">
      {/* trilha: de onde se veio (a análise principal) e onde se está (este cenário) */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
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
        <Link to={ROTAS.investigacao(r.id)} className="inline-flex w-fit items-center gap-1.5 text-legenda text-texto-2 hover:text-texto print:hidden">
          <ArrowLeft size={14} aria-hidden="true" />
          Voltar aos {r.cenarios.length} cenários
        </Link>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
        <div className="flex min-w-0 items-start gap-4">
          <span className="mt-1.5 hidden sm:block">
            <Letra id={c.id} tamanho="grande" />
          </span>
          <div className="flex min-w-0 flex-col gap-3">
            <h1 className="max-w-[24ch] font-editorial text-[calc(1.75rem*var(--escala-titulo))] leading-[1.12] font-medium tracking-[-0.02em] text-balance text-texto sm:text-[calc(2.5rem*var(--escala-titulo))]">
              {c.nome}
            </h1>
            {/* o que este futuro muda, em uma frase: o primeiro achado da página */}
            <p className="max-w-[60ch] text-leitura text-pretty text-texto-2">{c.impacto}</p>
          </div>
        </div>
        <TrocaDeCenario atual={c.id} />
      </div>

      <div className="flex flex-col gap-3 border-y border-linha py-4 md:flex-row md:items-center md:justify-between md:gap-8">
        <dl className="m-0 grid grid-cols-2 gap-x-8 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-10">
          {fatos.map((f) => (
            <div key={f.rotulo} className="flex flex-col gap-0.5">
              <dt className="text-micro text-texto-3">{f.rotulo}</dt>
              <dd className="m-0 text-corpo font-medium text-texto">{f.valor}</dd>
            </div>
          ))}
        </dl>
        {sinais.length > 0 && (
          <a
            href="#cen-indicadores"
            onClick={(e) => {
              e.preventDefault();
              irParaParte("cen-indicadores");
            }}
            className="botao botao-secundario botao-pequeno w-fit shrink-0 print:hidden"
          >
            Ver sinais a acompanhar
            <ArrowDown size={14} aria-hidden="true" />
          </a>
        )}
      </div>
    </header>
  );
}

/** Os cenários lado a lado numa pílula: trocar de cenário sem voltar à análise principal. */
function TrocaDeCenario({ atual }: { atual: CenarioId }) {
  const { r } = useResultado();
  return (
    <nav aria-label="Outros cenários" className="shrink-0 print:hidden">
      <ul className="m-0 flex w-fit list-none gap-0.5 rounded-full border border-linha bg-mar/70 p-1">
        {r.cenarios.map((x) => (
          <li key={x.id}>
            <Link
              to={ROTAS.cenarioDaInvestigacao(r.id, x.id)}
              aria-current={x.id === atual ? "page" : undefined}
              aria-label={`Cenário ${x.id}: ${x.nome}`}
              title={x.nome}
              className={`flex min-h-9 items-center gap-2 rounded-full px-2.5 text-legenda transition-colors duration-150 ${
                x.id === atual ? "bg-grafite-alto text-texto shadow-cartao" : "text-texto-2 hover:text-texto"
              }`}
            >
              <Letra id={x.id} ativa={x.id === atual} />
              {/* o nome só no cenário aberto: os outros cabem pela letra (o nome completo está no título do link) */}
              <span className={x.id === atual ? "hidden pr-1 sm:inline" : "sr-only"}>{x.nome}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Índice das oito partes, um só para todas as larguras. No trilho (xl), uma coluna com um traço ciano de 2 px que
 * desliza até a parte atual (transform, 240 ms, --ease-saida). Na faixa (abaixo de xl), as partes rolam de lado e a
 * atual ganha fundo e é trazida para a vista.
 */
function IndiceDoCenario({ atual }: { atual: string }) {
  const lista = useRef<HTMLOListElement>(null);
  const [traco, setTraco] = useState<{ y: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const ol = lista.current;
    const a = ol?.querySelector<HTMLElement>(`[data-parte="${atual}"]`);
    if (!ol || !a) return;
    setTraco({ y: a.offsetTop, h: a.offsetHeight });
    // faixa horizontal: traz a parte atual para a vista sem mexer na rolagem da página
    if (ol.scrollWidth > ol.clientWidth + 1) {
      const alvo = a.offsetLeft - ol.clientWidth / 2 + a.offsetWidth / 2;
      ol.scrollTo?.({ left: Math.max(0, alvo), behavior: "smooth" });
    }
  }, [atual]);
  return (
    <nav
      aria-label="Partes da análise do cenário"
      className="sticky top-[var(--altura-topo,0px)] z-20 -mx-1 border-b border-linha bg-abismo px-1 py-2 xl:static xl:m-0 xl:border-0 xl:bg-transparent xl:p-0"
    >
      <p className="mb-3 hidden text-legenda font-medium text-texto xl:block">Nesta análise</p>
      <ol
        ref={lista}
        className="relative m-0 flex list-none gap-1 overflow-x-auto p-0 pr-8 [mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)] [scrollbar-width:none] xl:flex-col xl:gap-0 xl:overflow-visible xl:border-l xl:border-linha xl:pr-0 xl:[mask-image:none]"
      >
        {traco && (
          <span
            aria-hidden="true"
            className="indice-traco absolute top-0 -left-px hidden w-0.5 rounded-full bg-ciano xl:block"
            style={{ transform: `translateY(${traco.y}px)`, height: traco.h }}
          />
        )}
        {PARTES_DO_CENARIO.map((p) => {
          const ativa = p.id === atual;
          return (
            <li key={p.id} className="shrink-0">
              <a
                href={`#${p.id}`}
                data-parte={p.id}
                aria-current={ativa ? "location" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  irParaParte(p.id);
                }}
                className={`flex min-h-9 items-center gap-2 rounded-full px-3 text-legenda whitespace-nowrap transition-colors duration-150 xl:min-h-8 xl:rounded-none xl:py-1 xl:pl-4 xl:whitespace-normal ${
                  ativa ? "bg-grafite text-texto xl:bg-transparent" : "text-texto-2 hover:bg-grafite hover:text-texto xl:hover:bg-transparent"
                }`}
              >
                <span className={`numeros w-3 font-dados text-micro ${ativa ? "text-ciano-texto" : "text-texto-3"}`}>{p.numero}</span>
                {p.nome}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** No trilho: onde este futuro fica no leque e o polo dele em cada escolha. */
function LugarNoLeque({ c }: { c: Cenario }) {
  const { r } = useResultado();
  if (r.incertezas.length === 0) return null;
  return (
    <section aria-label="Onde este futuro fica" className="hidden flex-col gap-3 xl:flex">
      <p className="text-legenda font-medium text-texto">Onde este futuro fica</p>
      <LequeDosFuturos cenarios={r.cenarios} incertezas={r.incertezas} realce={c.id} compacto />
      <dl className="m-0 flex flex-col gap-2.5">
        {posicoesDoCenario(c, r.incertezas).map((p) => (
          <div key={p.incerteza} className="flex flex-col gap-0.5">
            <dt className="text-micro text-texto-3">{p.incerteza}</dt>
            <dd className="m-0 text-legenda text-texto">{p.polo}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ------------------------------------------------------------------ peças */

/**
 * Uma parte da análise: o nome com o número (o título) e, logo abaixo, a pergunta que ela responde. Sem rótulo em
 * caixa-alta acima do título: o número basta para a sequência.
 */
function Parte({ indice, children }: { indice: number; children: ReactNode }) {
  const p = PARTES_DO_CENARIO[indice];
  return (
    <section
      id={p.id}
      aria-label={p.nome}
      aria-describedby={`${p.id}-pergunta`}
      className="flex scroll-mt-[calc(var(--altura-topo,0px)+4.5rem)] flex-col gap-6 border-t border-linha py-12 first:border-t-0 first:pt-0 xl:scroll-mt-[calc(var(--altura-topo,0px)+2rem)]"
    >
      <div className="flex flex-col gap-1.5">
        <h2 tabIndex={-1} className="flex items-baseline font-editorial text-secao font-medium text-balance text-texto outline-none">
          <span aria-hidden="true" className={`numeros w-7 shrink-0 font-dados text-legenda ${indice === 0 ? "text-ouro" : "text-texto-3"}`}>
            {p.numero}
          </span>
          {p.nome}
        </h2>
        <p id={`${p.id}-pergunta`} className="pl-7 text-corpo text-texto-2">
          {p.pergunta}
        </p>
      </div>
      {children}
    </section>
  );
}

/** Subtítulo dentro de uma parte; com `estado`, leva o símbolo da classificação antes (nunca só a cor). */
function Subtitulo({ children, estado }: { children: ReactNode; estado?: Pick<Estado, "simbolo" | "cor"> }) {
  return (
    <h3 className="flex items-center gap-2 text-legenda font-medium text-texto">
      {estado && (
        <span aria-hidden="true" className={`font-dados ${estado.cor}`}>
          {estado.simbolo}
        </span>
      )}
      {children}
    </h3>
  );
}

function Nada({ children }: { children: ReactNode }) {
  return <p className="text-legenda text-texto-3">{children}</p>;
}

/* ------------------------------------------------------------------ 1. tese */

function Tese({ c }: { c: Cenario }) {
  return (
    <Parte indice={0}>
      <p className="max-w-[46ch] font-editorial text-[calc(1.375rem*var(--escala-titulo))] leading-[1.45] tracking-[-0.01em] text-balance text-texto">
        {c.sintese}
      </p>
    </Parte>
  );
}

/* ------------------------------------------------------------------ 2. lógica de evolução */

function Logica({ c }: { c: Cenario }) {
  return (
    <Parte indice={1}>
      {c.mecanismos.length ? (
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {c.mecanismos.map((m, i) => (
            <li key={i} className="cartao grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_1rem_minmax(0,1.35fr)_1rem_minmax(0,1fr)] md:items-start md:gap-4">
              <Elo rotulo="Se" numero={i + 1}>
                {m.condicao}
              </Elo>
              <Seta />
              <Elo rotulo="Porque">
                <span className="mr-1.5 inline-block align-[-2px]">
                  <Epistemico tipo={m.tipo} compacto />
                </span>
                {m.mecanismo}
                <Citacoes ids={m.evidencias} />
              </Elo>
              <Seta />
              <Elo rotulo="Então" forte>
                {m.consequencia}
              </Elo>
            </li>
          ))}
        </ol>
      ) : (
        <Nada>A investigação não descreveu os mecanismos deste cenário.</Nada>
      )}
      <div className="flex flex-col gap-2">
        <Subtitulo>Condições necessárias</Subtitulo>
        {c.condicoes.length ? (
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {c.condicoes.map((x) => (
              <li key={x} className="rounded-padrao border border-linha px-3 py-1.5 text-legenda text-texto-2">
                {x}
              </li>
            ))}
          </ul>
        ) : (
          <Nada>Nenhuma condição declarada.</Nada>
        )}
      </div>
    </Parte>
  );
}

/** Um elo da cadeia causal: condição, mecanismo ou consequência. */
function Elo({ rotulo, numero, forte = false, children }: { rotulo: string; numero?: number; forte?: boolean; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="flex items-center gap-2 text-micro text-texto-3">
        {numero !== undefined && <span className="numeros font-dados">{numero}</span>}
        {rotulo}
      </p>
      <p className={`text-legenda leading-relaxed ${forte ? "font-medium text-texto" : "text-texto-2"}`}>{children}</p>
    </div>
  );
}

function Seta() {
  return (
    <span aria-hidden="true" className="flex justify-start text-texto-3 md:justify-center md:pt-6">
      <ArrowDown size={14} className="md:hidden" />
      <ArrowRight size={14} className="hidden md:block" />
    </span>
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
              <p className="numeros pt-0.5 font-dados text-micro text-ambar sm:text-right">{f.data}</p>
              <span aria-hidden="true" className="relative hidden justify-center sm:flex">
                {/* o caminho é projetado: tracejado âmbar, como no leque */}
                <span className="absolute top-3 -bottom-7 w-0 border-l border-dashed border-ambar/50 group-last/fase:hidden" />
                <span className="relative mt-1 size-2.5 rounded-full border-[1.5px] border-ambar bg-abismo" />
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
  // só as relações que este cenário muda (as mantidas ficam de fora, para o que importa aparecer), agrupadas pelo tipo
  // de mudança, na ordem: o que surge, o que se fortalece, o que se transforma, o que perde força, o que some.
  const mudam = r.relacoes.filter((x) => x.cenarios[c.id] && x.cenarios[c.id].mudanca !== "mantida");
  const grupos = ORDEM_DAS_MUDANCAS.map((m) => ({ m, itens: mudam.filter((x) => x.cenarios[c.id].mudanca === m) })).filter((g) => g.itens.length > 0);
  const nome = (id: string) => ix.atores.get(id)?.curto ?? id;
  return (
    <Parte indice={3}>
      <div className="flex flex-col gap-2.5">
        <Subtitulo>Atores decisivos</Subtitulo>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0 text-legenda">
          {c.atoresDecisivos.map((a) =>
            ix.atores.get(a) ? (
              <li key={a} className="rounded-full border border-linha-forte px-3 py-1">
                <NomeDoAtor id={a}>{ix.atores.get(a)!.nome}</NomeDoAtor>
              </li>
            ) : null,
          )}
        </ul>
      </div>
      <div className="flex flex-col gap-3">
        <Subtitulo>Relações que este cenário muda</Subtitulo>
        {grupos.length ? (
          <div className="flex flex-col gap-6">
            {grupos.map((g) => {
              const estado = MUDANCA_NA_RELACAO[g.m];
              return (
                <div key={g.m} className="flex flex-col gap-1">
                  <p className="flex items-center gap-2 text-micro text-texto-3">
                    <Etiqueta estado={estado} />
                    <span className="numeros">{plural(g.itens.length, "relação", "relações")}</span>
                  </p>
                  <ul className="m-0 grid list-none gap-x-8 p-0 md:grid-cols-2">
                    {g.itens.map((x) => {
                      const e = x.cenarios[c.id];
                      return (
                        <li key={x.id} className="flex flex-col gap-0.5 border-b border-linha py-3">
                          <p className="text-corpo font-medium text-texto">
                            {nome(x.de)} <span className="font-normal text-texto-3">↔</span> {nome(x.para)}
                            <span className="sr-only">: {estado.rotulo}</span>
                          </p>
                          <p className="text-legenda text-texto-2">
                            {e.texto}
                            <Citacoes ids={e.evidencias} />
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
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
          {c.consequencias.map((q) => (
            <li key={q.regiao} className="cartao flex flex-col gap-2 p-4">
              <p className="flex items-start justify-between gap-3 text-corpo font-medium text-texto">
                {q.regiao}
                <span className="flex-none">
                  <Etiqueta estado={EFEITO_NA_REGIAO[q.efeito]} />
                </span>
              </p>
              <p className="text-legenda text-texto-2">{q.texto}</p>
            </li>
          ))}
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
  const painel = (titulo: string, estado: Pick<Estado, "simbolo" | "cor">, itens: string[], vazio: string) => (
    <div className="cartao flex flex-col gap-3 p-5">
      <Subtitulo estado={estado}>{titulo}</Subtitulo>
      {itens.length ? (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-corpo text-texto-2">
          {itens.map((x) => (
            <li key={x} className="border-t border-linha pt-2.5 first:border-t-0 first:pt-0">
              {x}
            </li>
          ))}
        </ul>
      ) : (
        <Nada>{vazio}</Nada>
      )}
    </div>
  );
  return (
    <Parte indice={5}>
      <div className="grid gap-3 md:grid-cols-2">
        {painel("O que pode acelerar ou desencadear", { simbolo: "+", cor: "text-ciano-texto" }, c.gatilhos, "Nenhum gatilho declarado.")}
        {/* desviar não é erro do sistema: é atenção analítica, por isso âmbar e "!", não vermelho */}
        {painel("O que poderia desviar ou invalidar", { simbolo: "!", cor: "text-ambar" }, c.revisao, "Nada declarado.")}
      </div>
      {inflexoes.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <Subtitulo>Momentos da trajetória que decidem o rumo</Subtitulo>
          <ul className="m-0 flex list-none flex-col p-0">
            {inflexoes.map((e) => (
              <li key={e.id} className="grid gap-x-4 gap-y-0.5 border-b border-linha py-2.5 sm:grid-cols-[6.5rem_minmax(0,1fr)]">
                <span className="numeros font-dados text-micro text-ambar">{e.data}</span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-corpo text-texto">{e.texto}</span>
                  {e.condicao && <span className="text-micro text-ambar">{/^se\b/i.test(e.condicao) ? e.condicao : `Se: ${e.condicao}`}</span>}
                </span>
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
  // os que dão força primeiro, depois os que tiram; a ordem da investigação vale dentro de cada grupo
  const sinais = r.sinais
    .filter((s) => s.favorece.includes(c.id) || s.enfraquece.includes(c.id))
    .sort((a, b) => Number(b.favorece.includes(c.id)) - Number(a.favorece.includes(c.id)));
  const favorecem = sinais.filter((s) => s.favorece.includes(c.id)).length;
  return (
    <Parte indice={6}>
      {sinais.length > 0 && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-legenda text-texto-2">
          <Etiqueta estado={{ ...IMPACTO.favorece, rotulo: `${favorecem} a favor` }} />
          <Etiqueta estado={{ ...IMPACTO.enfraquece, rotulo: `${sinais.length - favorecem} contra` }} />
          <span className="text-texto-3">Um sinal dá ou tira força deste cenário; nenhum sinal sozinho o confirma.</span>
        </p>
      )}
      {sinais.length ? (
        <ul className="m-0 flex list-none flex-col p-0">
          {sinais.map((s) => {
            const favorece = s.favorece.includes(c.id);
            return (
              <li key={s.id} className="grid gap-x-6 gap-y-2 border-b border-linha py-4 first:pt-0 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="text-corpo font-medium text-texto">{s.sinal}</p>
                  <p className="text-legenda text-texto-2">{s.leitura}</p>
                  <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-micro text-texto-3">
                    <span>
                      Quando: <span className="numeros font-dados text-ambar">{s.quando}</span>
                    </span>
                    <span>Onde acompanhar: {s.ondeAcompanhar}</span>
                  </p>
                </div>
                <p className="flex-none self-start">
                  <Etiqueta estado={favorece ? IMPACTO.favorece : IMPACTO.enfraquece} />
                </p>
              </li>
            );
          })}
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
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2.5">
            <Subtitulo>Premissas que sustentam o cenário</Subtitulo>
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-corpo text-texto">
              {c.premissas.map((a) => (
                <Frase key={a.texto} a={a} como="li" />
              ))}
            </ul>
          </div>
          {c.favoraveis.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <Subtitulo estado={IMPACTO.favorece}>Evidências a favor</Subtitulo>
              <ul className="m-0 flex list-none flex-col gap-2 p-0 text-legenda text-texto-2">
                {c.favoraveis.map((a) => (
                  <Frase key={a.texto} a={a} como="li" />
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2.5">
            {/* risco analítico, não erro: âmbar e "!" */}
            <Subtitulo estado={{ simbolo: "!", cor: "text-ambar" }}>Onde o raciocínio pode falhar</Subtitulo>
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
            <div className="flex flex-col gap-2.5">
              <Subtitulo estado={{ simbolo: "?", cor: "text-ambar" }}>Incertezas e limitações</Subtitulo>
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
    <footer className="flex flex-col gap-6 border-t border-linha pt-8">
      <p className="max-w-[80ch] text-legenda text-texto-3">
        Cenário prospectivo, não uma previsão. Esta análise foi montada a partir da investigação original (cenário, relações, linha do tempo, sinais e
        evidências), sem acrescentar fatos. Nenhuma probabilidade é atribuída.
      </p>
      {outros.length > 0 && (
        <nav aria-label="Continuar a leitura" className="flex flex-col gap-3 print:hidden">
          <p className="text-legenda font-medium text-texto">Os outros futuros</p>
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
            {outros.map((x) => (
              <li key={x.id} className="flex">
                <Link
                  to={ROTAS.cenarioDaInvestigacao(r.id, x.id)}
                  className="group cartao cartao-interativo flex w-full items-start gap-3 p-4 no-underline"
                >
                  <Letra id={x.id} tamanho="grande" />
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-micro text-texto-3">
                      Cenário {x.id} · {x.arquetipo}
                    </span>
                    <span className="text-corpo font-medium text-texto">{x.nome}</span>
                    <span className="text-legenda text-texto-2">{x.ideia}</span>
                  </span>
                  <ArrowRight size={15} aria-hidden="true" className="mt-1 ml-auto flex-none text-texto-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </footer>
  );
}
