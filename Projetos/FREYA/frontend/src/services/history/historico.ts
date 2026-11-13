import type { ResumoDeInvestigacao } from "../../types/api";
import { requisitar, segmento } from "../api/cliente";

/** GET /investigacoes?guardadas=&limite= — histórico (mais recentes primeiro). Sem `guardadas`, traz todas. */
export async function listarInvestigacoes(opcoes?: { guardadas?: boolean; limite?: number; sinal?: AbortSignal }): Promise<ResumoDeInvestigacao[]> {
  return requisitar<ResumoDeInvestigacao[]>("/investigacoes", {
    consulta: { guardadas: opcoes?.guardadas, limite: opcoes?.limite },
    sinal: opcoes?.sinal,
  });
}

/** DELETE /investigacoes/{id} — `conflito` enquanto a investigação ainda está em execução; `nao_encontrado` se já não existe. */
export async function excluirInvestigacao(id: string): Promise<void> {
  await requisitar<void>(`/investigacoes/${segmento(id)}`, { metodo: "DELETE" });
}

/** PUT /investigacoes/{id}/guardada (idempotente) */
export async function guardarInvestigacao(id: string): Promise<void> {
  await requisitar<void>(`/investigacoes/${segmento(id)}/guardada`, { metodo: "PUT" });
}

/** DELETE /investigacoes/{id}/guardada (idempotente) */
export async function desguardarInvestigacao(id: string): Promise<void> {
  await requisitar<void>(`/investigacoes/${segmento(id)}/guardada`, { metodo: "DELETE" });
}
