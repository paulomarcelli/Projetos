import { memo, type KeyboardEvent } from 'react';
import type { PlayerColor, TerritoryId } from '@war/shared';
import { PLAYER_META } from '../../game/players';
import { armies as armiesText } from '../../game/format';
import { emblemPath } from '../ui/Emblem';

export type MarkerState = 'none' | 'selected' | 'target' | 'destination';

export interface TerritoryMarkerProps {
  id: TerritoryId;
  name: string;
  regionName: string;
  /** Posição em px de TELA (o marcador não escala com o zoom: sempre legível). */
  x: number;
  y: number;
  ownerName: string | null;
  ownerColor: PlayerColor | null;
  armies: number;
  state: MarkerState;
  /** Alvo/destino já escolhido para a ação. */
  chosen?: boolean;
  /** Esmaecido quando há uma seleção e ele não é relevante. */
  dimmed?: boolean;
  /** Território do jogador que está vendo. */
  mine?: boolean;
  radius?: number;
  /** Ponta do alfinete abaixo do disco (px de tela), apontando para o rótulo da arte. */
  stem?: number;
  onActivate?: (id: TerritoryId) => void;
  onFocusMarker?: (id: TerritoryId) => void;
}

const STATE_TEXT: Record<MarkerState, string> = {
  none: '',
  selected: ', selecionado',
  target: ', pode ser atacado',
  destination: ', destino válido',
};

export function markerLabel(p: Pick<TerritoryMarkerProps, 'name' | 'regionName' | 'ownerName' | 'armies' | 'state' | 'mine'>): string {
  const owner = p.ownerName ? `${p.ownerName}${p.mine ? ' (você)' : ''}` : 'sem dono';
  return `${p.name}, ${p.regionName}, ${owner}, ${armiesText(p.armies)}${STATE_TEXT[p.state]}`;
}

function fontSizeFor(armies: number): number {
  if (armies >= 1000) return 10;
  if (armies >= 100) return 12;
  return 13.5;
}

/**
 * Marcador de território: disco na cor do dono + número de exércitos + selo com o
 * emblema (forma única por cor, para daltônicos). Dois contornos (claro por fora,
 * escuro por dentro) garantem contraste ≥ 3:1 sobre qualquer parte da arte.
 */
export const TerritoryMarker = memo(function TerritoryMarker(props: TerritoryMarkerProps) {
  const { id, x, y, ownerColor, armies, state, chosen = false, dimmed = false, mine = false, radius = 17, stem = 0, onActivate, onFocusMarker } = props;
  const R = radius;
  const meta = ownerColor ? PLAYER_META[ownerColor] : null;
  const fill = meta ? meta.cssVar : 'var(--color-surface-sunken)';
  const textColor = meta && meta.lightText ? 'var(--on-player-dark)' : 'var(--on-player-light)';
  const label = markerLabel(props);

  const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate?.(id);
    }
  };

  return (
    <g
      className={`marker marker--${state}${chosen ? ' is-chosen' : ''}${dimmed ? ' is-dimmed' : ''}${mine ? ' is-mine' : ''}`}
      transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={state === 'selected'}
      data-territory={id}
      onClick={() => onActivate?.(id)}
      onKeyDown={onKeyDown}
      onFocus={() => onFocusMarker?.(id)}
    >
      {/* Área de toque ≥ 44px */}
      <circle className="marker__hit" r={R + 6} />
      {/* Anel de foco do teclado */}
      <circle className="marker__focus" r={R + 9} />
      {state !== 'none' ? (
        <g className="marker__ring" aria-hidden="true">
          <circle r={R + 6} className="marker__ring-halo" />
          <circle r={R + 6} className={`marker__ring-line marker__ring-line--${state}`} />
        </g>
      ) : null}
      {stem > 0 ? (
        <path
          className="marker__stem"
          d={`M${-R * 0.42} ${R * 0.8} L0 ${R + stem + 2} L${R * 0.42} ${R * 0.8} Z`}
          aria-hidden="true"
        />
      ) : null}
      <circle className={`marker__outer${mine ? ' marker__outer--mine' : ''}`} r={R + 2} />
      <circle className="marker__disc" r={R} fill={fill} />
      <text className="marker__count" dy="0.36em" fill={textColor} fontSize={fontSizeFor(armies)} aria-hidden="true">
        {armies}
      </text>
      {meta ? (
        <g className="marker__seal" transform={`translate(${(-R * 0.8).toFixed(1)} ${(-R * 0.8).toFixed(1)})`} aria-hidden="true">
          <circle r={7} />
          <path d={emblemPath(meta.emblem, 4.6)} />
        </g>
      ) : null}
      {state === 'target' || state === 'destination' ? (
        <g className={`marker__badge marker__badge--${state}`} transform={`translate(${(R * 0.85).toFixed(1)} ${(R * 0.85).toFixed(1)})`} aria-hidden="true">
          <circle r={7} />
          <path d={state === 'target' ? 'M-3 -3 L3 3 M3 -3 L-3 3' : 'M-3.5 0 H3 M0.5 -3 L3.5 0 L0.5 3'} />
        </g>
      ) : null}
    </g>
  );
});
