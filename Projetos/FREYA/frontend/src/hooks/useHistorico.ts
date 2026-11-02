import { useCallback, useMemo, useRef, useState } from "react";
import { desguardarInvestigacao, excluirInvestigacao, guardarInvestigacao, listarInvestigacoes } from "../services";
import type { ResumoDeInvestigacao } from "../types/api";
import { comoErroDaApi } from "./erros";
import { agruparPorDia, type GrupoPorDia } from "./formatacao";
import { useRecurso } from "./useRecurso";

export interface ResultadoDaAcao {
  ok: boolean;
  mensagem: string;
}

export interface EstadoDoHistorico {
  itens: ResumoDeInvestigacao[] | null;
  grupos: GrupoPorDia<ResumoDeInvestigacao>[];
  carregando: boolean;
  atualizando: boolean;
  erro: ReturnType<typeof useRecurso<ResumoDeInvestigacao[]>>["erro"];
  recarregar: () => void;
  /** ids com uma ação em andamento (para desabilitar botões) */
  pendentes: ReadonlySet<string>;
  alternarGuardada: (item: ResumoDeInvestigacao) => Promise<ResultadoDaAcao>;
  excluir: (item: ResumoDeInvestigacao) => Promise<ResultadoDaAcao>;
}

/** Põe o item de volta no lugar dele (mais recentes primeiro), sem duplicar. */
function reinserir(lista: ResumoDeInvestigacao[], item: ResumoDeInvestigacao): ResumoDeInvestigacao[] {
  if (lista.some((x) => x.id === item.id)) return lista;
  const i = lista.findIndex((x) => x.criada_em < item.criada_em);
  return i < 0 ? [...lista, item] : [...lista.slice(0, i), item, ...lista.slice(i)];
}

function resumirQuestao(q: string): string {
  return q.length > 60 ? `${q.slice(0, 57).trimEnd()}…` : q;
}

/**
 * Histórico (GET /investigacoes), com guardar/remover/excluir otimistas: a lista muda na hora e,
 * se a API recusar, volta ao que era e devolve a mensagem para a interface mostrar.
 * Com `guardadas: true`, remover dos guardados tira o item da lista.
 */
export function useHistorico(opcoes: { guardadas?: boolean; limite?: number } = {}): EstadoDoHistorico {
  const { guardadas, limite } = opcoes;
  const recurso = useRecurso<ResumoDeInvestigacao[]>(`historico:${guardadas ?? "todas"}:${limite ?? ""}`, (sinal) =>
    listarInvestigacoes({ guardadas, limite, sinal }),
  );
  const { definirDados } = recurso;
  const [pendentes, setPendentes] = useState<ReadonlySet<string>>(new Set());
  const pendentesRef = useRef(new Set<string>());

  const marcar = useCallback((id: string, ligado: boolean) => {
    if (ligado) pendentesRef.current.add(id);
    else pendentesRef.current.delete(id);
    setPendentes(new Set(pendentesRef.current));
  }, []);

  const alternarGuardada = useCallback(
    async (item: ResumoDeInvestigacao): Promise<ResultadoDaAcao> => {
      const guardar = !item.guardada;
      definirDados((lista) => {
        if (!lista) return lista;
        if (guardadas && !guardar) return lista.filter((x) => x.id !== item.id);
        return lista.map((x) => (x.id === item.id ? { ...x, guardada: guardar } : x));
      });
      marcar(item.id, true);
      try {
        await (guardar ? guardarInvestigacao(item.id) : desguardarInvestigacao(item.id));
        return { ok: true, mensagem: guardar ? `“${resumirQuestao(item.questao)}” foi para os guardados.` : `“${resumirQuestao(item.questao)}” saiu dos guardados.` };
      } catch (e) {
        // desfaz só este item (outra ação pode ter mudado a lista enquanto isso)
        definirDados((lista) => (lista ? (guardadas && !guardar ? reinserir(lista, item) : lista.map((x) => (x.id === item.id ? { ...x, guardada: item.guardada } : x))) : lista));
        const erro = comoErroDaApi(e);
        return {
          ok: false,
          mensagem: `Não consegui ${guardar ? "guardar" : "remover dos guardados"}: ${erro.tipo === "indisponivel" ? "a API não respondeu" : erro.message}. Nada mudou.`,
        };
      } finally {
        marcar(item.id, false);
      }
    },
    [definirDados, guardadas, marcar],
  );

  const excluir = useCallback(
    async (item: ResumoDeInvestigacao): Promise<ResultadoDaAcao> => {
      definirDados((lista) => (lista ? lista.filter((x) => x.id !== item.id) : lista));
      marcar(item.id, true);
      try {
        await excluirInvestigacao(item.id);
        return { ok: true, mensagem: `Análise excluída: “${resumirQuestao(item.questao)}”.` };
      } catch (e) {
        const erro = comoErroDaApi(e);
        if (erro.tipo === "nao_encontrado") return { ok: true, mensagem: "Essa análise já tinha sido excluída." };
        definirDados((lista) => (lista ? reinserir(lista, item) : lista));
        const motivo =
          erro.tipo === "conflito"
            ? "ela ainda está em execução, e só pode ser excluída depois de terminar"
            : erro.tipo === "indisponivel"
              ? "a API não respondeu"
              : erro.message;
        return { ok: false, mensagem: `Não consegui excluir: ${motivo}. A análise continua no histórico.` };
      } finally {
        marcar(item.id, false);
      }
    },
    [definirDados, marcar],
  );

  const grupos = useMemo(() => (recurso.dados ? agruparPorDia(recurso.dados) : []), [recurso.dados]);

  return {
    itens: recurso.dados,
    grupos,
    carregando: recurso.carregando,
    atualizando: recurso.atualizando,
    erro: recurso.erro,
    recarregar: recurso.recarregar,
    pendentes,
    alternarGuardada,
    excluir,
  };
}
