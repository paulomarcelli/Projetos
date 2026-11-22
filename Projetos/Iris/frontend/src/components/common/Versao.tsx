/**
 * Versão de um cenário ou de uma investigação (componente Versão do docs/design-system.md): "v3 · em vigor".
 * O ponto de ouro só na versão em vigor (o ouro é o cenário como objeto, sempre cheio); a anterior fica apagada; o
 * rascunho leva borda tracejada. Mono, porque é dado.
 */
export type EstadoDaVersao = "vigor" | "anterior" | "rascunho";

const TEXTO: Record<EstadoDaVersao, string> = { vigor: "em vigor", anterior: "anterior", rascunho: "rascunho" };

export function Versao({ numero, estado = "vigor" }: { numero: number; estado?: EstadoDaVersao }) {
  return (
    <span
      className={`numeros inline-flex min-h-6 shrink-0 items-center gap-1.5 rounded-fino border px-2 font-dados text-micro whitespace-nowrap ${
        estado === "rascunho" ? "border-dashed border-linha-forte text-texto-3" : estado === "anterior" ? "border-linha text-texto-3" : "border-linha-forte text-texto"
      }`}
    >
      {estado === "vigor" && <span aria-hidden="true" className="size-1.5 rounded-full bg-ouro" />}
      v{numero} · {TEXTO[estado]}
    </span>
  );
}

/** "2027-02-12" vira "12/02/2027" sem passar por Date (evita o dia anterior no fuso de Brasília). Outro texto fica igual. */
export function dataDoDia(valor: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : valor;
}
