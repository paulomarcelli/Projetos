import { useEffect, useState } from 'react';
import type { PlayerView, TerritoryId } from '@war/shared';
import type { AttackEvent } from '../../net/store';
import { regionName, territoryName, TERRITORY_BY_ID } from '../../game/map';
import { PLAYER_META, playerById, playerName } from '../../game/players';
import { armies, PHASE_LABEL } from '../../game/format';
import {
  armiesOf,
  attackTargets,
  canAttackFrom,
  fortifyDestinations,
  isMyTurn,
  maxAttackDice,
  movableFrom,
  mustTrade,
  ownsTerritory,
  placeableOn,
  totalReinforcements,
} from '../../game/rules-ui';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Icon } from '../ui/Icon';
import { PlayerSeal } from '../ui/Emblem';
import { DiceDuel } from './Dice';
import { TerritoryCardView } from './TerritoryCardView';

export interface GameActions {
  place(territory: TerritoryId, count: number): void;
  trade(cardIds: [string, string, string]): void;
  endReinforce(): void;
  attack(from: TerritoryId, to: TerritoryId, dice: number): void;
  endAttack(): void;
  /** Encerra o turno (a confirmação é feita pelo painel). */
  endTurn(fromPhase: 'attack' | 'fortify'): void;
  occupy(count: number): void;
  fortify(from: TerritoryId, to: TerritoryId, count: number): void;
}

interface PanelBase {
  view: PlayerView;
  busy: boolean;
  actions: GameActions;
}

/* ------------------------------------------------------------------ */
/* Indicador de fase                                                   */
/* ------------------------------------------------------------------ */

const STEPS = ['reinforce', 'attack', 'fortify'] as const;

export function PhaseStepper({ view }: { view: PlayerView }) {
  const current = view.phase === 'occupy' ? 'attack' : view.phase;
  return (
    <ol className="stepper" aria-label="Fases do turno">
      {STEPS.map((p, i) => {
        const idx = STEPS.indexOf(current as (typeof STEPS)[number]);
        const state = p === current ? 'current' : idx > i ? 'done' : 'todo';
        return (
          <li key={p} className={`stepper__item stepper__item--${state}`} aria-current={p === current ? 'step' : undefined}>
            <span className="stepper__num" aria-hidden="true">
              {i + 1}
            </span>
            <span className="stepper__label">{PHASE_LABEL[p]}</span>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Aguardando outro jogador                                            */
/* ------------------------------------------------------------------ */

export function WaitingPanel({ view }: { view: PlayerView }) {
  const p = playerById(view.players, view.currentPlayer);
  const verb: Record<string, string> = {
    reinforce: `distribuindo ${armies(view.reinforcementsTotal)}`,
    attack: 'decidindo ataques',
    occupy: 'ocupando um território conquistado',
    fortify: 'remanejando tropas',
  };
  return (
    <div className="phase-panel phase-panel--waiting">
      <p className="phase-panel__lead">
        {p ? <PlayerSeal color={p.color} size={20} /> : null}
        <span>
          Vez de <strong>{p?.name ?? '—'}</strong>
          {p && p.connected === false ? ' (desconectado)' : ''}: {verb[view.phase] ?? PHASE_LABEL[view.phase]}…
        </span>
      </p>
      <p className="hint">Você pode explorar o mapa e o histórico enquanto espera.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reforço                                                             */
/* ------------------------------------------------------------------ */

export function ReinforcePanel({ view, busy, actions, selected }: PanelBase & { selected: TerritoryId | null }) {
  const [picked, setPicked] = useState<string[]>([]);
  const total = totalReinforcements(view);
  const pool = view.reinforcements;
  const regional = pool ? Object.entries(pool.byRegion).filter(([, n]) => (n ?? 0) > 0) : [];
  const canPlaceHere = selected ? placeableOn(view, selected) : 0;
  const isMine = selected ? ownsTerritory(view, selected) : false;
  const forced = mustTrade(view);

  useEffect(() => {
    // Cartas trocadas somem da mão: limpa a seleção que não existe mais.
    setPicked((p) => p.filter((id) => view.myCards.some((c) => c.id === id)));
  }, [view.myCards]);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]));

  let placeHint = 'Toque em um território seu no mapa para colocar exércitos.';
  if (selected && !isMine) placeHint = `${territoryName(selected)} não é seu. Escolha um território seu.`;
  else if (selected && isMine && canPlaceHere === 0 && total > 0)
    placeHint = `Os exércitos restantes são de outra região: não podem ir para ${territoryName(selected)}.`;

  return (
    <div className="phase-panel">
      <div className="pool" role="status" aria-live="polite" aria-atomic="true">
        <span className="pool__num">{total}</span>
        <span className="pool__label">
          {total === 1 ? 'exército para distribuir' : 'exércitos para distribuir'}
          {pool && (pool.free > 0 || regional.length > 0) ? (
            <span className="pool__detail">
              {pool.free} livre{pool.free === 1 ? '' : 's'}
              {regional.map(([r, n]) => ` · ${n} só em ${regionName(r as never)}`).join('')}
            </span>
          ) : null}
        </span>
      </div>

      {selected && isMine && canPlaceHere > 0 ? (
        <div className="place">
          <p className="place__target">
            Colocar em <strong>{territoryName(selected)}</strong> <span className="muted">({armies(armiesOf(view, selected))} agora)</span>
          </p>
          <div className="btn-row">
            <Button size="sm" onClick={() => actions.place(selected, 1)} disabled={busy}>
              +1
            </Button>
            <Button size="sm" onClick={() => actions.place(selected, Math.min(5, canPlaceHere))} disabled={busy || canPlaceHere < 2}>
              +{Math.min(5, canPlaceHere)}
            </Button>
            <Button size="sm" variant="primary" onClick={() => actions.place(selected, canPlaceHere)} disabled={busy}>
              Todos ({canPlaceHere})
            </Button>
          </div>
        </div>
      ) : total > 0 ? (
        <p className="hint">{placeHint}</p>
      ) : null}

      {view.myCards.length > 0 ? (
        <section className="cards-trade" aria-labelledby="trade-title">
          <h3 id="trade-title" className="section-title">
            Trocar cartas <span className="muted">· próxima troca vale {armies(view.nextTradeValue)}</span>
          </h3>
          {forced ? (
            <p className="callout callout--warning" role="alert">
              Você tem {view.myCards.length} cartas: troque 3 antes de continuar.
            </p>
          ) : null}
          <div className="tcard-grid">
            {view.myCards.map((c) => (
              <TerritoryCardView
                key={c.id}
                card={c}
                selected={picked.includes(c.id)}
                onToggle={toggle}
                disabled={busy || (!picked.includes(c.id) && picked.length >= 3)}
              />
            ))}
          </div>
          <Button
            variant={forced ? 'primary' : 'secondary'}
            block
            disabled={picked.length !== 3 || busy}
            onClick={() => {
              actions.trade(picked as [string, string, string]);
              setPicked([]);
            }}
          >
            {picked.length === 3 ? `Trocar 3 cartas por ${armies(view.nextTradeValue)}` : `Selecione 3 cartas (${picked.length}/3)`}
          </Button>
        </section>
      ) : null}

      <div className="phase-panel__footer">
        <Button variant="primary" block disabled={total > 0 || forced || busy} loading={busy} onClick={actions.endReinforce} icon="swords">
          Concluir reforços e atacar
        </Button>
        {total > 0 ? <p className="hint hint--center">Distribua todos os exércitos para continuar.</p> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ataque                                                              */
/* ------------------------------------------------------------------ */

export function AttackPanel({
  view,
  busy,
  actions,
  from,
  to,
  lastAttack,
  attackSeq,
}: PanelBase & { from: TerritoryId | null; to: TerritoryId | null; lastAttack: AttackEvent | null; attackSeq: number }) {
  const myTurn = isMyTurn(view);
  const inPhase = view.phase === 'attack';
  const sourceOk = !!from && canAttackFrom(view, from);
  const targetOk = !!from && !!to && attackTargets(view, from).includes(to);
  const maxDice = from ? maxAttackDice(armiesOf(view, from)) : 0;
  const [dice, setDice] = useState(3);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const chosenDice = Math.max(1, Math.min(dice, maxDice || 1));

  let reason = '';
  if (!myTurn) reason = 'Não é a sua vez.';
  else if (!inPhase) reason = `Ataques só na fase de ataque (agora: ${PHASE_LABEL[view.phase]}).`;
  else if (!from) reason = 'Escolha no mapa um território seu com 2 ou mais exércitos.';
  else if (!sourceOk) reason = `${territoryName(from)} não pode atacar: precisa ser seu, ter 2+ exércitos e fazer fronteira com um inimigo.`;
  else if (!to) reason = 'Agora escolha um alvo (anel vermelho tracejado no mapa).';
  else if (!targetOk) reason = `${territoryName(to)} não é um alvo válido a partir de ${territoryName(from)}.`;

  const canAttack = myTurn && inPhase && sourceOk && targetOk && !busy;
  const defender = to ? playerById(view.players, view.territories[to]?.owner) : undefined;

  return (
    <div className="phase-panel" data-testid="attack-panel">
      <div className="matchup" aria-live="polite">
        <div className="matchup__side">
          <span className="matchup__role">Origem</span>
          <strong>{from ? territoryName(from) : '—'}</strong>
          <span className="muted">{from ? armies(armiesOf(view, from)) : 'escolha no mapa'}</span>
        </div>
        <span className="matchup__vs" aria-hidden="true">
          <Icon name="arrow-right" size={20} />
        </span>
        <div className="matchup__side">
          <span className="matchup__role">Alvo</span>
          <strong>{to ? territoryName(to) : '—'}</strong>
          <span className="muted">
            {to ? `${defender?.name ?? '—'} · ${armies(armiesOf(view, to))}` : 'escolha no mapa'}
          </span>
        </div>
      </div>

      <fieldset className="dice-picker" disabled={!(myTurn && inPhase && sourceOk && targetOk)}>
        <legend>Dados de ataque</legend>
        <div className="seg">
          {[1, 2, 3].map((n) => (
            <label key={n} className={`seg__opt${n > maxDice ? ' is-disabled' : ''}`}>
              <input
                type="radio"
                name="dice"
                value={n}
                checked={chosenDice === n}
                disabled={n > maxDice}
                onChange={() => setDice(n)}
              />
              <span>{n}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Button
        variant="danger"
        block
        icon="swords"
        disabled={!canAttack}
        loading={busy && inPhase && myTurn}
        onClick={() => from && to && actions.attack(from, to, chosenDice)}
      >
        {canAttack ? `Atacar ${territoryName(to!)} com ${chosenDice} ${chosenDice === 1 ? 'dado' : 'dados'}` : 'Atacar'}
      </Button>
      {reason ? <p className="hint">{reason}</p> : null}

      {lastAttack ? (
        <section className="combat-result" aria-labelledby="combat-title">
          <h3 id="combat-title" className="section-title">
            Último combate
          </h3>
          <p className="combat-result__where">
            {playerName(view.players, lastAttack.attacker)}: {territoryName(lastAttack.from)} → {territoryName(lastAttack.to)}
          </p>
          <DiceDuel attack={lastAttack.attackDice} defense={lastAttack.defenseDice} seq={attackSeq} />
          <p className="combat-result__summary" role="status">
            Ataque perdeu {lastAttack.attackerLosses}, defesa perdeu {lastAttack.defenderLosses}.
          </p>
        </section>
      ) : null}

      {myTurn && inPhase ? (
        <div className="phase-panel__footer phase-panel__footer--stack">
          <Button onClick={actions.endAttack} disabled={busy} icon="arrow-right" block>
            Parar ataques e remanejar
          </Button>
          <Button variant="ghost" onClick={() => setConfirmEnd(true)} disabled={busy} block>
            Encerrar turno sem remanejar
          </Button>
        </div>
      ) : null}
      <EndTurnConfirm open={confirmEnd} onCancel={() => setConfirmEnd(false)} onConfirm={() => (setConfirmEnd(false), actions.endTurn('attack'))} skipFortify />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ocupação após conquista                                             */
/* ------------------------------------------------------------------ */

export function OccupyDialog({ view, busy, actions }: PanelBase) {
  const occ = view.pendingOccupation;
  const open = isMyTurn(view) && view.phase === 'occupy' && !!occ;
  const [count, setCount] = useState(occ?.max ?? 1);
  useEffect(() => {
    if (occ) setCount(occ.max);
  }, [occ?.from, occ?.to, occ?.max]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!open || !occ) return null;
  const fixed = occ.min === occ.max;
  return (
    <Dialog
      open
      required
      title={`${territoryName(occ.to)} conquistado!`}
      actions={
        <Button variant="primary" block loading={busy} onClick={() => actions.occupy(count)} data-autofocus>
          Mover {armies(count)} para {territoryName(occ.to)}
        </Button>
      }
    >
      <p>
        Quantos exércitos de <strong>{territoryName(occ.from)}</strong> vão ocupar <strong>{territoryName(occ.to)}</strong>?
      </p>
      {fixed ? (
        <p className="hint">Só é possível mover {armies(occ.min)}.</p>
      ) : (
        <div className="slider-field">
          <label htmlFor="occupy-range" className="slider-field__label">
            Exércitos: <output htmlFor="occupy-range">{count}</output>
          </label>
          <div className="slider-field__row">
            <Button size="sm" aria-label="Menos um" onClick={() => setCount((c) => Math.max(occ.min, c - 1))} disabled={count <= occ.min}>
              −
            </Button>
            <input
              id="occupy-range"
              type="range"
              min={occ.min}
              max={occ.max}
              step={1}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
            <Button size="sm" aria-label="Mais um" onClick={() => setCount((c) => Math.min(occ.max, c + 1))} disabled={count >= occ.max}>
              +
            </Button>
          </div>
          <p className="slider-field__scale">
            <span>mín. {occ.min}</span>
            <span>máx. {occ.max}</span>
          </p>
        </div>
      )}
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Remanejamento                                                       */
/* ------------------------------------------------------------------ */

export function FortifyPanel({ view, busy, actions, from, to }: PanelBase & { from: TerritoryId | null; to: TerritoryId | null }) {
  const myTurn = isMyTurn(view);
  const inPhase = view.phase === 'fortify';
  const movable = from ? movableFrom(view, from) : 0;
  const destOk = !!from && !!to && fortifyDestinations(view, from).includes(to);
  const [count, setCount] = useState(1);
  const [confirmEnd, setConfirmEnd] = useState(false);
  useEffect(() => setCount(Math.max(1, movable)), [from, to, movable]);
  const n = Math.max(1, Math.min(count, movable));
  const arrived = from ? view.movedThisTurn[from] ?? 0 : 0;

  let reason = '';
  if (!myTurn) reason = 'Não é a sua vez.';
  else if (!inPhase) reason = 'O remanejamento acontece depois dos ataques.';
  else if (!from) reason = 'Escolha a origem: um território seu com exércitos sobrando.';
  else if (!ownsTerritory(view, from)) reason = `${territoryName(from)} não é seu.`;
  else if (movable === 0)
    reason = arrived > 0 ? `Os exércitos de ${territoryName(from)} já se moveram neste turno.` : `${territoryName(from)} precisa manter 1 exército.`;
  else if (!to) reason = 'Agora escolha o destino: território seu vizinho (anel verde pontilhado).';
  else if (!destOk) reason = `${territoryName(to)} não é vizinho seu de ${territoryName(from)}.`;

  const canMove = myTurn && inPhase && destOk && movable > 0 && !busy;

  return (
    <div className="phase-panel" data-testid="fortify-panel">
      <div className="matchup">
        <div className="matchup__side">
          <span className="matchup__role">De</span>
          <strong>{from ? territoryName(from) : '—'}</strong>
          <span className="muted">{from ? `${movable} pode${movable === 1 ? '' : 'm'} sair` : 'escolha no mapa'}</span>
        </div>
        <span className="matchup__vs" aria-hidden="true">
          <Icon name="arrow-right" size={20} />
        </span>
        <div className="matchup__side">
          <span className="matchup__role">Para</span>
          <strong>{to ? territoryName(to) : '—'}</strong>
          <span className="muted">{to ? armies(armiesOf(view, to)) : 'escolha no mapa'}</span>
        </div>
      </div>
      {canMove && movable > 1 ? (
        <div className="slider-field">
          <label htmlFor="fortify-range" className="slider-field__label">
            Mover: <output htmlFor="fortify-range">{n}</output>
          </label>
          <input id="fortify-range" type="range" min={1} max={movable} value={n} onChange={(e) => setCount(Number(e.target.value))} />
          <p className="slider-field__scale">
            <span>1</span>
            <span>{movable}</span>
          </p>
        </div>
      ) : null}
      <Button variant="primary" block disabled={!canMove} loading={busy && inPhase && myTurn} onClick={() => from && to && actions.fortify(from, to, n)} icon="arrow-right">
        {canMove ? `Mover ${armies(n)}` : 'Mover exércitos'}
      </Button>
      {reason ? <p className="hint">{reason}</p> : null}
      <p className="hint">Exércitos que chegaram por remanejamento neste turno não podem se mover de novo.</p>
      {myTurn && inPhase ? (
        <div className="phase-panel__footer">
          <Button variant="secondary" block onClick={() => setConfirmEnd(true)} disabled={busy} icon="flag">
            Encerrar turno
          </Button>
        </div>
      ) : null}
      <EndTurnConfirm open={confirmEnd} onCancel={() => setConfirmEnd(false)} onConfirm={() => (setConfirmEnd(false), actions.endTurn('fortify'))} />
    </div>
  );
}

export function EndTurnConfirm({ open, onCancel, onConfirm, skipFortify = false }: { open: boolean; onCancel: () => void; onConfirm: () => void; skipFortify?: boolean }) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title="Encerrar o turno?"
      actions={
        <>
          <Button onClick={onCancel} data-autofocus>
            Continuar jogando
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Encerrar turno
          </Button>
        </>
      }
    >
      <p>{skipFortify ? 'Você vai pular o remanejamento e passar a vez.' : 'A vez passa para o próximo jogador.'}</p>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Painel de ação (escolhe pela fase)                                  */
/* ------------------------------------------------------------------ */

export function ActionPanel(
  props: PanelBase & { selected: TerritoryId | null; chosen: TerritoryId | null; lastAttack: AttackEvent | null; attackSeq: number },
) {
  const { view } = props;
  const me = playerById(view.players, view.me);
  if (view.phase === 'game-over') return <p className="hint">A partida terminou.</p>;
  if (!isMyTurn(view)) {
    return (
      <>
        <WaitingPanel view={view} />
        {props.lastAttack ? (
          <section className="combat-result" aria-labelledby="combat-title-w">
            <h3 id="combat-title-w" className="section-title">
              Último combate
            </h3>
            <p className="combat-result__where">
              {playerName(view.players, props.lastAttack.attacker)}: {territoryName(props.lastAttack.from)} → {territoryName(props.lastAttack.to)}
            </p>
            <DiceDuel attack={props.lastAttack.attackDice} defense={props.lastAttack.defenseDice} seq={props.attackSeq} />
          </section>
        ) : null}
      </>
    );
  }
  return (
    <div className="action-panel" aria-label={`Sua vez${me ? `, ${PLAYER_META[me.color].label}` : ''}`}>
      {view.phase === 'reinforce' ? <ReinforcePanel {...props} /> : null}
      {view.phase === 'attack' || view.phase === 'occupy' ? (
        <AttackPanel {...props} from={props.selected} to={props.chosen} />
      ) : null}
      {view.phase === 'fortify' ? <FortifyPanel {...props} from={props.selected} to={props.chosen} /> : null}
    </div>
  );
}

export function territoryRegionLabel(id: TerritoryId): string {
  const t = TERRITORY_BY_ID.get(id);
  return t ? regionName(t.region) : '';
}
