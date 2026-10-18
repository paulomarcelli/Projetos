/**
 * Números de regra usados pela interface (habilitar botões, limites de seletores).
 * Vêm de `RULES` (packages/shared/src/engine/rules-config.ts) — o único lugar
 * com números de regra. Aqui só damos nomes do ponto de vista da UI.
 */
import { RULES } from '@war/shared';

export const UI_RULES = {
  maxAttackDice: RULES.maxAttackDice,
  /** Precisa ter `minArmiesToAttack` para atacar, ou seja, sempre fica (min - 1) para trás. */
  minArmiesLeftBehind: RULES.minArmiesToAttack - 1,
  mustTradeAtCards: RULES.mustTradeAtHandSize,
} as const;
