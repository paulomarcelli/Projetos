import { CircleAlert, CircleCheck, X } from "lucide-react";
import { useEffect } from "react";
import { cx } from "../ui";

export interface Retorno {
  ok: boolean;
  mensagem: string;
  /** muda a cada aviso, para reanunciar a mesma mensagem */
  chave: number;
  /** ação opcional (ex.: "Desfazer") */
  acao?: { rotulo: string; aoClicar: () => void };
}

/**
 * Retorno de uma ação (guardar, excluir) numa linha discreta com aria-live.
 * Os de sucesso somem sozinhos em 5 s; os de erro ficam até fechar.
 */
export function AvisoDeRetorno({ retorno, aoFechar, className }: { retorno: Retorno | null; aoFechar: () => void; className?: string }) {
  useEffect(() => {
    if (!retorno?.ok) return;
    const t = setTimeout(aoFechar, 5000);
    return () => clearTimeout(t);
  }, [retorno, aoFechar]);

  return (
    <div role="status" aria-live="polite" className={cx("min-h-0", className)}>
      {retorno && (
        <p
          key={retorno.chave}
          className={cx(
            "flex items-start gap-2 rounded-2xl border px-4 py-2.5 text-sm",
            retorno.ok ? "border-borda bg-superficie text-texto" : "border-perigo/30 bg-perigo-tinta text-texto",
          )}
        >
          {retorno.ok ? <CircleCheck aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-sucesso" /> : <CircleAlert aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-perigo" />}
          <span className="flex-1">{retorno.mensagem}</span>
          {retorno.acao && (
            <button type="button" className="-my-0.5 shrink-0 rounded-lg px-2 py-0.5 text-sm font-medium text-escarlate passar:bg-escarlate-tinta" onClick={retorno.acao.aoClicar}>
              {retorno.acao.rotulo}
            </button>
          )}
          <button type="button" className="-my-1 -mr-2 grid size-8 shrink-0 place-items-center rounded-full text-texto-suave passar:bg-superficie-3" aria-label="Fechar aviso" onClick={aoFechar}>
            <X aria-hidden="true" size={14} />
          </button>
        </p>
      )}
    </div>
  );
}
