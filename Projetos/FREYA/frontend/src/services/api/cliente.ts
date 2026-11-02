/**
 * Cliente HTTP único da camada de serviços. Ninguém mais chama `fetch`.
 *
 * Endereço: `VITE_FREYA_API` em produção; `/api` em desenvolvimento (o Vite repassa para a API local).
 * Toda falha vira `ErroDaApi`:
 * - rede, servidor desligado ou tempo esgotado → `indisponivel`;
 * - 404 → `nao_encontrado` (405/501 → `nao_implementado`, endpoint inexistente);
 * - 422 → `invalido`, com a mensagem do backend (a validação do FastAPI vira texto em português);
 * - 409 → `conflito`;
 * - 5xx ou resposta inesperada → `servidor`.
 */
import { ErroDaApi } from "./erros";

/** Tempo máximo de uma requisição (ms). */
export const TEMPO_LIMITE = 20_000;

let baseSobrescrita: string | null = null;

/** Troca o endereço da API (testes de integração apontam direto para http://127.0.0.1:8000). `null` volta ao padrão. */
export function definirBaseDaApi(base: string | null): void {
  baseSobrescrita = base;
}

export function baseDaApi(): string {
  const base = baseSobrescrita ?? (import.meta.env.VITE_FREYA_API as string | undefined) ?? "/api";
  return base.replace(/\/+$/, "");
}

type Valor = string | number | boolean | null | undefined;

export interface OpcoesDaRequisicao {
  metodo?: "GET" | "POST" | "PUT" | "DELETE";
  corpo?: unknown;
  /** parâmetros de consulta; `undefined` e `null` ficam de fora */
  consulta?: Record<string, Valor>;
  sinal?: AbortSignal;
  /** ms; padrão TEMPO_LIMITE */
  tempoLimite?: number;
}

/** Monta `/caminho?a=1&b=2` com cada valor codificado. Os segmentos do caminho o chamador codifica com `segmento()`. */
export function montarUrl(caminho: string, consulta?: Record<string, Valor>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(consulta ?? {})) {
    if (v !== undefined && v !== null) params.append(k, String(v));
  }
  const qs = params.toString();
  return `${baseDaApi()}${caminho}${qs ? `?${qs}` : ""}`;
}

/** Codifica um segmento do caminho (ids vêm da API, mas nunca confiamos neles para montar URL). */
export function segmento(valor: string): string {
  return encodeURIComponent(valor);
}

const NOMES_DE_CAMPO: Record<string, string> = { questao: "questão", horizonte: "horizonte", limite: "limite", no: "nó" };

interface ErroDeValidacao {
  loc?: (string | number)[];
  msg?: string;
  type?: string;
  ctx?: Record<string, unknown>;
}

function descreverValidacao(e: ErroDeValidacao): string {
  const campo = [...(e.loc ?? [])].reverse().find((p): p is string => typeof p === "string" && !["body", "query", "path"].includes(p));
  const nome = campo ? (NOMES_DE_CAMPO[campo] ?? campo) : null;
  const ctx = e.ctx ?? {};
  let o: string;
  switch (e.type) {
    case "missing":
      o = "é obrigatório";
      break;
    case "string_too_short":
      o = `precisa ter pelo menos ${ctx.min_length} caracteres`;
      break;
    case "string_too_long":
      o = `pode ter no máximo ${ctx.max_length} caracteres`;
      break;
    case "greater_than_equal":
      o = `precisa ser no mínimo ${ctx.ge}`;
      break;
    case "less_than_equal":
      o = `precisa ser no máximo ${ctx.le}`;
      break;
    case "string_type":
      o = "precisa ser um texto";
      break;
    case "int_parsing":
    case "int_type":
      o = "precisa ser um número inteiro";
      break;
    case "bool_parsing":
    case "bool_type":
      o = "precisa ser verdadeiro ou falso";
      break;
    case "json_invalid":
    case "model_attributes_type":
      return "O pedido enviado não é um JSON válido.";
    default:
      o = "tem um valor inválido";
  }
  return nome ? `O campo "${nome}" ${o}.` : `Um valor do pedido ${o}.`;
}

/** Texto legível a partir do `detail` do FastAPI (string, lista de erros de validação ou objeto). */
export function mensagemDoDetalhe(detalhe: unknown): string | null {
  if (typeof detalhe === "string") return detalhe;
  if (Array.isArray(detalhe)) {
    const partes = detalhe.map((e) => (e && typeof e === "object" ? descreverValidacao(e as ErroDeValidacao) : String(e)));
    return [...new Set(partes)].join(" ") || null;
  }
  return null;
}

const PADRAO: Record<string, string> = {
  nao_encontrado: "Não encontrado.",
  invalido: "O pedido não é válido.",
  conflito: "A operação não pode ser feita agora.",
  nao_implementado: "A API ainda não oferece esta operação.",
  servidor: "A API respondeu com um erro.",
};

function erroDoStatus(status: number, detalhe: string | null): ErroDaApi {
  // "Not Found" (em inglês) é a resposta padrão do Starlette para uma rota que não existe; as 404 da F.R.E.Y.A.
  // (investigação, nó ou evidência) vêm em português. Rota inexistente = API mais antiga que esta interface.
  if (status === 404 && detalhe === "Not Found") return new ErroDaApi("nao_implementado", PADRAO.nao_implementado, status);
  if (status === 405 || status === 501) return new ErroDaApi("nao_implementado", PADRAO.nao_implementado, status);
  if (status === 404) return new ErroDaApi("nao_encontrado", detalhe ?? PADRAO.nao_encontrado, status);
  if (status === 422 || status === 400) return new ErroDaApi("invalido", detalhe ?? PADRAO.invalido, status);
  if (status === 409) return new ErroDaApi("conflito", detalhe ?? PADRAO.conflito, status);
  if (status === 502 || status === 503 || status === 504)
    // o proxy do Vite (ou um balanceador) responde assim quando a API está desligada
    return new ErroDaApi("indisponivel", "A API da F.R.E.Y.A. não está respondendo.", status);
  return new ErroDaApi("servidor", detalhe ?? `${PADRAO.servidor} (HTTP ${status})`, status);
}

/** Junta o sinal do chamador ao do tempo limite. */
function combinarSinais(sinais: (AbortSignal | undefined)[]): { sinal: AbortSignal; soltar: () => void } {
  const controle = new AbortController();
  const ouvintes: (() => void)[] = [];
  for (const s of sinais) {
    if (!s) continue;
    if (s.aborted) {
      controle.abort(s.reason);
      break;
    }
    const f = () => controle.abort(s.reason);
    s.addEventListener("abort", f, { once: true });
    ouvintes.push(() => s.removeEventListener("abort", f));
  }
  return { sinal: controle.signal, soltar: () => ouvintes.forEach((f) => f()) };
}

function cancelamento(): DOMException {
  return new DOMException("A requisição foi cancelada.", "AbortError");
}

/** É um cancelamento pedido pelo chamador (não um erro a mostrar)? */
export function foiCancelado(e: unknown): boolean {
  return e instanceof DOMException && e.name === "AbortError";
}

/**
 * Faz a requisição e devolve o JSON (ou `undefined` em 204).
 * Cancelada pelo `sinal` do chamador, rejeita com `DOMException` "AbortError" (use `foiCancelado`), não com ErroDaApi.
 */
export async function requisitar<T>(caminho: string, opcoes: OpcoesDaRequisicao = {}): Promise<T> {
  const { metodo = "GET", corpo, consulta, sinal, tempoLimite = TEMPO_LIMITE } = opcoes;
  if (sinal?.aborted) throw cancelamento();
  const relogio = new AbortController();
  let esgotou = false;
  const t = setTimeout(() => {
    esgotou = true;
    relogio.abort();
  }, tempoLimite);
  const { sinal: combinado, soltar } = combinarSinais([sinal, relogio.signal]);

  let resposta: Response;
  try {
    resposta = await fetch(montarUrl(caminho, consulta), {
      method: metodo,
      headers: corpo !== undefined ? { "Content-Type": "application/json", Accept: "application/json" } : { Accept: "application/json" },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: combinado,
    });
  } catch (e) {
    if (esgotou) throw new ErroDaApi("indisponivel", "A API da F.R.E.Y.A. demorou demais para responder.");
    if (sinal?.aborted) throw cancelamento();
    throw new ErroDaApi("indisponivel", `A API da F.R.E.Y.A. não está acessível${e instanceof Error && e.message ? ` (${e.message})` : ""}.`);
  } finally {
    clearTimeout(t);
    soltar();
  }

  if (resposta.status === 204) return undefined as T;

  let texto: string;
  try {
    texto = await resposta.text();
  } catch {
    if (sinal?.aborted) throw cancelamento();
    throw new ErroDaApi("indisponivel", "A conexão com a API caiu durante a resposta.", resposta.status);
  }
  let dados: unknown = undefined;
  let jsonValido = true;
  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      jsonValido = false;
    }
  }

  if (!resposta.ok) {
    const detalhe = dados && typeof dados === "object" && "detail" in dados ? mensagemDoDetalhe((dados as { detail: unknown }).detail) : null;
    throw erroDoStatus(resposta.status, detalhe);
  }
  if (!jsonValido) throw new ErroDaApi("servidor", "A API respondeu algo que não é JSON.", resposta.status);
  return dados as T;
}
