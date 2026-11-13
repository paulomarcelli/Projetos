/**
 * Semântica das classificações de monitoramento, num só lugar. Cada estado tem palavra, símbolo e cor, e a cor
 * nunca aparece sozinha. Os papéis seguem o sistema da Iris:
 * - ciano: ligação com evidência; aqui, o que FAVORECE ou REFORÇA (o mesmo "fortalece" dos sinais);
 * - âmbar: incerteza e atenção; aqui, o que EXIGE REVISÃO ou INVESTIGAÇÃO adicional;
 * - negativo (coral): CONTRADIÇÃO de premissa e risco analítico, além de erro real do sistema;
 * - textos neutros: enfraquece (texto-2), ambíguo (texto-2), neutro e obsoleta (texto-3).
 * O ouro não entra aqui: é estrutura (núcleo dos cenários, versão atual), não julgamento.
 */
import type { Efeito } from "../types/cenario";
import type { EfeitoNaPremissa, ImpactoNoCenario, TipoDeAcontecimento, TipoDeMudanca, Tendencia } from "../types/monitoramento";
import type { Mudanca } from "../types/relacao";

export interface Estado {
  rotulo: string;
  /** Símbolo curto em texto (lido junto com o rótulo; nunca é a única pista). */
  simbolo: string;
  /** Classe de cor do texto. */
  cor: string;
  /** Classe da borda/fundo da etiqueta. */
  fundo: string;
  descricao: string;
}

export const IMPACTO: Record<ImpactoNoCenario, Estado> = {
  favorece: { rotulo: "Favorece", simbolo: "+", cor: "text-ciano-texto", fundo: "border-ciano/40 bg-ciano-suave", descricao: "O acontecimento torna a trajetória mais plausível, pelos motivos indicados." },
  enfraquece: { rotulo: "Enfraquece", simbolo: "−", cor: "text-texto-2", fundo: "border-linha-forte bg-grafite/50", descricao: "O acontecimento torna a trajetória menos plausível." },
  neutro: { rotulo: "Neutro", simbolo: "=", cor: "text-texto-3", fundo: "border-linha bg-transparent", descricao: "Sem efeito identificável sobre esta trajetória." },
  ambiguo: { rotulo: "Ambíguo", simbolo: "±", cor: "text-texto-2", fundo: "border-dashed border-linha-forte bg-transparent", descricao: "Pode ser lido nos dois sentidos; a leitura depende de fatos ainda não observados." },
  investigar: { rotulo: "Exige investigação", simbolo: "?", cor: "text-ambar", fundo: "border-ambar/45 bg-ambar-suave", descricao: "Não dá para classificar sem pesquisa adicional." },
};

export const EFEITO_NA_PREMISSA: Record<EfeitoNaPremissa, Estado> = {
  reforca: { rotulo: "Reforçada", simbolo: "+", cor: "text-ciano-texto", fundo: "border-ciano/40 bg-ciano-suave", descricao: "Nova evidência sustenta a premissa." },
  enfraquece: { rotulo: "Enfraquecida", simbolo: "−", cor: "text-texto-2", fundo: "border-linha-forte bg-grafite/50", descricao: "Nova evidência reduz o apoio à premissa." },
  contradiz: { rotulo: "Contradita", simbolo: "×", cor: "text-negativo", fundo: "border-negativo/45 bg-negativo-suave", descricao: "Nova evidência vai contra a premissa." },
  obsoleta: { rotulo: "Obsoleta", simbolo: "∅", cor: "text-texto-3 line-through", fundo: "border-linha bg-transparent", descricao: "A premissa deixou de se aplicar." },
  revisar: { rotulo: "Exige revisão", simbolo: "!", cor: "text-ambar", fundo: "border-ambar/45 bg-ambar-suave", descricao: "A premissa precisa ser reavaliada antes de seguir valendo." },
};

export const SEM_REVISAO: Estado = {
  rotulo: "Sem revisão registrada",
  simbolo: "·",
  cor: "text-texto-3",
  fundo: "border-linha bg-transparent",
  descricao: "Nenhuma evidência nova foi relacionada a esta premissa desde a versão atual.",
};

export const TIPO_DE_MUDANCA: Record<TipoDeMudanca, { rotulo: string; descricao: string }> = {
  criacao: { rotulo: "Criação", descricao: "Primeira versão da investigação." },
  "nova-evidencia": { rotulo: "Nova evidência", descricao: "Um fato ou documento novo foi incorporado; a interpretação pode não ter mudado." },
  "nova-interpretacao": { rotulo: "Nova interpretação", descricao: "A leitura estratégica mudou." },
  "revisao-premissa": { rotulo: "Revisão de premissa", descricao: "Uma premissa de um cenário foi alterada." },
  "revisao-cenario": { rotulo: "Revisão de cenário", descricao: "Um cenário foi reescrito; a versão anterior fica preservada." },
};

export const TIPO_DE_ACONTECIMENTO: Record<TipoDeAcontecimento, string> = {
  noticia: "Notícia",
  documento: "Documento",
  declaracao: "Declaração diplomática",
  dado: "Dado",
  outro: "Acontecimento",
};

export const TENDENCIA: Record<Tendencia, string> = {
  alta: "Em alta",
  queda: "Em queda",
  estavel: "Estável",
  inconclusiva: "Inconclusiva",
};

/**
 * O que um cenário faz com uma relação entre atores (Análise do Cenário, parte 4). Mesma gramática dos estados acima:
 * o que surge ou se fortalece é ciano (conexão); o que muda de natureza é âmbar (exige atenção); o que perde força ou
 * desaparece fica neutro. Vermelho não entra: nenhuma destas mudanças é erro.
 */
export const MUDANCA_NA_RELACAO: Record<Mudanca, Estado> = {
  nova: { rotulo: "Nova", simbolo: "+", cor: "text-ciano-texto", fundo: "border-ciano/40 bg-ciano-suave", descricao: "Relação que não existe hoje e surge neste cenário." },
  reforcada: { rotulo: "Reforçada", simbolo: "↑", cor: "text-ciano-texto", fundo: "border-ciano/40 bg-ciano-suave", descricao: "Relação que já existe e se fortalece neste cenário." },
  transformada: { rotulo: "Transformada", simbolo: "↻", cor: "text-ambar", fundo: "border-ambar/45 bg-ambar-suave", descricao: "Relação que muda de natureza neste cenário." },
  enfraquecida: { rotulo: "Enfraquecida", simbolo: "−", cor: "text-texto-2", fundo: "border-linha-forte bg-grafite/50", descricao: "Relação que perde força neste cenário." },
  ausente: { rotulo: "Ausente", simbolo: "∅", cor: "text-texto-3", fundo: "border-linha bg-transparent", descricao: "Relação que deixa de existir ou não chega a se formar neste cenário." },
  mantida: { rotulo: "Mantida", simbolo: "=", cor: "text-texto-3", fundo: "border-linha bg-transparent", descricao: "Relação que segue como no presente." },
};

/** Ordem de leitura das mudanças: o que surge, o que se fortalece, o que se transforma, o que perde força, o que some. */
export const ORDEM_DAS_MUDANCAS: Mudanca[] = ["nova", "reforcada", "transformada", "enfraquecida", "ausente", "mantida"];

/** Efeito de um cenário sobre uma região (Análise do Cenário, parte 5). */
export const EFEITO_NA_REGIAO: Record<Efeito, Estado> = {
  aproximacao: { rotulo: "Aproximação", simbolo: "+", cor: "text-ciano-texto", fundo: "border-ciano/40 bg-ciano-suave", descricao: "As relações com a região se aproximam neste cenário." },
  atrito: { rotulo: "Atrito", simbolo: "!", cor: "text-ambar", fundo: "border-ambar/45 bg-ambar-suave", descricao: "O cenário cria atrito com a região." },
  misto: { rotulo: "Misto", simbolo: "±", cor: "text-texto-2", fundo: "border-dashed border-linha-forte bg-transparent", descricao: "Ganhos e perdas ao mesmo tempo." },
  neutro: { rotulo: "Sem mudança", simbolo: "=", cor: "text-texto-3", fundo: "border-linha bg-transparent", descricao: "Sem efeito identificável sobre a região." },
};
