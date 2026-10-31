/**
 * Dados de TESTE DE INTERFACE (break-ui). Só existem em desenvolvimento (`npm run dev`):
 * em produção `modoDados()` devolve sempre "api" e este módulo nunca é usado.
 *
 * Servem para ver a interface com o pior caso realista (títulos longos, nomes compostos,
 * campos ausentes, falhas, 1.284 documentos), vazia ou com um único item. NÃO são análises
 * nem documentos reais e nunca são exibidos fora do alternador de desenvolvimento.
 */

import { ErroApi } from "../services/api";
import { type DocumentoDetalhe, type DocumentoResumo, type Paginado, type PaginaDeTexto, type StatusDocumento } from "../types/api";

export type ModoDados = "api" | "pior" | "vazio" | "um";
const MODOS: ModoDados[] = ["api", "pior", "vazio", "um"];
const CHAVE = "iris:dev:dados";

export function modoDados(): ModoDados {
  if (!import.meta.env.DEV) return "api";
  try {
    const daUrl = new URLSearchParams(window.location.search).get("dados");
    if (daUrl && (MODOS as string[]).includes(daUrl)) {
      window.sessionStorage.setItem(CHAVE, daUrl);
      return daUrl as ModoDados;
    }
    const salvo = window.sessionStorage.getItem(CHAVE);
    if (salvo && (MODOS as string[]).includes(salvo)) return salvo as ModoDados;
  } catch {
    /* sem armazenamento: usa a API */
  }
  return "api";
}

export function definirModoDados(modo: ModoDados): void {
  try {
    window.sessionStorage.setItem(CHAVE, modo);
  } catch {
    /* ignora */
  }
  const url = new URL(window.location.href);
  if (modo === "api") url.searchParams.delete("dados");
  else url.searchParams.set("dados", modo);
  window.location.assign(url.toString());
}

const AGORA = Date.now();
const horasAtras = (h: number) => new Date(AGORA - h * 3600_000).toISOString();

function base(
  i: number,
  parcial: Partial<DocumentoResumo> & { status: StatusDocumento },
): DocumentoResumo {
  return {
    id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    original_filename: `documento-${i}.pdf`,
    size_bytes: 1_048_576 + i * 7919,
    sha256: `${"9f8e7d6c5b4a3928".repeat(3)}${String(i).padStart(16, "0")}`,
    page_count: 12,
    text_extractable: true,
    title: null,
    authors: null,
    publication_year: null,
    language: null,
    created_at: horasAtras(i * 5),
    processed_at: horasAtras(i * 5),
    ...parcial,
  };
}

const piorCaso = (): DocumentoResumo[] => [
  base(1, {
    status: "completed",
    title:
      "A política externa brasileira entre o multilateralismo e a autonomia estratégica: continuidades, rupturas e a reconfiguração da inserção internacional do Brasil no Sul Global (2003–2024)",
    authors: [
      "Aleksandra Wiśniewska-Kowalczyk",
      "Christopher Alexander Montgomery III",
      "María José de la Cruz y Fernández",
      "Đặng Thị Ngọc Hân",
      "Seán O'Brien-Ó Súilleabháin",
    ],
    publication_year: 2024,
    language: "pt",
    page_count: 1284,
  }),
  base(2, {
    status: "completed",
    title: "Jo",
    authors: ["J"],
    publication_year: 1999,
    language: "en",
    page_count: 1,
  }),
  base(3, {
    status: "completed",
    original_filename: "IMG_20250914_183022_HDR_scan_relatorio_conselho_seguranca_edited_edited.pdf",
    text_extractable: false,
    page_count: 48,
  }),
  base(4, {
    status: "failed",
    original_filename: "Q3 Board Deck — FINAL (revised) v12 [approved by legal].pdf",
    page_count: null,
    text_extractable: null,
    processed_at: horasAtras(30),
  }),
  base(5, { status: "processing", original_filename: "relatorio.pdf", page_count: null, text_extractable: null, processed_at: null }),
  base(6, {
    status: "completed",
    title: "Integración regional y autonomía en América Latina: Benachrichtigungseinstellungen",
    authors: ["王秀英", "نور الهدى عبد الرحمن"],
    publication_year: 2019,
    language: "es",
  }),
  base(7, { status: "pending", original_filename: "a.pdf", page_count: null, text_extractable: null, processed_at: null }),
];

function itensDoModo(modo: ModoDados): { itens: DocumentoResumo[]; total: number } {
  const PIOR = piorCaso();
  if (modo === "vazio") return { itens: [], total: 0 };
  if (modo === "um") return { itens: [PIOR[1]], total: 1 };
  // Pior caso: 1.284 documentos no banco; os primeiros são os casos extremos acima.
  const total = 1284;
  const itens = Array.from({ length: total }, (_, i) =>
    i < PIOR.length
      ? PIOR[i]
      : base(i + 1, {
          status: "completed",
          title: `Documento ${i + 1} do acervo de teste`,
          language: ["pt", "en", "es", "fr"][i % 4],
          publication_year: 1990 + (i % 35),
        }),
  );
  return { itens, total };
}

export async function fixtureLista(
  modo: ModoDados,
  opcoes: { limit?: number; offset?: number; status?: StatusDocumento },
): Promise<Paginado<DocumentoResumo>> {
  await new Promise((r) => setTimeout(r, 250));
  const { itens } = itensDoModo(modo);
  const filtrados = opcoes.status ? itens.filter((d) => d.status === opcoes.status) : itens;
  const limit = opcoes.limit ?? 20;
  const offset = opcoes.offset ?? 0;
  return { items: filtrados.slice(offset, offset + limit), total: filtrados.length, limit, offset };
}

export async function fixtureDocumento(modo: ModoDados, id: string): Promise<DocumentoDetalhe> {
  await new Promise((r) => setTimeout(r, 250));
  const resumo = itensDoModo(modo).itens.find((d) => d.id === id);
  if (!resumo) throw new ErroApi(404, "not_found", "Documento não encontrado.");
  const falhou = resumo.status === "failed";
  return {
    ...resumo,
    mime_type: "application/pdf",
    journal: resumo.title && resumo.title.length > 40 ? "Revista de Teste de Interface em Relações Internacionais e Estudos Estratégicos Comparados" : null,
    publisher: null,
    institution: resumo.title ? "Universidade de Teste" : null,
    doi: resumo.title ? "10.5555/teste.interface.2024.0001.revisado.versao-final" : null,
    source_url: resumo.title
      ? "https://example.org/acervo/relacoes-internacionais/2024/politica-externa/artigo-teste?versao=final&idioma=pt"
      : null,
    metadata_sources: resumo.title
      ? { title: "user", authors: "xmp", publication_year: "user", language: "heuristic", doi: "pdf_info", journal: "xmp", institution: "user", source_url: "user" }
      : {},
    pdf_metadata: resumo.title ? { "/Producer": "Teste de interface", "/Creator": "Microsoft Word - artigo final (revisado) v12.docx" } : null,
    warnings: resumo.text_extractable === false
      ? ["no_extractable_text: nenhuma página tem texto extraível (PDF escaneado ou só imagens?); OCR não é feito nesta fase"]
      : resumo.page_count === 1284
        ? ["pages_without_text: 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25", "pages_with_errors: 1201"]
        : [],
    error: falhou ? { code: "pdf_unreadable", message: "O PDF não pôde ser aberto durante o processamento." } : null,
    updated_at: resumo.created_at,
  };
}

export async function fixturePaginas(
  modo: ModoDados,
  id: string,
  opcoes: { limit?: number; offset?: number },
): Promise<Paginado<PaginaDeTexto>> {
  const doc = await fixtureDocumento(modo, id);
  const total = doc.page_count ?? 0;
  const limit = opcoes.limit ?? 20;
  const offset = opcoes.offset ?? 0;
  const items: PaginaDeTexto[] = [];
  for (let n = offset + 1; n <= Math.min(total, offset + limit); n += 1) {
    const vazia = doc.text_extractable === false || (n >= 2 && n <= 25 && total === 1284);
    const erro = n === 1201;
    const texto = vazia || erro
      ? ""
      : n === 1
        ? "Texto de teste de interface. Uma linha extremamente longa sem espaços: https://example.org/acervo/relacoes-internacionais/2024/politica-externa/artigo-teste?versao=final&idioma=pt — seguida de parágrafos com acentuação: ação, coração, pingüim, Đặng Thị Ngọc Hân, ñandú.\n\nSegundo parágrafo."
        : `Página ${n} do documento de teste.`;
    items.push({
      page_number: n,
      text: texto,
      text_raw: null,
      char_count: texto.length,
      has_text: Boolean(texto),
      extraction_status: erro ? "error" : texto ? "ok" : "empty",
      extraction_error: erro ? "ValueError" : null,
      text_sha256: texto ? "3e8b08ab4338fafc40defe25590ebdfda9d017723f735478f7b548065fdd41cc" : null,
      extractor: "pypdf 6.21.2",
      normalization_version: "1",
      extracted_at: doc.created_at,
    });
  }
  return { items, total, limit, offset };
}
