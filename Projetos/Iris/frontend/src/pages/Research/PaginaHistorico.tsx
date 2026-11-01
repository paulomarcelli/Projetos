import { useSearchParams } from "react-router";
import { CabecalhoDePagina } from "../../components/layout/CabecalhoDePagina";
import { InvestigacoesRecentes } from "../../components/research/historico/ListaDeInvestigacoes";
import { NovaInvestigacao } from "../../components/research/consulta/NovaInvestigacao";
import { useRascunhos } from "../../hooks/useArmazenamentoLocal";

/**
 * Histórico de análises (lista completa): conversas, investigações e rascunhos. A pergunta nova se faz no Início;
 * aqui só se volta ao trabalho. O formulário aparece apenas ao editar um rascunho (?rascunho=id), no topo.
 */
export function PaginaHistorico() {
  const [params] = useSearchParams();
  const { rascunhos } = useRascunhos();
  const rascunho = rascunhos.find((r) => r.id === params.get("rascunho")) ?? null;
  return (
    <div className="flex flex-col gap-10">
      <CabecalhoDePagina titulo="Histórico de análises">As conversas com a Iris, as análises que você abriu e as perguntas salvas neste navegador.</CabecalhoDePagina>
      {rascunho && <NovaInvestigacao rascunho={rascunho} />}
      <InvestigacoesRecentes />
    </div>
  );
}
