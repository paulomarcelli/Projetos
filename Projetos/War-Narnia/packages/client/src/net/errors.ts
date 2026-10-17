import type { ErrorPayload, RuleErrorCode, ServerErrorCode } from '@war/shared';
import { LIMITS } from '@war/shared';

/** Mensagens amigáveis por código do servidor (protocol.ts). */
export const SERVER_ERROR_TEXT: Record<ServerErrorCode, string> = {
  ROOM_NOT_FOUND: 'Sala não encontrada. Confira o código com quem convidou você.',
  ROOM_FULL: `Esta sala já está cheia (máximo de ${LIMITS.maxPlayers} jogadores).`,
  ROOM_ALREADY_STARTED: 'A partida desta sala já começou. Peça um novo convite.',
  COLOR_TAKEN: 'Essa cor já foi escolhida por outro jogador. Escolha outra.',
  NOT_HOST: 'Só o anfitrião da sala pode fazer isso.',
  NOT_ENOUGH_PLAYERS: `São necessários pelo menos ${LIMITS.minPlayers} jogadores para começar.`,
  INVALID_NAME: `Digite um nome de 1 a ${LIMITS.nameMaxLength} caracteres.`,
  INVALID_TOKEN: 'Sua sessão expirou. Entre na sala de novo.',
  NOT_IN_ROOM: 'Você não está em uma sala. Entre ou crie uma.',
  STALE_VERSION: 'A partida mudou enquanto você agia. O mapa foi atualizado — confira e tente de novo.',
  DUPLICATE_ACTION: 'Essa ação já foi recebida.',
  RATE_LIMITED: 'Muitas ações seguidas. Aguarde um instante.',
  BAD_REQUEST: 'Pedido inválido. Recarregue a página se o problema continuar.',
  RULE_ERROR: 'Jogada não permitida pelas regras.',
  INTERNAL: 'Erro no servidor. Tente de novo em alguns segundos.',
};

/** Mensagens amigáveis por código do motor de regras (types.ts). */
export const RULE_ERROR_TEXT: Record<RuleErrorCode, string> = {
  NOT_YOUR_TURN: 'Ainda não é a sua vez.',
  WRONG_PHASE: 'Essa ação não vale nesta fase do turno.',
  INVALID_TERRITORY: 'Território inválido.',
  NOT_OWNER: 'Esse território não é seu.',
  NOT_ADJACENT: 'Os territórios precisam fazer fronteira (terra ou rota marítima).',
  NOT_ENEMY: 'Só é possível atacar território de outro jogador.',
  NOT_ENOUGH_ARMIES: 'Exércitos insuficientes: pelo menos 1 precisa ficar no território.',
  INVALID_COUNT: 'Quantidade inválida.',
  INVALID_DICE: 'Número de dados inválido para esse ataque.',
  MUST_PLACE_ALL: 'Distribua todos os exércitos antes de continuar.',
  MUST_TRADE: 'Você tem cartas demais: troque 3 cartas antes de continuar.',
  INVALID_CARDS: 'Essas 3 cartas não formam uma troca válida.',
  ALREADY_MOVED: 'Esses exércitos já se moveram neste turno.',
  GAME_OVER: 'A partida já terminou.',
  ATTACK_NOT_ALLOWED_YET: 'Ataques ainda não são permitidos nesta rodada.',
};

export function isRuleErrorCode(code: string | undefined): code is RuleErrorCode {
  return !!code && code in RULE_ERROR_TEXT;
}

export function friendlyError(err: ErrorPayload | null | undefined): string {
  if (!err) return 'Algo deu errado. Tente de novo.';
  if (err.code === 'RULE_ERROR') {
    if (isRuleErrorCode(err.ruleCode)) return RULE_ERROR_TEXT[err.ruleCode];
    return err.message || SERVER_ERROR_TEXT.RULE_ERROR;
  }
  return SERVER_ERROR_TEXT[err.code] ?? err.message ?? 'Algo deu errado. Tente de novo.';
}

export const TIMEOUT_TEXT = 'O servidor não respondeu a tempo. Verifique a conexão e tente de novo.';
