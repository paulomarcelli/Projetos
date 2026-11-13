/**
 * Serviços da PRÉVIA estática (build `--mode previa`): mesmas funções de `src/services`, mas lendo respostas
 * REAIS capturadas da API em 2026-11-02 (src/test/integracao/fixtures). Nada é gerado aqui.
 * - leitura: investigações, grafos, expansão de nó, caminho e evidências capturados;
 * - guardar/remover: valem só nesta aba (memória), para a interface poder ser experimentada;
 * - criar e excluir análises: desativados, com a mensagem de que a prévia não tem API.
 */
import type {
  CaminhosEntreNos,
  Evidencia,
  ExpansaoDoGrafo,
  GrafoDaInvestigacao,
  Investigacao,
  InvestigacaoCriada,
  ResumoDeInvestigacao,
  Saude,
} from "../types/api";
import { ErroDaApi } from "../services/api/erros";
import { estaEmAndamento, ESTADOS_FINAIS } from "../services/investigations/investigacoes";
import invThor from "../test/integracao/fixtures/investigacao-real.json";
import grafoThor from "../test/integracao/fixtures/grafo-real.json";
import invChina from "../test/integracao/fixtures/investigacao-fora-do-dominio.json";
import grafoChina from "../test/integracao/fixtures/grafo-fora-do-dominio.json";
import expansao from "../test/integracao/fixtures/expansao-real.json";
import caminho from "../test/integracao/fixtures/caminho-real.json";

export { ErroDaApi, type TipoDeErro } from "../services/api/erros";
export { estaEmAndamento, ESTADOS_FINAIS };
export type { Acompanhamento, OpcoesDoAcompanhamento } from "../services/investigations/investigacoes";

const investigacoes = new Map<string, Investigacao>([
  [(invThor as Investigacao).id, invThor as unknown as Investigacao],
  [(invChina as Investigacao).id, invChina as unknown as Investigacao],
]);
const grafos = new Map<string, GrafoDaInvestigacao>([
  [(invThor as Investigacao).id, grafoThor as unknown as GrafoDaInvestigacao],
  [(invChina as Investigacao).id, grafoChina as unknown as GrafoDaInvestigacao],
]);
const guardadas = new Set<string>([...investigacoes.values()].filter((i) => i.guardada).map((i) => i.id));

const SEM_API = "Esta é uma prévia estática, sem a API da F.R.E.Y.A.: novas análises só rodando o projeto (README › Interface).";
const espera = () => new Promise((r) => setTimeout(r, 120));

function obter(id: string): Investigacao {
  const inv = investigacoes.get(id);
  if (!inv) throw new ErroDaApi("nao_encontrado", "Análise não encontrada nesta prévia.", 404);
  return { ...inv, guardada: guardadas.has(id) };
}

export const baseDaApi = () => "prévia estática (respostas reais capturadas)";
export const definirBaseDaApi = (_b: string | null) => {};
export const foiCancelado = (e: unknown) => e instanceof DOMException && e.name === "AbortError";

export async function obterSaude(): Promise<Saude> {
  await espera();
  return { status: "ok", motor: "modelo", modelo: "gpt-5.6-terra", grafo: "GrafoNeo4j",
    base: { hybrid: { documentos: 5047, chunks: 12874 }, grafo: { nos: 5711, arestas: 14566 } } };
}

export async function criarInvestigacao(_q: string, _h?: string | null): Promise<InvestigacaoCriada> {
  await espera();
  throw new ErroDaApi("nao_implementado", SEM_API);
}

export async function obterInvestigacao(id: string): Promise<Investigacao> {
  await espera();
  return obter(id);
}

export function acompanharInvestigacao(id: string, aoAtualizar: (inv: Investigacao) => void, aoErro?: (e: ErroDaApi) => void) {
  let ativo = true;
  espera().then(() => {
    if (!ativo) return;
    try { aoAtualizar(obter(id)); } catch (e) { aoErro?.(e as ErroDaApi); }
  });
  return { cancelar: () => { ativo = false; } };
}

export async function obterGrafo(id: string): Promise<GrafoDaInvestigacao> {
  await espera();
  const g = grafos.get(id);
  if (!g) throw new ErroDaApi("nao_encontrado", "Grafo não encontrado nesta prévia.", 404);
  return g;
}

export async function expandirNo(id: string, no: string): Promise<ExpansaoDoGrafo> {
  await espera();
  const e = expansao as unknown as ExpansaoDoGrafo;
  if (id !== (invThor as Investigacao).id || no !== e.no)
    throw new ErroDaApi("nao_implementado", `Na prévia, só a expansão de “${e.no}” na análise Thor × Loki foi capturada.`);
  return e;
}

export async function caminhosEntre(id: string, de: string, para: string): Promise<CaminhosEntreNos> {
  await espera();
  const c = caminho as unknown as CaminhosEntreNos;
  const mesmo = (c.de === de && c.para === para) || (c.de === para && c.para === de);
  if (id !== (invThor as Investigacao).id || !mesmo)
    throw new ErroDaApi("nao_implementado", "Na prévia, só o caminho entre Thor e Loki foi capturado.");
  return c;
}

export async function obterEvidencia(id: string, eid: string): Promise<Evidencia> {
  await espera();
  const ev = obter(id).evidencias[eid] ?? grafos.get(id)?.evidencias[eid];
  if (!ev) throw new ErroDaApi("nao_encontrado", "Evidência não encontrada.", 404);
  return ev;
}

export async function listarInvestigacoes(opcoes?: { guardadas?: boolean; limite?: number }): Promise<ResumoDeInvestigacao[]> {
  await espera();
  return [...investigacoes.values()]
    .map((i) => ({ id: i.id, questao: i.questao, horizonte: i.horizonte, estado: i.estado, erro: i.erro,
      guardada: guardadas.has(i.id), cenarios: i.analise?.cenarios.length ?? 0, criada_em: i.criada_em, atualizada_em: i.atualizada_em }))
    .filter((r) => opcoes?.guardadas === undefined || r.guardada === opcoes.guardadas)
    .sort((a, b) => b.criada_em.localeCompare(a.criada_em))
    .slice(0, opcoes?.limite ?? 100);
}

export async function excluirInvestigacao(_id: string): Promise<void> {
  await espera();
  throw new ErroDaApi("nao_implementado", "Na prévia, excluir está desativado.");
}

export async function guardarInvestigacao(id: string): Promise<void> {
  await espera();
  obter(id);
  guardadas.add(id);
}

export async function desguardarInvestigacao(id: string): Promise<void> {
  await espera();
  obter(id);
  guardadas.delete(id);
}
