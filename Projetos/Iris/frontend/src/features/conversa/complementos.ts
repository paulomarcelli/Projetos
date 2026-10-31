/**
 * Perguntas complementares: o que a pessoa quer aprofundar e de que parte do resultado a resposta sai.
 *
 * A Iris não reescreve o resultado: cada complemento é uma seleção dos campos que já existem na investigação (ator,
 * consequências por região, incertezas, linha do tempo, sinais). Funções puras, sem nada visual.
 */
import type { Ator } from "../../types/ator";
import type { Cenario, IncertezaCritica } from "../../types/cenario";
import type { EventoTempo, Sinal } from "../../types/evento";
import type { ResultadoDeInvestigacao } from "../../types/investigacao";
import type { Intencao } from "../../types/conversa";

/** Sugestões mostradas depois de cada resposta (e reconhecidas quando digitadas). */
export const SUGESTOES: { intencao: Exclude<Intencao, "livre">; texto: string }[] = [
  { intencao: "brasil", texto: "Como isso afeta o Brasil?" },
  { intencao: "interesses", texto: "Quais são os interesses dos países envolvidos?" },
  { intencao: "alteracoes", texto: "O que poderia alterar esses cenários?" },
  { intencao: "historia", texto: "Como essa situação evoluiu historicamente?" },
  { intencao: "indicadores", texto: "Quais indicadores devemos acompanhar?" },
];

const PADROES: [Exclude<Intencao, "livre">, RegExp][] = [
  ["indicadores", /indicador|sinal|sinais|acompanhar|monitor/i],
  ["historia", /hist[óo]ri|evolu|antecedente|origem|linha do tempo|como chegamos/i],
  ["alteracoes", /alterar|mudar|virar|reverter|ruptura|gatilho|disrupt|o que poderia/i],
  ["interesses", /interess|objetivo|quer(em)?\b|estrat[ée]gi|motiva/i],
  ["brasil", /brasil|brasileir/i],
];

export function detectarIntencao(pergunta: string): Intencao {
  return PADROES.find(([, re]) => re.test(pergunta))?.[0] ?? "livre";
}

export type Complemento =
  | { intencao: "brasil"; ator?: Ator; consequencias: { cenario: Cenario; regiao: string; texto: string }[] }
  | { intencao: "interesses"; atores: Ator[] }
  | { intencao: "alteracoes"; incertezas: IncertezaCritica[]; gatilhos: { cenario: Cenario; itens: string[] }[] }
  | { intencao: "historia"; eventos: EventoTempo[] }
  | { intencao: "indicadores"; sinais: Sinal[] }
  | { intencao: "livre" };

/** Atores com mais relações registradas na investigação: os mais envolvidos, não "os mais importantes". */
export function atoresCentrais(r: ResultadoDeInvestigacao, quantos: number) {
  const n = new Map<string, number>();
  for (const rel of r.relacoes) for (const id of [rel.de, rel.para]) n.set(id, (n.get(id) ?? 0) + 1);
  return [...r.atores].sort((a, b) => (n.get(b.id) ?? 0) - (n.get(a.id) ?? 0)).slice(0, quantos);
}

export function montarComplemento(r: ResultadoDeInvestigacao, intencao: Intencao): Complemento {
  switch (intencao) {
    case "brasil":
      return {
        intencao,
        ator: r.atores.find((a) => a.id === "brasil" || a.iso === "BRA"),
        consequencias: r.cenarios.flatMap((c) =>
          c.consequencias.filter((q) => /brasil/i.test(q.regiao)).map((q) => ({ cenario: c, regiao: q.regiao, texto: q.texto })),
        ),
      };
    case "interesses":
      return { intencao, atores: atoresCentrais(r, 5).filter((a) => a.caracteristicas.length > 0) };
    case "alteracoes":
      return {
        intencao,
        incertezas: r.incertezas,
        gatilhos: r.cenarios.map((c) => ({ cenario: c, itens: [...c.gatilhos, ...c.revisao] })).filter((g) => g.itens.length > 0),
      };
    case "historia":
      return { intencao, eventos: r.linhaDoTempo.filter((e) => e.categoria === "observado").sort((a, b) => a.ano - b.ano) };
    case "indicadores":
      return { intencao, sinais: r.sinais };
    default:
      return { intencao: "livre" };
  }
}
