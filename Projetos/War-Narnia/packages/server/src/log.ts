// Log estruturado simples (uma linha JSON por evento). Nunca registrar tokens nem objetivos.
type Level = 'debug' | 'info' | 'warn' | 'error';
const order: Record<Level | 'silent', number> = { debug: 10, info: 20, warn: 30, error: 40, silent: 99 };

function threshold(): number {
  const lvl = (process.env.LOG_LEVEL ?? 'info') as Level | 'silent';
  return order[lvl] ?? order.info;
}

/** Id curto de jogador para log. */
export const shortId = (id: string | undefined | null): string | undefined => (id ? id.slice(0, 6) : undefined);

function write(level: Level, msg: string, fields?: Record<string, unknown>): void {
  if (order[level] < threshold()) return;
  const line = JSON.stringify({ t: new Date().toISOString(), level, msg, ...fields });
  if (level === 'error' || level === 'warn') console.error(line);
  else console.log(line);
}

export const log = {
  debug: (m: string, f?: Record<string, unknown>) => write('debug', m, f),
  info: (m: string, f?: Record<string, unknown>) => write('info', m, f),
  warn: (m: string, f?: Record<string, unknown>) => write('warn', m, f),
  error: (m: string, f?: Record<string, unknown>) => write('error', m, f),
};

/** Resume um erro sem vazar dados (só nome, mensagem e pilha). */
export function errInfo(e: unknown): Record<string, unknown> {
  if (e instanceof Error) return { err: e.name, errMsg: e.message, stack: e.stack };
  return { err: String(e) };
}
