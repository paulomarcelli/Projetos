// Espelho dos contratos Pydantic do backend (atlas/modelos.py).
export type Nivel = "baixo" | "moderado" | "alto";
export type Natureza = "fato" | "interpretacao" | "premissa" | "hipotese";
export type Dimensao = "economico" | "diplomatico" | "estrategico";
export type TipoCenario = "continuidade" | "escalada" | "desescalada";
export type NomeAgente = "orquestrador" | "researcher" | "analyst" | "verifier";
export type Status = "pendente" | "executando" | "concluida" | "parcial" | "falhou";

export interface Variavel {
  id: string; nome: string; descricao: string; minimo: number; maximo: number; passo: number; padrao: number;
  unidade: string; rotulos: string[]; pesos: Partial<Record<Dimensao, number>>; efeito_escalada: number;
}
export interface Ator { id: string; nome: string; iso3: string | null; papel: string }
export interface Caso {
  id: string; titulo: string; resumo: string; contexto: string; atores: Ator[]; variaveis: Variavel[];
  horizontes_meses: number[]; hipoteses: string[]; consultas: string[]; premissas_padrao: string[]; personalizado: boolean;
}
export interface SimulacaoEntrada {
  caso_id: string; valores: Record<string, number>; horizonte_meses: number; premissas_extra: string[];
  titulo_personalizado?: string | null; descricao_personalizada?: string | null; base_id?: string | null;
}
export interface Fonte {
  id: string; titulo: string; url: string | null; publicador: string | null; data_publicacao: string | null;
  data_consulta: string; trecho: string; consulta: string | null; demonstrativa: boolean;
}
export interface Evidencia { id: string; afirmacao: string; fonte_ids: string[]; status: "confirmado" | "alegado" | "incerto"; relacao: "favorece" | "contraria" | "contexto"; hipotese: string | null }
export interface PacoteEvidencias { consultas: string[]; fontes: Fonte[]; evidencias: Evidencia[]; lacunas: string[]; pesquisa_real: boolean; erro: string | null }
export interface IndiceDimensao { valor: number; nivel: Nivel; contribuicoes: Record<string, number> }
export interface SaidaMotor { valores_normalizados: Record<string, number>; indices: Record<Dimensao, IndiceDimensao>; propensao_escalada: IndiceDimensao; fator_horizonte: number; formula: string; limitacoes: string[] }
export interface Afirmacao { texto: string; natureza: Natureza; evidencia_ids: string[] }
export interface Cenario { tipo: TipoCenario; titulo: string; narrativa: Afirmacao[]; gatilhos: string[]; indicadores: string[]; plausibilidade: Nivel; justificativa: string }
export interface Impacto { dimensao: Dimensao; titulo: string; mecanismo: string; por_cenario: Partial<Record<TipoCenario, Nivel>>; natureza: Natureza; evidencia_ids: string[] }
export interface AnaliseAtor { ator_id: string; interesses: string[]; incentivos: string[]; capacidades: string[]; restricoes: string[]; postura: "cooperativa" | "neutra" | "confrontacional" }
export interface ItemMatriz { tipo: "risco" | "oportunidade"; titulo: string; probabilidade: Nivel; impacto: Nivel; justificativa: string; cenarios: TipoCenario[] }
export interface Relacao { origem: string; destino: string; tipo: "cooperacao" | "tensao" | "dependencia" | "neutra"; intensidade: Nivel; descricao: string }
export interface SaidaAnalyst {
  resumo_executivo: Afirmacao[]; atores: AnaliseAtor[]; cenarios: Cenario[]; impactos: Impacto[]; matriz: ItemMatriz[];
  relacoes: Relacao[]; confianca: Nivel; justificativa_confianca: string; incertezas: string[];
}
export interface Problema { severidade: "critico" | "alerta"; alvo: "researcher" | "analyst"; local: string; descricao: string; origem: "regra" | "ia" }
export interface RelatorioVerificacao { rodada: number; aprovado: boolean; problemas: Problema[]; observacoes: string[] }
export interface Evento { seq: number; ts: string; agente: NomeAgente; tipo: "inicio" | "progresso" | "resultado" | "aviso" | "erro" | "fim"; mensagem: string; dados: Record<string, unknown> }
export interface Uso { chamadas_llm: number; tokens_entrada: number; tokens_saida: number; buscas: number; cache_hits: number }
export interface Modo { ia: "gemini" | "ollama" | "openai" | "demo"; busca: "tavily" | "gdelt" | "demo"; demonstrativo: boolean }
export interface RegistroPremissas { premissas: string[]; horizonte_meses: number; condicoes_iniciais: string[]; limitacoes: string[] }
export interface Resultado {
  id: string; criada_em: string; status: Status; entrada: SimulacaoEntrada; caso: Caso; registro: RegistroPremissas | null;
  motor: SaidaMotor | null; evidencias: PacoteEvidencias | null; analise: SaidaAnalyst | null; verificacoes: RelatorioVerificacao[];
  modo: Modo; uso: Uso; avisos: string[]; erro: string | null;
}
export interface ResumoSimulacao { id: string; criada_em: string; status: Status; caso_id: string; titulo: string; horizonte_meses: number; modo: Modo; confianca: Nivel | null; base_id: string | null }
export interface Comparacao {
  a_id: string; b_id: string; mesmo_caso: boolean; variaveis: { id: string; nome: string; antes: number | null; depois: number | null }[];
  horizonte: [number, number]; premissas_adicionadas: string[]; premissas_removidas: string[]; indices: Record<string, [number, number]>;
  mudancas: { item: string; antes: string; depois: string }[]; inalteradas: string[]; aviso: string;
}
export interface Saude {
  versao: string; modo: Modo; modelo: string | null; credenciais: { gemini: boolean; tavily: boolean; openai_compat?: boolean };
  provedores?: { ia: string; busca: string };
  limites: Record<string, number>; uso_hoje: Record<string, number>;
}
