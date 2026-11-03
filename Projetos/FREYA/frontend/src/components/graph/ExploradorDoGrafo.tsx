import { List, Maximize2, Minus, Pause, Play, Plus, SkipForward, Waypoints, X } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as EventoDePonteiro } from "react";
import { usePreferencias } from "../../contexts/Preferencias";
import { comoErroDaApi, numero, plural } from "../../hooks";
import { caminhosEntre, expandirNo } from "../../services";
import type { GrafoDaInvestigacao, NoVisual } from "../../types/api";
import { useEvidencias } from "../analysis/Evidencias";
import { Botao, BotaoIcone, EstadoVazio, cx } from "../ui";
import { PAPEIS, estiloDoTipo } from "./estilos";
import { ListaDoGrafo } from "./ListaDoGrafo";
import {
  ZOOM_MAX,
  ZOOM_MIN,
  assentar,
  caminhoDaAresta,
  curvaturas,
  daExpansao,
  dadosIniciais,
  doCaminho,
  enquadrar,
  mesclar,
  montarSimulador,
  nosComRotulo,
  ordemDeLeitura,
  vizinhanca,
  type DadosDoGrafo,
  type NoSim,
  type Simulador,
  type Transformacao,
} from "./modelo";
import { PainelDoNo, type ResultadoDoCaminho } from "./PainelDoNo";

export interface ExploradorDoGrafoProps {
  investigacaoId: string;
  grafo: GrafoDaInvestigacao;
  /** "compacto" no cartão do dashboard (só ver e escolher); "completo" na página da análise */
  modo?: "compacto" | "completo";
  /** cenário destacado vindo de fora (a seção de cenários da análise) */
  cenarioDestacado?: string | null;
  aoMudarCenario?: (id: string | null) => void;
  /** nó a abrir ao montar (ex.: "Ver no grafo" de um ator) */
  noInicial?: string | null;
  /** modo compacto: clique num nó */
  aoEscolherNo?: (id: string) => void;
  /** modo completo numa coluna estreita (ao lado da resposta): o painel do nó fica abaixo do desenho */
  empilhado?: boolean;
  className?: string;
}

/** posições guardadas entre montagens (trocar de aba não refaz o desenho) */
const POSICOES = new WeakMap<GrafoDaInvestigacao, Map<string, Map<string, NoSim>>>();

type Gesto =
  | { tipo: "pan"; x: number; y: number; t0: Transformacao }
  | { tipo: "no"; id: string; x: number; y: number; moveu: boolean }
  | { tipo: "pinca"; dist: number; cx: number; cy: number; t0: Transformacao };

const PASSO_DA_REVELACAO = 1100;

/** Um explorador por investigação: trocar de grafo remonta (simulação e seleção do zero). */
export function ExploradorDoGrafo(props: ExploradorDoGrafoProps) {
  return <Explorador key={props.investigacaoId} {...props} />;
}

function Explorador({
  investigacaoId,
  grafo,
  modo = "completo",
  cenarioDestacado,
  aoMudarCenario,
  noInicial = null,
  aoEscolherNo,
  empilhado = false,
  className,
}: ExploradorDoGrafoProps) {
  const compacto = modo === "compacto";
  const { movimentoReduzido } = usePreferencias();
  const evidencias = useEvidencias();
  const uid = useId().replace(/:/g, "");

  // ── dados (o grafo da API + o que o usuário trouxe ao expandir ou buscar caminhos)
  const [dados, setDados] = useState<DadosDoGrafo>(() => dadosIniciais(grafo));

  // ── simulação
  const chaveDoCache = `${modo}`;
  const simRef = useRef<Simulador | null>(null);
  if (simRef.current === null) {
    const cache = POSICOES.get(grafo)?.get(chaveDoCache);
    simRef.current = montarSimulador(dados, compacto, cache);
    if (!cache) assentar(simRef.current.sim);
  }
  const [, setQuadro] = useState(0);
  const redesenhar = useCallback(() => setQuadro((q) => (q + 1) % 1_000_000), []);
  const laco = useRef(0);
  const arrastando = useRef(false);

  // durante a simulação as posições vão direto para o SVG (sem render do React a cada quadro);
  // quando ela assenta, um render só sincroniza rótulos e o resto
  const pintar = useRef<() => void>(() => {});
  const animar = useCallback(() => {
    if (laco.current) return;
    let quadros = 0;
    simRef.current?.sim.alphaDecay(0.045);
    const passo = () => {
      const s = simRef.current;
      if (!s) return;
      s.sim.tick();
      quadros++;
      pintar.current();
      if ((s.sim.alpha() > 0.03 || arrastando.current) && quadros < 600) laco.current = requestAnimationFrame(passo);
      else {
        laco.current = 0;
        redesenhar();
      }
    };
    laco.current = requestAnimationFrame(passo);
  }, [redesenhar]);

  useEffect(
    () => () => {
      cancelAnimationFrame(laco.current);
      laco.current = 0;
      const s = simRef.current;
      if (!s) return;
      if (!POSICOES.has(grafo)) POSICOES.set(grafo, new Map());
      POSICOES.get(grafo)!.set(chaveDoCache, s.porId);
    },
    [grafo, chaveDoCache],
  );

  const simDosDados = useRef(dados);
  useEffect(() => {
    if (simDosDados.current === dados) return;
    simDosDados.current = dados;
    const velho = simRef.current?.porId;
    simRef.current = montarSimulador(dados, compacto, velho);
    if (movimentoReduzido) {
      assentar(simRef.current.sim, 0.5);
      redesenhar();
    } else {
      simRef.current.sim.alpha(0.6);
      animar();
    }
    // só os dados novos (expansão, caminho) reaquecem a simulação
  }, [dados]);

  // ── tamanho da área e enquadramento
  const area = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [tamanho, setTamanho] = useState({ w: compacto ? 520 : 820, h: compacto ? 300 : 560 });
  const [t, setT] = useState<Transformacao>({ x: 0, y: 0, k: 1 });
  const mexeu = useRef(false);
  const [vista, setVista] = useState<"grafo" | "lista">("grafo");

  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    const medir = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setTamanho({ w: Math.round(r.width), h: Math.round(r.height) });
    };
    medir();
    if (typeof ResizeObserver === "undefined") return;
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, [vista]);
  const enquadrarTudo = useCallback(() => {
    setT(enquadrar([...(simRef.current?.porId.values() ?? [])], tamanho.w, tamanho.h, compacto ? 20 : 40, compacto ? 1.2 : 1.6));
  }, [tamanho.w, tamanho.h, compacto]);

  useLayoutEffect(() => {
    if (!mexeu.current) enquadrarTudo();
  }, [enquadrarTudo]);

  // ── seleção, destaque, filtros
  const [selecionado, setSelecionado] = useState<string | null>(compacto ? null : noInicial);
  const [hoverPonteiro, setHover] = useState<string | null>(null);
  // o foco do teclado num nó vale como passar o ponteiro (rótulo e vizinhança)
  const [focado, setFocado] = useState<string | null>(null);
  const hover = hoverPonteiro ?? focado;
  const [ativo, setAtivo] = useState<string | null>(null);
  const [ocultos, setOcultos] = useState<Set<string>>(new Set());
  const [destaque, setDestaque] = useState<string>(cenarioDestacado ? `cenario:${cenarioDestacado}` : "");
  const [passo, setPasso] = useState<number | null>(null);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (cenarioDestacado === undefined) return;
    setDestaque((d) => (cenarioDestacado ? `cenario:${cenarioDestacado}` : d.startsWith("cenario:") ? "" : d));
  }, [cenarioDestacado]);

  useEffect(() => {
    if (noInicial && !compacto) setSelecionado(noInicial);
  }, [noInicial, compacto]);

  const porId = useMemo(() => new Map(dados.nos.map((n) => [n.id, n])), [dados.nos]);
  const rotuloDe = useCallback((id: string) => porId.get(id)?.rotulo ?? evidencias?.rotuloDaEntidade(id) ?? id, [porId, evidencias]);
  const vizinhos = useMemo(() => vizinhanca(dados.arestas), [dados.arestas]);
  const arestaPorId = useMemo(() => new Map(dados.arestas.map((a) => [a.id, a])), [dados.arestas]);
  const curvas = useMemo(() => curvaturas(dados.arestas), [dados.arestas]);
  const comRotulo = useMemo(() => nosComRotulo(dados.nos, compacto ? 4 : 14), [dados.nos, compacto]);
  const tipos = useMemo(() => {
    const m = new Map<string, { rotulo: string; quantidade: number }>();
    for (const n of dados.nos) {
      const leg = grafo.legenda.tipos_de_no[n.tipo];
      const atual = m.get(n.tipo) ?? { rotulo: leg?.rotulo ?? estiloDoTipo(n.tipo).rotulo, quantidade: 0 };
      atual.quantidade++;
      m.set(n.tipo, atual);
    }
    return [...m.entries()].sort((a, b) => b[1].quantidade - a[1].quantidade);
  }, [dados.nos, grafo.legenda]);

  // ── caminho buscado pelo usuário
  const [caminho, setCaminho] = useState<(ResultadoDoCaminho & { nos: Set<string>; arestas: Set<string> }) | null>(null);
  const [buscandoCaminho, setBuscandoCaminho] = useState(false);
  const [erroDoCaminho, setErroDoCaminho] = useState<string | null>(null);
  const [expandindo, setExpandindo] = useState(false);
  const [msgExpansao, setMsgExpansao] = useState<{ ok: boolean; texto: string } | null>(null);

  useEffect(() => {
    setMsgExpansao(null);
    setErroDoCaminho(null);
  }, [selecionado]);

  const conjuntoDestaque = useMemo(() => {
    if (destaque.startsWith("cenario:")) {
      const c = grafo.cenarios.find((x) => x.id === destaque.slice(8));
      if (c) return { rotulo: `Cenário ${c.id}: ${c.nome}`, nos: new Set(c.nos), arestas: new Set(c.arestas) };
    }
    if (destaque.startsWith("caminho:")) {
      const p = grafo.caminhos.find((x) => x.id === destaque.slice(8));
      if (p) return { rotulo: `Caminho ${p.id}: ${p.descricao}`, nos: new Set(p.nos), arestas: new Set(p.arestas) };
    }
    if (destaque === "busca" && caminho?.existe) return { rotulo: `Caminho até ${rotuloDe(caminho.para)}`, nos: caminho.nos, arestas: caminho.arestas };
    return null;
  }, [destaque, grafo.cenarios, grafo.caminhos, caminho, rotuloDe]);

  // completa os nós com as pontas das arestas destacadas
  const destaqueCompleto = useMemo(() => {
    if (!conjuntoDestaque) return null;
    const nos = new Set(conjuntoDestaque.nos);
    for (const a of dados.arestas) if (conjuntoDestaque.arestas.has(a.id)) (nos.add(a.origem), nos.add(a.destino));
    return { ...conjuntoDestaque, nos };
  }, [conjuntoDestaque, dados.arestas]);

  const escolherDestaque = (valor: string) => {
    setDestaque(valor);
    if (aoMudarCenario) aoMudarCenario(valor.startsWith("cenario:") ? valor.slice(8) : null);
  };

  // ── revelação passo a passo (sequencia)
  const revelados = useMemo(() => {
    if (passo === null) return null;
    const nos = new Set<string>();
    const arestas = new Set<string>();
    for (const s of grafo.sequencia.slice(0, passo + 1)) {
      s.nos.forEach((n) => nos.add(n));
      s.arestas.forEach((a) => arestas.add(a));
    }
    for (const a of dados.arestas) if (arestas.has(a.id)) (nos.add(a.origem), nos.add(a.destino));
    return { nos, arestas };
  }, [passo, grafo.sequencia, dados.arestas]);

  useEffect(() => {
    if (passo === null || pausado) return;
    const tm = setTimeout(() => setPasso((p) => (p === null ? null : p + 1 >= grafo.sequencia.length ? null : p + 1)), PASSO_DA_REVELACAO);
    return () => clearTimeout(tm);
  }, [passo, pausado, grafo.sequencia.length]);

  const reproduzir = () => {
    setSelecionado(null);
    setHover(null);
    setPausado(false);
    setPasso(0);
  };

  // ── visibilidade
  const nosVisiveis = useMemo(
    () => dados.nos.filter((n) => !ocultos.has(n.tipo) && (!revelados || revelados.nos.has(n.id))),
    [dados.nos, ocultos, revelados],
  );
  const idsVisiveis = useMemo(() => new Set(nosVisiveis.map((n) => n.id)), [nosVisiveis]);
  const arestasVisiveis = useMemo(
    () => dados.arestas.filter((a) => idsVisiveis.has(a.origem) && idsVisiveis.has(a.destino) && (!revelados || revelados.arestas.has(a.id))),
    [dados.arestas, idsVisiveis, revelados],
  );
  const ordem = useMemo(() => ordemDeLeitura(nosVisiveis), [nosVisiveis]);

  // ── ênfase: hover > destaque > seleção
  const enfase = useMemo(() => {
    const deNo = (id: string, escarlate: boolean) => {
      const nos = new Set([id, ...(vizinhos.get(id) ?? [])]);
      const arestas = new Set(dados.arestas.filter((a) => a.origem === id || a.destino === id).map((a) => a.id));
      return { nos, arestas, escarlate };
    };
    if (hover) return deNo(hover, hover === selecionado);
    if (destaqueCompleto) return { nos: destaqueCompleto.nos, arestas: destaqueCompleto.arestas, escarlate: true };
    if (selecionado && porId.has(selecionado)) return deNo(selecionado, true);
    return null;
  }, [hover, selecionado, destaqueCompleto, vizinhos, dados.arestas, porId]);

  // ── ações de API
  const expandir = async (id: string) => {
    setExpandindo(true);
    setMsgExpansao(null);
    try {
      const e = await expandirNo(investigacaoId, id, 12);
      evidencias?.registrar(e.evidencias);
      const novos = e.nos.filter((n) => !porId.has(n.id)).length;
      const novasArestas = e.arestas.filter((a) => !dados.arestas.some((x) => x.id === a.id)).length;
      setDados((d) => mesclar(d, daExpansao(e)));
      setMsgExpansao({
        ok: true,
        texto:
          novos + novasArestas === 0
            ? "Os vizinhos que a base conhece já estão no grafo."
            : `Entraram ${plural(novos, "entidade nova", "entidades novas")} e ${plural(novasArestas, "relação", "relações")} (contorno tracejado).`,
      });
    } catch (err) {
      const e = comoErroDaApi(err);
      setMsgExpansao({ ok: false, texto: e.tipo === "indisponivel" ? "Não consegui expandir: a API não respondeu." : `Não consegui expandir: ${e.message}` });
    } finally {
      setExpandindo(false);
    }
  };

  const buscarCaminho = async (de: string, para: string) => {
    setBuscandoCaminho(true);
    setErroDoCaminho(null);
    try {
      const c = await caminhosEntre(investigacaoId, de, para);
      evidencias?.registrar(c.evidencias);
      if (c.existe) setDados((d) => mesclar(d, doCaminho(c)));
      const nos = new Set(c.caminhos.flatMap((p) => p.nos));
      const arestas = new Set(c.caminhos.flatMap((p) => p.arestas.map((a) => a.id)));
      setCaminho({ para, existe: c.existe, caminhos: c.caminhos.map((p) => ({ id: p.id, nos: p.nos })), nos, arestas });
      if (c.existe) setDestaque("busca");
    } catch (err) {
      const e = comoErroDaApi(err);
      setCaminho(null);
      setErroDoCaminho(e.tipo === "indisponivel" ? "Não consegui buscar o caminho: a API não respondeu." : `Não consegui buscar o caminho: ${e.message}`);
    } finally {
      setBuscandoCaminho(false);
    }
  };

  // ── seleção e foco
  const idDoTitulo = `${uid}-titulo-no`;
  const selecionar = useCallback(
    (id: string | null) => {
      if (compacto) {
        if (id) aoEscolherNo?.(id);
        return;
      }
      setSelecionado(id);
      if (id) setAtivo(id);
      setCaminho((c) => (c && id ? c : null));
      setDestaque((d) => (d === "busca" ? "" : d));
    },
    [compacto, aoEscolherNo],
  );

  const focarNo = (id: string) => {
    setAtivo(id);
    requestAnimationFrame(() => svg.current?.querySelector<SVGGElement>(`[data-no-id="${id.replace(/["\\]/g, "\\$&")}"]`)?.focus());
  };

  const teclaNoNo = (e: KeyboardEvent<SVGGElement>, id: string) => {
    const i = ordem.findIndex((n) => n.id === id);
    let alvo: string | null = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") alvo = ordem[(i + 1) % ordem.length]?.id ?? null;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") alvo = ordem[(i - 1 + ordem.length) % ordem.length]?.id ?? null;
    else if (e.key === "Home") alvo = ordem[0]?.id ?? null;
    else if (e.key === "End") alvo = ordem[ordem.length - 1]?.id ?? null;
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selecionar(id);
      if (!compacto) requestAnimationFrame(() => document.getElementById(idDoTitulo)?.focus());
      return;
    } else if (e.key === "Escape") {
      setSelecionado(null);
      return;
    } else if (e.key === "+" || e.key === "=") return zoomPor(1.25);
    else if (e.key === "-") return zoomPor(0.8);
    if (alvo) {
      e.preventDefault();
      focarNo(alvo);
    }
  };

  // ── pan, zoom e arraste
  const gesto = useRef<Gesto | null>(null);
  const ponteiros = useRef(new Map<number, { x: number; y: number }>());

  const pontoNaTela = (cx: number, cy: number) => {
    const r = svg.current?.getBoundingClientRect();
    if (!r || r.width === 0) return { x: 0, y: 0 };
    // o viewBox tem o tamanho da área em px e a origem no centro
    return { x: ((cx - r.left) / r.width) * tamanho.w - tamanho.w / 2, y: ((cy - r.top) / r.height) * tamanho.h - tamanho.h / 2 };
  };

  const zoomEm = useCallback((fator: number, sx: number, sy: number) => {
    mexeu.current = true;
    setT((t0) => {
      const k = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, t0.k * fator));
      const f = k / t0.k;
      return { k, x: sx - (sx - t0.x) * f, y: sy - (sy - t0.y) * f };
    });
  }, []);
  const zoomPor = (fator: number) => zoomEm(fator, 0, 0);

  useEffect(() => {
    const el = svg.current;
    if (!el || compacto) return;
    const roda = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const sx = ((e.clientX - r.left) / (r.width || 1)) * tamanho.w - tamanho.w / 2;
      const sy = ((e.clientY - r.top) / (r.height || 1)) * tamanho.h - tamanho.h / 2;
      zoomEm(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), sx, sy);
    };
    el.addEventListener("wheel", roda, { passive: false });
    return () => el.removeEventListener("wheel", roda);
  }, [compacto, tamanho.w, tamanho.h, zoomEm, vista]);

  const aoPressionar = (e: EventoDePonteiro<SVGSVGElement>) => {
    if (e.button > 0) return; // só o botão principal (ou toque)
    const p = pontoNaTela(e.clientX, e.clientY);
    ponteiros.current.set(e.pointerId, p);
    const alvo = (e.target as Element).closest?.("[data-no-id]");
    const id = alvo?.getAttribute("data-no-id");
    if (ponteiros.current.size === 2 && !compacto) {
      const [a, b] = [...ponteiros.current.values()];
      gesto.current = { tipo: "pinca", dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, t0: t };
      return;
    }
    if (id) {
      gesto.current = { tipo: "no", id, x: p.x, y: p.y, moveu: false };
    } else if (!compacto) {
      gesto.current = { tipo: "pan", x: p.x, y: p.y, t0: t };
    } else return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* jsdom */
    }
  };

  const aoMover = (e: EventoDePonteiro<SVGSVGElement>) => {
    const g = gesto.current;
    if (!g) return;
    const p = pontoNaTela(e.clientX, e.clientY);
    ponteiros.current.set(e.pointerId, p);
    if (g.tipo === "pinca") {
      const [a, b] = [...ponteiros.current.values()];
      if (!a || !b) return;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const k = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, g.t0.k * (dist / g.dist)));
      const f = k / g.t0.k;
      mexeu.current = true;
      setT({ k, x: g.cx - (g.cx - g.t0.x) * f, y: g.cy - (g.cy - g.t0.y) * f });
    } else if (g.tipo === "pan") {
      mexeu.current = true;
      setT({ ...g.t0, x: g.t0.x + (p.x - g.x), y: g.t0.y + (p.y - g.y) });
    } else if (g.tipo === "no" && !compacto) {
      if (!g.moveu && Math.hypot(p.x - g.x, p.y - g.y) < 4) return;
      g.moveu = true;
      const n = simRef.current?.porId.get(g.id);
      if (!n) return;
      const wx = (p.x - t.x) / t.k;
      const wy = (p.y - t.y) / t.k;
      if (movimentoReduzido) {
        n.x = n.fx = wx;
        n.y = n.fy = wy;
        redesenhar();
      } else {
        n.fx = wx;
        n.fy = wy;
        arrastando.current = true;
        simRef.current!.sim.alphaTarget(0.25);
        if (simRef.current!.sim.alpha() < 0.25) simRef.current!.sim.alpha(0.25);
        animar();
      }
    }
  };

  const aoSoltar = (e: EventoDePonteiro<SVGSVGElement>) => {
    ponteiros.current.delete(e.pointerId);
    const g = gesto.current;
    gesto.current = null;
    if (g?.tipo === "no") {
      const n = simRef.current?.porId.get(g.id);
      if (n) {
        n.fx = null;
        n.fy = null;
      }
      arrastando.current = false;
      simRef.current?.sim.alphaTarget(0);
      if (!g.moveu) selecionar(g.id === selecionado && !compacto ? null : g.id);
    } else if (g?.tipo === "pan" && Math.hypot(t.x - g.t0.x, t.y - g.t0.y) < 3 && !compacto) {
      // clique no fundo: limpa a seleção
      setSelecionado(null);
    }
  };

  const limparTudo = () => {
    escolherDestaque("");
    setCaminho(null);
    setSelecionado(null);
  };

  pintar.current = () => {
    const el = svg.current;
    const s = simRef.current;
    if (!el || !s) return;
    el.querySelectorAll<SVGGElement>("[data-no-id]").forEach((g) => {
      const n = s.porId.get(g.getAttribute("data-no-id") ?? "");
      if (n?.x !== undefined && n.y !== undefined) g.setAttribute("transform", `translate(${n.x.toFixed(1)},${n.y.toFixed(1)})`);
    });
    el.querySelectorAll<SVGPathElement>("[data-aresta-id]").forEach((p) => {
      const a = arestaPorId.get(p.getAttribute("data-aresta-id") ?? "");
      const o = a && s.porId.get(a.origem);
      const d = a && s.porId.get(a.destino);
      if (a && o && d) p.setAttribute("d", caminhoDaAresta(o, d, curvas.get(a.id) ?? 0, a.dirigida).d);
    });
  };

  // ── desenho
  const sim = simRef.current!;
  const k = t.k;
  const vazio = grafo.arestas.length === 0;
  const noSelecionado = selecionado ? porId.get(selecionado) ?? null : null;
  const ativoEfetivo = ativo && idsVisiveis.has(ativo) ? ativo : ordem[0]?.id;

  // rótulos: por prioridade, e só os que não colidem na tela (o resto aparece ao passar o ponteiro ou aproximar)
  const rotulados = new Set<string>();
  {
    const caixas: { x0: number; y0: number; x1: number; y1: number }[] = [];
    const candidatos: string[] = [];
    const por = (id: string | null | undefined) => id && idsVisiveis.has(id) && !candidatos.includes(id) && candidatos.push(id);
    por(selecionado);
    por(hover);
    for (const n of ordem) if (n.papel === "focal") por(n.id);
    if (enfase && enfase.nos.size <= 40) for (const id of enfase.nos) por(id);
    for (const n of ordem) if (comRotulo.has(n.id) || k >= 1.9) por(n.id);
    for (const id of candidatos) {
      const ns = sim.porId.get(id);
      const no = porId.get(id);
      if (!ns || !no || ns.x === undefined || ns.y === undefined) continue;
      const largura = Math.min(no.rotulo.length, 26) * 6.1 + 6;
      const cx = t.x + ns.x * k;
      const cy = t.y + (ns.y + ns.raio) * k + 12;
      const caixa = { x0: cx - largura / 2, y0: cy - 8, x1: cx + largura / 2, y1: cy + 7 };
      const fixo = id === selecionado || id === hover;
      if (!fixo && caixas.some((c) => c.x0 < caixa.x1 && caixa.x0 < c.x1 && c.y0 < caixa.y1 && caixa.y0 < c.y1)) continue;
      caixas.push(caixa);
      rotulados.add(id);
    }
  }
  const legendaPapeis: [string, { rotulo: string; descricao: string }][] = Object.entries(grafo.legenda.papeis).map(([p, d]) => [p, { rotulo: PAPEIS[p]?.rotulo ?? p, descricao: d }]);
  if (dados.nos.some((n) => n.papel === "expansao")) legendaPapeis.push(["expansao", PAPEIS.expansao]);

  if (vazio) {
    const focais = grafo.nos.filter((n) => n.papel === "focal");
    return (
      <div className={cx("flex flex-col items-center justify-center rounded-2xl border border-dashed border-borda-forte px-4", compacto ? "min-h-56 py-6" : "min-h-72 py-10", className)}>
        <EstadoVazio
          tamanho={compacto ? "compacto" : "medio"}
          icone={<Waypoints />}
          titulo="Sem relações para explorar"
          texto={
            <>
              A base não tem relações ligando {focais.length > 0 ? focais.map((n) => n.rotulo).join(", ") : "as entidades desta questão"} a outras entidades do MCU
              {grafo.nos.length > 0 ? ` (o grafo tem ${plural(grafo.nos.length, "entidade")} e nenhuma relação)` : ""}. Isso costuma acontecer com questões fora da
              continuidade cinematográfica.
            </>
          }
        />
      </div>
    );
  }

  const desenho = (
    <div ref={area} className={cx("relative overflow-hidden", compacto ? "h-full min-h-56" : empilhado ? "h-[24rem] md:h-[28rem] lg:h-[clamp(24rem,52vh,34rem)]" : "h-[26rem] md:h-[34rem] lg:h-[clamp(30rem,68vh,44rem)]")}>
      <svg
        ref={svg}
        role="group"
        aria-roledescription="grafo"
        aria-label={`Grafo da investigação: ${plural(nosVisiveis.length, "entidade")} e ${plural(arestasVisiveis.length, "relação", "relações")}. Tab entra no grafo, setas passam de um nó a outro, Enter abre o nó.`}
        viewBox={`${-tamanho.w / 2} ${-tamanho.h / 2} ${tamanho.w} ${tamanho.h}`}
        className={cx("block size-full select-none", compacto ? "touch-pan-y" : "touch-none cursor-grab active:cursor-grabbing")}
        onPointerDown={aoPressionar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <marker id={`${uid}-seta`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
            <path d="M0,1 L10,5 L0,9 z" className="fill-texto-fraco" />
          </marker>
          <marker id={`${uid}-seta-e`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
            <path d="M0,1 L10,5 L0,9 z" className="fill-escarlate" />
          </marker>
        </defs>
        <g transform={`translate(${t.x.toFixed(2)},${t.y.toFixed(2)}) scale(${k.toFixed(4)})`}>
          <g aria-hidden="true">
            {arestasVisiveis.map((a) => {
              const o = sim.porId.get(a.origem);
              const d = sim.porId.get(a.destino);
              if (!o || !d) return null;
              const em = enfase?.arestas.has(a.id);
              const apagada = enfase && !em;
              const forte = em && enfase?.escarlate;
              const g = caminhoDaAresta(o, d, curvas.get(a.id) ?? 0, a.dirigida);
              return (
                <path
                  key={a.id}
                  d={g.d}
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  strokeWidth={forte ? 2 : em ? 1.5 : 1}
                  strokeDasharray={a.tipo_epistemico === "hipotese" ? "2 3" : a.tipo_epistemico === "inferencia" ? "5 3" : undefined}
                  markerEnd={a.dirigida && !compacto ? `url(#${uid}-seta${forte ? "-e" : ""})` : undefined}
                  className={cx(
                    forte ? "stroke-escarlate" : em ? "stroke-texto-suave" : "stroke-borda-forte",
                    "movimento:transition-opacity movimento:duration-150",
                    apagada ? "opacity-25" : "opacity-100",
                  )}
                  data-aresta-id={a.id}
                />
              );
            })}
          </g>
          <g>
            {ordem
              .slice()
              .reverse()
              .map((n) => (
                <No
                  key={n.id}
                  no={n}
                  sim={sim.porId.get(n.id)}
                  k={k}
                  compacto={compacto}
                  selecionado={n.id === selecionado}
                  apagado={!!enfase && !enfase.nos.has(n.id)}
                  rotulado={rotulados.has(n.id)}
                  ativo={n.id === ativoEfetivo}
                  aoEntrar={() => setHover(n.id)}
                  aoSair={() => setHover((h) => (h === n.id ? null : h))}
                  aoTeclar={(e) => teclaNoNo(e, n.id)}
                  aoFocar={() => {
                    setAtivo(n.id);
                    setFocado(n.id);
                  }}
                  aoDesfocar={() => setFocado((f) => (f === n.id ? null : f))}
                />
              ))}
          </g>
        </g>
      </svg>

      {/* camadas sobre o desenho */}
      {passo !== null && (
        <div className="pointer-events-none absolute top-3 left-3 max-w-[min(26rem,calc(100%-1.5rem))] rounded-xl border border-borda bg-vidro-forte px-3 py-2 shadow-media backdrop-blur-vidro">
          <p className="text-2xs font-medium text-texto-fraco fr-numeros">
            Passo {passo + 1} de {grafo.sequencia.length}
          </p>
          <p className="text-sm font-medium first-letter:uppercase">{grafo.sequencia[passo]?.motivo}</p>
        </div>
      )}
      {passo === null && destaqueCompleto && (
        <div className="absolute top-3 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border border-escarlate-brilho bg-vidro-forte py-1 pr-1 pl-3 shadow-media backdrop-blur-vidro">
          <span className="size-2 shrink-0 rounded-full bg-escarlate" aria-hidden="true" />
          <span className="truncate text-xs font-medium">{destaqueCompleto.rotulo}</span>
          <button
            type="button"
            className="grid size-7 shrink-0 place-items-center rounded-full text-texto-suave passar:bg-superficie-3"
            aria-label="Tirar o destaque"
            onClick={() => escolherDestaque("")}
          >
            <X aria-hidden="true" size={14} />
          </button>
        </div>
      )}
      {!compacto && (
        <div className="absolute right-3 bottom-3 flex flex-col gap-1.5">
          <BotaoIcone rotulo="Aproximar" tamanho="pequeno" ladoDaDica="esquerda" onClick={() => zoomPor(1.3)}>
            <Plus size={16} />
          </BotaoIcone>
          <BotaoIcone rotulo="Afastar" tamanho="pequeno" ladoDaDica="esquerda" onClick={() => zoomPor(1 / 1.3)}>
            <Minus size={16} />
          </BotaoIcone>
          <BotaoIcone
            rotulo="Enquadrar tudo"
            tamanho="pequeno"
            ladoDaDica="esquerda"
            onClick={() => {
              mexeu.current = false;
              enquadrarTudo();
            }}
          >
            <Maximize2 size={15} />
          </BotaoIcone>
        </div>
      )}
      {!compacto && (
        <p className="pointer-events-none absolute bottom-3 left-3 hidden text-2xs text-texto-fraco md:block">
          Arraste o fundo para mover · roda ou pinça para aproximar · arraste um nó para reorganizar
        </p>
      )}
    </div>
  );

  if (compacto) return <div className={cx("relative h-full", className)}>{desenho}</div>;

  return (
    <div className={cx("overflow-hidden rounded-3xl border border-borda bg-superficie", className)}>
      {/* barra de ferramentas */}
      <div className="flex flex-wrap items-center gap-2 border-b border-borda px-3 py-3 sm:px-4">
        <p className="mr-auto text-sm text-texto-suave fr-numeros">
          <span className="font-medium text-texto">{plural(nosVisiveis.length, "entidade")}</span> · {plural(arestasVisiveis.length, "relação", "relações")}
          {nosVisiveis.length !== dados.nos.length && <span className="text-texto-fraco"> (de {numero(dados.nos.length)})</span>}
        </p>
        <label className="flex min-w-0 items-center gap-2 text-xs text-texto-suave">
          <span className="shrink-0">Destacar</span>
          <select
            className="h-9 max-w-[14rem] min-w-0 rounded-xl border border-borda-forte bg-superficie-2 px-2 text-sm text-texto focus-visible:border-escarlate"
            value={destaque === "busca" ? "" : destaque}
            onChange={(e) => escolherDestaque(e.target.value)}
          >
            <option value="">Nada</option>
            {grafo.cenarios.length > 0 && (
              <optgroup label="Cenários">
                {grafo.cenarios.map((c) => (
                  <option key={c.id} value={`cenario:${c.id}`}>
                    {c.id} · {c.nome}
                  </option>
                ))}
              </optgroup>
            )}
            {grafo.caminhos.length > 0 && (
              <optgroup label="Caminhos entre as focais">
                {grafo.caminhos.map((p) => (
                  <option key={p.id} value={`caminho:${p.id}`}>
                    {p.id} · {p.descricao}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
        {grafo.sequencia.length > 1 &&
          (passo === null ? (
            <Botao tamanho="pequeno" icone={<Play />} onClick={reproduzir} disabled={vista === "lista"}>
              Reproduzir
            </Botao>
          ) : (
            <>
              <Botao tamanho="pequeno" icone={pausado ? <Play /> : <Pause />} onClick={() => setPausado((p) => !p)}>
                {pausado ? "Continuar" : "Pausar"}
              </Botao>
              <Botao tamanho="pequeno" variante="fantasma" icone={<SkipForward />} onClick={() => setPasso(null)}>
                Pular
              </Botao>
            </>
          ))}
        <Botao tamanho="pequeno" variante={vista === "lista" ? "secundario" : "fantasma"} icone={<List />} aria-pressed={vista === "lista"} onClick={() => setVista((v) => (v === "lista" ? "grafo" : "lista"))}>
          {vista === "lista" ? "Ver o desenho" : "Ver como lista"}
        </Botao>
      </div>

      {/* filtros por tipo (são também a legenda de cores) */}
      <div className="flex gap-1.5 overflow-x-auto border-b border-borda px-3 py-2 sm:px-4" role="group" aria-label="Filtrar por tipo de entidade">
        {tipos.map(([tipo, info]) => {
          const e = estiloDoTipo(tipo);
          const visivel = !ocultos.has(tipo);
          return (
            <button
              key={tipo}
              type="button"
              aria-pressed={visivel}
              className={cx(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-[background-color,border-color,color] duration-150",
                visivel ? "border-borda-forte bg-superficie text-texto" : "border-dashed border-borda-forte bg-transparent text-texto-fraco line-through",
              )}
              onClick={() =>
                setOcultos((s) => {
                  const n = new Set(s);
                  if (n.has(tipo)) n.delete(tipo);
                  else n.add(tipo);
                  return n;
                })
              }
            >
              <span className={cx("size-2.5 rounded-full border", e.amostra, !visivel && "opacity-40")} aria-hidden="true" />
              {info.rotulo}
              <span className="text-texto-fraco fr-numeros">{info.quantidade}</span>
            </button>
          );
        })}
      </div>

      <div className={cx("grid", !empilhado && "lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)]")}>
        <div className="min-w-0">
          {vista === "grafo" ? (
            desenho
          ) : (
            <div className="max-h-[44rem] overflow-y-auto p-3 sm:p-4">
              <ListaDoGrafo
                nos={nosVisiveis}
                arestas={arestasVisiveis}
                rotuloDe={rotuloDe}
                selecionado={selecionado}
                aoSelecionar={(id) => selecionar(id === selecionado ? null : id)}
                destaqueNos={destaqueCompleto?.nos}
              />
            </div>
          )}
        </div>
        <aside
          aria-label="Detalhes do grafo"
          className={cx("border-t border-borda p-4 sm:p-5", empilhado ? "max-h-[22rem] overflow-y-auto" : "lg:max-h-[clamp(30rem,68vh,44rem)] lg:overflow-y-auto lg:border-t-0 lg:border-l")}
        >
          {noSelecionado ? (
            <PainelDoNo
              key={noSelecionado.id}
              no={noSelecionado}
              arestas={dados.arestas}
              nos={dados.nos}
              rotuloDe={rotuloDe}
              aoFechar={() => {
                const id = noSelecionado.id;
                setSelecionado(null);
                if (vista === "grafo") focarNo(id);
              }}
              aoSelecionar={(id) => selecionar(id)}
              aoExpandir={() => expandir(noSelecionado.id)}
              expandindo={expandindo}
              mensagemDaExpansao={msgExpansao}
              aoBuscarCaminho={(para) => buscarCaminho(noSelecionado.id, para)}
              buscandoCaminho={buscandoCaminho}
              caminho={caminho}
              erroDoCaminho={erroDoCaminho}
              idDoTitulo={idDoTitulo}
            />
          ) : (
            <div className="flex flex-col gap-5 text-sm">
              <div>
                <h3 className="text-base font-semibold">Como ler este grafo</h3>
                <p className="mt-1 text-texto-suave">
                  Cada nó é uma entidade da base do MCU; cada linha, uma relação com evidência. Clique num nó para ver o que ele é, suas relações e as fontes.
                </p>
              </div>
              <div>
                <h4 className="text-xs font-medium text-texto-fraco">Papel na análise</h4>
                <ul className="mt-2 space-y-2">
                  {legendaPapeis.map(([p, info]) => (
                    <li key={p} className="flex items-center gap-3">
                      <AmostraDoPapel papel={p} />
                      <span>
                        <span className="font-medium">{info.rotulo}</span> <span className="text-texto-suave">— {info.descricao}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-medium text-texto-fraco">Linhas</h4>
                <ul className="mt-2 space-y-2 text-texto-suave">
                  <li className="flex items-center gap-3">
                    <svg width="28" height="8" aria-hidden="true">
                      <line x1="0" y1="4" x2="28" y2="4" className="stroke-texto-suave" strokeWidth="1.5" />
                    </svg>
                    Confirmada pelas fontes
                  </li>
                  <li className="flex items-center gap-3">
                    <svg width="28" height="8" aria-hidden="true">
                      <line x1="0" y1="4" x2="28" y2="4" className="stroke-texto-suave" strokeWidth="1.5" strokeDasharray="5 3" />
                    </svg>
                    Inferida
                  </li>
                  <li className="flex items-center gap-3">
                    <svg width="28" height="8" aria-hidden="true">
                      <line x1="0" y1="4" x2="28" y2="4" className="stroke-texto-suave" strokeWidth="1.5" strokeDasharray="2 3" />
                    </svg>
                    Hipotética
                  </li>
                  <li className="flex items-center gap-3">
                    <svg width="28" height="8" aria-hidden="true">
                      <line x1="0" y1="4" x2="28" y2="4" className="stroke-escarlate" strokeWidth="2" />
                    </svg>
                    Em destaque (seleção, cenário ou caminho)
                  </li>
                </ul>
              </div>
              {(destaqueCompleto || caminho) && (
                <Botao tamanho="pequeno" variante="fantasma" icone={<X />} onClick={limparTudo}>
                  Limpar destaque
                </Botao>
              )}
            </div>
          )}
        </aside>
      </div>
      <p className="sr-only" aria-live="polite">
        {passo !== null ? `Passo ${passo + 1} de ${grafo.sequencia.length}: ${grafo.sequencia[passo]?.motivo}` : destaqueCompleto ? `Destaque: ${destaqueCompleto.rotulo}` : ""}
      </p>
    </div>
  );
}

function AmostraDoPapel({ papel }: { papel: string }) {
  return (
    <svg width="22" height="22" viewBox="-11 -11 22 22" aria-hidden="true" className="shrink-0">
      {papel === "focal" && <circle r="10" className="fill-escarlate-brilho" />}
      {papel === "trajetoria" ? (
        <rect x="-6" y="-6" width="12" height="12" rx="3" className="fill-superficie-3 stroke-texto-suave" strokeWidth="1.5" />
      ) : (
        <circle
          r={papel === "focal" ? 7 : 6}
          className={cx("fill-superficie-3", papel === "focal" ? "stroke-escarlate" : "stroke-texto-suave")}
          strokeWidth={papel === "focal" ? 2 : 1.5}
          strokeDasharray={papel === "expansao" ? "2.5 2" : undefined}
        />
      )}
      {papel === "ponte" && <circle r="9" fill="none" className="stroke-texto-suave" strokeWidth="1" />}
    </svg>
  );
}

interface PropsDoNo {
  no: NoVisual;
  sim: NoSim | undefined;
  k: number;
  compacto: boolean;
  selecionado: boolean;
  apagado: boolean;
  rotulado: boolean;
  ativo: boolean;
  aoEntrar: () => void;
  aoSair: () => void;
  aoTeclar: (e: KeyboardEvent<SVGGElement>) => void;
  aoFocar: () => void;
  aoDesfocar: () => void;
}

function No({ no, sim, k, compacto, selecionado, apagado, rotulado, ativo, aoEntrar, aoSair, aoTeclar, aoFocar, aoDesfocar }: PropsDoNo) {
  if (!sim || sim.x === undefined || sim.y === undefined) return null;
  const r = sim.raio;
  const e = estiloDoTipo(no.tipo);
  const { Icone } = e;
  const focal = no.papel === "focal";
  const icone = r >= 9 ? r * 1.05 : 0;
  // ~11px na tela em qualquer zoom
  const fonte = 11 / Math.max(k, 0.5);
  const texto = no.rotulo.length > 26 ? `${no.rotulo.slice(0, 24)}…` : no.rotulo;
  return (
    <g
      transform={`translate(${sim.x.toFixed(1)},${sim.y.toFixed(1)})`}
      data-no-id={no.id}
      role="button"
      tabIndex={ativo ? 0 : -1}
      aria-label={`${no.rotulo}, ${e.rotulo.toLocaleLowerCase("pt-BR")}${focal ? ", entidade focal" : ""}`}
      aria-pressed={compacto ? undefined : selecionado}
      className={cx("cursor-pointer outline-none movimento:transition-opacity movimento:duration-150", apagado ? "opacity-25" : "opacity-100", "[&:focus-visible>.fr-anel-foco]:opacity-100")}
      onPointerEnter={aoEntrar}
      onPointerLeave={aoSair}
      onKeyDown={aoTeclar}
      onFocus={aoFocar}
      onBlur={aoDesfocar}
    >
      {focal && <circle r={r + 5} className="fill-escarlate-brilho" />}
      {no.papel === "trajetoria" ? (
        <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={r * 0.38} className={e.corpo} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      ) : (
        <circle
          r={r}
          className={cx(e.corpo, focal && "stroke-escarlate")}
          strokeWidth={focal ? 2.5 : 1.5}
          strokeDasharray={no.papel === "expansao" ? "3 2" : undefined}
          vectorEffect="non-scaling-stroke"
        />
      )}
      {no.papel === "ponte" && <circle r={r + 3.5} fill="none" className="stroke-texto-suave" strokeWidth={1} vectorEffect="non-scaling-stroke" />}
      {icone > 0 && <Icone x={-icone / 2} y={-icone / 2} width={icone} height={icone} strokeWidth={2} className={e.tinta} aria-hidden="true" />}
      {selecionado && <circle r={r + 6} fill="none" className="stroke-escarlate" strokeWidth={2} vectorEffect="non-scaling-stroke" />}
      <circle r={r + 6} fill="none" className="fr-anel-foco stroke-escarlate opacity-0" strokeWidth={2} strokeDasharray="3 2" vectorEffect="non-scaling-stroke" />
      {rotulado && (
        <text
          y={r + fonte + 2}
          textAnchor="middle"
          className={cx("pointer-events-none fill-texto stroke-superficie font-medium", focal && "font-semibold")}
          style={{ fontSize: `${fonte}px`, paintOrder: "stroke" }}
          strokeWidth={3 / Math.max(k, 0.6)}
          strokeLinejoin="round"
        >
          {texto}
        </text>
      )}
    </g>
  );
}
