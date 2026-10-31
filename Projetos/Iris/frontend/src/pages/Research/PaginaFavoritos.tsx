import { Star } from "lucide-react";
import { Link } from "react-router";
import { ListaDeDocumentos } from "../../components/research/base-cientifica/ListaDeDocumentos";
import { ErroDeCarregamento } from "../../components/common/ErroDeCarregamento";
import { EstadoVazio } from "../../components/common/EstadoVazio";
import { CabecalhoDePagina } from "../../components/layout/CabecalhoDePagina";
import { useFavoritos } from "../../hooks/useArmazenamentoLocal";
import { useDados } from "../../hooks/useDados";
import { ROTAS } from "../../config/rotas";
import { obterDocumento } from "../../services/api";
import { type DocumentoDetalhe } from "../../types/api";

async function carregarFavoritos(ids: string[]): Promise<{ achados: DocumentoDetalhe[]; perdidos: string[] }> {
  const resultados = await Promise.allSettled(ids.map((id) => obterDocumento(id)));
  const achados: DocumentoDetalhe[] = [];
  const perdidos: string[] = [];
  resultados.forEach((r, i) => {
    if (r.status === "fulfilled") achados.push(r.value);
    else if ((r.reason as { status?: number })?.status === 404) perdidos.push(ids[i]);
    else throw r.reason;
  });
  return { achados, perdidos };
}

export function PaginaFavoritos() {
  const { favoritos, remover } = useFavoritos();
  const chave = favoritos.join(",");
  const dados = useDados(() => carregarFavoritos(favoritos), [chave]);
  const perdidos = dados.dados?.perdidos ?? [];
  return (
    <div>
      <CabecalhoDePagina rotulo="Pessoal" titulo="Favoritos">
        Fontes marcadas com a estrela. Os favoritos ficam salvos neste navegador.
      </CabecalhoDePagina>
      {favoritos.length === 0 ? (
        <EstadoVazio icone={<Star size={22} strokeWidth={1.5} aria-hidden="true" />} titulo="Nenhum favorito ainda">
          Marque a estrela ao lado de uma fonte para encontrá-la aqui.{" "}
          <Link to={ROTAS.base} className="text-ciano-texto hover:underline">
            Ir para a Base científica
          </Link>
        </EstadoVazio>
      ) : dados.tipo === "erro" ? (
        <ErroDeCarregamento erro={dados.erro} aoTentarDeNovo={dados.recarregar} />
      ) : (
        <div className="flex flex-col gap-4">
          {perdidos.length > 0 && (
            <p className="flex flex-wrap items-center gap-3 text-legenda text-texto-2">
              {perdidos.length === 1 ? "1 favorito não existe mais no acervo." : `${perdidos.length} favoritos não existem mais no acervo.`}
              <button type="button" className="botao botao-secundario botao-pequeno" onClick={() => perdidos.forEach(remover)}>
                Limpar
              </button>
            </p>
          )}
          <ListaDeDocumentos itens={dados.dados?.achados ?? []} carregando={dados.tipo === "carregando"} />
        </div>
      )}
    </div>
  );
}
