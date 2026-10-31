/** Formatação com Intl (pt-BR): números, plurais, tamanhos, idiomas e textos de documentos. As datas ficam em data.ts. */

export const LOCALE = "pt-BR";
const numeros = new Intl.NumberFormat(LOCALE);

export function numero(n: number | null | undefined): string {
  return typeof n === "number" && Number.isFinite(n) ? numeros.format(n) : "—";
}

/**
 * "1 documento", "2 documentos", "0 documentos". Não usa Intl.PluralRules: em pt-BR ele trata
 * 0 como singular ("0 documento"), o que soa errado em textos de interface.
 */
export function contar(n: number, singular: string, plural: string): string {
  return `${numero(n)} ${Math.abs(n) === 1 ? singular : plural}`;
}

export function tamanho(bytes: number | null | undefined): string {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${numero(bytes)} B`;
  const unidades = ["KB", "MB", "GB"];
  let valor = bytes / 1024;
  let i = 0;
  while (valor >= 1024 && i < unidades.length - 1) {
    valor /= 1024;
    i += 1;
  }
  return `${new Intl.NumberFormat(LOCALE, { maximumFractionDigits: valor < 10 ? 1 : 0 }).format(valor)} ${unidades[i]}`;
}

let nomesDeIdioma: Intl.DisplayNames | null = null;
try {
  nomesDeIdioma = new Intl.DisplayNames([LOCALE], { type: "language" });
} catch {
  nomesDeIdioma = null;
}

/** "pt" → "português"; códigos desconhecidos voltam como vieram. */
export function idioma(codigo: string | null | undefined): string {
  if (!codigo) return "—";
  try {
    return nomesDeIdioma?.of(codigo) ?? codigo;
  } catch {
    return codigo;
  }
}

/** Corta no meio, para identificadores que diferem no fim (hashes, nomes de arquivo). */
export function cortarNoMeio(texto: string, maximo = 24): string {
  const letras = Array.from(texto);
  if (letras.length <= maximo) return texto;
  const lado = Math.floor((maximo - 1) / 2);
  return `${letras.slice(0, lado).join("")}…${letras.slice(letras.length - lado).join("")}`;
}

/** Título exibível de um documento: título real ou, sem ele, o nome do arquivo. */
export function tituloDoDocumento(d: { title: string | null; original_filename: string }): {
  texto: string;
  ehNomeDeArquivo: boolean;
} {
  const t = d.title?.trim();
  return t ? { texto: t, ehNomeDeArquivo: false } : { texto: d.original_filename, ehNomeDeArquivo: true };
}

/** "Silva, Ana; Pérez, José e mais 3" — evita listas intermináveis em linhas de tabela. */
export function autores(lista: string[] | null | undefined, maximo = 2): string | null {
  if (!lista?.length) return null;
  if (lista.length <= maximo) return lista.join("; ");
  const resto = lista.length - maximo;
  return `${lista.slice(0, maximo).join("; ")} ${resto === 1 ? "e mais 1" : `e mais ${numero(resto)}`}`;
}
