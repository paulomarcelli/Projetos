/**
 * Fronteira com a API para a conversa. ÚNICO lugar que decide de onde vem a resposta de uma pergunta.
 *
 * O backend ainda não tem motor de investigação (só /health e /documents): não há endpoint para enviar uma
 * pergunta, e nenhum é inventado aqui. Por isso:
 * - fora da prévia, toda pergunta volta como "indisponivel" (a interface explica e oferece guardar como rascunho);
 * - na prévia (`vite --mode previa`), uma demonstração responde com a investigação de exemplo, marcada como tal.
 * O contrato que o servidor precisará cumprir está em docs/CONTRATO-CONVERSA.md: quando o endpoint existir, a
 * chamada entra aqui, emitindo os mesmos eventos (etapas, depois a resposta), e nada acima precisa mudar.
 */
import type { ContextoDaPergunta, EventoDaPergunta } from "../types/conversa";

// Condição escrita aqui (e não via PREVIA) para o build normal descartar a demonstração inteira.
const carregarDemonstracao = import.meta.env.MODE === "previa" ? () => import("../previa/conversaDemo") : null;

export async function* perguntar(pergunta: string, contexto: ContextoDaPergunta, sinal: AbortSignal): AsyncGenerator<EventoDaPergunta> {
  if (carregarDemonstracao) {
    const { perguntarNaDemonstracao } = await carregarDemonstracao();
    yield* perguntarNaDemonstracao(pergunta, contexto, sinal);
    return;
  }
  yield { tipo: "resposta", resposta: { tipo: "indisponivel" } };
}
