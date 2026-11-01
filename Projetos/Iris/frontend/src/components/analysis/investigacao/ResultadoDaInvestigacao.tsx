/**
 * Resultado de uma investigação: cabeçalho, índice fixo das cinco seções e as seções (AreaDeAnalise), sobre um único
 * estado compartilhado (ProvedorDoResultado), com o painel contextual ao lado. Quem carrega a investigação é a página
 * (pages/Analysis/PaginaAnalise).
 */
import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { PREVIA } from "../../../config/env";
import { ROTAS } from "../../../config/rotas";
import { MONITORAMENTO_DEMONSTRACAO } from "../../../previa/monitoramento-demonstracao";
import type { ResultadoDeInvestigacao } from "../../../types/investigacao";
import { AreaDeAnalise } from "../AreaDeAnalise";
import { type Aba, ProvedorDoResultado, useResultado } from "./contexto";
import { CabecalhoDaInvestigacao } from "./CabecalhoDaInvestigacao";
import { IndiceDaInvestigacao, VoltarAoTopo } from "./IndiceDaInvestigacao";
import { PainelContextual } from "./PainelContextual";

function Conteudo({ demonstracao }: { demonstracao?: { ativa: boolean; alternar: () => void } }) {
  const { selecao } = useResultado();
  return (
    // A página fica na largura de leitura (coluna editorial). O painel lateral (400 px) abre espaço à direita no
    // desktop para não cobrir o conteúdo; no celular é uma folha inferior.
    <article className={`flex flex-col gap-6 transition-[margin] duration-300 ${selecao ? "lg:mr-[400px] print:mr-0" : ""}`}>
      <Link to={ROTAS.investigacoes} className="inline-flex w-fit items-center gap-1.5 text-legenda text-texto-2 hover:text-texto print:hidden">
        <ArrowLeft size={14} aria-hidden="true" />
        Investigações
      </Link>

      <CabecalhoDaInvestigacao />
      <IndiceDaInvestigacao />
      <AreaDeAnalise demonstracao={demonstracao} />

      <PainelContextual />
      <VoltarAoTopo />
    </article>
  );
}

/**
 * Resultado de uma investigação. Um único provedor de estado envolve as cinco seções: trocar a vista da seção 05 ou
 * abrir o painel não desmonta o estado (cenário em vista, seleção).
 *
 * Demonstração do monitoramento: só na prévia e em desenvolvimento, e só quando a investigação não traz
 * monitoramento próprio. Ligada, o resultado passa a carregar MONITORAMENTO_DEMONSTRACAO (fictício e marcado como
 * tal em cada item); desligada, volta ao resultado como veio. Nada disso é salvo.
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
  const podeDemonstrar = (PREVIA || import.meta.env.DEV) && !r.monitoramento;
  const [demonstrando, setDemonstrando] = useState(false);
  const resultado = useMemo(() => (podeDemonstrar && demonstrando ? { ...r, monitoramento: MONITORAMENTO_DEMONSTRACAO } : r), [r, podeDemonstrar, demonstrando]);
  const demonstracao = podeDemonstrar ? { ativa: demonstrando, alternar: () => setDemonstrando((v) => !v) } : undefined;
  return (
    <ProvedorDoResultado r={resultado} abaInicial={abaInicial} aoTrocarAba={aoTrocarAba}>
      <Conteudo demonstracao={demonstracao} />
    </ProvedorDoResultado>
  );
}
