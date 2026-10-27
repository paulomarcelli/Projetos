/**
 * API da PRÉVIA ESTÁTICA (build `--mode previa`). Serve uma cópia dos documentos de exemplo
 * exportada da API real (snapshot.json). Envio e remoção ficam desativados.
 * Nunca entra no build normal: só é importada dentro de `if (PREVIA)`.
 */
import type { DocumentoDetalhe, DocumentoResumo, Paginado, PaginaDeTexto, Prontidao, StatusDocumento } from "../lib/api";
import { ErroApi } from "../lib/api";
import snapshot from "./snapshot.json";

const dados = snapshot as unknown as {
  documentos: DocumentoResumo[];
  detalhes: Record<string, DocumentoDetalhe>;
  paginas: Record<string, PaginaDeTexto[]>;
};

export function listar(opcoes: { limit?: number; offset?: number; status?: StatusDocumento }): Paginado<DocumentoResumo> {
  const itens = opcoes.status ? dados.documentos.filter((d) => d.status === opcoes.status) : dados.documentos;
  const limit = opcoes.limit ?? 20;
  const offset = opcoes.offset ?? 0;
  return { items: itens.slice(offset, offset + limit), total: itens.length, limit, offset };
}

export function obter(id: string): DocumentoDetalhe {
  const d = dados.detalhes[id];
  if (!d) throw new ErroApi(404, "not_found", "Documento não encontrado.");
  return d;
}

export function paginas(id: string, opcoes: { limit?: number; offset?: number; incluirBruto?: boolean }): Paginado<PaginaDeTexto> {
  obter(id);
  const todas = dados.paginas[id] ?? [];
  const limit = opcoes.limit ?? 20;
  const offset = opcoes.offset ?? 0;
  const items = todas.slice(offset, offset + limit).map((p) => (opcoes.incluirBruto ? p : { ...p, text_raw: null }));
  return { items, total: todas.length, limit, offset };
}

export function prontidao(): Prontidao {
  return { status: "not_ready", checks: { database: "previa", pgvector: "previa" }, optional: { llm: "previa" } };
}

export function desativado(): never {
  throw new ErroApi(0, "previa", "Esta é uma prévia estática: enviar e remover documentos está desativado.");
}
