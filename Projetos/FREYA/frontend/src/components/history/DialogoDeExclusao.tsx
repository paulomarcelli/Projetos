import { useState } from "react";
import { estaEmAndamento } from "../../services";
import type { EstadoInvestigacao } from "../../types/api";
import { Botao, Dialogo } from "../ui";

export interface DialogoDeExclusaoProps {
  alvo: { id: string; questao: string; estado: EstadoInvestigacao; atualizada_em?: string } | null;
  aoFechar: () => void;
  /** devolve a mensagem de erro (ou null quando deu certo) */
  aoConfirmar: () => Promise<string | null>;
}

const ABANDONO = 15 * 60 * 1000;

/** Confirmação de exclusão. Em execução, a API recusa (409): o diálogo explica em vez de tentar. */
export function DialogoDeExclusao({ alvo, aoFechar, aoConfirmar }: DialogoDeExclusaoProps) {
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // presa num estado intermediário há mais de 15 min = abandonada (o backend deixa excluir)
  const abandonada = !!alvo?.atualizada_em && Date.now() - new Date(alvo.atualizada_em).getTime() > ABANDONO;
  const andamento = alvo ? estaEmAndamento(alvo.estado) && !abandonada : false;

  const fechar = () => {
    if (excluindo) return;
    setErro(null);
    aoFechar();
  };

  const confirmar = async () => {
    setExcluindo(true);
    setErro(null);
    const e = await aoConfirmar();
    setExcluindo(false);
    if (e) setErro(e);
    else aoFechar();
  };

  return (
    <Dialogo
      aberto={alvo !== null}
      aoFechar={fechar}
      tipo="alerta"
      titulo={andamento ? "Esta análise ainda está em execução" : "Excluir esta análise?"}
      descricao={
        andamento
          ? "A F.R.E.Y.A. não cancela uma investigação no meio. Ela poderá ser excluída assim que terminar (em geral, cerca de um minuto)."
          : "Ela sai do histórico e dos guardados, com o grafo e as evidências. Esta ação não pode ser desfeita."
      }
      acoes={
        andamento ? (
          <Botao data-autofoco onClick={fechar}>
            Entendi
          </Botao>
        ) : (
          <>
            <Botao data-autofoco onClick={fechar} disabled={excluindo}>
              Cancelar
            </Botao>
            <Botao variante="perigo" carregando={excluindo} rotuloCarregando="Excluindo" onClick={confirmar}>
              Excluir
            </Botao>
          </>
        )
      }
    >
      {alvo && (
        <div className="flex flex-col gap-3">
          <p className="rounded-xl bg-superficie-2 px-3 py-2 text-sm text-texto">“{alvo.questao}”</p>
          {erro && (
            <p role="alert" className="text-sm text-perigo">
              {erro}
            </p>
          )}
        </div>
      )}
    </Dialogo>
  );
}
