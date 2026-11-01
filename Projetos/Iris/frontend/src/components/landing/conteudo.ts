/**
 * Textos da landing num lugar só. Regra: nada de número de marketing nem promessa do que ainda não existe. O que a
 * Iris faz hoje é a interface; o motor de investigação é a próxima fase (config/metodo.ts diz o estado de cada parte).
 */

/** Perguntas que o campo do herói digita sozinho, em sequência. */
export const PERGUNTAS_DIGITADAS = [
  "Como a disputa entre EUA e China pode afetar o comércio do Brasil até 2030?",
  "Que efeitos uma reforma do Conselho de Segurança teria sobre o Sul Global?",
  "O acordo Mercosul–União Europeia muda o peso da América do Sul?",
  "Como a transição energética redistribui poder entre os produtores de petróleo?",
];

/** Atalhos abaixo do campo: viram a pergunta inteira ao clicar. */
export const PERGUNTAS_CURTAS = [
  { rotulo: "Mercosul e UE", pergunta: "O acordo Mercosul–União Europeia muda o peso da América do Sul na economia mundial?" },
  { rotulo: "China na África", pergunta: "Como a presença da China na África altera as alianças do continente até 2030?" },
  { rotulo: "ONU e guerras", pergunta: "O Conselho de Segurança da ONU ainda consegue conter guerras entre grandes potências?" },
];

export const TEMAS = [
  "Geopolítica",
  "Diplomacia",
  "Comércio internacional",
  "Segurança internacional",
  "Organizações multilaterais",
  "Política externa",
  "Geoeconomia",
  "Conflitos",
  "Ordem mundial",
  "Energia e clima",
];

/** As três camadas de toda resposta: o que se sabe, o que se deduz e o que pode acontecer. */
export const CAMADAS = [
  { rotulo: "Fato", titulo: "O que as fontes registram", texto: "Datado e ligado ao documento que o sustenta. É o chão da análise." },
  { rotulo: "Inferência", titulo: "O que se deduz delas", texto: "Uma leitura que vai além do que está escrito, sempre dizendo de quais fatos parte." },
  { rotulo: "Hipótese", titulo: "O que pode acontecer", texto: "Cenários condicionais, nunca previsões. Nenhum futuro recebe probabilidade inventada." },
];

export const CENARIOS = [
  { id: "A", tipo: "Continuidade", texto: "As tendências de hoje seguem o seu curso, com ajustes." },
  { id: "B", tipo: "Transformação", texto: "Uma força em curso reorganiza as relações entre os atores." },
  { id: "C", tipo: "Ruptura", texto: "Um choque quebra o padrão atual." },
] as const;
