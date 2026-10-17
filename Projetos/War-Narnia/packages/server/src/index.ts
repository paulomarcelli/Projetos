// Ponto de entrada do servidor: `npm start -w @war/server`.
import { startServer } from './app.js';
import { errInfo, log } from './log.js';

// Nenhum erro solto derruba o processo.
process.on('uncaughtException', (e) => log.error('uncaughtException', errInfo(e)));
process.on('unhandledRejection', (e) => log.error('unhandledRejection', errInfo(e)));

const server = await startServer();

let closing = false;
async function shutdown(signal: string): Promise<void> {
  if (closing) return;
  closing = true;
  log.info('encerrando', { signal });
  await server.close().catch((e: unknown) => log.error('erro ao encerrar', errInfo(e)));
  process.exit(0);
}
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
