/**
 * Contrato com a API da F.R.E.Y.A. — espelho dos modelos pydantic do backend
 * (investigacao/orquestrador.py, prospectivo/modelos.py, grafo_visual/montagem.py, evidencias/registro.py).
 *
 * Dono: Agente 3 (integração). Os outros agentes só leem estes tipos.
 * Se o backend mudar, este arquivo muda junto, nunca o contrário.
 */

// ------------------------------------------------------------------ investigação

export type EstadoInvestigacao = "pendente" | "recuperando" | "analisando" | "validando" | "concluida" | "falhou";

/**
 * Uma etapa da execução. `resumo` fica vazio enquanto a etapa corre (`fim: null`) e, ao terminar, traz:
 * - recuperacao: `ResumoDaRecuperacao`;
 * - analise: `ResumoDaAnalise`;
 * - validacao_e_grafo: `ResumoDaValidacao`.
 */
export interface Etapa {
  nome: "recuperacao" | "analise" | "validacao_e_grafo" | string;
  inicio: string; // ISO 8601
  fim: string | null;
  resumo: Record<string, unknown>;
}

export interface ResumoDaRecuperacao {
  trechos: number;
  entidades_focais: string[];
  nos: number;
  arestas: number;
  caminhos: number;
  sem_caminho: number;
}

export interface ResumoDaAnalise {
  modo: string;
  modelo: string | null;
  evidencias: number;
  cenarios: number;
}

export interface ResumoDaValidacao {
  rebaixadas: number;
  removidas: number;
  citacoes_invalidas: number;
  entidades_desconhecidas: number;
}

export interface Investigacao {
  id: string;
  questao: string;
  horizonte: string | null;
  estado: EstadoInvestigacao;
  etapas: Etapa[];
  erro: string | null;
  analise: AnaliseProspectiva | null;
  /** caminho do grafo (`/investigacoes/{id}/grafo`) quando concluída; o grafo vem por outra chamada */
  grafo: string | null;
  /** o registro inteiro de evidências da investigação (o grafo traz só as que ele cita) */
  evidencias: Record<string, Evidencia>;
  criada_em: string;
  atualizada_em: string;
  guardada: boolean;
}

/** Resposta de POST /investigacoes (202) */
export interface InvestigacaoCriada {
  id: string;
  estado: EstadoInvestigacao;
  acompanhar: string;
}

/** Item da lista de investigações (histórico e guardados). GET /investigacoes, mais recentes primeiro. */
export interface ResumoDeInvestigacao {
  id: string;
  questao: string;
  horizonte: string | null;
  estado: EstadoInvestigacao;
  erro: string | null;
  guardada: boolean;
  cenarios: number;
  criada_em: string;
  atualizada_em: string;
}

// ------------------------------------------------------------------ análise prospectiva

export type TipoEpistemico = "confirmado" | "inferencia" | "hipotese";

export interface Afirmacao {
  texto: string;
  tipo: TipoEpistemico;
  evidencias: string[]; // ids do registro: E1, E2…
}

export interface Ator {
  entidade: string; // chave no grafo, ex.: character:thanos
  papel: string;
  fundamentos: Afirmacao[];
}

export interface RelacaoSistemica {
  entidades: string[];
  natureza: string;
  descricao: Afirmacao;
}

export interface Variavel {
  nome: string;
  descricao: Afirmacao;
  entidades: string[];
}

export interface Incerteza {
  nome: string;
  por_que_importa: Afirmacao;
  polos: string[];
}

export interface Desdobramento {
  descricao: Afirmacao;
  consequencias_diretas: Afirmacao[];
  consequencias_indiretas: Afirmacao[];
}

export interface Cenario {
  id: string;
  nome: string;
  logica: Afirmacao;
  premissas: Afirmacao[];
  desenvolvimento: Afirmacao[];
  consequencias: Afirmacao[];
  sinais: Afirmacao[];
  entidades: string[];
}

export interface RegistroDeValidacao {
  removidas: string[];
  rebaixadas: string[];
  citacoes_invalidas: string[];
  entidades_desconhecidas: string[];
}

export interface AnaliseProspectiva {
  questao: string;
  horizonte: string | null;
  continuidade: string; // "MCU"
  modo: "modelo" | "deterministico" | string;
  modelo: string | null;
  gerada_em: string;
  /** a resposta em parágrafos corridos (análises antigas não têm) */
  resposta?: Afirmacao[];
  contexto: Afirmacao[];
  atores: Ator[];
  relacoes_sistemicas: RelacaoSistemica[];
  variaveis: Variavel[];
  tendencias_e_sinais: Afirmacao[];
  incertezas_criticas: Incerteza[];
  desdobramentos: Desdobramento[];
  cenarios: Cenario[];
  limitacoes: string[];
  validacao: RegistroDeValidacao;
}

// ------------------------------------------------------------------ evidências

export interface Fonte {
  doc_id: string;
  url: string;
  titulo: string | null;
  captura_id: string | null;
  confiabilidade: "oficial" | "enciclopedia" | "wiki_fas" | string;
  licenca: string | null;
}

export interface Evidencia {
  id: string;
  tipo: "trecho" | "relacao" | "momento" | "aparicao" | string;
  texto: string;
  fonte: Fonte;
  chunk_id: string | null;
  aresta_id: string | null;
  entidades: string[];
  nota: number | null;
}

// ------------------------------------------------------------------ grafo (GraphRAG)

export type PapelDoNo = "focal" | "ponte" | "contexto" | "trajetoria" | "expansao" | string;

export interface NoVisual {
  id: string;
  rotulo: string;
  tipo: string; // character, organization, film, series, event, location, artifact, technology, person, company, concept
  papel: PapelDoNo;
  relevancia: number; // 0–1
  grau: number;
  descricao: string | null;
  atributos: Record<string, unknown>;
  cenarios: string[];
}

export interface ArestaVisual {
  id: string;
  origem: string;
  destino: string;
  predicado: string;
  rotulo: string; // em português
  dirigida: boolean;
  tipo_epistemico: TipoEpistemico | string;
  peso: number;
  evidencias: string[];
  ordem: number | null;
  ano: number | null;
  em_caminhos: string[];
  cenarios: string[];
}

export interface PassoDaSequencia {
  passo: number;
  motivo: string;
  nos: string[];
  arestas: string[];
}

export interface CaminhoVisual {
  id: string;
  nos: string[];
  arestas: string[];
  descricao: string;
}

export interface CenarioNoGrafo {
  id: string;
  nome: string;
  nos: string[];
  arestas: string[];
}

export interface ItemDaLegenda {
  rotulo: string; // em português
  quantidade: number;
}

export interface LegendaDoGrafo {
  /** por tipo de nó presente (character, film…) */
  tipos_de_no: Record<string, ItemDaLegenda>;
  /** por predicado presente (ALLY_OF, ENEMY_OF…), com o rótulo em português */
  tipos_de_relacao: Record<string, ItemDaLegenda>;
  /** focal, ponte, trajetoria, contexto → descrição (nós de `expansao` não entram) */
  papeis: Record<string, string>;
}

export interface GrafoDaInvestigacao {
  nos: NoVisual[];
  arestas: ArestaVisual[];
  evidencias: Record<string, Evidencia>;
  sequencia: PassoDaSequencia[];
  caminhos: CaminhoVisual[];
  cenarios: CenarioNoGrafo[];
  legenda: LegendaDoGrafo;
  focais: string[];
}

/** GET /investigacoes/{id}/grafo/expandir */
export interface ExpansaoDoGrafo {
  no: string;
  nos: NoVisual[];
  arestas: ArestaVisual[];
  evidencias: Record<string, Evidencia>;
}

/** GET /investigacoes/{id}/grafo/caminho */
export interface CaminhosEntreNos {
  de: string;
  para: string;
  existe: boolean;
  caminhos: { id: string; nos: string[]; arestas: ArestaVisual[] }[];
  evidencias: Record<string, Evidencia>;
}

// ------------------------------------------------------------------ saúde

export interface Saude {
  status: "ok" | string;
  motor: "modelo" | "deterministico" | string;
  modelo: string | null;
  grafo: string;
  base: { hybrid: { documentos: number; chunks: number }; grafo: { nos: number; arestas: number } } | null;
}
