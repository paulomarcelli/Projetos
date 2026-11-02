import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { BotaoIcone } from "./BotaoIcone";
import { cx } from "./classes";

export interface DialogoProps {
  aberto: boolean;
  /** Chamado ao pedir para fechar: Esc, clique fora, botão fechar. */
  aoFechar: () => void;
  titulo: ReactNode;
  descricao?: ReactNode;
  children?: ReactNode;
  /** Botões do rodapé (ex.: Cancelar + Excluir). O primeiro com data-autofoco recebe o foco ao abrir. */
  acoes?: ReactNode;
  /** "alerta" para confirmações destrutivas (role="alertdialog"). */
  tipo?: "padrao" | "alerta";
  /** Fecha ao clicar no fundo. Padrão: true (false em alertas). */
  fecharNoFundo?: boolean;
  largura?: "pequena" | "media" | "grande";
  className?: string;
}

/**
 * Diálogo modal com o <dialog> nativo (showModal): camada superior, fundo inerte e Esc de graça.
 * Foco: vai para o elemento com data-autofoco (ou o primeiro focável) e volta para quem abriu.
 * Para confirmações como "Excluir análise?", use tipo="alerta" e ponha data-autofoco no "Cancelar".
 */
export function Dialogo({
  aberto,
  aoFechar,
  titulo,
  descricao,
  children,
  acoes,
  tipo = "padrao",
  fecharNoFundo,
  largura = "pequena",
  className,
}: DialogoProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const anterior = useRef<HTMLElement | null>(null);
  const idTitulo = useId();
  const idDescricao = useId();
  const fundoFecha = fecharNoFundo ?? tipo !== "alerta";
  const aoFecharRef = useRef(aoFechar);
  aoFecharRef.current = aoFechar;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) {
      anterior.current = document.activeElement as HTMLElement | null;
      if (typeof d.showModal === "function") d.showModal();
      else d.setAttribute("open", "");
      const alvo =
        d.querySelector<HTMLElement>("[data-autofoco]") ??
        d.querySelector<HTMLElement>('.fr-dialogo-corpo :is(button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])):not([disabled])') ??
        d.querySelector<HTMLElement>(".fr-dialogo-acoes button:not([disabled])");
      (alvo ?? d).focus();
    } else if (!aberto && d.open) {
      if (typeof d.close === "function") d.close();
      else d.removeAttribute("open");
    }
    if (!aberto && anterior.current) {
      const voltar = anterior.current;
      anterior.current = null;
      if (voltar.isConnected) voltar.focus();
    }
  }, [aberto]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const cancelar = (e: Event) => {
      e.preventDefault(); // o React decide fechar (controlado)
      aoFecharRef.current();
    };
    d.addEventListener("cancel", cancelar);
    return () => d.removeEventListener("cancel", cancelar);
  }, []);

  return (
    <dialog
      ref={ref}
      className={cx("fr-dialogo", `fr-dialogo--${largura}`, className)}
      role={tipo === "alerta" ? "alertdialog" : undefined}
      aria-modal="true"
      aria-labelledby={idTitulo}
      aria-describedby={descricao ? idDescricao : undefined}
      tabIndex={-1}
      onKeyDown={(e) => {
        // jsdom e navegadores sem "cancel": garante o Esc
        if (e.key === "Escape") {
          e.preventDefault();
          aoFecharRef.current();
        }
      }}
      onMouseDown={(e) => {
        if (fundoFecha && e.target === e.currentTarget) aoFecharRef.current();
      }}
    >
      {
        <div className="fr-dialogo-caixa">
          <header className="fr-dialogo-cabeca">
            <h2 id={idTitulo} className="fr-dialogo-titulo">
              {titulo}
            </h2>
            {tipo !== "alerta" && (
              <BotaoIcone rotulo="Fechar" variante="fantasma" tamanho="pequeno" dica={false} onClick={() => aoFecharRef.current()}>
                <X size={18} />
              </BotaoIcone>
            )}
          </header>
          {descricao && (
            <p id={idDescricao} className="fr-dialogo-descricao">
              {descricao}
            </p>
          )}
          {children && <div className="fr-dialogo-corpo">{children}</div>}
          {acoes && <footer className="fr-dialogo-acoes">{acoes}</footer>}
        </div>
      }
    </dialog>
  );
}
