/** Peças de composição da área de análise (seção, parte, link para outra área). */
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { RotuloDeSecao } from "./secoes/RotuloDeSecao";

/** Seção da análise: título editorial e, à direita, uma nota ou ação. Sem caixa nem linha. */
export function Bloco({ id, titulo, children, acao, descricao }: { id: string; titulo: string; children: ReactNode; acao?: ReactNode; descricao?: string }) {
  return (
    <section id={`sec-${id}`} aria-labelledby={id} className="flex scroll-mt-28 flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="flex max-w-[68ch] flex-col gap-1.5">
          <h2 id={id} className="font-editorial text-titulo font-medium tracking-[-0.01em] text-texto">
            {titulo}
          </h2>
          {descricao && <p className="text-corpo text-texto-2">{descricao}</p>}
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}

/** Subtítulo dentro de uma seção (h3), para as partes de "O que determina". */
export function Parte({ id, titulo, children, acao }: { id: string; titulo: string; children: ReactNode; acao?: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-4">
      <h3 id={id} className="text-leitura font-medium text-texto">
        {titulo}
      </h3>
      {children}
      {acao}
    </section>
  );
}

export function LinkDeArea({ children, aoClicar }: { children: ReactNode; aoClicar: () => void }) {
  return (
    <button type="button" onClick={aoClicar} className="group inline-flex min-h-9 w-fit items-center gap-1 text-legenda text-ciano-texto hover:underline">
      {children}
      <ArrowRight size={14} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5" />
    </button>
  );
}

/**
 * Uma seção da investigação, no mesmo formato do diagnóstico e dos futuros: o rótulo ("03 · Exploração e evidências")
 * e, como frase-título, a pergunta que a seção responde. A frase recebe o foco quando se chega pelo índice (o leitor de
 * tela anuncia) e a marca de chegada acende ao lado dela. O nome da região é o título da seção.
 * `destaque` dá protagonismo à seção: faixa em `institucional` com um filete de ouro no topo.
 */
export function SecaoDaInvestigacao({
  secao,
  children,
  acao,
  destaque = false,
}: {
  secao: { id: string; numero: string; titulo: string; pergunta: string };
  children: ReactNode;
  acao?: ReactNode;
  destaque?: boolean;
}) {
  return (
    <section
      id={secao.id}
      aria-label={secao.titulo}
      className={`relative flex scroll-mt-[calc(var(--altura-topo,0px)+4.5rem)] flex-col gap-6 ${
        destaque ? "-mx-4 rounded-painel bg-institucional/60 px-4 py-8 sm:-mx-6 sm:px-6 sm:py-10 print:bg-transparent" : ""
      }`}
    >
      {destaque && <span aria-hidden="true" className="absolute inset-x-4 top-0 h-px bg-ouro/60 sm:inset-x-6" />}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="relative flex max-w-[68ch] flex-col gap-4">
          <span aria-hidden="true" className="marca-chegada absolute top-1 -left-4 h-[calc(100%-0.5rem)] w-0.5 origin-top rounded-full bg-ciano sm:-left-5" />
          <RotuloDeSecao numero={secao.numero} nome={secao.titulo} nucleo={destaque} />
          <h2 tabIndex={-1} data-titulo-secao className="font-editorial text-secao font-medium text-balance text-texto outline-none sm:text-titulo">
            {secao.pergunta}
          </h2>
        </div>
        {acao}
      </header>
      {children}
    </section>
  );
}

/** Subtítulo de uma parte dentro de uma seção, com uma linha opcional explicando o que a parte mostra. */
export function Subtitulo({ id, titulo, children, acao, prefixo }: { id: string; titulo: string; children?: ReactNode; acao?: ReactNode; prefixo?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
      <div className="flex max-w-[64ch] flex-col gap-1">
        <h3 id={id} className="flex items-baseline gap-2 text-leitura font-medium text-texto">
          {prefixo && (
            <span aria-hidden="true" className="font-dados text-micro text-texto-3">
              {prefixo}
            </span>
          )}
          {titulo}
        </h3>
        {children && <p className="text-legenda text-texto-2">{children}</p>}
      </div>
      {acao}
    </div>
  );
}
