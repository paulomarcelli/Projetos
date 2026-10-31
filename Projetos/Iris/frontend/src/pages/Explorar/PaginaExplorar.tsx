import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { PainelBase } from "../../features/base-cientifica/components/PainelBase";
import { Epistemico } from "../../components/ui/Epistemico";
import { ErroDeCarregamento } from "../../components/feedback/ErroDeCarregamento";
import { EstadoVazio } from "../../components/feedback/EstadoVazio";
import { LinhasEsqueleto } from "../../components/ui/Carregando";
import { CabecalhoDePagina } from "../../components/layout/CabecalhoDePagina";
import { useDados } from "../../hooks/useDados";
import { ROTAS } from "../../config/rotas";
import { listarDocumentos } from "../../services/api";
import { type DocumentoResumo } from "../../types/api";
import { numero, tituloDoDocumento } from "../../utils/formatadores";

function normalizar(t: string) {
  return t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

function Referencia({ d }: { d: DocumentoResumo }) {
  const { texto, ehNomeDeArquivo } = tituloDoDocumento(d);
  return (
    <li className="grid gap-1.5 border-b border-linha py-4">
      <Epistemico tipo="evidencia" rotulo={d.text_extractable ? "Fonte com texto extraído" : "Fonte sem texto extraível"} />
      <p className="text-corpo text-texto-2 [overflow-wrap:anywhere]">
        {d.authors?.length ? <span className="text-texto">{d.authors.join("; ")}. </span> : null}
        <Link
          to={ROTAS.fonte(d.id)}
          className={`text-texto underline decoration-linha-forte underline-offset-4 hover:text-ciano-texto hover:decoration-ciano ${ehNomeDeArquivo ? "font-dados text-legenda" : "font-editorial"}`}
        >
          {texto}
        </Link>
        {d.publication_year ? <span className="numeros">. {d.publication_year}</span> : null}.
        {d.page_count ? <span className="numeros text-texto-3"> {d.page_count === 1 ? "1 p." : `${numero(d.page_count)} p.`}</span> : null}
      </p>
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
        {lista.tipo === "ok" && (
          <p className="numeros text-legenda text-texto-3" aria-live="polite">
            {achados.length === 1 ? "1 fonte" : `${numero(achados.length)} fontes`}
          </p>
        )}
      </div>
      <div className="relative mb-2">
        <Search size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-texto-3" />
        <label htmlFor="busca-fontes" className="sr-only">
          Pesquisar por título, autor ou ano
        </label>
        <input id="busca-fontes" type="search" className="campo pl-9" placeholder="Título, autor ou ano" value={consulta} onChange={(e) => setConsulta(e.target.value)} />
      </div>
      <p className="mb-4 text-micro text-texto-3">
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
        <ol className="list-none p-0">
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
      <CabecalhoDePagina rotulo="Presente" titulo="Base científica">
        As fontes que sustentam as análises. Toda afirmação da Iris deve apontar para um documento e
        uma página daqui.
      </CabecalhoDePagina>
      <PainelBase />
      <PesquisaDeFontes />
    </div>
  );
}
