import { useCallback } from "react";
import { usePreferencias, type Tema } from "../../contexts/Preferencias";
import { executarRealityShift, type Ponto } from "./realidade";

/**
 * Troca o tema passando pelo Scarlet Reality Shift.
 * Use em qualquer controle de tema (ex.: o GrupoSegmentado da tela de configurações):
 *   const { trocarPara } = useTrocaDeTema();
 *   <GrupoSegmentado aoMudar={(t, { origem }) => trocarPara(t, origem)} … />
 */
export function useTrocaDeTema() {
  const { tema, definirTema, movimentoReduzido } = usePreferencias();

  const trocarPara = useCallback(
    (novo: Tema, origem?: Ponto) => {
      if (novo === tema) return Promise.resolve();
      const ponto = origem ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      return executarRealityShift(ponto, () => definirTema(novo), { reduzido: movimentoReduzido, temaNovo: novo });
    },
    [tema, definirTema, movimentoReduzido],
  );

  const alternar = useCallback((origem?: Ponto) => trocarPara(tema === "escuro" ? "claro" : "escuro", origem), [tema, trocarPara]);

  return { tema, trocarPara, alternar };
}
