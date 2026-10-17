import { dismissToast, useStore } from '../../net/store';
import { Icon } from './Icon';

const ICON = { error: 'close', success: 'check', info: 'info', warning: 'info' } as const;
const LABEL = { error: 'Erro', success: 'Feito', info: 'Aviso', warning: 'Atenção' } as const;

/** Região única de anúncios (aria-live polite): não rouba o foco. */
export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="toasts" role="region" aria-label="Notificações">
      <ol aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <li key={t.id} className={`toast toast--${t.kind}`}>
            <span className="toast__icon" aria-hidden="true">
              <Icon name={ICON[t.kind]} size={16} />
            </span>
            <p>
              <span className="sr-only">{LABEL[t.kind]}: </span>
              {t.message}
            </p>
            <button type="button" className="toast__close" aria-label="Fechar notificação" onClick={() => dismissToast(t.id)}>
              <Icon name="close" size={16} />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
