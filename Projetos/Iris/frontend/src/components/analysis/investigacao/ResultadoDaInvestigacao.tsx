/**
 * Resultado de uma investigação: cabeçalho, índice fixo das seções e as seções (AreaDeAnalise), sobre um único
 * estado compartilhado (ProvedorDoResultado), com o painel contextual ao lado. Quem carrega a investigação é a página
 * (pages/Analysis/PaginaAnalise).
 */
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { ROTAS } from "../../../config/rotas";
import type { ResultadoDeInvestigacao } from "../../../types/investigacao";
import { AreaDeAnalise } from "../AreaDeAnalise";
import { type Aba, ProvedorDoResultado, useResultado } from "./contexto";
import { CabecalhoDaInvestigacao } from "./CabecalhoDaInvestigacao";
import { IndiceDaInvestigacao, VoltarAoTopo } from "./IndiceDaInvestigacao";
import { PainelContextual } from "./PainelContextual";

function Conteudo() {
  const { selecao } = useResultado();
  return (
    // A página fica na largura de leitura (coluna editorial). O painel lateral (400 px) abre espaço à direita no
    // desktop para não cobrir o conteúdo; no celular é uma folha inferior.
    <article className={`flex flex-col gap-8 transition-[margin] duration-300 ${selecao ? "lg:mr-[400px] print:mr-0" : ""}`}>
      <Link to={ROTAS.investigacoes} className="inline-flex w-fit items-center gap-1.5 text-legenda text-texto-2 hover:text-texto print:hidden">
        <ArrowLeft size={14} aria-hidden="true" />
        Investigações
      </Link>

      <CabecalhoDaInvestigacao />
      <IndiceDaInvestigacao />
      <AreaDeAnalise />

      <PainelContextual />
      <VoltarAoTopo />
    </article>
  );
}

/**
 * Resultado de uma investigação. Um único provedor de estado envolve as seções: trocar a vista da exploração ou abrir
 * o painel não desmonta o estado (cenário em vista, seleção). A demonstração do monitoramento com dados fictícios volta
 * junto com a seção de monitoramento, numa próxima parte.
 */
export function ResultadoDaInvestigacao({
  r,
  abaInicial,
  aoTrocarAba,
}: {
  r: ResultadoDeInvestigacao;
  abaInicial?: Aba | null;
  aoTrocarAba?: (a: Aba) => void;
}) {
  return (
    <ProvedorDoResultado r={r} abaInicial={abaInicial} aoTrocarAba={aoTrocarAba}>
      <Conteudo />
    </ProvedorDoResultado>
  );
}
