import { it } from 'vitest';
import { applyAction, createGame, createSeededRng, currentPlayer } from '../src/engine';
import { makePlayers } from './helpers';
import { botAction } from './bots';
it('debug', () => {
  const stalls: number[] = []; let maxA = 0, tot = 0;
  for (let i = 0; i < 220; i++) {
    const rng = createSeededRng(1000 + i);
    let s = createGame(makePlayers(2 + (i % 5)), rng, 0).state;
    let a = 0;
    for (; a < 50000 && s.phase !== 'game-over'; a++) s = applyAction(s, currentPlayer(s), botAction(s, rng), rng, 0).state;
    if (s.phase !== 'game-over') stalls.push(1000 + i);
    maxA = Math.max(maxA, a); tot += a;
  }
  console.log('stalls', stalls, 'max', maxA, 'avg', tot / 220);
}, 600000);
