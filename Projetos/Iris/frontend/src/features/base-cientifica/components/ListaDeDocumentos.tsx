import { Star } from "lucide-react";
import { Link } from "react-router";
import type { DocumentoResumo } from "../../../types/api";
import { autores, idioma, numero, tituloDoDocumento } from "../../../utils/formatadores";
import { data, dataCompacta } from "../../../utils/data";
import { useFavoritos } from "../../../hooks/useArmazenamentoLocal";
import { Esqueleto } from "../../../components/ui/Carregando";
import { SeloStatus } from "./StatusDocumento";
import { ROTAS } from "../../../config/rotas";

const COLUNAS = "md:grid-cols-[32px_minmax(0,1fr)_64px_96px_72px_112px_96px]";

export function BotaoFavorito({ id, titulo }: { id: string; titulo: string }) {
  const { eFavorito, alternar } = useFavoritos();
  const ativo = eFavorito(id);
  return (
    <button
      type="button"
      aria-pressed={ativo}
      aria-label={ativo ? `Remover dos favoritos: ${titulo}` : `Adicionar aos favoritos: ${titulo}`}
      title={ativo ? "Remover dos favoritos" : "Favoritar (salvo neste navegador)"}
      onClick={() => alternar(id)}
      className="relative z-10 grid size-8 shrink-0 place-items-center rounded-fino text-texto-3 transition-[transform,color] duration-150 hover:text-texto active:scale-95"
    >
      <Star size={16} strokeWidth={1.6} aria-hidden="true" fill={ativo ? "var(--color-ciano)" : "none"} className={ativo ? "text-ciano" : undefined} />
    </button>
  );
}

function Linha({ d, destino }: { d: DocumentoResumo; destino: (id: string) => string }) {
  const { texto: titulo, ehNomeDeArquivo } = tituloDoDocumento(d);
  const quem = autores(d.authors, 2);
  return (
    <li className={`group relative grid grid-cols-[32px_minmax(0,1fr)] items-start gap-x-3 gap-y-1 border-b border-linha py-3.5 ${COLUNAS} md:items-center`}>
      <BotaoFavorito id={d.id} titulo={titulo} />
      <div className="min-w-0">
        <Link
          to={destino(d.id)}
          title={titulo}
          className={`line-clamp-2 text-corpo text-texto after:absolute after:inset-0 after:content-[''] group-hover:text-ciano-texto ${
            ehNomeDeArquivo ? "font-dados text-legenda [overflow-wrap:anywhere]" : "font-editorial text-[1rem]"
          }`}
        >
          {titulo}
        </Link>
        {ehNomeDeArquivo ? (
          <span className="block text-micro text-texto-3">Sem título identificado</span>
        ) : (
          quem && (
            <span className="block truncate text-legenda text-texto-2" title={d.authors?.join("; ")}>
              {quem}
            </span>
          )
        )}
        {/* No celular, os metadados vão numa linha só, abaixo do título */}
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-texto-3 md:hidden">
          <SeloStatus status={d.status} />
          {d.publication_year && <span className="numeros">{d.publication_year}</span>}
          {d.language && <span className="capitalize">{idioma(d.language)}</span>}
          {d.page_count !== null && <span className="numeros">{d.page_count === 1 ? "1 página" : `${numero(d.page_count)} páginas`}</span>}
        </span>
      </div>
      <span className="numeros hidden text-legenda text-texto-2 md:block">{d.publication_year ?? "—"}</span>
      <span className="hidden truncate text-legenda text-texto-2 capitalize md:block">{d.language ? idioma(d.language) : "—"}</span>
      <span className="numeros hidden text-right text-legenda text-texto-2 md:block">{numero(d.page_count)}</span>
      <span className="hidden md:block">
        <SeloStatus status={d.status} />
      </span>
      <span className="numeros hidden text-right text-legenda whitespace-nowrap text-texto-3 md:block" title={data(d.created_at)}>{dataCompacta(d.created_at)}</span>
    </li>
  );
}

export function ListaDeDocumentos({
  itens,
  carregando,
  destino = ROTAS.fonte,
}: {
  itens: DocumentoResumo[];
  carregando?: boolean;
  /** Para onde cada linha leva: leitor de fontes (padrão) ou gestão do acervo. */
  destino?: (id: string) => string;
}) {
  return (
    <div>
      <div className={`hidden gap-x-3 border-b border-linha-forte pb-2 text-micro text-texto-3 md:grid ${COLUNAS}`} aria-hidden="true">
        <span />
        <span>Documento</span>
        <span>Ano</span>
        <span>Idioma</span>
        <span className="text-right">Páginas</span>
        <span>Estado</span>
        <span className="text-right">Ingestão</span>
      </div>
      {carregando ? (
        <ul aria-label="Carregando documentos">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="flex flex-col gap-2 border-b border-linha py-4">
              <Esqueleto className="h-4 w-3/4" />
              <Esqueleto className="h-3 w-1/3" />
            </li>
          ))}
        </ul>
      ) : (
        <ul aria-label="Documentos">
          {itens.map((d) => (
            <Linha key={d.id} d={d} destino={destino} />
          ))}
        </ul>
      )}
    </div>
  );
}
