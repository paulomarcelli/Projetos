/**
 * Números de regra usados SÓ para a interface (habilitar botões e limites de
 * seletores). Quando o motor publicar `RULES` (engine/rules-config.ts), estes
 * valores passam a vir de lá — ver docs/DESIGN_SYSTEM.md, "Pedidos ao Tech Lead".
 */
export const UI_RULES = {
  maxAttackDice: 3,
  minArmiesLeftBehind: 1,
  mustTradeAtCards: 5,
} as const;
