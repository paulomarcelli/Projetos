import { useEffect, useId, useRef, type ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  title: string;
  onClose?: () => void;
  children: ReactNode;
  /** Botões do rodapé. */
  actions?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Impede fechar com Esc/clique fora (ex.: ocupação obrigatória). */
  required?: boolean;
  className?: string;
}

/**
 * Diálogo modal acessível: role=dialog + aria-modal, foco preso dentro,
 * Esc fecha (se não for obrigatório) e o foco volta para quem abriu.
 */
export function Dialog({ open, title, onClose, children, actions, size = 'sm', required = false, className = '' }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const focusables = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])') ?? [],
      );
    const first = node?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0];
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !required) {
        e.stopPropagation();
        onCloseRef.current?.();
      }
      if (e.key === 'Tab') {
        const els = focusables();
        if (els.length === 0) return;
        const a = els[0]!;
        const z = els[els.length - 1]!;
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      previous?.focus?.();
    };
  }, [open, required]);

  if (!open) return null;
  return (
    <div className="dialog-scrim" onMouseDown={(e) => e.target === e.currentTarget && !required && onClose?.()}>
      <div ref={ref} className={`dialog dialog--${size} surface ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className="dialog__title">
          {title}
        </h2>
        <div className="dialog__body">{children}</div>
        {actions ? <div className="dialog__actions">{actions}</div> : null}
      </div>
    </div>
  );
}
