import type { ReactNode } from "react";

/** Origem de um número ou de um conjunto de dados: todo indicador diz de onde veio. */
export function Origem({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-w-0 items-baseline gap-1.5 text-micro text-texto-3">
      <span className="shrink-0">fonte</span>
      <code className="min-w-0 font-dados text-[0.6875rem] text-texto-3 [overflow-wrap:anywhere]">{children}</code>
    </span>
  );
}
