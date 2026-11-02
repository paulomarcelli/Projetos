import { Compass } from "lucide-react";
import type { Sustentacao } from "./sustentacao";

/** Aviso calmo quando a questão tem pouca sustentação na base do MCU (derivado dos dados, nunca de um id). */
export function AvisoDeSustentacao({ sustentacao }: { sustentacao: Sustentacao }) {
  if (!sustentacao.fraca) return null;
  return (
    <aside aria-labelledby="aviso-sustentacao-titulo" className="flex gap-4 rounded-3xl border border-aviso/30 bg-aviso-tinta p-5 text-texto">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-superficie text-aviso" aria-hidden="true">
        <Compass size={20} strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <h2 id="aviso-sustentacao-titulo" className="text-base font-semibold">
          Pouca sustentação nas fontes
        </h2>
        <p className="mt-1 text-sm text-texto-suave">
          A base da F.R.E.Y.A. cobre o MCU; esta questão tem pouca sustentação nas fontes — leia os cenários como hipóteses condicionais.
        </p>
        {sustentacao.motivos.length > 0 && (
          <p className="mt-2 text-sm text-texto-suave">
            <span className="font-medium text-texto">Por quê: </span>
            {sustentacao.motivos.join("; ")}.
          </p>
        )}
      </div>
    </aside>
  );
}
