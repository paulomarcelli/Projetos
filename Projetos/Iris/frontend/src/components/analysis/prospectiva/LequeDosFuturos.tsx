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

type No =
  | { tipo: "folha"; c: Cenario }
  | { tipo: "bifurcacao"; incerteza: IncertezaCritica | null; ramos: { polo: string | null; no: No }[] };

/** A primeira parte do polo ("Limitado: comércio e inteligência" → "Limitado"). */
const poloCurto = (p: string) => p.split(":")[0].trim();

function montar(cenarios: Cenario[], incertezas: IncertezaCritica[]): No {
  if (cenarios.length === 1) return { tipo: "folha", c: cenarios[0] };
  const candidatas = incertezas
    .map((i) => {
      const grupos = new Map<0 | 1 | null, Cenario[]>();
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
  d: string;
  folhas: CenarioId[];
  /** Ponto do meio do traço (para o rótulo do polo). */
  meio?: { x: number; y: number; texto: string };
}

/**
 * `realce`: cenário a acender (o resto apaga). `compacto`: versão do trilho lateral, só com as letras (sem nomes nem
 * polos), para caber em 240 px.
 */
export function LequeDosFuturos({
  cenarios,
  incertezas,
  realce = null,
  compacto = false,
  rotuloDoFim,
}: {
  cenarios: Cenario[];
  incertezas: IncertezaCritica[];
  realce?: CenarioId | null;
  compacto?: boolean;
  rotuloDoFim?: string;
}) {
  if (cenarios.length === 0) return null;
  const raiz = montar(cenarios, incertezas);
  const niveis = profundidade(raiz);

  const W = compacto ? 240 : 760;
  const passo = compacto ? 34 : 62;
  // no completo, o topo guarda o cabeçalho das colunas (hoje · escolha 1 · escolha 2 · fim do horizonte)
  const topo = compacto ? 14 : 58;
  const H = topo + cenarios.length * passo;
  const x0 = compacto ? 10 : 24;
  const xFim = compacto ? W - 28 : W - 250;
  const dx = (xFim - x0) / (niveis + 1);

  const ordem = folhas(raiz);
  const yDaFolha = (id: CenarioId) => topo + ordem.indexOf(id) * passo + passo / 2;
  const yDe = (n: No): number => (n.tipo === "folha" ? yDaFolha(n.c.id) : n.ramos.map((r) => yDe(r.no)).reduce((a, b) => a + b, 0) / n.ramos.length);

  const tracos: Traco[] = [];
  const nos: { x: number; y: number; nome: string | null; nivel: number }[] = [];
  const curva = (x1: number, y1: number, x2: number, y2: number) => {
    const xm = x1 + (x2 - x1) * 0.55;
    return `M${x1} ${y1} C${xm} ${y1} ${x1 + (x2 - x1) * 0.45} ${y2} ${x2} ${y2}`;
  };
  const percorrer = (n: No, nivel: number) => {
    if (n.tipo === "folha") return;
    const x = x0 + (nivel + 1) * dx;
    const y = yDe(n);
    nos.push({ x, y, nome: n.incerteza?.nome ?? null, nivel });
    for (const r of n.ramos) {
      const x2 = r.no.tipo === "folha" ? xFim : x0 + (nivel + 2) * dx;
      const y2 = yDe(r.no);
      // o polo fica junto da chegada do ramo (antes do próximo losango ou da letra), acima do trecho já reto
      tracos.push({
        d: curva(x, y, x2, y2),
        folhas: folhas(r.no),
        meio: r.polo && !compacto ? { x: x2 - (r.no.tipo === "folha" ? 22 : 14), y: y2 - 9, texto: r.polo } : undefined,
      });
      percorrer(r.no, nivel + 1);
    }
  };
  percorrer(raiz, 0);
  const yRaiz = yDe(raiz);
  const xRaiz = x0 + dx;
  // Cada nível de escolha vira uma coluna com o nome da incerteza no cabeçalho, quando todos os losangos do nível são
  // da mesma incerteza (o caso comum). Se um nível misturar incertezas, o nome desce para baixo de cada losango.
  const colunas = [...new Set(nos.map((n) => n.nivel))].map((nivel) => {
    const doNivel = nos.filter((n) => n.nivel === nivel);
    const nomes = new Set(doNivel.map((n) => n.nome));
    return { nivel, x: doNivel[0].x, nome: nomes.size === 1 ? doNivel[0].nome : null };
  });
  const nomeNoCabecalho = (nivel: number) => colunas.find((c) => c.nivel === nivel)?.nome != null;
  const quebrar = (t: string, max = 22) => {
    const linhas: string[] = [];
    for (const p of t.split(" ")) {
      const ult = linhas[linhas.length - 1];
      if (ult !== undefined && (ult + " " + p).length <= max) linhas[linhas.length - 1] = `${ult} ${p}`;
      else linhas.push(p);
    }
    return linhas.length > 2 ? [linhas[0], `${linhas.slice(1).join(" ").slice(0, max - 1)}…`] : linhas;
  };
  const ativo = (fs: CenarioId[]) => realce === null || fs.includes(realce);
  const realcado = (fs: CenarioId[]) => realce !== null && fs.includes(realce);

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      className="leque-futuros block h-auto max-w-full overflow-visible"
      data-compacto={compacto || undefined}
    >
      {!compacto && (
        <g>
          <g className="fill-texto-3 font-dados text-[11px] tracking-[0.08em]">
            <text x={x0} y={14}>
              HOJE
            </text>
            {rotuloDoFim && (
              <text x={xFim} y={14} textAnchor="middle" className="numeros">
                {rotuloDoFim}
              </text>
            )}
          </g>
          {/* as escolhas, uma por coluna, com uma guia pontilhada até o losango */}
          {colunas.map((c) =>
            c.nome ? (
              <g key={c.nivel}>
                <text x={c.x} y={14} textAnchor="middle" className="fill-texto-2 text-[12px]">
                  {quebrar(c.nome).map((l, i) => (
                    <tspan key={i} x={c.x} dy={i === 0 ? 0 : 15}>
                      {l}
                    </tspan>
                  ))}
                </text>
                <line x1={c.x} x2={c.x} y1={topo - 14} y2={H} className="stroke-linha-forte" strokeDasharray="1 4" strokeLinecap="round" />
              </g>
            ) : null,
          )}
        </g>
      )}

      {/* presente: um traço sólido até a primeira escolha */}
      <path d={`M${x0} ${yRaiz} L${xRaiz} ${yRaiz}`} className="stroke-texto-3" strokeWidth={1.5} fill="none" />

      {/* futuros: âmbar e tracejado; o caminho em realce passa a ciano */}
      {tracos.map((t, i) => (
        <path
          key={i}
          d={t.d}
          fill="none"
          strokeWidth={realcado(t.folhas) ? 2 : 1.5}
          strokeDasharray="5 5"
          strokeLinecap="round"
          className={`transition-[stroke,opacity] duration-200 ${realcado(t.folhas) ? "stroke-ciano" : "stroke-ambar"} ${ativo(t.folhas) ? "opacity-100" : "opacity-25"}`}
        />
      ))}

      {/* rótulo de cada polo, sobre o meio do traço, com um contorno da cor do fundo para não brigar com a linha */}
      {tracos.map((t, i) =>
        t.meio ? (
          <text
            key={`p${i}`}
            x={t.meio.x}
            y={t.meio.y}
            textAnchor="end"
            className={`rotulo-sobre-fundo text-[12px] transition-opacity duration-200 ${realcado(t.folhas) ? "fill-ciano-texto" : "fill-texto-2"} ${ativo(t.folhas) ? "opacity-100" : "opacity-40"}`}
          >
            {t.meio.texto}
          </text>
        ) : null,
      )}

      {/* o presente */}
      <circle cx={x0} cy={yRaiz} r={compacto ? 3.5 : 5} className="fill-texto" />

      {/* as escolhas: losango âmbar (incerteza), com o nome da incerteza acima */}
      {nos.map((n, i) => (
        <g key={`n${i}`}>
          <rect
            x={n.x - (compacto ? 3.5 : 5)}
            y={n.y - (compacto ? 3.5 : 5)}
            width={compacto ? 7 : 10}
            height={compacto ? 7 : 10}
            transform={`rotate(45 ${n.x} ${n.y})`}
            className="fill-abismo stroke-ambar"
            strokeWidth={1.5}
          />
          {n.nome && !compacto && !nomeNoCabecalho(n.nivel) && (
            <text x={n.x} y={n.y + 22} textAnchor="middle" className="rotulo-sobre-fundo fill-texto-3 text-[11.5px]">
              {n.nome.length > 34 ? `${n.nome.slice(0, 32)}…` : n.nome}
            </text>
          )}
        </g>
      ))}

      {/* os futuros, no fim do horizonte */}
      {cenarios.map((c) => {
        const y = yDaFolha(c.id);
        const on = realcado([c.id]);
        return (
          <g key={c.id} className={`transition-opacity duration-200 ${ativo([c.id]) ? "opacity-100" : "opacity-40"}`}>
            <rect
              x={xFim - (compacto ? 9 : 12)}
              y={y - (compacto ? 9 : 12)}
              width={compacto ? 18 : 24}
              height={compacto ? 18 : 24}
              rx={3}
              className={on ? "fill-ciano-suave stroke-ciano" : "fill-abismo stroke-linha-forte"}
              strokeWidth={1}
            />
            <text x={xFim} y={y + (compacto ? 4 : 4.5)} textAnchor="middle" className={`font-dados ${compacto ? "text-[11px]" : "text-[13px]"} fill-ambar`}>
              {c.id}
            </text>
            {!compacto && (
              <text x={xFim + 22} y={y + 4.5} className={`text-[14px] ${on ? "fill-texto font-medium" : "fill-texto-2"}`}>
                {c.nome}
              </text>
            )}
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
