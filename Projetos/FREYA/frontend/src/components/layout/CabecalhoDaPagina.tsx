import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { cx } from "../ui/classes";

export interface CabecalhoDaPaginaProps {
  titulo: ReactNode;
  subtitulo?: ReactNode;
  /** Botões à direita (ex.: <BotaoLink variante="primario">Nova análise</BotaoLink>). */
  acoes?: ReactNode;
  /** Link de voltar acima do título. */
  voltar?: { para: string; rotulo?: string };
  /** Conteúdo extra abaixo (ex.: selos, filtros). */
  children?: ReactNode;
  className?: string;
}

/** Cabeçalho de página: o único <h1> da tela, subtítulo e ações. */
export function CabecalhoDaPagina({ titulo, subtitulo, acoes, voltar, children, className }: CabecalhoDaPaginaProps) {
  return (
    <header className={cx("fr-cabecalho", className)}>
      {voltar && (
        <Link to={voltar.para} className="fr-cabecalho-voltar">
          <ArrowLeft aria-hidden="true" size={16} strokeWidth={2} />
          {voltar.rotulo ?? "Voltar"}
        </Link>
      )}
      <div className="fr-cabecalho-linha">
        <div className="fr-cabecalho-textos">
          <h1 className="fr-cabecalho-titulo">{titulo}</h1>
          {subtitulo && <p className="fr-cabecalho-subtitulo">{subtitulo}</p>}
        </div>
        {acoes && <div className="fr-cabecalho-acoes">{acoes}</div>}
      </div>
      {children}
    </header>
  );
}
