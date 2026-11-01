/**
 * Página da Análise do Cenário (`/app/investigacoes/:id/cenarios/:cenario`): o segundo nível da investigação. Carrega
 * a mesma investigação da análise principal e entrega um cenário dela ao componente da feature; o painel contextual
 * (atores, evidências, método) continua disponível, como na análise principal.
 */
import { ScanSearch } from "lucide-react";
import { Link, useParams } from "react-router";
import { AnaliseDoCenario } from "../../components/analysis/cenario/AnaliseDoCenario";
import { EstadoVazio } from "../../components/common/EstadoVazio";
import { LinhasEsqueleto } from "../../components/common/Carregando";
import { ProvedorDoResultado, useResultado } from "../../components/analysis/investigacao/contexto";
import { useInvestigacao } from "../../components/analysis/investigacao/hooks/useInvestigacao";
import { PainelContextual } from "../../components/analysis/investigacao/PainelContextual";
import { ROTAS } from "../../config/rotas";
import type { CenarioId } from "../../types/cenario";

/** Abre espaço à direita quando o painel lateral está aberto, como na análise principal. */
function Moldura({ id }: { id: CenarioId }) {
  const { selecao } = useResultado();
  return (
    <div className={`transition-[margin] duration-300 ${selecao ? "lg:mr-[400px] print:mr-0" : ""}`}>
      <AnaliseDoCenario id={id} />
      <PainelContextual />
    </div>
  );
}

export function PaginaCenario() {
  const { id = "", cenario = "" } = useParams();
  const estado = useInvestigacao(id);
  if (estado.tipo === "carregando") return <LinhasEsqueleto linhas={6} />;
  const c = estado.tipo === "pronto" ? estado.r.cenarios.find((x) => x.id === cenario.toUpperCase()) : undefined;
  if (estado.tipo === "pronto" && c)
    return (
      <ProvedorDoResultado r={estado.r}>
        <Moldura id={c.id} />
      </ProvedorDoResultado>
    );
  return (
    <EstadoVazio
      icone={<ScanSearch size={22} strokeWidth={1.5} aria-hidden="true" />}
      titulo="Cenário não encontrado"
      acao={
        <Link to={estado.tipo === "pronto" ? ROTAS.investigacao(id) : ROTAS.investigacoes} className="botao botao-secundario botao-pequeno">
          {estado.tipo === "pronto" ? "Voltar à investigação" : "Voltar às investigações"}
        </Link>
      }
    >
      Este endereço não corresponde a um cenário desta investigação.
    </EstadoVazio>
  );
}

export default PaginaCenario;
