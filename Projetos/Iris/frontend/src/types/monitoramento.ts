/**
 * Monitoramento prospectivo: o que aconteceu DEPOIS da investigação e como isso se relaciona com os cenários.
 *
 * Ainda não existe no servidor (não há motor de investigação nem de monitoramento). Este é o contrato que a
 * interface espera; o campo é opcional em `ResultadoDeInvestigacao`, e sem ele a seção mostra estados vazios
 * honestos. Ver docs/CONTRATO-MONITORAMENTO.md.
 *
 * Princípios que o formato impõe:
 * - acontecimento NÃO é confirmação: o impacto em cada cenário é uma classificação justificada, com evidências;
 * - nada sobrescreve: cada mudança é uma entrada do histórico, e os cenários anteriores ficam em `versoesAnteriores`;
 * - nova evidência, nova interpretação, revisão de premissa e revisão de cenário são tipos diferentes.
 */
import type { CenarioId } from "./cenario";
import type { Afirmacao } from "./fonte";

/** Relação de um acontecimento com um cenário. "investigar" = não dá para dizer sem pesquisa adicional. */
export type ImpactoNoCenario = "favorece" | "enfraquece" | "neutro" | "ambiguo" | "investigar";

/** Efeito de uma evidência nova sobre uma premissa. */
export type EfeitoNaPremissa = "reforca" | "enfraquece" | "contradiz" | "obsoleta" | "revisar";

export type TipoDeAcontecimento = "noticia" | "documento" | "declaracao" | "dado" | "outro";

export interface Acontecimento {
  id: string;
  data: string; // "2026-11-04"
  titulo: string;
  descricao: string;
  tipo: TipoDeAcontecimento;
  /** Fontes do acontecimento (ids em `r.fontes`). Sem fonte verificável, o acontecimento não entra. */
  fontes: string[];
  /** Como o acontecimento se liga à pergunta da investigação (leitura do analista ou do motor). */
  relacao: Afirmacao;
  impactos: { cenario: CenarioId; impacto: ImpactoNoCenario; justificativa: Afirmacao }[];
  /** Versão da investigação que incorporou este acontecimento; ausente = ainda não incorporado. */
  incorporadoNaVersao?: number;
}

export interface RevisaoDePremissa {
  cenario: CenarioId;
  /** Posição da premissa em `cenario.premissas` na versão em que foi escrita. */
  premissa: number;
  efeito: EfeitoNaPremissa;
  justificativa: Afirmacao;
  acontecimento?: string; // id em `acontecimentos`
  versao: number;
  data: string;
}

export type Tendencia = "alta" | "queda" | "estavel" | "inconclusiva";

/** Uma leitura de um indicador (sinal) num momento. */
export interface ObservacaoDeIndicador {
  sinal: string; // id em `r.sinais`
  data: string;
  texto: string;
  evidencias?: string[];
  /** Só quando há observações suficientes para dizer; ausente = sem tendência identificada. */
  tendencia?: Tendencia;
}

export type TipoDeMudanca = "criacao" | "nova-evidencia" | "nova-interpretacao" | "revisao-premissa" | "revisao-cenario";

export interface EntradaDoHistorico {
  id: string;
  versao: number;
  data: string;
  tipo: TipoDeMudanca;
  /** O que mudou, em uma ou duas frases. */
  texto: string;
  cenario?: CenarioId;
  /** O que motivou a mudança: evidências (ids em `r.evidencias`) e/ou acontecimentos. */
  evidencias?: string[];
  acontecimentos?: string[];
}

/** Retrato de um cenário numa versão anterior: preservado, nunca sobrescrito. */
export interface VersaoDoCenario {
  cenario: CenarioId;
  versao: number;
  data: string;
  nome: string;
  ideia: string;
  premissas: Afirmacao[];
}

export interface Monitoramento {
  /** Data da última varredura por acontecimentos novos. */
  verificadoEm: string;
  acontecimentos: Acontecimento[];
  revisoesDePremissas: RevisaoDePremissa[];
  observacoes: ObservacaoDeIndicador[];
  historico: EntradaDoHistorico[];
  versoesAnteriores: VersaoDoCenario[];
  /** Marca dados de demonstração da interface (fictícios). Nunca vem do servidor. */
  demonstracao?: boolean;
}
