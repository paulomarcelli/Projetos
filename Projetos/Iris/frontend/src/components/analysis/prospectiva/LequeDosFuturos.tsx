/**
 * Leque dos futuros: o presente à esquerda e os cenários à direita, no fim do horizonte, ligados pelas escolhas que os
 * separam. As bifurcações saem só de `posicao` (o polo de cada cenário em cada incerteza crítica): nada é estimado, e
 * nenhum ramo é mais grosso ou mais provável que outro.
 *
 * Como a árvore é montada: em cada passo, a incerteza que divide os cenários em menos grupos (e sem "indiferente")
 * abre a bifurcação; os grupos seguem para as incertezas restantes. Quando nenhuma incerteza separa os cenários, eles
 * saem juntos do presente, em leque, sem rótulo. É um desenho de leitura: o conteúdo de cada cenário está nos cartões,
 * por isso o SVG fica fora da árvore de acessibilidade.
 *
 * Gramática: o presente é sólido; tudo o que é projetado é âmbar e tracejado (DESIGN.md, princípio 3). O realce de um
 * cenário (cartão sob o cursor ou em foco, ou o cenário aberto) acende o caminho dele em ciano e apaga os outros.
 */
import type { Cenario, CenarioId, IncertezaCritica } from "../../../types/cenario";

/** O que o leque lê de um cenário (a landing desenha um leque ilustrativo só com isso). */
export type CenarioDoLeque = Pick<Cenario, "id" | "nome" | "posicao">;
/** O que o leque lê de uma incerteza. */
export type IncertezaDoLeque = Pick<IncertezaCritica, "id" | "nome" | "polos">;

type No =
  | { tipo: "folha"; c: CenarioDoLeque }
  | { tipo: "bifurcacao"; incerteza: IncertezaDoLeque | null; ramos: { polo: string | null; no: No }[] };

/** A primeira parte do polo ("Limitado: comércio e inteligência" → "Limitado"). */
const poloCurto = (p: string) => p.split(":")[0].trim();

function montar(cenarios: CenarioDoLeque[], incertezas: IncertezaDoLeque[]): No {
  if (cenarios.length === 1) return { tipo: "folha", c: cenarios[0] };
  const candidatas = incertezas
    .map((i) => {
      const grupos = new Map<0 | 1 | null, CenarioDoLeque[]>();
      for (const c of cenarios) {
        const v = c.posicao[i.id] ?? null;
        grupos.set(v, [...(grupos.get(v) ?? []), c]);
      }
      return { i, grupos };
    })
    .filter((x) => x.grupos.size >= 2)
    .sort((a, b) => Number(a.grupos.has(null)) - Number(b.grupos.has(null)) || a.grupos.size - b.grupos.size);
  const escolhida = candidatas[0];
  if (!escolhida) return { tipo: "bifurcacao", incerteza: null, ramos: cenarios.map((c) => ({ polo: null, no: { tipo: "folha", c } })) };
  const resto = incertezas.filter((i) => i.id !== escolhida.i.id);
  const ordem: (0 | 1 | null)[] = [0, 1, null];
  return {
    tipo: "bifurcacao",
    incerteza: escolhida.i,
    ramos: ordem
      .filter((k) => escolhida.grupos.has(k))
      .map((k) => ({ polo: k === null ? "Indiferente" : poloCurto(escolhida.i.polos[k]), no: montar(escolhida.grupos.get(k)!, resto) })),
  };
}

const profundidade = (n: No): number => (n.tipo === "folha" ? 0 : 1 + Math.max(...n.ramos.map((r) => profundidade(r.no))));
const folhas = (n: No): CenarioId[] => (n.tipo === "folha" ? [n.c.id] : n.ramos.flatMap((r) => folhas(r.no)));

interface Traco {
  /** Pontos de controle da curva no eixo (tempo, espalhamento), antes de virar x/y. */
  p: [number, number][];
  folhas: CenarioId[];
  /** Ponto de chegada do ramo (para o rótulo do polo) e o cenário a que ele chega, se chega a um. */
  chegada: [number, number];
  folha: CenarioId | null;
  polo: string | null;
}

/** Ponto da curva cúbica em `t` (0 a 1). */
const naCurva = (p: [number, number][], t: number): [number, number] => {
  const u = 1 - t;
  const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [0, 1].map((e) => p.reduce((a, q, i) => a + k[i] * q[e], 0)) as [number, number];
};

/**
 * `realce`: cenário a acender (o resto apaga). `compacto`: versão do trilho lateral, só com as letras (sem nomes nem
 * polos), para caber em 240 px. `vertical`: a versão do celular (o tempo desce e os selos ficam embaixo).
 * `sinaisNovos`: cenários com sinal novo desde a última versão; ganham um ponto ciano no ramo.
 */
export function LequeDosFuturos({
  cenarios,
  incertezas,
  realce = null,
  compacto = false,
  vertical = false,
  rotuloDoFim,
  sinaisNovos = [],
}: {
  cenarios: CenarioDoLeque[];
  incertezas: IncertezaDoLeque[];
  realce?: CenarioId | null;
  compacto?: boolean;
  vertical?: boolean;
  rotuloDoFim?: string;
  sinaisNovos?: CenarioId[];
}) {
  if (cenarios.length === 0) return null;
  const raiz = montar(cenarios, incertezas);
  const niveis = profundidade(raiz);
  const completo = !compacto;

  // Tudo é calculado em (tempo, espalhamento) e só no fim vira (x, y): na horizontal o tempo anda para a direita; na
  // vertical, para baixo.
  const W = compacto ? 240 : vertical ? 340 : 1040;
  const n = cenarios.length;
  const passo = compacto ? 34 : vertical ? (W - 16) / n : 94;
  const topo = compacto ? 14 : vertical ? 8 : 64; // onde começa o espalhamento
  const t0 = compacto ? 10 : vertical ? 40 : 24;
  const tFim = compacto ? W - 28 : vertical ? t0 + (niveis + 1) * 130 : W - 270;
  const H = compacto ? topo + n * passo : vertical ? tFim + 84 : topo + n * passo;
  const dt = (tFim - t0) / (niveis + 1);
  const P = (t: number, e: number): [number, number] => (vertical ? [e, t] : [t, e]);

  const ordem = folhas(raiz);
  const eDaFolha = (id: CenarioId) => topo + ordem.indexOf(id) * passo + passo / 2;
  const eDe = (no: No): number => (no.tipo === "folha" ? eDaFolha(no.c.id) : no.ramos.map((r) => eDe(r.no)).reduce((a, b) => a + b, 0) / no.ramos.length);

  const tracos: Traco[] = [];
  const nos: { t: number; e: number; nome: string | null; nivel: number }[] = [];
  const percorrer = (no: No, nivel: number) => {
    if (no.tipo === "folha") return;
    const t = t0 + (nivel + 1) * dt;
    const e = eDe(no);
    nos.push({ t, e, nome: no.incerteza?.nome ?? null, nivel });
    for (const r of no.ramos) {
      const t2 = r.no.tipo === "folha" ? tFim : t0 + (nivel + 2) * dt;
      const e2 = eDe(r.no);
      tracos.push({
        p: [
          [t, e],
          [t + (t2 - t) * 0.55, e],
          [t + (t2 - t) * 0.45, e2],
          [t2, e2],
        ],
        folhas: folhas(r.no),
        chegada: [t2, e2],
        folha: r.no.tipo === "folha" ? r.no.c.id : null,
        polo: r.polo,
      });
      percorrer(r.no, nivel + 1);
    }
  };
  percorrer(raiz, 0);
  const eRaiz = eDe(raiz);
  const tRaiz = t0 + dt;
  const caminho = (p: [number, number][]) => {
    const [a, b, c, d] = p.map(([t, e]) => P(t, e));
    return `M${a[0]} ${a[1]} C${b[0]} ${b[1]} ${c[0]} ${c[1]} ${d[0]} ${d[1]}`;
  };
  // Cada nível de escolha vira uma coluna (uma faixa, na vertical) com o nome da incerteza, quando todos os losangos do
  // nível são da mesma incerteza (o caso comum). Se um nível misturar incertezas, o nome vai junto de cada losango.
  const colunas = [...new Set(nos.map((x) => x.nivel))].map((nivel) => {
    const doNivel = nos.filter((x) => x.nivel === nivel);
    const nomes = new Set(doNivel.map((x) => x.nome));
    return { nivel, t: doNivel[0].t, nome: nomes.size === 1 ? doNivel[0].nome : null };
  });
  const nomeNoCabecalho = (nivel: number) => colunas.find((c) => c.nivel === nivel)?.nome != null;
  const quebrar = (texto: string, max = 22) => {
    const linhas: string[] = [];
    for (const p of texto.split(" ")) {
      const ult = linhas[linhas.length - 1];
      if (ult !== undefined && (ult + " " + p).length <= max) linhas[linhas.length - 1] = `${ult} ${p}`;
      else linhas.push(p);
    }
    return linhas.length > 2 ? [linhas[0], `${linhas.slice(1).join(" ").slice(0, max - 1)}…`] : linhas;
  };
  const ativo = (fs: CenarioId[]) => realce === null || fs.includes(realce);
  const realcado = (fs: CenarioId[]) => realce !== null && fs.includes(realce);
  const lado = compacto ? 18 : 24;
  const [xRaiz, yRaiz] = P(t0, eRaiz);
  const [xPrimeira, yPrimeira] = P(tRaiz, eRaiz);

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      className={`leque-futuros block h-auto overflow-visible ${compacto ? "max-w-full" : "w-full"}`}
      data-compacto={compacto || undefined}
      data-vertical={vertical || undefined}
    >
      {completo && (
        <g>
          <text x={vertical ? 0 : t0} y={14} className="fill-texto-3 font-dados text-[12px]">
            Hoje
          </text>
          {rotuloDoFim && (
            <text
              x={vertical ? 0 : tFim}
              y={vertical ? tFim - 14 : 14}
              textAnchor={vertical ? "start" : "middle"}
              className="numeros fill-ambar font-dados text-[12px]"
            >
              {rotuloDoFim}
            </text>
          )}
          {/* as escolhas, uma por coluna, com uma guia pontilhada que atravessa o leque */}
          {colunas.map((c) =>
            c.nome ? (
              <g key={c.nivel}>
                <text x={vertical ? 0 : c.t} y={vertical ? c.t + 26 : 14} textAnchor={vertical ? "start" : "middle"} className="fill-texto-2 text-[13px]">
                  {quebrar(c.nome, vertical ? 18 : 28).map((l, i) => (
                    <tspan key={i} x={vertical ? 0 : c.t} dy={i === 0 ? 0 : 16}>
                      {l}
                    </tspan>
                  ))}
                </text>
                {vertical ? (
                  <line x1={0} x2={W} y1={c.t} y2={c.t} className="stroke-linha-forte" strokeDasharray="1 4" strokeLinecap="round" />
                ) : (
                  <line x1={c.t} x2={c.t} y1={topo - 14} y2={H} className="stroke-linha-forte" strokeDasharray="1 4" strokeLinecap="round" />
                )}
              </g>
            ) : null,
          )}
        </g>
      )}

      {/* presente: um traço sólido até a primeira escolha */}
      <path d={`M${xRaiz} ${yRaiz} L${xPrimeira} ${yPrimeira}`} className="stroke-texto" strokeWidth={1.5} fill="none" />

      {/* futuros: âmbar e tracejado; o caminho em realce passa a ciano */}
      {tracos.map((t, i) => (
        <path
          key={i}
          d={caminho(t.p)}
          fill="none"
          strokeWidth={realcado(t.folhas) ? 2 : 1.5}
          strokeDasharray="5 5"
          strokeLinecap="round"
          className={`transition-[stroke,opacity] duration-200 ${realcado(t.folhas) ? "stroke-ciano" : "stroke-ambar"} ${ativo(t.folhas) ? "opacity-100" : "opacity-25"}`}
        />
      ))}

      {/* sinal novo desde a última versão: um ponto ciano no ramo que chega ao cenário */}
      {completo &&
        tracos
          .filter((t) => t.folha !== null && sinaisNovos.includes(t.folha))
          .map((t) => {
            const [x, y] = P(...naCurva(t.p, 0.3));
            return <circle key={`s${t.folha}`} cx={x} cy={y} r={4} className="fill-ciano" />;
          })}

      {/* rótulo de cada polo, junto da chegada do ramo, em itálico (é hipótese) */}
      {completo &&
        tracos.map((t, i) => {
          if (!t.polo) return null;
          const [tc, ec] = t.chegada;
          const desce = t.p[0][1] <= ec;
          const [x, y] = vertical ? [ec + (desce ? 8 : -8), tc - 40] : [tc - (t.folha ? 26 : 16), ec - 10];
          return (
            <text
              key={`p${i}`}
              x={x}
              y={y}
              textAnchor={vertical && desce ? "start" : "end"}
              className={`rotulo-sobre-fundo text-[13px] italic transition-opacity duration-200 ${realcado(t.folhas) ? "fill-ciano-texto" : "fill-ambar"} ${ativo(t.folhas) ? "opacity-100" : "opacity-40"}`}
            >
              {t.polo}
            </text>
          );
        })}

      {/* o presente */}
      <circle cx={xRaiz} cy={yRaiz} r={compacto ? 3.5 : 5} className="fill-texto" />

      {/* as escolhas: losango âmbar em traço (incerteza) */}
      {nos.map((no, i) => {
        const [x, y] = P(no.t, no.e);
        return (
          <g key={`n${i}`}>
            <rect
              x={x - (compacto ? 3.5 : 6)}
              y={y - (compacto ? 3.5 : 6)}
              width={compacto ? 7 : 12}
              height={compacto ? 7 : 12}
              transform={`rotate(45 ${x} ${y})`}
              className="fill-abismo stroke-ambar"
              strokeWidth={1.5}
            />
            {no.nome && completo && !nomeNoCabecalho(no.nivel) && (
              <text x={x} y={y + 24} textAnchor="middle" className="rotulo-sobre-fundo fill-texto-3 text-[12px]">
                {no.nome.length > 34 ? `${no.nome.slice(0, 32)}…` : no.nome}
              </text>
            )}
          </g>
        );
      })}

      {/* os futuros, no fim do horizonte: selo de ouro cheio com a letra; em realce, anel ciano */}
      {cenarios.map((c) => {
        const [x, y] = P(tFim, eDaFolha(c.id));
        const on = realcado([c.id]);
        // na vertical o selo fica logo abaixo do fim do ramo; na horizontal, centrado nele
        const yc = vertical ? y + lado / 2 : y;
        return (
          <g key={c.id} className={`transition-opacity duration-200 ${ativo([c.id]) ? "opacity-100" : "opacity-40"}`}>
            <rect x={x - lado / 2} y={yc - lado / 2} width={lado} height={lado} rx={3} className={on ? "fill-ouro stroke-ciano" : "fill-ouro"} strokeWidth={on ? 2 : 0} />
            <text x={x} y={yc + (compacto ? 4 : 4.5)} textAnchor="middle" className={`font-medium ${compacto ? "text-[11px]" : "text-[13px]"} fill-abismo`}>
              {c.id}
            </text>
            {completo &&
              (vertical ? (
                <text x={x} y={yc + lado / 2 + 20} textAnchor="middle" className={`text-[13px] ${on ? "fill-texto font-medium" : "fill-texto-2"}`}>
                  {quebrar(c.nome, 14).map((l, i) => (
                    <tspan key={i} x={x} dy={i === 0 ? 0 : 17}>
                      {l}
                    </tspan>
                  ))}
                </text>
              ) : (
                <text x={x + 24} y={y + 5} className={`text-[16px] fill-texto ${on ? "font-medium" : ""}`}>
                  {c.nome}
                </text>
              ))}
          </g>
        );
      })}
    </svg>
  );
}

/** O polo de um cenário em cada incerteza, por extenso ("Conflito entre Executivo e STF: Contido"). */
export function posicoesDoCenario(c: Cenario, incertezas: IncertezaCritica[]) {
  return incertezas.map((i) => {
    const v = c.posicao[i.id];
    return { incerteza: i.nome, polo: v === null || v === undefined ? "Indiferente" : poloCurto(i.polos[v]) };
  });
}
