import { Check, CircleAlert, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type Tom = "sucesso" | "erro" | "info";
interface Notificacao {
  id: number;
  tom: Tom;
  texto: string;
  saindo?: boolean;
}

const Contexto = createContext<(tom: Tom, texto: string) => void>(() => {});

export function useNotificar() {
  return useContext(Contexto);
}

const DURACAO = 5000;

/** Notificações discretas no canto inferior; pausam enquanto a aba está oculta. */
export function ProvedorDeNotificacoes({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<Notificacao[]>([]);
  const proximo = useRef(1);
  const temporizadores = useRef(new Map<number, number>());

  const fechar = useCallback((id: number) => {
    setItens((atual) => atual.map((n) => (n.id === id ? { ...n, saindo: true } : n)));
    window.setTimeout(() => setItens((atual) => atual.filter((n) => n.id !== id)), 160);
    const t = temporizadores.current.get(id);
    if (t) window.clearTimeout(t);
    temporizadores.current.delete(id);
  }, []);

  const agendar = useCallback(
    (id: number) => {
      temporizadores.current.set(id, window.setTimeout(() => fechar(id), DURACAO));
    },
    [fechar],
  );

  const notificar = useCallback(
    (tom: Tom, texto: string) => {
      const id = proximo.current++;
      setItens((atual) => [...atual.slice(-3), { id, tom, texto }]);
      if (!document.hidden) agendar(id);
    },
    [agendar],
  );

  useEffect(() => {
    const aoMudar = () => {
      if (document.hidden) {
        for (const t of temporizadores.current.values()) window.clearTimeout(t);
        temporizadores.current.clear();
      } else {
        setItens((atual) => {
          for (const n of atual) if (!n.saindo) agendar(n.id);
          return atual;
        });
      }
    };
    document.addEventListener("visibilitychange", aoMudar);
    return () => document.removeEventListener("visibilitychange", aoMudar);
  }, [agendar]);

  return (
    <Contexto.Provider value={notificar}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-0 bottom-0 z-50 flex w-full max-w-sm flex-col gap-2 p-4"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        {itens.map((n) => (
          <div
            key={n.id}
            role={n.tom === "erro" ? "alert" : "status"}
            className="notificacao pointer-events-auto flex items-start gap-3 rounded-padrao border border-linha-forte bg-grafite p-3 shadow-[0_8px_24px_rgb(0_0_0/0.35)]"
            data-saindo={n.saindo || undefined}
          >
            <span className="mt-0.5 shrink-0" aria-hidden="true">
              {n.tom === "sucesso" ? (
                <Check size={16} className="text-positivo" />
              ) : n.tom === "erro" ? (
                <CircleAlert size={16} className="text-negativo" />
              ) : (
                <Info size={16} className="text-ciano" />
              )}
            </span>
            <p className="min-w-0 flex-1 text-legenda text-texto [overflow-wrap:anywhere]">{n.texto}</p>
            <button
              type="button"
              className="-m-1 shrink-0 rounded-fino p-1 text-texto-3 hover:text-texto"
              aria-label="Fechar notificação"
              onClick={() => fechar(n.id)}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </Contexto.Provider>
  );
}
