// Gerador aleatório criptográfico para o motor (dados rolados no servidor).
import { randomInt } from 'node:crypto';
import type { Rng } from '@war/shared';

export const cryptoRng: Rng = {
  int(min: number, max: number): number {
    // randomInt é exclusivo no máximo.
    return randomInt(min, max + 1);
  },
};
