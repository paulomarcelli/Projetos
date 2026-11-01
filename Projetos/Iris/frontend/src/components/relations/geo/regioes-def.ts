/** Regiões geopolíticas usadas para definir o escopo de uma investigação. */
export type RegiaoId =
  | "america-norte"
  | "america-sul"
  | "europa"
  | "eurasia"
  | "mena"
  | "africa"
  | "asia-sul"
  | "asia-pacifico";

export const REGIOES: { id: RegiaoId; nome: string }[] = [
  { id: "america-norte", nome: "América do Norte, Central e Caribe" },
  { id: "america-sul", nome: "América do Sul" },
  { id: "europa", nome: "Europa" },
  { id: "eurasia", nome: "Rússia e Ásia Central" },
  { id: "mena", nome: "Oriente Médio e Norte da África" },
  { id: "africa", nome: "África Subsaariana" },
  { id: "asia-sul", nome: "Sul da Ásia" },
  { id: "asia-pacifico", nome: "Ásia-Pacífico e Oceania" },
];

export const NOME_REGIAO = Object.fromEntries(REGIOES.map((r) => [r.id, r.nome])) as Record<RegiaoId, string>;
