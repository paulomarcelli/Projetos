/**
 * Dados que existem só neste navegador: rascunhos de investigação, favoritos e o histórico das conversas.
 * Enquanto não há API para eles, ficam no localStorage — e a interface diz isso.
 * Toda leitura e escrita é protegida: em navegação privada o armazenamento pode falhar.
 */

import { useCallback, useSyncExternalStore } from "react";

export type Horizonte = 1 | 3 | 5 | 10 | 25;
export type Profundidade = "exploratoria" | "padrao" | "aprofundada";

export interface Rascunho {
  id: string;
  pergunta: string;
  horizonte: Horizonte;
  regioes: string[];
  dimensoes: string[];
  profundidade: Profundidade;
  criadoEm: string;
  atualizadoEm: string;
}

const CHAVES = { rascunhos: "iris:rascunhos:v1", favoritos: "iris:favoritos:v1", conversas: "iris:conversas:v1" } as const;
const ouvintes = new Set<() => void>();
const cache = new Map<string, unknown>();

function ler<T>(chave: string, padrao: T): T {
  if (cache.has(chave)) return cache.get(chave) as T;
  let valor = padrao;
  try {
    const bruto = window.localStorage.getItem(chave);
    if (bruto) valor = JSON.parse(bruto) as T;
  } catch {
    valor = padrao;
  }
  cache.set(chave, valor);
  return valor;
}

function gravar<T>(chave: string, valor: T): boolean {
  cache.set(chave, valor);
  let ok = true;
  try {
    window.localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    ok = false;
  }
  for (const f of ouvintes) f();
  return ok;
}

function assinar(f: () => void): () => void {
  ouvintes.add(f);
  const aoMudarEmOutraAba = (e: StorageEvent) => {
    if (e.key && Object.values(CHAVES).includes(e.key as never)) {
      cache.delete(e.key);
      f();
    }
  };
  window.addEventListener("storage", aoMudarEmOutraAba);
  return () => {
    ouvintes.delete(f);
    window.removeEventListener("storage", aoMudarEmOutraAba);
  };
}

const SEM_RASCUNHOS: Rascunho[] = [];
const SEM_FAVORITOS: string[] = [];

export function useRascunhos() {
  const rascunhos = useSyncExternalStore(
    assinar,
    () => ler(CHAVES.rascunhos, SEM_RASCUNHOS),
    () => SEM_RASCUNHOS,
  );
  const salvar = useCallback((r: Omit<Rascunho, "id" | "criadoEm" | "atualizadoEm"> & { id?: string }) => {
    const agora = new Date().toISOString();
    const atuais = ler(CHAVES.rascunhos, SEM_RASCUNHOS);
    const existente = r.id ? atuais.find((x) => x.id === r.id) : undefined;
    const novo: Rascunho = {
      ...r,
      id: existente?.id ?? crypto.randomUUID(),
      criadoEm: existente?.criadoEm ?? agora,
      atualizadoEm: agora,
    };
    const lista = [novo, ...atuais.filter((x) => x.id !== novo.id)].slice(0, 50);
    return { rascunho: novo, gravado: gravar(CHAVES.rascunhos, lista) };
  }, []);
  const remover = useCallback((id: string) => {
    gravar(
      CHAVES.rascunhos,
      ler(CHAVES.rascunhos, SEM_RASCUNHOS).filter((x) => x.id !== id),
    );
  }, []);
  return { rascunhos, salvar, remover };
}

export function useFavoritos() {
  const favoritos = useSyncExternalStore(
    assinar,
    () => ler(CHAVES.favoritos, SEM_FAVORITOS),
    () => SEM_FAVORITOS,
  );
  const alternar = useCallback((id: string) => {
    const atuais = ler(CHAVES.favoritos, SEM_FAVORITOS);
    gravar(
      CHAVES.favoritos,
      atuais.includes(id) ? atuais.filter((x) => x !== id) : [id, ...atuais],
    );
  }, []);
  const remover = useCallback((id: string) => {
    gravar(
      CHAVES.favoritos,
      ler(CHAVES.favoritos, SEM_FAVORITOS).filter((x) => x !== id),
    );
  }, []);
  return { favoritos, alternar, remover, eFavorito: (id: string) => favoritos.includes(id) };
}

/**
 * O mesmo armazenamento, fora do React: o histórico das conversas (features/conversa/historico.ts) é gravado pelo
 * motor da conversa enquanto a página muda de endereço, e lido pelos componentes com useSyncExternalStore.
 */
export const armazenamentoLocal = { ler, gravar, assinar, chaves: CHAVES };
