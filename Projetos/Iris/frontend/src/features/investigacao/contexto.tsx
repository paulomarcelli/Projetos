/**
 * Estado compartilhado do resultado: o que está selecionado, qual cenário está em vista e qual
 * área está aberta. Análise, Mapa de relações e Timeline prospectiva leem e escrevem o mesmo estado, montado UMA vez por investigação. Por isso:
 * - o cenário escolhido na análise continua escolhido no mapa e na timeline;
 * - um ator selecionado no mapa continua selecionado ao abrir a timeline (o detalhe do cenário
 *   mostra a relevância dele);
 * - uma evidência aberta numa área continua no painel ao trocar de área.
 * Nenhuma área guarda cópia própria desses dados: todas consultam `r` e os índices em `ix`.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Ator } from "../../types/ator";
import type { Cenario, CenarioId, Vista } from "../../types/cenario";
import type { EstadoNoCenario, Relacao, TipoRelacao } from "../../types/relacao";
import type { EventoTempo, Sinal } from "../../types/evento";
import type { Evidencia, Fonte } from "../../types/fonte";
import type { ResultadoDeInvestigacao } from "../../types/investigacao";

/**
 * Três áreas, na ordem em que se lê uma investigação: compreender o fenômeno (análise), ver quem
 * se relaciona com quem (mapa) e ver como pode evoluir (timeline prospectiva, onde vivem os três
 * cenários). São áreas separadas porque cada uma pede um espaço diferente: a análise é leitura
 * curta; o mapa e a timeline são visualizações que precisam da largura da tela.
 * Evidências e método não são áreas: ficam na análise (seção recolhível) e no painel contextual.
 */
export type Aba = "analise" | "relacoes" | "timeline";
export const ABAS: { id: Aba; nome: string }[] = [
  { id: "analise", nome: "Análise" },
  { id: "relacoes", nome: "Mapa de relações" },
  { id: "timeline", nome: "Timeline prospectiva" },
];
/** Endereços antigos (?area=visao|cenarios|evidencias|leitura) continuam válidos. A leitura guiada saiu: abre a análise. */
const ABAS_ANTIGAS: Record<string, Aba> = { visao: "analise", cenarios: "timeline", tempo: "timeline", evidencias: "analise", fontes: "analise", leitura: "analise" };
export const abaDoEndereco = (x: string | null): Aba => (x && ABAS.some((a) => a.id === x) ? (x as Aba) : (x && ABAS_ANTIGAS[x]) || "analise");
export type Selecao =
  | { tipo: "ator"; id: string }
  | { tipo: "relacao"; id: string }
  | { tipo: "evento"; id: string }
  | { tipo: "evidencia"; id: string }
  /** Detalhe completo de um cenário (aberto pelos cartões da análise). */
  | { tipo: "cenario"; id: CenarioId }
  | { tipo: "metodo"; id: "metodo" }
  | null;

export interface Indices {
  atores: Map<string, Ator>;
  relacoes: Map<string, Relacao>;
  eventos: Map<string, EventoTempo>;
  evidencias: Map<string, Evidencia>;
  fontes: Map<string, Fonte>;
  sinais: Map<string, Sinal>;
  cenarios: Map<CenarioId, Cenario>;
  /** Número de cada fonte na bibliografia (1, 2, 3...). */
  numero: Map<string, number>;
  /** Em quantos elementos distintos (atores, relações, cenários, eventos) cada evidência é usada. */
  usosDaEvidencia: Map<string, number>;
  /** Onde cada evidência é usada, para navegar de volta da fonte ao elemento. */
  ondeSeUsa: Map<string, { tipo: "ator" | "relacao" | "evento" | "cenario"; id: string; rotulo: string }[]>;
}

interface Contexto {
  r: ResultadoDeInvestigacao;
  ix: Indices;
  vista: Vista;
  setVista: (v: Vista) => void;
  selecao: Selecao;
  selecionar: (s: Selecao) => void;
  aba: Aba;
  irPara: (a: Aba) => void;
}

const Ctx = createContext<Contexto | null>(null);

export function useResultado() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useResultado fora do ProvedorDoResultado");
  return c;
}

export function indexar(r: ResultadoDeInvestigacao): Indices {
  const usos = new Map<string, number>();
  const onde = new Map<string, { tipo: "ator" | "relacao" | "evento" | "cenario"; id: string; rotulo: string }[]>();
  const nomeAtor = new Map(r.atores.map((a) => [a.id, a.curto]));
  const marcar = (ids: string[] | undefined, tipo: "ator" | "relacao" | "evento" | "cenario", id: string, rotulo: string) => {
    for (const e of ids ?? []) {
      const lista = onde.get(e) ?? [];
      if (!lista.some((x) => x.tipo === tipo && x.id === id)) {
        lista.push({ tipo, id, rotulo });
        usos.set(e, (usos.get(e) ?? 0) + 1);
      }
      onde.set(e, lista);
    }
  };
  for (const a of r.atores) for (const c of a.caracteristicas) marcar(c.evidencias, "ator", a.id, a.nome);
  for (const rel of r.relacoes) {
    const rot = `${nomeAtor.get(rel.de)} → ${nomeAtor.get(rel.para)}`;
    marcar(rel.presente?.evidencias, "relacao", rel.id, rot);
    for (const c of Object.values(rel.cenarios)) marcar(c.evidencias, "relacao", rel.id, rot);
  }
  for (const c of r.cenarios) {
    const rot = `Cenário ${c.id}: ${c.nome}`;
    for (const a of [...c.premissas, ...c.tendencias, ...c.favoraveis, ...c.contrarias]) marcar(a.evidencias, "cenario", c.id, rot);
    for (const m of c.mecanismos) marcar(m.evidencias, "cenario", c.id, rot);
  }
  for (const ev of r.linhaDoTempo) marcar(ev.evidencias, "evento", ev.id, `${ev.data}: ${ev.texto}`);
  return {
    atores: new Map(r.atores.map((a) => [a.id, a])),
    relacoes: new Map(r.relacoes.map((x) => [x.id, x])),
    eventos: new Map(r.linhaDoTempo.map((x) => [x.id, x])),
    evidencias: new Map(r.evidencias.map((x) => [x.id, x])),
    fontes: new Map(r.fontes.map((x) => [x.id, x])),
    sinais: new Map(r.sinais.map((x) => [x.id, x])),
    cenarios: new Map(r.cenarios.map((x) => [x.id, x])),
    numero: new Map(r.fontes.map((f, i) => [f.id, i + 1])),
    usosDaEvidencia: usos,
    ondeSeUsa: onde,
  };
}

/**
 * `abaInicial` vem do endereço (`?area=`), para que um link leve direto a uma área.
 * `aoTrocarAba` deixa a página refletir a área no endereço sem que o provedor dependa do roteador.
 */
export function ProvedorDoResultado({
  r,
  children,
  abaInicial = "analise",
  aoTrocarAba,
}: {
  r: ResultadoDeInvestigacao;
  children: ReactNode;
  abaInicial?: Aba;
  aoTrocarAba?: (a: Aba) => void;
}) {
  const ix = useMemo(() => indexar(r), [r]);
  const [vista, setVista] = useState<Vista>("presente");
  const [selecao, selecionar] = useState<Selecao>(null);
  const [aba, setAba] = useState<Aba>(abaInicial);
  const irPara = useCallback(
    (a: Aba) => {
      setAba(a);
      aoTrocarAba?.(a);
    },
    [aoTrocarAba],
  );
  const valor = useMemo(
    () => ({ r, ix, vista, setVista, selecao, selecionar, aba, irPara }),
    [r, ix, vista, selecao, aba, irPara],
  );
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

// ------------------------------------------------------------------ leitura das relações por vista

export interface RelacaoNaVista {
  rel: Relacao;
  tipo: TipoRelacao;
  texto: string;
  /** Relação existe nesta vista. */
  visivel: boolean;
  /** Mudou em relação ao presente (só em cenários). */
  mudou: boolean;
  estado?: EstadoNoCenario;
}

export function relacaoNaVista(rel: Relacao, vista: Vista): RelacaoNaVista {
  if (vista === "presente") {
    return { rel, tipo: rel.tipo, texto: rel.presente?.texto ?? "", visivel: rel.presente !== null, mudou: false };
  }
  const e = rel.cenarios[vista];
  return {
    rel,
    tipo: e.tipo ?? rel.tipo,
    texto: e.texto,
    visivel: e.mudanca !== "ausente",
    mudou: e.mudanca !== "mantida" && !(e.mudanca === "ausente" && rel.presente === null),
    estado: e,
  };
}

export const ROTULO_MUDANCA: Record<EstadoNoCenario["mudanca"], string> = {
  mantida: "Mantida",
  reforcada: "Reforçada",
  enfraquecida: "Enfraquecida",
  transformada: "Muda de natureza",
  nova: "Nova",
  ausente: "Não ocorre",
};

/** Tipo epistêmico de uma relação na vista atual: documentada, inferida ou condicional. */
export function statusDaRelacao(rel: Relacao, vista: Vista) {
  if (vista === "presente") return rel.presente?.tipo ?? "hipotese";
  return "cenario" as const;
}

export function documentada(tipo: string) {
  return tipo === "fato" || tipo === "evidencia";
}
