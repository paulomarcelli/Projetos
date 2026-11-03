import { Esqueleto } from "../ui";

/** Esqueleto no formato final dos cartões (mesma altura), para não pular quando a lista chega. */
export function EsqueletoDaLista({ quantos = 4, grupos = 1 }: { quantos?: number; grupos?: number }) {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true">
      {Array.from({ length: grupos }, (_, g) => (
        <div key={g} className="flex flex-col gap-3">
          <Esqueleto largura="6rem" altura="1.5rem" />
          {Array.from({ length: quantos }, (_, i) => (
            <div key={i} className="flex items-start gap-3 rounded-3xl border border-borda bg-superficie p-3.5">
              <Esqueleto forma="circulo" largura="2.75rem" altura="2.75rem" />
              <div className="flex flex-1 flex-col gap-2 pt-1">
                <Esqueleto largura="85%" altura="1rem" />
                <Esqueleto largura="40%" altura="0.75rem" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
