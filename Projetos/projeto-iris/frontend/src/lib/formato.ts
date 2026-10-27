/** Formatação com Intl (pt-BR): números, plurais, datas, tamanhos, idiomas. */

const LOCALE = "pt-BR";
const numeros = new Intl.NumberFormat(LOCALE);
const relativo = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
const dataCurta = new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "short", year: "numeric" });
const dataHora = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

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

function paraData(valor: string | Date | null | undefined): Date | null {
  if (!valor) return null;
  const d = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function data(valor: string | Date | null | undefined): string {
  const d = paraData(valor);
  return d ? dataCurta.format(d) : "—";
}

const dataNumerica = new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "2-digit", year: "numeric" });

/** "27/10/2026": para colunas estreitas de tabela. */
export function dataCompacta(valor: string | Date | null | undefined): string {
  const d = paraData(valor);
  return d ? dataNumerica.format(d) : "—";
}

export function dataComHora(valor: string | Date | null | undefined): string {
  const d = paraData(valor);
  return d ? dataHora.format(d) : "—";
}

/** Relativa até 7 dias ("há 3 horas"); depois, data absoluta. */
export function quando(valor: string | Date | null | undefined, agora: Date = new Date()): string {
  const d = paraData(valor);
  if (!d) return "—";
  const segundos = Math.round((d.getTime() - agora.getTime()) / 1000);
  const abs = Math.abs(segundos);
  if (abs < 45) return "agora mesmo";
  if (abs < 3600) return relativo.format(Math.round(segundos / 60), "minute");
  if (abs < 86400) return relativo.format(Math.round(segundos / 3600), "hour");
  if (abs < 7 * 86400) return relativo.format(Math.round(segundos / 86400), "day");
  return dataCurta.format(d);
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
