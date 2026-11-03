import { useEffect, useState } from "react";
import { obterSaude } from "../services";
import type { Saude } from "../types/api";
import { useRecurso, type EstadoDoRecurso } from "./useRecurso";

/** GET /saude — motor, modelo e tamanho da base. */
export function useSaude(): EstadoDoRecurso<Saude> {
  return useRecurso("saude", (sinal) => obterSaude(sinal));
}

/** Relógio que avança a cada `intervalo` ms enquanto `ativo` (para "há 42 s" ao vivo). */
export function useAgora(ativo: boolean, intervalo = 1000): number {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    if (!ativo) return;
    setAgora(Date.now());
    const t = setInterval(() => setAgora(Date.now()), intervalo);
    return () => clearInterval(t);
  }, [ativo, intervalo]);
  return agora;
}
