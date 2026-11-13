import { useMemo, useState } from "react";
import { numero } from "../../hooks";
import type { ArestaVisual, NoVisual } from "../../types/api";
import { ListaDeChips } from "../analysis/Evidencias";
import { EPISTEMICO, cx } from "../ui";
import { estiloDoTipo, rotuloDoPapel } from "./estilos";
import { ordemDeLeitura } from "./modelo";

export interface ListaDoGrafoProps {
  nos: NoVisual[];
  arestas: ArestaVisual[];
  rotuloDe: (id: string) => string;
  selecionado: string | null;
  aoSelecionar: (id: string) => void;
  /** nós e arestas em destaque (cenário, caminho) */
  destaqueNos?: Set<string> | null;
}

/** Alternativa acessível ao desenho: as entidades e as relações do grafo em tabelas. */
export function ListaDoGrafo({ nos, arestas, rotuloDe, selecionado, aoSelecionar, destaqueNos }: ListaDoGrafoProps) {
  const [limite, setLimite] = useState(40);
  const ordenados = useMemo(() => ordemDeLeitura(nos), [nos]);
  const relacoes = useMemo(() => {
    const base = selecionado ? arestas.filter((a) => a.origem === selecionado || a.destino === selecionado) : arestas;
    return [...base].sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR") || (a.ano ?? 0) - (b.ano ?? 0));
  }, [arestas, selecionado]);
  const grau = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of arestas) {
      m.set(a.origem, (m.get(a.origem) ?? 0) + 1);
      m.set(a.destino, (m.get(a.destino) ?? 0) + 1);
    }
    return m;
  }, [arestas]);

  const th = "px-3 py-2 text-left text-xs font-medium text-texto-fraco";
  const td = "px-3 py-2 align-top";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="mb-2 text-sm font-semibold">
          Entidades <span className="font-normal text-texto-fraco">({numero(nos.length)})</span>
        </h4>
        <div className="overflow-x-auto rounded-xl border border-borda">
          <table className="w-full min-w-[32rem] text-sm">
            <caption className="sr-only">Entidades do grafo, das focais às de contexto</caption>
            <thead className="border-b border-borda">
              <tr>
                <th scope="col" className={th}>
                  Entidade
                </th>
                <th scope="col" className={th}>
                  Tipo
                </th>
                <th scope="col" className={th}>
                  Papel
                </th>
                <th scope="col" className={cx(th, "text-right")}>
                  Relações aqui
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borda">
              {ordenados.slice(0, limite).map((n) => (
                <tr key={n.id} className={cx(n.id === selecionado && "bg-escarlate-tinta", destaqueNos?.has(n.id) && n.id !== selecionado && "bg-superficie-2")}>
                  <td className={td}>
                    <button
                      type="button"
                      className="text-left font-medium text-texto underline-offset-2 passar:text-escarlate passar:underline"
                      aria-pressed={n.id === selecionado}
                      onClick={() => aoSelecionar(n.id)}
                    >
                      {n.rotulo}
                    </button>
                  </td>
                  <td className={cx(td, "text-texto-suave")}>{estiloDoTipo(n.tipo).rotulo}</td>
                  <td className={cx(td, n.papel === "focal" ? "text-escarlate" : "text-texto-suave")}>{rotuloDoPapel(n.papel)}</td>
                  <td className={cx(td, "text-right fr-numeros text-texto-suave")}>{numero(grau.get(n.id) ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ordenados.length > limite && (
          <button type="button" className="mt-2 text-xs font-medium text-texto-suave passar:text-escarlate" onClick={() => setLimite(ordenados.length)}>
            Mostrar as {numero(ordenados.length)} entidades
          </button>
        )}
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold">
          Relações {selecionado ? `de ${rotuloDe(selecionado)}` : ""} <span className="font-normal text-texto-fraco">({numero(relacoes.length)})</span>
        </h4>
        <div className="overflow-x-auto rounded-xl border border-borda">
          <table className="w-full min-w-[40rem] text-sm">
            <caption className="sr-only">Relações do grafo com tipo epistêmico e evidências</caption>
            <thead className="border-b border-borda">
              <tr>
                <th scope="col" className={th}>
                  Origem
                </th>
                <th scope="col" className={th}>
                  Relação
                </th>
                <th scope="col" className={th}>
                  Destino
                </th>
                <th scope="col" className={cx(th, "text-right")}>
                  Ano
                </th>
                <th scope="col" className={th}>
                  Tipo
                </th>
                <th scope="col" className={th}>
                  Evidências
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borda">
              {relacoes.map((a) => (
                <tr key={a.id}>
                  <td className={td}>{rotuloDe(a.origem)}</td>
                  <td className={cx(td, "text-texto-suave")}>
                    {a.rotulo}
                    {a.dirigida ? "" : " (mútua)"}
                  </td>
                  <td className={td}>{rotuloDe(a.destino)}</td>
                  <td className={cx(td, "text-right fr-numeros text-texto-suave")}>{a.ano ?? "—"}</td>
                  <td className={cx(td, "text-texto-suave")}>{EPISTEMICO[a.tipo_epistemico as keyof typeof EPISTEMICO]?.rotulo ?? a.tipo_epistemico}</td>
                  <td className={td}>
                    <ListaDeChips ids={a.evidencias} max={3} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
