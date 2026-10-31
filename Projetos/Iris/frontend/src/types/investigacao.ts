/**
 * Formato do RESULTADO de uma investigação prospectiva. Ainda não há API para isso: o tipo existe
 * para a interface ficar pronta e para a prévia mostrar um exemplo. Quando o motor existir, ele
 * deve devolver exatamente esta estrutura.
 *
 * Princípio: a rastreabilidade é estrutural. Afirmações apontam para EVIDÊNCIAS; cada evidência
 * aponta para FONTES e declara a interpretação e a implicação prospectiva. Atores, relações,
 * cenários e eventos da linha do tempo usam as mesmas evidências.
 */

import type { Ator } from "./ator";
import type { Cenario, IncertezaCritica, Variavel, Vista } from "./cenario";
import type { EventoTempo, Horizonte, Sinal } from "./evento";
import type { Afirmacao, Evidencia, Fonte } from "./fonte";
import type { Relacao } from "./relacao";

/** Bloco desenhado como região em volta dos países membros; muda por vista. */
export interface Bloco {
  id: string;
  nome: string;
  ator: string; // ator (organização) com o painel do bloco
  membros: Record<Vista, string[]>;
  estado: Record<Vista, "ativo" | "reforcado" | "enfraquecido">;
}

export interface Metodo {
  nome: string;
  finalidade: string;
  aplicacao: "aplicado" | "parcial" | "nao-aplicado";
  como: string;
}

/**
 * Diagnóstico estratégico escrito pelo motor: o que está acontecendo, o problema estratégico central, por que ele
 * importa e as implicações para o futuro. Opcional: sem ele, a interface o monta a partir da síntese, do aviso de
 * contexto, da incerteza principal e das implicações declaradas nas evidências (features/investigacao/estrutura.ts).
 */
export interface Diagnostico {
  situacao: Afirmacao[];
  problema: Afirmacao;
  relevancia: Afirmacao;
  implicacoes: Afirmacao[];
}

/** Um parágrafo das dinâmicas geopolíticas: afirmações rastreáveis, na ordem da narrativa. */
export interface ParagrafoDeDinamica {
  afirmacoes: Afirmacao[];
  /** Atores citados no parágrafo (abrem o perfil). */
  atores?: string[];
}

export interface ResultadoDeInvestigacao {
  id: string;
  pergunta: string;
  natureza: string;
  horizonte: { inicio: number; fim: number };
  escopo: string;
  dimensoes: string[];
  profundidade: string;
  origem: string;
  atualizadoEm: string;
  versao: number;
  avisoDeContexto: Afirmacao;
  sintese: string;
  /** Opcional: escrito pelo motor. Sem ele, montado dos campos abaixo. */
  diagnostico?: Diagnostico;
  /** Opcional: a análise das dinâmicas como narrativa. Sem ela, montada de atores, relações e fatores. */
  dinamicas?: ParagrafoDeDinamica[];
  principalIncerteza: string; // id de IncertezaCritica
  metodos: Metodo[];
  premissas: Afirmacao[];
  incertezas: IncertezaCritica[];
  quadranteNaoDesenvolvido?: string;
  atores: Ator[];
  blocos: Bloco[];
  relacoes: Relacao[];
  variaveis: Variavel[];
  cenarios: Cenario[];
  horizontes: Horizonte[];
  linhaDoTempo: EventoTempo[];
  sinais: Sinal[];
  evidencias: Evidencia[];
  limitacoes: Afirmacao[];
  fontes: Fonte[];
  revisoes: { data: string; texto: string }[];
}
