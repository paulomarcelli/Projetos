import { ArrowRight, Waypoints } from "lucide-react";
import { Link, useParams } from "react-router";
import { EstadoVazio, LinhasEsqueleto } from "../components/Estados";
import { ProvedorDoResultado } from "../components/resultado/contexto";
import { MapaGeopolitico } from "../components/resultado/MapaGeopolitico";
import type { ResultadoDeInvestigacao } from "../lib/investigacao";
import { ROTAS } from "../lib/rotas";
import { useInvestigacao } from "./ResultadoInvestigacao";

/**
 * Seção Relações: o mapa geopolítico como protagonista. Cabeçalho mínimo; o resto da tela é mapa.
 * Sem id na URL, abre a investigação principal.
 */
export function Relacoes({ r }: { r: ResultadoDeInvestigacao }) {
  return (
    <ProvedorDoResultado r={r}>
      <div className="flex h-[max(560px,calc(100dvh-var(--altura-topo,0px)-3.5rem))] flex-col gap-3 lg:h-[max(600px,calc(100dvh-var(--altura-topo,0px)-5.5rem))]">
        <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <p className="rotulo">Relações · cenários da mesma investigação</p>
            <h1 className="truncate font-editorial text-leitura text-texto sm:text-secao" title={r.pergunta}>
              {r.pergunta}
            </h1>
          </div>
          <Link to={ROTAS.investigacao(r.id)} className="inline-flex shrink-0 items-center gap-1 text-legenda text-ciano-texto hover:underline">
            Abrir a investigação <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </header>
        <div className="min-h-0 flex-1">
          <MapaGeopolitico />
        </div>
      </div>
    </ProvedorDoResultado>
  );
}

export function PaginaRelacoes() {
  const { id } = useParams();
  const estado = useInvestigacao(id);
  if (estado.tipo === "carregando") return <LinhasEsqueleto linhas={6} />;
  if (estado.tipo === "pronto") return <Relacoes r={estado.r} />;
  return (
    <EstadoVazio
      icone={<Waypoints size={22} strokeWidth={1.5} aria-hidden="true" />}
      titulo="Nenhuma investigação com relações"
      marcador={{ tipo: "limitacao", rotulo: "Motor de investigação ainda não implementado" }}
      acao={
        <Link to={ROTAS.investigacoes} className="botao botao-secundario botao-pequeno">
          Ir para Investigações
        </Link>
      }
    >
      O mapa mostra as relações entre países de uma investigação processada, em cada cenário. Ainda não há investigações processadas.
    </EstadoVazio>
  );
}

export default PaginaRelacoes;
