/**
 * Formato do RESULTADO de uma investigação. Ainda não há API para isso: o tipo existe para a
 * interface ficar pronta e para a prévia mostrar um exemplo. Quando o motor existir, ele deve
 * devolver exatamente esta estrutura.
 */

import type { TipoEpistemico } from "../components/Epistemico";
import type { RegiaoId } from "../geo/regioes-def";

export interface Fonte {
  id: string;
  titulo: string;
  veiculo: string;
  data: string; // "2026-10-25" ou "2026-10" quando só o mês é conhecido
  url: string;
}

/** Uma afirmação sempre diz de que tipo é e, quando houver, de quais fontes vem. */
export interface Afirmacao {
  tipo: TipoEpistemico;
  texto: string;
  fontes?: string[];
}

export type TrajetoriaId = "A" | "B" | "C";

export interface Variavel {
  nome: string;
  porQueImporta: string;
  estadoAtual: Afirmacao;
  direcao: Record<TrajetoriaId, string>;
}

export type Efeito = "aproximacao" | "atrito" | "misto" | "neutro";

export interface Trajetoria {
  id: TrajetoriaId;
  nome: string;
  resumo: string;
  premissas: string[];
  efeitos: { regiao: string; regioes: RegiaoId[]; efeito: Efeito; texto: string }[];
  marcos: { ano: number; texto: string }[];
  relacoes: { de: string; para: string; tipo: "alianca" | "rivalidade" | "dependencia" | "fluxo" | "causalidade" }[];
}

export interface Sinal {
  sinal: string;
  variavel: string;
  favorece: TrajetoriaId[];
  ondeAcompanhar: string;
  quando: string;
}

export interface ResultadoDeInvestigacao {
  id: string;
  pergunta: string;
  natureza: string; // ex.: "Contrafactual"
  horizonte: { inicio: number; fim: number };
  escopo: string;
  dimensoes: string[];
  profundidade: string;
  origem: string; // como o resultado foi produzido
  atualizadoEm: string;
  avisoDeContexto: Afirmacao;
  sintese: Afirmacao[];
  pontoDePartida: Afirmacao[];
  premissas: Afirmacao[];
  variaveis: Variavel[];
  trajetorias: Trajetoria[];
  calendario: { data: string; ano: number; texto: string }[];
  atores: { id: string; nome: string; x: number; y: number }[];
  sinais: Sinal[];
  limitacoes: Afirmacao[];
  fontes: Fonte[];
}
