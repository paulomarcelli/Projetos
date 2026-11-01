import { useEffect, useRef, type KeyboardEvent } from "react";
import { mascaraDeBordas, useBordasDeRolagem } from "../../../hooks/useBordasDeRolagem";
import { ABAS, useResultado } from "./contexto";

/**
 * Barra das quatro áreas (padrão de abas do WAI-ARIA: setas, Home e End movem o foco e ativam).
 * Fica presa ao topo no desktop para que a troca de área esteja sempre a um clique. No celular as
 * abas rolam de lado: um degradê na borda mostra que há mais abas, e a aba ativa entra na tela.
 */
export function BarraDeAbas() {
  const { aba, irPara } = useResultado();
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
      className="relative z-20 -mx-1 overflow-x-auto overscroll-x-contain border-b border-linha bg-abismo/95 px-1 [scrollbar-width:none] lg:sticky lg:top-[var(--altura-topo,0px)] print:hidden [&::-webkit-scrollbar]:hidden"
    >
      <div role="tablist" aria-label="Áreas da investigação" className="flex w-max gap-1">
        {ABAS.map((a, i) => (
          <button
            key={a.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`aba-${a.id}`}
            aria-selected={aba === a.id}
            aria-controls="painel-aba"
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
