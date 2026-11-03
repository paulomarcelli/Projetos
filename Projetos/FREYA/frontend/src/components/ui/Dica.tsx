import { cloneElement, isValidElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "./classes";

export type LadoDaDica = "cima" | "baixo" | "direita" | "esquerda";

export interface DicaProps {
  /** Texto da dica. */
  texto: ReactNode;
  /** Um único elemento focável (botão, link). Recebe aria-describedby e os eventos. */
  children: ReactElement<Record<string, unknown>>;
  lado?: LadoDaDica;
  /** Desliga a dica sem desmontar o alvo (ex.: menu aberto, onde o rótulo já está visível). */
  desativada?: boolean;
  /**
   * true quando o texto é o mesmo nome acessível do alvo (BotaoIcone): então não liga aria-describedby,
   * para o leitor de tela não ler o mesmo texto duas vezes.
   */
  redundante?: boolean;
  /** Atraso antes de abrir com o ponteiro, em ms. Padrão 350. O foco do teclado abre na hora. */
  atraso?: number;
}

/* Depois que uma dica fecha, a vizinha abre sem atraso e sem animação (Emil: barra de ferramentas rápida). */
let ultimoFechamento = 0;

function focoDeTeclado(el: Element): boolean {
  try {
    return el.matches(":focus-visible");
  } catch {
    return true;
  }
}
const JANELA_INSTANTANEA = 400;
const AFASTAMENTO = 10;

/**
 * Dica (tooltip): abre com o ponteiro (só ponteiro fino, nunca com toque) e com o foco do teclado;
 * fecha ao sair, ao perder o foco e com Esc. 125ms, a partir do lado do alvo.
 * Renderizada num portal com posição fixa, para escapar de contêineres com overflow (menu recolhido).
 */
export function Dica({ texto, children, lado = "cima", desativada = false, redundante = false, atraso = 350 }: DicaProps) {
  const id = useId();
  const [aberta, setAberta] = useState(false);
  const [instantanea, setInstantanea] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const alvo = useRef<HTMLElement | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const abrir = useCallback(
    (imediata: boolean) => {
      if (desativada) return;
      window.clearTimeout(timer.current);
      const recente = performance.now() - ultimoFechamento < JANELA_INSTANTANEA;
      if (imediata || recente) {
        setInstantanea(recente);
        setAberta(true);
      } else {
        setInstantanea(false);
        timer.current = window.setTimeout(() => setAberta(true), atraso);
      }
    },
    [atraso, desativada],
  );

  const fechar = useCallback(() => {
    window.clearTimeout(timer.current);
    setAberta((estava) => {
      if (estava) ultimoFechamento = performance.now();
      return false;
    });
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (desativada) fechar();
  }, [desativada, fechar]);

  useLayoutEffect(() => {
    if (!aberta || !alvo.current) return;
    const r = alvo.current.getBoundingClientRect();
    // Dentro de um contêiner que recorta o alvo (o menu recolhido), ancora na borda visível dele.
    const limite = alvo.current.closest("[data-dica-limite]")?.getBoundingClientRect();
    const direita = limite ? Math.min(r.right, limite.right) : r.right;
    const x = lado === "direita" ? direita + AFASTAMENTO : lado === "esquerda" ? r.left - AFASTAMENTO : r.left + r.width / 2;
    const y = lado === "baixo" ? r.bottom + AFASTAMENTO : lado === "cima" ? r.top - AFASTAMENTO : r.top + r.height / 2;
    setPos({ x, y });
  }, [aberta, lado]);

  useEffect(() => {
    if (!aberta) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", tecla);
    window.addEventListener("scroll", fechar, true);
    return () => {
      window.removeEventListener("keydown", tecla);
      window.removeEventListener("scroll", fechar, true);
    };
  }, [aberta, fechar]);

  if (!isValidElement(children)) return children;
  const props = children.props as Record<string, (...a: unknown[]) => void>;

  const alvoComEventos = cloneElement(children, {
    ref: (no: HTMLElement | null) => {
      alvo.current = no;
      const refOriginal = (children as unknown as { props: { ref?: unknown } }).props.ref;
      if (typeof refOriginal === "function") refOriginal(no);
      else if (refOriginal && typeof refOriginal === "object") (refOriginal as { current: unknown }).current = no;
    },
    "aria-describedby": !desativada && !redundante ? cx(children.props["aria-describedby"] as string | undefined, id) : (children.props["aria-describedby"] as string | undefined),
    onPointerEnter: (e: React.PointerEvent) => {
      props.onPointerEnter?.(e);
      if (e.pointerType === "mouse" || e.pointerType === "pen") abrir(false);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      props.onPointerLeave?.(e);
      fechar();
    },
    onPointerDown: (e: React.PointerEvent) => {
      props.onPointerDown?.(e);
      fechar();
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      props.onFocus?.(e);
      // Só o foco de teclado abre (o clique também foca o botão).
      if (focoDeTeclado(e.currentTarget)) abrir(true);
    },
    onBlur: (e: React.FocusEvent) => {
      props.onBlur?.(e);
      fechar();
    },
  });

  return (
    <>
      {alvoComEventos}
      {!desativada && !redundante && (
        <span id={id} className="sr-only">
          {texto}
        </span>
      )}
      {aberta &&
        !desativada &&
        pos &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            role="tooltip"
            aria-hidden="true"
            className={cx("fr-dica", instantanea && "fr-dica--instantanea")}
            data-lado={lado}
            style={{ left: pos.x, top: pos.y }}
          >
            {texto}
          </span>,
          document.body,
        )}
    </>
  );
}
