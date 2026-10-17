// Adaptador do motor de regras: usa somente a interface EngineApi exportada por @war/shared.
// Enquanto o motor (Agente 2) não existir, `loadEngine()` devolve null e o servidor
// recusa iniciar partidas com INTERNAL ("motor indisponível").
import * as shared from '@war/shared';
import { RuleError, type EngineApi } from '@war/shared';

const REQUIRED = ['createGame', 'applyAction', 'getPlayerView', 'skipTurn', 'abandon'] as const;

export function loadEngine(): EngineApi | null {
  const mod = shared as unknown as Partial<EngineApi> & Record<string, unknown>;
  if (!REQUIRED.every((k) => typeof mod[k] === 'function')) return null;
  return {
    createGame: mod.createGame!,
    applyAction: mod.applyAction!,
    getPlayerView: mod.getPlayerView!,
    skipTurn: mod.skipTurn!,
    abandon: mod.abandon!,
  };
}

/** Reconhece RuleError mesmo vindo de outra cópia do módulo. */
export function isRuleError(e: unknown): e is RuleError {
  return (
    e instanceof RuleError ||
    (e instanceof Error && e.name === 'RuleError' && typeof (e as { code?: unknown }).code === 'string')
  );
}
