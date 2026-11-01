/**
 * 01 · Diagnóstico atual — a leitura do presente em duas peças: um título curto (`manchete`) e um parágrafo (`sintese`).
 * A tela de análise está sendo refeita por partes: esta é a primeira, e fica só no essencial.
 *
 * Sem `manchete` (o motor ainda não escreve), a seção abre direto no parágrafo; nada é inventado para preencher.
 */
import { useResultado } from "../investigacao/contexto";
import { SECOES } from "../investigacao/secoes";
import { RotuloDeSecao } from "./RotuloDeSecao";

export function SecaoDiagnostico() {
  const { r } = useResultado();
  const secao = SECOES[0];
  return (
    <section id={secao.id} aria-label={secao.titulo} className="flex scroll-mt-[calc(var(--altura-topo,0px)+4.5rem)] flex-col gap-4">
      <RotuloDeSecao numero={secao.numero} nome={secao.titulo} />
      {r.manchete && (
        <h2 tabIndex={-1} data-titulo-secao className="max-w-[28ch] font-editorial text-secao font-medium text-balance text-texto outline-none sm:text-titulo">
          {r.manchete}
        </h2>
      )}
      <p className="max-w-[64ch] text-leitura leading-relaxed text-pretty text-texto-2">{r.sintese}</p>
    </section>
  );
}
