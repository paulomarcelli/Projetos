/** Etapas do método do Iris e o estado real de cada uma no projeto. */

/** As etapas são uma sequência real: cada uma depende da anterior. */
export type EstadoEtapa = "disponivel" | "proxima" | "planejada";

/**
 * O fluxo da prospectiva estratégica. O estado diz o que o MOTOR do Iris já faz; a interface de
 * resultados já segue este fluxo (com um exemplo ilustrativo na prévia).
 */
export const METODO: { titulo: string; texto: string; estado: EstadoEtapa }[] = [
  { titulo: "Pergunta prospectiva", texto: "Uma questão sobre a ordem internacional, com horizonte, escopo geográfico e dimensões de análise.", estado: "disponivel" },
  { titulo: "Evidências", texto: "Busca híbrida (semântica e por palavras) na base científica, com cada trecho ligado ao documento e à página.", estado: "proxima" },
  { titulo: "Sistema", texto: "Atores e relações extraídos das fontes, em um mapa em que cada ligação mostra a evidência que a sustenta.", estado: "planejada" },
  { titulo: "Fatores de mudança", texto: "Tendências, variáveis-chave, mecanismos e incertezas críticas.", estado: "planejada" },
  { titulo: "Cenários", texto: "Futuros alternativos construídos a partir das incertezas, com premissas, condições e evidências contrárias.", estado: "planejada" },
  { titulo: "Indicadores e revisão", texto: "Sinais observáveis que reforçam ou enfraquecem cada cenário, e o registro das revisões.", estado: "planejada" },
];

export const ESTADO_ETAPA = {
  disponivel: "Disponível",
  proxima: "Próxima fase",
  planejada: "Planejada",
};


