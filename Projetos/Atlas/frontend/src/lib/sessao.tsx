/** Sessão do usuário: quem está logado, para todas as telas. O cookie de sessão é httpOnly (o JS nunca o lê). */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../api/cliente";
import type { Perfil } from "../api/tipos";
import { Carregando } from "../componentes/Estado";

interface Sessao {
  perfil: Perfil | null;
  carregando: boolean;
  recarregar: () => Promise<Perfil | null>;
  definir: (p: Perfil | null) => void;
  sair: () => Promise<void>;
}

const Contexto = createContext<Sessao | null>(null);

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    try {
      const p = await api.eu();
      setPerfil(p);
      return p;
    } catch {
      setPerfil(null);
      return null;
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { recarregar(); }, [recarregar]);

  const sair = useCallback(async () => {
    try { await api.sair(); } finally { setPerfil(null); }
  }, []);

  return <Contexto.Provider value={{ perfil, carregando, recarregar, definir: setPerfil, sair }}>{children}</Contexto.Provider>;
}

export function useSessao(): Sessao {
  const c = useContext(Contexto);
  if (!c) throw new Error("useSessao fora do ProvedorSessao");
  return c;
}

/** Protege as rotas do app: sem sessão, leva para /entrar e volta depois do login. */
export function Protegida({ children }: { children: ReactNode }) {
  const { perfil, carregando } = useSessao();
  const local = useLocation();
  if (carregando) return <div className="px-4 py-10"><Carregando texto="Verificando sua sessão…" /></div>;
  if (!perfil) return <Navigate to={`/entrar?voltar=${encodeURIComponent(local.pathname + local.search)}`} replace />;
  return <>{children}</>;
}

/** Título da aba e indexação por página (o app logado não deve aparecer em buscadores). */
export function useTitulo(titulo: string, indexavel = false) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · ATLAS` : "ATLAS — Simulação geopolítica para a sala de aula";
    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    meta.content = indexavel ? "index, follow" : "noindex, nofollow";
  }, [titulo, indexavel]);
}
