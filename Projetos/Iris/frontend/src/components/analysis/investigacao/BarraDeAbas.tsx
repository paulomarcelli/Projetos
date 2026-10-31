import { useRef, type KeyboardEvent } from "react";
import { ABAS, useResultado } from "./contexto";

/**
 * Barra das quatro áreas (padrão de abas do WAI-ARIA: setas, Home e End movem o foco e ativam).
 * Fica presa ao topo no desktop para que a troca de área esteja sempre a um clique.
 */
export function BarraDeAbas() {
  const { aba, irPara } = useResultado();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const teclado = (e: KeyboardEvent, i: number) => {
    const n = ABAS.length;
    const alvo = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (alvo < 0) return;
    e.preventDefault();
    irPara(ABAS[alvo].id);
    refs.current[alvo]?.focus();
  };
  return (
    <div className="z-20 -mx-1 overflow-x-auto border-b border-linha bg-abismo/95 px-1 lg:sticky lg:top-[var(--altura-topo,0px)] print:hidden">
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
              aba === a.id ? "text-texto after:bg-ouro" : "text-texto-2 after:bg-transparent hover:text-texto"
            }`}
          >
            {a.nome}
          </button>
        ))}
      </div>
    </div>
  );
}
