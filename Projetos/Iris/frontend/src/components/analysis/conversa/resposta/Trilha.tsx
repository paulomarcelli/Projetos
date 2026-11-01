/**
 * A lógica da investigação, no alto da resposta: Diagnóstico → Dinâmicas → Cenários → Monitoramento → Explorar.
 * Cada passo leva à sua parte; os Cenários, o núcleo, vêm marcados em ouro. Enquanto a análise não termina, as
 * partes que ainda não existem ficam apagadas.
 */
import { Fragment } from "react";
import { ancora, PARTES, type Parte } from "./partes";

export function Trilha({ rid, prontas }: { rid: string; prontas: Parte[] }) {
  return (
    <nav aria-label="Partes da resposta" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-micro">
      {PARTES.map((p, i) => {
        const pronta = prontas.includes(p.id);
        const nucleo = p.id === "cenarios";
        return (
          <Fragment key={p.id}>
            {i > 0 && (
              <span aria-hidden="true" className="text-texto-3">
                →
              </span>
            )}
            {pronta ? (
              <a
                href={`#${ancora(rid, p.id)}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(ancora(rid, p.id))?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
                }}
                className={`rounded-full border px-2.5 py-1 transition-colors duration-150 ${
                  nucleo ? "border-ouro/50 text-texto hover:bg-ouro/10" : "border-linha text-texto-2 hover:border-linha-forte hover:text-texto"
                }`}
              >
                {p.nome}
              </a>
            ) : (
              <span className="rounded-full border border-dashed border-linha px-2.5 py-1 text-texto-3">{p.nome}</span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
