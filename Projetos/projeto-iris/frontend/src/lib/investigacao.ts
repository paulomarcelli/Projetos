/**
 * Formato do RESULTADO de uma investigação prospectiva. Ainda não há API para isso: o tipo existe
 * para a interface ficar pronta e para a prévia mostrar um exemplo. Quando o motor existir, ele
 * deve devolver exatamente esta estrutura.
 *
 * Princípio: a rastreabilidade é estrutural. Afirmações apontam para EVIDÊNCIAS; cada evidência
 * aponta para FONTES e declara a interpretação e a implicação prospectiva. Atores, relações,
 * cenários e eventos da linha do tempo usam as mesmas evidências.
 */

import type { TipoEpistemico } from "../components/Epistemico";
import type { RegiaoId } from "../geo/regioes-def";

export type CenarioId = "A" | "B" | "C";
/** O que o mapa e a linha do tempo mostram: o sistema observado ou um cenário. */
export type Vista = "presente" | CenarioId;

// ------------------------------------------------------------------ fontes e evidências

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

// ------------------------------------------------------------------ sistema: atores e relações

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
  papel: string;
  caracteristicas: Afirmacao[]; // interesses e capacidades
  incerteza?: string;
  implicacoes: Record<CenarioId, string>;
}

import type { TipoRelacao } from "../components/Diagramas";
export type { TipoRelacao };
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
}

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

export interface Metodo {
  nome: string;
  finalidade: string;
  aplicacao: "aplicado" | "parcial" | "nao-aplicado";
  como: string;
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
  principalIncerteza: string; // id de IncertezaCritica
  metodos: Metodo[];
  premissas: Afirmacao[];
  incertezas: IncertezaCritica[];
  quadranteNaoDesenvolvido?: string;
  atores: Ator[];
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
