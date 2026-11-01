import type { ReactNode } from "react";

/** Cabeçalho padrão das páginas internas. */
export function CabecalhoDePagina({
  rotulo,
  titulo,
  children,
  acoes,
}: {
  rotulo?: string;
  titulo: string;
  children?: ReactNode;
  acoes?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-linha pb-6 [&:not(:last-child)]:mb-8 [.flex>&]:mb-0">
      <div className="min-w-0 max-w-3xl">
        {rotulo && <p className="rotulo mb-2">{rotulo}</p>}
        <h1 className="font-editorial text-titulo font-medium tracking-[-0.01em] text-texto">{titulo}</h1>
        {children && <div className="mt-2 max-w-[65ch] text-corpo text-texto-2">{children}</div>}
      </div>
      {acoes && <div className="flex shrink-0 flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}

