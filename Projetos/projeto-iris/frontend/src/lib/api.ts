/**
 * Cliente tipado da API do Projeto Iris. Os tipos espelham `app/documents/schemas.py`.
 *
 * Só existem, no backend atual: saúde (`/health`, `/health/ready`) e documentos
 * (`/documents`...). Investigações, cenários, sinais e relações ainda não têm API — as telas
 * correspondentes mostram estados vazios em vez de dados simulados.
 */

import { fixtureDocumento, fixtureLista, fixturePaginas, modoDados } from "../dev/fixtures";

export type StatusDocumento = "pending" | "processing" | "completed" | "failed";
export type StatusPagina = "ok" | "empty" | "error";

export interface DocumentoResumo {
  id: string;
  status: StatusDocumento;
  original_filename: string;
  size_bytes: number;
  sha256: string;
  page_count: number | null;
  text_extractable: boolean | null;
  title: string | null;
  authors: string[] | null;
  publication_year: number | null;
  language: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface DocumentoDetalhe extends DocumentoResumo {
  mime_type: string;
  journal: string | null;
  publisher: string | null;
  institution: string | null;
  doi: string | null;
  source_url: string | null;
  metadata_sources: Record<string, string>;
  pdf_metadata: Record<string, string> | null;
  warnings: string[];
  error: { code: string; message: string | null } | null;
  updated_at: string;
}

export interface RespostaUpload extends DocumentoDetalhe {
  duplicate: boolean;
}

export interface Paginado<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface PaginaDeTexto {
  page_number: number;
  text: string;
  text_raw: string | null;
  char_count: number;
  has_text: boolean;
  extraction_status: StatusPagina;
  extraction_error: string | null;
  text_sha256: string | null;
  extractor: string;
  normalization_version: string;
  extracted_at: string;
}

export interface Prontidao {
  status: "ready" | "not_ready";
  checks: Record<string, string>;
  optional?: Record<string, string>;
}

export interface MetadadosUpload {
  title?: string;
  authors?: string;
  publication_year?: string;
  journal?: string;
  publisher?: string;
  institution?: string;
  doi?: string;
  source_url?: string;
  language?: string;
}

const BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";

export class ErroApi extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = "ErroApi";
  }
}

const SEM_CONEXAO =
  "Não foi possível falar com a API. Confira se o servidor está em execução e tente de novo.";

function mensagemPadrao(status: number): string {
  if (status === 404) return "Não encontrado.";
  if (status >= 500) return "O servidor não conseguiu concluir a operação.";
  return "A requisição não pôde ser concluída.";
}

function erroDoCorpo(status: number, corpo: unknown): ErroApi {
  // A API sempre responde erros em JSON. Um 5xx sem JSON vem de um proxy ou gateway:
  // a API em si não está acessível.
  if (corpo === null && status >= 500) return new ErroApi(0, "offline", SEM_CONEXAO);
  const c = (corpo ?? {}) as { detail?: unknown; code?: unknown };
  const mensagem = typeof c.detail === "string" ? c.detail : mensagemPadrao(status);
  const codigo = typeof c.code === "string" ? c.code : `http_${status}`;
  return new ErroApi(status, codigo, mensagem);
}

async function pedir<T>(caminho: string, init?: RequestInit): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(BASE + caminho, { headers: { Accept: "application/json" }, ...init });
  } catch {
    throw new ErroApi(0, "offline", SEM_CONEXAO);
  }
  if (resposta.status === 204) return undefined as T;
  let corpo: unknown = null;
  try {
    corpo = await resposta.json();
  } catch {
    corpo = null;
  }
  if (!resposta.ok) throw erroDoCorpo(resposta.status, corpo);
  return corpo as T;
}

// ------------------------------------------------------------------ saúde

/** `/health/ready` responde 503 com corpo válido quando algo falta: os dois casos são dados. */
export async function prontidao(): Promise<Prontidao> {
  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}/health/ready`, { headers: { Accept: "application/json" } });
  } catch {
    throw new ErroApi(0, "offline", SEM_CONEXAO);
  }
  try {
    return (await resposta.json()) as Prontidao;
  } catch {
    throw new ErroApi(resposta.status, "resposta_invalida", mensagemPadrao(resposta.status));
  }
}

// ------------------------------------------------------------------ documentos

export async function listarDocumentos(
  opcoes: { limit?: number; offset?: number; status?: StatusDocumento } = {},
): Promise<Paginado<DocumentoResumo>> {
  const modo = modoDados();
  if (import.meta.env.DEV && modo !== "api") return fixtureLista(modo, opcoes);
  const q = new URLSearchParams();
  q.set("limit", String(opcoes.limit ?? 20));
  q.set("offset", String(opcoes.offset ?? 0));
  if (opcoes.status) q.set("status", opcoes.status);
  return pedir(`/documents?${q}`);
}

export async function obterDocumento(id: string): Promise<DocumentoDetalhe> {
  const modo = modoDados();
  if (import.meta.env.DEV && modo !== "api") return fixtureDocumento(modo, id);
  return pedir(`/documents/${encodeURIComponent(id)}`);
}

export async function listarPaginas(
  id: string,
  opcoes: { limit?: number; offset?: number; incluirBruto?: boolean } = {},
): Promise<Paginado<PaginaDeTexto>> {
  const modo = modoDados();
  if (import.meta.env.DEV && modo !== "api") return fixturePaginas(modo, id, opcoes);
  const q = new URLSearchParams({
    limit: String(opcoes.limit ?? 20),
    offset: String(opcoes.offset ?? 0),
  });
  if (opcoes.incluirBruto) q.set("include_raw", "true");
  return pedir(`/documents/${encodeURIComponent(id)}/pages?${q}`);
}

export async function removerDocumento(id: string): Promise<void> {
  if (import.meta.env.DEV && modoDados() !== "api") return;
  await pedir<void>(`/documents/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/**
 * Envia um PDF. Usa XMLHttpRequest só para poder mostrar o progresso real do envio
 * (o fetch ainda não informa progresso de upload em todos os navegadores).
 */
export function enviarDocumento(
  arquivo: File,
  metadados: MetadadosUpload,
  aoProgredir?: (fracao: number) => void,
  sinal?: AbortSignal,
): Promise<RespostaUpload> {
  return new Promise((resolver, rejeitar) => {
    const formulario = new FormData();
    formulario.append("file", arquivo, arquivo.name);
    for (const [campo, valor] of Object.entries(metadados)) {
      if (typeof valor === "string" && valor.trim()) formulario.append(campo, valor.trim());
    }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}/documents/upload`);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && aoProgredir) aoProgredir(e.loaded / e.total);
    };
    xhr.onload = () => {
      let corpo: unknown = null;
      try {
        corpo = JSON.parse(xhr.responseText);
      } catch {
        corpo = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) resolver(corpo as RespostaUpload);
      else rejeitar(erroDoCorpo(xhr.status, corpo));
    };
    xhr.onerror = () => rejeitar(new ErroApi(0, "offline", SEM_CONEXAO));
    xhr.onabort = () => rejeitar(new ErroApi(0, "cancelado", "Envio cancelado."));
    sinal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(formulario);
  });
}

// ------------------------------------------------------------------ base científica

export interface ResumoDaBase {
  total: number;
  porStatus: Record<StatusDocumento, number>;
  /** Até 100 documentos mais recentes, para os cálculos que precisam dos itens. */
  amostra: DocumentoResumo[];
  amostraCompleta: boolean;
}

const STATUS: StatusDocumento[] = ["pending", "processing", "completed", "failed"];

/** Contagens vêm do banco (campo `total`), nunca estimadas. */
export async function resumoDaBase(): Promise<ResumoDaBase> {
  const [lista, ...porStatus] = await Promise.all([
    listarDocumentos({ limit: 100 }),
    ...STATUS.map((s) => listarDocumentos({ limit: 1, status: s })),
  ]);
  return {
    total: lista.total,
    porStatus: Object.fromEntries(STATUS.map((s, i) => [s, porStatus[i].total])) as Record<
      StatusDocumento,
      number
    >,
    amostra: lista.items,
    amostraCompleta: lista.items.length >= lista.total,
  };
}
