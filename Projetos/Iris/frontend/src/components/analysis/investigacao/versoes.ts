/**
 * Versões lidas do resultado e do histórico de monitoramento (types/monitoramento.ts). Nada é estimado: sem histórico,
 * vale a versão do próprio resultado.
 */
import type { CenarioId } from "../../../types/cenario";
import type { ResultadoDeInvestigacao } from "../../../types/investigacao";
import type { EntradaDoHistorico } from "../../../types/monitoramento";

export function versaoAtual(r: ResultadoDeInvestigacao): number {
  return Math.max(r.versao, ...(r.monitoramento?.historico ?? []).map((h) => h.versao));
}

/** A última versão em que o cenário foi reescrito; sem revisão registrada, a versão do resultado. */
export function versaoDoCenario(r: ResultadoDeInvestigacao, id: CenarioId): number {
  const revisoes = (r.monitoramento?.historico ?? []).filter((h) => h.cenario === id && h.tipo === "revisao-cenario").map((h) => h.versao);
  return revisoes.length ? Math.max(...revisoes) : r.versao;
}

/** O que mudou na versão atual em relação à anterior, para a faixa "Desde a vN". Nulo quando não há registro. */
export function desdeAAnterior(r: ResultadoDeInvestigacao): { anterior: number; entradas: EntradaDoHistorico[] } | null {
  const atual = versaoAtual(r);
  const entradas = (r.monitoramento?.historico ?? []).filter((h) => h.versao === atual);
  return atual > 1 && entradas.length > 0 ? { anterior: atual - 1, entradas } : null;
}

/** Cenários favorecidos por acontecimentos ainda não incorporados ou incorporados na versão em vigor (ponto no leque). */
export function sinaisNovos(r: ResultadoDeInvestigacao): CenarioId[] {
  const atual = versaoAtual(r);
  const ids = new Set<CenarioId>();
  for (const a of r.monitoramento?.acontecimentos ?? [])
    if (a.incorporadoNaVersao === undefined || a.incorporadoNaVersao === atual) for (const i of a.impactos) if (i.impacto === "favorece") ids.add(i.cenario);
  return [...ids];
}
