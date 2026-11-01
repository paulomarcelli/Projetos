/** Datas em pt-BR: absoluta, compacta, com hora e relativa. Os números e textos ficam em formatadores.ts. */

import { LOCALE } from "./formatadores";

const relativo = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
const dataCurta = new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "short", year: "numeric" });
const dataHora = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

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
