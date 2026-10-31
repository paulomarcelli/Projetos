/** Peças comuns às partes da resposta: cabeçalho de seção, frase rastreável e nome de ator clicável. */
import type { ReactNode } from "react";
import { Epistemico } from "../../../common/Epistemico";
import type { Afirmacao } from "../../../../types/fonte";
import { useResultado } from "../../investigacao/contexto";
import { Citacoes } from "../../investigacao/pecas";

/** As partes da resposta, na ordem da lógica: presente → dinâmicas → futuros → sinais → exploração. */
export const PARTES = [
  { id: "diagnostico", nome: "Diagnóstico" },
  { id: "dinamicas", nome: "Dinâmicas" },
  { id: "cenarios", nome: "Cenários" },
  { id: "monitoramento", nome: "Monitoramento" },
  { id: "explorar", nome: "Explorar" },
] as const;
export type Parte = (typeof PARTES)[number]["id"];

export const ancora = (rid: string, parte: Parte) => `${parte}-${rid}`;

export function CabecalhoDeParte({ rid, parte, titulo, children }: { rid: string; parte: Parte; titulo: string; children?: ReactNode }) {
  const n = PARTES.findIndex((p) => p.id === parte) + 1;
  return (
    <header className="flex flex-col gap-1.5">
      <p className="flex items-center gap-2 text-micro text-texto-3">
        <span className="numeros font-dados">{String(n).padStart(2, "0")}</span>
        <span aria-hidden="true" className="h-px w-6 bg-linha-forte" />
      </p>
      <h3 id={`${ancora(rid, parte)}-t`} className="font-editorial text-secao text-texto">
        {titulo}
      </h3>
      {children && <p className="max-w-[60ch] text-legenda text-texto-2">{children}</p>}
    </header>
  );
}

/** Uma afirmação como frase: o tipo epistêmico discreto à frente (fato, inferência, hipótese…) e as citações. */
export function Frase({ a, como = "span" }: { a: Afirmacao; como?: "span" | "p" | "li" }) {
  const Tag = como;
  return (
    <Tag>
      <span className="mr-1.5 inline-block align-[-2px]">
        <Epistemico tipo={a.tipo} compacto />
      </span>
      {a.texto}
      <Citacoes ids={a.evidencias} />
    </Tag>
  );
}

export function NomeDoAtor({ id, children }: { id: string; children: ReactNode }) {
  const { selecionar } = useResultado();
  return (
    <button
      type="button"
      onClick={() => selecionar({ tipo: "ator", id })}
      className="font-medium text-texto underline decoration-linha-forte underline-offset-4 transition-colors duration-150 hover:decoration-ciano"
    >
      {children}
    </button>
  );
}
