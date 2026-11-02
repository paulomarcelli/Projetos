import type { ComponentPropsWithRef, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";
import { cx } from "./classes";

export type VarianteDeBotao = "primario" | "secundario" | "fantasma" | "perigo";
export type TamanhoDeBotao = "pequeno" | "medio" | "grande";

interface OpcoesDeEstilo {
  variante?: VarianteDeBotao;
  tamanho?: TamanhoDeBotao;
  larguraTotal?: boolean;
}

/** Classes do botão, para estilizar outro elemento (por exemplo um <Link>) como botão. */
export function classesDoBotao({ variante = "secundario", tamanho = "medio", larguraTotal = false }: OpcoesDeEstilo = {}) {
  return cx("fr-botao", `fr-botao--${variante}`, `fr-botao--${tamanho}`, larguraTotal && "fr-botao--largo");
}

export interface BotaoProps extends ComponentPropsWithRef<"button">, OpcoesDeEstilo {
  /** Ícone à esquerda do rótulo (ex.: <Plus />). */
  icone?: ReactNode;
  /** Ícone à direita do rótulo. */
  iconeDireita?: ReactNode;
  /** Mostra o indicador e bloqueia o clique; o rótulo continua para não mudar a largura. */
  carregando?: boolean;
  /** Texto lido por leitores de tela enquanto carrega. Padrão: "Carregando". */
  rotuloCarregando?: string;
}

export function Botao({
  variante = "secundario",
  tamanho = "medio",
  larguraTotal,
  icone,
  iconeDireita,
  carregando = false,
  rotuloCarregando = "Carregando",
  className,
  children,
  disabled,
  type = "button",
  ...resto
}: BotaoProps) {
  return (
    <button
      type={type}
      className={cx(classesDoBotao({ variante, tamanho, larguraTotal }), className)}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      data-carregando={carregando || undefined}
      {...resto}
    >
      {carregando ? (
        <span className="fr-botao-giro" aria-hidden="true" />
      ) : (
        icone && (
          <span className="fr-botao-icone" aria-hidden="true">
            {icone}
          </span>
        )
      )}
      {children != null && <span className="fr-botao-rotulo">{children}</span>}
      {iconeDireita && !carregando && (
        <span className="fr-botao-icone" aria-hidden="true">
          {iconeDireita}
        </span>
      )}
      {carregando && <span className="sr-only">{rotuloCarregando}</span>}
    </button>
  );
}

export interface BotaoLinkProps extends LinkProps, OpcoesDeEstilo {
  icone?: ReactNode;
  iconeDireita?: ReactNode;
  ref?: React.Ref<HTMLAnchorElement>;
}

/** Link de navegação com aparência de botão (ex.: "Nova análise"). */
export function BotaoLink({ variante = "secundario", tamanho = "medio", larguraTotal, icone, iconeDireita, className, children, ...resto }: BotaoLinkProps) {
  return (
    <Link className={cx(classesDoBotao({ variante, tamanho, larguraTotal }), typeof className === "string" ? className : undefined)} {...resto}>
      {icone && (
        <span className="fr-botao-icone" aria-hidden="true">
          {icone}
        </span>
      )}
      <span className="fr-botao-rotulo">{children as ReactNode}</span>
      {iconeDireita && (
        <span className="fr-botao-icone" aria-hidden="true">
          {iconeDireita}
        </span>
      )}
    </Link>
  );
}
