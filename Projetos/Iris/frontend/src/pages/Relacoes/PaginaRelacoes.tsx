import { Waypoints } from "lucide-react";
import { Link, Navigate, useParams } from "react-router";
import { EstadoVazio } from "../../components/feedback/EstadoVazio";
import { LinhasEsqueleto } from "../../components/ui/Carregando";
import { ROTAS } from "../../config/rotas";
import { useInvestigacao } from "../../features/investigacao/hooks/useInvestigacao";

/**
 * `/app/relacoes/:id?` continua válido (links antigos e favoritos): leva ao endereço canônico
 * `/app/investigacoes/:id?area=relacoes`. Sem id, usa a investigação principal.
 */
export function PaginaRelacoes() {
  const { id } = useParams();
  const estado = useInvestigacao(id);
  if (estado.tipo === "carregando") return <LinhasEsqueleto linhas={6} />;
  if (estado.tipo === "pronto") return <Navigate to={`${ROTAS.investigacao(estado.r.id)}?area=relacoes`} replace />;
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
