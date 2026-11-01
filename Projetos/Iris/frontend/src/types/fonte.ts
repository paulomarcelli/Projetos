/** Fontes, evidências e afirmações: a cadeia de rastreabilidade. */

import type { TipoEpistemico } from "../components/common/Epistemico";

export type NaturezaFonte = "primaria" | "secundaria" | "terciaria";

export interface Fonte {
  id: string;
  titulo: string;
  autor?: string;
  veiculo: string;
  data: string; // "2026-10-25", "2026-10" ou "2026"
  url: string;
  natureza: NaturezaFonte;
  /** Gênero do documento: "Reportagem", "Resultado oficial", "Enciclopédia colaborativa"... */
  genero: string;
  /** Trecho literal usado, quando foi conferido no texto da fonte. */
  trecho?: string;
  /** "conferido": o texto foi lido e o trecho copiado; "nao-conferido": só o link. */
  conferencia: "conferido" | "nao-conferido";
  limitacoes?: string;
  /** Referência apenas ilustrativa (não é evidência real). */
  demonstrativa?: boolean;
}

/** Afirmação → Evidência → Fonte → Interpretação → Implicação prospectiva. */
export interface Evidencia {
  id: string;
  afirmacao: string;
  tipo: TipoEpistemico; // fato ou evidência documental
  evidencia: string; // o que a fonte efetivamente mostra
  fontes: string[];
  interpretacao: string; // inferência do analista
  implicacao: string; // consequência para os futuros
}

export interface Afirmacao {
  tipo: TipoEpistemico;
  texto: string;
  evidencias?: string[];
}
