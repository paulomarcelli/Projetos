/** As conversas deste navegador, no histórico de análises: abrir, ou apagar com confirmação. */
import { MessagesSquare, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { ROTAS } from "../../../config/rotas";
import type { Conversa } from "../../../types/conversa";
import { dataCurta } from "../../research/historico/hooks/useMinhasInvestigacoes";
import { removerConversa, useConversas } from "./historico";

export function ListaDeConversas() {
  const conversas = useConversas();
  if (!conversas.length) return null;
  return (
    <section aria-labelledby="t-conversas">
      <div className="flex items-baseline justify-between gap-3 border-b border-linha pb-2">
        <h2 id="t-conversas" className="rotulo">
          Conversas neste navegador
        </h2>
        <span className="text-micro text-texto-3">{conversas.length}</span>
      </div>
      <ul className="m-0 list-none divide-y divide-linha p-0">
        {conversas.map((c) => (
          <LinhaConversa key={c.id} c={c} />
        ))}
      </ul>
    </section>
  );
}

function LinhaConversa({ c }: { c: Conversa }) {
  const [confirmando, setConfirmando] = useState(false);
  const perguntas = c.turnos.length;
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
      <Link to={ROTAS.conversa(c.id)} className="group flex min-w-0 flex-1 items-start gap-3">
        <MessagesSquare size={16} aria-hidden="true" className="mt-1 shrink-0 text-texto-3 group-hover:text-ouro" />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="line-clamp-2 text-corpo text-texto group-hover:underline group-hover:underline-offset-4">{c.titulo}</span>
          <span className="text-micro text-texto-3">
            {dataCurta(c.atualizadaEm)} · {perguntas} {perguntas === 1 ? "pergunta" : "perguntas"}
          </span>
        </span>
      </Link>
      {confirmando ? (
        <span className="flex items-center gap-2 pl-7 sm:pl-0">
          <button type="button" className="botao botao-perigo botao-pequeno" onClick={() => removerConversa(c.id)}>
            Apagar
          </button>
          <button type="button" className="botao botao-fantasma botao-pequeno" onClick={() => setConfirmando(false)}>
            Cancelar
          </button>
        </span>
      ) : (
        <button type="button" aria-label={`Apagar a conversa: ${c.titulo}`} className="botao botao-fantasma botao-pequeno ml-7 w-fit px-2 sm:ml-0" onClick={() => setConfirmando(true)}>
          <Trash2 size={15} aria-hidden="true" />
        </button>
      )}
    </li>
  );
}
