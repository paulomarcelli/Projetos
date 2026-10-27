import { ArrowLeft, ExternalLink, ScanSearch } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { RELACOES, GramaticaDeRelacoes, type TipoRelacao } from "../components/Diagramas";
import { Epistemico } from "../components/Epistemico";
import { Aviso, EstadoVazio, LinhasEsqueleto } from "../components/Estados";
import { MapaMundo } from "../components/MapaMundo";
import type { RegiaoId } from "../geo/regioes-def";
import type { Afirmacao, Efeito, Fonte, ResultadoDeInvestigacao, TrajetoriaId } from "../lib/investigacao";
import { ROTAS } from "../lib/rotas";

// ------------------------------------------------------------------ apoio

const MESES = ["jan.", "fev.", "mar.", "abr.", "maio", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];

/** "2026-10-25" → "25 out. 2026"; "2026-10" → "out. 2026"; "2026" → "2026". */
function dataDaFonte(d: string) {
  const [ano, mes, dia] = d.split("-");
  if (!mes) return ano;
  const m = MESES[Number(mes) - 1] ?? mes;
  return dia ? `${Number(dia)} ${m} ${ano}` : `${m} ${ano}`;
}

function rolarPara(id: string) {
  const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "start" });
}

const EFEITO: Record<Efeito, { rotulo: string; cor: string }> = {
  aproximacao: { rotulo: "Aproximação", cor: "rgb(82 199 232 / 0.46)" },
  atrito: { rotulo: "Atrito", cor: "rgb(233 180 91 / 0.5)" },
  misto: { rotulo: "Misto", cor: "url(#hachura-misto)" },
  neutro: { rotulo: "Sem mudança relevante", cor: "rgb(154 170 192 / 0.3)" },
};

const SECOES = [
  ["sintese", "Síntese"],
  ["ponto-de-partida", "Ponto de partida"],
  ["premissas", "Premissas"],
  ["variaveis", "Variáveis críticas"],
  ["trajetorias", "Trajetórias"],
  ["linha-do-tempo", "Linha do tempo"],
  ["efeitos", "Efeitos no mundo"],
  ["atores", "Atores e relações"],
  ["sinais", "Sinais"],
  ["limitacoes", "Limitações"],
  ["fontes", "Fontes"],
] as const;

// ------------------------------------------------------------------ peças

function Citacoes({ ids, numeros, fontes }: { ids?: string[]; numeros: Map<string, number>; fontes: Map<string, Fonte> }) {
  if (!ids?.length) return null;
  return (
    <span className="whitespace-nowrap">
      {ids.map((id) => {
        const f = fontes.get(id);
        const n = numeros.get(id);
        if (!f || !n) return null;
        return (
          <a
            key={id}
            href={f.url}
            target="_blank"
            rel="noreferrer"
            title={`${f.veiculo}: ${f.titulo}`}
            aria-label={`Fonte ${n}: ${f.veiculo}, ${f.titulo} (abre em nova aba)`}
            className="ml-0.5 align-super font-dados text-[0.6875rem] text-ciano-texto no-underline hover:underline focus-visible:underline"
          >
            [{n}]
          </a>
        );
      })}
    </span>
  );
}

function ListaDeAfirmacoes({ itens, ctx, destaque = false }: { itens: Afirmacao[]; ctx: Contexto; destaque?: boolean }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-5 p-0">
      {itens.map((a, i) => (
        <li key={i} className="flex min-w-0 flex-col gap-1.5">
          <Epistemico tipo={a.tipo} />
          <p className={`max-w-[68ch] font-editorial ${destaque ? "text-leitura text-texto" : "text-corpo text-texto"}`}>
            {a.texto}
            <Citacoes ids={a.fontes} numeros={ctx.numeros} fontes={ctx.fontes} />
          </p>
        </li>
      ))}
    </ul>
  );
}

function Bloco({ id, titulo, subtitulo, children, acao }: { id: string; titulo: string; subtitulo?: string; children: ReactNode; acao?: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`t-${id}`} className="min-w-0 scroll-mt-24 border-t border-linha-forte pt-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`t-${id}`} className="font-editorial text-secao font-medium text-texto">
            {titulo}
          </h2>
          {subtitulo && <p className="mt-1 max-w-[62ch] text-legenda text-texto-2">{subtitulo}</p>}
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}

function Letra({ id, ativa = false }: { id: TrajetoriaId; ativa?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-grid size-6 shrink-0 place-items-center rounded-fino border font-dados text-micro ${
        ativa ? "border-ambar bg-ambar-suave text-ambar" : "border-linha-forte text-texto-2"
      }`}
    >
      {id}
    </span>
  );
}

function SeletorDeTrajetoria({ r, ativa, aoEscolher }: { r: ResultadoDeInvestigacao; ativa: TrajetoriaId; aoEscolher: (t: TrajetoriaId) => void }) {
  return (
    <div role="group" aria-label="Trajetória exibida" className="flex flex-wrap gap-1.5">
      {r.trajetorias.map((t) => (
        <button key={t.id} type="button" className="ficha" aria-pressed={t.id === ativa} onClick={() => aoEscolher(t.id)} title={t.nome}>
          <span className="font-dados">{t.id}</span>
          <span className="sr-only">: {t.nome}</span>
        </button>
      ))}
    </div>
  );
}

interface Contexto {
  numeros: Map<string, number>;
  fontes: Map<string, Fonte>;
}

// ------------------------------------------------------------------ seções visuais

function LinhaDoTempo({ r, ativa, aoEscolher }: { r: ResultadoDeInvestigacao; ativa: TrajetoriaId; aoEscolher: (t: TrajetoriaId) => void }) {
  const anos = Array.from({ length: r.horizonte.fim - r.horizonte.inicio + 1 }, (_, i) => r.horizonte.inicio + i);
  const colunas = { gridTemplateColumns: `9.5rem repeat(${anos.length}, minmax(0, 1fr))` };
  return (
    <div className="relative overflow-x-auto" tabIndex={0} role="region" aria-label="Linha do tempo (role para os lados no celular)">
      <div className="min-w-[760px]">
        <div className="grid border-b border-linha-forte pb-2" style={colunas}>
          <span />
          {anos.map((a) => (
            <span key={a} className="numeros border-l border-linha pl-3 font-dados text-legenda text-ambar">
              {a}
            </span>
          ))}
        </div>
        <div className="grid border-b border-linha py-3" style={colunas}>
          <span className="rotulo self-start pt-0.5">Calendário fixo</span>
          {anos.map((a) => (
            <ul key={a} className="m-0 flex list-none flex-col gap-2 border-l border-linha px-3">
              {r.calendario
                .filter((c) => c.ano === a)
                .map((c) => (
                  <li key={c.texto} className="flex flex-col gap-0.5">
                    <span className="inline-flex items-center gap-1.5 font-dados text-micro text-texto-3">
                      <Epistemico tipo="fato" compacto />
                      {c.data}
                    </span>
                    <span className="text-legenda text-texto">{c.texto}</span>
                  </li>
                ))}
            </ul>
          ))}
        </div>
        {r.trajetorias.map((t) => {
          const eAtiva = t.id === ativa;
          return (
            <div key={t.id} className={`grid border-b border-linha py-3 transicao-preenchimento ${eAtiva ? "" : "opacity-55"}`} style={colunas}>
              <button
                type="button"
                onClick={() => aoEscolher(t.id)}
                aria-pressed={eAtiva}
                className="flex items-start gap-2 self-start rounded-fino pr-2 text-left text-legenda text-texto-2 hover:text-texto focus-visible:outline-2 focus-visible:outline-ciano"
              >
                <Letra id={t.id} ativa={eAtiva} />
                <span className="min-w-0 leading-snug">{t.nome}</span>
              </button>
              {anos.map((a) => (
                <p key={a} className={`border-l px-3 text-legenda ${eAtiva ? "border-ambar/60 text-texto" : "border-linha text-texto-2"}`}>
                  {t.marcos.find((m) => m.ano === a)?.texto ?? ""}
                </p>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EfeitosNoMundo({ r, ativa }: { r: ResultadoDeInvestigacao; ativa: TrajetoriaId }) {
  const t = r.trajetorias.find((x) => x.id === ativa)!;
  const porRegiao = new Map<RegiaoId, Efeito>();
  for (const e of t.efeitos) for (const g of e.regioes) if (!porRegiao.has(g)) porRegiao.set(g, e.efeito);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
      <figure className="m-0 flex min-w-0 flex-col gap-3">
        <div className="painel p-2 sm:p-3">
          <MapaMundo
            rotulo={`Efeitos da trajetória ${t.id} (${t.nome}) por região do mundo`}
            corDaRegiao={(g) => (g ? (porRegiao.has(g) ? EFEITO[porRegiao.get(g)!].cor : undefined) : undefined)}
            destaque={["076"]}
            defs={
              <pattern id="hachura-misto" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" fill="rgb(82 199 232 / 0.4)" />
                <rect width="3" height="6" fill="rgb(233 180 91 / 0.5)" />
              </pattern>
            }
          />
        </div>
        <figcaption className="flex flex-col gap-2">
          <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0">
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
            <li className="inline-flex items-center gap-1.5 text-micro text-texto-2">
              <svg width="14" height="10" aria-hidden="true">
                <rect x="0.5" y="0.5" width="13" height="9" rx="2" fill="none" stroke="var(--color-texto)" strokeWidth="1.2" />
              </svg>
              Brasil
            </li>
          </ul>
          <p className="text-micro text-texto-3">
            As cores pintam regiões inteiras do recorte do Iris: “China”, por exemplo, colore toda a Ásia-Pacífico. Leia o
            texto ao lado para saber a quem o efeito se refere.
          </p>
        </figcaption>
      </figure>
      <ul className="m-0 flex list-none flex-col divide-y divide-linha p-0" aria-live="polite">
        {t.efeitos.map((e) => (
          <li key={e.regiao} className="flex flex-col gap-1 py-3 first:pt-0">
            <span className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-corpo font-medium text-texto">{e.regiao}</span>
              <span
                className={`rounded-full border px-2 py-0.5 text-micro ${
                  e.efeito === "aproximacao"
                    ? "border-ciano/40 text-ciano-texto"
                    : e.efeito === "atrito"
                      ? "border-ambar/40 text-ambar"
                      : "border-linha-forte text-texto-2"
                }`}
              >
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

function RedeDeAtores({ r, ativa }: { r: ResultadoDeInvestigacao; ativa: TrajetoriaId }) {
  const t = r.trajetorias.find((x) => x.id === ativa)!;
  const pos = new Map(r.atores.map((a) => [a.id, a]));
  const envolvidos = new Set(t.relacoes.flatMap((x) => [x.de, x.para]));
  const estilo = new Map(RELACOES.map((x) => [x.tipo, x]));
  const tiposUsados = [...new Set(t.relacoes.map((x) => x.tipo))] as TipoRelacao[];

  // Relações entre o mesmo par ganham curvaturas diferentes para não se sobrepor.
  const contagem = new Map<string, number>();
  const linhas = t.relacoes.map((rel, i) => {
    const par = [rel.de, rel.para].sort().join("|");
    const k = contagem.get(par) ?? 0;
    contagem.set(par, k + 1);
    const a = pos.get(rel.de)!;
    const b = pos.get(rel.para)!;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.hypot(dx, dy) || 1;
    const curva = k === 0 ? 0 : k % 2 ? 34 : -34;
    const cx = (a.x + b.x) / 2 + (-dy / dist) * curva;
    const cy = (a.y + b.y) / 2 + (dx / dist) * curva;
    // encurta as pontas para não cobrir os nós
    const recuo = 12;
    const ux1 = cx - a.x, uy1 = cy - a.y, l1 = Math.hypot(ux1, uy1) || 1;
    const ux2 = cx - b.x, uy2 = cy - b.y, l2 = Math.hypot(ux2, uy2) || 1;
    const x1 = a.x + (ux1 / l1) * recuo, y1 = a.y + (uy1 / l1) * recuo;
    const x2 = b.x + (ux2 / l2) * recuo, y2 = b.y + (uy2 / l2) * recuo;
    const e = estilo.get(rel.tipo)!;
    return { i, d: `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`, e, rel };
  });

  const descricao = t.relacoes
    .map((x) => `${pos.get(x.de)?.nome} → ${pos.get(x.para)?.nome}: ${estilo.get(x.tipo)?.rotulo}`)
    .join("; ");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
      <figure className="painel m-0 min-w-0 p-3">
        <svg viewBox="0 0 600 380" className="block h-auto w-full" role="img" aria-label={`Rede de atores na trajetória ${t.id}. ${descricao}`}>
          <defs>
            {RELACOES.filter((x) => x.seta).map((x) => (
              <marker key={x.tipo} id={`seta-${x.tipo}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M1 1 9 5 1 9" fill="none" stroke={x.cor} strokeWidth="1.6" />
              </marker>
            ))}
          </defs>
          {linhas.map(({ i, d, e }) => (
            <path
              key={`${ativa}-${i}`}
              d={d}
              fill="none"
              stroke={e.cor}
              strokeWidth={e.tipo === "alianca" ? 2 : 1.6}
              strokeDasharray={e.traco || undefined}
              strokeLinecap="round"
              markerEnd={e.seta ? `url(#seta-${e.tipo})` : undefined}
              className="aparecer"
            />
          ))}
          {r.atores.map((a) => {
            const ativo = envolvidos.has(a.id);
            const ehBrasil = a.id === "brasil";
            return (
              <g key={a.id} className="transicao-preenchimento" opacity={ativo ? 1 : 0.35}>
                <circle cx={a.x} cy={a.y} r={ehBrasil ? 8 : 6} fill={ehBrasil ? "var(--color-texto)" : "var(--color-grafite-alto)"} stroke="var(--color-texto)" strokeWidth="1.2" />
                <text x={a.x} y={a.y + (a.y > 300 ? 26 : -16)} textAnchor="middle" fill="var(--color-texto)" stroke="var(--color-institucional)" strokeWidth={4} paintOrder="stroke" style={{ font: "500 13px var(--font-interface)" }}>
                  {a.nome}
                </text>
              </g>
            );
          })}
        </svg>
        <figcaption className="px-1 pt-2 text-micro text-texto-3">
          Posições esquemáticas, não geográficas. Atores esmaecidos não têm relação descrita nesta trajetória.
        </figcaption>
      </figure>
      <div className="flex flex-col gap-5">
        <div>
          <p className="rotulo mb-3">Relações nesta trajetória</p>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0" aria-live="polite">
            {t.relacoes.map((x, i) => (
              <li key={i} className="text-legenda text-texto-2">
                <span className="text-texto">{pos.get(x.de)?.nome}</span> → <span className="text-texto">{pos.get(x.para)?.nome}</span>
                <span className="text-texto-3"> · {estilo.get(x.tipo)?.rotulo}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="rotulo mb-3">Legenda</p>
          <GramaticaDeRelacoes tipos={tiposUsados} />
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ página

export function ResultadoInvestigacao({ r }: { r: ResultadoDeInvestigacao }) {
  const [ativa, setAtiva] = useState<TrajetoriaId>("A");
  const ctx = useMemo<Contexto>(
    () => ({
      numeros: new Map(r.fontes.map((f, i) => [f.id, i + 1])),
      fontes: new Map(r.fontes.map((f) => [f.id, f])),
    }),
    [r],
  );
  const trajetoriaAtiva = r.trajetorias.find((t) => t.id === ativa)!;

  return (
    <article className="flex flex-col gap-8">
      <Link to={ROTAS.investigacoes} className="inline-flex w-fit items-center gap-1.5 text-legenda text-texto-2 hover:text-texto">
        <ArrowLeft size={14} aria-hidden="true" />
        Investigações
      </Link>

      <header className="flex flex-col gap-5 border-b border-linha pb-7">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="rotulo">Investigação · {r.natureza}</p>
          <Epistemico tipo="limitacao" rotulo="Simulação ilustrativa, elaborada manualmente" />
        </div>
        <h1 className="max-w-[30ch] font-editorial text-titulo font-medium tracking-[-0.01em] text-balance text-texto">{r.pergunta}</h1>
        <dl className="m-0 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["Horizonte", <span className="numeros font-dados text-ambar">{`${r.horizonte.inicio}–${r.horizonte.fim}`}</span>],
              ["Escopo", r.escopo],
              ["Dimensões", r.dimensoes.join(" · ")],
              ["Profundidade", `${r.profundidade} · atualizada em ${dataDaFonte(r.atualizadoEm)}`],
            ] as [string, ReactNode][]
          ).map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-micro text-texto-3">{k}</dt>
              <dd className="m-0 mt-0.5 text-legenda text-texto">{v}</dd>
            </div>
          ))}
        </dl>
        <Aviso tom="atencao" titulo="Contrafactual: este caminho não aconteceu">
          <span className="flex flex-col gap-1.5">
            <Epistemico tipo={r.avisoDeContexto.tipo} />
            <span>
              {r.avisoDeContexto.texto}
              <Citacoes ids={r.avisoDeContexto.fontes} numeros={ctx.numeros} fontes={ctx.fontes} />
            </span>
          </span>
        </Aviso>
      </header>

      <nav aria-label="Seções da investigação" className="relative -mt-2 overflow-x-auto lg:hidden">
        <ul className="m-0 flex w-max list-none gap-1.5 p-0 pb-1">
          {SECOES.map(([id, nome]) => (
            <li key={id}>
              <button type="button" className="ficha whitespace-nowrap" onClick={() => rolarPara(id)}>
                {nome}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_11.5rem] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-12">
          <Bloco id="sintese" titulo="Síntese" subtitulo="O essencial em quatro afirmações. Cada uma diz de que tipo é.">
            <ListaDeAfirmacoes itens={r.sintese} ctx={ctx} destaque />
          </Bloco>

          <Bloco id="ponto-de-partida" titulo="Ponto de partida" subtitulo="O que se sabia em outubro de 2026, com a fonte de cada afirmação.">
            <ListaDeAfirmacoes itens={r.pontoDePartida} ctx={ctx} />
          </Bloco>

          <Bloco id="premissas" titulo="Premissas" subtitulo="O que esta investigação supõe. Se uma premissa cair, as trajetórias mudam.">
            <ListaDeAfirmacoes itens={r.premissas} ctx={ctx} />
          </Bloco>

          <Bloco
            id="variaveis"
            titulo="Variáveis críticas"
            subtitulo="As forças que mais separam um futuro do outro, e a direção de cada uma em cada trajetória."
            acao={<SeletorDeTrajetoria r={r} ativa={ativa} aoEscolher={setAtiva} />}
          >
            <ul className="m-0 flex list-none flex-col divide-y divide-linha p-0">
              {r.variaveis.map((v) => (
                <li key={v.nome} className="grid gap-4 py-5 first:pt-0 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
                  <div className="flex min-w-0 flex-col gap-2">
                    <p className="font-editorial text-leitura text-texto">{v.nome}</p>
                    <p className="text-legenda text-texto-2">{v.porQueImporta}</p>
                    <div className="flex flex-col gap-1">
                      <Epistemico tipo={v.estadoAtual.tipo} rotulo={`Hoje · ${v.estadoAtual.tipo === "fato" ? "fato observado" : "evidência"}`} />
                      <p className="text-legenda text-texto">
                        {v.estadoAtual.texto}
                        <Citacoes ids={v.estadoAtual.fontes} numeros={ctx.numeros} fontes={ctx.fontes} />
                      </p>
                    </div>
                  </div>
                  <ol className="m-0 grid list-none gap-2 p-0 sm:grid-cols-3">
                    {(["A", "B", "C"] as TrajetoriaId[]).map((id) => (
                      <li
                        key={id}
                        className={`flex gap-2 rounded-padrao border p-3 text-legenda transicao-preenchimento ${
                          id === ativa ? "border-ambar/45 bg-ambar-suave text-texto" : "border-linha text-texto-2"
                        }`}
                      >
                        <Letra id={id} ativa={id === ativa} />
                        <span className="min-w-0">{v.direcao[id]}</span>
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ul>
          </Bloco>

          <Bloco
            id="trajetorias"
            titulo="Trajetórias"
            subtitulo="Três futuros condicionais. Não são previsões nem têm probabilidade: valem se as premissas de cada um se confirmarem."
          >
            <ol className="m-0 grid list-none gap-4 p-0 lg:grid-cols-3">
              {r.trajetorias.map((t) => {
                const eAtiva = t.id === ativa;
                return (
                  <li key={t.id} className={`painel flex min-w-0 flex-col gap-4 p-5 transicao-preenchimento ${eAtiva ? "border-ambar/50" : ""}`}>
                    <div className="flex items-start gap-3">
                      <Letra id={t.id} ativa={eAtiva} />
                      <div className="min-w-0">
                        <Epistemico tipo="cenario" />
                        <h3 className="mt-1 font-editorial text-leitura font-medium text-texto">{t.nome}</h3>
                      </div>
                    </div>
                    <p className="text-legenda text-texto-2">{t.resumo}</p>
                    <div>
                      <p className="rotulo mb-2">Só vale se</p>
                      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                        {t.premissas.map((p) => (
                          <li key={p} className="flex gap-2 text-legenda text-texto">
                            <span aria-hidden="true" className="mt-[0.45em] size-1.5 shrink-0 rotate-45 border border-ambar" />
                            <span className="min-w-0">{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      className={`botao botao-pequeno mt-auto w-fit ${eAtiva ? "botao-secundario" : "botao-fantasma"}`}
                      aria-pressed={eAtiva}
                      onClick={() => setAtiva(t.id)}
                    >
                      {eAtiva ? "Exibida no mapa e na rede" : "Exibir no mapa e na rede"}
                    </button>
                  </li>
                );
              })}
            </ol>
          </Bloco>

          <Bloco id="linha-do-tempo" titulo="Linha do tempo, 2027–2030" subtitulo="Datas fixas do calendário (fatos) e marcos possíveis de cada trajetória (cenários).">
            <LinhaDoTempo r={r} ativa={ativa} aoEscolher={setAtiva} />
          </Bloco>

          <Bloco
            id="efeitos"
            titulo="Efeitos no mundo"
            subtitulo={`Trajetória ${ativa}: ${trajetoriaAtiva.nome}. Troque a trajetória para comparar.`}
            acao={<SeletorDeTrajetoria r={r} ativa={ativa} aoEscolher={setAtiva} />}
          >
            <EfeitosNoMundo r={r} ativa={ativa} />
          </Bloco>

          <Bloco
            id="atores"
            titulo="Atores e relações"
            subtitulo={`Como os principais atores se ligariam na trajetória ${ativa}.`}
            acao={<SeletorDeTrajetoria r={r} ativa={ativa} aoEscolher={setAtiva} />}
          >
            <RedeDeAtores r={r} ativa={ativa} />
          </Bloco>

          <Bloco id="sinais" titulo="Sinais a acompanhar" subtitulo="O que observar para saber qual trajetória ganha força. Num contrafactual, servem para testar o raciocínio.">
            <div className="relative overflow-x-auto" tabIndex={0} role="region" aria-label="Tabela de sinais">
              <table className="w-full min-w-[720px] border-collapse text-left text-legenda">
                <thead>
                  <tr className="border-b border-linha-forte text-micro text-texto-3">
                    <th scope="col" className="py-2 pr-4 font-normal">Sinal</th>
                    <th scope="col" className="py-2 pr-4 font-normal">Variável</th>
                    <th scope="col" className="py-2 pr-4 font-normal">Favorece</th>
                    <th scope="col" className="py-2 pr-4 font-normal">Onde acompanhar</th>
                    <th scope="col" className="py-2 font-normal">Quando</th>
                  </tr>
                </thead>
                <tbody>
                  {r.sinais.map((s) => (
                    <tr key={s.sinal} className="border-b border-linha align-top">
                      <td className="py-3 pr-4 text-texto">{s.sinal}</td>
                      <td className="py-3 pr-4 text-texto-2">{s.variavel}</td>
                      <td className="py-3 pr-4">
                        {s.favorece.length === r.trajetorias.length ? (
                          <span className="text-texto-3">Todas (contexto)</span>
                        ) : (
                          <span className="flex gap-1">
                            {s.favorece.map((f) => (
                              <Letra key={f} id={f} ativa={f === ativa} />
                            ))}
                            <span className="sr-only">Trajetória {s.favorece.join(", ")}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-texto-2">{s.ondeAcompanhar}</td>
                      <td className="numeros py-3 font-dados text-micro whitespace-nowrap text-texto-2">{s.quando}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Bloco>

          <Bloco id="limitacoes" titulo="Limitações" subtitulo="O que esta investigação não sustenta.">
            <ListaDeAfirmacoes itens={r.limitacoes} ctx={ctx} />
          </Bloco>

          <Bloco id="fontes" titulo="Fontes" subtitulo={`${r.fontes.length} fontes consultadas. Os números entre colchetes no texto apontam para cá.`}>
            <ol className="m-0 flex list-none flex-col divide-y divide-linha p-0">
              {r.fontes.map((f, i) => (
                <li key={f.id} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-2 py-3 first:pt-0">
                  <span className="numeros font-dados text-legenda text-texto-3">[{i + 1}]</span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <a href={f.url} target="_blank" rel="noreferrer" className="inline-flex w-fit items-baseline gap-1.5 text-corpo text-ciano-texto hover:underline [overflow-wrap:anywhere]">
                      {f.titulo}
                      <ExternalLink size={12} aria-hidden="true" className="shrink-0" />
                      <span className="sr-only">(abre em nova aba)</span>
                    </a>
                    <span className="text-micro text-texto-3">
                      {f.veiculo} · {dataDaFonte(f.data)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </Bloco>

          <p className="border-t border-linha pt-4 text-micro text-texto-3">{r.origem}</p>
        </div>

        <aside className="hidden lg:block">
          <nav aria-label="Seções da investigação" className="sticky top-6 flex flex-col gap-3">
            <p className="rotulo">Nesta investigação</p>
            <ul className="m-0 flex list-none flex-col gap-0.5 border-l border-linha p-0">
              {SECOES.map(([id, nome]) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => rolarPara(id)}
                    className="-ml-px border-l border-transparent py-1 pl-3 text-left text-legenda text-texto-2 hover:border-texto-2 hover:text-texto focus-visible:outline-2 focus-visible:outline-ciano"
                  >
                    {nome}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </article>
  );
}

// ------------------------------------------------------------------ rota

/**
 * `/app/investigacoes/:id`. Ainda não há API de investigações: fora da prévia, todo endereço
 * leva a um estado vazio honesto. Na prévia, o exemplo é carregado sob demanda (e não entra no
 * build normal).
 */
// A condição fica escrita aqui (e não via PREVIA) para o build normal descartar o exemplo.
const carregarExemplo = import.meta.env.MODE === "previa" ? () => import("../previa/investigacao-exemplo") : null;

export function PaginaDaInvestigacao() {
  const { id = "" } = useParams();
  const [estado, setEstado] = useState<{ tipo: "carregando" } | { tipo: "pronto"; r: ResultadoDeInvestigacao } | { tipo: "ausente" }>(
    carregarExemplo ? { tipo: "carregando" } : { tipo: "ausente" },
  );

  useEffect(() => {
    if (!carregarExemplo) return;
    let vivo = true;
    carregarExemplo().then(({ INVESTIGACAO_EXEMPLO }) => {
      if (vivo) setEstado(INVESTIGACAO_EXEMPLO.id === id ? { tipo: "pronto", r: INVESTIGACAO_EXEMPLO } : { tipo: "ausente" });
    });
    return () => {
      vivo = false;
    };
  }, [id]);

  if (estado.tipo === "carregando") return <LinhasEsqueleto linhas={6} />;
  if (estado.tipo === "pronto") return <ResultadoInvestigacao r={estado.r} />;
  return (
    <EstadoVazio
      icone={<ScanSearch size={22} strokeWidth={1.5} aria-hidden="true" />}
      titulo="Investigação não encontrada"
      marcador={{ tipo: "limitacao", rotulo: "Motor de investigação ainda não implementado" }}
      acao={
        <Link to={ROTAS.investigacoes} className="botao botao-secundario botao-pequeno">
          Voltar às investigações
        </Link>
      }
    >
      Ainda não há investigações processadas. Quando o motor existir, cada resultado terá um endereço próprio como este.
    </EstadoVazio>
  );
}

export default PaginaDaInvestigacao;
