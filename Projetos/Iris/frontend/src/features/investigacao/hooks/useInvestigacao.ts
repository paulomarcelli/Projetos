import { useEffect, useState } from "react";
import type { ResultadoDeInvestigacao } from "../../../types/investigacao";

// A condição fica escrita aqui (e não via PREVIA) para o build normal descartar o exemplo.
const carregarExemplo = import.meta.env.MODE === "previa" ? () => import("../../../previa/investigacao-exemplo") : null;

/**
 * Carrega uma investigação pelo id. O backend ainda não tem API de investigações: fora da
 * prévia, todo endereço leva a um estado vazio honesto ("ausente"). Na prévia, o exemplo é
 * carregado sob demanda (e não entra no build normal).
 * Ponto de integração: quando o endpoint existir, a chamada entra em services/api.ts e é feita
 * aqui, mantendo o mesmo contrato de estado para as páginas.
 */
export function useInvestigacao(id: string | undefined) {
  const [estado, setEstado] = useState<{ tipo: "carregando" } | { tipo: "pronto"; r: ResultadoDeInvestigacao } | { tipo: "ausente" }>(
    carregarExemplo ? { tipo: "carregando" } : { tipo: "ausente" },
  );
  useEffect(() => {
    if (!carregarExemplo) return;
    let vivo = true;
    carregarExemplo().then(({ INVESTIGACAO_EXEMPLO }) => {
      // Sem id, abre a investigação principal (na prévia, o exemplo).
      if (vivo) setEstado(!id || INVESTIGACAO_EXEMPLO.id === id ? { tipo: "pronto", r: INVESTIGACAO_EXEMPLO } : { tipo: "ausente" });
    });
    return () => {
      vivo = false;
    };
  }, [id]);
  return estado;
}
