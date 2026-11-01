/**
 * Estado compartilhado do resultado: o que está selecionado, qual cenário está em vista e qual vista da seção 05
 * está aberta. As cinco seções (e o mapa e a linha do tempo dentro da 05) leem e escrevem o mesmo estado, montado
 * UMA vez por investigação. Por isso:
 * - o cenário escolhido na análise continua escolhido no mapa e na timeline;
 * - um ator selecionado no mapa continua selecionado ao abrir a timeline (o detalhe do cenário
 *   mostra a relevância dele);
 * - uma evidência aberta numa área continua no painel ao trocar de área.
 * Nenhuma área guarda cópia própria desses dados: todas consultam `r` e os índices em `ix`.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { irParaSecao } from "./secoes";
import type { Ator } from "../../../types/ator";
import type { Cenario, CenarioId, Vista } from "../../../types/cenario";
import type { EstadoNoCenario, Relacao, TipoRelacao } from "../../../types/relacao";
import type { EventoTempo, Sinal } from "../../../types/evento";
import type { Evidencia, Fonte } from "../../../types/fonte";
import type { ResultadoDeInvestigacao } from "../../../types/investigacao";

/**
 * Vistas da seção 05 (Exploração e evidências): o mapa de relações, a linha do tempo e as evidências. Antes eram
 * abas da página; agora a investigação é uma página só, em cinco seções (ver secoes.ts), e estas três ficam juntas
 * no fim, porque servem para explorar e verificar o que as seções de cima afirmam.
 */
export type Aba = "relacoes" | "timeline" | "evidencias";
export const ABAS: { id: Aba; nome: string }[] = [
  { id: "relacoes", nome: "Mapa de relações" },
  { id: "timeline", nome: "Linha do tempo" },
  { id: "evidencias", nome: "Evidências e fontes" },
];
/** Endereços antigos (?area=…) continuam válidos. `null` = nenhuma vista pedida (a página abre no topo). */
const ABAS_ANTIGAS: Record<string, Aba> = { cenarios: "timeline", tempo: "timeline", fontes: "evidencias" };
export const abaDoEndereco = (x: string | null): Aba | null => (x && ABAS.some((a) => a.id === x) ? (x as Aba) : (x && ABAS_ANTIGAS[x]) || null);
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
  /** Vista aberta na seção 05. */
  aba: Aba;
  /** Troca a vista da seção 05 sem rolar a página (as abas dentro da própria seção). */
  escolherAba: (a: Aba) => void;
  /** Troca a vista da seção 05 e leva até ela (links de outras seções). */
  irPara: (a: Aba) => void;
  /** Uma vista da seção 05 foi pedida (endereço, link ou clique). */
  exploracaoPedida: boolean;
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
 * `abaInicial` vem do endereço (`?area=`): com ela, a página abre já na seção 05, na vista pedida.
 * `aoTrocarAba` deixa a página refletir a vista no endereço sem que o provedor dependa do roteador.
 * `irPara` troca a vista E leva até a seção 05 (é o que os links "ver no mapa" e "na linha do tempo" pedem).
 */
export function ProvedorDoResultado({
  r,
  children,
  abaInicial = null,
  aoTrocarAba,
}: {
  r: ResultadoDeInvestigacao;
  children: ReactNode;
  abaInicial?: Aba | null;
  aoTrocarAba?: (a: Aba) => void;
}) {
  const ix = useMemo(() => indexar(r), [r]);
  const [vista, setVista] = useState<Vista>("presente");
  const [selecao, selecionar] = useState<Selecao>(null);
  const [aba, setAba] = useState<Aba>(abaInicial ?? "relacoes");
  // Alguém pediu uma vista da seção 05 (endereço, link ou clique): ela monta mesmo antes de chegar perto da tela.
  const [exploracaoPedida, setExploracaoPedida] = useState(Boolean(abaInicial));
  const escolherAba = useCallback(
    (a: Aba) => {
      setAba(a);
      setExploracaoPedida(true);
      aoTrocarAba?.(a);
    },
    [aoTrocarAba],
  );
  const irPara = useCallback(
    (a: Aba) => {
      escolherAba(a);
      requestAnimationFrame(() => irParaSecao("sec-exploracao"));
    },
    [escolherAba],
  );
  // Endereço com ?area=: abre direto na seção 05 (depois da primeira pintura, quando a seção existe).
  useEffect(() => {
    if (abaInicial) requestAnimationFrame(() => irParaSecao("sec-exploracao"));
    // só na montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const valor = useMemo(
    () => ({ r, ix, vista, setVista, selecao, selecionar, aba, escolherAba, irPara, exploracaoPedida }),
    [r, ix, vista, selecao, aba, escolherAba, irPara, exploracaoPedida],
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
