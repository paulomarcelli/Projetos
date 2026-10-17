/**
 * Store global simples (useSyncExternalStore). Sem dependências externas.
 * Guarda: tela, conexão, sessão, sala, visão do jogador, histórico e toasts.
 */
import { useSyncExternalStore } from 'react';
import type { GameEvent, PlayerView, RoomSummary, Session } from '@war/shared';

export type ConnStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'offline';
export type Screen = 'inicio' | 'menu' | 'sala' | 'jogo';
export type ToastKind = 'error' | 'success' | 'info' | 'warning';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

export type AttackEvent = Extract<GameEvent, { type: 'attack' }>;

export interface AppState {
  screen: Screen;
  conn: ConnStatus;
  /** Sessão ativa (inclui playerId). O que vai ao localStorage é só {code, token}. */
  session: Session | null;
  room: RoomSummary | null;
  view: PlayerView | null;
  /** Histórico acumulado nesta aba (do log inicial + game:events). */
  history: GameEvent[];
  /** Último ataque recebido do servidor (para mostrar os dados). */
  lastAttack: AttackEvent | null;
  /** Incrementa a cada ataque recebido (reinicia a animação dos dados). */
  attackSeq: number;
  /** Uma ação está aguardando resposta do servidor. */
  busy: boolean;
  /** Retomando sessão salva ao abrir a página. */
  restoring: boolean;
  toasts: Toast[];
  /** Código vindo de um link de convite. */
  inviteCode: string | null;
  /** Modo de pré-visualização (só em desenvolvimento). */
  preview: boolean;
}

export const initialState: AppState = {
  screen: 'inicio',
  conn: 'idle',
  session: null,
  room: null,
  view: null,
  history: [],
  lastAttack: null,
  attackSeq: 0,
  busy: false,
  restoring: false,
  toasts: [],
  inviteCode: null,
  preview: false,
};

type Listener = () => void;

let state: AppState = initialState;
const listeners = new Set<Listener>();

export function getState(): AppState {
  return state;
}

export function setState(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)): void {
  const next = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export function resetState(patch: Partial<AppState> = {}): void {
  state = { ...initialState, ...patch };
  listeners.forEach((l) => l());
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

/* ---------------- Toasts ---------------- */

let toastSeq = 0;
const TOAST_MS: Record<ToastKind, number> = { error: 6000, warning: 5000, info: 4000, success: 3500 };

export function toast(kind: ToastKind, message: string): void {
  const id = ++toastSeq;
  setState((s) => ({ toasts: [...s.toasts.filter((t) => t.message !== message), { id, kind, message }].slice(-4) }));
  window.setTimeout(() => dismissToast(id), TOAST_MS[kind]);
}

export function dismissToast(id: number): void {
  setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
}

/* ---------------- Histórico ---------------- */

const MAX_HISTORY = 300;

function eventKey(e: GameEvent): string {
  return JSON.stringify(e);
}

/** Junta eventos novos ao histórico sem repetir (o log da visão pode reenviar eventos). */
export function mergeEvents(current: GameEvent[], incoming: GameEvent[]): GameEvent[] {
  if (incoming.length === 0) return current;
  const seen = new Set(current.map(eventKey));
  const merged = [...current];
  for (const e of incoming) {
    const k = eventKey(e);
    if (!seen.has(k)) {
      seen.add(k);
      merged.push(e);
    }
  }
  merged.sort((a, b) => a.at - b.at);
  return merged.slice(-MAX_HISTORY);
}
