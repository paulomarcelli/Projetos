import type { ReactNode } from "react";
import { Epistemico } from "../Epistemico";
import type { Afirmacao, CategoriaTempo, CenarioId } from "../../lib/investigacao";
import { documentada, useResultado } from "./contexto";

/**
 * Marcadores de evidência: cada um abre a cadeia Afirmação → Evidência → Fonte → Interpretação →
 * Implicação no painel contextual. O número mostrado é o da(s) fonte(s) na bibliografia.
 */
export function Citacoes({ ids }: { ids?: string[] }) {
  const { ix, selecionar } = useResultado();
  if (!ids?.length) return null;
  return (
    <span className="whitespace-nowrap">
      {ids.map((id) => {
        const ev = ix.evidencias.get(id);
        if (!ev) return null;
        const nums = ev.fontes.map((f) => ix.numero.get(f)).filter(Boolean);
        return (
          <button
            key={id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              selecionar({ tipo: "evidencia", id });
            }}
            title={`Ver evidência: ${ev.afirmacao}`}
            aria-label={`Ver evidência e fontes ${nums.join(", ")}: ${ev.afirmacao}`}
            className="ml-0.5 inline-flex min-h-6 items-center rounded-fino px-0.5 align-super font-dados text-[0.6875rem] leading-none text-ciano-texto hover:underline focus-visible:outline-2 focus-visible:outline-ciano"
          >
            [{nums.join(",")}]
          </button>
        );
      })}
    </span>
  );
}

/** Uma afirmação com o seu tipo epistêmico e as evidências; sinaliza quando falta suporte. */
export function LinhaAfirmacao({ a, compacta = false, grande = false }: { a: Afirmacao; compacta?: boolean; grande?: boolean }) {
  const semSuporte = documentada(a.tipo) && !a.evidencias?.length;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {!compacta && <Epistemico tipo={a.tipo} />}
      <p className={`min-w-0 ${grande ? "font-editorial text-leitura" : "text-legenda"} text-texto`}>
        {compacta && (
          <span className="mr-1.5 inline-block align-[-2px]">
            <Epistemico tipo={a.tipo} compacto />
          </span>
        )}
        {a.texto}
        <Citacoes ids={a.evidencias} />
      </p>
      {semSuporte && <p className="text-micro text-ambar">Sem evidência vinculada nesta versão.</p>}
    </div>
  );
}

export function Letra({ id, ativa = false, tamanho = "normal" }: { id: CenarioId; ativa?: boolean; tamanho?: "normal" | "grande" }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center rounded-fino border font-dados ${tamanho === "grande" ? "size-9 text-corpo" : "size-6 text-micro"} ${
        ativa ? "border-ambar bg-ambar-suave text-ambar" : "border-linha-forte text-texto-2"
      }`}
    >
      {id}
    </span>
  );
}

/** Nome de ator clicável: abre o painel do ator sem perder o lugar. */
export function ChipAtor({ id }: { id: string }) {
  const { ix, selecionar, selecao } = useResultado();
  const a = ix.atores.get(id);
  if (!a) return null;
  const ativo = selecao?.tipo === "ator" && selecao.id === id;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        selecionar({ tipo: "ator", id });
      }}
      className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-micro transition-colors ${
        ativo ? "border-ciano bg-ciano-suave text-ciano-texto" : "border-linha-forte text-texto-2 hover:border-texto-2 hover:text-texto"
      }`}
    >
      {a.curto}
    </button>
  );
}

// ------------------------------------------------------------------ categorias temporais

export const CATEGORIA: Record<CategoriaTempo, { rotulo: string; descricao: string }> = {
  observado: { rotulo: "Observado", descricao: "Evento ou condição documentada." },
  inferido: { rotulo: "Inferido", descricao: "Interpretação derivada das evidências." },
  condicional: { rotulo: "Condicional", descricao: "Depende de condições específicas." },
  projetado: { rotulo: "Projetado", descricao: "Desdobramento possível dentro de um cenário." },
};

/** Glifo da categoria: forma própria para cada uma, para que o futuro nunca pareça fato. */
export function GlifoTempo({ c, tamanho = 14 }: { c: CategoriaTempo; tamanho?: number }) {
  const comum = { width: tamanho, height: tamanho, viewBox: "0 0 16 16", "aria-hidden": true, className: "shrink-0" } as const;
  switch (c) {
    case "observado":
      return (
        <svg {...comum}>
          <circle cx="8" cy="8" r="5" fill="var(--color-texto)" />
        </svg>
      );
    case "inferido":
      return (
        <svg {...comum} fill="none" stroke="var(--color-texto-2)" strokeWidth="1.5">
          <circle cx="8" cy="8" r="5" strokeDasharray="2.4 2" />
        </svg>
      );
    case "condicional":
      return (
        <svg {...comum} fill="none" stroke="var(--color-ambar)" strokeWidth="1.5" strokeLinejoin="round">
          <path d="M8 2.5 13.5 8 8 13.5 2.5 8z" />
        </svg>
      );
    case "projetado":
      return (
        <svg {...comum} fill="none" stroke="var(--color-ambar)" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2.5 8h4M6.5 8l6-4.5M6.5 8l6 4.5" strokeDasharray="2 2" />
        </svg>
      );
  }
}

export function Rotulo({ children }: { children: ReactNode }) {
  return <p className="rotulo mb-2">{children}</p>;
}
