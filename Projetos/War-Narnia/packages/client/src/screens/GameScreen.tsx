import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameAction, PlayerView, TerritoryId } from '@war/shared';
import { api, sendSequence } from '../net/api';
import { toast, useStore } from '../net/store';
import { GameMap } from '../components/map/GameMap';
import { ActionPanel, OccupyDialog, PhaseStepper, type GameActions } from '../components/game/PhasePanels';
import { HistoryPanel, ObjectivePanel, PlayersPanel, TerritoryPanel } from '../components/game/InfoPanels';
import { VictoryDialog } from '../components/game/VictoryDialog';
import { Tabs, type TabDef } from '../components/ui/Tabs';
import { Button, IconButton } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { PlayerSeal } from '../components/ui/Emblem';
import { ConnDot } from '../components/ui/ConnectionBanner';
import { FullscreenLoading } from '../components/ui/Loading';
import { Icon } from '../components/ui/Icon';
import { PHONE_QUERY, useMediaQuery, WIDE_QUERY } from '../hooks/useMediaQuery';
import { PHASE_LABEL, armies } from '../game/format';
import { playerById } from '../game/players';
import { territoryName } from '../game/map';
import {
  attackTargets,
  canAttackFrom,
  fortifyDestinations,
  isMyTurn,
  movableFrom,
  ownsTerritory,
  totalReinforcements,
} from '../game/rules-ui';

type SideTab = 'acao' | 'territorio' | 'jogadores' | 'objetivo' | 'historico';
type SheetState = 'min' | 'half' | 'full';

export function GameScreen() {
  const view = useStore((s) => s.view);
  if (!view) return <FullscreenLoading text="Carregando a partida…" />;
  return <Game view={view} />;
}

function Game({ view }: { view: PlayerView }) {
  const busy = useStore((s) => s.busy);
  const lastAttack = useStore((s) => s.lastAttack);
  const attackSeq = useStore((s) => s.attackSeq);
  const history = useStore((s) => s.history);
  const roomCode = useStore((s) => s.room?.code ?? s.session?.roomCode ?? '');
  const conn = useStore((s) => s.conn);
  const preview = useStore((s) => s.preview);

  const wide = useMediaQuery(WIDE_QUERY);
  const phone = useMediaQuery(PHONE_QUERY);

  const [selected, setSelected] = useState<TerritoryId | null>(null);
  const [chosen, setChosen] = useState<TerritoryId | null>(null);
  const [tab, setTab] = useState<SideTab>('acao');
  const [infoTab, setInfoTab] = useState<'jogadores' | 'objetivo' | 'historico'>('jogadores');
  const [sheet, setSheet] = useState<SheetState>('half');
  const [victoryDismissed, setVictoryDismissed] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const myTurn = isMyTurn(view);
  const current = playerById(view.players, view.currentPlayer);

  // Troca de fase ou de jogador: limpa o alvo escolhido.
  useEffect(() => {
    setChosen(null);
  }, [view.phase, view.currentPlayer]);

  // Alvo conquistado (virou meu) ou origem perdida: atualiza a seleção.
  useEffect(() => {
    if (chosen && view.phase === 'attack' && ownsTerritory(view, chosen)) setChosen(null);
  }, [chosen, view]);

  const targets = useMemo(() => {
    if (!myTurn || view.phase !== 'attack' || !selected || !canAttackFrom(view, selected)) return new Set<TerritoryId>();
    return new Set(attackTargets(view, selected));
  }, [myTurn, view, selected]);

  const destinations = useMemo(() => {
    if (!myTurn) return new Set<TerritoryId>();
    if (view.phase === 'occupy' && view.pendingOccupation) return new Set([view.pendingOccupation.to]);
    if (view.phase === 'fortify' && selected && movableFrom(view, selected) > 0) return new Set(fortifyDestinations(view, selected));
    return new Set<TerritoryId>();
  }, [myTurn, view, selected]);

  const onSelect = useCallback(
    (id: TerritoryId) => {
      if (myTurn && view.phase === 'attack' && selected && targets.has(id)) {
        setChosen(id);
      } else if (myTurn && view.phase === 'fortify' && selected && destinations.has(id)) {
        setChosen(id);
      } else {
        setSelected((cur) => (cur === id && !myTurn ? null : id));
        setChosen(null);
      }
      if (!wide) {
        setTab(myTurn ? 'acao' : 'territorio');
        if (phone && sheet === 'min') setSheet('half');
      }
    },
    [myTurn, view.phase, selected, targets, destinations, wide, phone, sheet],
  );

  const onClear = useCallback(() => {
    setSelected(null);
    setChosen(null);
  }, []);

  const send = useCallback(async (a: GameAction, success?: string) => {
    const ok = await api().sendAction(a);
    if (ok && success) toast('success', success);
    return ok;
  }, []);

  const actions: GameActions = useMemo(
    () => ({
      place: (territory, count) => void send({ type: 'place', territory, count }),
      trade: (cardIds) => void send({ type: 'trade-cards', cardIds }, 'Cartas trocadas por exércitos.'),
      endReinforce: () => void send({ type: 'end-reinforce' }),
      attack: (from, to, dice) => void send({ type: 'attack', from, to, dice }),
      endAttack: () => {
        setChosen(null);
        void send({ type: 'end-attack' });
      },
      endTurn: (fromPhase) => {
        onClear();
        if (fromPhase === 'attack') {
          void sendSequence([{ type: 'end-attack' }, { type: 'end-turn' }]).then((ok) => ok && toast('success', 'Turno encerrado.'));
        } else {
          void send({ type: 'end-turn' }, 'Turno encerrado.');
        }
      },
      occupy: (count) => void send({ type: 'occupy', count }),
      fortify: (from, to, count) => {
        void send({ type: 'fortify', from, to, count }).then((ok) => ok && setChosen(null));
      },
    }),
    [send, onClear],
  );

  const gameOver = view.phase === 'game-over' || view.winner !== null;
  const actionTitle = myTurn ? `Sua vez · ${PHASE_LABEL[view.phase]}` : `Vez de ${current?.name ?? '—'}`;

  const actionContent = (
    <ActionPanel view={view} busy={busy} actions={actions} selected={selected} chosen={chosen} lastAttack={lastAttack} attackSeq={attackSeq} />
  );
  const territoryContent = <TerritoryPanel view={view} id={chosen ?? selected} onSelect={onSelect} />;
  const playersContent = <PlayersPanel view={view} />;
  const objectiveContent = <ObjectivePanel view={view} />;
  const historyContent = <HistoryPanel view={view} events={history} />;

  const allTabs: TabDef<SideTab>[] = [
    { key: 'acao', label: 'Ação', icon: 'swords', badge: myTurn ? '!' : undefined },
    { key: 'territorio', label: 'Território', icon: 'map' },
    { key: 'jogadores', label: 'Jogadores', icon: 'users' },
    { key: 'objetivo', label: 'Objetivo', icon: 'target', badge: view.myCards.length || undefined },
    { key: 'historico', label: 'Histórico', icon: 'scroll' },
  ];

  return (
    <div className={`game${wide ? ' game--wide' : ' game--compact'}${phone ? ' game--phone' : ''}`}>
      <header className="topbar">
        <div className="topbar__brand">
          <span className="brand-mark" aria-hidden="true">
            W
          </span>
          <span className="topbar__title">
            WAR <span className="topbar__subtitle">Nárnia</span>
          </span>
        </div>
        <div className="topbar__turn" aria-live="polite" aria-atomic="true">
          {current ? <PlayerSeal color={current.color} size={phone ? 20 : 24} /> : null}
          <span className="topbar__turn-text">
            <span className="topbar__turn-who">{myTurn ? 'Sua vez' : `Vez de ${current?.name ?? '—'}`}</span>
            <span className="topbar__turn-phase">
              Rodada {view.round} · {PHASE_LABEL[view.phase]}
              {view.phase === 'reinforce' ? ` · ${armies(totalReinforcements(view))}` : ''}
            </span>
          </span>
        </div>
        {!phone ? <PhaseStepper view={view} /> : null}
        <div className="topbar__end">
          {roomCode ? (
            <span className="topbar__room" title="Código da sala">
              <span className="sr-only">Sala </span>
              {roomCode}
            </span>
          ) : null}
          <ConnDot connected={conn === 'connected' || preview} label={phone ? undefined : conn === 'connected' || preview ? 'online' : 'offline'} />
          {gameOver && victoryDismissed ? (
            <Button size="sm" variant="primary" icon="crown" onClick={() => setVictoryDismissed(false)}>
              Resultado
            </Button>
          ) : null}
          <IconButton icon="door" label="Sair da partida" onClick={() => setConfirmLeave(true)} className="icon-btn--chrome" />
        </div>
      </header>

      <div className="game__body">
        <main className="game__map" id="conteudo">
          <h1 className="sr-only">Tabuleiro — WAR: As Crônicas de Nárnia</h1>
          <GameMap
            view={view}
            selected={selected}
            targets={targets}
            destinations={destinations}
            chosen={chosen}
            onSelect={onSelect}
            onClear={onClear}
          />
          {selected && !wide ? (
            <p className="map-hint" aria-hidden="true">
              {territoryName(selected)}
              {chosen ? ` → ${territoryName(chosen)}` : ''}
            </p>
          ) : null}
        </main>

        {wide ? (
          <aside className="side" aria-label="Painéis do jogo">
            <section className={`panel panel--action${myTurn ? ' is-my-turn' : ''}`} aria-labelledby="action-title">
              <h2 id="action-title" className="panel__title">
                {actionTitle}
              </h2>
              {actionContent}
            </section>
            <section className="panel" aria-labelledby="terr-title">
              <h2 id="terr-title" className="panel__title">
                Território
              </h2>
              {territoryContent}
            </section>
            <section className="panel panel--tabs" aria-label="Informações">
              <Tabs
                label="Informações da partida"
                tabs={allTabs.filter((t): t is TabDef<'jogadores' | 'objetivo' | 'historico'> => t.key !== 'acao' && t.key !== 'territorio')}
                active={infoTab}
                onChange={setInfoTab}
              >
                {infoTab === 'jogadores' ? playersContent : infoTab === 'objetivo' ? objectiveContent : historyContent}
              </Tabs>
            </section>
          </aside>
        ) : (
          <aside className={`side side--compact${phone ? ` sheet sheet--${sheet}` : ''}`} aria-label="Painéis do jogo">
            {phone ? (
              <button
                type="button"
                className="sheet__handle"
                aria-expanded={sheet !== 'min'}
                aria-label={sheet === 'full' ? 'Recolher painel' : 'Expandir painel'}
                onClick={() => setSheet((s) => (s === 'min' ? 'half' : s === 'half' ? 'full' : 'min'))}
              >
                <span className="sheet__grip" aria-hidden="true" />
                <span className="sheet__summary">{actionTitle}</span>
                <Icon name={sheet === 'full' ? 'chevron-down' : 'chevron-up'} size={18} />
              </button>
            ) : null}
            <Tabs label="Painéis do jogo" tabs={allTabs} active={tab} onChange={(k) => (setTab(k), phone && sheet === 'min' && setSheet('half'))} className="tabs--fill">
              {tab === 'acao' ? (
                <div className="panel-pad">
                  <h2 className="panel__title">{actionTitle}</h2>
                  {actionContent}
                </div>
              ) : tab === 'territorio' ? (
                <div className="panel-pad">{territoryContent}</div>
              ) : tab === 'jogadores' ? (
                <div className="panel-pad">{playersContent}</div>
              ) : tab === 'objetivo' ? (
                <div className="panel-pad">{objectiveContent}</div>
              ) : (
                <div className="panel-pad">{historyContent}</div>
              )}
            </Tabs>
          </aside>
        )}
      </div>

      <OccupyDialog view={view} busy={busy} actions={actions} />
      <VictoryDialog view={view} open={gameOver && !victoryDismissed} onViewMap={() => setVictoryDismissed(true)} />
      <Dialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title="Sair da partida?"
        actions={
          <>
            <Button onClick={() => setConfirmLeave(false)} data-autofocus>
              Ficar
            </Button>
            <Button variant="danger" icon="door" onClick={() => void api().leaveRoom()}>
              Sair de vez
            </Button>
          </>
        }
      >
        <p>
          {gameOver
            ? 'Você voltará para a tela inicial.'
            : 'Se sair, você abandona a partida: seus territórios ficam no mapa, mas você não joga mais. Para só fechar a aba e voltar depois, não precisa sair — a partida fica salva.'}
        </p>
      </Dialog>
    </div>
  );
}
