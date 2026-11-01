/** Cenários (A, B, C), fatores de mudança e incertezas críticas. */

import type { TipoEpistemico } from "../components/common/Epistemico";
import type { RegiaoId } from "../components/relations/geo/regioes-def";
import type { Afirmacao } from "./fonte";

export type CenarioId = "A" | "B" | "C";
/** O que o mapa e a linha do tempo mostram: o sistema observado ou um cenário. */
export type Vista = "presente" | CenarioId;

// ------------------------------------------------------------------ fatores de mudança

export interface IncertezaCritica {
  id: string;
  nome: string;
  pergunta: string;
  polos: [string, string];
  porQue: Afirmacao;
}

export interface Variavel {
  id: string;
  nome: string;
  porQueImporta: string;
  estadoAtual: Afirmacao;
  direcao: Record<CenarioId, string>;
}

export interface Mecanismo {
  condicao: string;
  mecanismo: string;
  consequencia: string;
  tipo: TipoEpistemico; // inferência ou hipótese
  evidencias?: string[];
}

export type Efeito = "aproximacao" | "atrito" | "misto" | "neutro";

export interface Cenario {
  id: CenarioId;
  arquetipo: "Continuidade" | "Transformação" | "Ruptura";
  nome: string;
  /** Ideia central em uma frase (cartão do cenário). */
  ideia: string;
  /** Impacto principal em uma frase (cartão do cenário). */
  impacto: string;
  sintese: string;
  /** Polo de cada incerteza crítica (0 ou 1); `null` = indiferente neste cenário. */
  posicao: Record<string, 0 | 1 | null>;
  premissas: Afirmacao[];
  tendencias: Afirmacao[];
  incertezas: string[];
  atoresDecisivos: string[];
  mecanismos: Mecanismo[];
  gatilhos: string[];
  condicoes: string[];
  consequencias: { regiao: string; regioes: RegiaoId[]; efeito: Efeito; texto: string }[];
  indicadores: string[]; // ids de sinais
  favoraveis: Afirmacao[];
  contrarias: Afirmacao[];
  limitacoes: string[];
  revisao: string[]; // o que invalidaria ou obrigaria a rever o cenário
  /**
   * Estimativa de probabilidade, SÓ quando houver método e dados que a sustentem (hoje, nenhum resultado traz).
   * Sem ela, a interface diz que nenhuma probabilidade é atribuída e por quê.
   */
  estimativa?: { valor: string; metodo: string; limitacoes: string };
}
