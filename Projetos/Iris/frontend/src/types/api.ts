/** Tipos da API do Projeto Iris. Espelham `app/documents/schemas.py`; saúde e documentos são o que o backend tem hoje. */

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

export interface ResumoDaBase {
  total: number;
  porStatus: Record<StatusDocumento, number>;
  /** Até 100 documentos mais recentes, para os cálculos que precisam dos itens. */
  amostra: DocumentoResumo[];
  amostraCompleta: boolean;
}
