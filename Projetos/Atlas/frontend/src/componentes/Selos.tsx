import type { Natureza, Nivel, Status } from "../api/tipos";
import { NATUREZA, NIVEL, STATUS } from "../lib/rotulos";

const COR_NIVEL: Record<Nivel, string> = { baixo: "bg-baixo", moderado: "bg-moderado", alto: "bg-alto" };
const TEXTO_NIVEL: Record<Nivel, string> = { baixo: "text-baixo", moderado: "text-moderado", alto: "text-alto" };

/** Nível sempre com texto: a cor nunca é a única pista. */
export function SeloNivel({ nivel, prefixo }: { nivel: Nivel; prefixo?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-borda bg-fundo/60 px-2 py-0.5 text-xs">
      <span aria-hidden className={`h-2 w-2 rounded-full ${COR_NIVEL[nivel]}`} />
      {prefixo && <span className="text-suave">{prefixo}</span>}
      <span className={`font-medium ${TEXTO_NIVEL[nivel]}`}>{NIVEL[nivel]}</span>
    </span>
  );
}

const ESTILO_NATUREZA: Record<Natureza, string> = {
  fato: "border-acento/60 bg-acento/15 text-acento",
  interpretacao: "border-borda bg-painel2 text-texto",
  premissa: "border-dashed border-suave/50 bg-transparent text-suave",
  hipotese: "border-moderado/40 bg-moderado/10 text-moderado",
};

export function TagNatureza({ natureza }: { natureza: Natureza }) {
  const n = NATUREZA[natureza];
  return (
    <span title={n.dica} className={`inline-flex shrink-0 items-center rounded border px-1.5 py-px text-2xs font-medium uppercase tracking-wider ${ESTILO_NATUREZA[natureza]}`}>
      {n.rotulo}
    </span>
  );
}

const ESTILO_STATUS: Record<Status, string> = {
  pendente: "text-suave border-borda",
  executando: "text-acento border-acento/50",
  concluida: "text-baixo border-baixo/50",
  parcial: "text-moderado border-moderado/50",
  falhou: "text-alto border-alto/50",
};

export function SeloStatus({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${ESTILO_STATUS[status]}`}>
      {status === "executando" && <span aria-hidden className="h-1.5 w-1.5 animate-pulso rounded-full bg-acento" />}
      {STATUS[status]}
    </span>
  );
}

export function SeloDemo({ compacto }: { compacto?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-moderado/60 bg-moderado/10 px-2.5 py-0.5 text-xs font-semibold text-moderado" title="Sem chaves de API: nada é pesquisado na web e nenhum conteúdo é apresentado como fato.">
      <span aria-hidden>◆</span> {compacto ? "Demo" : "Modo demonstrativo"}
    </span>
  );
}
