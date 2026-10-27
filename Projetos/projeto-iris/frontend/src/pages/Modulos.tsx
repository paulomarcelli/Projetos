import { GitBranch, Radar, Search, Star, Waypoints } from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { EstruturaDeCenario, GramaticaDeRelacoes, LegendaEpistemica } from "../components/Diagramas";
import { Epistemico, GlifoEpistemico } from "../components/Epistemico";
import { ErroDeCarregamento, EstadoVazio, LinhasEsqueleto } from "../components/Estados";
import { InvestigacoesRecentes } from "../components/Investigacoes";
import { ListaDeDocumentos } from "../components/ListaDeDocumentos";
import { NovaInvestigacao } from "../components/NovaInvestigacao";
import { PainelBase } from "../components/PainelBase";
import { Secao } from "../components/Secao";
import { CabecalhoDePagina } from "../components/Shell";
import { listarDocumentos, obterDocumento, type DocumentoDetalhe, type DocumentoResumo } from "../lib/api";
import { numero, tituloDoDocumento } from "../lib/formato";
import { useFavoritos, useRascunhos } from "../lib/local";
import { ESTADO_ETAPA, METODO } from "../lib/metodo";
import { ROTAS } from "../lib/rotas";
import { useDados } from "../lib/useDados";

const MapaMundo = lazy(() => import("../components/MapaMundo"));

// ------------------------------------------------------------------ Investigações

/** O caminho de uma investigação e o que já existe em cada etapa. */
function TrilhaDoMetodo() {
  return (
    <ol className="grid list-none gap-px overflow-hidden rounded-painel border border-linha bg-linha p-0 sm:grid-cols-3 xl:grid-cols-6">
      {METODO.map((m, i) => (
        <li key={m.titulo} className="flex flex-col gap-1.5 bg-abismo p-4">
          <span className="flex items-center justify-between gap-2">
            <span className="numeros font-dados text-micro text-texto-3">{String(i + 1).padStart(2, "0")}</span>
            <span
              className={`inline-flex items-center gap-1.5 text-micro ${
                m.estado === "disponivel" ? "text-ciano-texto" : m.estado === "proxima" ? "text-ambar" : "text-texto-3"
              }`}
            >
              <span aria-hidden="true" className={`size-1.5 rounded-full ${m.estado === "disponivel" ? "bg-ciano" : m.estado === "proxima" ? "bg-ambar" : "border border-texto-3"}`} />
              {ESTADO_ETAPA[m.estado]}
            </span>
          </span>
          <span className="font-editorial text-[1.0625rem] text-texto">{m.titulo}</span>
          <span className="text-micro text-texto-2">{m.texto}</span>
        </li>
      ))}
    </ol>
  );
}

export function Investigacoes() {
  const [params] = useSearchParams();
  const { rascunhos } = useRascunhos();
  const rascunho = rascunhos.find((r) => r.id === params.get("rascunho")) ?? null;
  return (
    <div className="flex flex-col gap-10">
      <CabecalhoDePagina rotulo="Presente" titulo="Investigações">
        Uma investigação parte de uma pergunta sobre a ordem internacional e avança por evidências,
        relações e cenários, com o tipo de cada afirmação declarado.
      </CabecalhoDePagina>
      <TrilhaDoMetodo />
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

export function BaseCientifica() {
  return (
    <div className="flex flex-col gap-10">
      <CabecalhoDePagina rotulo="Presente" titulo="Base científica">
        As fontes que sustentam as análises. Toda afirmação do Iris deve apontar para um documento e
        uma página daqui.
      </CabecalhoDePagina>
      <PainelBase />
      <PesquisaDeFontes />
    </div>
  );
}

// ------------------------------------------------------------------ Mapas e relações

const CAMADAS = [
  { rotulo: "Estados", texto: "Países e governos" },
  { rotulo: "Organizações multilaterais", texto: "ONU, OMC, blocos regionais" },
  { rotulo: "Atores não estatais", texto: "Empresas, ONGs, grupos armados" },
  { rotulo: "Fluxos", texto: "Comércio, energia, tecnologia, capital" },
];

function AvisoSemRelacoes() {
  return (
    <EstadoVazio
      icone={<Waypoints size={22} strokeWidth={1.5} aria-hidden="true" />}
      titulo="Nenhuma relação mapeada"
      marcador={{ tipo: "limitacao", rotulo: "Depende da extração de entidades (GraphRAG)" }}
    >
      Um mapa sem fontes seria ilustração, não análise. As relações aparecem aqui quando forem
      extraídas dos documentos da base científica.
    </EstadoVazio>
  );
}

export function MapasRelacoes() {
  return (
    <div className="flex flex-col gap-8">
      <CabecalhoDePagina rotulo="Presente" titulo="Mapas e relações">
        Estados, organizações e atores não estatais, e as relações entre eles — cada ligação apoiada nas
        fontes que a sustentam.
      </CabecalhoDePagina>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-5 self-start">
          <div className="relative overflow-hidden rounded-painel border border-linha bg-abismo">
            <Suspense fallback={<div className="esqueleto aspect-[960/470] w-full" />}>
              <MapaMundo rotulo="Mapa-múndi sem relações mapeadas." intensidade="minima" />
            </Suspense>
            <div className="absolute inset-0 hidden place-items-center p-4 md:grid">
              <div className="max-w-sm rounded-padrao border border-linha bg-abismo/90 p-5 backdrop-blur-sm">
                <AvisoSemRelacoes />
              </div>
            </div>
          </div>
          <div className="md:hidden">
            <AvisoSemRelacoes />
          </div>
        </div>
        <aside className="flex flex-col gap-8">
          <section aria-labelledby="titulo-gramatica">
            <h2 id="titulo-gramatica" className="mb-1 font-editorial text-secao text-texto">
              Tipos de relação
            </h2>
            <p className="mb-4 text-micro text-texto-3">Gramática visual de referência.</p>
            <GramaticaDeRelacoes />
          </section>
          <section aria-labelledby="titulo-camadas">
            <h2 id="titulo-camadas" className="mb-3 font-editorial text-secao text-texto">
              Camadas previstas
            </h2>
            <ul className="flex flex-col">
              {CAMADAS.map((c) => (
                <li key={c.rotulo} className="border-b border-linha py-2.5">
                  <span className="block text-corpo text-texto">{c.rotulo}</span>
                  <span className="block text-legenda text-texto-2">{c.texto}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Cenários

const LINHAS_QUADRO = [
  { rotulo: "Premissas", tipo: "hipotese" as const },
  { rotulo: "Atores decisivos", tipo: "fato" as const },
  { rotulo: "Variáveis críticas", tipo: "inferencia" as const },
  { rotulo: "Consequências", tipo: "cenario" as const },
  { rotulo: "Sinais a observar", tipo: "incerteza" as const },
];

export function Cenarios() {
  return (
    <div className="flex flex-col gap-10">
      <CabecalhoDePagina rotulo="Futuros" titulo="Cenários prospectivos">
        Futuros alternativos e condicionais: cada cenário declara premissas, variáveis críticas e
        incertezas, e nunca é apresentado como previsão.
      </CabecalhoDePagina>

      <section aria-labelledby="titulo-quadro">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="titulo-quadro" className="font-editorial text-secao text-texto">
              Quadro de comparação
            </h2>
            <p className="mt-1 text-legenda text-texto-2">As trajetórias de um cenário, lado a lado.</p>
          </div>
          <Epistemico tipo="limitacao" rotulo="Vazio até existir o motor prospectivo" />
        </div>
        <div className="overflow-x-auto rounded-painel border border-linha">
          <table className="w-full min-w-[640px] border-collapse text-legenda">
            <caption className="sr-only">Quadro de comparação de trajetórias (sem cenários ainda)</caption>
            <thead>
              <tr className="bg-institucional">
                <th scope="col" className="w-44 border-b border-linha p-3 text-left font-medium text-texto-2">
                  Dimensão
                </th>
                {["A", "B", "C"].map((t) => (
                  <th key={t} scope="col" className="border-b border-l border-linha p-3 text-left font-medium text-texto">
                    <span className="inline-flex items-center gap-2">
                      <GlifoEpistemico tipo="cenario" /> Trajetória {t}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LINHAS_QUADRO.map((l) => (
                <tr key={l.rotulo}>
                  <th scope="row" className="border-b border-linha p-3 text-left font-normal text-texto-2">
                    <span className="inline-flex items-center gap-2">
                      <GlifoEpistemico tipo={l.tipo} /> {l.rotulo}
                    </span>
                  </th>
                  {[0, 1, 2].map((c) => (
                    <td key={c} className="border-b border-l border-linha p-3">
                      <span className="block h-4 rounded-fino border border-dashed border-linha-forte" aria-label="vazio" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
        <Secao id="titulo-estrutura" titulo="Como um cenário se forma">
          <div className="flex flex-col gap-5">
            <EstadoVazio
              icone={<GitBranch size={22} strokeWidth={1.5} aria-hidden="true" />}
              titulo="Nenhum cenário salvo"
            >
              Os cenários nascem de investigações processadas. Comece por uma pergunta em{" "}
              <Link to={ROTAS.investigacoes} className="text-ciano-texto hover:underline">
                Investigações
              </Link>
              .
            </EstadoVazio>
            <EstruturaDeCenario />
          </div>
        </Secao>
        <Secao id="titulo-leitura-cen" titulo="Como ler um cenário">
          <LegendaEpistemica tipos={["evidencia", "inferencia", "hipotese", "cenario", "incerteza", "limitacao"]} />
        </Secao>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Sinais

const COLUNAS_SINAIS = ["Sinal", "Variável crítica", "Cenário", "Fonte", "Observado em", "Por que importa"];

export function Sinais() {
  return (
    <div className="flex flex-col gap-10">
      <CabecalhoDePagina rotulo="Futuros" titulo="Sinais antecipatórios">
        Indícios observáveis de mudança que, se confirmados, fortalecem ou enfraquecem uma trajetória de
        um cenário acompanhado.
      </CabecalhoDePagina>

      <div className="overflow-x-auto rounded-painel border border-linha">
        <table className="w-full min-w-[760px] border-collapse text-legenda">
          <caption className="sr-only">Sinais monitorados (nenhum ainda)</caption>
          <thead>
            <tr className="bg-institucional">
              {COLUNAS_SINAIS.map((c) => (
                <th key={c} scope="col" className="border-b border-linha p-3 text-left font-medium text-texto-2">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={COLUNAS_SINAIS.length} className="p-6">
                <EstadoVazio
                  icone={<Radar size={22} strokeWidth={1.5} aria-hidden="true" />}
                  titulo="Nenhum sinal monitorado"
                  marcador={{ tipo: "incerteza", rotulo: "Sem cenários acompanhados, não há o que monitorar" }}
                >
                  Nenhum alerta é simulado. Cada sinal virá com a fonte, a data em que foi observado, a
                  variável e o cenário a que se liga, e a justificativa de relevância.
                </EstadoVazio>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Secao id="titulo-criterios" titulo="Critérios de um sinal">
        <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {[
            ["evidencia", "Observável e com fonte", "Um fato registrado em documento, dado ou notícia verificável."],
            ["inferencia", "Ligado a uma variável", "Diz qual variável crítica do cenário ele afeta e em que direção."],
            ["incerteza", "Com incerteza declarada", "Indica o que ainda não se sabe e o que poderia invalidá-lo."],
            ["limitacao", "Sem pontuação sem método", "Nenhuma nota de risco ou probabilidade sem método explícito."],
          ].map(([tipo, titulo, texto]) => (
            <li key={titulo} className="grid grid-cols-[18px_minmax(0,1fr)] gap-2">
              <span className="pt-1">
                <GlifoEpistemico tipo={tipo as "evidencia"} tamanho={16} />
              </span>
              <span>
                <span className="block text-corpo text-texto">{titulo}</span>
                <span className="block text-legenda text-texto-2">{texto}</span>
              </span>
            </li>
          ))}
        </ul>
      </Secao>
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
