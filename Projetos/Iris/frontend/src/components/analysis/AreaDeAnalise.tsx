/**
 * A tela de análise, refeita por partes. Por enquanto:
 *   01 · Diagnóstico atual  → um título curto e um parágrafo;
 *   02 · Futuros possíveis  → as trajetórias até o fim do horizonte, cada uma com letra, nome e uma frase.
 * O mapa, a linha do tempo e as fontes continuam na seção própria deles (Exploração), separados da análise.
 * A comparação e o monitoramento estão prontos (secoes/SecaoComparacao, secoes/SecaoMonitoramento) e voltam nas
 * próximas partes; cada cenário abre a sua Análise do Cenário (components/analysis/cenario).
 * Nenhuma probabilidade; nenhuma afirmação sem tipo epistêmico e fonte.
 */
import { SecaoCenarios } from "./secoes/SecaoCenarios";
import { SecaoDiagnostico } from "./secoes/SecaoDiagnostico";
import { SecaoExploracao } from "./secoes/SecaoExploracao";

export function AreaDeAnalise() {
  return (
    <div className="flex flex-col gap-14 pt-2 lg:gap-16">
      <SecaoDiagnostico />
      <SecaoCenarios />
      <SecaoExploracao />
    </div>
  );
}
