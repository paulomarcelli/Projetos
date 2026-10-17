import { useState } from 'react';
import type { GameEvent, PlayerView, TerritoryId } from '@war/shared';
import { NEIGHBORS, REGION_BY_ID, TERRITORY_BY_ID, territoryName } from '../../game/map';
import { PLAYER_META, playerById } from '../../game/players';
import { armies, describeEvent, eventTone, timeLabel } from '../../game/format';
import { armiesOwnedBy, attackTargets, isMyTurn, territoriesOwnedBy } from '../../game/rules-ui';
import { Button } from '../ui/Button';
import { ConnDot } from '../ui/ConnectionBanner';
import { PlayerSeal } from '../ui/Emblem';
import { Icon, type IconName } from '../ui/Icon';
import { TerritoryCardView } from './TerritoryCardView';

/* ------------------------------------------------------------------ */
/* (5) Território selecionado                                          */
/* ------------------------------------------------------------------ */

export function TerritoryPanel({ view, id, onSelect }: { view: PlayerView; id: TerritoryId | null; onSelect: (id: TerritoryId) => void }) {
  if (!id) {
    return (
      <div className="empty-state">
        <Icon name="map" size={28} />
        <p>Selecione um território no mapa (ou use Tab e Enter) para ver dono, exércitos e vizinhos.</p>
      </div>
    );
  }
  const t = TERRITORY_BY_ID.get(id);
  if (!t) return null;
  const region = REGION_BY_ID.get(t.region);
  const ts = view.territories[id];
  const owner = playerById(view.players, ts?.owner);
  const attackable = new Set(view.phase === 'attack' && isMyTurn(view) ? attackTargets(view, id) : []);
  const mine = !!view.me && ts?.owner === view.me;
  const neighbors = NEIGHBORS.get(id) ?? [];

  return (
    <div className="territory">
      <header className="territory__head">
        <span className="territory__band" style={{ background: region?.color }} aria-hidden="true" />
        <div>
          <h3 className="territory__name">{t.name}</h3>
          <p className="territory__region">
            {region?.name}
            {region ? <span className="muted"> · bônus +{region.bonus} se dominar a região</span> : null}
          </p>
        </div>
      </header>
      <dl className="stats">
        <div>
          <dt>Dono</dt>
          <dd className="stats__owner">
            {owner ? <PlayerSeal color={owner.color} size={18} /> : null}
            {owner ? `${owner.name}${mine ? ' (você)' : ''}` : '—'}
          </dd>
        </div>
        <div>
          <dt>Exércitos</dt>
          <dd className="stats__num">{ts?.armies ?? 0}</dd>
        </div>
      </dl>
      <h4 className="section-title">
        Vizinhos ({neighbors.length}){attackable.size > 0 ? <span className="muted"> · {attackable.size} atacáveis daqui</span> : null}
      </h4>
      <ul className="neighbors">
        {neighbors.map((n) => {
          const ns = view.territories[n.id];
          const no = playerById(view.players, ns?.owner);
          const canHit = attackable.has(n.id);
          return (
            <li key={n.id}>
              <button
                type="button"
                className={`neighbor${canHit ? ' neighbor--target' : ''}`}
                onClick={() => onSelect(n.id)}
                aria-label={`${territoryName(n.id)}, ${n.kind === 'sea' ? 'rota marítima' : 'fronteira terrestre'}, ${no?.name ?? 'sem dono'}, ${armies(ns?.armies ?? 0)}${canHit ? ', pode ser atacado' : ''}`}
              >
                {no ? <PlayerSeal color={no.color} size={16} /> : null}
                <span className="neighbor__name">{territoryName(n.id)}</span>
                <span className="neighbor__kind">{n.kind === 'sea' ? 'mar' : 'terra'}</span>
                <span className="neighbor__armies">{ns?.armies ?? 0}</span>
                {canHit ? (
                  <span className="tag tag--danger">
                    <Icon name="swords" size={12} /> atacável
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Jogadores                                                           */
/* ------------------------------------------------------------------ */

export function PlayersPanel({ view }: { view: PlayerView }) {
  const ordered = view.turnOrder.map((id) => playerById(view.players, id)).filter((p): p is NonNullable<typeof p> => !!p);
  return (
    <ol className="players">
      {ordered.map((p) => {
        const current = p.id === view.currentPlayer && view.phase !== 'game-over';
        return (
          <li key={p.id} className={`player-row${current ? ' is-current' : ''}${p.eliminated ? ' is-out' : ''}`} aria-current={current ? 'true' : undefined}>
            <PlayerSeal color={p.color} size={26} title={`${PLAYER_META[p.color].label} (${PLAYER_META[p.color].emblemLabel})`} />
            <div className="player-row__main">
              <span className="player-row__name">
                {p.name}
                {p.id === view.me ? <span className="tag">você</span> : null}
                {current ? <span className="tag tag--accent">na vez</span> : null}
                {p.eliminated ? <span className="tag tag--muted">fora</span> : null}
              </span>
              <span className="player-row__meta">
                {territoriesOwnedBy(view, p.id)} terr. · {armiesOwnedBy(view, p.id)} exérc. · {p.cardCount} carta{p.cardCount === 1 ? '' : 's'}
              </span>
            </div>
            <ConnDot connected={p.connected !== false} />
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* (8) Objetivo secreto + cartas                                        */
/* ------------------------------------------------------------------ */

export function ObjectivePanel({ view }: { view: PlayerView }) {
  const [revealed, setRevealed] = useState(false);
  if (!view.me || !view.myObjective) {
    return <p className="hint">Espectadores não têm objetivo secreto.</p>;
  }
  return (
    <div className="objective">
      <div className={`objective__scroll${revealed ? ' is-revealed' : ''}`}>
        {revealed ? (
          <p className="objective__text" id="objective-text">
            {view.myObjective.description}
          </p>
        ) : (
          <p className="objective__hidden" id="objective-text">
            Seu objetivo está oculto. Revele só quando ninguém estiver olhando sua tela.
          </p>
        )}
      </div>
      <Button
        icon={revealed ? 'eye-off' : 'eye'}
        onClick={() => setRevealed((v) => !v)}
        aria-expanded={revealed}
        aria-controls="objective-text"
        block
      >
        {revealed ? 'Ocultar objetivo' : 'Revelar objetivo'}
      </Button>
      <h3 className="section-title">Suas cartas ({view.myCards.length})</h3>
      {view.myCards.length === 0 ? (
        <p className="hint">Conquiste ao menos um território no seu turno para ganhar uma carta.</p>
      ) : (
        <div className="tcard-grid">
          {view.myCards.map((c) => (
            <TerritoryCardView key={c.id} card={c} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* (9) Histórico                                                       */
/* ------------------------------------------------------------------ */

const TONE_ICON: Record<ReturnType<typeof eventTone>, IconName> = {
  combat: 'swords',
  conquest: 'flag',
  turn: 'scroll',
  move: 'arrow-right',
  neutral: 'info',
  end: 'crown',
};

export function HistoryPanel({ view, events }: { view: PlayerView; events: GameEvent[] }) {
  const list = [...events].reverse();
  if (list.length === 0) return <p className="hint">Nada aconteceu ainda.</p>;
  return (
    <ol className="history" aria-label="Histórico, mais recentes primeiro">
      {list.map((e, i) => {
        const tone = eventTone(e);
        return (
          <li key={`${e.at}-${i}`} className={`history__item history__item--${tone}`}>
            <span className="history__icon" aria-hidden="true">
              <Icon name={TONE_ICON[tone]} size={14} />
            </span>
            <p className="history__text">{describeEvent(e, view.players)}</p>
            <time className="history__time" dateTime={new Date(e.at).toISOString()}>
              {timeLabel(e.at)}
            </time>
          </li>
        );
      })}
    </ol>
  );
}
