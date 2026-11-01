import type { ReactNode } from "react";

/**
 * Seção editorial: título com régua fina em cima. Não é cartão — cartões (`painel`) ficam
 * reservados a blocos que precisam se destacar.
 */
export function Secao({
  titulo,
  subtitulo,
  acao,
  children,
  emPainel = false,
  id,
}: {
  titulo: string;
  subtitulo?: string;
  acao?: ReactNode;
  children: ReactNode;
  emPainel?: boolean;
  id?: string;
}) {
  const cabecalho = (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className="font-editorial text-secao font-medium text-texto">
          {titulo}
        </h2>
        {subtitulo && <p className="mt-1 max-w-[60ch] text-legenda text-texto-2">{subtitulo}</p>}
      </div>
      {acao}
    </div>
  );
  return emPainel ? (
    <section aria-labelledby={id} className="painel min-w-0 p-5 sm:p-6">
      {cabecalho}
      {children}
    </section>
  ) : (
    <section aria-labelledby={id} className="min-w-0 border-t border-linha-forte pt-5">
      {cabecalho}
      {children}
    </section>
  );
}
