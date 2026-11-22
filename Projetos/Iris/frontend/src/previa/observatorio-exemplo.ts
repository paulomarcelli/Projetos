/**
 * DADOS DE EXEMPLO do Observatório, do editor de documento e do leque da landing (revisão de design de 22/11/2026).
 * Fictícios: equipes, entregas, fontes, registros de IA e datas existem só para mostrar a interface. Os ciclos 2025.2 e
 * 2026.1 vêm do briefing do design. A tela sempre diz "Dados de exemplo" quando mostra isto.
 */
import type { CenarioDoLeque, IncertezaDoLeque } from "../components/analysis/prospectiva/LequeDosFuturos";
import type { Ciclo, Documento, RegistroDeUsoDeIA } from "../types/observatorio";

/** O leque ilustrativo (EUA–China), o mesmo das telas do Figma. */
export const INCERTEZAS_EXEMPLO: IncertezaDoLeque[] = [
  { id: "escalada", nome: "Escalada tarifária EUA–China", polos: ["Contida", "Aberta"] },
  { id: "alinhamento", nome: "Alinhamento com os EUA", polos: ["Limitado", "Pleno"] },
];
export const CENARIOS_EXEMPLO: CenarioDoLeque[] = [
  { id: "A", nome: "Equilíbrio pragmático", posicao: { escalada: 0, alinhamento: 0 } },
  { id: "B", nome: "Alinhamento hemisférico", posicao: { escalada: 0, alinhamento: 1 } },
  { id: "C", nome: "Desacoplamento forçado", posicao: { escalada: 1, alinhamento: null } },
];

export const REGISTROS_EXEMPLO: RegistroDeUsoDeIA[] = [
  {
    id: "ia-2",
    quando: "2026-11-22T10:14",
    pedido: "Redigir parágrafo sobre o cenário B",
    feito: 'Proposta de 1 parágrafo em "Contexto".',
    modelo: "Modelo de linguagem da Iris",
    fontes: [5, 7],
    revisao: { estado: "aguardando" },
  },
  {
    id: "ia-1",
    quando: "2026-11-12T14:32",
    pedido: "Resumir as fontes [3], [5] e [7]",
    feito: 'A IA propôs 2 parágrafos para "Contexto"; 1 aceito com edição, 1 descartado.',
    modelo: "Modelo de linguagem da Iris",
    fontes: [3, 5, 7],
    revisao: { estado: "revisado", por: "Equipe 3", em: "2026-11-12" },
  },
];

export const CICLOS_EXEMPLO: Pick<Ciclo, "id" | "tema">[] = [
  { id: "2025.2", tema: "Avaliação de cenários" },
  { id: "2026.1", tema: "Cenário e risco geopolítico" },
  { id: "2026.2", tema: "Comércio exterior" },
];

export const CICLO_EXEMPLO: Ciclo = {
  id: "2026.2",
  inicio: "2026-08-18",
  fim: "2026-12-12",
  tema: "Comércio exterior",
  marcos: [
    { data: "2026-08-18", tipo: "chamada", rotulo: "Chamada" },
    { data: "2026-09-30", tipo: "revisao-cenario", rotulo: "Cenários v2" },
    { data: "2026-11-12", tipo: "revisao-cenario", rotulo: "Cenários v3" },
    { data: "2026-11-28", tipo: "prazo", rotulo: "Policy briefs" },
    { data: "2026-12-12", tipo: "prazo", rotulo: "Boletim" },
  ],
  entregas: [
    { id: "e1", tipo: "policy-brief", titulo: "O Brasil entre tarifas", equipe: "Equipe 3", base: "parte do cenário B, v3", prazo: "2026-11-28", estado: "revisao", documento: "brasil-entre-tarifas" },
    { id: "e2", tipo: "policy-brief", titulo: "Soja como moeda de troca", equipe: "Equipe 4", base: "parte do cenário C, v2", prazo: "2026-11-28", estado: "andamento" },
    { id: "e3", tipo: "boletim", titulo: "novembro", equipe: "Equipe 1", base: "3 cenários, 9 sinais", prazo: "2026-12-12", estado: "andamento" },
    { id: "e4", tipo: "dossie", titulo: "Portos e capital chinês", equipe: "Equipe 2", base: "entregue em 31/10", prazo: "2026-10-31", estado: "entregue" },
  ],
  cenarios: [
    { investigacao: "exemplo-eua-china", cenario: "A", nome: "Equilíbrio pragmático", versao: 3, proximaRevisao: "2027-02-12" },
    { investigacao: "exemplo-eua-china", cenario: "B", nome: "Alinhamento hemisférico", versao: 3, proximaRevisao: "2027-02-12" },
    { investigacao: "exemplo-eua-china", cenario: "C", nome: "Desacoplamento forçado", versao: 2, proximaRevisao: "2026-11-12" },
  ],
  registros: REGISTROS_EXEMPLO,
};

/** "Hoje" fixo do exemplo, para a linha do semestre não mudar com o relógio de quem abre a prévia. */
export const HOJE_DO_EXEMPLO = "2026-11-22";

export const DOCUMENTO_EXEMPLO: Documento = {
  id: "brasil-entre-tarifas",
  tipo: "policy-brief",
  titulo: "O Brasil entre tarifas: três futuros para o comércio até 2030",
  equipe: "Equipe 3",
  investigacao: "exemplo-eua-china",
  versao: 4,
  cenario: { id: "B", versao: 3 },
  prazo: "2026-11-28",
  secoes: [
    { id: "resumo", titulo: "Resumo executivo", trechos: [] },
    {
      id: "contexto",
      titulo: "Contexto",
      trechos: [
        {
          id: "t1",
          texto: "A China comprou cerca de um terço das exportações brasileiras em 2025, e os EUA seguem como principal destino de manufaturados",
          citacoes: [3],
        },
        {
          id: "t2",
          texto:
            "Se a escalada tarifária entre EUA e China se mantiver contida, o Brasil tende a preservar os dois mercados; a pressão para escolher cresce no cenário B, com o veto a capital chinês em portos",
          citacoes: [7],
          sugerido: { registro: "ia-2" },
        },
      ],
    },
    { id: "cenarios", titulo: "Cenários", trechos: [] },
    { id: "recomendacoes", titulo: "Recomendações", trechos: [] },
  ],
  fontes: [
    { numero: 3, titulo: "Comércio exterior brasileiro: balanço anual 2025", origem: "Órgão oficial de estatística · 02/2026", conferida: true },
    { numero: 5, titulo: "Tarifas recíprocas: nota técnica sobre o comércio Brasil–EUA", origem: "Agência pública · 03/11/2026 · p. 4", conferida: true },
    { numero: 7, titulo: "Leilão de terminais: novas regras para capital estrangeiro", origem: "Jornal de economia · 03/11/2026", conferida: false },
  ],
  registros: REGISTROS_EXEMPLO,
};
