import type { PlayerColor, PlayerId, PlayerPublic } from '@war/shared';

export type EmblemShape = 'triangulo' | 'circulo' | 'cruz' | 'estrela' | 'quadrado' | 'losango';

export interface PlayerColorMeta {
  label: string;
  /** Variável CSS da cor do jogador. */
  cssVar: string;
  /** Texto/emblema sobre a cor: claro (true) ou escuro (false). */
  lightText: boolean;
  /** Marca não cromática: cada cor tem um emblema de forma única. */
  emblem: EmblemShape;
  emblemLabel: string;
}

export const PLAYER_COLORS: PlayerColor[] = ['vermelho', 'azul', 'verde', 'amarelo', 'preto', 'branco'];

export const PLAYER_META: Record<PlayerColor, PlayerColorMeta> = {
  vermelho: { label: 'Vermelho', cssVar: 'var(--player-vermelho)', lightText: true, emblem: 'triangulo', emblemLabel: 'triângulo' },
  azul: { label: 'Azul', cssVar: 'var(--player-azul)', lightText: true, emblem: 'circulo', emblemLabel: 'círculo' },
  verde: { label: 'Verde', cssVar: 'var(--player-verde)', lightText: true, emblem: 'cruz', emblemLabel: 'cruz' },
  amarelo: { label: 'Amarelo', cssVar: 'var(--player-amarelo)', lightText: false, emblem: 'estrela', emblemLabel: 'estrela' },
  preto: { label: 'Preto', cssVar: 'var(--player-preto)', lightText: true, emblem: 'quadrado', emblemLabel: 'quadrado' },
  branco: { label: 'Branco', cssVar: 'var(--player-branco)', lightText: false, emblem: 'losango', emblemLabel: 'losango' },
};

export function playerById(players: PlayerPublic[], id: PlayerId | null | undefined): PlayerPublic | undefined {
  return id ? players.find((p) => p.id === id) : undefined;
}

export function playerName(players: PlayerPublic[], id: PlayerId | null | undefined): string {
  return playerById(players, id)?.name ?? 'Alguém';
}
