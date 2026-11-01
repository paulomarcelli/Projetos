/**
 * Comparação entre os cenários, explicitamente qualitativa: matriz das incertezas críticas
 * (`posicao`), direções dos fatores (`direcao`), sinais de alerta (`favorece`/`enfraquece`) e
 * linha do tempo compartilhada (eventos com ano). Nenhuma probabilidade, nota ou peso.
 */
import { useMemo, type ReactNode } from "react";
import type { Cenario, CenarioId } from "../../../types/cenario";
import { useResultado } from "../investigacao/contexto";
import { Letra } from "../investigacao/pecas";
import { TabelaComparativa } from "./TabelaComparativa";

function Subtitulo({ id, titulo, children }: { id: string; titulo: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 id={id} className="text-leitura font-medium text-texto">
        {titulo}
      </h3>
      {children && <p className="max-w-[72ch] text-legenda text-texto-2">{children}</p>}
    </div>
  );
}

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

/** Como cada fator determinante se move em cada futuro, mais gatilhos e o que obrigaria a rever. */
function DirecoesDosFatores() {
  const { r, ix } = useResultado();
  const linhas = [
    ...r.variaveis.map((v) => ({ rotulo: v.nome, valor: (c: Cenario) => v.direcao[c.id] })),
    { rotulo: "Gatilho", valor: (c: Cenario) => c.gatilhos.join("; ") },
    { rotulo: "Atores decisivos", valor: (c: Cenario) => c.atoresDecisivos.map((a) => ix.atores.get(a)?.curto).join(", ") },
    { rotulo: "Rever se", valor: (c: Cenario) => c.revisao.join("; ") },
  ];
  return <TabelaComparativa linhas={linhas} legenda="Direção de cada fator determinante em cada cenário" />;
}

/**
 * Sinais de alerta: o que observar e a qual futuro cada observação dá força ou tira força.
 * Uma marca por célula, sempre com palavra (não só cor nem só símbolo).
 */
function SinaisDeAlerta() {
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

/**
 * Linha do tempo compartilhada: os anos do horizonte em colunas; a agenda comum em cima e os
 * eventos de cada cenário na sua faixa. Mostra o que acontece "ao mesmo tempo" em futuros
 * diferentes. Cada evento abre no painel (data, condição, atores, evidências).
 */
function LinhaDoTempoCompartilhada() {
  const { r, vista, selecionar, selecao } = useResultado();
  const anos = useMemo(() => Array.from({ length: r.horizonte.fim - r.horizonte.inicio + 1 }, (_, i) => r.horizonte.inicio + i), [r]);
  const faixas: { id: "comum" | CenarioId; rotulo: string }[] = [{ id: "comum", rotulo: "Agenda comum" }, ...r.cenarios.map((c) => ({ id: c.id, rotulo: `${c.id} · ${c.nome}` }))];
  const eventos = (faixa: "comum" | CenarioId, ano: number) =>
    r.linhaDoTempo.filter((e) => e.ano === ano && (faixa === "comum" ? !e.cenarios && e.agendado : e.cenarios?.includes(faixa)));
  return (
    <table className="w-full table-fixed border-collapse text-left text-legenda max-md:block">
      <caption className="sr-only">Eventos por ano no horizonte da investigação, por cenário</caption>
      <thead className="max-md:hidden">
        <tr>
          <th scope="col" className="w-[18%] pb-2 pr-3 text-micro font-medium text-texto-3">
            Faixa
          </th>
          {anos.map((a) => (
            <th key={a} scope="col" className="numeros px-2 pb-2 font-dados text-micro font-normal text-ambar">
              {a}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="max-md:flex max-md:flex-col max-md:gap-5">
        {faixas.map((f) => (
          <tr key={f.id} className={`border-t border-linha align-top max-md:flex max-md:flex-col max-md:gap-2 max-md:pt-3 ${f.id !== "comum" && vista === f.id ? "bg-ciano-suave" : ""}`}>
            <th scope="row" className="py-2.5 pr-3 font-medium text-texto-2 max-md:p-0">
              {f.rotulo}
            </th>
            {anos.map((a) => {
              const lista = eventos(f.id, a);
              return (
                <td key={a} className={`px-2 py-2.5 max-md:p-0 ${lista.length === 0 ? "max-md:hidden" : ""}`}>
                  <span className="numeros mb-1 block font-dados text-micro text-ambar md:hidden">{a}</span>
                  <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                    {lista.map((e) => (
                      <li key={e.id}>
                        <button
                          type="button"
                          onClick={() => selecionar({ tipo: "evento", id: e.id })}
                          aria-pressed={selecao?.tipo === "evento" && selecao.id === e.id}
                          className="text-left text-texto underline decoration-linha-forte underline-offset-4 transition-colors duration-150 hover:decoration-ciano aria-pressed:decoration-ciano"
                        >
                          {e.texto}
                        </button>
                      </li>
                    ))}
                  </ul>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Comparação: quatro leituras curtas, cada uma com uma pergunta própria. Sem abas nem acordeões:
 * a página rola, e o índice no topo leva direto a cada parte.
 */
export function ComparacaoDosCenarios() {
  return (
    <div className="flex flex-col gap-12">
      <p className="max-w-[72ch] border-l-2 border-linha-forte pl-4 text-legenda text-texto-2">
        Comparação qualitativa. A Iris não atribui probabilidade, nota nem peso aos cenários: as posições vêm das premissas
        de cada um, e os sinais dizem o que observar, não o que vai acontecer.
      </p>

      <section aria-labelledby="t-matriz" className="flex flex-col gap-4">
        <Subtitulo id="t-matriz" titulo="Onde cada futuro se posiciona">
          As duas incertezas críticas formam os eixos; cada cenário está no quadrante das suas premissas.
        </Subtitulo>
        <MatrizDasIncertezas />
      </section>

      <section aria-labelledby="t-direcoes" className="flex flex-col gap-4">
        <Subtitulo id="t-direcoes" titulo="Os mesmos fatores, três direções" />
        <DirecoesDosFatores />
      </section>

      <section aria-labelledby="t-sinais" className="flex flex-col gap-4">
        <Subtitulo id="t-sinais" titulo="Sinais de alerta">
          Se um destes sinais aparecer, ele dá força a uns futuros e tira de outros.
        </Subtitulo>
        <SinaisDeAlerta />
      </section>

      <section aria-labelledby="t-tempo-comum" className="flex flex-col gap-4">
        <Subtitulo id="t-tempo-comum" titulo="Linha do tempo compartilhada">
          O mesmo calendário para os três futuros. Datas de agenda são certas; os demais eventos só ocorrem no cenário da
          sua faixa.
        </Subtitulo>
        <LinhaDoTempoCompartilhada />
      </section>
    </div>
  );
}
