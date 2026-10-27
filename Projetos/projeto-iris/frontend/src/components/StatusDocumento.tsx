import type { StatusDocumento } from "../lib/api";

const ROTULOS: Record<StatusDocumento, string> = {
  pending: "Na fila",
  processing: "Processando",
  completed: "Processado",
  failed: "Falhou",
};

/** Estado do processamento: forma (anel, ponto, traço) + texto, nunca só cor. */
export function SeloStatus({ status, semTexto = false }: { status: StatusDocumento; semTexto?: boolean }) {
  const estilo = {
    pending: "text-texto-2",
    processing: "text-ciano-texto",
    completed: "text-texto-2",
    failed: "text-negativo",
  }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-legenda ${estilo}`}>
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" className="shrink-0">
        {status === "completed" && <circle cx="5" cy="5" r="3.5" fill="var(--color-positivo)" />}
        {status === "pending" && <circle cx="5" cy="5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.4" />}
        {status === "processing" && (
          <circle cx="5" cy="5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="5 3" className="origin-center animate-spin [animation-duration:1.6s]" />
        )}
        {status === "failed" && <path d="M2 5h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
      </svg>
      <span className={semTexto ? "sr-only" : undefined}>{ROTULOS[status]}</span>
    </span>
  );
}

export const ROTULO_STATUS = ROTULOS;
