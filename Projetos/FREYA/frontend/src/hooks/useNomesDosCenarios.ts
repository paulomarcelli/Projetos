import { useEffect, useState } from "react";
import { obterInvestigacao } from "../services";

/**
 * Nomes dos primeiros cenários de cada análise (GET /investigacoes/{id}), para os cartões dos guardados.
 * A lista (ResumoDeInvestigacao) só traz a contagem. `null` = ainda carregando; [] = sem cenários ou falhou.
 */
export function useNomesDosCenarios(ids: string[], quantos = 3): Record<string, string[] | null> {
  const [nomes, setNomes] = useState<Record<string, string[] | null>>({});
  const chave = ids.join(",");

  useEffect(() => {
    const c = new AbortController();
    const faltam = chave ? chave.split(",") : [];
    setNomes((atual) => Object.fromEntries(faltam.map((id) => [id, atual[id] ?? null])));
    for (const id of faltam) {
      obterInvestigacao(id, c.signal).then(
        (inv) => {
          if (!c.signal.aborted) setNomes((n) => ({ ...n, [id]: (inv.analise?.cenarios ?? []).slice(0, quantos).map((x) => x.nome) }));
        },
        () => {
          if (!c.signal.aborted) setNomes((n) => ({ ...n, [id]: [] }));
        },
      );
    }
    return () => c.abort();
  }, [chave, quantos]);

  return nomes;
}
