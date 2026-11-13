import { ErroDaApi } from "../services";

export interface MensagemDeErro {
  titulo: string;
  texto: string;
  /** vale a pena oferecer "Tentar de novo"? */
  repetivel: boolean;
}

/** Converte qualquer falha em ErroDaApi (o resto vira `servidor`). */
export function comoErroDaApi(e: unknown): ErroDaApi {
  if (e instanceof ErroDaApi) return e;
  return new ErroDaApi("servidor", e instanceof Error ? e.message : String(e));
}

/**
 * Texto do aviso escolhido pelo tipo do erro (nunca pelo texto em inglês de uma exceção).
 * `oQue` completa as frases: "a análise", "o histórico", "o grafo"…
 */
export function mensagemDoErro(e: unknown, oQue = "os dados"): MensagemDeErro {
  const erro = comoErroDaApi(e);
  switch (erro.tipo) {
    case "indisponivel":
      return {
        titulo: "Não consegui falar com a F.R.E.Y.A.",
        texto: `A API não respondeu, então não carreguei ${oQue}. Confira se ela está rodando e tente de novo.`,
        repetivel: true,
      };
    case "nao_encontrado":
      return {
        titulo: "Análise não encontrada",
        texto: "Ela pode ter sido excluída, ou o endereço está incompleto.",
        repetivel: false,
      };
    case "invalido":
      return { titulo: "O pedido não foi aceito", texto: erro.message, repetivel: false };
    case "conflito":
      return {
        titulo: "Ainda não dá para fazer isso",
        texto: `${erro.message} Espere a análise terminar e tente de novo.`,
        repetivel: true,
      };
    case "nao_implementado":
      return {
        titulo: "Recurso indisponível nesta API",
        texto: "A versão da API em uso ainda não oferece esta operação.",
        repetivel: false,
      };
    default:
      return { titulo: "A API respondeu com um erro", texto: erro.message, repetivel: true };
  }
}
