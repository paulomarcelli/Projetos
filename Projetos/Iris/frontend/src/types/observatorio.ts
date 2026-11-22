/**
 * Contratos do Observatório (ciclos, turma, entregas) e dos documentos escritos a partir de uma investigação (policy
 * brief, boletim, dossiê), com o registro de uso de IA. Revisão de design de 22/11/2026 (docs/design-system.md).
 *
 * Ainda não há servidor para nada disto: a interface mostra estados vazios honestos e, na prévia, dados de exemplo
 * marcados como exemplo (`src/previa/observatorio-exemplo.ts`). Quando o servidor existir, ele devolve estes formatos.
 */
import type { CenarioId } from "./cenario";

/** O que a revisão humana fez com o texto sugerido. */
export type DecisaoDeRevisao = "aceito" | "editado" | "descartado";

/** Um registro de uso de IA: quando, o que se pediu, o que a IA fez, com que fontes e quem revisou. */
export interface RegistroDeUsoDeIA {
  id: string;
  /** Data e hora locais, "2026-11-12T14:32". */
  quando: string;
  /** O pedido, em uma linha ("Resumir as fontes [3]–[7]"). */
  pedido: string;
  /** O que a IA fez e o que aconteceu com isso ("propôs 2 parágrafos; 1 aceito com edição, 1 descartado"). */
  feito: string;
  /** O modelo, como o servidor o identifica. */
  modelo: string;
  /** Números das fontes usadas (os mesmos das citações no texto). */
  fontes: number[];
  /** Revisão humana: sem ela, o texto sugerido continua marcado no documento. */
  revisao: { estado: "revisado"; por: string; em: string; decisao?: DecisaoDeRevisao } | { estado: "aguardando" };
}

export type TipoDeDocumento = "policy-brief" | "boletim" | "dossie";

export const NOME_DO_TIPO: Record<TipoDeDocumento, string> = {
  "policy-brief": "Policy brief",
  boletim: "Boletim de conjuntura",
  dossie: "Dossiê temático",
};

export type EstadoDaEntrega = "andamento" | "revisao" | "entregue";

/** Uma entrega da turma: tipo, título, equipe, versão do cenário usada, prazo e estado. */
export interface Entrega {
  id: string;
  tipo: TipoDeDocumento;
  titulo: string;
  equipe: string;
  /** O que a entrega usa da investigação ("parte do cenário B, v3"; "3 cenários, 9 sinais"). */
  base: string;
  /** "2026-11-28". */
  prazo: string;
  estado: EstadoDaEntrega;
  /** Documento editável na IRIS, quando existe. */
  documento?: string;
}

export type TipoDeMarco = "chamada" | "revisao-cenario" | "prazo";

/** Um ponto na linha do semestre. */
export interface Marco {
  data: string;
  tipo: TipoDeMarco;
  rotulo: string;
}

/** Um cenário acompanhado pelo observatório, com a versão em vigor. */
export interface CenarioDoObservatorio {
  investigacao: string;
  cenario: CenarioId;
  nome: string;
  versao: number;
  proximaRevisao: string;
}

export interface Ciclo {
  /** "2026.2". */
  id: string;
  inicio: string;
  fim: string;
  /** O que o ciclo investiga ("Comércio exterior e disputa EUA–China"). */
  tema: string;
  marcos: Marco[];
  entregas: Entrega[];
  cenarios: CenarioDoObservatorio[];
  registros: RegistroDeUsoDeIA[];
}

/** Um trecho do documento. `sugerido` marca o texto proposto pela IA até alguém aceitar, editar ou descartar. */
export interface Trecho {
  id: string;
  texto: string;
  /** Números das fontes citadas no trecho. */
  citacoes: number[];
  sugerido?: { registro: string };
}

export interface SecaoDoDocumento {
  id: string;
  titulo: string;
  trechos: Trecho[];
}

export interface FonteDoDocumento {
  numero: number;
  titulo: string;
  origem: string;
  /** Conferida no texto por alguém da equipe. */
  conferida: boolean;
}

export interface Documento {
  id: string;
  tipo: TipoDeDocumento;
  titulo: string;
  equipe: string;
  investigacao: string;
  /** Versão do próprio documento (rascunho até a entrega). */
  versao: number;
  cenario: { id: CenarioId; versao: number };
  prazo: string;
  secoes: SecaoDoDocumento[];
  fontes: FonteDoDocumento[];
  registros: RegistroDeUsoDeIA[];
}
