import type { CSSProperties } from "react";
import { FONTES, type EscalaDeTexto, type Fonte } from "../../contexts/Preferencias";
import { SeloEpistemico } from "../ui";

/** Os tokens de tamanho (em rem), refeitos em px para a escala do rascunho só dentro da prévia. */
const TAMANHOS: Record<string, number> = {
  "--texto-2xs": 0.6875,
  "--texto-xs": 0.75,
  "--texto-sm": 0.875,
  "--texto-base": 1,
  "--texto-lg": 1.125,
  "--texto-xl": 1.375,
  "--texto-2xl": 1.75,
  "--texto-3xl": 2.25,
};

export function estiloDaPrevia(fonte: Fonte, escala: EscalaDeTexto): CSSProperties {
  const vars: Record<string, string> = {};
  for (const [k, v] of Object.entries(TAMANHOS)) vars[k] = `${(v * 16 * escala).toFixed(2)}px`;
  return { ...vars, fontFamily: FONTES[fonte].pilha, fontSize: `${16 * escala}px` } as CSSProperties;
}

/**
 * Prévia do RASCUNHO: a fonte e o tamanho escolhidos valem só aqui dentro até "Aplicar".
 * Mostra a hierarquia real da análise: título, texto corrido, um cartão de cenário e um chip de evidência.
 */
export function PreviaTipografica({ fonte, escala }: { fonte: Fonte; escala: EscalaDeTexto }) {
  return (
    <figure className="m-0 rounded-3xl border border-borda bg-superficie-2 p-1.5" aria-label="Prévia da tipografia escolhida">
      <div style={estiloDaPrevia(fonte, escala)} className="rounded-[1.375rem] bg-superficie p-5 text-texto" data-testid="previa" data-fonte={fonte} data-escala={escala}>
        <p className="text-xs text-texto-fraco">Análise · Cenário C2</p>
        <p className="mt-1 text-2xl leading-tight font-semibold">Como a relação entre Thor e Loki pode evoluir?</p>
        <p className="mt-3 text-base leading-relaxed text-texto-suave">
          Contexto: as fontes confirmam o histórico ambivalente dos irmãos — parentesco, cooperação e rivalidade. Cada afirmação traz o seu tipo e as evidências.
        </p>
        <div className="mt-4 rounded-2xl border border-borda p-4">
          <p className="font-mono text-xs text-texto-fraco">C2</p>
          <p className="text-xl font-semibold">Reaproximação condicional</p>
          <p className="mt-2 text-sm text-texto-suave">Se houver um novo contato, o vínculo pode ser redefinido a partir da cooperação já registrada.</p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <SeloEpistemico tipo="hipotese" />
            <span className="inline-flex h-6 min-w-8 items-center justify-center rounded-md border border-borda-forte bg-superficie-2 px-1.5 font-mono text-2xs">E156</span>
          </div>
        </div>
      </div>
      <figcaption className="px-3 pt-2 pb-1 text-xs text-texto-fraco">
        Prévia com {FONTES[fonte].nome}, {Math.round(escala * 100)}% — o texto de exemplo é ilustrativo.
      </figcaption>
    </figure>
  );
}
