import type { Dimensao, Natureza, Nivel, NomeAgente, Status, TipoCenario } from "../api/tipos";

export const NIVEL: Record<Nivel, string> = { baixo: "Baixo", moderado: "Moderado", alto: "Alto" };
export const ORDEM_NIVEL: Record<Nivel, number> = { baixo: 0, moderado: 1, alto: 2 };

export const NATUREZA: Record<Natureza, { rotulo: string; dica: string }> = {
  fato: { rotulo: "Fato verificado", dica: "Sustentado por evidência confirmada com fonte rastreável." },
  interpretacao: { rotulo: "Interpretação", dica: "Leitura analítica a partir das evidências e dos índices." },
  premissa: { rotulo: "Premissa", dica: "Condição assumida nesta simulação." },
  hipotese: { rotulo: "Hipótese", dica: "Algo que pode acontecer sob as premissas; não é previsão." },
};

export const DIMENSAO: Record<Dimensao, string> = { economico: "Econômico", diplomatico: "Diplomático", estrategico: "Estratégico" };

export const CENARIO: Record<TipoCenario, { rotulo: string; descricao: string }> = {
  continuidade: { rotulo: "Continuidade", descricao: "Tendências atuais se mantêm" },
  escalada: { rotulo: "Escalada", descricao: "A disputa se intensifica" },
  desescalada: { rotulo: "Desescalada", descricao: "Tensões diminuem" },
};

export const AGENTE: Record<NomeAgente, { rotulo: string; funcao: string }> = {
  orquestrador: { rotulo: "Orquestrador", funcao: "Coordena etapas, valida saídas e controla o ciclo de revisão" },
  researcher: { rotulo: "Researcher", funcao: "Pesquisa fontes e extrai evidências rastreáveis" },
  analyst: { rotulo: "Analyst", funcao: "Atores, cenários, impactos e matriz de riscos" },
  verifier: { rotulo: "Verifier", funcao: "Confere fatos, citações e coerência com as premissas" },
};

export const STATUS: Record<Status, string> = {
  pendente: "Na fila", executando: "Em execução", concluida: "Concluída", parcial: "Parcial", falhou: "Falhou",
};

export function dataHora(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function formatarValor(v: number, unidade: string): string {
  const n = Number.isInteger(v) ? String(v) : v.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  return unidade ? `${n} ${unidade}` : n;
}

/** Rótulo qualitativo da posição do valor na faixa da variável (mesma regra do backend). */
export function rotuloDaFaixa(v: number, min: number, max: number, rotulos: string[]): string | null {
  if (!rotulos.length) return null;
  const i = Math.min(rotulos.length - 1, Math.floor(((v - min) / (max - min || 1)) * rotulos.length));
  return rotulos[i];
}

export const NOME_IA: Record<string, string> = { gemini: "Gemini", ollama: "Ollama (local)", openai: "API compatível com OpenAI", demo: "demonstrativa" };
export const NOME_BUSCA: Record<string, string> = { tavily: "Tavily", gdelt: "GDELT", demo: "desativada" };
