import type { ReactNode } from "react";
import type { Cenario } from "../../../types/cenario";
import { useResultado } from "../../investigacao/contexto";
import { Letra } from "../../investigacao/components/pecas";

/**
 * Tabela comparativa: os mesmos critérios para os três cenários. No celular cada linha vira um
 * bloco (critério e, abaixo, A, B e C), em vez de uma tabela com rolagem lateral.
 * Usada aqui e na timeline ("Comparar lado a lado"): uma implementação só.
 */
export function TabelaComparativa({ linhas, legenda }: { linhas: { rotulo: string; valor: (c: Cenario) => ReactNode }[]; legenda: string }) {
  const { r, vista } = useResultado();
  return (
    <table className="w-full border-collapse text-left text-legenda max-md:block">
      <caption className="sr-only">{legenda}</caption>
      <thead className="max-md:hidden">
        <tr>
          <th scope="col" className="w-[22%] pb-3 pr-4 align-bottom text-micro font-medium text-texto-3">
            Critério
          </th>
          {r.cenarios.map((c) => (
            <th key={c.id} scope="col" className={`rounded-t-padrao px-3 pb-3 align-bottom font-normal text-texto ${vista === c.id ? "bg-ciano-suave" : ""}`}>
              <span className="flex items-center gap-2 pt-2">
                <Letra id={c.id} ativa={vista === c.id} />
                <span className="font-medium">{c.nome}</span>
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="max-md:flex max-md:flex-col max-md:gap-5">
        {linhas.map((l) => (
          <tr key={l.rotulo} className="border-t border-linha align-top max-md:flex max-md:flex-col max-md:gap-2 max-md:pt-3">
            <th scope="row" className="py-3 pr-4 font-medium text-texto-2 max-md:p-0">
              {l.rotulo}
            </th>
            {r.cenarios.map((c) => (
              <td key={c.id} className={`px-3 py-3 text-texto max-md:flex max-md:gap-2.5 max-md:p-0 ${vista === c.id ? "bg-ciano-suave max-md:bg-transparent" : ""}`}>
                <span className="md:hidden">
                  <Letra id={c.id} ativa={vista === c.id} />
                </span>
                <span className="min-w-0">{l.valor(c)}</span>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
