import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "./classes";

export interface CartaoProps extends HTMLAttributes<HTMLElement> {
  /**
   * "plano"      superfície sólida com borda discreta (padrão);
   * "vidro"      translúcido com desfoque (sobre o fundo ambiente);
   * "interativo" plano + hover/foco/pressão — use quando o cartão inteiro leva a algum lugar
   *              (ponha o <Link> dentro, e o resto do conteúdo continua clicável por ele).
   */
  variante?: "plano" | "vidro" | "interativo";
  /** Espaço interno. Padrão "medio" (20px). */
  espaco?: "nenhum" | "pequeno" | "medio" | "grande";
  /** Raio: "medio" 20px (padrão), "grande" 28px (cartões do histórico). */
  raio?: "medio" | "grande";
  /** Elemento HTML. Padrão "div" (use "article", "section", "li"…). */
  como?: ElementType;
  children?: ReactNode;
}

export function Cartao({ variante = "plano", espaco = "medio", raio = "medio", como: Como = "div", className, children, ...resto }: CartaoProps) {
  return (
    <Como className={cx("fr-cartao", `fr-cartao--${variante}`, `fr-cartao--espaco-${espaco}`, raio === "grande" && "fr-cartao--raio-grande", className)} {...resto}>
      {children}
    </Como>
  );
}
