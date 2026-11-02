import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cx } from "../ui/classes";

export interface PainelVidroProps extends HTMLAttributes<HTMLElement> {
  /** Título do painel (h2), centralizado como "New Chat" na referência. */
  titulo?: ReactNode;
  /** Botão à esquerda do título (ex.: ícone de faísca). */
  inicio?: ReactNode;
  /** Botões à direita do título (ex.: fechar). */
  fim?: ReactNode;
  /** Barra fixa no pé do painel (ex.: o campo "Pergunte…" com o botão enviar). */
  rodape?: ReactNode;
  /** Elemento HTML. Padrão "section". */
  como?: ElementType;
  /** "grande" = 36px de raio e 32px de respiro (padrão); "medio" = 28px e 24px. */
  tamanho?: "medio" | "grande";
  children?: ReactNode;
}

/**
 * Painel grande de vidro (o "New Chat" da referência Genie): translúcido, desfocado, com brilho interno
 * na borda superior e cantos de 36px. O conteúdo rola por dentro; o rodapé fica preso ao pé.
 */
export function PainelVidro({ titulo, inicio, fim, rodape, como: Como = "section", tamanho = "grande", className, children, ...resto }: PainelVidroProps) {
  const temCabeca = titulo || inicio || fim;
  return (
    <Como className={cx("fr-painel", `fr-painel--${tamanho}`, className)} {...resto}>
      {temCabeca && (
        <div className="fr-painel-cabeca">
          <div className="fr-painel-lado">{inicio}</div>
          {titulo && <h2 className="fr-painel-titulo">{titulo}</h2>}
          <div className="fr-painel-lado fr-painel-lado--fim">{fim}</div>
        </div>
      )}
      <div className="fr-painel-corpo">{children}</div>
      {rodape && <div className="fr-painel-rodape">{rodape}</div>}
    </Como>
  );
}
