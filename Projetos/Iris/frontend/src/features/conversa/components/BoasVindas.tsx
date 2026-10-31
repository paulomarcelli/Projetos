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
        <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 text-micro text-texto-3" aria-label="Temas">
          {TEMAS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </header>

      {campo}
    </div>
  );
}
