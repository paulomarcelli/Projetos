import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "./classes";
import { Dica, type LadoDaDica } from "./Dica";

export interface BotaoIconeProps extends Omit<ComponentPropsWithRef<"button">, "children"> {
  /** Nome acessível (aria-label). Obrigatório: o botão só tem ícone. */
  rotulo: string;
  /** O ícone (ex.: <X />). Fica com aria-hidden. */
  children: ReactNode;
  /** Mostra o rótulo numa Dica ao passar o ponteiro / focar. Padrão: true. */
  dica?: boolean;
  ladoDaDica?: LadoDaDica;
  variante?: "vidro" | "fantasma" | "solido";
  tamanho?: "pequeno" | "medio" | "grande";
  /** Para alternâncias (ex.: guardar): vira aria-pressed. */
  pressionado?: boolean;
}

/** Botão só de ícone, redondo (44px no padrão, como os da referência Genie). */
export function BotaoIcone({
  rotulo,
  children,
  dica = true,
  ladoDaDica = "cima",
  variante = "vidro",
  tamanho = "medio",
  pressionado,
  className,
  type = "button",
  ...resto
}: BotaoIconeProps) {
  const botao = (
    <button
      type={type}
      aria-label={rotulo}
      aria-pressed={pressionado}
      className={cx("fr-botao-icone-redondo", `fr-bir--${variante}`, `fr-bir--${tamanho}`, className)}
      {...resto}
    >
      <span aria-hidden="true" className="contents">
        {children}
      </span>
    </button>
  );
  if (!dica) return botao;
  return (
    <Dica texto={rotulo} lado={ladoDaDica} redundante>
      {botao}
    </Dica>
  );
}
