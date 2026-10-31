/**
 * Demonstração da conversa (só no build de prévia; services/conversa.ts não a importa no build normal).
 *
 * Não há motor de investigação: a primeira pergunta é respondida sempre com a investigação de exemplo, e a resposta
 * diz isso (mostra a pergunta que o exemplo responde). As perguntas seguintes viram complementos montados com os
 * campos do mesmo exemplo. Os tempos de espera só existem para mostrar como a interface acompanha o processamento.
 */
import { detectarIntencao } from "../components/analysis/conversa/complementos";
import type { ContextoDaPergunta, Etapa, EventoDaPergunta } from "../types/conversa";
import { INVESTIGACAO_EXEMPLO } from "./investigacao-exemplo";

const ETAPAS: Etapa[] = ["pergunta", "evidencias", "atores"];
const PASSO_MS = 650;

function esperar(ms: number, sinal: AbortSignal) {
  return new Promise<void>((ok, falha) => {
    const t = setTimeout(ok, ms);
    sinal.addEventListener("abort", () => {
      clearTimeout(t);
      falha(new DOMException("Pergunta interrompida", "AbortError"));
    }, { once: true });
  });
}

export async function* perguntarNaDemonstracao(pergunta: string, contexto: ContextoDaPergunta, sinal: AbortSignal): AsyncGenerator<EventoDaPergunta> {
  const r = INVESTIGACAO_EXEMPLO;
  if (contexto.investigacaoId) {
    yield { tipo: "etapa", etapa: "evidencias" };
    await esperar(PASSO_MS, sinal);
    yield { tipo: "resposta", resposta: { tipo: "complemento", investigacaoId: r.id, intencao: detectarIntencao(pergunta), demonstracao: true } };
    return;
  }
  for (const etapa of ETAPAS) {
    yield { tipo: "etapa", etapa };
    await esperar(PASSO_MS, sinal);
  }
  // a análise chega primeiro; os cenários, depois (como num servidor que os processa em separado)
  const base = { tipo: "analise", investigacaoId: r.id, versao: r.versao, demonstracao: true } as const;
  yield { tipo: "resposta", resposta: { ...base, cenarios: "gerando" } };
  yield { tipo: "etapa", etapa: "cenarios" };
  await esperar(PASSO_MS * 2, sinal);
  yield { tipo: "resposta", resposta: { ...base, cenarios: "prontos" } };
}
