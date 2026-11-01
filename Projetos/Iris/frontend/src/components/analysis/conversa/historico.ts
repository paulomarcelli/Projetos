/**
 * Histórico das conversas, neste navegador (como os rascunhos: enquanto não há API de investigações, nada vai para o
 * servidor, e a interface diz isso). Funções puras de leitura e escrita, usadas pelo motor (fora do React), e dois
 * hooks para os componentes.
 */
import { useSyncExternalStore } from "react";
import { armazenamentoLocal, type Horizonte } from "../../../hooks/useArmazenamentoLocal";
import type { Conversa, Resposta, Turno } from "../../../types/conversa";

const CHAVE = armazenamentoLocal.chaves.conversas;
const LIMITE = 40;
const NENHUMA: Conversa[] = [];

const todas = () => armazenamentoLocal.ler<Conversa[]>(CHAVE, NENHUMA);
const salvar = (lista: Conversa[]) => armazenamentoLocal.gravar(CHAVE, lista.slice(0, LIMITE));
const agora = () => new Date().toISOString();

export function lerConversa(id: string) {
  return todas().find((c) => c.id === id);
}

/** Cria a conversa com a primeira pergunta e devolve os ids da conversa e do turno. */
export function criarConversa(pergunta: string, horizonte?: Horizonte) {
  const turno = novoTurno(pergunta);
  const conversa: Conversa = { id: crypto.randomUUID(), titulo: pergunta, criadaEm: turno.criadoEm, atualizadaEm: turno.criadoEm, horizonte, turnos: [turno] };
  salvar([conversa, ...todas()]);
  return { conversaId: conversa.id, turnoId: turno.id };
}

export function adicionarPergunta(conversaId: string, pergunta: string) {
  const turno = novoTurno(pergunta);
  alterar(conversaId, (c) => ({ ...c, turnos: [...c.turnos, turno] }));
  return turno.id;
}

export function definirResposta(conversaId: string, turnoId: string, resposta: Resposta) {
  alterar(conversaId, (c) => ({
    ...c,
    // a primeira análise abre a investigação da conversa; as perguntas seguintes a usam como contexto
    investigacaoId: c.investigacaoId ?? (resposta.tipo === "analise" ? resposta.investigacaoId : undefined),
    turnos: c.turnos.map((t) => (t.id === turnoId ? { ...t, resposta } : t)),
  }));
}

export function removerConversa(id: string) {
  salvar(todas().filter((c) => c.id !== id));
}

function alterar(id: string, f: (c: Conversa) => Conversa) {
  const lista = todas();
  const atual = lista.find((c) => c.id === id);
  if (!atual) return;
  // a conversa alterada sobe para o topo do histórico
  salvar([{ ...f(atual), atualizadaEm: agora() }, ...lista.filter((c) => c.id !== id)]);
}

function novoTurno(pergunta: string): Turno {
  return { id: crypto.randomUUID(), pergunta, criadoEm: agora(), resposta: { tipo: "processando" } };
}

export function useConversas() {
  return useSyncExternalStore(armazenamentoLocal.assinar, todas, () => NENHUMA);
}

export function useConversa(id: string | undefined) {
  const lista = useConversas();
  return id ? lista.find((c) => c.id === id) : undefined;
}
