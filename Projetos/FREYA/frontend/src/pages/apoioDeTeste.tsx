/**
 * Apoio aos testes das páginas (só importado por *.test.tsx): monta o roteador de verdade em memória,
 * com o provedor de preferências, e devolve as respostas reais capturadas da API (fixtures).
 */
import { render } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router";
import { definicaoDasRotas } from "../app/roteador";
import { ProvedorDePreferencias } from "../contexts/Preferencias";
import investigacaoReal from "../test/integracao/fixtures/investigacao-real.json";
import grafoReal from "../test/integracao/fixtures/grafo-real.json";
import investigacaoFora from "../test/integracao/fixtures/investigacao-fora-do-dominio.json";
import grafoFora from "../test/integracao/fixtures/grafo-fora-do-dominio.json";
import expansaoReal from "../test/integracao/fixtures/expansao-real.json";
import caminhoReal from "../test/integracao/fixtures/caminho-real.json";
import type { CaminhosEntreNos, ExpansaoDoGrafo, GrafoDaInvestigacao, Investigacao, ResumoDeInvestigacao } from "../types/api";

/** cópias novas a cada chamada (os testes podem mexer à vontade) */
export const fixtures = {
  investigacao: () => structuredClone(investigacaoReal) as Investigacao,
  grafo: () => structuredClone(grafoReal) as GrafoDaInvestigacao,
  investigacaoFora: () => structuredClone(investigacaoFora) as Investigacao,
  grafoFora: () => structuredClone(grafoFora) as GrafoDaInvestigacao,
  expansao: () => structuredClone(expansaoReal) as ExpansaoDoGrafo,
  caminho: () => structuredClone(caminhoReal) as CaminhosEntreNos,
};

/** O resumo que GET /investigacoes devolveria para uma investigação. */
export function resumoDe(inv: Investigacao, extra: Partial<ResumoDeInvestigacao> = {}): ResumoDeInvestigacao {
  return {
    id: inv.id,
    questao: inv.questao,
    horizonte: inv.horizonte,
    estado: inv.estado,
    erro: inv.erro,
    guardada: inv.guardada,
    cenarios: inv.analise?.cenarios.length ?? 0,
    criada_em: inv.criada_em,
    atualizada_em: inv.atualizada_em,
    ...extra,
  };
}

export function montar(rota: string) {
  const roteador = createMemoryRouter(definicaoDasRotas, { initialEntries: [rota] });
  const r = render(
    <ProvedorDePreferencias>
      <RouterProvider router={roteador} />
    </ProvedorDePreferencias>,
  );
  return { ...r, roteador };
}
