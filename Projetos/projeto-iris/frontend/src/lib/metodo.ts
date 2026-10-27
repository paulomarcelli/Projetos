/** Etapas do método do Iris e o estado real de cada uma no projeto. */

/** As etapas são uma sequência real: cada uma depende da anterior. */
export type EstadoEtapa = "disponivel" | "proxima" | "planejada";

export const METODO: { titulo: string; texto: string; estado: EstadoEtapa }[] = [
  { titulo: "Pergunta", texto: "Uma questão sobre a ordem internacional, com horizonte, escopo geográfico e dimensões de análise.", estado: "disponivel" },
  { titulo: "Evidências", texto: "Busca híbrida (semântica e por palavras) na base científica, com cada trecho ligado ao documento e à página.", estado: "proxima" },
  { titulo: "Relações", texto: "Atores e relações extraídos das fontes, em um grafo em que cada ligação mostra a evidência que a sustenta.", estado: "planejada" },
  { titulo: "Cenários", texto: "Trajetórias alternativas e condicionais, com premissas, variáveis críticas, consequências e incertezas.", estado: "planejada" },
  { titulo: "Sinais", texto: "Indícios observáveis que fortalecem ou enfraquecem cada trajetória ao longo do tempo.", estado: "planejada" },
];

export const ESTADO_ETAPA = {
  disponivel: "Disponível",
  proxima: "Próxima fase",
  planejada: "Planejada",
};


