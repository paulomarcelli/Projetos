// Interface de persistência de salas (trocável por Redis/Postgres no futuro).
import type { StoredRoom } from '../rooms/model.js';

export interface RoomStore {
  /** Carrega todas as salas salvas (na inicialização). */
  loadAll(): Promise<StoredRoom[]>;
  /** Salva um instantâneo da sala. Escritas da mesma sala são serializadas. */
  save(room: StoredRoom): Promise<void>;
  delete(code: string): Promise<void>;
  /** Espera as escritas pendentes terminarem. */
  flush(): Promise<void>;
}

/** Store em memória (útil para testes). */
export class MemoryRoomStore implements RoomStore {
  private data = new Map<string, string>();
  async loadAll(): Promise<StoredRoom[]> {
    return [...this.data.values()].map((s) => JSON.parse(s) as StoredRoom);
  }
  async save(room: StoredRoom): Promise<void> {
    this.data.set(room.code, JSON.stringify(room));
  }
  async delete(code: string): Promise<void> {
    this.data.delete(code);
  }
  async flush(): Promise<void> {}
}
