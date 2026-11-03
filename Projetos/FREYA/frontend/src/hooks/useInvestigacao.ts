import { useCallback, useEffect, useState } from "react";
import { acompanharInvestigacao, estaEmAndamento, obterGrafo, type ErroDaApi } from "../services";
import type { GrafoDaInvestigacao, Investigacao } from "../types/api";
import { useRecurso, type EstadoDoRecurso } from "./useRecurso";

export interface EstadoDaInvestigacao {
  investigacao: Investigacao | null;
  /** erro da última consulta; com `investigacao` presente, é passageiro (o acompanhamento continua) */
  erro: ErroDaApi | null;
  carregando: boolean;
  /** ainda consultando a cada 1,5 s */
  acompanhando: boolean;
  recarregar: () => void;
  /** troca a investigação localmente (ex.: guardada, de forma otimista) */
  atualizarLocal: (f: (inv: Investigacao) => Investigacao) => void;
}

/**
 * GET /investigacoes/{id} e, enquanto ela roda, acompanhamento ao vivo (acompanharInvestigacao), que para
 * sozinho em `concluida`/`falhou`. Trocar de id ou desmontar cancela tudo.
 */
export function useInvestigacao(id: string | undefined): EstadoDaInvestigacao {
  const [investigacao, setInvestigacao] = useState<Investigacao | null>(null);
  const [erro, setErro] = useState<ErroDaApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [acompanhando, setAcompanhando] = useState(false);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    if (!id) return;
    setCarregando(true);
    setErro(null);
    setInvestigacao((atual) => (atual?.id === id ? atual : null));
    setAcompanhando(true);
    const a = acompanharInvestigacao(
      id,
      (inv) => {
        setInvestigacao(inv);
        setErro(null);
        setCarregando(false);
        if (!estaEmAndamento(inv.estado)) setAcompanhando(false);
      },
      (e) => {
        setErro(e);
        setCarregando(false);
        if (e.tipo === "nao_encontrado" || e.tipo === "invalido") setAcompanhando(false);
      },
    );
    return () => a.cancelar();
  }, [id, versao]);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);
  const atualizarLocal = useCallback((f: (inv: Investigacao) => Investigacao) => setInvestigacao((inv) => (inv ? f(inv) : inv)), []);

  return { investigacao, erro, carregando, acompanhando, recarregar, atualizarLocal };
}

/** GET /investigacoes/{id}/grafo, só quando a investigação concluiu (antes disso a API responde 409). */
export function useGrafo(id: string | null | undefined, pronto: boolean): EstadoDoRecurso<GrafoDaInvestigacao> {
  return useRecurso(id && pronto ? `grafo:${id}` : null, (sinal) => obterGrafo(id!, sinal));
}
