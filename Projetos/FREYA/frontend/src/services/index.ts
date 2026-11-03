/**
 * Contrato da camada de serviços (Agente 3 implementa; páginas e componentes só importam daqui).
 * Nenhuma função inventa dados: ou devolve o que a API respondeu, ou lança ErroDaApi.
 * Cancelada por um AbortSignal do chamador, uma função rejeita com "AbortError" (use `foiCancelado`), nunca com ErroDaApi.
 */
export { ErroDaApi, type TipoDeErro } from "./api/erros";
export { baseDaApi, definirBaseDaApi, foiCancelado } from "./api/cliente";
export { obterSaude } from "./api/saude";
export {
  criarInvestigacao,
  obterInvestigacao,
  acompanharInvestigacao,
  estaEmAndamento,
  ESTADOS_FINAIS,
  type Acompanhamento,
  type OpcoesDoAcompanhamento,
} from "./investigations/investigacoes";
export { obterGrafo, expandirNo, caminhosEntre, obterEvidencia } from "./graph/grafo";
export { listarInvestigacoes, excluirInvestigacao, guardarInvestigacao, desguardarInvestigacao } from "./history/historico";
