import { ArrowRight, Pencil, ScanSearch, Trash2 } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { Link } from "react-router";
import { NOME_REGIAO, type RegiaoId } from "../../relacoes/geo/regioes-def";
import { quando } from "../../../utils/data";
import { useRascunhos, type Rascunho } from "../../../hooks/useArmazenamentoLocal";
import { Epistemico } from "../../../components/ui/Epistemico";
import { EstadoVazio } from "../../../components/feedback/EstadoVazio";
import { ROTAS } from "../../../config/rotas";
import { ListaDeConversas } from "../../conversa/components/ListaDeConversas";

// Condição escrita aqui (e não via PREVIA) para o build normal descartar o exemplo.
const CartaoExemplo = import.meta.env.MODE === "previa" ? lazy(() => import("../../../previa/CartaoExemplo")) : null;

function LinhaRascunho({ r }: { r: Rascunho }) {
  const { remover } = useRascunhos();
  const [confirmando, setConfirmando] = useState(false);
  const fim = new Date(r.criadoEm).getFullYear() + r.horizonte;
  const escopo = r.regioes.length === 0 ? "Global" : r.regioes.map((x) => NOME_REGIAO[x as RegiaoId] ?? x).join(", ");
  return (
    <li className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <div className="min-w-0">
        <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Epistemico tipo="hipotese" rotulo="Rascunho · não processado" />
          <span className="text-micro text-texto-3">atualizado {quando(r.atualizadoEm)}</span>
        </div>
        <p className="line-clamp-2 font-editorial text-leitura text-texto [overflow-wrap:anywhere]">{r.pergunta}</p>
        <p className="mt-1 text-legenda text-texto-2">
          Horizonte <span className="numeros text-ambar">{fim}</span> · <span className="[overflow-wrap:anywhere]">{escopo}</span>
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        {confirmando ? (
          <>
            <button type="button" className="botao botao-perigo botao-pequeno" onClick={() => remover(r.id)}>
              Excluir rascunho
            </button>
            <button type="button" className="botao botao-fantasma botao-pequeno" onClick={() => setConfirmando(false)}>
              Cancelar
            </button>
          </>
        ) : (
          <>
            <Link to={ROTAS.rascunho(r.id)} className="botao botao-secundario botao-pequeno">
              <Pencil size={14} aria-hidden="true" />
              Editar
            </Link>
            <button type="button" className="botao botao-fantasma botao-pequeno px-2" aria-label="Excluir rascunho" onClick={() => setConfirmando(true)}>
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </li>
  );
}

/**
 * Investigações: não há API de investigações, então a lista de processadas está sempre vazia
 * (e diz por quê). Rascunhos são reais, mas só existem neste navegador.
 */
export function InvestigacoesRecentes({ limite }: { limite?: number }) {
  const { rascunhos } = useRascunhos();
  const visiveis = limite ? rascunhos.slice(0, limite) : rascunhos;
  return (
    <div className="flex flex-col gap-6">
      <ListaDeConversas />
      {CartaoExemplo && (
        <Suspense fallback={null}>
          <CartaoExemplo />
        </Suspense>
      )}
      <EstadoVazio
        icone={<ScanSearch size={22} strokeWidth={1.5} aria-hidden="true" />}
        titulo="Nenhuma investigação processada"
        marcador={{ tipo: "limitacao", rotulo: "Motor de investigação ainda não implementado" }}
      >
        Quando o motor existir, cada investigação aparece aqui com a questão central, o horizonte,
        o estado do processamento, a data da última atualização e o acesso aos resultados.
      </EstadoVazio>

      {rascunhos.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between gap-3 border-b border-linha pb-2">
            <p className="rotulo">Rascunhos neste navegador</p>
            {limite && rascunhos.length > limite && (
              <Link to={ROTAS.investigacoes} className="inline-flex items-center gap-1 text-legenda text-ciano-texto hover:underline">
                Ver todos ({rascunhos.length})
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            )}
          </div>
          <ul className="divide-y divide-linha">
            {visiveis.map((r) => (
              <LinhaRascunho key={r.id} r={r} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
