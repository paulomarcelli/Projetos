import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cx } from "./classes";

interface PropsDoRotulo {
  /** Rótulo visível (obrigatório: nada de placeholder como rótulo). */
  rotulo: ReactNode;
  /** Ajuda abaixo do campo (ligada por aria-describedby). */
  dica?: ReactNode;
  /** Mensagem de erro; marca aria-invalid e substitui a cor da borda. */
  erro?: ReactNode;
  /** Esconde o rótulo visualmente (continua para leitores de tela). */
  rotuloOculto?: boolean;
  /** Elemento à esquerda dentro do campo (ex.: ícone de busca). */
  prefixo?: ReactNode;
  classeDoGrupo?: string;
}

function Moldura({
  id,
  rotulo,
  dica,
  erro,
  rotuloOculto,
  classeDoGrupo,
  obrigatorio,
  children,
}: PropsDoRotulo & { id: string; obrigatorio?: boolean; children: ReactNode }) {
  return (
    <div className={cx("fr-campo", erro ? "fr-campo--erro" : undefined, classeDoGrupo)}>
      <label htmlFor={id} className={cx("fr-campo-rotulo", rotuloOculto && "sr-only")}>
        {rotulo}
        {obrigatorio && (
          <span className="fr-campo-obrigatorio" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {erro ? (
        <p id={`${id}-erro`} className="fr-campo-erro">
          {erro}
        </p>
      ) : (
        dica && (
          <p id={`${id}-dica`} className="fr-campo-dica">
            {dica}
          </p>
        )
      )}
    </div>
  );
}

function descricao(id: string, dica: ReactNode, erro: ReactNode, externo?: string) {
  return cx(externo, erro ? `${id}-erro` : dica ? `${id}-dica` : undefined) || undefined;
}

export interface CampoTextoProps extends Omit<ComponentPropsWithRef<"input">, "prefix">, PropsDoRotulo {}

export function CampoTexto({
  rotulo,
  dica,
  erro,
  rotuloOculto,
  prefixo,
  classeDoGrupo,
  id: idExterno,
  className,
  required,
  "aria-describedby": descritoPor,
  ...resto
}: CampoTextoProps) {
  const gerado = useId();
  const id = idExterno ?? gerado;
  return (
    <Moldura id={id} rotulo={rotulo} dica={dica} erro={erro} rotuloOculto={rotuloOculto} classeDoGrupo={classeDoGrupo} obrigatorio={required}>
      <div className="fr-campo-caixa">
        {prefixo && (
          <span className="fr-campo-prefixo" aria-hidden="true">
            {prefixo}
          </span>
        )}
        <input
          id={id}
          className={cx("fr-campo-entrada", className)}
          aria-invalid={erro ? true : undefined}
          aria-describedby={descricao(id, dica, erro, descritoPor)}
          required={required}
          {...resto}
        />
      </div>
    </Moldura>
  );
}

export interface AreaTextoProps extends ComponentPropsWithRef<"textarea">, Omit<PropsDoRotulo, "prefixo"> {}

export function AreaTexto({
  rotulo,
  dica,
  erro,
  rotuloOculto,
  classeDoGrupo,
  id: idExterno,
  className,
  required,
  rows = 4,
  "aria-describedby": descritoPor,
  ...resto
}: AreaTextoProps) {
  const gerado = useId();
  const id = idExterno ?? gerado;
  return (
    <Moldura id={id} rotulo={rotulo} dica={dica} erro={erro} rotuloOculto={rotuloOculto} classeDoGrupo={classeDoGrupo} obrigatorio={required}>
      <div className="fr-campo-caixa fr-campo-caixa--area">
        <textarea
          id={id}
          rows={rows}
          className={cx("fr-campo-entrada fr-campo-area", className)}
          aria-invalid={erro ? true : undefined}
          aria-describedby={descricao(id, dica, erro, descritoPor)}
          required={required}
          {...resto}
        />
      </div>
    </Moldura>
  );
}
