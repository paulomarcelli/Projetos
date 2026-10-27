/**
 * Mapa geopolítico da seção Relações.
 *
 * Cartografia real (Natural Earth): cada país fica na sua capital, então a orientação espacial é
 * sempre a mesma. O que muda entre as vistas (Hoje, A, B, C) são as relações e os blocos:
 * linhas nascem, somem, mudam de natureza, engrossam ou afinam; territórios de um bloco mudam
 * quando um país entra ou sai. Toda linha vem de uma relação registrada na investigação.
 */
import { ChevronDown, List, Maximize2, Minus, Plus } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as PE } from "react";
import { RELACOES, type TipoRelacao } from "../Diagramas";
import { EPISTEMICO } from "../Epistemico";
import { LARGURA, ALTURA, prepararMapa } from "../../geo/mundo";
import type { Ator, Vista } from "../../lib/investigacao";
import { documentada, relacaoNaVista, statusDaRelacao, useResultado } from "./contexto";
import { Letra } from "./pecas";
import { PainelContextual } from "./PainelContextual";

const ESTILO = new Map(RELACOES.map((x) => [x.tipo, x]));
const VISTAS: Vista[] = ["presente", "A", "B", "C"];

/** Onde fica o rótulo de cada país em relação ao nó (evita sobreposição no Cone Sul e no Caribe). */
const ROTULO: Record<string, { dx: number; dy: number; ancora: "start" | "middle" | "end" }> = {
  brasil: { dx: 15, dy: 4, ancora: "start" },
  argentina: { dx: -13, dy: 4, ancora: "end" },
  paraguai: { dx: 12, dy: 12, ancora: "start" },
  colombia: { dx: -13, dy: 4, ancora: "end" },
  venezuela: { dx: 12, dy: -6, ancora: "start" },
  eua: { dx: 0, dy: -16, ancora: "middle" },
  china: { dx: 0, dy: -16, ancora: "middle" },
  franca: { dx: 0, dy: -16, ancora: "middle" },
};

/** Linguagem visual das mudanças entre hoje e um cenário: o mesmo glifo no mapa e na lista. */
const MUDANCA: { chave: "nova" | "transformada" | "reforcada" | "enfraquecida" | "ausente"; titulo: string; glifo: string }[] = [
  { chave: "nova", titulo: "Novas", glifo: "+" },
  { chave: "transformada", titulo: "Mudam de natureza", glifo: "⇄" },
  { chave: "reforcada", titulo: "Reforçadas", glifo: "↑" },
  { chave: "enfraquecida", titulo: "Enfraquecidas", glifo: "↓" },
  { chave: "ausente", titulo: "Deixam de existir", glifo: "×" },
];
const GLIFO = Object.fromEntries(MUDANCA.map((m) => [m.chave, m.glifo])) as Record<string, string>;
const curto = (t: string) => (ESTILO.get(t as TipoRelacao)?.rotulo.split(" / ")[0] ?? t).toLowerCase();

/** Ponto numa curva quadrática (t de 0 a 1). */
const naCurva = (p1: { x: number; y: number }, c: { x: number; y: number }, p2: { x: number; y: number }, t: number) => ({
  x: (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * c.x + t * t * p2.x,
  y: (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * c.y + t * t * p2.y,
});

type Base = "documentada" | "inferida" | "condicional";
const baseDe = (status: string): Base => (documentada(status) ? "documentada" : status === "inferencia" ? "inferida" : "condicional");

// ------------------------------------------------------------------ transição

const suave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Interpola presença e espessura das linhas; interrompível (parte de onde a anterior estava). */
function useTransicao(alvo: Record<string, number>, ms = 950) {
  const [atual, setAtual] = useState(alvo);
  const ref = useRef(alvo);
  useEffect(() => {
    const reduzir = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduzir || typeof requestAnimationFrame === "undefined") {
      ref.current = alvo;
      setAtual(alvo);
      return;
    }
    const de = ref.current;
    const t0 = performance.now();
    let raf = 0;
    const passo = (t: number) => {
      const k = suave(Math.min(1, (t - t0) / ms));
      const v: Record<string, number> = {};
      for (const c of Object.keys(alvo)) {
        const a = de[c] ?? alvo[c];
        v[c] = a + (alvo[c] - a) * k;
      }
      ref.current = v;
      setAtual(v);
      if (k < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [alvo, ms]);
  return atual;
}

// ------------------------------------------------------------------ camada de territórios (memoizada: não redesenha a cada quadro)

const Territorios = memo(function Territorios({
  envolvidos,
  brasil,
  selecionado,
  bloco,
}: {
  envolvidos: Set<string>;
  brasil: string | null;
  selecionado: string | null;
  bloco: Set<string> | null;
}) {
  const mapa = prepararMapa();
  return (
    <g aria-hidden="true">
      <path d={mapa.grade} fill="none" stroke="rgb(154 170 192 / 0.07)" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
      {mapa.paises.map((p) => {
        const env = envolvidos.has(p.id);
        return (
          <path
            key={p.id || p.d.slice(0, 20)}
            d={p.d}
            className="territorio"
            fill={p.id === selecionado ? "rgb(82 199 232 / 0.22)" : p.id === brasil ? "var(--color-terra-foco)" : env ? "var(--color-terra-envolvida)" : "var(--color-terra)"}
            stroke={env ? "rgb(154 170 192 / 0.45)" : "rgb(154 170 192 / 0.16)"}
            strokeWidth={env ? 0.8 : 0.5}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      {/* território dos membros do bloco em destaque (hachura), com transição de opacidade */}
      {mapa.paises
        .filter((p) => envolvidos.has(p.id))
        .map((p) => (
          <path
            key={`b-${p.id}`}
            d={p.d}
            fill="url(#hachura-bloco)"
            stroke="var(--color-texto-2)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            className="territorio-bloco"
            opacity={bloco?.has(p.id) ? 1 : 0}
          />
        ))}
    </g>
  );
});

// ------------------------------------------------------------------ mapa

export function MapaGeopolitico() {
  const { r, ix, vista, setVista, selecao, selecionar } = useResultado();
  const caixa = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [tela, setTela] = useState({ w: 900, h: 560 });
  const mapa = useMemo(() => prepararMapa(), []);

  const paises = useMemo(
    () =>
      r.atores
        .filter((a): a is Ator & { coord: [number, number]; isoNum: string } => a.tipo === "estado" && !!a.coord && !!a.isoNum)
        .map((a) => {
          const [x, y] = mapa.projetar(a.coord[0], a.coord[1]);
          return { a, x, y };
        }),
    [r.atores, mapa],
  );
  const ehPais = useMemo(() => new Set(paises.map((p) => p.a.id)), [paises]);
  const ponto = useMemo(() => new Map(paises.map((p) => [p.a.id, { x: p.x, y: p.y }])), [paises]);
  const blocoPorAtor = useMemo(() => new Map(r.blocos.map((b) => [b.ator, b])), [r.blocos]);

  // ---------------------------------------------------------------- enquadramento
  const estreito = tela.w < 640;
  const enquadrar = useCallback(() => {
    // Em tela estreita, o mundo inteiro fica pequeno demais: começa pelas Américas (arraste para o resto).
    const foco = tela.w < 640 ? paises.filter((p) => p.a.coord[0] < -30) : paises;
    const xs = foco.map((p) => p.x);
    const ys = foco.map((p) => p.y);
    const pad = 22;
    const x0 = Math.min(...xs) - pad;
    const x1 = Math.max(...xs) + pad;
    const y0 = Math.min(...ys) - pad;
    const y1 = Math.max(...ys) + pad;
    // Reserva espaço em pixels para o seletor (em cima) e a legenda (embaixo): nada importante fica escondido.
    const topo = tela.w < 640 ? 160 : 170;
    const base = 64;
    const lado = 24;
    const larguraUtil = Math.max(120, tela.w - lado * 2);
    const alturaUtil = Math.max(120, tela.h - topo - base);
    const k = Math.min(larguraUtil / (x1 - x0), alturaUtil / (y1 - y0)); // pixels por unidade
    const w = tela.w / k;
    const h = tela.h / k;
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const centroUtilY = topo + alturaUtil / 2; // em pixels
    return { x: cx - w / 2, y: cy - centroUtilY / k, w, h };
  }, [paises, tela]);
  const [vb, setVb] = useState(() => ({ x: 0, y: 0, w: LARGURA, h: ALTURA }));
  useEffect(() => {
    const el = caixa.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      const rc = el.getBoundingClientRect();
      if (rc.width > 0 && rc.height > 0) setTela({ w: rc.width, h: rc.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Reenquadra quando a área muda de tamanho; a troca de cenário NÃO mexe no zoom.
  useEffect(() => {
    setVb(enquadrar());
  }, [enquadrar]);

  const s = vb.w / tela.w; // unidades do quadro por pixel de tela

  // ---------------------------------------------------------------- relações desenhadas
  const desenhaveis = useMemo(
    () =>
      r.relacoes.filter((rel) => {
        const a = ehPais.has(rel.de) || blocoPorAtor.has(rel.de);
        const b = ehPais.has(rel.para) || blocoPorAtor.has(rel.para);
        if (!a || !b) return false;
        const bloco = blocoPorAtor.get(rel.para) ?? blocoPorAtor.get(rel.de);
        const pais = ehPais.has(rel.de) ? rel.de : rel.para;
        return !(bloco && VISTAS.some((x) => bloco.membros[x].includes(pais)));
      }),
    [r.relacoes, ehPais, blocoPorAtor],
  );
  const [ocultas, setOcultas] = useState<Set<TipoRelacao>>(new Set());

  const alvo = useMemo(() => {
    const a: Record<string, number> = {};
    for (const rel of desenhaveis) {
      const nv = relacaoNaVista(rel, vista);
      const visivel = nv.visivel && !ocultas.has(nv.tipo);
      for (const t of RELACOES) a[`${rel.id}|${t.tipo}`] = visivel && nv.tipo === t.tipo ? 1 : 0;
      const m = nv.estado?.mudanca;
      a[`${rel.id}|w`] = m === "reforcada" ? 1.7 : m === "enfraquecida" ? 0.55 : 1;
      a[`${rel.id}|o`] = m === "enfraquecida" ? 0.55 : 1;
    }
    return a;
  }, [desenhaveis, vista, ocultas]);
  const v = useTransicao(alvo);

  // âncora de bloco (ex.: França → Mercosul): centro das capitais dos membros nesta vista
  const ancora = (atorId: string) => {
    const b = blocoPorAtor.get(atorId);
    if (!b) return ponto.get(atorId) ?? { x: 0, y: 0 };
    const ms = b.membros[vista].map((m) => ponto.get(m)).filter(Boolean) as { x: number; y: number }[];
    // Centro das capitais, deslocado para o oceano para não cobrir a capital de um membro.
    return { x: ms.reduce((t, q) => t + q.x, 0) / ms.length + 34, y: ms.reduce((t, q) => t + q.y, 0) / ms.length + 22 };
  };
  const ancorasUsadas = [...new Set(desenhaveis.flatMap((rel) => [rel.de, rel.para]).filter((id) => blocoPorAtor.has(id)))];

  // ---------------------------------------------------------------- seleção, foco, blocos
  const atorSel = selecao?.tipo === "ator" ? selecao.id : null;
  const relSel = selecao?.tipo === "relacao" ? selecao.id : null;
  const [sobre, setSobre] = useState<string | null>(null);
  /** Relação em destaque pelo cursor (no mapa ou na lista de mudanças). */
  const [relSobre, setRelSobre] = useState<string | null>(null);
  const focoRel = relSobre ?? relSel;
  const focoAtor = sobre ?? (atorSel && ehPais.has(atorSel) ? atorSel : null);
  const vizinhos = useMemo(() => {
    if (!focoAtor) return null;
    const vis = desenhaveis.filter((rel) => relacaoNaVista(rel, vista).visivel && (rel.de === focoAtor || rel.para === focoAtor));
    return new Set([focoAtor, ...vis.flatMap((rel) => [rel.de, rel.para])]);
  }, [focoAtor, desenhaveis, vista]);
  const [blocoAtivo, setBlocoAtivo] = useState<string | null>(null);
  const blocoSelecionado = atorSel && blocoPorAtor.has(atorSel) ? blocoPorAtor.get(atorSel)!.id : null;
  const blocoMostrado = blocoSelecionado ?? blocoAtivo;
  const territoriosDoBloco = useMemo(() => {
    const b = r.blocos.find((x) => x.id === blocoMostrado);
    if (!b) return null;
    return new Set(b.membros[vista].map((m) => ix.atores.get(m)?.isoNum).filter(Boolean) as string[]);
  }, [blocoMostrado, r.blocos, vista, ix]);
  const envolvidos = useMemo(() => new Set(paises.map((p) => p.a.isoNum)), [paises]);
  const isoSel = atorSel ? (ix.atores.get(atorSel)?.isoNum ?? null) : null;

  // ---------------------------------------------------------------- zoom e arraste (o zoom sobrevive à troca de cenário)
  const limitar = useCallback(
    (n: { x: number; y: number; w: number; h: number }) => {
      const aspecto = tela.h / tela.w;
      const w = Math.min(LARGURA * 1.2, Math.max(90, n.w));
      const h = w * aspecto;
      return { w, h, x: Math.min(LARGURA - w * 0.2, Math.max(-w * 0.8, n.x)), y: Math.min(ALTURA - h * 0.2, Math.max(-h * 0.8, n.y)) };
    },
    [tela],
  );
  const zoom = useCallback(
    (fator: number, cx?: number, cy?: number) =>
      setVb((a) => {
        const px = cx ?? a.x + a.w / 2;
        const py = cy ?? a.y + a.h / 2;
        return limitar({ x: px - ((px - a.x) / a.w) * a.w * fator, y: py - ((py - a.y) / a.h) * a.h * fator, w: a.w * fator, h: a.h * fator });
      }),
    [limitar],
  );
  const mover = useCallback((dx: number, dy: number) => setVb((a) => limitar({ ...a, x: a.x + dx * a.w, y: a.y + dy * a.h })), [limitar]);
  const ponteiros = useRef(new Map<number, { x: number; y: number }>());
  const arrasto = useRef({ moveu: 0, distancia: 0 });
  const paraQuadro = (cx: number, cy: number) => {
    const rc = svg.current!.getBoundingClientRect();
    return { x: vb.x + ((cx - rc.left) / rc.width) * vb.w, y: vb.y + ((cy - rc.top) / rc.height) * vb.h };
  };
  const aoBaixar = (e: PE<SVGSVGElement>) => {
    ponteiros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    arrasto.current.moveu = 0;
    if (ponteiros.current.size === 2) {
      const [a, b] = [...ponteiros.current.values()];
      arrasto.current.distancia = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };
  const aoMover = (e: PE<SVGSVGElement>) => {
    const antes = ponteiros.current.get(e.pointerId);
    if (!antes) return;
    const agora = { x: e.clientX, y: e.clientY };
    ponteiros.current.set(e.pointerId, agora);
    const rc = svg.current!.getBoundingClientRect();
    if (ponteiros.current.size === 2) {
      const [a, b] = [...ponteiros.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (arrasto.current.distancia > 0) {
        const c = paraQuadro((a.x + b.x) / 2, (a.y + b.y) / 2);
        zoom(arrasto.current.distancia / d, c.x, c.y);
      }
      arrasto.current.distancia = d;
      arrasto.current.moveu += 10;
      return;
    }
    const dx = agora.x - antes.x;
    const dy = agora.y - antes.y;
    arrasto.current.moveu += Math.abs(dx) + Math.abs(dy);
    if (arrasto.current.moveu > 4) {
      if (!svg.current!.hasPointerCapture(e.pointerId)) svg.current!.setPointerCapture(e.pointerId);
      setDica(null);
      setVb((a) => limitar({ ...a, x: a.x - (dx / rc.width) * a.w, y: a.y - (dy / rc.height) * a.h }));
    }
  };
  const aoSoltar = (e: PE<SVGSVGElement>) => {
    ponteiros.current.delete(e.pointerId);
    if (ponteiros.current.size < 2) arrasto.current.distancia = 0;
  };
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const roda = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rc = el.getBoundingClientRect();
      setVb((a) => {
        const px = a.x + ((e.clientX - rc.left) / rc.width) * a.w;
        const py = a.y + ((e.clientY - rc.top) / rc.height) * a.h;
        const f = Math.exp(e.deltaY * 0.0025);
        return limitar({ x: px - ((px - a.x) / a.w) * a.w * f, y: py - ((py - a.y) / a.h) * a.h * f, w: a.w * f, h: a.h * f });
      });
    };
    el.addEventListener("wheel", roda, { passive: false });
    return () => el.removeEventListener("wheel", roda);
  }, [limitar]);
  // Teclado no mapa: setas movem, + e − ampliam, 0 enquadra.
  const tecladoMapa = (e: KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    const acoes: Record<string, () => void> = {
      ArrowLeft: () => mover(-0.12, 0),
      ArrowRight: () => mover(0.12, 0),
      ArrowUp: () => mover(0, -0.12),
      ArrowDown: () => mover(0, 0.12),
      "+": () => zoom(0.8),
      "=": () => zoom(0.8),
      "-": () => zoom(1.25),
      "0": () => setVb(enquadrar()),
    };
    const fn = acoes[e.key];
    if (fn) {
      e.preventDefault();
      fn();
    }
  };
  const clique = (fn: () => void) => () => {
    if (arrasto.current.moveu > 6) return;
    fn();
  };
  const ativar = (fn: () => void) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };

  // ---------------------------------------------------------------- dica
  const [dica, setDica] = useState<{ x: number; y: number; titulo: string; texto: string } | null>(null);
  const mostrarDica = (pt: { x: number; y: number }, titulo: string, texto: string) =>
    setDica({ x: ((pt.x - vb.x) / vb.w) * tela.w, y: ((pt.y - vb.y) / vb.h) * tela.h, titulo, texto });

  // ---------------------------------------------------------------- textos da vista
  const nome = (id: string) => ix.atores.get(id)?.curto ?? id;
  const cenario = vista === "presente" ? null : r.cenarios.find((c) => c.id === vista)!;
  const mudancas = useMemo(() => (vista === "presente" ? [] : desenhaveis.map((rel) => relacaoNaVista(rel, vista)).filter((x) => x.mudou)), [desenhaveis, vista]);
  const mudancasDeBloco = useMemo(() => {
    if (vista === "presente") return [] as { texto: string; bloco: string }[];
    const out: { texto: string; bloco: string }[] = [];
    for (const bl of r.blocos) {
      for (const m of bl.membros[vista]) if (!bl.membros.presente.includes(m)) out.push({ texto: `${nome(m)} entra no ${bl.nome}`, bloco: bl.id });
      for (const m of bl.membros.presente) if (!bl.membros[vista].includes(m)) out.push({ texto: `${nome(m)} sai do ${bl.nome}`, bloco: bl.id });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.blocos, vista]);
  const visiveis = desenhaveis.map((rel) => relacaoNaVista(rel, vista)).filter((x) => x.visivel);
  const presentes = RELACOES.filter((e) => visiveis.some((x) => x.tipo === e.tipo));
  const bases = new Set(visiveis.map((x) => baseDe(statusDaRelacao(x.rel, vista))));
  const [listaAberta, setListaAberta] = useState(false);
  const [legendaAberta, setLegendaAberta] = useState(false);
  const [mudancasAbertas, setMudancasAbertas] = useState(false);
  useEffect(() => {
    if (vista !== "presente" && tela.w >= 1024) setMudancasAbertas(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista]);

  // ---------------------------------------------------------------- render
  return (
    <div
      ref={caixa}
      className="mapa-geo relative h-full min-h-[440px] w-full overflow-hidden rounded-painel border border-linha"
      tabIndex={0}
      role="region"
      aria-label="Mapa de relações. Setas movem, + e − ampliam, 0 enquadra. Tab percorre países e conexões."
      onKeyDown={tecladoMapa}
    >
      <svg
        ref={svg}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
        role="group"
        aria-label={`Relações entre países, ${cenario ? `cenário ${cenario.id}: ${cenario.nome}` : "situação observada em 2026"}`}
        onPointerDown={aoBaixar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
        onClick={(e) => {
          if (arrasto.current.moveu > 6) return;
          const alvoEl = e.target as Element;
          if (alvoEl === svg.current || alvoEl.classList.contains("territorio") || alvoEl.classList.contains("territorio-bloco")) selecionar(null);
        }}
      >
        <defs>
          <pattern id="hachura-bloco" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="5" height="5" fill="rgb(143 218 240 / 0.07)" />
            <line x1="0" y1="0" x2="0" y2="5" stroke="rgb(143 218 240 / 0.45)" strokeWidth="1.2" />
          </pattern>
          <filter id="brilho" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
          <filter id="brilho-linha" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>

        <Territorios envolvidos={envolvidos} brasil={ix.atores.get("brasil")?.isoNum ?? null} selecionado={isoSel} bloco={territoriosDoBloco} />

        {/* conexões: arcos entre capitais. Cada tipo é uma camada desenhada da origem ao destino;
            ao trocar de cenário, a camada antiga recolhe e a nova é traçada. */}
        {desenhaveis.map((rel) => {
          const a = ehPais.has(rel.de) ? ponto.get(rel.de)! : ancora(rel.de);
          const b = ehPais.has(rel.para) ? ponto.get(rel.para)! : ancora(rel.para);
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 1;
          let nx = -dy / dist;
          let ny = dx / dist;
          if (ny > 0) {
            nx = -nx;
            ny = -ny;
          }
          const mesmos = desenhaveis.filter((x) => [x.de, x.para].sort().join() === [rel.de, rel.para].sort().join());
          const ordem = mesmos.indexOf(rel);
          const curva = dist * (0.2 + ordem * 0.16);
          const c = { x: (a.x + b.x) / 2 + nx * curva, y: (a.y + b.y) / 2 + ny * curva };
          const recuo = 9 * s;
          const t1 = Math.hypot(c.x - a.x, c.y - a.y) || 1;
          const t2 = Math.hypot(c.x - b.x, c.y - b.y) || 1;
          const p1 = { x: a.x + ((c.x - a.x) / t1) * recuo, y: a.y + ((c.y - a.y) / t1) * recuo };
          const p2 = { x: b.x + ((c.x - b.x) / t2) * recuo, y: b.y + ((c.y - b.y) / t2) * recuo };
          const d = `M${p1.x} ${p1.y} Q${c.x} ${c.y} ${p2.x} ${p2.y}`;
          const meio = naCurva(p1, c, p2, 0.5);
          const marca = naCurva(p1, c, p2, 0.3);
          const ux = (p2.x - c.x) / t2;
          const uy = (p2.y - c.y) / t2;
          const L = 7 * s;
          const seta = `M${p2.x - ux * L - uy * L * 0.55} ${p2.y - uy * L + ux * L * 0.55} L${p2.x} ${p2.y} L${p2.x - ux * L + uy * L * 0.55} ${p2.y - uy * L - ux * L * 0.55}`;
          const nv = relacaoNaVista(rel, vista);
          const presenca = Math.max(...RELACOES.map((x) => v[`${rel.id}|${x.tipo}`] ?? 0));
          // Relação que existe hoje e some no cenário: fica como fantasma, com o selo ×.
          const fantasma = vista !== "presente" && rel.presente !== null && !nv.visivel;
          if (presenca < 0.01 && !fantasma) return null;
          const sel = relSel === rel.id;
          const emFoco = focoRel === rel.id;
          const apagada = (vizinhos && !(vizinhos.has(rel.de) && vizinhos.has(rel.para))) || (focoRel && !emFoco);
          const base = baseDe(statusDaRelacao(rel, vista));
          const largura = v[`${rel.id}|w`];
          const tipoTexto = ESTILO.get(nv.tipo)?.rotulo.split(" / ")[0];
          const rotulo = `${nome(rel.de)} → ${nome(rel.para)} · ${tipoTexto}`;
          const mudanca = nv.mudou && nv.estado ? nv.estado.mudanca : fantasma ? "ausente" : null;
          const resumoMudanca =
            mudanca === "transformada"
              ? `Muda de ${curto(rel.tipo)} para ${curto(nv.tipo)}`
              : mudanca === "nova"
                ? "Nova neste cenário"
                : mudanca === "reforcada"
                  ? "Reforçada neste cenário"
                  : mudanca === "enfraquecida"
                    ? "Enfraquecida neste cenário"
                    : mudanca === "ausente"
                      ? "Deixa de existir neste cenário"
                      : "";
          const dicaTexto = `${resumoMudanca ? `${resumoMudanca}. ` : ""}${nv.visivel ? nv.texto : rel.presente?.texto ?? ""}`;
          const acao = () => selecionar({ tipo: "relacao", id: rel.id });
          const extra = (sel ? 1 : 0) + (emFoco ? 0.8 : 0);
          return (
            <g
              key={rel.id}
              role="button"
              tabIndex={nv.visivel || fantasma ? 0 : -1}
              aria-hidden={!nv.visivel && !fantasma}
              aria-pressed={sel}
              aria-label={`${rotulo}. ${resumoMudanca ? `${resumoMudanca}. ` : ""}${(nv.visivel ? nv.texto : rel.presente?.texto ?? "").replace(/\.$/, "")}. ${EPISTEMICO[statusDaRelacao(rel, vista)].rotulo}.`}
              className="conexao cursor-pointer outline-none"
              opacity={(apagada ? 0.14 : 1) * (fantasma ? 1 : v[`${rel.id}|o`])}
              onClick={clique(acao)}
              onKeyDown={ativar(acao)}
              onPointerEnter={() => {
                setRelSobre(rel.id);
                mostrarDica(meio, rotulo, dicaTexto);
              }}
              onPointerLeave={() => {
                setRelSobre(null);
                setDica(null);
              }}
              onFocus={() => {
                setRelSobre(rel.id);
                mostrarDica(meio, rotulo, dicaTexto);
              }}
              onBlur={() => {
                setRelSobre(null);
                setDica(null);
              }}
            >
              {fantasma ? (
                <path d={d} fill="none" stroke="var(--color-texto-3)" strokeWidth={1.2} strokeDasharray="2 6" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={0.6} />
              ) : (
                <>
                  {/* halo de seleção */}
                  <path className="conexao-halo" d={d} fill="none" stroke="var(--color-ciano)" strokeWidth={10} strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={sel ? 0.28 : 0} />
                  {/* o que mudou brilha uma vez ao trocar de cenário */}
                  {nv.mudou && <path key={`m-${vista}`} className="realce-mudanca" d={d} fill="none" stroke="var(--color-ambar)" strokeWidth={9} strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
                  {RELACOES.map((e) => {
                    const p = v[`${rel.id}|${e.tipo}`] ?? 0;
                    if (p < 0.01) return null;
                    const traco = p < 0.995; // ainda sendo desenhada (ou recolhida)
                    const idMascara = `tr-${rel.id}-${e.tipo}`;
                    const w = e.espessura * largura + extra;
                    return (
                      <g key={e.tipo} mask={traco ? `url(#${idMascara})` : undefined}>
                        {traco && (
                          <mask id={idMascara} maskUnits="userSpaceOnUse" x={-500} y={-500} width={LARGURA + 1000} height={ALTURA + 1000}>
                            {/* revela o traço da origem (0) ao destino (1) */}
                            <path d={d} fill="none" stroke="white" strokeWidth={40 * s} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
                          </mask>
                        )}
                        {/* brilho suave sob a linha */}
                        <path d={d} fill="none" stroke={e.cor} strokeWidth={w + 4} strokeLinecap="round" vectorEffect="non-scaling-stroke" filter="url(#brilho-linha)" opacity={emFoco || sel ? 0.55 : 0.22} className="conexao-brilho" />
                        <path
                          d={d}
                          fill="none"
                          stroke={e.cor}
                          style={{ strokeWidth: w }}
                          strokeDasharray={e.traco || undefined}
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                          className="conexao-linha"
                        />
                        {e.seta && (
                          <>
                            <path d={seta} fill="none" stroke={e.cor} strokeWidth={1.7} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                            {/* sentido documentado: cometa luminoso da origem ao destino */}
                            {!traco && (
                              <>
                                <path d={d} fill="none" stroke="var(--color-luz)" strokeWidth={5} strokeDasharray="1 27" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="fluxo-luz" filter="url(#brilho)" opacity={0.75} />
                                <path d={d} fill="none" stroke="var(--color-luz)" strokeWidth={2.2} strokeDasharray="1 27" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="fluxo-luz" />
                              </>
                            )}
                          </>
                        )}
                      </g>
                    );
                  })}
                </>
              )}
              <path d={d} fill="none" stroke="transparent" strokeWidth={18} vectorEffect="non-scaling-stroke" pointerEvents="stroke" />
              {!fantasma && base !== "documentada" && (
                <g opacity={presenca}>
                  {base === "inferida" ? (
                    <circle cx={marca.x} cy={marca.y} r={3.4 * s} fill="var(--color-abismo)" stroke="var(--color-texto-2)" strokeWidth={1.3} strokeDasharray="2 1.6" vectorEffect="non-scaling-stroke" />
                  ) : (
                    <path
                      d={`M${marca.x} ${marca.y - 4.2 * s} L${marca.x + 4.2 * s} ${marca.y} L${marca.x} ${marca.y + 4.2 * s} L${marca.x - 4.2 * s} ${marca.y}Z`}
                      fill="var(--color-abismo)"
                      stroke="var(--color-ambar)"
                      strokeWidth={1.3}
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                </g>
              )}
              {/* selo da mudança no meio da linha: o mesmo glifo da lista "O que mudou" */}
              {mudanca && (
                <g key={`selo-${vista}`} className="selo-mudanca" style={{ transformOrigin: `${meio.x}px ${meio.y}px` }}>
                  <circle cx={meio.x} cy={meio.y} r={8 * s} fill="var(--color-abismo)" stroke="var(--color-ambar)" strokeWidth={emFoco ? 2 : 1.3} vectorEffect="non-scaling-stroke" />
                  <text x={meio.x} y={meio.y + 3.6 * s} textAnchor="middle" fill="var(--color-ambar)" style={{ font: `700 ${10.5 * s}px var(--font-interface)` }}>
                    {GLIFO[mudanca]}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* âncoras de bloco (destino de relações com o bloco inteiro) */}
        {ancorasUsadas.map((id) => {
          const p = ancora(id);
          const b = blocoPorAtor.get(id)!;
          return (
            <g
              key={id}
              role="button"
              tabIndex={0}
              aria-label={`Bloco ${b.nome}: ${b.membros[vista].map(nome).join(", ")}`}
              className="cursor-pointer outline-none"
              onClick={clique(() => selecionar({ tipo: "ator", id }))}
              onKeyDown={ativar(() => selecionar({ tipo: "ator", id }))}
              onPointerEnter={() => setBlocoAtivo(b.id)}
              onPointerLeave={() => setBlocoAtivo(null)}
            >
              <rect x={p.x - 5 * s} y={p.y - 5 * s} width={10 * s} height={10 * s} rx={2 * s} fill="var(--color-abismo)" stroke="var(--color-texto-2)" strokeWidth={1.3} vectorEffect="non-scaling-stroke" />
              <text x={p.x} y={p.y + 17 * s} textAnchor="middle" fill="var(--color-texto-2)" stroke="var(--color-abismo)" strokeWidth={3 * s} paintOrder="stroke" style={{ font: `600 ${9.5 * s}px var(--font-interface)`, letterSpacing: "0.08em" }}>
                {b.nome.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* países */}
        {paises.map(({ a, x, y }) => {
          const sel = atorSel === a.id;
          const apagado = vizinhos && !vizinhos.has(a.id);
          const ehBrasil = a.id === "brasil";
          const raio = (ehBrasil ? 7.5 : 6) * s;
          const rot = ROTULO[a.id] ?? { dx: 0, dy: -14, ancora: "middle" as const };
          const nota = a.notaNoMapa?.[vista];
          const crise = ehBrasil && vista === "C";
          const acao = () => selecionar({ tipo: "ator", id: a.id });
          const texto = vista === "presente" ? a.papel : a.implicacoes[vista];
          return (
            <g
              key={a.id}
              role="button"
              tabIndex={0}
              aria-pressed={sel}
              aria-label={`${a.nome}. ${texto}`}
              className="no-pais cursor-pointer outline-none"
              data-ativo={sel || sobre === a.id || undefined}
              opacity={apagado ? 0.35 : 1}
              onClick={clique(acao)}
              onKeyDown={ativar(acao)}
              onPointerEnter={() => {
                setSobre(a.id);
                mostrarDica({ x, y }, a.nome, texto);
              }}
              onPointerLeave={() => {
                setSobre(null);
                setDica(null);
              }}
              onFocus={() => {
                setSobre(a.id);
                mostrarDica({ x, y }, a.nome, texto);
              }}
              onBlur={() => {
                setSobre(null);
                setDica(null);
              }}
            >
              <circle cx={x} cy={y} r={20 * s} fill="transparent" />
              {crise && <circle className="pulso-crise" cx={x} cy={y} r={raio + 7 * s} fill="none" stroke="var(--color-ambar)" strokeWidth={1.3} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />}
              <g className="no-pais-marca" style={{ transformOrigin: `${x}px ${y}px` }}>
                <circle cx={x} cy={y} r={raio + 4 * s} fill="none" stroke={sel ? "var(--color-ciano)" : "rgb(243 246 250 / 0.25)"} strokeWidth={sel ? 1.6 : 1} vectorEffect="non-scaling-stroke" />
                <circle cx={x} cy={y} r={raio} fill={ehBrasil ? "var(--color-texto)" : "var(--color-no)"} stroke="var(--color-texto)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
              </g>
              <text
                x={x + rot.dx * s}
                y={y + rot.dy * s}
                textAnchor={rot.ancora}
                fill={sel ? "var(--color-ciano-texto)" : "var(--color-texto)"}
                stroke="var(--color-abismo)"
                strokeWidth={3.5 * s}
                paintOrder="stroke"
                style={{ font: `${ehBrasil ? 600 : 500} ${12.5 * s}px var(--font-interface)` }}
              >
                {a.curto}
              </text>
              {nota && (
                <text
                  key={`${a.id}-${vista}`}
                  className="aparecer"
                  x={x + rot.dx * s}
                  y={y + rot.dy * s + 13 * s}
                  textAnchor={rot.ancora}
                  fill={crise ? "var(--color-ambar)" : "var(--color-texto-3)"}
                  stroke="var(--color-abismo)"
                  strokeWidth={3.5 * s}
                  paintOrder="stroke"
                  style={{ font: `500 ${10 * s}px var(--font-interface)` }}
                >
                  {nota}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* ------------------------------------------------ seletor de cenários (mesma investigação) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 p-2.5 sm:p-3">
        <div className="pointer-events-auto flex w-fit max-w-full flex-wrap items-center gap-1 rounded-padrao border border-linha bg-abismo/85 p-1 backdrop-blur-md" role="group" aria-label="Vista do mapa: hoje ou um dos cenários da investigação">
          {VISTAS.map((vv, i) => {
            const c = vv === "presente" ? null : r.cenarios.find((x) => x.id === vv)!;
            const ativo = vista === vv;
            return (
              <div key={vv} className="flex items-center">
                {i === 1 && <span aria-hidden="true" className="mx-1 h-5 w-px bg-linha-forte" />}
                <button
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => setVista(vv)}
                  title={c ? `${c.arquetipo}: ${c.nome}` : "Situação observada em 2026"}
                  className={`seletor-cenario flex min-h-9 items-center gap-1.5 rounded-fino px-2.5 text-legenda transition-colors duration-150 ${
                    ativo ? (c ? "bg-ambar-suave text-ambar" : "bg-ciano-suave text-ciano-texto") : "text-texto-2 hover:bg-grafite hover:text-texto"
                  }`}
                >
                  {c ? (
                    <>
                      <span className="hidden sm:inline">Cenário</span> <span className="font-dados">{c.id}</span>
                    </>
                  ) : (
                    "Hoje"
                  )}
                </button>
              </div>
            );
          })}
        </div>
        <div key={vista} className="aparecer pointer-events-none flex w-fit max-w-[min(25rem,100%)] flex-col gap-1 rounded-padrao border border-linha bg-abismo/80 px-3 py-2 backdrop-blur-md">
          <p className="flex items-center gap-2 text-corpo text-texto">
            {cenario && <Letra id={cenario.id} ativa />}
            <span className="font-editorial">{cenario ? cenario.nome : "Hoje: o sistema observado em 2026"}</span>
            {cenario && <span className="hidden text-micro text-texto-3 sm:inline">{cenario.arquetipo}</span>}
          </p>
          {cenario && <p className="hidden text-legenda text-texto-2 sm:block">{cenario.ideia}</p>}
          {estreito && <p className="text-micro text-texto-3">Arraste para ver Europa e Ásia</p>}
        </div>
      </div>

      {cenario && !selecao && (
            <div
              key={`mud-${vista}`}
              className="aparecer absolute right-2.5 bottom-14 left-2.5 z-20 rounded-padrao border border-ambar/30 bg-abismo/88 px-3 py-1.5 backdrop-blur-md sm:right-3 sm:bottom-3 sm:left-auto sm:w-[19rem]"
            >
              <button
                type="button"
                aria-expanded={mudancasAbertas}
                onClick={() => setMudancasAbertas((x) => !x)}
                className="pointer-events-auto flex min-h-8 w-full items-center justify-between gap-2 text-legenda text-ambar"
              >
                <span>
                  O que mudou em relação a hoje <span className="numeros font-dados">· {mudancas.length + mudancasDeBloco.length}</span>
                </span>
                <ChevronDown size={14} aria-hidden="true" className={`transition-transform duration-200 ${mudancasAbertas ? "rotate-180" : ""}`} />
              </button>
              {mudancasAbertas && (
                <div className="pointer-events-auto flex max-h-[min(19rem,30dvh)] flex-col gap-2 overflow-y-auto pt-1 pb-0.5 sm:max-h-[min(21rem,48dvh)]" onPointerLeave={() => setRelSobre(null)}>
                  {MUDANCA.map((g) => {
                    const itens = mudancas.filter((l) => l.estado?.mudanca === g.chave);
                    if (itens.length === 0) return null;
                    return (
                      <section key={g.chave} aria-label={g.titulo}>
                        <p className="mb-0.5 flex items-center gap-1.5 text-micro text-texto-3">
                          <span aria-hidden="true" className="grid size-4 place-items-center rounded-full border border-ambar/60 text-[0.625rem] font-bold text-ambar">
                            {g.glifo}
                          </span>
                          {g.titulo}
                        </p>
                        <ul className="m-0 flex list-none flex-col p-0">
                          {itens.map((l) => (
                            <li key={l.rel.id}>
                              <button
                                type="button"
                                onPointerEnter={() => setRelSobre(l.rel.id)}
                                onFocus={() => setRelSobre(l.rel.id)}
                                onBlur={() => setRelSobre(null)}
                                onClick={() => selecionar({ tipo: "relacao", id: l.rel.id })}
                                className={`flex w-full flex-col rounded-fino px-1.5 py-1 text-left transition-colors duration-150 ${relSobre === l.rel.id ? "bg-grafite" : "hover:bg-grafite"}`}
                              >
                                <span className="text-legenda text-texto">
                                  {nome(l.rel.de)} → {nome(l.rel.para)}
                                  {g.chave === "transformada" && (
                                    <span className="text-texto-2">
                                      {" "}
                                      · {curto(l.rel.tipo)} <span className="text-ambar">→</span> {curto(l.tipo)}
                                    </span>
                                  )}
                                </span>
                                <span className="text-micro text-texto-3">{l.visivel ? l.texto : l.rel.presente?.texto}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </section>
                    );
                  })}
                  {mudancasDeBloco.length > 0 && (
                    <section aria-label="Blocos">
                      <p className="mb-0.5 flex items-center gap-1.5 text-micro text-texto-3">
                        <span aria-hidden="true" className="size-4 rounded-sm border border-ciano/60 bg-[repeating-linear-gradient(45deg,rgb(143_218_240/0.5)_0_1px,transparent_1px_4px)]" />
                        Blocos (no território)
                      </p>
                      <ul className="m-0 flex list-none flex-col p-0">
                        {mudancasDeBloco.map((m) => (
                          <li key={m.texto}>
                            <button
                              type="button"
                              onClick={() => setBlocoAtivo((x) => (x === m.bloco ? null : m.bloco))}
                              aria-pressed={blocoAtivo === m.bloco}
                              className={`w-full rounded-fino px-1.5 py-1 text-left text-legenda text-texto transition-colors duration-150 ${blocoAtivo === m.bloco ? "bg-ciano-suave" : "hover:bg-grafite"}`}
                            >
                              {m.texto}
                              <span className="block text-micro text-texto-3">{blocoAtivo === m.bloco ? "Destacado no mapa" : "Clique para ver no mapa"}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}
            </div>
          )}

      {/* estado vazio */}
      {visiveis.length === 0 && (
        <div className="absolute inset-0 z-10 grid place-items-center p-6">
          <p className="max-w-sm rounded-padrao border border-linha bg-abismo/90 p-4 text-center text-legenda text-texto-2">
            {cenario ? `O cenário ${cenario.id} não tem relações entre países registradas nesta investigação.` : "Não há relações entre países registradas para hoje."}
          </p>
        </div>
      )}

      {/* dica */}
      {dica && (
        <div
          role="tooltip"
          className={`pointer-events-none absolute z-20 w-max max-w-[15rem] -translate-x-1/2 rounded-padrao border border-linha-forte bg-abismo/95 px-2.5 py-1.5 shadow-lg backdrop-blur-sm ${dica.y < 150 ? "translate-y-5" : "-translate-y-[calc(100%+14px)]"}`}
          style={{ left: Math.min(Math.max(dica.x, 125), tela.w - 125), top: dica.y }}
        >
          <p className="text-legenda font-medium text-texto">{dica.titulo}</p>
          <p className="text-micro text-texto-2">{dica.texto}</p>
        </div>
      )}

      {/* ------------------------------------------------ zoom (canto superior direito, fora do caminho do painel) */}
      <div className="absolute top-2.5 right-2.5 z-20 flex rounded-padrao border border-linha bg-abismo/85 p-0.5 backdrop-blur-md sm:top-3 sm:right-3" role="group" aria-label="Zoom">
        <button type="button" className="botao botao-fantasma botao-pequeno size-10 p-0" aria-label="Aproximar" onClick={() => zoom(0.75)}>
          <Plus size={16} aria-hidden="true" />
        </button>
        <button type="button" className="botao botao-fantasma botao-pequeno size-10 p-0" aria-label="Afastar" onClick={() => zoom(1 / 0.75)}>
          <Minus size={16} aria-hidden="true" />
        </button>
        <button type="button" className="botao botao-fantasma botao-pequeno size-10 p-0" aria-label="Enquadrar tudo" onClick={() => setVb(enquadrar())}>
          <Maximize2 size={15} aria-hidden="true" />
        </button>
      </div>

      {/* ------------------------------------------------ legenda compacta (também filtra) */}
      <div className="absolute inset-x-2.5 bottom-2.5 z-20 flex w-fit max-w-[calc(100%-1.25rem)] flex-wrap items-center gap-1 rounded-padrao border border-linha bg-abismo/85 p-1 backdrop-blur-md sm:inset-x-auto sm:bottom-3 sm:left-3">
        {estreito && (
          <button type="button" aria-expanded={legendaAberta} onClick={() => setLegendaAberta((x) => !x)} className="inline-flex min-h-9 items-center gap-1 rounded-fino px-2 text-micro text-texto-2 hover:bg-grafite">
            Legenda
            <ChevronDown size={13} aria-hidden="true" className={`transition-transform duration-200 ${legendaAberta ? "rotate-180" : ""}`} />
          </button>
        )}
        {(!estreito || legendaAberta) && presentes.map((e) => {
          const ativa = !ocultas.has(e.tipo);
          return (
            <button
              key={e.tipo}
              type="button"
              aria-pressed={ativa}
              title={`${e.rotulo}: ${e.descricao}. Clique para ${ativa ? "ocultar" : "mostrar"}.`}
              onClick={() =>
                setOcultas((o) => {
                  const n = new Set(o);
                  if (n.has(e.tipo)) n.delete(e.tipo);
                  else n.add(e.tipo);
                  return n;
                })
              }
              className={`inline-flex min-h-8 items-center gap-1.5 rounded-fino px-2 text-micro transition-opacity duration-150 hover:bg-grafite ${ativa ? "text-texto" : "text-texto-3 line-through opacity-55"}`}
            >
              <svg width="20" height="8" aria-hidden="true">
                <line x1="1" y1="4" x2={e.seta ? 14 : 19} y2="4" stroke={e.cor} strokeWidth={e.espessura} strokeDasharray={e.traco || undefined} strokeLinecap="round" />
                {e.seta && <path d="M13 1 18 4 13 7" fill="none" stroke={e.cor} strokeWidth="1.5" />}
              </svg>
              {e.rotulo.split(" / ")[0]}
            </button>
          );
        })}
        {(!estreito || legendaAberta) && (["inferida", "condicional"] as const)
          .filter((b) => bases.has(b))
          .map((b) => (
            <span key={b} className="inline-flex min-h-8 items-center gap-1 px-1.5 text-micro text-texto-2" title={b === "inferida" ? "Interpretação do analista, sem fonte direta" : "Só vale dentro do cenário"}>
              <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
                {b === "inferida" ? (
                  <circle cx="6" cy="6" r="4" fill="none" stroke="var(--color-texto-2)" strokeWidth="1.3" strokeDasharray="2 1.6" />
                ) : (
                  <path d="M6 1.5 10.5 6 6 10.5 1.5 6Z" fill="none" stroke="var(--color-ambar)" strokeWidth="1.3" />
                )}
              </svg>
              {b === "inferida" ? "inferida" : "hipótese"}
            </span>
          ))}
        <span aria-hidden="true" className="mx-0.5 hidden h-5 w-px bg-linha-forte md:block" />
        <span className="hidden px-1 text-micro text-texto-3 md:inline">Blocos</span>
        {r.blocos.map((b) => (
          <button
            key={b.id}
            type="button"
            aria-pressed={blocoAtivo === b.id}
            onClick={() => setBlocoAtivo((x) => (x === b.id ? null : b.id))}
            title={`Mostrar no mapa os membros de ${b.nome} nesta vista`}
            className={`hidden min-h-8 items-center rounded-fino px-2 text-micro transition-colors duration-150 md:inline-flex ${blocoAtivo === b.id ? "bg-ciano-suave text-ciano-texto" : "text-texto-2 hover:bg-grafite"}`}
          >
            {b.nome.replace(" das Américas", "")}
          </button>
        ))}
        <button
          type="button"
          aria-expanded={listaAberta}
          onClick={() => setListaAberta((x) => !x)}
          className="inline-flex min-h-8 items-center gap-1 rounded-fino px-2 text-micro text-texto-2 hover:bg-grafite"
          title="Lista de relações em texto"
        >
          <List size={13} aria-hidden="true" /> Lista
        </button>
      </div>

      {/* lista em texto: alternativa acessível ao mapa */}
      {listaAberta && (
        <div className="aparecer absolute bottom-16 left-2.5 z-30 flex max-h-[55%] w-[min(24rem,calc(100%-1.25rem))] flex-col rounded-padrao border border-linha-forte bg-abismo/95 shadow-lg backdrop-blur-md sm:left-3">
          <p className="border-b border-linha px-3 py-2 text-micro text-texto-3">
            {visiveis.length} relações {cenario ? `no cenário ${cenario.id}` : "hoje"}
          </p>
          <ul className="m-0 flex list-none flex-col overflow-y-auto p-0">
            {visiveis.map((l) => (
              <li key={l.rel.id}>
                <button
                  type="button"
                  onClick={() => {
                    setListaAberta(false);
                    selecionar({ tipo: "relacao", id: l.rel.id });
                  }}
                  className="w-full px-3 py-2 text-left text-legenda hover:bg-grafite"
                >
                  <span className="text-texto">
                    {nome(l.rel.de)} → {nome(l.rel.para)}
                  </span>
                  <span className="text-texto-3"> · {ESTILO.get(l.tipo)?.rotulo.split(" / ")[0]}</span>
                  <span className="block text-micro text-texto-2">{l.texto}</span>
                </button>
              </li>
            ))}
            {r.blocos.map((b) => (
              <li key={b.id} className="px-3 py-2 text-micro text-texto-2">
                <span className="text-texto">{b.nome}:</span> {b.membros[vista].map(nome).join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      <PainelContextual variante="flutuante" />
    </div>
  );
}
