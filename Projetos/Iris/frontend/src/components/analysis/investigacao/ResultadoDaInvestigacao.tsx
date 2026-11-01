/**
 * Resultado de uma investigação: cabeçalho, abas e as áreas (análise, relações, linha do tempo, leitura) sobre um
 * único estado compartilhado (ProvedorDoResultado). Quem carrega a investigação é a página (pages/Analise).
 */
import { ArrowLeft } from "lucide-react";
import { useDeferredValue } from "react";
import { Link } from "react-router";
import { ROTAS } from "../../../config/rotas";
import type { ResultadoDeInvestigacao } from "../../../types/investigacao";
import { AreaDeAnalise } from "../AreaDeAnalise";
import { AreaDaTimeline } from "../../timeline/AreaDaTimeline";
import { MapaGeopolitico } from "../../relations/MapaGeopolitico";
import { type Aba, ProvedorDoResultado, useResultado } from "./contexto";
import { BarraDeAbas } from "./BarraDeAbas";
import { CabecalhoDaInvestigacao } from "./CabecalhoDaInvestigacao";
import { PainelContextual } from "./PainelContextual";

/**
 * Área Relações: o mapa ocupa a altura útil da janela (descontados o topo da plataforma, o
 * cabeçalho compacto e a barra de áreas). O mapa traz o seu próprio painel flutuante, então o
 * painel lateral da página não é montado aqui (evita dois painéis com o mesmo conteúdo).
 */
function AreaDeRelacoes() {
  return (
    <div className="h-[max(560px,calc(100dvh-var(--altura-topo,0px)-9rem))] lg:h-[max(600px,calc(100dvh-var(--altura-topo,0px)-11rem))]">
      <MapaGeopolitico />
    </div>
  );
}

function Conteudo({ fontesAbertas }: { fontesAbertas: boolean }) {
  const { aba: abaEscolhida, selecao } = useResultado();
  // A barra de abas responde na hora; a área nova (mapa, timeline, leitura) renderiza em segundo plano, em fatias,
  // sem prender o clique numa tarefa longa. Enquanto isso, a área anterior continua na tela.
  const aba = useDeferredValue(abaEscolhida);
  // O painel lateral é fixo à direita no desktop: abre espaço no conteúdo para não cobri-lo.
  const painelLateral = aba !== "relacoes";

  return (
    // Mapa e timeline marcam a página como "ampla": a coluna se abre de 1200 para 1600 px (CSS
    // .coluna-pagina). A análise fica na largura de leitura. O painel lateral (400 px) abre espaço
    // à direita no desktop para não cobrir o conteúdo.
    <article
      data-largura={aba === "analise" ? undefined : "ampla"}
      className={`flex flex-col gap-6 transition-[margin] duration-300 ${selecao && painelLateral ? "lg:mr-[400px] print:mr-0" : ""}`}
    >
      <Link to={ROTAS.investigacoes} className="inline-flex w-fit items-center gap-1.5 text-legenda text-texto-2 hover:text-texto print:hidden">
        <ArrowLeft size={14} aria-hidden="true" />
        Investigações
      </Link>

      <CabecalhoDaInvestigacao />
      <BarraDeAbas />

      <div id="painel-aba" role="tabpanel" aria-labelledby={`aba-${aba}`} className="flex min-w-0 flex-col">
        {aba === "analise" && <AreaDeAnalise fontesAbertas={fontesAbertas} />}
        {aba === "relacoes" && <AreaDeRelacoes />}
        {aba === "timeline" && <AreaDaTimeline />}
      </div>

      {painelLateral && <PainelContextual />}
    </article>
  );
}

/**
 * Resultado de uma investigação. Um único provedor de estado envolve as quatro áreas: trocar de
 * área não desmonta o estado (cenário em vista, seleção), só o conteúdo da área.
 */
export function ResultadoDaInvestigacao({
  r,
  abaInicial,
  fontesAbertas = false,
  aoTrocarAba,
}: {
  r: ResultadoDeInvestigacao;
  abaInicial?: Aba;
  fontesAbertas?: boolean;
  aoTrocarAba?: (a: Aba) => void;
}) {
  return (
    <ProvedorDoResultado r={r} abaInicial={abaInicial} aoTrocarAba={aoTrocarAba}>
      <Conteudo fontesAbertas={fontesAbertas} />
    </ProvedorDoResultado>
  );
}
