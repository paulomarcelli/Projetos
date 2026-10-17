import type { TerritoryCard } from '@war/shared';
import { REGION_BY_ID, TERRITORY_BY_ID } from '../../game/map';
import { Icon, type IconName } from '../ui/Icon';

const SYMBOL: Record<TerritoryCard['symbol'], { icon: IconName; label: string }> = {
  espada: { icon: 'sword', label: 'Espada' },
  escudo: { icon: 'shield', label: 'Escudo' },
  coroa: { icon: 'crown', label: 'Coroa' },
  coringa: { icon: 'star', label: 'Coringa' },
};

/** Carta de território: faixa na cor da região (como nas cartas de referência) + símbolo. */
export function TerritoryCardView({
  card,
  selected = false,
  onToggle,
  disabled = false,
}: {
  card: TerritoryCard;
  selected?: boolean;
  onToggle?: (id: string) => void;
  disabled?: boolean;
}) {
  const t = card.territory ? TERRITORY_BY_ID.get(card.territory) : undefined;
  const region = t ? REGION_BY_ID.get(t.region) : undefined;
  const sym = SYMBOL[card.symbol];
  const name = t?.name ?? 'Coringa';
  const content = (
    <>
      <span className="tcard__band" style={{ background: region?.color ?? 'var(--color-primary)' }} aria-hidden="true" />
      <span className="tcard__symbol" aria-hidden="true">
        <Icon name={sym.icon} size={18} />
      </span>
      <span className="tcard__name">{name}</span>
      <span className="tcard__meta">
        {sym.label}
        {region ? ` · ${region.name}` : ''}
      </span>
    </>
  );
  if (!onToggle) return <div className="tcard">{content}</div>;
  return (
    <button
      type="button"
      className={`tcard tcard--button${selected ? ' is-selected' : ''}`}
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onToggle(card.id)}
    >
      {content}
      {selected ? (
        <span className="tcard__check" aria-hidden="true">
          <Icon name="check" size={14} />
        </span>
      ) : null}
    </button>
  );
}
