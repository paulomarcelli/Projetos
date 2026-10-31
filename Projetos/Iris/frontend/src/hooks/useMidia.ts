import { useSyncExternalStore } from "react";

/** Acompanha uma media query sem copiar o resultado em estado (sem atraso nem divergência). */
export function useMidia(consulta: string) {
  return useSyncExternalStore(
    (f) => {
      const mq = window.matchMedia?.(consulta);
      mq?.addEventListener?.("change", f);
      return () => mq?.removeEventListener?.("change", f);
    },
    () => window.matchMedia?.(consulta).matches ?? true,
    () => true,
  );
}
