/** Constantes, geometria e transição do mapa geopolítico (sem JSX). */
import { useEffect, useRef, useState } from "react";
import { RELACOES, type TipoRelacao } from "./components/Gramatica";
import { prepararMapa } from "./geo/mundo";
import type { Ator } from "../../types/ator";
import type { Bloco, ResultadoDeInvestigacao } from "../../types/investigacao";
import type { Relacao } from "../../types/relacao";
import type { Vista } from "../../types/cenario";
import { documentada } from "../investigacao/contexto";

export const ESTILO = new Map(RELACOES.map((x) => [x.tipo, x]));
export const VISTAS: Vista[] = ["presente", "A", "B", "C"];

/** Onde fica o rótulo de cada país em relação ao nó (evita sobreposição no Cone Sul e no Caribe). */
export const ROTULO: Record<string, { dx: number; dy: number; ancora: "start" | "middle" | "end" }> = {
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
export const MUDANCA: { chave: "nova" | "transformada" | "reforcada" | "enfraquecida" | "ausente"; titulo: string; glifo: string }[] = [
  { chave: "nova", titulo: "Novas", glifo: "+" },
  { chave: "transformada", titulo: "Mudam de natureza", glifo: "⇄" },
  { chave: "reforcada", titulo: "Reforçadas", glifo: "↑" },
  { chave: "enfraquecida", titulo: "Enfraquecidas", glifo: "↓" },
  { chave: "ausente", titulo: "Deixam de existir", glifo: "×" },
];
export const GLIFO = Object.fromEntries(MUDANCA.map((m) => [m.chave, m.glifo])) as Record<string, string>;
export const curto = (t: string) => (ESTILO.get(t as TipoRelacao)?.rotulo.split(" / ")[0] ?? t).toLowerCase();

/** Ponto numa curva quadrática (t de 0 a 1). */
export const naCurva = (p1: { x: number; y: number }, c: { x: number; y: number }, p2: { x: number; y: number }, t: number) => ({
  x: (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * c.x + t * t * p2.x,
  y: (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * c.y + t * t * p2.y,
});

export type Base = "documentada" | "inferida" | "condicional";
export const baseDe = (status: string): Base => (documentada(status) ? "documentada" : status === "inferencia" ? "inferida" : "condicional");

// ------------------------------------------------------------------ transição

export const suave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Interpola presença e espessura das linhas; interrompível (parte de onde a anterior estava). */
export function useTransicao(alvo: Record<string, number>, ms = 950) {
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

/** Países no mapa: Estados com capital e código ISO, projetados no quadro do mapa-múndi. */
export function paisesNoMapa(r: ResultadoDeInvestigacao) {
  const mapa = prepararMapa();
  return r.atores
    .filter((a): a is Ator & { coord: [number, number]; isoNum: string } => a.tipo === "estado" && !!a.coord && !!a.isoNum)
    .map((a) => {
      const [x, y] = mapa.projetar(a.coord[0], a.coord[1]);
      return { a, x, y };
    });
}

/**
 * Relações que viram linha no mapa: entre países ou com a âncora de um bloco. A relação de um
 * país com um bloco de que ele é membro (em alguma vista) não vira linha: a hachura já a mostra.
 */
export function relacoesDesenhaveis(r: ResultadoDeInvestigacao, ehPais: Set<string>, blocoPorAtor: Map<string, Bloco>): Relacao[] {
  return r.relacoes.filter((rel) => {
    const a = ehPais.has(rel.de) || blocoPorAtor.has(rel.de);
    const b = ehPais.has(rel.para) || blocoPorAtor.has(rel.para);
    if (!a || !b) return false;
    const bloco = blocoPorAtor.get(rel.para) ?? blocoPorAtor.get(rel.de);
    const pais = ehPais.has(rel.de) ? rel.de : rel.para;
    return !(bloco && VISTAS.some((x) => bloco.membros[x].includes(pais)));
  });
}
