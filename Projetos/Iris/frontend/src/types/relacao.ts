/** Relações entre atores: natureza, tema e como cada cenário as muda. */

import type { CenarioId } from "./cenario";
import type { Afirmacao } from "./fonte";

export type TipoRelacao = "cooperacao" | "competicao" | "conflito" | "dependencia" | "influencia" | "fluxo";
export type Tema = "politica" | "economia" | "seguranca" | "diplomacia" | "instituicoes";
export type Mudanca = "mantida" | "reforcada" | "enfraquecida" | "transformada" | "nova" | "ausente";

export interface EstadoNoCenario {
  mudanca: Mudanca;
  tipo?: TipoRelacao; // quando o cenário muda a natureza da relação
  texto: string;
  evidencias?: string[];
}

export interface Relacao {
  id: string;
  de: string;
  para: string;
  tipo: TipoRelacao; // natureza no presente (ou na primeira vez em que aparece)
  tema: Tema;
  /** Estado observado em 2026; `null` quando a relação só existe em cenários. */
  presente: Afirmacao | null;
  mecanismo: string;
  cenarios: Record<CenarioId, EstadoNoCenario>;
  incerteza?: string;
}
