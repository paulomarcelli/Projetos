/**
 * Estado compartilhado do resultado: o que está selecionado, qual cenário está em vista e qual
 * aba está aberta. Mapa, cenários, linha do tempo e evidências leem e escrevem o mesmo estado,
 * para que uma seleção feita em um componente continue valendo nos outros.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type {
  Ator,
  Cenario,
  CenarioId,
  EstadoNoCenario,
  EventoTempo,
  Evidencia,
  Fonte,
  Relacao,
  ResultadoDeInvestigacao,
  Sinal,
  TipoRelacao,
  Vista,
} from "../../lib/investigacao";

/** As quatro tarefas de quem lê uma análise: o sistema, os futuros, o tempo e as fontes. */
export type Aba = "visao" | "cenarios" | "tempo" | "fontes";
export type Selecao =
  | { tipo: "ator"; id: string }
  | { tipo: "relacao"; id: string }
  | { tipo: "evento"; id: string }
  | { tipo: "evidencia"; id: string }
  | { tipo: "metodo"; id: "metodo" }
  | null;

interface Indices {
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

function indexar(r: ResultadoDeInvestigacao): Indices {
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

export function ProvedorDoResultado({ r, children }: { r: ResultadoDeInvestigacao; children: ReactNode }) {
  const ix = useMemo(() => indexar(r), [r]);
  const [vista, setVista] = useState<Vista>("presente");
  const [selecao, selecionar] = useState<Selecao>(null);
  const [aba, setAba] = useState<Aba>("visao");
  const valor = useMemo(
    () => ({ r, ix, vista, setVista, selecao, selecionar, aba, irPara: setAba }),
    [r, ix, vista, selecao, aba],
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
