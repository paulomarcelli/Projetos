import { useId } from "react";
import {
  CENTRO_MEDIA,
  CENTRO_PEQUENA,
  DEGRADE_LOGO,
  ESTRELA_GRANDE,
  ESTRELA_MEDIA,
  ESTRELA_PEQUENA,
  PROPORCAO_LOGO,
  VIEWBOX_LOGO,
} from "./geometria";

export interface LogoProps {
  /** Altura do símbolo em px (a palavra acompanha). Padrão: 32. */
  tamanho?: number;
  /** "simbolo" = só as três estrelas; "completa" = estrelas + "F.R.E.Y.A.". */
  variante?: "simbolo" | "completa";
  /** Cintilar da estrela pequena ao passar o ponteiro (respeita movimento reduzido). */
  animada?: boolean;
  /** Nome acessível. Use "" quando a logo for decorativa (por exemplo, dentro de um link já rotulado). */
  titulo?: string;
  className?: string;
}

/**
 * Logo da F.R.E.Y.A.: as três estrelas do original, no degradê escarlate do tema
 * (carmim → escarlate no claro; escarlate → brasa no escuro, via --logo-de/--logo-meio/--logo-ate).
 */
export function Logo({ tamanho = 32, variante = "simbolo", animada = false, titulo = "F.R.E.Y.A.", className }: LogoProps) {
  const id = useId().replace(/:/g, "");
  const decorativa = titulo === "";
  const largura = Math.round(tamanho * PROPORCAO_LOGO * 10) / 10;

  const simbolo = (
    <svg
      className="fr-logo-simbolo"
      width={largura}
      height={tamanho}
      viewBox={VIEWBOX_LOGO}
      aria-hidden={decorativa || variante === "completa" ? true : undefined}
      role={decorativa || variante === "completa" ? undefined : "img"}
      aria-label={decorativa || variante === "completa" ? undefined : titulo}
      focusable="false"
    >
      <defs>
        <linearGradient id={`logo-${id}`} gradientUnits="userSpaceOnUse" {...DEGRADE_LOGO}>
          <stop offset="0" style={{ stopColor: "var(--logo-de)" }} />
          <stop offset="0.55" style={{ stopColor: "var(--logo-meio)" }} />
          <stop offset="1" style={{ stopColor: "var(--logo-ate)" }} />
        </linearGradient>
      </defs>
      <g fill={`url(#logo-${id})`}>
        <path d={ESTRELA_GRANDE} />
        <path className="fr-logo-media" d={ESTRELA_MEDIA} style={{ transformOrigin: `${CENTRO_MEDIA.x}px ${CENTRO_MEDIA.y}px` }} />
        <path className="fr-logo-pequena" d={ESTRELA_PEQUENA} style={{ transformOrigin: `${CENTRO_PEQUENA.x}px ${CENTRO_PEQUENA.y}px` }} />
      </g>
    </svg>
  );

  if (variante === "simbolo") {
    return (
      <span className={["fr-logo", className].filter(Boolean).join(" ")} data-animada={animada || undefined}>
        {simbolo}
      </span>
    );
  }

  return (
    <span
      className={["fr-logo fr-logo-completa", className].filter(Boolean).join(" ")}
      data-animada={animada || undefined}
      role={decorativa ? undefined : "img"}
      aria-label={decorativa ? undefined : titulo}
      aria-hidden={decorativa || undefined}
    >
      {simbolo}
      <span className="fr-logo-palavra" style={{ fontSize: `${Math.max(14, tamanho * 0.6)}px` }} aria-hidden="true">
        F.R.E.Y.A.
      </span>
    </span>
  );
}
