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
export function MatrizDasIncertezas() {
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
  return (
    <figure className="m-0 flex flex-col gap-3">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2">
        {/* Eixo vertical: a segunda incerteza (polo 1 em cima). */}
        <div className="flex flex-col justify-between py-1 text-right text-micro text-texto-3 [writing-mode:horizontal-tb]" aria-hidden="true">
          <span className="max-w-[9rem]">{y.polos[1]}</span>
          <span className="max-w-[9rem]">{y.polos[0]}</span>
        </div>
        <div className="relative h-64 rounded-padrao bg-grafite/45 sm:h-72">
          <span aria-hidden="true" className="absolute inset-y-3 left-1/2 border-l border-dashed border-linha-forte" />
          <span aria-hidden="true" className="absolute inset-x-3 top-1/2 border-t border-dashed border-linha-forte" />
          {[...pontos.entries()].map(([k, cs]) => {
            const [px, py] = k.split("-").map(Number);
            return (
              <div key={k} className="absolute flex -translate-x-1/2 translate-y-1/2 gap-2" style={{ left: `${px}%`, bottom: `${py}%` }}>
                {cs.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={vista === c.id}
                    onClick={() => setVista(vista === c.id ? "presente" : c.id)}
                    aria-label={`Cenário ${c.id}, ${c.nome}: ${x.nome}, ${descricao(c, x)}; ${y.nome}, ${descricao(c, y)}`}
                    className={`flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-legenda shadow-cartao transition-colors duration-150 ${
                      vista === c.id ? "bg-ciano-suave text-texto ring-1 ring-ciano/60" : "bg-institucional text-texto-2 hover:text-texto"
                    }`}
                  >
                    <Letra id={c.id} ativa={vista === c.id} />
                    <span className="hidden sm:inline">{c.nome}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
        <span aria-hidden="true" />
        <div className="flex justify-between gap-4 text-micro text-texto-3" aria-hidden="true">
          <span className="max-w-[45%]">{x.polos[0]}</span>
          <span className="max-w-[45%] text-right">{x.polos[1]}</span>
        </div>
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
  const linhas = r.variaveis.map((v) => ({ rotulo: v.nome, valor: (c: Cenario) => v.direcao[c.id] }));
  return <TabelaComparativa linhas={linhas} legenda="Direção de cada fator determinante em cada cenário" />;
}

/**
 * Sinais de alerta: o que observar e a qual futuro cada observação dá força ou tira força.
 * Uma marca por célula, sempre com palavra (não só cor nem só símbolo).
 */
export function SinaisDeAlerta() {
  const { r, vista } = useResultado();
  const marca = (favorece: boolean, enfraquece: boolean) =>
    favorece ? (
      <span className="inline-flex items-center gap-1.5 text-texto">
        <span aria-hidden="true" className="font-dados text-ciano-texto">+</span>favorece
      </span>
    ) : enfraquece ? (
      <span className="inline-flex items-center gap-1.5 text-texto-2">
        <span aria-hidden="true" className="font-dados">−</span>enfraquece
      </span>
    ) : (
      <span className="text-texto-3">
        <span aria-hidden="true">·</span>
        <span className="sr-only">sem efeito declarado</span>
      </span>
    );
  return (
    <table className="w-full border-collapse text-left text-legenda max-md:block">
      <caption className="sr-only">Sinais de alerta e o cenário que cada um favorece ou enfraquece</caption>
      <thead className="max-md:hidden">
        <tr>
          <th scope="col" className="pb-3 pr-4 text-micro font-medium text-texto-3">
            Sinal
          </th>
          {r.cenarios.map((c) => (
            <th key={c.id} scope="col" className={`w-[14%] rounded-t-padrao px-3 pb-3 font-normal ${vista === c.id ? "bg-ciano-suave" : ""}`}>
              <span className="flex items-center gap-2 pt-2 text-texto">
                <Letra id={c.id} ativa={vista === c.id} />
                <span className="sr-only">{c.nome}</span>
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="max-md:flex max-md:flex-col max-md:gap-4">
        {r.sinais.map((s) => (
          <tr key={s.id} className="border-t border-linha align-top max-md:flex max-md:flex-col max-md:gap-2 max-md:pt-3">
            <th scope="row" className="py-3 pr-4 font-normal max-md:p-0">
              <span className="block text-texto">{s.sinal}</span>
              <span className="block text-micro text-texto-3">
                {s.ondeAcompanhar} · {s.quando}
              </span>
              {s.favorece.length + s.enfraquece.length === 0 && <span className="mt-1 block text-micro text-texto-3 md:hidden">Sem efeito declarado sobre os cenários.</span>}
            </th>
            {r.cenarios.map((c) => (
              // No celular, só as células com efeito aparecem (a linha vazia não ajuda a ler).
              <td
                key={c.id}
                className={`px-3 py-3 max-md:flex max-md:items-center max-md:gap-2.5 max-md:p-0 ${vista === c.id ? "bg-ciano-suave max-md:bg-transparent" : ""} ${
                  s.favorece.includes(c.id) || s.enfraquece.includes(c.id) ? "" : "max-md:hidden"
                }`}
              >
                <span className="md:hidden">
                  <Letra id={c.id} ativa={vista === c.id} />
                </span>
                {marca(s.favorece.includes(c.id), s.enfraquece.includes(c.id))}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

