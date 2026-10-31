/**
 * Motor da conversa: envia cada pergunta pelo serviço e grava o que chega no histórico. Fica fora do React de
 * propósito: a primeira pergunta muda o endereço (de /app para /app/conversas/:id), a página é trocada, e o
 * processamento não pode morrer junto com ela.
 *
 * As etapas em andamento (o que está sendo feito agora) não vão para o histórico: só interessam enquanto a
 * pergunta processa, e ficam aqui, com assinatura para os componentes.
 */
import { useSyncExternalStore } from "react";
import { perguntar } from "../../services/conversa";
import { adicionarPergunta, criarConversa, definirResposta, lerConversa } from "./historico";
import type { Etapa } from "../../types/conversa";
import type { Horizonte } from "../../hooks/useArmazenamentoLocal";

const emAndamento = new Map<string, { controle: AbortController; etapas: Etapa[] }>();
const ouvintes = new Set<() => void>();
let versaoEtapas = 0;
const avisar = () => {
  versaoEtapas++;
  ouvintes.forEach((f) => f());
};

/** Começa uma conversa nova, com o horizonte escolhido; devolve o id para a página ir até ela. */
export function iniciarConversa(pergunta: string, horizonte?: Horizonte) {
  const { conversaId, turnoId } = criarConversa(pergunta, horizonte);
  void processar(conversaId, turnoId, pergunta);
  return conversaId;
}

/** Pergunta seguinte, no contexto da investigação já aberta. */
export function continuarConversa(conversaId: string, pergunta: string) {
  const turnoId = adicionarPergunta(conversaId, pergunta);
  void processar(conversaId, turnoId, pergunta);
}

/** Refaz uma pergunta que falhou ou foi interrompida. */
export function tentarDeNovo(conversaId: string, turnoId: string) {
  const turno = lerConversa(conversaId)?.turnos.find((t) => t.id === turnoId);
  if (!turno) return;
  definirResposta(conversaId, turnoId, { tipo: "processando" });
  void processar(conversaId, turnoId, turno.pergunta);
}

export function interromper(turnoId: string) {
  emAndamento.get(turnoId)?.controle.abort();
}

export function estaProcessando(turnoId: string) {
  return emAndamento.has(turnoId);
}

async function processar(conversaId: string, turnoId: string, pergunta: string) {
  const conversa = lerConversa(conversaId);
  const anteriores = conversa?.turnos.filter((t) => t.id !== turnoId).map((t) => t.pergunta) ?? [];
  const controle = new AbortController();
  emAndamento.set(turnoId, { controle, etapas: [] });
  avisar();
  try {
    for await (const ev of perguntar(pergunta, { investigacaoId: conversa?.investigacaoId, anteriores, horizonte: conversa?.horizonte }, controle.signal)) {
      if (ev.tipo === "etapa") {
        const atual = emAndamento.get(turnoId);
        if (atual) atual.etapas = [...atual.etapas, ev.etapa];
        avisar();
      } else definirResposta(conversaId, turnoId, ev.resposta);
    }
  } catch (e) {
    const interrompida = e instanceof DOMException && e.name === "AbortError";
    definirResposta(conversaId, turnoId, {
      tipo: "erro",
      mensagem: interrompida ? "A pergunta foi interrompida antes da resposta." : "Não foi possível falar com a Iris agora.",
    });
  } finally {
    emAndamento.delete(turnoId);
    avisar();
  }
}

function assinar(f: () => void) {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}

/** Etapas já alcançadas por uma pergunta em andamento (vazio quando ela não está processando). */
export function useEtapas(turnoId: string): { processando: boolean; etapas: Etapa[] } {
  useSyncExternalStore(assinar, () => versaoEtapas, () => 0);
  const atual = emAndamento.get(turnoId);
  return { processando: !!atual, etapas: atual?.etapas ?? [] };
}
