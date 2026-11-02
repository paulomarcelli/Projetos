/**
 * Quanto as fontes sustentam a análise? Derivado só dos dados (contagens, limitações, validação),
 * para avisar com calma quando a questão está fora do que a base do MCU cobre.
 */
import type { AnaliseProspectiva, GrafoDaInvestigacao, Investigacao, ResumoDaRecuperacao } from "../../types/api";

export interface Sustentacao {
  fraca: boolean;
  motivos: string[];
  evidencias: number;
  nos: number;
  arestas: number;
  afirmacoes: number;
  rebaixadas: number;
}

export function contarAfirmacoes(a: AnaliseProspectiva): number {
  return (
    a.contexto.length +
    a.atores.reduce((n, x) => n + x.fundamentos.length, 0) +
    a.relacoes_sistemicas.length +
    a.variaveis.length +
    a.tendencias_e_sinais.length +
    a.incertezas_criticas.length +
    a.desdobramentos.reduce((n, d) => n + 1 + d.consequencias_diretas.length + d.consequencias_indiretas.length, 0) +
    a.cenarios.reduce((n, c) => n + 1 + c.premissas.length + c.desenvolvimento.length + c.consequencias.length + c.sinais.length, 0)
  );
}

/** frases das limitações que dizem, com outras palavras, "a base não tem evidência sobre isto" */
const SEM_BASE = /(não (contém|traz|há|informa|estabelece) (evid|fontes|base|conex)|sem evid|ausência de (evid|base)|sem caminho|fora d[oa] (escopo|domínio|base))/i;

export function avaliarSustentacao(inv: Investigacao, grafo: GrafoDaInvestigacao | null): Sustentacao {
  const a = inv.analise;
  const recuperacao = inv.etapas.find((e) => e.nome === "recuperacao")?.resumo as Partial<ResumoDaRecuperacao> | undefined;
  const nos = grafo?.nos.length ?? recuperacao?.nos ?? 0;
  const arestas = grafo?.arestas.length ?? recuperacao?.arestas ?? 0;
  const evidencias = Object.keys(inv.evidencias).length;
  const afirmacoes = a ? contarAfirmacoes(a) : 0;
  const rebaixadas = a ? a.validacao.rebaixadas.length + a.validacao.removidas.length : 0;
  const limitacoesSemBase = a ? a.limitacoes.filter((l) => SEM_BASE.test(l)).length : 0;

  const motivos: string[] = [];
  if (arestas === 0) motivos.push(nos <= 1 ? `o grafo tem ${nos === 1 ? "uma entidade" : "nenhuma entidade"} e nenhuma relação` : "o grafo não tem relações");
  else if (nos <= 3) motivos.push(`o grafo tem só ${nos} entidades`);
  if (evidencias < 15) motivos.push(`só ${evidencias} ${evidencias === 1 ? "trecho foi recuperado" : "trechos foram recuperados"}`);
  if (afirmacoes > 0 && rebaixadas / afirmacoes >= 0.3) motivos.push(`a validação rebaixou ou removeu ${rebaixadas} de ${afirmacoes} afirmações por falta de evidência`);
  if (limitacoesSemBase >= 2) motivos.push(`${limitacoesSemBase} limitações apontam ausência de evidência`);

  // um sinal só (ex.: uma limitação) não basta; o grafo vazio sozinho já basta
  const fraca = arestas === 0 || motivos.length >= 2;
  return { fraca, motivos, evidencias, nos, arestas, afirmacoes, rebaixadas };
}
