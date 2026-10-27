import { GitBranch, Radar, Search, Star, Waypoints } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { EstruturaDeCenario, GramaticaDeRelacoes, LegendaEpistemica } from "../components/Diagramas";
import { Epistemico } from "../components/Epistemico";
import { ErroDeCarregamento, EstadoVazio, LinhasEsqueleto } from "../components/Estados";
import { InvestigacoesRecentes } from "../components/Investigacoes";
import { ListaDeDocumentos } from "../components/ListaDeDocumentos";
import { NovaInvestigacao } from "../components/NovaInvestigacao";
import { ResumoBase } from "../components/ResumoBase";
import { Secao } from "../components/Secao";
import { CabecalhoDePagina } from "../components/Shell";
import { listarDocumentos, obterDocumento, type DocumentoDetalhe, type DocumentoResumo } from "../lib/api";
import { numero, tituloDoDocumento } from "../lib/formato";
import { useFavoritos, useRascunhos } from "../lib/local";
import { useDados } from "../lib/useDados";

// ------------------------------------------------------------------ Investigações

export function Investigacoes() {
  const [params] = useSearchParams();
  const { rascunhos } = useRascunhos();
  const rascunho = rascunhos.find((r) => r.id === params.get("rascunho")) ?? null;
  return (
    <div className="flex flex-col gap-10">
      <CabecalhoDePagina rotulo="Presente" titulo="Investigações">
        Uma investigação parte de uma pergunta sobre a ordem internacional, define horizonte, escopo e
        dimensões, e reúne evidências, inferências e cenários — cada um com o seu tipo declarado.
      </CabecalhoDePagina>
      <NovaInvestigacao rascunho={rascunho} />
      <Secao id="titulo-lista-inv" titulo="Suas investigações">
        <InvestigacoesRecentes />
      </Secao>
    </div>
  );
}

// ------------------------------------------------------------------ Base científica

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
        <Link to={`/documentos/${d.id}`} className={`text-texto underline decoration-linha-forte underline-offset-4 hover:text-ciano-texto hover:decoration-ciano ${ehNomeDeArquivo ? "font-dados text-legenda" : "font-editorial"}`}>
          {texto}
        </Link>
        {d.publication_year ? <span className="numeros">. {d.publication_year}</span> : null}.
      </p>
    </li>
  );
}

export function BaseCientifica() {
  const [consulta, setConsulta] = useState("");
  const lista = useDados(() => listarDocumentos({ limit: 100 }), []);
  const achados = useMemo(() => {
    const q = normalizar(consulta.trim());
    const itens = lista.dados?.items ?? [];
    if (!q) return itens;
    return itens.filter((d) => normalizar([d.title, d.original_filename, ...(d.authors ?? []), d.publication_year].filter(Boolean).join(" ")).includes(q));
  }, [consulta, lista.dados]);

  return (
    <div>
      <CabecalhoDePagina rotulo="Presente" titulo="Base científica">
        As fontes que sustentam as análises. Toda afirmação futura do Iris deve apontar para um documento
        e uma página daqui.
      </CabecalhoDePagina>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <section aria-labelledby="titulo-fontes" className="min-w-0">
          <h2 id="titulo-fontes" className="mb-4 font-editorial text-secao text-texto">
            Pesquisar fontes
          </h2>
          <div className="relative mb-2">
            <Search size={16} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-texto-3" />
            <label htmlFor="busca-fontes" className="sr-only">
              Pesquisar por título, autor ou ano
            </label>
            <input id="busca-fontes" type="search" className="campo pl-9" placeholder="Título, autor ou ano" value={consulta} onChange={(e) => setConsulta(e.target.value)} />
          </div>
          <p className="mb-4 text-micro text-texto-3">
            Busca nos metadados dos {lista.dados && lista.dados.total > 100 ? "100 documentos mais recentes" : "documentos"}. A busca no texto completo
            e por evidências chega com a próxima fase (RAG híbrido).
          </p>
          {lista.tipo === "carregando" ? (
            <LinhasEsqueleto linhas={6} />
          ) : lista.tipo === "erro" ? (
            <ErroDeCarregamento erro={lista.erro} aoTentarDeNovo={lista.recarregar} />
          ) : achados.length === 0 ? (
            <EstadoVazio titulo={consulta ? "Nenhuma fonte corresponde à busca" : "Ainda não há fontes"}>
              {consulta ? "Tente outro termo, um sobrenome ou um ano." : <Link to="/documentos" className="text-ciano-texto hover:underline">Envie o primeiro PDF em Documentos.</Link>}
            </EstadoVazio>
          ) : (
            <>
              <p className="numeros mb-1 text-legenda text-texto-3" aria-live="polite">
                {achados.length === 1 ? "1 fonte" : `${numero(achados.length)} fontes`}
              </p>
              <ol className="list-none p-0">
                {achados.slice(0, 50).map((d) => (
                  <Referencia key={d.id} d={d} />
                ))}
              </ol>
            </>
          )}
        </section>
        <div>
          <Secao id="titulo-estado-base" titulo="Estado do acervo" emPainel>
            <ResumoBase />
          </Secao>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Mapas e relações

export function MapasRelacoes() {
  return (
    <div>
      <CabecalhoDePagina rotulo="Presente" titulo="Mapas e relações">
        Estados, organizações e atores não estatais; alianças, rivalidades, dependências e fluxos de
        comércio, energia e tecnologia — cada relação ligada às fontes que a sustentam.
      </CabecalhoDePagina>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
        <EstadoVazio
          icone={<Waypoints size={22} strokeWidth={1.5} aria-hidden="true" />}
          titulo="Nenhuma relação mapeada"
          marcador={{ tipo: "limitacao", rotulo: "Depende da extração de entidades (fase futura)" }}
        >
          Atores e relações serão extraídos dos documentos da base científica. Até lá, nenhum mapa é
          exibido: um mapa sem fontes seria uma ilustração, não uma análise.
        </EstadoVazio>
        <Secao id="titulo-gramatica" titulo="Como as relações serão desenhadas" subtitulo="Gramática visual de referência — sem dados.">
          <GramaticaDeRelacoes />
        </Secao>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Cenários

export function Cenarios() {
  return (
    <div>
      <CabecalhoDePagina rotulo="Futuros" titulo="Cenários prospectivos">
        Futuros alternativos e condicionais: cada cenário declara suas premissas, as variáveis críticas
        e as incertezas, e nunca é apresentado como previsão.
      </CabecalhoDePagina>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
        <div className="flex flex-col gap-6">
          <EstadoVazio
            icone={<GitBranch size={22} strokeWidth={1.5} aria-hidden="true" />}
            titulo="Nenhum cenário salvo"
            marcador={{ tipo: "limitacao", rotulo: "Depende do motor de investigação" }}
          >
            Os cenários nascem de investigações processadas. Você poderá compará-los lado a lado: atores,
            variáveis críticas, consequências e o que precisaria acontecer para cada trajetória.
          </EstadoVazio>
          <EstruturaDeCenario />
        </div>
        <Secao id="titulo-leitura-cen" titulo="Como ler um cenário">
          <LegendaEpistemica tipos={["evidencia", "inferencia", "hipotese", "cenario", "incerteza", "limitacao"]} />
        </Secao>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Sinais

export function Sinais() {
  return (
    <div>
      <CabecalhoDePagina rotulo="Futuros" titulo="Sinais antecipatórios">
        Indícios observáveis de mudança que, se confirmados, fortalecem ou enfraquecem uma trajetória
        de um cenário acompanhado.
      </CabecalhoDePagina>
      <EstadoVazio
        icone={<Radar size={22} strokeWidth={1.5} aria-hidden="true" />}
        titulo="Nenhum sinal monitorado"
        marcador={{ tipo: "incerteza", rotulo: "Sem cenários acompanhados, não há o que monitorar" }}
      >
        Nenhum alerta é simulado. Quando houver cenários acompanhados, cada sinal virá com fonte, data,
        variável relacionada e justificativa de relevância.
      </EstadoVazio>
    </div>
  );
}

// ------------------------------------------------------------------ Favoritos

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

export function Favoritos() {
  const { favoritos, remover } = useFavoritos();
  const chave = favoritos.join(",");
  const dados = useDados(() => carregarFavoritos(favoritos), [chave]);
  const perdidos = dados.dados?.perdidos ?? [];
  return (
    <div>
      <CabecalhoDePagina rotulo="Acervo" titulo="Favoritos">
        Documentos marcados com a estrela. Os favoritos ficam salvos neste navegador.
      </CabecalhoDePagina>
      {favoritos.length === 0 ? (
        <EstadoVazio icone={<Star size={22} strokeWidth={1.5} aria-hidden="true" />} titulo="Nenhum favorito ainda">
          Marque a estrela ao lado de um documento para encontrá-lo aqui.{" "}
          <Link to="/documentos" className="text-ciano-texto hover:underline">
            Ir para Documentos
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
