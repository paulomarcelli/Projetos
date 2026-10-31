/**
 * "Minhas investigações": a lista pessoal do menu lateral e da página /app/investigacoes.
 *
 * Fontes reais, nesta ordem de existência:
 * - investigações processadas: ainda não há API (o motor não existe). Na PRÉVIA, o exemplo
 *   ilustrativo entra aqui, carregado sob demanda (não vai para o build normal);
 * - conversas com a Iris, neste navegador (features/conversa/historico.ts);
 * - rascunhos: perguntas salvas neste navegador (hooks/useArmazenamentoLocal.ts).
 * Cada item tem só o necessário para reconhecer e abrir: título (a pergunta), data e destino.
 * Quando a API de investigações existir, ela substitui o carregamento do exemplo neste arquivo.
 */
import { useEffect, useMemo, useState } from "react";
import { useRascunhos } from "../../../../hooks/useArmazenamentoLocal";
import { ROTAS } from "../../../../config/rotas";
import { useConversas } from "../../../analysis/conversa/historico";

export interface ItemInvestigacao {
  id: string;
  titulo: string;
  /** ISO 8601 (data da última atualização). */
  data: string;
  tipo: "resultado" | "conversa" | "rascunho";
  para: string;
}

// Condição escrita aqui (e não via PREVIA) para o build normal descartar o exemplo.
const carregarExemplo = import.meta.env.MODE === "previa" ? () => import("../../../../previa/investigacao-exemplo") : null;

export function useMinhasInvestigacoes(): ItemInvestigacao[] {
  const { rascunhos } = useRascunhos();
  const conversas = useConversas();
  const [processadas, setProcessadas] = useState<ItemInvestigacao[]>([]);

  useEffect(() => {
    if (!carregarExemplo) return;
    let vivo = true;
    carregarExemplo().then(({ INVESTIGACAO_EXEMPLO: r }) => {
      if (vivo) setProcessadas([{ id: r.id, titulo: r.pergunta, data: r.atualizadoEm, tipo: "resultado", para: ROTAS.investigacao(r.id) }]);
    });
    return () => {
      vivo = false;
    };
  }, []);

  return useMemo(
    () =>
      [
        ...processadas,
        ...conversas.map((c): ItemInvestigacao => ({ id: c.id, titulo: c.titulo, data: c.atualizadaEm, tipo: "conversa", para: ROTAS.conversa(c.id) })),
        ...rascunhos.map((x): ItemInvestigacao => ({ id: x.id, titulo: x.pergunta, data: x.atualizadoEm, tipo: "rascunho", para: ROTAS.rascunho(x.id) })),
      ].sort((a, b) => b.data.localeCompare(a.data)),
    [processadas, conversas, rascunhos],
  );
}

const MESMO_ANO = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" });
const OUTRO_ANO = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric" });

/** "27 de out." no ano corrente; "27 de out. de 2025" nos outros. */
export function dataCurta(iso: string) {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return (d.getFullYear() === new Date().getFullYear() ? MESMO_ANO : OUTRO_ANO).format(d);
}
