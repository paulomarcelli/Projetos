/**
 * A conversa com a Iris: uma investigação conduzida por perguntas. A primeira pergunta abre a investigação (análise +
 * cenários); as seguintes a aprofundam, no mesmo contexto, até a pessoa começar uma nova.
 *
 * O que fica guardado é só a referência ao resultado (`investigacaoId` + `versao`), nunca o resultado inteiro: ele é
 * carregado de onde vem (hoje, na prévia, o exemplo; quando houver API, o servidor).
 */

import type { Horizonte } from "../hooks/useArmazenamentoLocal";

/** Pergunta complementar: o que a pessoa quer aprofundar na investigação aberta. */
export type Intencao = "brasil" | "interesses" | "alteracoes" | "historia" | "indicadores" | "livre";

/** Etapas mostradas enquanto a Iris processa (as mesmas, na mesma ordem, para toda investigação). */
export type Etapa = "pergunta" | "evidencias" | "atores" | "cenarios";

/** Situação dos cenários de uma análise: podem chegar depois do texto. */
export type EstadoDosCenarios = "gerando" | "prontos";

export type Resposta =
  | { tipo: "processando" }
  | {
      tipo: "analise";
      investigacaoId: string;
      versao: number;
      cenarios: EstadoDosCenarios;
      /** Dado de demonstração (prévia): a interface avisa e mostra qual pergunta o exemplo responde. */
      demonstracao: boolean;
    }
  | { tipo: "complemento"; investigacaoId: string; intencao: Intencao; demonstracao: boolean }
  /** Sem motor de investigação no servidor: a pergunta não foi processada. */
  | { tipo: "indisponivel" }
  | { tipo: "erro"; mensagem: string };

export interface Turno {
  id: string;
  pergunta: string;
  criadoEm: string;
  resposta: Resposta;
}

export interface Conversa {
  id: string;
  /** A primeira pergunta. */
  titulo: string;
  criadaEm: string;
  atualizadaEm: string;
  /** A investigação aberta pela primeira resposta; as perguntas seguintes a aprofundam. */
  investigacaoId?: string;
  /** Até onde olhar, em anos a partir de hoje: escolhido junto com a primeira pergunta. */
  horizonte?: Horizonte;
  turnos: Turno[];
}

/** O que acontece enquanto uma pergunta é processada (contrato entre o serviço e o motor). */
export type EventoDaPergunta = { tipo: "etapa"; etapa: Etapa } | { tipo: "resposta"; resposta: Resposta };

/** Contexto enviado com cada pergunta: é o que faz a seguinte continuar a investigação, e não começar outra. */
export interface ContextoDaPergunta {
  investigacaoId?: string;
  anteriores: string[];
  /** Horizonte da investigação, em anos (vale para a conversa inteira). */
  horizonte?: Horizonte;
}
