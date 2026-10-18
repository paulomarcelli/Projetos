import type { PlayerView } from '@war/shared';
import { api } from '../../net/api';
import { PLAYER_META, playerById } from '../../game/players';
import { armiesOwnedBy, territoriesOwnedBy } from '../../game/rules-ui';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { PlayerSeal } from '../ui/Emblem';

/** (10) Vitória / encerramento: vencedor, objetivo revelado e placar final. */
export function VictoryDialog({ view, open, onViewMap }: { view: PlayerView; open: boolean; onViewMap: () => void }) {
  if (!open) return null;
  const winner = playerById(view.players, view.winner);
  const iWon = !!view.me && view.me === view.winner;
  const ranking = [...view.players].sort((a, b) => territoriesOwnedBy(view, b.id) - territoriesOwnedBy(view, a.id));
  return (
    <Dialog
      open
      size="md"
      className="victory"
      title={iWon ? 'Vitória! Nárnia é sua.' : winner ? `${winner.name} venceu a partida` : 'Fim de jogo'}
      onClose={onViewMap}
      actions={
        <>
          <Button onClick={onViewMap} icon="map">
            Ver mapa final
          </Button>
          <Button variant="primary" onClick={() => void api().leaveRoom()} data-autofocus>
            Voltar ao início
          </Button>
        </>
      }
    >
      {winner ? (
        <div className="victory__hero">
          <PlayerSeal color={winner.color} size={64} title={`${winner.name}, ${PLAYER_META[winner.color].label}`} />
          <div>
            <p className="victory__name">{winner.name}</p>
            <p className="muted">
              {PLAYER_META[winner.color].label} · {territoriesOwnedBy(view, winner.id)} territórios
            </p>
          </div>
        </div>
      ) : null}
      {view.winnerObjective ? (
        <div className="victory__objective">
          <p className="section-title">Objetivo cumprido</p>
          <p>{view.winnerObjective}</p>
        </div>
      ) : null}
      <table className="score">
        <caption className="sr-only">Placar final</caption>
        <thead>
          <tr>
            <th scope="col">Jogador</th>
            <th scope="col">Territórios</th>
            <th scope="col">Exércitos</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((p) => (
            <tr key={p.id} className={p.id === view.winner ? 'is-winner' : ''}>
              <th scope="row">
                <PlayerSeal color={p.color} size={18} /> {p.name}
                {p.eliminated ? <span className="tag tag--muted">fora</span> : null}
              </th>
              <td>{territoriesOwnedBy(view, p.id)}</td>
              <td>{armiesOwnedBy(view, p.id)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Dialog>
  );
}
