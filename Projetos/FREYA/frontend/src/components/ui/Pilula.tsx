import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./classes";

export type TomDaPilula = "neutro" | "escarlate" | "sucesso" | "aviso" | "perigo";

export interface PilulaProps extends HTMLAttributes<HTMLSpanElement> {
  tom?: TomDaPilula;
  icone?: ReactNode;
  tamanho?: "pequeno" | "medio";
  children: ReactNode;
}

/** Rótulo curto em pílula: contagens, estados, etiquetas. Não é botão. */
export function Pilula({ tom = "neutro", icone, tamanho = "medio", className, children, ...resto }: PilulaProps) {
  return (
    <span className={cx("fr-pilula", `fr-pilula--${tom}`, `fr-pilula--${tamanho}`, className)} {...resto}>
      {icone && (
        <span className="fr-pilula-icone" aria-hidden="true">
          {icone}
        </span>
      )}
      {children}
    </span>
  );
}
