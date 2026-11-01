/** Atores do sistema internacional (Estados, organizações, instituições, grupos). */

import type { CenarioId, Vista } from "./cenario";
import type { Afirmacao } from "./fonte";

export type TipoAtor = "estado" | "organizacao" | "instituicao" | "grupo";
export type GrupoRegional = "brasil" | "americas" | "europa" | "asia" | "multilateral";

export interface Ator {
  id: string;
  nome: string;
  curto: string; // rótulo do mapa
  tipo: TipoAtor;
  grupo: GrupoRegional;
  /** Posição esquemática no quadro paisagem (1000×640) e retrato (600×860). */
  pos: { x: number; y: number };
  posRetrato: { x: number; y: number };
  /** Código ISO 3166 alfa-3 (só países). */
  iso?: string;
  /** Código ISO 3166 numérico (liga o ator ao território no mapa). */
  isoNum?: string;
  /** Longitude e latitude da capital, onde o nó fica no mapa geográfico. */
  coord?: [number, number];
  /**
   * Posição esquemática do país no mapa (quadro 1000×620) em cada vista. A horizontal indica a
   * direção do alinhamento descrito (Washington à esquerda, Pequim à direita); não é medida.
   */
  mapa?: Record<Vista, { x: number; y: number }>;
  /** Nota curta sob o nome no mapa, por vista (ex.: "crise institucional"). */
  notaNoMapa?: Partial<Record<Vista, string>>;
  papel: string;
  caracteristicas: Afirmacao[]; // interesses e capacidades
  incerteza?: string;
  implicacoes: Record<CenarioId, string>;
}

/** Natureza de uma relação entre atores. (Os tipos não dependem de componentes visuais.) */
