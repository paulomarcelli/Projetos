import { ArrowLeftRight, ChevronDown, ExternalLink, Network, Search } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { dataLonga, hora, numero, plural } from "../../hooks";
import type { AnaliseProspectiva, Cenario, Evidencia, Investigacao } from "../../types/api";
import { Botao, CampoTexto, GrupoSegmentado, Pilula, SeloConfiabilidade, cx } from "../ui";
import { Afirmacao, ListaDeAfirmacoes } from "./Afirmacao";
import { ChipDeEvidencia, hostDaUrl, rotuloDoTipoDeEvidencia } from "./Evidencias";

export const SECOES = [
  { id: "interpretacao", titulo: "Interpretação da questão", curto: "Questão" },
  { id: "contexto", titulo: "Contexto", curto: "Contexto" },
  { id: "atores", titulo: "Atores", curto: "Atores" },
  { id: "relacoes", titulo: "Relações", curto: "Relações" },
  { id: "fatores", titulo: "Fatores determinantes", curto: "Fatores" },
  { id: "incertezas", titulo: "Incertezas críticas", curto: "Incertezas" },
  { id: "cenarios", titulo: "Cenários", curto: "Cenários" },
  { id: "consequencias", titulo: "Consequências", curto: "Consequências" },
  { id: "evidencias", titulo: "Evidências e fontes", curto: "Evidências" },
] as const;

export type IdDaSecao = (typeof SECOES)[number]["id"];

export interface SecoesDaAnaliseProps {
  investigacao: Investigacao;
  analise: AnaliseProspectiva;
  rotuloDaEntidade: (id: string) => string;
  cenarioDestacado: string | null;
  aoVerCenarioNoGrafo: (id: string) => void;
  aoVerEntidadeNoGrafo: (id: string) => void;
  /** há grafo com relações para mostrar? */
  temGrafo: boolean;
}

function Secao({ id, titulo, contagem, children, descricao }: { id: IdDaSecao; titulo: string; contagem?: number; descricao?: ReactNode; children: ReactNode }) {
  const indice = SECOES.findIndex((s) => s.id === id) + 1;
  return (
    <section id={`secao-${id}`} aria-labelledby={`titulo-${id}`} className="scroll-mt-24 lg:scroll-mt-8" data-secao={id}>
      <header className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-xs font-medium text-texto-fraco fr-numeros" aria-hidden="true">
          {String(indice).padStart(2, "0")}
        </span>
        <h2 id={`titulo-${id}`} className="text-xl font-semibold">
          {titulo}
        </h2>
        {contagem !== undefined && <span className="text-sm text-texto-fraco fr-numeros">{numero(contagem)}</span>}
        {descricao && <p className="w-full text-sm text-texto-suave">{descricao}</p>}
      </header>
      {children}
    </section>
  );
}

function Entidades({ ids, rotulo, aoVer }: { ids: string[]; rotulo: (id: string) => string; aoVer?: (id: string) => void }) {
  if (ids.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Entidades">
      {ids.map((e) =>
        aoVer ? (
          <li key={e}>
            <button
              type="button"
              className="inline-flex h-7 items-center gap-1 rounded-full border border-borda-forte px-2.5 text-xs font-medium text-texto-suave transition-[color,border-color] duration-150 passar:border-escarlate passar:text-escarlate"
              onClick={() => aoVer(e)}
              title="Ver no grafo"
            >
              {rotulo(e)}
              <span className="sr-only"> — ver no grafo</span>
            </button>
          </li>
        ) : (
          <li key={e} className="inline-flex h-7 items-center rounded-full border border-borda px-2.5 text-xs text-texto-suave">
            {rotulo(e)}
          </li>
        ),
      )}
    </ul>
  );
}

export function NavegacaoDasSecoes({ ativa, contagens }: { ativa: IdDaSecao; contagens: Partial<Record<IdDaSecao, number>> }) {
  return (
    <nav aria-label="Seções da análise" className="lg:sticky lg:top-6">
      <ol className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {SECOES.map((s, i) => {
          const atual = s.id === ativa;
          return (
            <li key={s.id} className="shrink-0">
              <a
                href={`#secao-${s.id}`}
                aria-current={atual ? "true" : undefined}
                className={cx(
                  "flex h-9 items-center gap-2.5 rounded-xl px-3 text-sm whitespace-nowrap transition-[background-color,color] duration-150",
                  atual ? "bg-superficie-3 font-medium text-texto" : "text-texto-suave passar:bg-superficie-2 passar:text-texto",
                )}
              >
                <span className={cx("text-2xs fr-numeros", atual ? "text-escarlate" : "text-texto-fraco")} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="lg:hidden">{s.curto}</span>
                <span className="hidden lg:inline">{s.titulo}</span>
                {contagens[s.id] !== undefined && <span className="ml-auto hidden text-2xs text-texto-fraco fr-numeros lg:inline">{contagens[s.id]}</span>}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Acompanha a seção visível (para a navegação lateral). */
export function useSecaoAtiva(): IdDaSecao {
  const [ativa, setAtiva] = useState<IdDaSecao>("interpretacao");
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const visiveis = new Map<string, number>();
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) visiveis.set((e.target as HTMLElement).dataset.secao ?? "", e.isIntersecting ? e.boundingClientRect.top : Infinity);
        const primeira = [...visiveis.entries()].filter(([, top]) => top !== Infinity).sort((a, b) => a[1] - b[1])[0];
        if (primeira) setAtiva(primeira[0] as IdDaSecao);
      },
      { rootMargin: "-10% 0px -60% 0px" },
    );
    document.querySelectorAll("[data-secao]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return ativa;
}

export function SecoesDaAnalise({ investigacao, analise: a, rotuloDaEntidade, cenarioDestacado, aoVerCenarioNoGrafo, aoVerEntidadeNoGrafo, temGrafo }: SecoesDaAnaliseProps) {
  const ativa = useSecaoAtiva();
  const evidencias = useMemo(() => Object.values(investigacao.evidencias).sort((x, y) => Number(x.id.slice(1)) - Number(y.id.slice(1))), [investigacao.evidencias]);
  const focais = (investigacao.etapas.find((e) => e.nome === "recuperacao")?.resumo?.entidades_focais as string[] | undefined) ?? [];
  const verEntidade = temGrafo ? aoVerEntidadeNoGrafo : undefined;

  const contagens: Partial<Record<IdDaSecao, number>> = {
    contexto: a.contexto.length,
    atores: a.atores.length,
    relacoes: a.relacoes_sistemicas.length,
    fatores: a.variaveis.length + a.tendencias_e_sinais.length,
    incertezas: a.incertezas_criticas.length,
    cenarios: a.cenarios.length,
    consequencias: a.desdobramentos.length,
    evidencias: evidencias.length,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
      <div className="sticky top-16 z-[5] -mx-1 bg-fundo/80 px-1 py-2 backdrop-blur-vidro lg:static lg:top-auto lg:z-auto lg:m-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <NavegacaoDasSecoes ativa={ativa} contagens={contagens} />
      </div>

      <div className="flex min-w-0 flex-col gap-14">
        {/* 1 */}
        <Secao id="interpretacao" titulo="Interpretação da questão">
          <div className="rounded-3xl border border-borda bg-superficie p-5 sm:p-6">
            <p className="text-lg leading-snug font-medium text-pretty">{a.questao}</p>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-texto-fraco">Horizonte</dt>
                <dd className="mt-0.5">{a.horizonte ?? <span className="text-texto-fraco">não definido</span>}</dd>
              </div>
              <div>
                <dt className="text-xs text-texto-fraco">Continuidade</dt>
                <dd className="mt-0.5">{a.continuidade}</dd>
              </div>
              <div>
                <dt className="text-xs text-texto-fraco">Motor</dt>
                <dd className="mt-0.5">
                  {a.modo === "modelo" ? "Modelo de linguagem" : a.modo === "deterministico" ? "Determinístico" : a.modo}
                  {a.modelo && <span className="block font-mono text-xs text-texto-suave">{a.modelo}</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-texto-fraco">Gerada em</dt>
                <dd className="mt-0.5">
                  {dataLonga(a.gerada_em)}
                  <span className="block text-xs text-texto-suave fr-numeros">{hora(a.gerada_em)}</span>
                </dd>
              </div>
            </dl>
            {focais.length > 0 && (
              <div className="mt-5 border-t border-borda pt-4">
                <p className="mb-2 text-xs text-texto-fraco">Entidades focais reconhecidas na questão</p>
                <Entidades ids={focais} rotulo={rotuloDaEntidade} aoVer={verEntidade} />
              </div>
            )}
          </div>
        </Secao>

        {/* 2 */}
        <Secao id="contexto" titulo="Contexto" contagem={a.contexto.length} descricao="O que as fontes estabelecem antes de qualquer projeção.">
          <ListaDeAfirmacoes itens={a.contexto} vazio="A validação não manteve nenhuma afirmação de contexto." />
        </Secao>

        {/* 3 */}
        <Secao id="atores" titulo="Atores" contagem={a.atores.length}>
          {a.atores.length === 0 ? (
            <ListaDeAfirmacoes itens={[]} vazio="Nenhum ator identificado." />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {a.atores.map((ator) => (
                <li key={ator.entidade} className="flex flex-col gap-4 rounded-3xl border border-borda bg-superficie p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold">{rotuloDaEntidade(ator.entidade)}</h3>
                      <p className="mt-1 text-sm text-texto-suave">{ator.papel}</p>
                    </div>
                    {verEntidade && (
                      <Botao tamanho="pequeno" variante="fantasma" icone={<Network />} onClick={() => verEntidade(ator.entidade)} aria-label={`Ver ${rotuloDaEntidade(ator.entidade)} no grafo`}>
                        Grafo
                      </Botao>
                    )}
                  </div>
                  <div className="border-t border-borda pt-4">
                    <p className="mb-2 text-xs font-medium text-texto-fraco">Fundamentos</p>
                    <ListaDeAfirmacoes itens={ator.fundamentos} tamanho="pequeno" vazio="Sem fundamentos mantidos pela validação." />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Secao>

        {/* 4 */}
        <Secao id="relacoes" titulo="Relações" contagem={a.relacoes_sistemicas.length} descricao="Como os atores se ligam no sistema da questão.">
          {a.relacoes_sistemicas.length === 0 ? (
            <ListaDeAfirmacoes itens={[]} vazio="Nenhuma relação sistêmica com sustentação nas fontes." />
          ) : (
            <ul className="flex flex-col gap-4">
              {a.relacoes_sistemicas.map((r, i) => (
                <li key={i} className="rounded-3xl border border-borda bg-superficie p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="flex flex-wrap items-center gap-1.5 text-base font-semibold">
                      {r.entidades.map((e, j) => (
                        <span key={e} className="inline-flex items-center gap-1.5">
                          {j > 0 && <ArrowLeftRight aria-label="e" size={14} className="text-texto-fraco" />}
                          {rotuloDaEntidade(e)}
                        </span>
                      ))}
                    </span>
                    <Pilula tamanho="pequeno">{r.natureza}</Pilula>
                  </div>
                  <Afirmacao afirmacao={r.descricao} />
                </li>
              ))}
            </ul>
          )}
        </Secao>

        {/* 5 */}
        <Secao id="fatores" titulo="Fatores determinantes" contagem={a.variaveis.length + a.tendencias_e_sinais.length}>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className="rounded-3xl border border-borda bg-superficie p-5">
              <h3 className="mb-4 text-base font-semibold">
                Variáveis <span className="font-normal text-texto-fraco fr-numeros">{a.variaveis.length}</span>
              </h3>
              {a.variaveis.length === 0 ? (
                <ListaDeAfirmacoes itens={[]} />
              ) : (
                <ul className="flex flex-col divide-y divide-borda">
                  {a.variaveis.map((v, i) => (
                    <li key={i} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
                      <h4 className="font-medium">{v.nome}</h4>
                      <Afirmacao afirmacao={v.descricao} tamanho="pequeno" />
                      <Entidades ids={v.entidades} rotulo={rotuloDaEntidade} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-3xl border border-borda bg-superficie p-5">
              <h3 className="mb-4 text-base font-semibold">
                Tendências e sinais <span className="font-normal text-texto-fraco fr-numeros">{a.tendencias_e_sinais.length}</span>
              </h3>
              <ListaDeAfirmacoes itens={a.tendencias_e_sinais} tamanho="pequeno" />
            </div>
          </div>
        </Secao>

        {/* 6 */}
        <Secao id="incertezas" titulo="Incertezas críticas" contagem={a.incertezas_criticas.length} descricao="As perguntas em aberto que mais mudam o desfecho, com os dois polos de cada uma.">
          {a.incertezas_criticas.length === 0 ? (
            <ListaDeAfirmacoes itens={[]} />
          ) : (
            <ul className="flex flex-col gap-4">
              {a.incertezas_criticas.map((inc, i) => (
                <li key={i} className="rounded-3xl border border-borda bg-superficie p-5">
                  <h3 className="text-lg font-semibold">{inc.nome}</h3>
                  {inc.polos.length >= 2 && (
                    <div className="my-5" role="group" aria-label={`Eixo da incerteza: de "${inc.polos[0]}" a "${inc.polos[inc.polos.length - 1]}"`}>
                      <div className="flex items-center gap-2" aria-hidden="true">
                        <span className="size-3 shrink-0 rounded-full border-2 border-texto-suave bg-superficie" />
                        <span className="h-px flex-1 bg-[repeating-linear-gradient(90deg,var(--cor-borda-forte)_0_6px,transparent_6px_10px)]" />
                        <span className="rounded-full border border-borda px-2 text-2xs text-texto-fraco">incerto</span>
                        <span className="h-px flex-1 bg-[repeating-linear-gradient(90deg,var(--cor-borda-forte)_0_6px,transparent_6px_10px)]" />
                        <span className="size-3 shrink-0 rounded-full border-2 border-texto-suave bg-superficie" />
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <p className="text-texto-suave">
                          <span className="sr-only">Polo A: </span>
                          {inc.polos[0]}
                        </p>
                        <p className="text-right text-texto-suave">
                          <span className="sr-only">Polo B: </span>
                          {inc.polos[inc.polos.length - 1]}
                        </p>
                      </div>
                    </div>
                  )}
                  <p className="mb-2 text-xs font-medium text-texto-fraco">Por que importa</p>
                  <Afirmacao afirmacao={inc.por_que_importa} tamanho="pequeno" />
                </li>
              ))}
            </ul>
          )}
        </Secao>

        {/* 7 */}
        <Secao
          id="cenarios"
          titulo="Cenários"
          contagem={a.cenarios.length}
          descricao="Futuros possíveis e condicionais, não previsões. Aprofunde um cenário para ver premissas, desenvolvimento, consequências e sinais."
        >
          {a.cenarios.length === 0 ? (
            <ListaDeAfirmacoes itens={[]} vazio="Esta análise não produziu cenários." />
          ) : (
            <ul className="flex flex-col gap-4">
              {a.cenarios.map((c) => (
                <CartaoDeCenario
                  key={c.id}
                  cenario={c}
                  destacado={cenarioDestacado === c.id}
                  rotuloDaEntidade={rotuloDaEntidade}
                  aoVerNoGrafo={temGrafo ? () => aoVerCenarioNoGrafo(c.id) : undefined}
                />
              ))}
            </ul>
          )}
        </Secao>

        {/* 8 */}
        <Secao id="consequencias" titulo="Consequências" contagem={a.desdobramentos.length} descricao="Desdobramentos e seus efeitos diretos e indiretos.">
          {a.desdobramentos.length === 0 ? (
            <ListaDeAfirmacoes itens={[]} vazio="Nenhum desdobramento com sustentação nas fontes." />
          ) : (
            <ul className="flex flex-col gap-4">
              {a.desdobramentos.map((d, i) => (
                <li key={i} className="rounded-3xl border border-borda bg-superficie p-5">
                  <Afirmacao afirmacao={d.descricao} tamanho="destaque" />
                  <div className="mt-5 grid gap-5 border-t border-borda pt-4 md:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-medium text-texto-fraco">Consequências diretas</p>
                      <ListaDeAfirmacoes itens={d.consequencias_diretas} tamanho="pequeno" vazio="Nenhuma." />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium text-texto-fraco">Consequências indiretas</p>
                      <ListaDeAfirmacoes itens={d.consequencias_indiretas} tamanho="pequeno" vazio="Nenhuma." />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Secao>

        {/* 9 */}
        <Secao id="evidencias" titulo="Evidências e fontes" contagem={evidencias.length} descricao="Tudo o que a análise pode citar, com o texto literal e a confiabilidade da fonte.">
          <ListaDeEvidencias evidencias={evidencias} />
          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            <div className="rounded-3xl border border-borda bg-superficie p-5">
              <h3 className="text-base font-semibold">
                Limitações <span className="font-normal text-texto-fraco fr-numeros">{a.limitacoes.length}</span>
              </h3>
              <p className="mt-1 text-sm text-texto-suave">O que a própria análise declara não saber.</p>
              {a.limitacoes.length === 0 ? (
                <p className="mt-3 text-sm text-texto-fraco">Nenhuma limitação declarada.</p>
              ) : (
                <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm marker:text-texto-fraco">
                  {a.limitacoes.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              )}
            </div>
            <ResumoDaValidacao analise={a} />
          </div>
        </Secao>
      </div>
    </div>
  );
}

function CartaoDeCenario({ cenario: c, destacado, rotuloDaEntidade, aoVerNoGrafo }: { cenario: Cenario; destacado: boolean; rotuloDaEntidade: (id: string) => string; aoVerNoGrafo?: () => void }) {
  const [aberto, setAberto] = useState(false);
  const idCorpo = `cenario-${c.id}-corpo`;
  const partes: { titulo: string; itens: Cenario["premissas"] }[] = [
    { titulo: "Premissas", itens: c.premissas },
    { titulo: "Desenvolvimento", itens: c.desenvolvimento },
    { titulo: "Consequências", itens: c.consequencias },
    { titulo: "Sinais a observar", itens: c.sinais },
  ];
  return (
    <li className={cx("rounded-3xl border bg-superficie transition-[border-color] duration-150", destacado ? "border-escarlate" : "border-borda")} data-cenario={c.id}>
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs text-texto-fraco">{c.id}</p>
            <h3 className="mt-0.5 text-xl font-semibold">{c.nome}</h3>
          </div>
          {destacado && (
            <Pilula tom="escarlate" tamanho="pequeno">
              Destacado no grafo
            </Pilula>
          )}
        </div>
        <p className="mt-4 mb-2 text-xs font-medium text-texto-fraco">Lógica do cenário</p>
        <Afirmacao afirmacao={c.logica} tamanho="destaque" />
        <div className="mt-5 flex flex-wrap gap-2">
          <Botao
            tamanho="pequeno"
            aria-expanded={aberto}
            aria-controls={idCorpo}
            iconeDireita={<ChevronDown className={cx("movimento:transition-transform movimento:duration-200", aberto && "rotate-180")} />}
            onClick={() => setAberto((x) => !x)}
          >
            {aberto ? "Recolher" : "Aprofundar"}
          </Botao>
          {aoVerNoGrafo && (
            <Botao tamanho="pequeno" variante="fantasma" icone={<Network />} onClick={aoVerNoGrafo}>
              Ver no grafo
            </Botao>
          )}
        </div>
      </div>
      {aberto && (
        <div id={idCorpo} className="grid gap-x-8 gap-y-6 border-t border-borda p-5 sm:p-6 md:grid-cols-2">
          {partes.map((p) => (
            <div key={p.titulo}>
              <h4 className="mb-3 text-sm font-semibold">
                {p.titulo} <span className="font-normal text-texto-fraco fr-numeros">{p.itens.length}</span>
              </h4>
              <ListaDeAfirmacoes itens={p.itens} tamanho="pequeno" vazio="Nenhum item." />
            </div>
          ))}
          {c.entidades.length > 0 && (
            <div className="md:col-span-2">
              <h4 className="mb-2 text-sm font-semibold">Entidades envolvidas</h4>
              <Entidades ids={c.entidades} rotulo={rotuloDaEntidade} />
            </div>
          )}
        </div>
      )}
    </li>
  );
}

type FiltroDeFonte = "todas" | "oficial" | "enciclopedia" | "wiki_fas";

function ListaDeEvidencias({ evidencias }: { evidencias: Evidencia[] }) {
  const [filtro, setFiltro] = useState<FiltroDeFonte>("todas");
  const [termo, setTermo] = useState("");
  const [limite, setLimite] = useState(12);
  const contagem = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of evidencias) c[e.fonte.confiabilidade] = (c[e.fonte.confiabilidade] ?? 0) + 1;
    return c;
  }, [evidencias]);
  const filtradas = useMemo(() => {
    const t = termo.trim().toLocaleLowerCase("pt-BR");
    return evidencias.filter(
      (e) =>
        (filtro === "todas" || e.fonte.confiabilidade === filtro) &&
        (!t || e.id.toLowerCase() === t || e.texto.toLocaleLowerCase("pt-BR").includes(t) || (e.fonte.titulo ?? "").toLocaleLowerCase("pt-BR").includes(t)),
    );
  }, [evidencias, filtro, termo]);

  if (evidencias.length === 0) return <ListaDeAfirmacoes itens={[]} vazio="Nenhuma evidência foi registrada." />;

  const opcoes = [
    { valor: "todas" as const, rotulo: `Todas ${evidencias.length}` },
    { valor: "oficial" as const, rotulo: `Oficial ${contagem.oficial ?? 0}`, desativada: !contagem.oficial },
    { valor: "enciclopedia" as const, rotulo: `Enciclopédia ${contagem.enciclopedia ?? 0}`, desativada: !contagem.enciclopedia },
    { valor: "wiki_fas" as const, rotulo: `Wiki de fãs ${contagem.wiki_fas ?? 0}`, desativada: !contagem.wiki_fas },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="min-w-0 overflow-x-auto md:flex-1">
          <GrupoSegmentado rotulo="Filtrar por confiabilidade da fonte" opcoes={opcoes} valor={filtro} aoMudar={(v) => (setFiltro(v), setLimite(12))} tamanho="pequeno" className="min-w-[30rem]" />
        </div>
        <CampoTexto
          rotulo="Buscar nas evidências"
          rotuloOculto
          prefixo={<Search size={16} />}
          placeholder="Buscar texto, fonte ou E12"
          value={termo}
          onChange={(e) => (setTermo(e.target.value), setLimite(12))}
          classeDoGrupo="md:w-72"
        />
      </div>
      <p className="text-xs text-texto-fraco" aria-live="polite">
        {filtradas.length === evidencias.length ? `${plural(evidencias.length, "evidência", "evidências")}` : `${numero(filtradas.length)} de ${plural(evidencias.length, "evidência", "evidências")}`}
      </p>
      <ul className="flex flex-col divide-y divide-borda rounded-3xl border border-borda bg-superficie">
        {filtradas.slice(0, limite).map((e) => (
          <li key={e.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:gap-4">
            <div className="flex shrink-0 items-center gap-2 sm:w-16 sm:flex-col sm:items-start">
              <ChipDeEvidencia id={e.id} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-medium">{e.fonte.titulo ?? e.fonte.doc_id}</span>
                <SeloConfiabilidade confiabilidade={e.fonte.confiabilidade} compacto />
                <span className="text-xs text-texto-fraco">{rotuloDoTipoDeEvidencia(e.tipo)}</span>
              </div>
              <p lang="en" className="mt-1 line-clamp-3 text-sm text-texto-suave">
                {e.texto}
              </p>
              {e.fonte.url && (
                <a href={e.fonte.url} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex max-w-full items-center gap-1 text-xs text-texto-suave passar:text-escarlate">
                  <span className="truncate">{hostDaUrl(e.fonte.url)}</span>
                  <ExternalLink aria-hidden="true" size={12} className="shrink-0" />
                  <span className="sr-only">(abre em outra aba)</span>
                </a>
              )}
            </div>
          </li>
        ))}
        {filtradas.length === 0 && <li className="p-4 text-sm text-texto-fraco">Nenhuma evidência com esse filtro.</li>}
      </ul>
      {filtradas.length > limite && (
        <Botao tamanho="pequeno" className="self-start" onClick={() => setLimite((l) => l + 24)}>
          Mostrar mais {Math.min(24, filtradas.length - limite)} de {numero(filtradas.length - limite)}
        </Botao>
      )}
    </div>
  );
}

function ResumoDaValidacao({ analise: a }: { analise: AnaliseProspectiva }) {
  const v = a.validacao;
  const itens = [
    { rotulo: "Rebaixadas", desc: "tipo epistêmico reduzido por falta de evidência", lista: v.rebaixadas },
    { rotulo: "Removidas", desc: "afirmações retiradas da análise", lista: v.removidas },
    { rotulo: "Citações inválidas", desc: "evidências citadas que não existem", lista: v.citacoes_invalidas },
    { rotulo: "Entidades desconhecidas", desc: "entidades que a base não reconhece", lista: v.entidades_desconhecidas },
  ];
  const total = itens.reduce((n, i) => n + i.lista.length, 0);
  return (
    <div className="rounded-3xl border border-borda bg-superficie p-5">
      <h3 className="text-base font-semibold">Validação</h3>
      <p className="mt-1 text-sm text-texto-suave">
        {total === 0 ? "Todas as afirmações passaram pela validação sem ajustes." : "A validação conferiu cada afirmação contra as evidências e ajustou o que não se sustentava."}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        {itens.map((i) => (
          <div key={i.rotulo} className="rounded-xl bg-superficie-2 px-3 py-2.5">
            <dt className="text-xs text-texto-fraco">{i.rotulo}</dt>
            <dd className={cx("text-2xl font-medium fr-numeros", i.lista.length > 0 ? "text-aviso" : "text-texto")}>{numero(i.lista.length)}</dd>
          </div>
        ))}
      </dl>
      {total > 0 && (
        <details className="group mt-4">
          <summary className="cursor-pointer list-none text-sm font-medium text-texto-suave passar:text-escarlate [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-1">
              Ver os ajustes <ChevronDown aria-hidden="true" size={14} className="group-open:rotate-180" />
            </span>
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            {itens
              .filter((i) => i.lista.length)
              .map((i) => (
                <div key={i.rotulo}>
                  <p className="text-xs font-medium text-texto-fraco">
                    {i.rotulo} — {i.desc}
                  </p>
                  <ul className="mt-1 flex flex-col gap-1 text-xs text-texto-suave">
                    {i.lista.map((x, j) => (
                      <li key={j} className="rounded-md bg-superficie-2 px-2 py-1 font-mono break-words">
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </details>
      )}
    </div>
  );
}

