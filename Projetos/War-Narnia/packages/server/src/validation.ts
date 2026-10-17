// Esquemas zod de todos os payloads cliente → servidor.
import { z } from 'zod';
import { LIMITS, type PlayerColor } from '@war/shared';

export const PLAYER_COLORS = ['vermelho', 'azul', 'verde', 'amarelo', 'preto', 'branco'] as const satisfies readonly PlayerColor[];

const id = z.string().min(1).max(64);
const count = z.number().int().min(1).max(10_000);

/** Nome: string crua (a validação fina é `normalizeName`, que devolve INVALID_NAME). */
const rawName = z.string().max(200);

export const roomCodeSchema = z
  .string()
  .max(16)
  .transform((s) => s.trim().toUpperCase());

export const gameActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('place'), territory: id, count }).strict(),
  z.object({ type: z.literal('trade-cards'), cardIds: z.tuple([id, id, id]) }).strict(),
  z.object({ type: z.literal('end-reinforce') }).strict(),
  z.object({ type: z.literal('attack'), from: id, to: id, dice: z.number().int().min(1).max(3) }).strict(),
  z.object({ type: z.literal('occupy'), count }).strict(),
  z.object({ type: z.literal('end-attack') }).strict(),
  z.object({ type: z.literal('fortify'), from: id, to: id, count }).strict(),
  z.object({ type: z.literal('end-turn') }).strict(),
]);

const empty = z.union([z.object({}), z.undefined(), z.null()]);

export const schemas = {
  'room:create': z.object({ name: rawName }),
  'room:join': z.object({ code: roomCodeSchema, name: rawName }),
  'room:resume': z.object({ code: roomCodeSchema, token: z.string().min(1).max(128) }),
  'room:set-color': z.object({ color: z.enum(PLAYER_COLORS) }),
  'room:start': empty,
  'room:leave': empty,
  'game:action': z.object({
    clientActionId: id,
    expectedVersion: z.number().int().min(0),
    action: gameActionSchema,
  }),
  'game:sync': empty,
} as const;

// Caracteres de controle e de formatação invisíveis/bidirecionais.
const FORBIDDEN = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u;

/** Normaliza e valida o nome do jogador; devolve null se inválido. */
export function normalizeName(raw: string): string | null {
  const name = raw.normalize('NFC').trim().replace(/\s+/g, ' ');
  if (name.length < 1 || [...name].length > LIMITS.nameMaxLength) return null;
  if (FORBIDDEN.test(name)) return null;
  return name;
}
