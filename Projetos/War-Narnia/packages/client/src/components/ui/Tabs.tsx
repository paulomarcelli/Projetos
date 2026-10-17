import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export interface TabDef<K extends string> {
  key: K;
  label: string;
  icon?: IconName;
  /** Pequeno indicador (ex.: nº de cartas). */
  badge?: string | number;
}

/** Abas acessíveis (padrão WAI-ARIA): setas/Home/End movem, ativação automática. */
export function Tabs<K extends string>({
  tabs,
  active,
  onChange,
  label,
  children,
  className = '',
}: {
  tabs: TabDef<K>[];
  active: K;
  onChange: (k: K) => void;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next >= 0) {
      e.preventDefault();
      onChange(tabs[next]!.key);
      refs.current[next]?.focus();
    }
  };
  return (
    <div className={`tabs ${className}`.trim()}>
      <div className="tabs__list" role="tablist" aria-label={label}>
        {tabs.map((t, i) => (
          <button
            key={t.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${t.key}`}
            aria-selected={t.key === active}
            aria-controls={`${id}-panel`}
            tabIndex={t.key === active ? 0 : -1}
            className="tabs__tab"
            onClick={() => onChange(t.key)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t.icon ? <Icon name={t.icon} size={18} /> : null}
            <span className="tabs__label">{t.label}</span>
            {t.badge !== undefined && t.badge !== 0 ? <span className="tabs__badge">{t.badge}</span> : null}
          </button>
        ))}
      </div>
      <div className="tabs__panel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`} tabIndex={0}>
        {children}
      </div>
    </div>
  );
}
