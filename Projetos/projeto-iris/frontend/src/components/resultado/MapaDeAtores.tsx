import { Maximize2, Minus, Plus, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as PE } from "react";
import { RELACOES, type TipoRelacao } from "../Diagramas";
import { EPISTEMICO } from "../Epistemico";
import type { GrupoRegional, Tema, TipoAtor } from "../../lib/investigacao";
import { documentada, relacaoNaVista, ROTULO_MUDANCA, statusDaRelacao, useResultado, type RelacaoNaVista } from "./contexto";
import { Rotulo } from "./pecas";

const PAISAGEM = { w: 1000, h: 640 };
const RETRATO = { w: 600, h: 860 };

export const NOME_TIPO_ATOR: Record<TipoAtor, string> = {
  estado: "Estado",
  organizacao: "Organização internacional",
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

type Base = "documentada" | "inferida" | "condicional";
function baseDe(status: string): Base {
  return documentada(status) ? "documentada" : status === "inferencia" ? "inferida" : "condicional";
}

// ------------------------------------------------------------------ formas

function FormaAtor({ tipo, x, y, r, preenchimento, contorno, largura }: { tipo: TipoAtor; x: number; y: number; r: number; preenchimento: string; contorno: string; largura: number }) {
  const p = { fill: preenchimento, stroke: contorno, strokeWidth: largura, vectorEffect: "non-scaling-stroke" as const };
  switch (tipo) {
    case "estado":
      return <circle cx={x} cy={y} r={r} {...p} />;
    case "organizacao":
      return <rect x={x - r * 0.9} y={y - r * 0.9} width={r * 1.8} height={r * 1.8} rx={r * 0.25} {...p} />;
    case "instituicao":
      return <path d={`M${x} ${y - r * 1.05} L${x + r} ${y + r * 0.75} L${x - r} ${y + r * 0.75}Z`} {...p} />;
    case "grupo":
      return <circle cx={x} cy={y} r={r * 0.95} {...p} fill="var(--color-institucional)" strokeDasharray="3 2" />;
  }
}

function MarcaBase({ base, x, y, s }: { base: Base; x: number; y: number; s: number }) {
  const r = 4.2 * s;
  if (base === "documentada") return <circle cx={x} cy={y} r={r} fill="var(--color-texto)" stroke="var(--color-institucional)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />;
  if (base === "inferida")
    return <circle cx={x} cy={y} r={r} fill="var(--color-institucional)" stroke="var(--color-texto-2)" strokeWidth={1.4} strokeDasharray="2 1.6" vectorEffect="non-scaling-stroke" />;
  return <path d={`M${x} ${y - r * 1.2} L${x + r * 1.2} ${y} L${x} ${y + r * 1.2} L${x - r * 1.2} ${y}Z`} fill="var(--color-institucional)" stroke="var(--color-ambar)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />;
}

// ------------------------------------------------------------------ mapa

export function MapaDeAtores() {
  const { r, ix, vista, selecao, selecionar } = useResultado();
  const caixa = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [retrato, setRetrato] = useState(false);
  const [largura, setLargura] = useState(800);
  const base = retrato ? RETRATO : PAISAGEM;
  const [vb, setVb] = useState({ x: 0, y: 0, w: base.w, h: base.h });
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [destacar, setDestacar] = useState(true);
  const [f, setF] = useState<{ grupos: Set<GrupoRegional>; tiposAtor: Set<TipoAtor>; tiposRel: Set<TipoRelacao>; temas: Set<Tema>; bases: Set<Base> }>({
    grupos: new Set(),
    tiposAtor: new Set(),
    tiposRel: new Set(),
    temas: new Set(),
    bases: new Set(),
  });

  // Layout: quadro retrato em telas estreitas, paisagem no resto.
  useEffect(() => {
    const el = caixa.current;
    const sv = svg.current;
    if (!el || !sv || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      setRetrato(el.getBoundingClientRect().width < 620);
      setLargura(sv.getBoundingClientRect().width || el.getBoundingClientRect().width);
    });
    ro.observe(el);
    ro.observe(sv);
    return () => ro.disconnect();
  }, []);
  useEffect(() => setVb({ x: 0, y: 0, w: base.w, h: base.h }), [base.w, base.h]);

  const k = largura / vb.w; // pixels por unidade do quadro
  const s = 1 / k; // unidades do quadro por pixel: mantém textos e marcas em tamanho constante na tela
  const pos = useCallback((id: string) => {
    const a = ix.atores.get(id)!;
    return retrato ? a.posRetrato : a.pos;
  }, [ix, retrato]);

  // ---------------------------------------------------------------- filtros
  const alternar = <T,>(chave: keyof typeof f, v: T) =>
    setF((atual) => {
      const novo = new Set(atual[chave] as Set<T>);
      if (novo.has(v)) novo.delete(v);
      else novo.add(v);
      return { ...atual, [chave]: novo };
    });
  const nFiltros = f.grupos.size + f.tiposAtor.size + f.tiposRel.size + f.temas.size + f.bases.size;

  const atoresVisiveis = useMemo(
    () => r.atores.filter((a) => (f.grupos.size === 0 || f.grupos.has(a.grupo)) && (f.tiposAtor.size === 0 || f.tiposAtor.has(a.tipo))),
    [r.atores, f.grupos, f.tiposAtor],
  );
  const idsVisiveis = new Set(atoresVisiveis.map((a) => a.id));

  const linhas = useMemo(() => {
    return r.relacoes
      .map((rel) => ({ ...relacaoNaVista(rel, vista), base: baseDe(statusDaRelacao(rel, vista)) }))
      .filter((x) => x.visivel)
      .filter((x) => idsVisiveis.has(x.rel.de) && idsVisiveis.has(x.rel.para))
      .filter((x) => f.tiposRel.size === 0 || f.tiposRel.has(x.tipo))
      .filter((x) => f.temas.size === 0 || f.temas.has(x.rel.tema))
      .filter((x) => f.bases.size === 0 || f.bases.has(x.base));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.relacoes, vista, f, atoresVisiveis]);

  // Foco: um ator selecionado destaca os vizinhos; uma relação selecionada destaca as pontas.
  const atorSel = selecao?.tipo === "ator" ? selecao.id : null;
  const relSel = selecao?.tipo === "relacao" ? selecao.id : null;
  const emFoco = useMemo(() => {
    if (atorSel) return new Set([atorSel, ...linhas.filter((l) => l.rel.de === atorSel || l.rel.para === atorSel).flatMap((l) => [l.rel.de, l.rel.para])]);
    if (relSel) {
      const rel = ix.relacoes.get(relSel);
      return rel ? new Set([rel.de, rel.para]) : null;
    }
    return null;
  }, [atorSel, relSel, linhas, ix]);

  // ---------------------------------------------------------------- zoom e deslocamento
  const limitar = useCallback(
    (n: { x: number; y: number; w: number; h: number }) => {
      const w = Math.min(base.w * 1.15, Math.max(base.w / 4, n.w));
      const h = (w * base.h) / base.w;
      const x = Math.min(base.w - w * 0.25, Math.max(-w * 0.75, n.x));
      const y = Math.min(base.h - h * 0.25, Math.max(-h * 0.75, n.y));
      return { x, y, w, h };
    },
    [base],
  );
  const zoom = useCallback(
    (fator: number, cx?: number, cy?: number) =>
      setVb((v) => {
        const px = cx ?? v.x + v.w / 2;
        const py = cy ?? v.y + v.h / 2;
        const w = v.w * fator;
        const h = v.h * fator;
        return limitar({ x: px - ((px - v.x) / v.w) * w, y: py - ((py - v.y) / v.h) * h, w, h });
      }),
    [limitar],
  );
  const paraQuadro = (cx: number, cy: number) => {
    const rc = svg.current!.getBoundingClientRect();
    return { x: vb.x + ((cx - rc.left) / rc.width) * vb.w, y: vb.y + ((cy - rc.top) / rc.height) * vb.h };
  };

  const ponteiros = useRef(new Map<number, { x: number; y: number }>());
  const arrasto = useRef({ moveu: 0, distancia: 0 });
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
      setVb((v) => limitar({ ...v, x: v.x - (dx / rc.width) * v.w, y: v.y - (dy / rc.height) * v.h }));
    }
  };
  const aoSoltar = (e: PE<SVGSVGElement>) => {
    ponteiros.current.delete(e.pointerId);
    if (ponteiros.current.size < 2) arrasto.current.distancia = 0;
  };
  // Roda do mouse só amplia com Ctrl/⌘ (ou gesto de pinça no trackpad): rolar a página continua natural.
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const roda = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rc = el.getBoundingClientRect();
      setVb((v) => {
        const px = v.x + ((e.clientX - rc.left) / rc.width) * v.w;
        const py = v.y + ((e.clientY - rc.top) / rc.height) * v.h;
        const fator = Math.exp(e.deltaY * 0.0025);
        const w = v.w * fator;
        const h = v.h * fator;
        return limitar({ x: px - ((px - v.x) / v.w) * w, y: py - ((py - v.y) / v.h) * h, w, h });
      });
    };
    el.addEventListener("wheel", roda, { passive: false });
    return () => el.removeEventListener("wheel", roda);
  }, [limitar]);

  const clique = (fn: () => void) => () => {
    if (arrasto.current.moveu > 6) return; // foi arrasto, não clique
    fn();
  };
  const teclado = (fn: () => void) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };

  // ---------------------------------------------------------------- geometria das linhas
  const geometria = useMemo(() => {
    const porPar = new Map<string, number>();
    return linhas.map((l) => {
      const par = [l.rel.de, l.rel.para].sort().join("|");
      const n = porPar.get(par) ?? 0;
      porPar.set(par, n + 1);
      const a = pos(l.rel.de);
      const b = pos(l.rel.para);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const curva = n === 0 ? 0 : (n % 2 ? 1 : -1) * 46;
      const cx = (a.x + b.x) / 2 + (-dy / d) * curva;
      const cy = (a.y + b.y) / 2 + (dx / d) * curva;
      const recuo = 16 * s;
      const v1 = { x: cx - a.x, y: cy - a.y };
      const l1 = Math.hypot(v1.x, v1.y) || 1;
      const v2 = { x: cx - b.x, y: cy - b.y };
      const l2 = Math.hypot(v2.x, v2.y) || 1;
      const p1 = { x: a.x + (v1.x / l1) * recuo, y: a.y + (v1.y / l1) * recuo };
      const p2 = { x: b.x + (v2.x / l2) * recuo, y: b.y + (v2.y / l2) * recuo };
      const meio = { x: 0.25 * p1.x + 0.5 * cx + 0.25 * p2.x, y: 0.25 * p1.y + 0.5 * cy + 0.25 * p2.y };
      // ponta de seta: direção da tangente no fim da curva
      const ux = -v2.x / l2;
      const uy = -v2.y / l2;
      const t = 9 * s;
      const seta = `M${p2.x - ux * t - uy * t * 0.55} ${p2.y - uy * t + ux * t * 0.55} L${p2.x} ${p2.y} L${p2.x - ux * t + uy * t * 0.55} ${p2.y - uy * t - ux * t * 0.55}`;
      return { l, d: `M${p1.x} ${p1.y} Q${cx} ${cy} ${p2.x} ${p2.y}`, meio, seta };
    });
  }, [linhas, pos, s]);

  const mudancas = vista === "presente" ? [] : linhas.filter((l) => l.mudou);
  const nomeDe = (id: string) => ix.atores.get(id)?.curto ?? id;
  const rotuloRel = (l: RelacaoNaVista) => `${nomeDe(l.rel.de)} → ${nomeDe(l.rel.para)}: ${ESTILO.get(l.tipo)?.rotulo}`;

  return (
    <div className="flex flex-col gap-4">
      {/* barra de ferramentas */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="ficha min-h-9" aria-expanded={filtrosAbertos} aria-controls="filtros-mapa" onClick={() => setFiltrosAbertos((x) => !x)}>
            <SlidersHorizontal size={14} aria-hidden="true" />
            Filtros{nFiltros > 0 && <span className="numeros font-dados text-ciano-texto"> · {nFiltros}</span>}
          </button>
          {vista !== "presente" && (
            <button type="button" className="ficha min-h-9" aria-pressed={destacar} onClick={() => setDestacar((x) => !x)}>
              Destacar o que muda
            </button>
          )}
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Zoom do mapa">
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

      {filtrosAbertos && (
        <div id="filtros-mapa" className="grid gap-4 rounded-padrao border border-linha bg-grafite/60 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <GrupoFiltro titulo="Região" opcoes={Object.entries(NOME_GRUPO) as [GrupoRegional, string][]} ativos={f.grupos} aoAlternar={(v) => alternar("grupos", v)} />
          <GrupoFiltro titulo="Tipo de ator" opcoes={Object.entries(NOME_TIPO_ATOR) as [TipoAtor, string][]} ativos={f.tiposAtor} aoAlternar={(v) => alternar("tiposAtor", v)} />
          <GrupoFiltro titulo="Categoria de relação" opcoes={RELACOES.map((x) => [x.tipo, x.rotulo.split(" / ")[0]] as [TipoRelacao, string])} ativos={f.tiposRel} aoAlternar={(v) => alternar("tiposRel", v)} />
          <GrupoFiltro titulo="Tema" opcoes={Object.entries(NOME_TEMA) as [Tema, string][]} ativos={f.temas} aoAlternar={(v) => alternar("temas", v)} />
          <GrupoFiltro
            titulo="Base da relação"
            opcoes={[
              ["documentada", "Documentada"],
              ["inferida", "Inferida"],
              ["condicional", "Condicional ao cenário"],
            ]}
            ativos={f.bases}
            aoAlternar={(v) => alternar("bases", v as Base)}
          />
          <div className="flex items-end">
            <button
              type="button"
              className="botao botao-fantasma botao-pequeno"
              disabled={nFiltros === 0}
              onClick={() => setF({ grupos: new Set(), tiposAtor: new Set(), tiposRel: new Set(), temas: new Set(), bases: new Set() })}
            >
              Limpar filtros
            </button>
          </div>
        </div>
      )}

      {/* o mapa */}
      <div ref={caixa} id="mapa-atores" className="painel relative scroll-mt-20 overflow-hidden">
        <svg
          ref={svg}
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          className="mx-auto block h-auto cursor-grab select-none active:cursor-grabbing"
          // Altura limitada à tela: o mapa inteiro cabe sem rolar, mantendo a proporção do quadro.
          style={{ aspectRatio: `${base.w} / ${base.h}`, width: `min(100%, calc(${retrato ? 78 : 66}dvh * ${base.w} / ${base.h}))`, touchAction: "pan-y" }}
          role="group"
          aria-label={`Mapa de atores e relações, vista ${vista === "presente" ? "presente (2026)" : `cenário ${vista}`}. Use Tab para percorrer atores e conexões.`}
          onPointerDown={aoBaixar}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoSoltar}
          onClick={(e) => {
            if (e.target === svg.current && arrasto.current.moveu <= 6) selecionar(null);
          }}
        >
          {/* conexões */}
          {geometria.map(({ l, d, meio, seta }) => {
            const e = ESTILO.get(l.tipo)!;
            const selecionada = relSel === l.rel.id;
            const apagada = (emFoco && !(emFoco.has(l.rel.de) && emFoco.has(l.rel.para))) || (relSel && !selecionada);
            const destaque = destacar && l.mudou;
            const acao = () => selecionar({ tipo: "relacao", id: l.rel.id });
            return (
              <g
                key={l.rel.id}
                role="button"
                tabIndex={0}
                aria-pressed={selecionada}
                aria-label={`${rotuloRel(l)}. ${l.texto}${l.mudou && l.estado ? `. ${ROTULO_MUDANCA[l.estado.mudanca]} neste cenário` : ""}`}
                className="transicao-preenchimento cursor-pointer outline-none [&:focus-visible>.foco]:opacity-100"
                opacity={apagada ? 0.14 : 1}
                onClick={clique(acao)}
                onKeyDown={teclado(acao)}
              >
                {destaque && <path d={d} fill="none" stroke="var(--color-ambar)" strokeOpacity={0.32} strokeWidth={9} strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
                <path className="foco opacity-0" d={d} fill="none" stroke="var(--color-ciano)" strokeOpacity={0.5} strokeWidth={8} vectorEffect="non-scaling-stroke" />
                <path
                  d={d}
                  fill="none"
                  stroke={e.cor}
                  strokeWidth={selecionada ? e.espessura + 1.4 : e.espessura}
                  strokeDasharray={e.traco || undefined}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                {e.seta && <path d={seta} fill="none" stroke={e.cor} strokeWidth={1.6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
                {/* área de toque generosa */}
                <path d={d} fill="none" stroke="transparent" strokeWidth={18} vectorEffect="non-scaling-stroke" pointerEvents="stroke" />
                <MarcaBase base={l.base} x={meio.x} y={meio.y} s={s} />
              </g>
            );
          })}

          {/* atores */}
          {atoresVisiveis.map((a) => {
            const p = pos(a.id);
            const selecionado = atorSel === a.id;
            const apagado = emFoco && !emFoco.has(a.id);
            const raio = (a.id === "brasil" ? 11 : 8) * s;
            const acima = p.y > (retrato ? RETRATO.h : PAISAGEM.h) - 60;
            const acao = () => selecionar({ tipo: "ator", id: a.id });
            return (
              <g
                key={a.id}
                role="button"
                tabIndex={0}
                aria-pressed={selecionado}
                aria-label={`${a.nome} (${NOME_TIPO_ATOR[a.tipo]}). ${a.papel}`}
                className="transicao-preenchimento cursor-pointer outline-none [&:focus-visible>.foco]:opacity-100"
                opacity={apagado ? 0.28 : 1}
                onClick={clique(acao)}
                onKeyDown={teclado(acao)}
              >
                <circle className="foco opacity-0" cx={p.x} cy={p.y} r={raio + 7 * s} fill="none" stroke="var(--color-ciano)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                {selecionado && <circle cx={p.x} cy={p.y} r={raio + 6 * s} fill="var(--color-ciano-suave)" stroke="var(--color-ciano)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />}
                <circle cx={p.x} cy={p.y} r={24 * s} fill="transparent" />
                <FormaAtor
                  tipo={a.tipo}
                  x={p.x}
                  y={p.y}
                  r={raio}
                  preenchimento={a.id === "brasil" ? "var(--color-texto)" : "var(--color-grafite-alto)"}
                  contorno={selecionado ? "var(--color-ciano)" : "var(--color-texto)"}
                  largura={1.3}
                />
                <text
                  x={p.x}
                  y={acima ? p.y - raio - 8 * s : p.y + raio + 17 * s}
                  textAnchor="middle"
                  fill={selecionado ? "var(--color-ciano-texto)" : "var(--color-texto)"}
                  stroke="var(--color-institucional)"
                  strokeWidth={4 * s}
                  paintOrder="stroke"
                  style={{ font: `500 ${13 * s}px var(--font-interface)` }}
                >
                  {a.curto}
                </text>
              </g>
            );
          })}
        </svg>
        {linhas.length === 0 && (
          <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-6 text-center text-legenda text-texto-2">Nenhuma relação com esses filtros.</p>
        )}
        <p className="pointer-events-none absolute bottom-2 left-3 hidden text-micro text-texto-3 sm:block">
          Arraste para mover · Ctrl + rolar para ampliar · clique em um ator ou conexão
        </p>
        <p className="pointer-events-none absolute bottom-2 left-3 text-micro text-texto-3 sm:hidden">Toque em um ator · dois dedos para ampliar</p>
      </div>

      <Legenda />

      {vista !== "presente" && (
        <div>
          <Rotulo>O que muda no cenário {vista} em relação ao presente</Rotulo>
          {mudancas.length === 0 ? (
            <p className="text-legenda text-texto-2">Nenhuma relação visível muda com os filtros atuais.</p>
          ) : (
            <ul className="m-0 grid list-none gap-1.5 p-0 sm:grid-cols-2">
              {mudancas.map((l) => (
                <li key={l.rel.id}>
                  <button
                    type="button"
                    onClick={() => selecionar({ tipo: "relacao", id: l.rel.id })}
                    className="flex w-full min-w-0 items-start gap-2 rounded-padrao border border-linha p-2.5 text-left text-legenda transition-colors hover:border-linha-forte"
                  >
                    <span className="mt-0.5 shrink-0 rounded-full border border-ambar/40 px-1.5 text-micro text-ambar">{l.estado ? ROTULO_MUDANCA[l.estado.mudanca] : ""}</span>
                    <span className="min-w-0">
                      <span className="text-texto">
                        {nomeDe(l.rel.de)} → {nomeDe(l.rel.para)}
                      </span>
                      <span className="block text-texto-2">{l.texto}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <details className="group rounded-padrao border border-linha">
        <summary className="flex min-h-11 cursor-pointer items-center px-3 text-legenda text-texto-2 hover:text-texto">
          Lista de relações visíveis ({linhas.length}), alternativa em texto ao mapa
        </summary>
        <ul className="m-0 flex list-none flex-col divide-y divide-linha border-t border-linha p-0">
          {linhas.map((l) => (
            <li key={l.rel.id}>
              <button type="button" onClick={() => selecionar({ tipo: "relacao", id: l.rel.id })} className="flex w-full flex-wrap items-baseline gap-x-2 px-3 py-2.5 text-left text-legenda hover:bg-grafite">
                <span className="text-texto">{rotuloRel(l)}</span>
                <span className="text-texto-3">· {EPISTEMICO[statusDaRelacao(l.rel, vista)].rotulo}</span>
                <span className="w-full text-texto-2">{l.texto}</span>
              </button>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function GrupoFiltro<T extends string>({ titulo, opcoes, ativos, aoAlternar }: { titulo: string; opcoes: [T, string][]; ativos: Set<T>; aoAlternar: (v: T) => void }) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-2 text-micro text-texto-3">{titulo}</legend>
      <div className="flex flex-wrap gap-1.5">
        {opcoes.map(([v, nome]) => (
          <button key={v} type="button" className="ficha min-h-8 text-micro" aria-pressed={ativos.has(v)} onClick={() => aoAlternar(v)}>
            {nome}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Legenda() {
  return (
    <details className="rounded-padrao border border-linha">
      <summary className="flex min-h-11 cursor-pointer items-center px-3 text-legenda text-texto-2 hover:text-texto">Legenda do mapa</summary>
      <div className="grid gap-6 border-t border-linha p-4 md:grid-cols-3">
        <div>
          <Rotulo>Relações</Rotulo>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {RELACOES.map((x) => (
              <li key={x.tipo} className="flex items-center gap-3 text-legenda text-texto-2">
                <svg width="44" height="10" aria-hidden="true">
                  <line x1="2" y1="5" x2={x.seta ? 36 : 42} y2="5" stroke={x.cor} strokeWidth={x.espessura} strokeDasharray={x.traco || undefined} strokeLinecap="round" />
                  {x.seta && <path d="M35 1.5 41 5 35 8.5" fill="none" stroke={x.cor} strokeWidth="1.6" />}
                </svg>
                <span>
                  <span className="text-texto">{x.rotulo}</span> · {x.descricao}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <Rotulo>Base de cada conexão (marca no meio)</Rotulo>
          <ul className="m-0 flex list-none flex-col gap-2 p-0 text-legenda text-texto-2">
            {(
              [
                ["documentada", "Documentada: fato ou evidência com fonte"],
                ["inferida", "Inferida: interpretação do analista"],
                ["condicional", "Condicional: só vale dentro de um cenário"],
              ] as [Base, string][]
            ).map(([b, t]) => (
              <li key={b} className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <MarcaBase base={b} x={8} y={8} s={1.2} />
                </svg>
                {t}
              </li>
            ))}
            <li className="flex items-center gap-3">
              <svg width="16" height="10" aria-hidden="true">
                <line x1="1" y1="5" x2="15" y2="5" stroke="var(--color-ambar)" strokeOpacity="0.4" strokeWidth="7" strokeLinecap="round" />
              </svg>
              Halo âmbar: muda em relação ao presente
            </li>
          </ul>
        </div>
        <div>
          <Rotulo>Atores</Rotulo>
          <ul className="m-0 flex list-none flex-col gap-2 p-0 text-legenda text-texto-2">
            {(Object.keys(NOME_TIPO_ATOR) as TipoAtor[]).map((t) => (
              <li key={t} className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <FormaAtor tipo={t} x={8} y={8.5} r={5.5} preenchimento="var(--color-grafite-alto)" contorno="var(--color-texto)" largura={1.2} />
                </svg>
                {NOME_TIPO_ATOR[t]}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-micro text-texto-3">Posições esquemáticas, agrupadas por região; não são geográficas. A espessura não indica força.</p>
        </div>
      </div>
    </details>
  );
}
