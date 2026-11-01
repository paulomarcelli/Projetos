/**
 * DEMONSTRAÇÃO DA INTERFACE DE MONITORAMENTO — DADOS FICTÍCIOS.
 *
 * Nada aqui aconteceu. Estes itens existem só para mostrar como a seção 04 apresenta acontecimentos, impactos,
 * revisões de premissas, observações de indicadores e versões quando o servidor de monitoramento existir. Por isso:
 * - só aparecem na prévia e em desenvolvimento, quando a pessoa pede ("Ver com dados fictícios");
 * - cada item leva "Fictício" na tela, e a seção mostra um aviso enquanto a demonstração estiver ligada;
 * - nenhum item cita pessoa nem fonte real: os acontecimentos são genéricos, sobre os próprios indicadores.
 * Os ids de cenários (A, B, C), sinais e premissas são os do exemplo (previa/investigacao-exemplo.ts).
 */
import type { Monitoramento } from "../types/monitoramento";

export const MONITORAMENTO_DEMONSTRACAO: Monitoramento = {
  demonstracao: true,
  verificadoEm: "dia de exemplo",
  acontecimentos: [
    {
      id: "demo-1",
      data: "exemplo · semana 1",
      titulo: "Fictício: anúncio de revisão parcial das sobretaxas sobre produtos agrícolas",
      descricao: "Acontecimento inventado para a demonstração: um anúncio de revisão de parte das tarifas, sem calendário definido.",
      tipo: "declaracao",
      fontes: [],
      relacao: { tipo: "inferencia", texto: "Toca o indicador das sobretaxas, que separa os cenários de aproximação e de afastamento com os EUA." },
      impactos: [
        { cenario: "A", impacto: "favorece", justificativa: { tipo: "inferencia", texto: "Uma revisão de tarifas é o movimento que a trajetória A pressupõe." } },
        { cenario: "B", impacto: "ambiguo", justificativa: { tipo: "inferencia", texto: "Pode ser lida como aproximação ou como concessão isolada, sem alinhamento." } },
        { cenario: "C", impacto: "neutro", justificativa: { tipo: "inferencia", texto: "Não altera a dinâmica institucional interna que define C." } },
      ],
    },
    {
      id: "demo-2",
      data: "exemplo · semana 2",
      titulo: "Fictício: queda na participação de um comprador nas exportações de soja",
      descricao: "Dado inventado: a participação de um grande comprador cai alguns pontos num trimestre.",
      tipo: "dado",
      fontes: [],
      relacao: { tipo: "inferencia", texto: "Relaciona-se ao indicador de compras de soja, sensível ao custo de um alinhamento exclusivo." },
      impactos: [
        { cenario: "A", impacto: "enfraquece", justificativa: { tipo: "inferencia", texto: "A trajetória A supõe manter o comprador; a queda vai contra, se persistir." } },
        { cenario: "B", impacto: "investigar", justificativa: { tipo: "incerteza", texto: "Um trimestre não basta: pode ser sazonal. Exige série mais longa." } },
        { cenario: "C", impacto: "neutro", justificativa: { tipo: "inferencia", texto: "Sem relação direta com a crise institucional." } },
      ],
      incorporadoNaVersao: 3,
    },
  ],
  revisoesDePremissas: [
    {
      cenario: "A",
      premissa: 0,
      efeito: "reforca",
      justificativa: { tipo: "inferencia", texto: "Fictício: o anúncio de revisão de tarifas (semana 1) sustenta esta premissa." },
      acontecimento: "demo-1",
      versao: 3,
      data: "exemplo · semana 2",
    },
    {
      cenario: "A",
      premissa: 1,
      efeito: "revisar",
      justificativa: { tipo: "incerteza", texto: "Fictício: a queda nas compras (semana 2) pede reavaliar se o comprador seguiria estável." },
      acontecimento: "demo-2",
      versao: 3,
      data: "exemplo · semana 2",
    },
    {
      cenario: "B",
      premissa: 2,
      efeito: "contradiz",
      justificativa: { tipo: "inferencia", texto: "Fictício: exemplo de como uma contradição aparece; não se refere a nenhum fato." },
      versao: 3,
      data: "exemplo · semana 2",
    },
  ],
  observacoes: [
    { sinal: "s-tarifas", data: "exemplo · semana 1", texto: "Fictício: anúncio de revisão parcial, sem data.", tendencia: "inconclusiva" },
    { sinal: "s-soja", data: "exemplo · semana 2", texto: "Fictício: participação caiu num trimestre.", tendencia: "queda" },
  ],
  historico: [
    { id: "h-demo-1", versao: 3, data: "exemplo · semana 2", tipo: "nova-evidencia", texto: "Fictício: incorporado o dado de compras de soja; a interpretação não mudou.", acontecimentos: ["demo-2"] },
    { id: "h-demo-2", versao: 3, data: "exemplo · semana 2", tipo: "revisao-premissa", cenario: "A", texto: "Fictício: a premissa 2 do cenário A passou a exigir revisão.", acontecimentos: ["demo-2"] },
    { id: "h-demo-3", versao: 3, data: "exemplo · semana 2", tipo: "nova-interpretacao", texto: "Fictício: exemplo de mudança na leitura estratégica, registrada à parte da evidência que a motivou." },
    { id: "h-demo-4", versao: 3, data: "exemplo · semana 2", tipo: "revisao-cenario", cenario: "B", texto: "Fictício: o cenário B foi reescrito; a versão anterior fica preservada e pode ser consultada." },
  ],
  versoesAnteriores: [
    {
      cenario: "B",
      versao: 2,
      data: "27 out. 2026",
      nome: "Alinhamento hemisférico",
      ideia: "Fictício: retrato da versão anterior, preservado para comparação.",
      premissas: [],
    },
  ],
};
