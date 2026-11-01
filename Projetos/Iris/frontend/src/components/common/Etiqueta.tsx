/**
 * Etiqueta de uma classificação (impacto num cenário, efeito numa premissa…). Sempre símbolo + palavra, nunca só
 * cor: o símbolo vem antes, em fonte mono, e o significado completo fica no `title`. Ver config/semantica.ts.
 */
import type { Estado } from "../../config/semantica";

export function Etiqueta({ estado, compacta = false }: { estado: Estado; compacta?: boolean }) {
  return (
    <span
      title={estado.descricao}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-px text-micro whitespace-nowrap ${estado.fundo} ${estado.cor}`}
    >
      <span aria-hidden="true" className="font-dados">
        {estado.simbolo}
      </span>
      {compacta ? <span className="sr-only">{estado.rotulo}</span> : estado.rotulo}
    </span>
  );
}
