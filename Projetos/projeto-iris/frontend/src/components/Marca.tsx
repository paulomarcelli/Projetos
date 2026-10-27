import { MARCA } from "../lib/marca";

/**
 * Símbolo: um globo visto como íris. Meridiano e equador formam o sistema de coordenadas
 * (o presente mapeado); o arco ciano é a abertura do diafragma: o olhar que se projeta adiante.
 */
export function SimboloIris({ tamanho = 28 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <g fill="none" strokeWidth="1.3">
        <circle cx="16" cy="16" r="12" stroke="var(--color-texto-2)" />
        <ellipse cx="16" cy="16" rx="5.4" ry="12" stroke="var(--color-texto-2)" opacity="0.8" />
        <path d="M4 16h24" stroke="var(--color-texto-2)" opacity="0.8" />
        <path d="M16 4a12 12 0 0 1 12 12" stroke="var(--color-ciano)" strokeWidth="2.2" strokeLinecap="round" />
      </g>
      <circle cx="16" cy="16" r="2.6" fill="var(--color-texto)" />
    </svg>
  );
}

export function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <SimboloIris />
      {!compacta && (
        <span className="flex flex-col leading-none">
          <span className="font-editorial text-[1.25rem] font-semibold tracking-[-0.01em] text-texto">
            {MARCA.nomeCurto}
          </span>
          <span className="mt-1 text-micro text-texto-3">Prospectiva · R.I.</span>
        </span>
      )}
    </span>
  );
}
