/** Tempo: horizontes, eventos da linha do tempo e sinais de alerta. */

import type { CenarioId } from "./cenario";

// ------------------------------------------------------------------ tempo

export type CategoriaTempo = "observado" | "inferido" | "condicional" | "projetado";

export interface Horizonte {
  id: string;
  nome: string;
  inicio: number;
  fim: number;
}

export interface EventoTempo {
  id: string;
  data: string; // rótulo legível: "jul. 2025"
  ano: number;
  categoria: CategoriaTempo;
  texto: string;
  cenarios?: CenarioId[]; // ausente = comum a todos (passado e calendário)
  atores: string[];
  relacoes?: string[];
  evidencias?: string[];
  condicao?: string;
  inflexao?: boolean;
  agendado?: boolean;
  sinais?: string[];
}

export interface Sinal {
  id: string;
  sinal: string;
  variavel: string;
  favorece: CenarioId[];
  enfraquece: CenarioId[];
  leitura: string;
  ondeAcompanhar: string;
  quando: string;
}
