/**
 * A experiência principal da Iris: uma investigação conduzida por conversa.
 *
 * Sem `id`, é uma conversa nova (boas-vindas + campo); a primeira pergunta cria a conversa e leva ao endereço dela.
 * Com `id`, mostra o fio de perguntas e respostas e mantém o campo no pé da tela, com sugestões para aprofundar a
 * investigação já aberta. O processamento vive no motor (motor.ts), fora daqui.
 */
import { MessageSquarePlus } from "lucide-react";
import { lazy, Suspense, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { EstadoVazio } from "../../../components/feedback/EstadoVazio";
import { ROTAS } from "../../../config/rotas";
import { SUGESTOES } from "../complementos";
import { useConversa } from "../historico";
import { continuarConversa, iniciarConversa, interromper, useEtapas } from "../motor";
import { BoasVindas } from "./BoasVindas";
import { CampoDePergunta } from "./CampoDePergunta";
import { LinhasEsqueleto } from "../../../components/ui/Carregando";
import type { Horizonte } from "../../../hooks/useArmazenamentoLocal";

// A resposta (análise, cenários, mapa, painel) só carrega quando há uma conversa: as boas-vindas ficam leves.
const Turno = lazy(() => import("./Turno").then((m) => ({ default: m.Turno })));

export function Conversa({ id }: { id?: string }) {
  const conversa = useConversa(id);
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const ultimo = conversa?.turnos.at(-1);
  const { processando } = useEtapas(ultimo?.id ?? "");
  const lista = useRef<HTMLOListElement>(null);
  const quantos = conversa?.turnos.length ?? 0;

  // Pergunta nova: o turno dela sobe para o topo da tela (a resposta cresce para baixo).
  const anterior = useRef(quantos);
  useEffect(() => {
    if (quantos > anterior.current) {
      const el = lista.current?.lastElementChild as HTMLElement | null;
      const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;
      el?.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "start" });
    }
    anterior.current = quantos;
  }, [quantos]);

  if (id && !conversa)
    return (
      <EstadoVazio
        icone={<MessageSquarePlus size={22} strokeWidth={1.5} aria-hidden="true" />}
        titulo="Conversa não encontrada"
        acao={
          <Link to={ROTAS.inicio} className="botao botao-secundario botao-pequeno">
            Nova investigação
          </Link>
        }
      >
        O histórico das conversas fica neste navegador. Ela pode ter sido apagada ou aberta em outro aparelho.
      </EstadoVazio>
    );

  const enviar = (texto: string, horizonte?: Horizonte) => {
    if (!conversa) navegar(ROTAS.conversa(iniciarConversa(texto, horizonte)));
    else continuarConversa(conversa.id, texto);
  };
  const respondida = ultimo && !processando && (ultimo.resposta.tipo === "analise" || ultimo.resposta.tipo === "complemento");
  const campo = (
    <CampoDePergunta aoEnviar={enviar} ocupado={processando} aoInterromper={ultimo ? () => interromper(ultimo.id) : undefined} continuacao={!!conversa?.investigacaoId} escolherHorizonte={!conversa} autoFoco={!conversa} inicial={conversa ? "" : (params.get("pergunta")?.slice(0, 600) ?? "")} />
  );

  if (!conversa)
    return (
      <div className="mx-auto w-full max-w-[46rem] pt-2 pb-10 lg:pt-12">
        <BoasVindas campo={campo} />
      </div>
    );

  return (
    <div className="conversa mx-auto flex w-full max-w-[64rem] flex-col">
      <Suspense fallback={<LinhasEsqueleto linhas={4} />}>
        <ol ref={lista} aria-label="Conversa" className="m-0 flex list-none flex-col gap-16 p-0 pb-10">
          {conversa.turnos.map((t, i) => (
            // o último turno tem altura para a pergunta nova subir até o topo, mesmo antes de a resposta crescer
            <li key={t.id} className="scroll-mt-[calc(var(--altura-topo,0px)+1.5rem)] last:min-h-[calc(100dvh-var(--altura-topo,0px)-14rem)]">
              <Turno conversaId={conversa.id} turno={t} complementar={i > 0 && !!conversa.investigacaoId} horizonte={i === 0 ? conversa.horizonte : undefined} />
            </li>
          ))}
        </ol>
      </Suspense>

      <div className="campo-fixo sticky bottom-0 z-20 -mx-4 mt-auto px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] sm:-mx-2 sm:px-2 lg:-mx-6 lg:px-6">
        <div className="flex max-w-[46rem] flex-col gap-3">
          {respondida && (
            <ul aria-label="Aprofundar a investigação" className="m-0 flex list-none gap-2 overflow-x-auto p-0 pr-8 pb-1 [mask-image:linear-gradient(to_right,#000_88%,transparent)] [scrollbar-width:none]">
              {SUGESTOES.map((s) => (
                <li key={s.intencao} className="shrink-0">
                  <button type="button" onClick={() => enviar(s.texto)} className="sugestao rounded-full border border-linha bg-abismo px-3 py-1.5 text-legenda text-texto-2 transition-colors duration-150 hover:border-linha-forte hover:text-texto">
                    {s.texto}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {campo}
        </div>
      </div>
    </div>
  );
}
