/**
 * CONTRATO DO MOTOR DE REGRAS.
 *
 * Dono da implementação: Agente 2 (Game Design e regras), em
 * packages/shared/src/engine/. O servidor (Agente 4) só usa estas funções;
 * o cliente (Agente 3) só usa os tipos e `rules-config` para exibir valores.
 *
 * Regras de ouro:
 * - Funções puras: recebem o estado e devolvem um NOVO estado (sem mutar o original).
 * - Toda aleatoriedade vem de `Rng`, injetado. O servidor usa crypto; os testes usam semente.
 * - Ação inválida lança `RuleError` (types.ts) com código e mensagem em português.
 * - Parâmetros numéricos ficam em um único lugar: `RULES` (engine/rules-config.ts).
 */
import type { GameAction, GameEvent, GameState, PlayerColor, PlayerId, PlayerView } from './types';

/** Gera inteiro uniforme em [min, max] (inclusivo). */
export interface Rng {
  int(min: number, max: number): number;
}

export interface NewPlayer {
  id: PlayerId;
  name: string;
  color: PlayerColor;
}

export interface ActionResult {
  state: GameState;
  /** Eventos gerados por esta ação, em ordem. */
  events: GameEvent[];
}

export interface EngineApi {
  /** Embaralha ordem, distribui territórios, objetivos e cartas; começa a 1ª rodada. */
  createGame(players: NewPlayer[], rng: Rng, now?: number): ActionResult;
  /** Valida e aplica uma ação do jogador. Lança RuleError se inválida. */
  applyAction(state: GameState, player: PlayerId, action: GameAction, rng: Rng, now?: number): ActionResult;
  /** O que um jogador pode ver (sem dados privados dos outros). `null` = espectador. */
  getPlayerView(state: GameState, player: PlayerId | null): PlayerView;
  /**
   * Pula o turno de um jogador (desconectado/abandono). Mantém o estado válido:
   * descarta ocupação pendente com o mínimo, encerra o turno e passa a vez.
   */
  skipTurn(state: GameState, player: PlayerId, reason: 'disconnected' | 'abandoned', now?: number): ActionResult;
  /** Remove um jogador que abandonou: seus territórios continuam no mapa como do jogador, mas ele não joga mais. */
  abandon(state: GameState, player: PlayerId, now?: number): ActionResult;
}
