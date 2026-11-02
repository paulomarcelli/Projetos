import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "./classes";

export interface Aba {
  id: string;
  rotulo: ReactNode;
  icone?: ReactNode;
  /** Contagem opcional ao lado do rótulo (ex.: número de evidências). */
  contagem?: number;
  conteudo: ReactNode;
}

export interface AbasProps {
  /** Nome da lista de abas (aria-label). */
  rotulo: string;
  abas: Aba[];
  /** Controlado: id da aba ativa. */
  ativa?: string;
  /** Não controlado: aba inicial. */
  ativaInicial?: string;
  aoMudar?: (id: string) => void;
  className?: string;
  /** Classe aplicada ao painel. */
  classeDoPainel?: string;
}

/**
 * Abas com semântica tablist/tab/tabpanel e foco itinerante (setas, Home, End; ativação automática).
 * O sublinhado escarlate desliza com transform (translateX + scaleX), 200ms ease-in-out.
 */
export function Abas({ rotulo, abas, ativa, ativaInicial, aoMudar, className, classeDoPainel }: AbasProps) {
  const base = useId();
  const [interna, setInterna] = useState(ativaInicial ?? abas[0]?.id);
  const atual = ativa ?? interna;
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lista = useRef<HTMLDivElement>(null);
  const [indicador, setIndicador] = useState<{ x: number; w: number } | null>(null);

  useLayoutEffect(() => {
    const medir = () => {
      const el = atual ? refs.current[atual] : null;
      if (el) setIndicador({ x: el.offsetLeft, w: el.offsetWidth });
    };
    medir();
    // A escala do texto (preferências) e a largura da janela mudam a largura das abas.
    if (typeof ResizeObserver === "undefined" || !lista.current) return;
    const obs = new ResizeObserver(medir);
    obs.observe(lista.current);
    return () => obs.disconnect();
  }, [atual, abas.length]);

  function mudar(id: string, focar: boolean) {
    if (focar) refs.current[id]?.focus();
    if (id === atual) return;
    if (ativa === undefined) setInterna(id);
    aoMudar?.(id);
  }

  function tecla(e: KeyboardEvent) {
    const i = abas.findIndex((a) => a.id === atual);
    const n = abas.length;
    let alvo = -1;
    if (e.key === "ArrowRight") alvo = (i + 1) % n;
    else if (e.key === "ArrowLeft") alvo = (i - 1 + n) % n;
    else if (e.key === "Home") alvo = 0;
    else if (e.key === "End") alvo = n - 1;
    if (alvo < 0) return;
    e.preventDefault();
    mudar(abas[alvo].id, true);
  }

  const abaAtual = abas.find((a) => a.id === atual);

  return (
    <div className={cx("fr-abas", className)}>
      <div ref={lista} role="tablist" aria-label={rotulo} className="fr-abas-lista" onKeyDown={tecla}>
        {abas.map((a) => {
          const sel = a.id === atual;
          return (
            <button
              key={a.id}
              ref={(el) => {
                refs.current[a.id] = el;
              }}
              id={`${base}-aba-${a.id}`}
              type="button"
              role="tab"
              aria-selected={sel}
              aria-controls={`${base}-painel-${a.id}`}
              tabIndex={sel ? 0 : -1}
              className="fr-aba"
              data-ativa={sel || undefined}
              onClick={() => mudar(a.id, false)}
            >
              {a.icone && (
                <span className="fr-aba-icone" aria-hidden="true">
                  {a.icone}
                </span>
              )}
              <span>{a.rotulo}</span>
              {a.contagem !== undefined && <span className="fr-aba-contagem">{a.contagem}</span>}
            </button>
          );
        })}
        {indicador && (
          <span
            className="fr-abas-indicador"
            aria-hidden="true"
            style={{ transform: `translateX(${indicador.x}px) scaleX(${indicador.w})` }}
          />
        )}
      </div>
      {abaAtual && (
        <div
          id={`${base}-painel-${abaAtual.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-aba-${abaAtual.id}`}
          tabIndex={0}
          className={cx("fr-abas-painel", classeDoPainel)}
        >
          {abaAtual.conteudo}
        </div>
      )}
    </div>
  );
}
