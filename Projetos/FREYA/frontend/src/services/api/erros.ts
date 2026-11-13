/**
 * Erros da camada de serviços. A interface decide a mensagem pelo `tipo`, nunca pelo texto.
 * - indisponivel: a API não respondeu (rede, servidor desligado, tempo esgotado);
 * - nao_encontrado: 404;
 * - invalido: 422 (ex.: questão curta ou longa demais) — `mensagem` vem do backend;
 * - conflito: 409 (ex.: grafo pedido antes de a investigação concluir);
 * - nao_implementado: o backend ainda não tem o endpoint (documentado em docs/FRONTEND.md);
 * - servidor: 5xx ou resposta inesperada.
 */
export type TipoDeErro = "indisponivel" | "nao_encontrado" | "invalido" | "conflito" | "nao_implementado" | "servidor";

export class ErroDaApi extends Error {
  readonly tipo: TipoDeErro;
  readonly status: number | null;
  constructor(tipo: TipoDeErro, mensagem: string, status: number | null = null) {
    super(mensagem);
    this.name = "ErroDaApi";
    this.tipo = tipo;
    this.status = status;
  }
}
