/** Textos legíveis para o histórico e anúncios de leitor de tela. */
import type { GameEvent, Phase, PlayerPublic } from '@war/shared';
import { territoryName } from './map';
import { playerName } from './players';

export const PHASE_LABEL: Record<Phase, string> = {
  reinforce: 'Reforço',
  attack: 'Ataque',
  occupy: 'Ocupação',
  fortify: 'Remanejamento',
  'game-over': 'Fim de jogo',
};

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function armies(n: number): string {
  return plural(n, 'exército', 'exércitos');
}

export function dice(values: number[]): string {
  return values.join('-');
}

export function describeEvent(e: GameEvent, players: PlayerPublic[]): string {
  const name = (id: string) => playerName(players, id);
  switch (e.type) {
    case 'game-started':
      return `A partida começou. Ordem: ${e.turnOrder.map(name).join(', ')}.`;
    case 'turn-started':
      return `Rodada ${e.round}: vez de ${name(e.player)}, com ${armies(e.reinforcements)} para distribuir.`;
    case 'placed':
      return `${name(e.player)} colocou ${armies(e.count)} em ${territoryName(e.territory)}.`;
    case 'cards-traded': {
      const bonus = e.territoryBonus.length
        ? ` (+ bônus em ${e.territoryBonus.map(territoryName).join(', ')})`
        : '';
      return `${name(e.player)} trocou cartas por ${armies(e.armies)}${bonus}.`;
    }
    case 'attack':
      return (
        `${name(e.attacker)} atacou ${territoryName(e.to)} a partir de ${territoryName(e.from)}: ` +
        `${dice(e.attackDice)} × ${dice(e.defenseDice)} — ` +
        `${name(e.attacker)} perdeu ${e.attackerLosses}, ${name(e.defender)} perdeu ${e.defenderLosses}.`
      );
    case 'conquered':
      return `${name(e.player)} conquistou ${territoryName(e.territory)} de ${name(e.from)}.`;
    case 'occupied':
      return `${name(e.player)} moveu ${armies(e.count)} de ${territoryName(e.from)} para ${territoryName(e.to)}.`;
    case 'fortified':
      return `${name(e.player)} remanejou ${armies(e.count)} de ${territoryName(e.from)} para ${territoryName(e.to)}.`;
    case 'card-drawn':
      return `${name(e.player)} recebeu uma carta de território.`;
    case 'player-eliminated':
      return `${name(e.player)} foi eliminado por ${name(e.by)}.`;
    case 'turn-ended':
      return `${name(e.player)} encerrou o turno.`;
    case 'turn-skipped':
      return e.reason === 'disconnected'
        ? `Turno de ${name(e.player)} pulado (desconectado).`
        : `Turno de ${name(e.player)} pulado (abandono).`;
    case 'player-left':
      return `${name(e.player)} saiu da partida.`;
    case 'game-over':
      return `Fim de jogo! ${name(e.winner)} venceu. Objetivo: ${e.objective}`;
  }
}

/** Tipo visual do item de histórico (ícone + realce). */
export function eventTone(e: GameEvent): 'combat' | 'conquest' | 'turn' | 'move' | 'neutral' | 'end' {
  switch (e.type) {
    case 'attack':
      return 'combat';
    case 'conquered':
    case 'player-eliminated':
      return 'conquest';
    case 'turn-started':
    case 'turn-ended':
    case 'turn-skipped':
    case 'game-started':
      return 'turn';
    case 'placed':
    case 'occupied':
    case 'fortified':
    case 'cards-traded':
      return 'move';
    case 'game-over':
      return 'end';
    default:
      return 'neutral';
  }
}

export function timeLabel(at: number): string {
  try {
    return new Date(at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}
