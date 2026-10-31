import { ExternalLink } from "lucide-react";
import type { Fonte } from "../../../types/fonte";
import { NATUREZA } from "../../investigacao/components/painel/pecasDoPainel";

export function CartaoFonte({ f, n }: { f: Fonte; n?: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-padrao border border-linha p-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-micro text-texto-3">
        {n !== undefined && <span className="numeros font-dados text-ciano-texto">[{n}]</span>}
        <span>{NATUREZA[f.natureza]}</span>
        <span>· {f.genero}</span>
        {f.demonstrativa && <span className="text-ambar">· Referência demonstrativa</span>}
      </div>
      <a href={f.url} target="_blank" rel="noreferrer" className="inline-flex w-fit items-baseline gap-1.5 text-corpo text-ciano-texto hover:underline [overflow-wrap:anywhere]">
        {f.titulo}
        <ExternalLink size={12} aria-hidden="true" className="shrink-0" />
        <span className="sr-only">(abre em nova aba)</span>
      </a>
      <p className="text-micro text-texto-3">
        {f.autor ? `${f.autor} · ` : ""}
        {f.veiculo} · {f.data}
      </p>
      {f.trecho ? (
        <blockquote className="m-0 border-l-2 border-linha-forte pl-3 font-editorial text-legenda text-texto-2 italic">“{f.trecho}”</blockquote>
      ) : (
        <p className="text-micro text-ambar">Trecho não registrado: o texto não pôde ser conferido.</p>
      )}
      {f.limitacoes && <p className="text-micro text-texto-3">Limitação: {f.limitacoes}</p>}
    </div>
  );
}
