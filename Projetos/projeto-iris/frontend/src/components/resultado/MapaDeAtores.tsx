import { Maximize2, Minus, Pause, Play, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as PE } from "react";
import { RELACOES, type TipoRelacao } from "../Diagramas";
import type { Ator, GrupoRegional, Tema, TipoAtor, Vista } from "../../lib/investigacao";
import { documentada, relacaoNaVista, ROTULO_MUDANCA, statusDaRelacao, useResultado } from "./contexto";
import { Letra } from "./pecas";

export const NOME_TIPO_ATOR: Record<TipoAtor, string> = {
  estado: "País",
  organizacao: "Organização ou bloco",
  instituicao: "Instituição nacional",
  grupo: "Grupo ou setor",
};
export const NOME_GRUPO: Record<GrupoRegional, string> = {
  brasil: "Brasil (interno)",
  americas: "Américas",
  europa: "Europa",
  asia: "Ásia",
  multilateral: "Multilateral",
};
export const NOME_TEMA: Record<Tema, string> = {
  politica: "Política",
  economia: "Economia",
  seguranca: "Segurança",
  diplomacia: "Diplomacia",
  instituicoes: "Instituições",
};

const ESTILO = new Map(RELACOES.map((x) => [x.tipo, x]));
const QUADRO = { w: 1000, h: 620 };
/** No celular o quadro gira: o eixo Washington ↔ Pequim fica na vertical. */
const QUADRO_RETRATO = { w: 620, h: 1090 };
const VISTAS: Vista[] = ["presente", "A", "B", "C"];
/** Cada bloco tem um contorno próprio, para que regiões sobrepostas continuem legíveis. */
const TRACO_BLOCO: Record<string, string> = { "b-escudo": "", "b-mercosul": "6 4", "b-brics": "2 4" };

type Base = "documentada" | "inferida" | "condicional";
const baseDe = (status: string): Base => (documentada(status) ? "documentada" : status === "inferencia" ? "inferida" : "condicional");

// ------------------------------------------------------------------ transição

const suave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Interpola um conjunto de números (posições, presença e espessura das linhas, forma dos blocos)
 * até o alvo. Interrompível: uma nova troca parte do ponto em que a anterior estava.
 */
function useTransicao(alvo: Record<string, number>, ms = 900) {
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

/** Envoltória convexa (monotone chain). */
function envoltoria(pts: { x: number; y: number }[]) {
  if (pts.length < 3) return pts;
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const cruz = (o: (typeof p)[0], a: (typeof p)[0], b: (typeof p)[0]) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const baixo: typeof p = [];
  for (const q of p) {
    while (baixo.length >= 2 && cruz(baixo[baixo.length - 2], baixo[baixo.length - 1], q) <= 0) baixo.pop();
    baixo.push(q);
  }
  const cima: typeof p = [];
  for (const q of [...p].reverse()) {
    while (cima.length >= 2 && cruz(cima[cima.length - 2], cima[cima.length - 1], q) <= 0) cima.pop();
    cima.push(q);
  }
  return [...baixo.slice(0, -1), ...cima.slice(0, -1)];
}

function MarcaBase({ base, x, y, s, opacidade }: { base: Base; x: number; y: number; s: number; opacidade: number }) {
  const r = 4 * s;
  const comum = { opacity: opacidade, vectorEffect: "non-scaling-stroke" as const, strokeWidth: 1.4 };
  if (base === "documentada") return <circle cx={x} cy={y} r={r} fill="var(--color-texto)" stroke="var(--color-institucional)" {...comum} />;
  if (base === "inferida") return <circle cx={x} cy={y} r={r} fill="var(--color-institucional)" stroke="var(--color-texto-2)" strokeDasharray="2 1.6" {...comum} />;
  return <path d={`M${x} ${y - r * 1.25} L${x + r * 1.25} ${y} L${x} ${y + r * 1.25} L${x - r * 1.25} ${y}Z`} fill="var(--color-institucional)" stroke="var(--color-ambar)" {...comum} />;
}

// ------------------------------------------------------------------ mapa

export function MapaDeAtores() {
  const { r, ix, vista, selecao, selecionar } = useResultado();
  const caixa = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [retrato, setRetrato] = useState(false);
  const [largura, setLargura] = useState(900);
  const base = retrato ? QUADRO_RETRATO : QUADRO;
  const [vb, setVb] = useState({ x: 0, y: 0, w: base.w, h: base.h });
  /** Categorias ocultas pela legenda (que também é o filtro). */
  const [ocultas, setOcultas] = useState<Set<TipoRelacao>>(new Set());
  const [sobre, setSobre] = useState<string | null>(null);
  const [dica, setDica] = useState<{ x: number; y: number; titulo: string; texto: string } | null>(null);

  useEffect(() => {
    const el = caixa.current;
    const sv = svg.current;
    if (!el || !sv || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      setRetrato(el.getBoundingClientRect().width < 640);
      setLargura(sv.getBoundingClientRect().width || el.getBoundingClientRect().width);
    });
    ro.observe(el);
    ro.observe(sv);
    return () => ro.disconnect();
  }, []);
  useEffect(() => setVb({ x: 0, y: 0, w: base.w, h: base.h }), [base.w, base.h]);


  const k = largura / vb.w;
  const s = 1 / k; // unidades do quadro por pixel de tela
  const paises = useMemo(() => r.atores.filter((a): a is Ator & { mapa: NonNullable<Ator["mapa"]> } => a.tipo === "estado" && !!a.mapa), [r.atores]);
  const ehPais = useMemo(() => new Set(paises.map((p) => p.id)), [paises]);
  const blocoPorAtor = useMemo(() => new Map(r.blocos.map((b) => [b.ator, b])), [r.blocos]);

  // Relações desenhadas: entre países, ou de um país para um bloco do qual não é membro.
  // A filiação a um bloco aparece como região, não como linha.
  const desenhaveis = useMemo(
    () =>
      r.relacoes.filter((rel) => {
        const a = ehPais.has(rel.de) || blocoPorAtor.has(rel.de);
        const b = ehPais.has(rel.para) || blocoPorAtor.has(rel.para);
        if (!a || !b) return false;
        const bloco = blocoPorAtor.get(rel.para) ?? blocoPorAtor.get(rel.de);
        const pais = ehPais.has(rel.de) ? rel.de : rel.para;
        return !(bloco && VISTAS.some((v) => bloco.membros[v].includes(pais)));
      }),
    [r.relacoes, ehPais, blocoPorAtor],
  );

  const passaFiltro = useCallback((tipo: TipoRelacao) => !ocultas.has(tipo), [ocultas]);

  // ---------------------------------------------------------------- alvo da transição
  const alvo = useMemo(() => {
    const a: Record<string, number> = {};
    for (const p of paises) {
      a[`n|${p.id}|x`] = p.mapa[vista].x;
      a[`n|${p.id}|y`] = p.mapa[vista].y;
    }
    for (const rel of desenhaveis) {
      const nv = relacaoNaVista(rel, vista);
      const visivel = nv.visivel && passaFiltro(nv.tipo);
      for (const t of RELACOES) a[`e|${rel.id}|${t.tipo}`] = visivel && nv.tipo === t.tipo ? 1 : 0;
      const m = nv.estado?.mudanca;
      a[`e|${rel.id}|w`] = m === "reforcada" ? 1.7 : m === "enfraquecida" ? 0.55 : 1;
      a[`e|${rel.id}|o`] = m === "enfraquecida" ? 0.5 : 1;
    }
    for (const bl of r.blocos) {
      const todos = new Set(VISTAS.flatMap((v) => bl.membros[v]));
      for (const m of todos) a[`b|${bl.id}|${m}`] = bl.membros[vista].includes(m) ? 1 : 0;
      a[`b|${bl.id}|o`] = bl.estado[vista] === "reforcado" ? 0.15 : bl.estado[vista] === "enfraquecido" ? 0.045 : 0.09;
    }
    return a;
  }, [paises, desenhaveis, r.blocos, vista, passaFiltro]);
  const v = useTransicao(alvo);

  const posDe = (id: string) => (retrato ? { x: v[`n|${id}|y`], y: v[`n|${id}|x`] + 90 } : { x: v[`n|${id}|x`], y: v[`n|${id}|y`] });

  // Formas dos blocos a partir das posições animadas; um membro que entra ou sai desliza a partir do centro.
  const formas = r.blocos.map((bl) => {
    const todos = [...new Set(VISTAS.flatMap((x) => bl.membros[x]))].filter((m) => ehPais.has(m));
    const fixos = todos.filter((m) => v[`b|${bl.id}|${m}`] > 0.999);
    const ref = fixos.length ? fixos : todos;
    const cx = ref.reduce((acc, m) => acc + posDe(m).x, 0) / ref.length;
    const cy = ref.reduce((acc, m) => acc + posDe(m).y, 0) / ref.length;
    const pts = todos
      .map((m) => ({ m, p: v[`b|${bl.id}|${m}`] }))
      .filter((x) => x.p > 0.01)
      .map(({ m, p }) => {
        const q = posDe(m);
        return { x: cx + (q.x - cx) * p, y: cy + (q.y - cy) * p };
      });
    // Região arredondada: envoltória de círculos em volta de cada membro.
    const R = 48;
    const aro = pts.flatMap((q) => Array.from({ length: 18 }, (_, i) => ({ x: q.x + R * Math.cos((i / 18) * Math.PI * 2), y: q.y + R * Math.sin((i / 18) * Math.PI * 2) })));
    const casco = envoltoria(aro);
    const d = casco.length ? `M${casco.map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(" L")}Z` : "";
    const topo = casco.reduce((acc, q) => (q.y < acc.y ? q : acc), casco[0] ?? { x: cx, y: cy });
    return { bl, d, cx, cy, topo, opacidade: v[`b|${bl.id}|o`] };
  });
  const comAncora = new Set(formas.filter((fm) => desenhaveis.some((rel) => rel.de === fm.bl.ator || rel.para === fm.bl.ator)).map((fm) => fm.bl.id));
  const centroDoBloco = new Map(formas.map((fm) => [fm.bl.ator, { x: fm.cx, y: fm.cy }]));
  const pontoDe = (id: string) => (ehPais.has(id) ? posDe(id) : centroDoBloco.get(id) ?? { x: 0, y: 0 });

  // ---------------------------------------------------------------- foco
  const atorSel = selecao?.tipo === "ator" ? selecao.id : null;
  const relSel = selecao?.tipo === "relacao" ? selecao.id : null;
  const focoAtor = sobre ?? atorSel;
  const vizinhos = useMemo(() => {
    if (!focoAtor) return null;
    const vis = desenhaveis.filter((rel) => relacaoNaVista(rel, vista).visivel && (rel.de === focoAtor || rel.para === focoAtor));
    return new Set([focoAtor, ...vis.flatMap((rel) => [rel.de, rel.para])]);
  }, [focoAtor, desenhaveis, vista]);

  // ---------------------------------------------------------------- zoom e arraste
  const limitar = useCallback(
    (n: { x: number; y: number; w: number; h: number }) => {
      const w = Math.min(base.w * 1.15, Math.max(base.w / 3.5, n.w));
      const h = (w * base.h) / base.w;
      return { w, h, x: Math.min(base.w - w * 0.25, Math.max(-w * 0.75, n.x)), y: Math.min(base.h - h * 0.25, Math.max(-h * 0.75, n.y)) };
    },
    [base],
  );
  const zoom = useCallback(
    (fator: number, cx?: number, cy?: number) =>
      setVb((a) => {
        const px = cx ?? a.x + a.w / 2;
        const py = cy ?? a.y + a.h / 2;
        const w = a.w * fator;
        const h = a.h * fator;
        return limitar({ x: px - ((px - a.x) / a.w) * w, y: py - ((py - a.y) / a.h) * h, w, h });
      }),
    [limitar],
  );
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
        const fator = Math.exp(e.deltaY * 0.0025);
        return limitar({ x: px - ((px - a.x) / a.w) * a.w * fator, y: py - ((py - a.y) / a.h) * a.h * fator, w: a.w * fator, h: a.h * fator });
      });
    };
    el.addEventListener("wheel", roda, { passive: false });
    return () => el.removeEventListener("wheel", roda);
  }, [limitar]);
  const clique = (fn: () => void) => () => {
    if (arrasto.current.moveu > 6) return;
    fn();
  };
  const teclado = (fn: () => void) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };

  // ---------------------------------------------------------------- textos
  const nome = (id: string) => ix.atores.get(id)?.curto ?? id;
  const mudancas = useMemo(() => {
    if (vista === "presente") return [];
    const rels = desenhaveis.map((rel) => relacaoNaVista(rel, vista)).filter((x) => x.mudou);
    return rels;
  }, [desenhaveis, vista]);
  const mudancasDeBloco = useMemo(() => {
    if (vista === "presente") return [];
    const out: string[] = [];
    for (const bl of r.blocos) {
      for (const m of bl.membros[vista]) if (!bl.membros.presente.includes(m)) out.push(`${nome(m)} entra no ${bl.nome}`);
      for (const m of bl.membros.presente) if (!bl.membros[vista].includes(m)) out.push(`${nome(m)} sai do ${bl.nome}`);
      if (bl.estado[vista] !== bl.estado.presente) out.push(`${bl.nome}: ${bl.estado[vista] === "reforcado" ? "reforçado" : bl.estado[vista] === "enfraquecido" ? "participação brasileira enfraquecida" : "volta ao normal"}`);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.blocos, vista]);

  const cenarioAtual = vista === "presente" ? null : r.cenarios.find((c) => c.id === vista)!;

  // Dica: posição na tela a partir do ponto no quadro.
  const mostrarDica = (pt: { x: number; y: number }, titulo: string, texto: string) => {
    const sv = svg.current;
    const cx = caixa.current;
    if (!sv || !cx) return;
    const rs = sv.getBoundingClientRect();
    const rc = cx.getBoundingClientRect();
    setDica({ x: rs.left - rc.left + ((pt.x - vb.x) / vb.w) * rs.width, y: rs.top - rc.top + ((pt.y - vb.y) / vb.h) * rs.height, titulo, texto });
  };

  // Legenda = filtro: só as categorias presentes nesta vista.
  const presentes = RELACOES.filter((e) => desenhaveis.some((rel) => { const nv = relacaoNaVista(rel, vista); return nv.visivel && nv.tipo === e.tipo; }));
  const bases = new Set(desenhaveis.filter((rel) => relacaoNaVista(rel, vista).visivel).map((rel) => baseDe(statusDaRelacao(rel, vista))));

  return (
    <div className="flex flex-col gap-3">
      <div ref={caixa} id="mapa-atores" className="relative scroll-mt-20 overflow-hidden rounded-painel border border-linha mapa-fundo">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-2.5 sm:p-3">
          <div>
            <p className="text-micro text-texto-3">{vista === "presente" ? "Observado em 2026" : `Cenário ${vista} · ${cenarioAtual!.arquetipo}`}</p>
            <p key={vista} className="aparecer font-editorial text-corpo text-texto sm:text-leitura">
              {vista === "presente" ? "Hoje" : cenarioAtual!.nome}
            </p>
          </div>
          <div className="pointer-events-auto flex items-center rounded-padrao border border-linha bg-abismo/85 p-0.5 backdrop-blur-sm" role="group" aria-label="Zoom do mapa">
            <button type="button" className="botao botao-fantasma botao-pequeno size-10 p-0" aria-label="Aproximar" onClick={() => zoom(0.75)}>
              <Plus size={16} aria-hidden="true" />
            </button>
            <button type="button" className="botao botao-fantasma botao-pequeno size-10 p-0" aria-label="Afastar" onClick={() => zoom(1 / 0.75)}>
              <Minus size={16} aria-hidden="true" />
            </button>
            <button type="button" className="botao botao-fantasma botao-pequeno size-10 p-0" aria-label="Enquadrar tudo" onClick={() => setVb({ x: 0, y: 0, w: base.w, h: base.h })}>
              <Maximize2 size={15} aria-hidden="true" />
            </button>
          </div>
        </div>

        <svg
          ref={svg}
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          className="mx-auto block h-auto cursor-grab select-none active:cursor-grabbing"
          style={{ aspectRatio: `${base.w} / ${base.h}`, width: `min(100%, calc(${retrato ? 74 : 64}dvh * ${base.w} / ${base.h}))`, touchAction: "pan-y" }}
          role="group"
          aria-label={`Mapa de relações entre países, ${vista === "presente" ? "situação observada em 2026" : `cenário ${vista}`}. Use Tab para percorrer países e conexões; Enter abre os detalhes.`}
          onPointerDown={aoBaixar}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoSoltar}
          onClick={(e) => {
            if (e.target === svg.current && arrasto.current.moveu <= 6) selecionar(null);
          }}
        >
          {/* eixo de alinhamento: horizontal no desktop, vertical no celular */}
          {retrato ? (
            <g aria-hidden="true" style={{ font: `500 ${10.5 * s}px var(--font-interface)`, letterSpacing: "0.06em" }} fill="var(--color-texto-3)">
              <line x1={20} y1={140} x2={20} y2={base.h - 50} stroke="var(--color-linha-forte)" strokeDasharray="2 6" vectorEffect="non-scaling-stroke" />
              {(
                [
                  [160, "start", "ÓRBITA DE WASHINGTON →"],
                  [(base.h + 90) / 2, "middle", "AUTONOMIA"],
                  [base.h - 70, "end", "← ÓRBITA DE PEQUIM"],
                ] as const
              ).map(([y, ancora, t]) => (
                <text key={t} x={0} y={0} textAnchor={ancora} transform={`translate(${34} ${y}) rotate(90)`}>
                  {t}
                </text>
              ))}
            </g>
          ) : (
            <g aria-hidden="true" style={{ font: `500 ${11 * s}px var(--font-interface)`, letterSpacing: "0.06em" }} fill="var(--color-texto-3)">
              <line x1={70} y1={base.h - 34} x2={base.w - 70} y2={base.h - 34} stroke="var(--color-linha-forte)" strokeDasharray="2 6" vectorEffect="non-scaling-stroke" />
              <text x={70} y={base.h - 14}>
                ← ÓRBITA DE WASHINGTON
              </text>
              <text x={base.w / 2} y={base.h - 14} textAnchor="middle">
                AUTONOMIA
              </text>
              <text x={base.w - 70} y={base.h - 14} textAnchor="end">
                ÓRBITA DE PEQUIM →
              </text>
            </g>
          )}

          {/* blocos */}
          {formas.map(({ bl, d, topo, opacidade }) =>
            d ? (
              <g
                key={bl.id}
                role="button"
                tabIndex={0}
                aria-label={`Bloco ${bl.nome}: ${bl.membros[vista].map(nome).join(", ")}`}
                className="cursor-pointer outline-none [&:focus-visible>.contorno]:opacity-100"
                onClick={clique(() => selecionar({ tipo: "ator", id: bl.ator }))}
                onKeyDown={teclado(() => selecionar({ tipo: "ator", id: bl.ator }))}
              >
                <path d={d} fill="var(--color-texto-2)" fillOpacity={opacidade} stroke="none" />
                <path
                  d={d}
                  fill="none"
                  stroke="var(--color-texto-2)"
                  strokeOpacity={Math.min(0.7, opacidade * 5)}
                  strokeWidth={1}
                  strokeDasharray={TRACO_BLOCO[bl.id] || undefined}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                <path className="contorno opacity-0" d={d} fill="none" stroke="var(--color-ciano)" strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                {!comAncora.has(bl.id) && <text
                  x={topo.x}
                  y={topo.y - 8 * s}
                  textAnchor="middle"
                  fill="var(--color-texto-2)"
                  opacity={Math.min(1, opacidade * 9)}
                  style={{ font: `600 ${10.5 * s}px var(--font-interface)`, letterSpacing: "0.08em" }}
                >
                  {bl.nome.toUpperCase()}
                </text>}
              </g>
            ) : null,
          )}

          {/* âncora de bloco: ponto onde terminam relações com o bloco inteiro */}
          {formas
            .filter((fm) => comAncora.has(fm.bl.id))
            .map((fm) => (
              <g key={`ancora-${fm.bl.id}`} aria-hidden="true">
                <rect x={fm.cx - 7 * s} y={fm.cy - 7 * s} width={14 * s} height={14 * s} rx={3 * s} fill="var(--color-institucional)" stroke="var(--color-texto-2)" strokeWidth={1.3} vectorEffect="non-scaling-stroke" />
                <text x={fm.cx} y={fm.cy + 22 * s} textAnchor="middle" fill="var(--color-texto-2)" style={{ font: `600 ${10 * s}px var(--font-interface)`, letterSpacing: "0.08em" }}>
                  {fm.bl.nome.toUpperCase()}
                </text>
              </g>
            ))}

          {/* conexões: uma camada por tipo, para que a mudança de natureza seja um cruzamento suave */}
          {desenhaveis.map((rel, idx) => {
            const a = pontoDe(rel.de);
            const b = pontoDe(rel.para);
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy) || 1;
            const ux = dx / dist;
            const uy = dy / dist;
            const curva = (idx % 2 ? 1 : -1) * Math.min(60, dist * 0.12);
            const cx = (a.x + b.x) / 2 - uy * curva;
            const cy = (a.y + b.y) / 2 + ux * curva;
            const recuo = (ehPais.has(rel.de) && ehPais.has(rel.para) ? 19 : 12) * s;
            const v1 = { x: cx - a.x, y: cy - a.y };
            const l1 = Math.hypot(v1.x, v1.y) || 1;
            const v2 = { x: cx - b.x, y: cy - b.y };
            const l2 = Math.hypot(v2.x, v2.y) || 1;
            const p1 = { x: a.x + (v1.x / l1) * recuo, y: a.y + (v1.y / l1) * recuo };
            const p2 = { x: b.x + (v2.x / l2) * recuo, y: b.y + (v2.y / l2) * recuo };
            const d = `M${p1.x} ${p1.y} Q${cx} ${cy} ${p2.x} ${p2.y}`;
            const meio = { x: 0.25 * p1.x + 0.5 * cx + 0.25 * p2.x, y: 0.25 * p1.y + 0.5 * cy + 0.25 * p2.y };
            const tx = -v2.x / l2;
            const ty = -v2.y / l2;
            const t = 10 * s;
            const seta = `M${p2.x - tx * t - ty * t * 0.55} ${p2.y - ty * t + tx * t * 0.55} L${p2.x} ${p2.y} L${p2.x - tx * t + ty * t * 0.55} ${p2.y - ty * t - tx * t * 0.55}`;
            const presenca = Math.max(...RELACOES.map((x) => v[`e|${rel.id}|${x.tipo}`] ?? 0));
            if (presenca < 0.01) return null;
            const nv = relacaoNaVista(rel, vista);
            const selecionada = relSel === rel.id;
            const apagada = (vizinhos && !(vizinhos.has(rel.de) && vizinhos.has(rel.para))) || (relSel && !selecionada);
            const largura = v[`e|${rel.id}|w`];
            const acao = () => selecionar({ tipo: "relacao", id: rel.id });
            return (
              <g
                key={rel.id}
                role="button"
                tabIndex={nv.visivel ? 0 : -1}
                aria-hidden={!nv.visivel}
                aria-pressed={selecionada}
                aria-label={`${nome(rel.de)} → ${nome(rel.para)}: ${ESTILO.get(nv.tipo)?.rotulo}. ${nv.texto}${nv.mudou && nv.estado ? `. ${ROTULO_MUDANCA[nv.estado.mudanca]} neste cenário` : ""}`}
                className="cursor-pointer outline-none transition-opacity duration-200 [&:focus-visible>.foco]:opacity-100"
                opacity={(apagada ? 0.12 : 1) * v[`e|${rel.id}|o`]}
                onClick={clique(acao)}
                onKeyDown={teclado(acao)}
                onPointerEnter={() => {
                  setSobre(null);
                  mostrarDica(meio, `${nome(rel.de)} → ${nome(rel.para)} · ${ESTILO.get(nv.tipo)?.rotulo.split(" / ")[0]}`, nv.texto);
                }}
                onPointerLeave={() => setDica(null)}
                onFocus={() => mostrarDica(meio, `${nome(rel.de)} → ${nome(rel.para)} · ${ESTILO.get(nv.tipo)?.rotulo.split(" / ")[0]}`, nv.texto)}
                onBlur={() => setDica(null)}
              >
                <path className="foco opacity-0" d={d} fill="none" stroke="var(--color-ciano)" strokeOpacity={0.45} strokeWidth={9} vectorEffect="non-scaling-stroke" />
                {selecionada && <path d={d} fill="none" stroke="var(--color-ciano)" strokeOpacity={0.28} strokeWidth={10} strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
                {RELACOES.map((e) => {
                  const p = v[`e|${rel.id}|${e.tipo}`] ?? 0;
                  if (p < 0.01) return null;
                  return (
                    <g key={e.tipo} opacity={p}>
                      <path
                        d={d}
                        fill="none"
                        stroke={e.cor}
                        strokeWidth={(selecionada ? e.espessura + 1.2 : e.espessura) * largura * (0.4 + 0.6 * p)}
                        strokeDasharray={e.traco || undefined}
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                      {e.seta && <path d={seta} fill="none" stroke={e.cor} strokeWidth={1.6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
                      {/* Direção: pulsos que andam da origem ao destino, só em relações com sentido definido. */}
                      {e.seta && p > 0.6 && (
                        <path d={d} fill="none" stroke="var(--color-texto)" strokeOpacity={0.7} strokeWidth={2.2} strokeDasharray="2 14" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="fluxo-direcao" />
                      )}
                    </g>
                  );
                })}
                <path d={d} fill="none" stroke="transparent" strokeWidth={20} vectorEffect="non-scaling-stroke" pointerEvents="stroke" />
                {baseDe(statusDaRelacao(rel, vista)) !== "documentada" && (
                  <MarcaBase base={baseDe(statusDaRelacao(rel, vista))} x={meio.x} y={meio.y} s={s} opacidade={presenca} />
                )}
              </g>
            );
          })}

          {/* países */}
          {paises.map((pa) => {
            const p = posDe(pa.id);
            const selecionado = atorSel === pa.id;
            const apagado = vizinhos && !vizinhos.has(pa.id);
            const ehBrasil = pa.id === "brasil";
            const raio = (ehBrasil ? 19 : 15) * s;
            const nota = pa.notaNoMapa?.[vista];
            const crise = ehBrasil && vista === "C";
            const acao = () => selecionar({ tipo: "ator", id: pa.id });
            return (
              <g
                key={pa.id}
                role="button"
                tabIndex={0}
                aria-pressed={selecionado}
                aria-label={`${pa.nome}. ${pa.papel}`}
                className="cursor-pointer outline-none transition-opacity duration-200 [&:focus-visible>.foco]:opacity-100"
                opacity={apagado ? 0.3 : 1}
                onClick={clique(acao)}
                onKeyDown={teclado(acao)}
                onPointerEnter={() => {
                  setSobre(pa.id);
                  mostrarDica(p, pa.nome, pa.implicacoes && vista !== "presente" ? pa.implicacoes[vista] : pa.papel);
                }}
                onPointerLeave={() => {
                  setSobre(null);
                  setDica(null);
                }}
                onFocus={() => mostrarDica(p, pa.nome, pa.implicacoes && vista !== "presente" ? pa.implicacoes[vista] : pa.papel)}
                onBlur={() => setDica(null)}
              >
                <circle cx={p.x} cy={p.y} r={30 * s} fill="transparent" />
                <circle className="foco opacity-0" cx={p.x} cy={p.y} r={raio + 7 * s} fill="none" stroke="var(--color-ciano)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                {crise && <circle className="pulso-crise" cx={p.x} cy={p.y} r={raio + 9 * s} fill="none" stroke="var(--color-ambar)" strokeWidth={1.4} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />}
                {selecionado && <circle cx={p.x} cy={p.y} r={raio + 6 * s} fill="var(--color-ciano-suave)" stroke="var(--color-ciano)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={raio}
                  fill={ehBrasil ? "var(--color-texto)" : "var(--color-grafite-alto)"}
                  stroke={selecionado ? "var(--color-ciano)" : ehBrasil ? "var(--color-texto)" : "var(--color-texto-2)"}
                  strokeWidth={1.3}
                  vectorEffect="non-scaling-stroke"
                />
                <text x={p.x} y={p.y + 3.4 * s} textAnchor="middle" fill={ehBrasil ? "var(--color-abismo)" : "var(--color-texto-2)"} style={{ font: `600 ${(ehBrasil ? 10 : 9) * s}px var(--font-dados)` }}>
                  {pa.iso}
                </text>
                <text
                  x={p.x}
                  y={p.y + raio + 17 * s}
                  textAnchor="middle"
                  fill={selecionado ? "var(--color-ciano-texto)" : "var(--color-texto)"}
                  stroke="var(--color-abismo)"
                  strokeWidth={4 * s}
                  paintOrder="stroke"
                  style={{ font: `${ehBrasil ? 600 : 500} ${13 * s}px var(--font-interface)` }}
                >
                  {pa.curto}
                </text>
                {nota && (
                  <text
                    key={`${pa.id}-${vista}`}
                    className="aparecer"
                    x={p.x}
                    y={p.y + raio + 32 * s}
                    textAnchor="middle"
                    fill={crise ? "var(--color-ambar)" : "var(--color-texto-3)"}
                    stroke="var(--color-abismo)"
                    strokeWidth={4 * s}
                    paintOrder="stroke"
                    style={{ font: `500 ${10.5 * s}px var(--font-interface)` }}
                  >
                    {nota}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* dica contextual (passar o cursor ou focar com o teclado) */}
        {dica && (
          <div
            role="tooltip"
            className={`pointer-events-none absolute z-20 w-max max-w-[16rem] -translate-x-1/2 rounded-padrao ${dica.y < 110 ? "translate-y-6" : "-translate-y-[calc(100%+14px)]"} border border-linha-forte bg-abismo/95 px-2.5 py-1.5 shadow-lg backdrop-blur-sm`}
            style={{ left: Math.min(Math.max(dica.x, 130), (caixa.current?.clientWidth ?? 400) - 130), top: dica.y }}
          >
            <p className="text-legenda font-medium text-texto">{dica.titulo}</p>
            <p className="text-micro text-texto-2">{dica.texto}</p>
          </div>
        )}

        {/* legenda compacta e persistente; cada item liga ou desliga a categoria */}
        <div className="relative z-10 flex flex-wrap items-center gap-1.5 border-t border-linha bg-abismo/60 px-2.5 py-2 backdrop-blur-sm">
          <span className="sr-only">Legenda e filtro de relações:</span>
          {presentes.map((e) => {
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
                className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-micro transition-[opacity,border-color] duration-150 ${
                  ativa ? "border-linha-forte text-texto" : "border-linha text-texto-3 line-through opacity-60"
                }`}
              >
                <svg width="22" height="8" aria-hidden="true">
                  <line x1="1" y1="4" x2={e.seta ? 16 : 21} y2="4" stroke={e.cor} strokeWidth={e.espessura} strokeDasharray={e.traco || undefined} strokeLinecap="round" />
                  {e.seta && <path d="M15 1 20 4 15 7" fill="none" stroke={e.cor} strokeWidth="1.5" />}
                </svg>
                {e.rotulo.split(" / ")[0]}
              </button>
            );
          })}
          {(["inferida", "condicional"] as const)
            .filter((b) => bases.has(b))
            .map((b) => (
              <span key={b} className="inline-flex min-h-8 items-center gap-1.5 px-1.5 text-micro text-texto-2" title={b === "inferida" ? "Interpretação do analista, sem fonte direta" : "Só vale dentro do cenário"}>
                <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
                  <MarcaBase base={b} x={8} y={8} s={1.3} opacidade={1} />
                </svg>
                {b === "inferida" ? "inferida" : "hipótese do cenário"}
              </span>
            ))}
          <details className="ml-auto text-micro text-texto-3">
            <summary className="flex min-h-8 cursor-pointer items-center px-1.5 hover:text-texto-2">Como ler</summary>
            <div className="absolute inset-x-2 bottom-full mb-2 flex max-w-md flex-col gap-1.5 rounded-padrao border border-linha-forte bg-abismo p-3 text-legenda text-texto-2 shadow-lg sm:left-auto">
              <p>Só países no mapa; regiões sombreadas são blocos. Linhas sem marca são documentadas; ◌ indica inferência do analista e ◇, hipótese do cenário.</p>
              <p>A posição indica para que lado o país se alinha, e a espessura, se a relação se reforça ou se enfraquece. Nada disso é medida numérica.</p>
              <p>Pulsos em movimento mostram o sentido de relações de influência e dependência.</p>
            </div>
          </details>
        </div>
      </div>

      <MudancasNoCenario mudancas={mudancas} mudancasDeBloco={mudancasDeBloco} nome={nome} />
    </div>
  );
}

function MudancasNoCenario({
  mudancas,
  mudancasDeBloco,
  nome,
}: {
  mudancas: ReturnType<typeof relacaoNaVista>[];
  mudancasDeBloco: string[];
  nome: (id: string) => string;
}) {
  const { vista, selecionar, r } = useResultado();
  const visiveis = r.relacoes.map((rel) => relacaoNaVista(rel, vista)).filter((x) => x.visivel);
  const n = mudancas.length + mudancasDeBloco.length;
  return (
    <details className="group rounded-padrao border border-linha">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 text-legenda text-texto-2 hover:text-texto">
        <span>
          {vista === "presente" ? (
            <>Relações observadas em 2026 ({visiveis.length})</>
          ) : (
            <>
              <span className="numeros font-dados text-ambar">{n}</span> mudanças em relação a hoje
            </>
          )}
        </span>
        <span className="text-micro text-texto-3 group-open:hidden">ver lista</span>
      </summary>
      <ul className="m-0 flex list-none flex-col divide-y divide-linha border-t border-linha p-0">
        {mudancasDeBloco.map((t) => (
          <li key={t} className="flex items-baseline gap-2 px-3 py-2 text-legenda text-texto">
            <span className="shrink-0 text-micro text-ambar">Bloco</span>
            {t}
          </li>
        ))}
        {(vista === "presente" ? visiveis : mudancas).map((l) => (
          <li key={l.rel.id}>
            <button type="button" onClick={() => selecionar({ tipo: "relacao", id: l.rel.id })} className="flex w-full items-baseline gap-2 px-3 py-2 text-left text-legenda hover:bg-grafite">
              {vista !== "presente" && l.estado && <span className="shrink-0 text-micro text-ambar">{ROTULO_MUDANCA[l.estado.mudanca]}</span>}
              <span className="min-w-0">
                <span className="text-texto">
                  {nome(l.rel.de)} → {nome(l.rel.para)}
                </span>
                <span className="text-texto-2"> · {l.texto}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Faixa de vistas: Hoje → A → B → C, com a opção de percorrer automaticamente. */
export function FaixaDeCenarios({ vertical = false }: { vertical?: boolean }) {
  const { r, vista, setVista } = useResultado();
  const [tocando, setTocando] = useState(false);
  useEffect(() => {
    if (!tocando) return;
    const t = window.setInterval(() => setVista(VISTAS[(VISTAS.indexOf(vista) + 1) % VISTAS.length]), 3200);
    return () => window.clearInterval(t);
  }, [tocando, vista, setVista]);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="rotulo">Vista do sistema</p>
        <button type="button" className="ficha min-h-9" aria-pressed={tocando} onClick={() => setTocando((x) => !x)}>
          {tocando ? <Pause size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />}
          {tocando ? "Pausar" : "Percorrer"}
        </button>
      </div>
      <ol role="group" aria-label="Vista do mapa" className={`m-0 grid list-none gap-1.5 p-0 ${vertical ? "grid-cols-2 xl:grid-cols-1" : "grid-cols-2 md:grid-cols-4"}`}>
        {VISTAS.map((vv) => {
          const c = vv === "presente" ? null : r.cenarios.find((x) => x.id === vv)!;
          const ativo = vista === vv;
          return (
            <li key={vv} className="min-w-0">
              <button
                type="button"
                aria-pressed={ativo}
                onClick={() => {
                  setTocando(false);
                  setVista(vv);
                }}
                className={`relative flex h-full w-full items-center gap-2.5 overflow-hidden rounded-padrao border px-2.5 py-2 text-left transition-colors duration-150 ${
                  ativo ? (c ? "border-ambar/55 bg-ambar-suave" : "border-ciano/50 bg-ciano-suave") : "border-linha hover:border-linha-forte"
                }`}
              >
                {c ? <Letra id={c.id} ativa={ativo} /> : <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-fino border border-linha-forte text-[0.5rem] text-texto-2">●</span>}
                <span className="min-w-0">
                  <span className="block text-micro text-texto-3">{c ? c.arquetipo : "Observado"}</span>
                  <span className="block truncate text-legenda text-texto">{c ? c.nome : "Hoje (2026)"}</span>
                </span>
                {ativo && tocando && <span aria-hidden="true" key={`${vv}-barra`} className="barra-progresso absolute inset-x-0 bottom-0 h-0.5 bg-ambar" />}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
