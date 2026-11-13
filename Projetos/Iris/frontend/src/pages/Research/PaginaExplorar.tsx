import { ArrowRight, FileText, FileX, Search, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { PainelBase } from "../../components/research/base-cientifica/PainelBase";
import { ErroDeCarregamento } from "../../components/common/ErroDeCarregamento";
import { EstadoVazio } from "../../components/common/EstadoVazio";
import { LinhasEsqueleto } from "../../components/common/Carregando";
import { CabecalhoDePagina } from "../../components/layout/CabecalhoDePagina";
import { useDados } from "../../hooks/useDados";
import { ROTAS } from "../../config/rotas";
import { listarDocumentos } from "../../services/api";
import { type DocumentoResumo } from "../../types/api";
import { autores, idioma, numero, tituloDoDocumento } from "../../utils/formatadores";

function normalizar(t: string) {
  return t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/**
 * Uma fonte do acervo como ficha de catálogo: título em destaque, autoria, e numa linha discreta ano, páginas e idioma.
 * À direita, o que importa para a análise: se há texto extraído (com texto, a fonte pode sustentar uma citação; sem
 * texto, é uma limitação, em âmbar). A linha inteira leva ao leitor da fonte.
 */
function Referencia({ d }: { d: DocumentoResumo }) {
  const { texto, ehNomeDeArquivo } = tituloDoDocumento(d);
  const quem = autores(d.authors, 3);
  const meta = [
    d.publication_year ? String(d.publication_year) : null,
    d.page_count ? (d.page_count === 1 ? "1 página" : `${numero(d.page_count)} páginas`) : null,
    d.language ? idioma(d.language) : null,
  ].filter(Boolean) as string[];
  const comTexto = d.text_extractable === true;
  return (
    <li>
      <Link
        to={ROTAS.fonte(d.id)}
        className="group -mx-3 grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-4 gap-y-2 rounded-padrao px-3 py-4 transition-colors duration-150 hover:bg-grafite/50 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:items-center"
      >
        <span
          aria-hidden="true"
          className="grid size-10 place-items-center rounded-padrao border border-linha bg-institucional text-texto-3 transition-colors duration-150 group-hover:border-linha-forte group-hover:text-texto-2"
        >
          {comTexto ? <FileText size={17} strokeWidth={1.5} /> : <FileX size={17} strokeWidth={1.5} />}
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span
            className={`text-texto transition-colors duration-150 group-hover:text-ciano-texto [overflow-wrap:anywhere] ${
              ehNomeDeArquivo ? "font-dados text-legenda" : "line-clamp-2 font-editorial text-corpo font-medium text-balance"
            }`}
          >
            {texto}
          </span>
          <span className="truncate text-legenda text-texto-2">{quem ?? (ehNomeDeArquivo ? "Sem título nem autoria identificados" : "Autoria não identificada")}</span>
          {meta.length > 0 && (
            <span className="flex flex-wrap items-center gap-x-2 text-micro text-texto-3">
              {meta.map((m, i) => (
                <span key={m} className="numeros inline-flex items-center gap-2 first-letter:uppercase">
                  {i > 0 && <span aria-hidden="true">·</span>}
                  {m}
                </span>
              ))}
            </span>
          )}
        </span>
        <span className="col-start-2 flex items-center gap-3 sm:col-start-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-micro whitespace-nowrap ${
              comTexto ? "border-linha text-texto-2" : "border-ambar/45 bg-ambar-suave text-ambar"
            }`}
          >
            <span aria-hidden="true" className={`size-1.5 rounded-full ${comTexto ? "bg-positivo" : "bg-ambar"}`} />
            {comTexto ? "Texto extraído" : "Sem texto extraível"}
          </span>
          <ArrowRight size={15} aria-hidden="true" className="hidden text-texto-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-texto-2 sm:block" />
        </span>
      </Link>
    </li>
  );
}

function PesquisaDeFontes() {
  const [consulta, setConsulta] = useState("");
  const lista = useDados(() => listarDocumentos({ limit: 100 }), []);
  const achados = useMemo(() => {
    const q = normalizar(consulta.trim());
    const itens = lista.dados?.items ?? [];
    if (!q) return itens;
    return itens.filter((d) => normalizar([d.title, d.original_filename, ...(d.authors ?? []), d.publication_year].filter(Boolean).join(" ")).includes(q));
  }, [consulta, lista.dados]);

  return (
    <section aria-labelledby="titulo-fontes" className="min-w-0">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 id="titulo-fontes" className="font-editorial text-secao text-texto">
          Fontes
        </h2>
      </div>
      <div className="relative mb-2">
        <Search size={17} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-texto-3" />
        <label htmlFor="busca-fontes" className="sr-only">
          Pesquisar por título, autor ou ano
        </label>
        <input
          id="busca-fontes"
          type="search"
          className="campo min-h-12 pr-24 pl-11 text-corpo"
          placeholder="Título, autor ou ano"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
        />
        {lista.tipo === "ok" && (
          <p className="numeros pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-legenda text-texto-3" aria-live="polite">
            {achados.length === 1 ? "1 fonte" : `${numero(achados.length)} fontes`}
          </p>
        )}
      </div>
      <p className="mb-3 text-micro text-texto-3">
        Busca nos metadados {lista.dados && lista.dados.total > 100 ? "dos 100 documentos mais recentes" : "do acervo"}. A busca no texto
        completo e por evidências chega com a próxima fase (RAG híbrido).
      </p>
      {lista.tipo === "carregando" ? (
        <LinhasEsqueleto linhas={6} />
      ) : lista.tipo === "erro" ? (
        <ErroDeCarregamento erro={lista.erro} aoTentarDeNovo={lista.recarregar} />
      ) : achados.length === 0 ? (
        <EstadoVazio titulo={consulta ? "Nenhuma fonte corresponde à busca" : "Ainda não há fontes"}>
          {consulta ? (
            "Tente outro termo, um sobrenome ou um ano."
          ) : (
            <Link to={ROTAS.acervo} className="text-ciano-texto hover:underline">
              Envie o primeiro PDF em Configurações → Gestão do acervo.
            </Link>
          )}
        </EstadoVazio>
      ) : (
        <ol className="m-0 list-none divide-y divide-linha border-y border-linha p-0">
          {achados.slice(0, 50).map((d) => (
            <Referencia key={d.id} d={d} />
          ))}
        </ol>
      )}
    </section>
  );
}

export function PaginaExplorar() {
  return (
    <div className="flex flex-col gap-10">
      <CabecalhoDePagina
        titulo="Base científica"
        acoes={
          <Link to={ROTAS.acervo} className="botao botao-secundario botao-pequeno">
            <Upload size={14} aria-hidden="true" />
            Gestão do acervo
          </Link>
        }
      >
        As fontes que sustentam as análises. Toda afirmação da Iris deve apontar para um documento e
        uma página daqui.
      </CabecalhoDePagina>
      <PainelBase />
      <PesquisaDeFontes />
    </div>
  );
}
