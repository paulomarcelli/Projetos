/**
 * Formatação em pt-BR (datas, durações, contagens) e agrupamento do histórico por dia.
 * Tudo em funções puras, para testar sem relógio de verdade (`agora` é parâmetro).
 */
import type { EstadoInvestigacao } from "../types/api";

const LOCALE = "pt-BR";

const fmtDataCurta = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short" });
const fmtDataLonga = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", year: "numeric" });
const fmtHora = new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit" });
const fmtDiaDaSemana = new Intl.DateTimeFormat(LOCALE, { weekday: "long" });
const fmtNumero = new Intl.NumberFormat(LOCALE);

export function numero(n: number): string {
  return fmtNumero.format(n);
}

/** "3 cenários", "1 cenário", "0 cenários" */
export function plural(n: number, singular: string, pluralDe = `${singular}s`): string {
  return `${numero(n)} ${n === 1 ? singular : pluralDe}`;
}

function inicioDoDia(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

const DIA = 86_400_000;

/** Diferença em dias de calendário (0 = hoje, 1 = ontem). */
export function diasAtras(iso: string, agora: Date = new Date()): number {
  return Math.round((inicioDoDia(agora) - inicioDoDia(new Date(iso))) / DIA);
}

/** "2 nov." */
export function dataCurta(iso: string): string {
  return fmtDataCurta.format(new Date(iso));
}

/** "2 de novembro de 2026" */
export function dataLonga(iso: string): string {
  return fmtDataLonga.format(new Date(iso));
}

/** "22:36" */
export function hora(iso: string): string {
  return fmtHora.format(new Date(iso));
}

/** "Hoje, 22:36" · "Ontem, 18:01" · "2 nov., 16:56" */
export function quando(iso: string, agora: Date = new Date()): string {
  const d = diasAtras(iso, agora);
  const h = hora(iso);
  if (d === 0) return `Hoje, ${h}`;
  if (d === 1) return `Ontem, ${h}`;
  return `${dataCurta(iso)}, ${h}`;
}

/** "Hoje" · "Ontem" · "segunda-feira" (até 6 dias) · "2 nov." */
export function diaRelativo(iso: string, agora: Date = new Date()): string {
  const d = diasAtras(iso, agora);
  if (d === 0) return "Hoje";
  if (d === 1) return "Ontem";
  if (d > 1 && d < 7) return fmtDiaDaSemana.format(new Date(iso));
  return dataCurta(iso);
}

/** "48 s" · "1 min 05 s" · "12 min" */
export function duracao(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  const resto = s % 60;
  if (m >= 10) return `${m} min`;
  return `${m} min ${String(resto).padStart(2, "0")} s`;
}

export type ChaveDoGrupo = "hoje" | "ontem" | "semana" | "antigas";

export const TITULOS_DOS_GRUPOS: Record<ChaveDoGrupo, string> = {
  hoje: "Hoje",
  ontem: "Ontem",
  semana: "Esta semana",
  antigas: "Mais antigas",
};

export interface GrupoPorDia<T> {
  chave: ChaveDoGrupo;
  titulo: string;
  /** "2 de novembro de 2026" para Hoje/Ontem; intervalo descritivo para os outros */
  subtitulo: string;
  itens: T[];
}

export function chaveDoGrupo(iso: string, agora: Date = new Date()): ChaveDoGrupo {
  const d = diasAtras(iso, agora);
  if (d <= 0) return "hoje";
  if (d === 1) return "ontem";
  if (d < 7) return "semana";
  return "antigas";
}

/**
 * Agrupa por dia ("Hoje", "Ontem", "Esta semana", "Mais antigas"), na ordem em que os itens chegam
 * (a API já manda os mais recentes primeiro). Grupos vazios ficam de fora.
 */
export function agruparPorDia<T extends { criada_em: string }>(itens: T[], agora: Date = new Date()): GrupoPorDia<T>[] {
  const ordem: ChaveDoGrupo[] = ["hoje", "ontem", "semana", "antigas"];
  const mapa = new Map<ChaveDoGrupo, T[]>();
  for (const item of itens) {
    const c = chaveDoGrupo(item.criada_em, agora);
    if (!mapa.has(c)) mapa.set(c, []);
    mapa.get(c)!.push(item);
  }
  const ontem = new Date(agora.getTime() - DIA);
  return ordem
    .filter((c) => mapa.has(c))
    .map((c) => ({
      chave: c,
      titulo: TITULOS_DOS_GRUPOS[c],
      subtitulo:
        c === "hoje" ? dataLonga(agora.toISOString()) : c === "ontem" ? dataLonga(ontem.toISOString()) : c === "semana" ? "Últimos 7 dias" : "Antes desta semana",
      itens: mapa.get(c)!,
    }));
}

export const ROTULOS_DE_ESTADO: Record<EstadoInvestigacao, string> = {
  pendente: "Na fila",
  recuperando: "Recuperando fontes",
  analisando: "Analisando",
  validando: "Validando",
  concluida: "Concluída",
  falhou: "Falhou",
};

export function rotuloDoEstado(estado: EstadoInvestigacao | string): string {
  return ROTULOS_DE_ESTADO[estado as EstadoInvestigacao] ?? estado;
}

/** "character:thor-thor-odinson" → "Thor Thor Odinson" (só quando o grafo não traz o rótulo). */
export function rotuloDoId(id: string): string {
  const slug = id.includes(":") ? id.slice(id.indexOf(":") + 1) : id;
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toLocaleUpperCase(LOCALE) + p.slice(1))
    .join(" ");
}

/** "character:loki" → "character" */
export function tipoDoId(id: string): string {
  return id.includes(":") ? id.slice(0, id.indexOf(":")) : "concept";
}
