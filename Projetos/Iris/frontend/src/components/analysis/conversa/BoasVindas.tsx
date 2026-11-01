/**
 * A conversa vazia: o convite e o campo da pergunta (com o horizonte embaixo). Sem perguntas prontas: a pessoa
 * escreve a dela.
 */
import type { ReactNode } from "react";

const TEMAS = ["Geopolítica", "Conflitos", "Comércio internacional", "Multilateralismo", "Diplomacia", "Segurança", "Política externa", "Ordem mundial"];

export function BoasVindas({ campo }: { campo: ReactNode }) {
  return (
    <div className="surgir flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="font-editorial text-[2rem] leading-[2.375rem] font-medium tracking-[-0.015em] text-texto sm:text-manchete">
          <span className="block">Entenda o presente.</span>
          <span className="block text-texto-2">Explore futuros possíveis.</span>
        </h1>
        <p className="max-w-[38rem] text-corpo text-texto-2">
          Pergunte sobre uma questão internacional. A Iris explica o que está acontecendo, quem está envolvido e quais
          trajetórias são possíveis, sempre com as evidências à vista.
        </p>
        {/* Só informa o alcance: não são links nem filtros. O rótulo e os pontos separadores evitam que
            a fileira pareça clicável. */}
        <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-micro text-texto-3">
          <span className="text-texto-2">Temas que a Iris cobre:</span>
          <span className="sr-only">{TEMAS.join(", ")}</span>
          {TEMAS.map((t, i) => (
            <span key={t} aria-hidden="true">
              {t}
              {i < TEMAS.length - 1 && <span className="ml-2 text-linha-forte">·</span>}
            </span>
          ))}
        </p>
      </header>

      {campo}
    </div>
  );
}
