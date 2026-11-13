import type { CaminhosEntreNos, Evidencia, ExpansaoDoGrafo, GrafoDaInvestigacao } from "../../types/api";
import { requisitar, segmento } from "../api/cliente";

/** GET /investigacoes/{id}/grafo — 409 (`conflito`) enquanto não concluiu. */
export async function obterGrafo(id: string, sinal?: AbortSignal): Promise<GrafoDaInvestigacao> {
  return requisitar<GrafoDaInvestigacao>(`/investigacoes/${segmento(id)}/grafo`, { sinal });
}

/** GET /investigacoes/{id}/grafo/expandir?no=&limite= — `nao_encontrado` se o nó não existe na base. */
export async function expandirNo(id: string, no: string, limite?: number, sinal?: AbortSignal): Promise<ExpansaoDoGrafo> {
  return requisitar<ExpansaoDoGrafo>(`/investigacoes/${segmento(id)}/grafo/expandir`, { consulta: { no, limite }, sinal });
}

/** GET /investigacoes/{id}/grafo/caminho?de=&para= — `existe: false` quando não há caminho em até `maxSaltos`. */
export async function caminhosEntre(id: string, de: string, para: string, maxSaltos?: number, sinal?: AbortSignal): Promise<CaminhosEntreNos> {
  return requisitar<CaminhosEntreNos>(`/investigacoes/${segmento(id)}/grafo/caminho`, { consulta: { de, para, max_saltos: maxSaltos }, sinal });
}

/** GET /investigacoes/{id}/evidencias/{eid} */
export async function obterEvidencia(id: string, eid: string, sinal?: AbortSignal): Promise<Evidencia> {
  return requisitar<Evidencia>(`/investigacoes/${segmento(id)}/evidencias/${segmento(eid)}`, { sinal });
}
