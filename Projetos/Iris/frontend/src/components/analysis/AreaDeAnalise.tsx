/**
 * A investigação numa página só, em cinco seções, na ordem em que um analista pensa:
 *   01 Diagnóstico estratégico   → o que está acontecendo, a interpretação da Iris, as dinâmicas (com os fatores
 *                                  dentro da narrativa) e as incertezas críticas;
 *   02 Cenários prospectivos     → os três futuros, explorados no painel lateral sem sair da página;
 *   03 Comparação estratégica    → só o que diferencia os futuros (sem repetir os cartões);
 *   04 Monitoramento prospectivo → acontecimentos novos, impacto, revisão de premissas, indicadores e histórico;
 *   05 Exploração e evidências   → mapa de relações, linha do tempo e fontes.
 * O cabeçalho (pergunta, horizonte, data e versão) e o índice fixo ficam em ResultadoDaInvestigacao.
 *
 * Regra de densidade: o essencial sempre visível; o complementar compacto; o aprofundamento a um clique, no painel
 * contextual. A densidade é resolvida por estrutura, nunca encolhendo a letra (nada abaixo do token "micro").
 * Nenhuma probabilidade; nenhuma afirmação sem tipo epistêmico e fonte.
 */
import { SecaoCenarios } from "./secoes/SecaoCenarios";
import { SecaoComparacao } from "./secoes/SecaoComparacao";
import { SecaoDiagnostico } from "./secoes/SecaoDiagnostico";
import { SecaoExploracao } from "./secoes/SecaoExploracao";
import { SecaoMonitoramento } from "./secoes/SecaoMonitoramento";

export function AreaDeAnalise({ demonstracao }: { demonstracao?: { ativa: boolean; alternar: () => void } }) {
  return (
    <div className="flex flex-col gap-20 pt-4 lg:gap-24">
      <SecaoDiagnostico />
      <SecaoCenarios />
      <SecaoComparacao />
      <SecaoMonitoramento demonstracao={demonstracao} />
      <SecaoExploracao />
    </div>
  );
}
