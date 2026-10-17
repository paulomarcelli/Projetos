// Store em arquivos JSON: <dir>/<CODE>.json, gravação atômica (.tmp + rename),
// escritas serializadas por sala.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { StoredRoom } from '../rooms/model.js';
import type { RoomStore } from './room-store.js';
import { errInfo, log } from '../log.js';

const CODE_RE = /^[A-Z0-9]{3,16}$/;

export class FileRoomStore implements RoomStore {
  /** Cadeia de promessas por sala (fila de escrita). */
  private queues = new Map<string, Promise<void>>();

  constructor(private readonly dir: string) {}

  private file(code: string): string {
    if (!CODE_RE.test(code)) throw new Error('código de sala inválido para arquivo');
    return path.join(this.dir, `${code}.json`);
  }

  async loadAll(): Promise<StoredRoom[]> {
    await fs.mkdir(this.dir, { recursive: true });
    const out: StoredRoom[] = [];
    for (const name of await fs.readdir(this.dir)) {
      const full = path.join(this.dir, name);
      if (name.endsWith('.tmp')) {
        await fs.rm(full, { force: true }); // sobra de gravação interrompida
        continue;
      }
      if (!name.endsWith('.json')) continue;
      try {
        const room = JSON.parse(await fs.readFile(full, 'utf8')) as StoredRoom;
        if (room && room.schema === 1 && typeof room.code === 'string') out.push(room);
        else log.warn('store: arquivo de sala ignorado (formato)', { file: name });
      } catch (e) {
        log.error('store: falha ao ler sala', { file: name, ...errInfo(e) });
      }
    }
    return out;
  }

  private enqueue(code: string, job: () => Promise<void>): Promise<void> {
    const prev = this.queues.get(code) ?? Promise.resolve();
    const next = prev.catch(() => undefined).then(job);
    this.queues.set(code, next);
    void next.finally(() => {
      if (this.queues.get(code) === next) this.queues.delete(code);
    }).catch(() => undefined);
    return next;
  }

  save(room: StoredRoom): Promise<void> {
    // Instantâneo síncrono: o que for salvo é o estado deste momento.
    const json = JSON.stringify(room);
    const target = this.file(room.code);
    return this.enqueue(room.code, async () => {
      await fs.mkdir(this.dir, { recursive: true });
      const tmp = `${target}.${process.pid}.tmp`;
      await fs.writeFile(tmp, json, { encoding: 'utf8', mode: 0o600 });
      await fs.rename(tmp, target);
    });
  }

  delete(code: string): Promise<void> {
    const target = this.file(code);
    return this.enqueue(code, () => fs.rm(target, { force: true }));
  }

  async flush(): Promise<void> {
    await Promise.allSettled([...this.queues.values()]);
  }
}
