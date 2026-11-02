/**
 * Preferências da interface, guardadas neste navegador (localStorage "freya:preferencias").
 *
 * O backend não tem usuário nem preferências (não há autenticação; ver docs/FRONTEND.md), então elas
 * ficam aqui. Ao mudar, são aplicadas no <html>:
 *   data-tema="claro|escuro"   → os tokens de cor (styles/tokens.css)
 *   data-fonte="outfit|…"      → --fonte-texto
 *   font-size                  → escala do texto (todo o tamanho é em rem)
 *   data-movimento="reduzido"  → desliga efeitos (além de prefers-reduced-motion)
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Tema = "claro" | "escuro";
export type Fonte = "outfit" | "inter" | "plex" | "atkinson";
export type EscalaDeTexto = 0.9 | 1 | 1.125 | 1.25;

export interface Perfil {
  nome: string;
  funcao: string;
}

export interface Preferencias {
  tema: Tema;
  fonte: Fonte;
  escala: EscalaDeTexto;
  menuRecolhido: boolean;
  reduzirMovimento: boolean;
  perfil: Perfil;
}

export const FONTES: Record<Fonte, { nome: string; pilha: string; descricao: string }> = {
  outfit: { nome: "Outfit", pilha: '"Outfit Variable", "Inter Variable", system-ui, sans-serif', descricao: "Geométrica, a da referência do Figma" },
  inter: { nome: "Inter", pilha: '"Inter Variable", system-ui, sans-serif', descricao: "Neutra, ótima em telas densas" },
  plex: { nome: "IBM Plex Sans", pilha: '"IBM Plex Sans Variable", system-ui, sans-serif', descricao: "Técnica, de leitura analítica" },
  atkinson: { nome: "Atkinson Hyperlegible", pilha: '"Atkinson Hyperlegible", system-ui, sans-serif', descricao: "Feita para máxima legibilidade" },
};

export const ESCALAS: { valor: EscalaDeTexto; nome: string }[] = [
  { valor: 0.9, nome: "Compacto" },
  { valor: 1, nome: "Padrão" },
  { valor: 1.125, nome: "Grande" },
  { valor: 1.25, nome: "Muito grande" },
];

const CHAVE = "freya:preferencias";

function temaDoSistema(): Tema {
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
}

export const PADRAO: Omit<Preferencias, "tema"> = {
  fonte: "outfit",
  escala: 1,
  menuRecolhido: false,
  reduzirMovimento: false,
  perfil: { nome: "Analista", funcao: "Inteligência prospectiva" },
};

function carregar(): Preferencias {
  const base: Preferencias = { tema: temaDoSistema(), ...PADRAO };
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? "{}") as Partial<Preferencias>;
    return { ...base, ...salvo, perfil: { ...base.perfil, ...(salvo.perfil ?? {}) } };
  } catch {
    return base;
  }
}

function aplicar(p: Preferencias) {
  const raiz = document.documentElement;
  raiz.dataset.tema = p.tema;
  raiz.dataset.fonte = p.fonte;
  raiz.style.setProperty("--fonte-texto", FONTES[p.fonte].pilha);
  raiz.style.fontSize = `${p.escala * 100}%`;
  if (p.reduzirMovimento) raiz.dataset.movimento = "reduzido";
  else delete raiz.dataset.movimento;
}

interface ValorDoContexto extends Preferencias {
  definir: (parcial: Partial<Preferencias>) => void;
  definirTema: (tema: Tema) => void;
  restaurarPadrao: () => void;
  /** true se o sistema ou a preferência pedem menos movimento */
  movimentoReduzido: boolean;
}

const Contexto = createContext<ValorDoContexto | null>(null);

export function ProvedorDePreferencias({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferencias>(carregar);
  const [sistemaReduz, setSistemaReduz] = useState(
    () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    aplicar(prefs);
    try {
      localStorage.setItem(CHAVE, JSON.stringify(prefs));
    } catch {
      /* navegação privada ou armazenamento bloqueado: as preferências valem só nesta aba */
    }
  }, [prefs]);

  useEffect(() => {
    if (typeof matchMedia === "undefined") return;
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    const ouvir = () => setSistemaReduz(m.matches);
    m.addEventListener?.("change", ouvir);
    return () => m.removeEventListener?.("change", ouvir);
  }, []);

  const definir = useCallback((parcial: Partial<Preferencias>) => setPrefs((p) => ({ ...p, ...parcial })), []);
  const definirTema = useCallback((tema: Tema) => setPrefs((p) => ({ ...p, tema })), []);
  const restaurarPadrao = useCallback(() => setPrefs((p) => ({ ...p, ...PADRAO, perfil: p.perfil })), []);

  const valor = useMemo<ValorDoContexto>(
    () => ({ ...prefs, definir, definirTema, restaurarPadrao, movimentoReduzido: sistemaReduz || prefs.reduzirMovimento }),
    [prefs, definir, definirTema, restaurarPadrao, sistemaReduz],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePreferencias(): ValorDoContexto {
  const v = useContext(Contexto);
  if (!v) throw new Error("usePreferencias fora do ProvedorDePreferencias");
  return v;
}
