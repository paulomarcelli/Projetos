import { useEffect, useRef, type KeyboardEvent } from "react";
import { mascaraDeBordas, useBordasDeRolagem } from "../../../hooks/useBordasDeRolagem";

/**
 * Barra de abas (padrão do WAI-ARIA: setas, Home e End movem o foco e ativam). Genérica: a seção 05 usa para o
 * mapa, a linha do tempo e as evidências. No celular as abas rolam de lado: um degradê na borda mostra que há mais
 * abas, e a aba ativa entra na tela.
 */
export function BarraDeAbas<T extends string>({
  itens,
  ativa: aba,
  aoEscolher: irPara,
  rotulo,
  idBase,
  painel,
}: {
  itens: { id: T; nome: string }[];
  ativa: T;
  aoEscolher: (id: T) => void;
  rotulo: string;
  idBase: string;
  /** id do tabpanel controlado */
  painel: string;
}) {
  const ABAS = itens;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const { ref: rolagem, inicio, fim } = useBordasDeRolagem<HTMLDivElement>();
  const mascara = mascaraDeBordas(inicio, fim);
  useEffect(() => {
    const el = refs.current[ABAS.findIndex((a) => a.id === aba)];
    const caixa = rolagem.current;
    if (!el || !caixa) return;
    // Só rola a barra na horizontal (scrollIntoView também rolaria a página).
    const esq = el.offsetLeft - 16;
    const dir = el.offsetLeft + el.offsetWidth + 16 - caixa.clientWidth;
    if (esq < caixa.scrollLeft) caixa.scrollLeft = esq;
    else if (dir > caixa.scrollLeft) caixa.scrollLeft = dir;
  }, [aba, rolagem]);
  const teclado = (e: KeyboardEvent, i: number) => {
    const n = ABAS.length;
    const alvo = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (alvo < 0) return;
    e.preventDefault();
    irPara(ABAS[alvo].id);
    refs.current[alvo]?.focus();
  };
  return (
    <div
      ref={rolagem}
      style={mascara ? { maskImage: mascara, WebkitMaskImage: mascara } : undefined}
      className="relative -mx-1 overflow-x-auto overscroll-x-contain border-b border-linha px-1 [scrollbar-width:none] print:hidden [&::-webkit-scrollbar]:hidden"
    >
      <div role="tablist" aria-label={rotulo} className="flex w-max gap-1">
        {ABAS.map((a, i) => (
          <button
            key={a.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${idBase}-${a.id}`}
            aria-selected={aba === a.id}
            aria-controls={painel}
            tabIndex={aba === a.id ? 0 : -1}
            onClick={() => irPara(a.id)}
            onKeyDown={(e) => teclado(e, i)}
            className={`relative flex min-h-11 items-center px-3 text-corpo whitespace-nowrap transition-colors duration-150 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors after:duration-150 ${
              aba === a.id ? "text-texto after:bg-ciano" : "text-texto-2 after:bg-transparent hover:text-texto"
            }`}
          >
            {a.nome}
          </button>
        ))}
      </div>
    </div>
  );
}
