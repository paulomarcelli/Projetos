/**
 * Sessão salva no navegador. Guardamos SÓ {code, token}, e só para reconectar
 * (room:resume). Nada de estado de jogo em localStorage.
 */
const KEY = 'war-narnia:sessao';

export interface SavedSession {
  code: string;
  token: string;
}

export function loadSession(): SavedSession | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as SavedSession).code === 'string' &&
      typeof (parsed as SavedSession).token === 'string'
    ) {
      return { code: (parsed as SavedSession).code, token: (parsed as SavedSession).token };
    }
  } catch {
    /* armazenamento indisponível (aba anônima, bloqueio): segue sem sessão */
  }
  return null;
}

export function saveSession(s: SavedSession): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ code: s.code, token: s.token }));
  } catch {
    /* ignora: sem reconexão automática neste navegador */
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignora */
  }
}

/** Código de convite vindo do link /?sala=CODIGO (normalizado em maiúsculas). */
export function inviteCodeFromUrl(search: string = window.location.search): string | null {
  const code = new URLSearchParams(search).get('sala');
  if (!code) return null;
  const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return clean.length > 0 ? clean : null;
}

export function inviteLink(code: string): string {
  return `${window.location.origin}/?sala=${encodeURIComponent(code)}`;
}
