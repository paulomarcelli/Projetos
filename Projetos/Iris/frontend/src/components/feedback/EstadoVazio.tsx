import type { ReactNode } from "react";
import { Epistemico, type TipoEpistemico } from "../ui/Epistemico";

/**
 * Estado vazio útil: diz o que vai aparecer aqui, por que ainda não há nada e o que fazer.
 * Nunca mostra dados simulados.
 */
export function EstadoVazio({
  titulo,
  children,
  acao,
  marcador,
  icone,
}: {
  titulo: string;
  children?: ReactNode;
  acao?: ReactNode;
  marcador?: { tipo: TipoEpistemico; rotulo?: string };
  icone?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 py-2">
      {icone && <span className="text-texto-3">{icone}</span>}
      {marcador && <Epistemico tipo={marcador.tipo} rotulo={marcador.rotulo} />}
      <p className="font-editorial text-secao text-texto">{titulo}</p>
      {children && <div className="max-w-[60ch] text-corpo text-texto-2">{children}</div>}
      {acao && <div className="pt-1">{acao}</div>}
    </div>
  );
}
