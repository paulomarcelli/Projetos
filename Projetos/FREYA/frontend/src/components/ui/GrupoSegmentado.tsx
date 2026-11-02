import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cx } from "./classes";

export interface OpcaoSegmentada<T extends string> {
  valor: T;
  rotulo: ReactNode;
  icone?: ReactNode;
  /** Nome acessível quando o rótulo visível não basta (ex.: só ícone). */
  rotuloAcessivel?: string;
  desativada?: boolean;
}

export interface GrupoSegmentadoProps<T extends string> {
  /** Nome do grupo (aria-label). */
  rotulo: string;
  opcoes: OpcaoSegmentada<T>[];
  valor: T;
  aoMudar: (valor: T, evento: { origem: { x: number; y: number } }) => void;
  tamanho?: "pequeno" | "medio";
  larguraTotal?: boolean;
  className?: string;
}

/**
 * Controle segmentado com semântica de radiogroup (setas mudam a seleção, Tab entra/sai do grupo).
 * O indicador desliza com transform (segmentos de largura igual), 200ms ease-out.
 * `aoMudar` recebe também o centro do segmento — útil para disparar o Reality Shift a partir dele.
 */
export function GrupoSegmentado<T extends string>({ rotulo, opcoes, valor, aoMudar, tamanho = "medio", larguraTotal, className }: GrupoSegmentadoProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const indice = Math.max(
    0,
    opcoes.findIndex((o) => o.valor === valor),
  );

  function centro(i: number) {
    const r = refs.current[i]?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: 0, y: 0 };
  }

  function escolher(i: number, focar: boolean) {
    const op = opcoes[i];
    if (!op || op.desativada) return;
    if (focar) refs.current[i]?.focus();
    if (op.valor !== valor) aoMudar(op.valor, { origem: centro(i) });
  }

  function tecla(e: KeyboardEvent<HTMLDivElement>) {
    const n = opcoes.length;
    let alvo = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") alvo = (indice + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") alvo = (indice - 1 + n) % n;
    else if (e.key === "Home") alvo = 0;
    else if (e.key === "End") alvo = n - 1;
    if (alvo < 0) return;
    e.preventDefault();
    // pula desativadas na direção do movimento
    const passo = e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "End" ? -1 : 1;
    for (let k = 0; k < n && opcoes[alvo]?.desativada; k++) alvo = (alvo + passo + n) % n;
    escolher(alvo, true);
  }

  return (
    <div
      role="radiogroup"
      aria-label={rotulo}
      className={cx("fr-segmentado", `fr-segmentado--${tamanho}`, larguraTotal && "fr-segmentado--largo", className)}
      style={{ gridTemplateColumns: `repeat(${opcoes.length}, minmax(0, 1fr))` }}
      onKeyDown={tecla}
    >
      <span
        className="fr-segmentado-indicador"
        aria-hidden="true"
        style={{ width: `calc((100% - 8px) / ${opcoes.length})`, transform: `translateX(${indice * 100}%)` }}
      />
      {opcoes.map((op, i) => {
        const ativo = i === indice;
        return (
          <button
            key={op.valor}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={ativo}
            aria-label={op.rotuloAcessivel}
            tabIndex={ativo ? 0 : -1}
            disabled={op.desativada}
            className="fr-segmentado-opcao"
            data-ativo={ativo || undefined}
            onClick={() => escolher(i, false)}
          >
            {op.icone && (
              <span className="fr-segmentado-icone" aria-hidden="true">
                {op.icone}
              </span>
            )}
            <span>{op.rotulo}</span>
          </button>
        );
      })}
    </div>
  );
}
