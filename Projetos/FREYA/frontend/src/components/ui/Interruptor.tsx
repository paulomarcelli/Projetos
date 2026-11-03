import { useId, type ReactNode } from "react";
import { cx } from "./classes";

export interface InterruptorProps {
  marcado: boolean;
  aoMudar: (marcado: boolean) => void;
  /** Rótulo visível ao lado. */
  rotulo: ReactNode;
  /** Texto de apoio abaixo do rótulo. */
  descricao?: ReactNode;
  desativado?: boolean;
  className?: string;
  id?: string;
}

/** Interruptor liga/desliga (role="switch"). A linha inteira é clicável. */
export function Interruptor({ marcado, aoMudar, rotulo, descricao, desativado, className, id: idExterno }: InterruptorProps) {
  const gerado = useId();
  const id = idExterno ?? gerado;
  return (
    <div className={cx("fr-interruptor-linha", className)} data-desativado={desativado || undefined}>
      <span className="fr-interruptor-textos">
        <label htmlFor={id} className="fr-interruptor-rotulo">
          {rotulo}
        </label>
        {descricao && (
          <span id={`${id}-descricao`} className="fr-interruptor-descricao">
            {descricao}
          </span>
        )}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={marcado}
        aria-describedby={descricao ? `${id}-descricao` : undefined}
        disabled={desativado}
        className="fr-interruptor"
        onClick={() => aoMudar(!marcado)}
      >
        <span className="fr-interruptor-botao" aria-hidden="true" />
      </button>
    </div>
  );
}
