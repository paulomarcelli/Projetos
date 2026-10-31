/**
 * Página de uma investigação (`/app/investigacoes/:id?area=`). Carrega a investigação (features/investigacao/hooks/useInvestigacao) e entrega
 * o resultado ao componente da feature, que compõe cabeçalho, abas e áreas.
 */
import { ScanSearch } from "lucide-react";
import { useCallback } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { EstadoVazio } from "../../components/common/EstadoVazio";
import { LinhasEsqueleto } from "../../components/common/Carregando";
import { ROTAS } from "../../config/rotas";
import { ResultadoDaInvestigacao } from "../../components/analysis/investigacao/ResultadoDaInvestigacao";
import { type Aba, abaDoEndereco } from "../../components/analysis/investigacao/contexto";
import { useInvestigacao } from "../../components/analysis/investigacao/hooks/useInvestigacao";

/**
 * A área aberta fica no endereço (`?area=relacoes`), para que links e o botão "voltar" do
 * navegador levem à área certa. `replace` evita encher o histórico a cada troca de aba.
 */
export function PaginaAnalise() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const estado = useInvestigacao(id);
  const area = params.get("area");
  const aoTrocarAba = useCallback(
    (a: Aba) =>
      setParams(
        (p) => {
          const novo = new URLSearchParams(p);
          if (a === "analise") novo.delete("area");
          else novo.set("area", a);
          return novo;
        },
        { replace: true },
      ),
    [setParams],
  );
  if (estado.tipo === "carregando") return <LinhasEsqueleto linhas={6} />;
  // `?area=evidencias` (endereço antigo) abre a análise já com as fontes expandidas.
  if (estado.tipo === "pronto")
    return <ResultadoDaInvestigacao r={estado.r} abaInicial={abaDoEndereco(area)} fontesAbertas={area === "evidencias"} aoTrocarAba={aoTrocarAba} />;
  return (
    <EstadoVazio
      icone={<ScanSearch size={22} strokeWidth={1.5} aria-hidden="true" />}
      titulo="Investigação não encontrada"
      marcador={{ tipo: "limitacao", rotulo: "Motor de investigação ainda não implementado" }}
      acao={
        <Link to={ROTAS.investigacoes} className="botao botao-secundario botao-pequeno">
          Voltar às investigações
        </Link>
      }
    >
      Ainda não há investigações processadas. Quando o motor existir, cada resultado terá um endereço próprio como este.
    </EstadoVazio>
  );
}

export default PaginaAnalise;
