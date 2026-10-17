// Liga os eventos do Socket.IO ao RoomManager: validação zod, limite de taxa, ack garantido.
import type { Server, Socket } from 'socket.io';
import type { Ack, ClientToServer, ServerToClient } from '@war/shared';
import type { ServerConfig } from '../config.js';
import { ServerError } from '../errors.js';
import { errInfo, log } from '../log.js';
import { RateLimiter } from '../rate-limit.js';
import type { RoomManager, Transport } from '../rooms/manager.js';
import { schemas } from '../validation.js';

export type IoServer = Server<ClientToServer, ServerToClient>;
type IoSocket = Socket<ClientToServer, ServerToClient>;
type EventName = keyof typeof schemas;

export function socketTransport(io: IoServer): Transport {
  return {
    toRoom: (ch) => io.to(ch),
    toSocket: (sid) => io.to(sid),
    joinChannel: (sid, code) => void io.sockets.sockets.get(sid)?.join(`room:${code}`),
    leaveChannel: (sid, code) => void io.sockets.sockets.get(sid)?.leave(`room:${code}`),
  };
}

export function registerHandlers(io: IoServer, manager: RoomManager, cfg: ServerConfig): void {
  manager.setTransport(socketTransport(io));

  io.on('connection', (socket: IoSocket) => {
    const actionLimiter = new RateLimiter(cfg.maxActionsPerSecond);
    const requestLimiter = new RateLimiter(cfg.maxRequestsPerSecond);

    /** Envolve um handler: valida, limita, captura erros e sempre responde o ack. */
    function on<E extends EventName>(
      event: E,
      run: (data: ReturnType<(typeof schemas)[E]['parse']>, reply: (r: Ack<unknown>) => void) => Promise<unknown> | unknown,
    ): void {
      (socket.on as (ev: string, fn: (...args: unknown[]) => void) => void)(event, (...args: unknown[]) => {
        const last = args[args.length - 1];
        const ack = typeof last === 'function' ? (last as (r: Ack<unknown>) => void) : () => undefined;
        const payload = typeof last === 'function' ? (args.length > 1 ? args[0] : undefined) : args[0];
        let answered = false;
        const reply = (r: Ack<unknown>) => {
          if (answered) return;
          answered = true;
          try {
            ack(r);
          } catch (e) {
            log.warn('falha ao responder ack', { event, ...errInfo(e) });
          }
        };
        const fail = (err: ServerError) => reply({ ok: false, error: err.toPayload() });

        const limiter = event === 'game:action' ? actionLimiter : requestLimiter;
        if (!limiter.take()) return fail(new ServerError('RATE_LIMITED', 'Muitas requisições. Aguarde um instante.'));

        const parsed = schemas[event].safeParse(payload);
        if (!parsed.success) return fail(new ServerError('BAD_REQUEST', 'Dados inválidos.'));

        Promise.resolve()
          .then(() => run(parsed.data as ReturnType<(typeof schemas)[E]['parse']>, reply))
          .then((data) => reply({ ok: true, data: data === undefined ? null : data }))
          .catch((e: unknown) => {
            if (e instanceof ServerError) return fail(e);
            log.error('erro inesperado', { event, socket: socket.id, ...errInfo(e) });
            fail(new ServerError('INTERNAL', 'Erro interno do servidor.'));
          });
      });
    }

    on('room:create', (d) => manager.create(socket.id, d.name));
    on('room:join', (d) => manager.join(socket.id, d.code, d.name));
    on('room:resume', async (d, reply) => {
      const res = await manager.resume(socket.id, d.code, d.token);
      // Ack primeiro, depois o estado do jogo.
      reply({ ok: true, data: res });
      manager.sendView(socket.id);
    });
    on('room:set-color', (d) => manager.setColor(socket.id, d.color));
    on('room:start', () => manager.start(socket.id));
    on('room:leave', () => manager.leave(socket.id));
    on('game:action', (d) => manager.action(socket.id, d));
    on('game:sync', () => manager.sync(socket.id));

    socket.on('disconnect', () => {
      manager.disconnect(socket.id).catch((e: unknown) => log.error('erro ao desconectar', errInfo(e)));
    });
  });
}
