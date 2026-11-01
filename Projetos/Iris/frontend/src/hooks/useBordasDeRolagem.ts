import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Diz se um contêiner com rolagem horizontal ainda tem conteúdo escondido à esquerda e/ou à direita.
 * Serve para desenhar um degradê na borda: sem ele, uma aba cortada no celular parece o fim da barra.
 */
export function useBordasDeRolagem<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [bordas, setBordas] = useState({ inicio: false, fim: false });

  const medir = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const inicio = el.scrollLeft > 2;
    const fim = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setBordas((b) => (b.inicio === inicio && b.fim === fim ? b : { inicio, fim }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    // ResizeObserver não existe em alguns ambientes de teste; sem ele, mede só na rolagem.
    const obs = typeof ResizeObserver !== "undefined" ? new ResizeObserver(medir) : null;
    obs?.observe(el);
    return () => {
      el.removeEventListener("scroll", medir);
      obs?.disconnect();
    };
  }, [medir]);

  return { ref, ...bordas };
}

/** Máscara de degradê para as bordas que ainda escondem conteúdo. */
export function mascaraDeBordas(inicio: boolean, fim: boolean): string | undefined {
  if (!inicio && !fim) return undefined;
  const esquerda = inicio ? "transparent, black 2.5rem" : "black, black";
  const direita = fim ? "black calc(100% - 2.5rem), transparent" : "black, black";
  return `linear-gradient(to right, ${esquerda}, ${direita})`;
}
