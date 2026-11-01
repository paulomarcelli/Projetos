/**
 * Peças da comparação entre cenários, explicitamente qualitativa: matriz das incertezas críticas (`posicao`, só
 * quando ela se aplica: ver `matrizAplicavel`), direções dos fatores (`direcao`) e sinais (`favorece`/`enfraquece`).
 * Nenhuma probabilidade, nota ou peso. A composição da seção 03 está em secoes/SecaoComparacao.tsx.
 */
import type { Cenario } from "../../../types/cenario";
import type { ResultadoDeInvestigacao } from "../../../types/investigacao";
import { useResultado } from "../investigacao/contexto";
import { Letra } from "../investigacao/pecas";
import { TabelaComparativa } from "./TabelaComparativa";

/**
 * Matriz das incertezas críticas: cada eixo é uma incerteza, cada ponta um polo, e cada cenário
 * fica no quadrante das suas premissas. "Indiferente" (posicao null) fica sobre a linha do meio
 * daquele eixo. Com outro número de incertezas que não dois, cada uma vira uma régua própria.
 */
/** `compacta`: versão da primeira dobra (coluna estreita): só as letras nos pontos e os nomes numa legenda embaixo. */
export function MatrizDasIncertezas({ compacta = false }: { compacta?: boolean } = {}) {
  const { r, vista, setVista } = useResultado();
  const [x, y] = r.incertezas;
  const pos = (v: 0 | 1 | null | undefined) => (v === 0 ? 25 : v === 1 ? 75 : 50);
  const descricao = (c: Cenario, i = x) => (c.posicao[i.id] === null || c.posicao[i.id] === undefined ? "indiferente" : i.polos[c.posicao[i.id]!]);

  if (r.incertezas.length !== 2) {
    return (
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {r.incertezas.map((i) => (
          <li key={i.id} className="flex flex-col gap-2">
            <p className="text-corpo text-texto">{i.nome}</p>
            <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-legenda text-texto-2">
              {r.cenarios.map((c) => (
                <li key={c.id} className="inline-flex items-center gap-2">
                  <Letra id={c.id} ativa={vista === c.id} /> {descricao(c, i)}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    );
  }

  // Cenários no mesmo ponto ficam lado a lado, não sobrepostos.
  const pontos = new Map<string, Cenario[]>();
  for (const c of r.cenarios) {
    const k = `${pos(c.posicao[x.id])}-${pos(c.posicao[y.id])}`;
    pontos.set(k, [...(pontos.get(k) ?? []), c]);
  }
  const ponto = (c: Cenario, comNome: boolean) => (
    <button
      key={c.id}
      type="button"
      aria-pressed={vista === c.id}
      onClick={() => setVista(vista === c.id ? "presente" : c.id)}
      aria-label={`Cenário ${c.id}, ${c.nome}: ${x.nome}, ${descricao(c, x)}; ${y.nome}, ${descricao(c, y)}`}
      className={`flex items-center gap-2 rounded-full py-1 text-legenda shadow-cartao transition-colors duration-150 ${comNome ? "pr-3 pl-1" : "px-1"} ${
        vista === c.id ? "bg-ciano-suave text-texto ring-1 ring-ciano/60" : "bg-institucional text-texto-2 hover:text-texto"
      }`}
    >
      <Letra id={c.id} ativa={vista === c.id} />
      {comNome && <span className="hidden sm:inline">{c.nome}</span>}
    </button>
  );
  // Rótulo curto de um polo ("Aberto: perdão..." → "Aberto"), para os cantos da versão compacta.
  const curto = (polo: string) => polo.split(":")[0];
  const grade = (altura: string, comNome: boolean, cantos: boolean) => (
    <div className={`relative rounded-padrao bg-grafite/45 ${altura}`}>
      <span aria-hidden="true" className="absolute inset-y-3 left-1/2 border-l border-dashed border-linha-forte" />
      <span aria-hidden="true" className="absolute inset-x-3 top-1/2 border-t border-dashed border-linha-forte" />
      {cantos && (
        <>
          <span aria-hidden="true" className="absolute top-2 left-3 max-w-[45%] text-micro text-texto-3">
            ↑ {curto(y.polos[1])}
          </span>
          <span aria-hidden="true" className="absolute bottom-2 left-3 max-w-[45%] text-micro text-texto-3">
            ↓ {curto(y.polos[0])}
          </span>
        </>
      )}
      {[...pontos.entries()].map(([k, cs]) => {
        const [px, py] = k.split("-").map(Number);
        return (
          <div key={k} className="absolute flex -translate-x-1/2 translate-y-1/2 gap-2" style={{ left: `${px}%`, bottom: `${py}%` }}>
            {cs.map((c) => ponto(c, comNome))}
          </div>
        );
      })}
    </div>
  );
  const eixoX = (rotulo: (p: string) => string) => (
    <div className="flex justify-between gap-4 text-micro text-texto-3" aria-hidden="true">
      <span className="max-w-[45%]">← {rotulo(x.polos[0])}</span>
      <span className="max-w-[45%] text-right">{rotulo(x.polos[1])} →</span>
    </div>
  );

  // Versão compacta (coluna estreita da primeira dobra): só as letras nos pontos, os polos do eixo vertical nos cantos
  // da grade e os nomes numa legenda embaixo, para nada se sobrepor.
  if (compacta)
    return (
      <figure className="m-0 flex flex-col gap-2.5">
        {grade("h-52", false, true)}
        {eixoX(curto)}
        <ul className="m-0 flex list-none flex-col gap-1 border-t border-linha p-0 pt-2.5 text-legenda text-texto-2">
          {r.cenarios.map((c) => (
            <li key={c.id} className="flex items-center gap-2">
              <Letra id={c.id} ativa={vista === c.id} /> {c.nome}
            </li>
          ))}
        </ul>
        <figcaption className="text-micro text-texto-3">
          Horizontal: {x.nome}. Vertical: {y.nome}.
        </figcaption>
      </figure>
    );

  return (
    <figure className="m-0 flex flex-col gap-3">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2">
        {/* Eixo vertical: a segunda incerteza (polo 1 em cima). */}
        <div className="flex flex-col justify-between py-1 text-right text-micro text-texto-3" aria-hidden="true">
          <span className="max-w-[9rem]">{y.polos[1]}</span>
          <span className="max-w-[9rem]">{y.polos[0]}</span>
        </div>
        {grade("h-64 sm:h-72", true, false)}
        <span aria-hidden="true" />
        {eixoX((p) => p)}
      </div>
      <figcaption className="text-micro text-texto-3">
        Horizontal: {x.nome}. Vertical: {y.nome}. Sobre a linha do meio: o cenário não depende daquele eixo.
      </figcaption>
    </figure>
  );
}

/**
 * A matriz 2×2 só tem fundamento quando há exatamente duas incertezas críticas, todos os cenários declaram posição
 * nas duas (polo ou "indiferente") e os cenários não caem todos no mesmo lugar. Fora disso, não se força a matriz.
 */
export function matrizAplicavel(r: ResultadoDeInvestigacao): boolean {
  if (r.incertezas.length !== 2 || r.cenarios.length < 2) return false;
  const [x, y] = r.incertezas;
  if (!r.cenarios.every((c) => x.id in c.posicao && y.id in c.posicao)) return false;
  return new Set(r.cenarios.map((c) => `${c.posicao[x.id]}|${c.posicao[y.id]}`)).size > 1;
}

/** Fatores críticos: como cada fator determinante se move em cada futuro. */
export function DirecoesDosFatores() {
  const { r } = useResultado();
  const linhas = r.variaveis.map((v) => ({
    rotulo: v.nome,
    valor: (c: Cenario) => v.direcao[c.id],
  }));
  return <TabelaComparativa linhas={linhas} legenda="Direção de cada fator determinante em cada cenário" />;
}
