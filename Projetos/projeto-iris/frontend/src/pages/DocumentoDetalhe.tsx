import { ArrowLeft, ChevronLeft, ChevronRight, Copy, ExternalLink, RotateCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { Epistemico, type TipoEpistemico } from "../components/Epistemico";
import { Aviso, ErroDeCarregamento, Esqueleto, EstadoVazio, LinhasEsqueleto } from "../components/Estados";
import { BotaoFavorito } from "../components/ListaDeDocumentos";
import { useNotificar } from "../components/Notificacoes";
import { SeloStatus } from "../components/StatusDocumento";
import {
  ErroApi,
  listarPaginas,
  obterDocumento,
  removerDocumento,
  type DocumentoDetalhe as Detalhe,
  type PaginaDeTexto,
} from "../lib/api";
import { contar, cortarNoMeio, dataComHora, idioma, numero, tamanho, tituloDoDocumento } from "../lib/formato";
import { useFavoritos } from "../lib/local";
import { useDados } from "../lib/useDados";

const JANELA = 20;

const ORIGENS: Record<string, { tipo: TipoEpistemico; rotulo: string }> = {
  user: { tipo: "fato", rotulo: "Informado no envio" },
  xmp: { tipo: "evidencia", rotulo: "Metadado XMP do PDF" },
  pdf_info: { tipo: "evidencia", rotulo: "Dicionário Info do PDF" },
  pdf_catalog: { tipo: "evidencia", rotulo: "Catálogo do PDF" },
  heuristic: { tipo: "inferencia", rotulo: "Inferido por heurística" },
};

async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return false;
  }
}

/** Ex.: "pages_without_text: 2, 3, 4" → texto legível, com listas longas resumidas. */
function avisoLegivel(aviso: string): string {
  const [codigo, resto = ""] = aviso.split(/:\s*/, 2);
  const lista = (rotulo: string) => {
    const nums = resto.split(",").map((s) => s.trim()).filter(Boolean);
    const vis = nums.slice(0, 12).join(", ");
    return `${rotulo} ${vis}${nums.length > 12 ? ` e mais ${numero(nums.length - 12)}` : ""}.`;
  };
  if (codigo === "no_extractable_text")
    return "Nenhuma página tem camada de texto (provável PDF escaneado). O reconhecimento óptico (OCR) ainda não é feito.";
  if (codigo === "pages_without_text") return lista("Páginas sem texto extraível:");
  if (codigo === "pages_with_errors") return lista("Falha de extração nas páginas:");
  return aviso;
}

function Campo({ rotulo, valor, origem, children }: { rotulo: string; valor: unknown; origem?: string; children?: React.ReactNode }) {
  const vazio = valor === null || valor === undefined || (Array.isArray(valor) && valor.length === 0);
  const o = origem ? ORIGENS[origem] : undefined;
  return (
    <div className="grid gap-1 border-b border-linha py-3 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-legenda text-texto-2">{rotulo}</dt>
      <dd className="m-0 flex min-w-0 flex-col gap-1">
        {vazio ? (
          <Epistemico tipo="limitacao" rotulo="Não identificado" />
        ) : (
          <>
            <span className="text-corpo text-texto [overflow-wrap:anywhere]">{children ?? String(valor)}</span>
            {o && <Epistemico tipo={o.tipo} rotulo={o.rotulo} />}
          </>
        )}
      </dd>
    </div>
  );
}

function Leitor({ doc }: { doc: Detalhe }) {
  const [params, setParams] = useSearchParams();
  const total = doc.page_count ?? 0;
  const atual = Math.min(Math.max(1, Number(params.get("p")) || 1), Math.max(total, 1));
  const [bruto, setBruto] = useState(false);
  const [irPara, setIrPara] = useState("");
  const inicioJanela = Math.floor((atual - 1) / JANELA) * JANELA;
  const notificar = useNotificar();

  const paginas = useDados(
    () => listarPaginas(doc.id, { limit: JANELA, offset: inicioJanela, incluirBruto: bruto }),
    [doc.id, inicioJanela, bruto],
  );

  const mudar = (n: number) => {
    const p = Math.min(Math.max(1, n), total);
    const novo = new URLSearchParams(params);
    novo.set("p", String(p));
    setParams(novo, { replace: true });
  };

  // ← e → trocam de página (sem animação: ação de teclado).
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest("input, textarea, select")) return;
      if (e.key === "ArrowLeft" && atual > 1) mudar(atual - 1);
      if (e.key === "ArrowRight" && atual < total) mudar(atual + 1);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  });

  if (total === 0) {
    return (
      <EstadoVazio titulo="Sem páginas para ler" marcador={{ tipo: "limitacao", rotulo: "O processamento não registrou páginas" }}>
        {doc.status === "failed" ? "O processamento falhou antes de extrair o texto." : "O documento ainda não foi processado."}
      </EstadoVazio>
    );
  }

  const pagina: PaginaDeTexto | undefined = paginas.dados?.items.find((p) => p.page_number === atual);

  return (
    <div className="grid gap-6 md:grid-cols-[132px_minmax(0,1fr)]">
      <nav aria-label="Páginas" className="flex flex-col gap-3">
        <ol className="grid grid-cols-5 gap-1 md:grid-cols-3">
          {Array.from({ length: Math.min(JANELA, total - inicioJanela) }, (_, i) => {
            const n = inicioJanela + i + 1;
            const p = paginas.dados?.items.find((x) => x.page_number === n);
            return (
              <li key={n}>
                <button
                  type="button"
                  onClick={() => mudar(n)}
                  aria-current={n === atual ? "page" : undefined}
                  aria-label={`Página ${n}${p?.extraction_status === "empty" ? ", sem texto" : p?.extraction_status === "error" ? ", com falha" : ""}`}
                  className={`numeros relative h-8 w-full rounded-fino border text-micro transition-colors duration-150 ${
                    n === atual ? "border-ciano bg-ciano-suave text-ciano-texto" : "border-linha text-texto-2 hover:border-linha-forte hover:text-texto"
                  } ${p && p.extraction_status !== "ok" ? "border-dashed" : ""}`}
                >
                  {n}
                  {p?.extraction_status === "error" && <span aria-hidden="true" className="absolute top-1 right-1 size-1.5 rounded-full bg-negativo" />}
                </button>
              </li>
            );
          })}
        </ol>
        {total > JANELA && (
          <div className="flex items-center justify-between gap-1">
            <button type="button" className="botao botao-fantasma botao-pequeno px-2" disabled={inicioJanela === 0} onClick={() => mudar(inicioJanela - JANELA + 1)} aria-label="20 páginas anteriores">
              <ChevronLeft size={14} aria-hidden="true" />
            </button>
            <span className="numeros text-micro text-texto-3">
              {inicioJanela + 1}–{Math.min(inicioJanela + JANELA, total)}
            </span>
            <button type="button" className="botao botao-fantasma botao-pequeno px-2" disabled={inicioJanela + JANELA >= total} onClick={() => mudar(inicioJanela + JANELA + 1)} aria-label="20 páginas seguintes">
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
        )}
        {total > JANELA && (
          <form
            className="flex gap-1"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(irPara);
              if (Number.isInteger(n) && n >= 1 && n <= total) mudar(n);
              setIrPara("");
            }}
          >
            <label htmlFor="ir-para" className="sr-only">
              Ir para a página
            </label>
            <input id="ir-para" inputMode="numeric" placeholder={`1–${total}`} value={irPara} onChange={(e) => setIrPara(e.target.value.replace(/\D/g, ""))} className="campo numeros min-h-8 px-2 py-1 text-legenda" />
            <button type="submit" className="botao botao-secundario botao-pequeno px-2">
              Ir
            </button>
          </form>
        )}
      </nav>

      <article aria-labelledby="titulo-pagina" className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-linha pb-3">
          <h3 id="titulo-pagina" className="numeros font-dados text-legenda text-texto-2">
            p. {numero(atual)} <span className="text-texto-3">de {numero(total)}</span>
          </h3>
          <div className="flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-micro text-texto-2">
              <input type="checkbox" checked={bruto} onChange={(e) => setBruto(e.target.checked)} className="accent-[var(--color-ciano)]" />
              Texto bruto
            </label>
            <button type="button" className="botao botao-secundario botao-pequeno px-2" disabled={atual <= 1} onClick={() => mudar(atual - 1)} aria-label="Página anterior">
              <ChevronLeft size={15} aria-hidden="true" />
            </button>
            <button type="button" className="botao botao-secundario botao-pequeno px-2" disabled={atual >= total} onClick={() => mudar(atual + 1)} aria-label="Próxima página">
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>

        {paginas.tipo === "erro" ? (
          <ErroDeCarregamento erro={paginas.erro} aoTentarDeNovo={paginas.recarregar} />
        ) : !pagina ? (
          <LinhasEsqueleto linhas={8} />
        ) : pagina.extraction_status === "error" ? (
          <EstadoVazio titulo="A extração desta página falhou" marcador={{ tipo: "limitacao", rotulo: `Erro de extração (${pagina.extraction_error ?? "desconhecido"})` }}>
            As outras páginas do documento não foram afetadas.
          </EstadoVazio>
        ) : !pagina.has_text ? (
          <EstadoVazio titulo="Página sem texto extraível" marcador={{ tipo: "limitacao", rotulo: "Sem camada de texto: possivelmente imagem" }}>
            Esta página pode conter só imagens, gráficos ou digitalização. Sem OCR, o texto não é lido.
          </EstadoVazio>
        ) : (
          <>
            <div className="max-w-[68ch] font-editorial text-leitura whitespace-pre-wrap text-texto [overflow-wrap:anywhere]">
              {bruto ? (pagina.text_raw ?? pagina.text) : pagina.text}
            </div>
            <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-linha pt-3 text-micro text-texto-3">
              <div className="flex gap-1.5">
                <dt>caracteres</dt>
                <dd className="numeros m-0 text-texto-2">{numero(pagina.char_count)}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>extrator</dt>
                <dd className="m-0 font-dados text-texto-2">{pagina.extractor}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>normalização</dt>
                <dd className="m-0 font-dados text-texto-2">v{pagina.normalization_version}</dd>
              </div>
              {pagina.text_sha256 && (
                <div className="flex items-center gap-1.5">
                  <dt>sha-256 do texto</dt>
                  <dd className="m-0 flex items-center gap-1">
                    <code className="font-dados text-texto-2" title={pagina.text_sha256}>
                      {cortarNoMeio(pagina.text_sha256, 17)}
                    </code>
                    <button
                      type="button"
                      className="rounded-fino p-1 hover:text-texto"
                      aria-label="Copiar o SHA-256 do texto"
                      onClick={async () => {
                        const ok = await copiar(pagina.text_sha256 ?? "");
                        notificar(ok ? "sucesso" : "erro", ok ? "SHA-256 do texto copiado." : "Não foi possível copiar.");
                      }}
                    >
                      <Copy size={12} aria-hidden="true" />
                    </button>
                  </dd>
                </div>
              )}
            </dl>
          </>
        )}
      </article>
    </div>
  );
}

function Remocao({ doc }: { doc: Detalhe }) {
  const [confirmando, setConfirmando] = useState(false);
  const [removendo, setRemovendo] = useState(false);
  const navegar = useNavigate();
  const notificar = useNotificar();
  const { remover } = useFavoritos();
  if (doc.status === "processing") return null;
  return confirmando ? (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-legenda text-texto-2">Apagar registro, páginas e arquivo?</span>
      <button
        type="button"
        className="botao botao-perigo botao-pequeno"
        disabled={removendo}
        onClick={async () => {
          setRemovendo(true);
          try {
            await removerDocumento(doc.id);
            remover(doc.id);
            notificar("sucesso", "Documento removido.");
            navegar("/documentos");
          } catch (e) {
            notificar("erro", e instanceof ErroApi ? e.message : "Não foi possível remover.");
            setRemovendo(false);
            setConfirmando(false);
          }
        }}
      >
        {removendo ? "Removendo…" : "Confirmar remoção"}
      </button>
      <button type="button" className="botao botao-fantasma botao-pequeno" onClick={() => setConfirmando(false)}>
        Cancelar
      </button>
    </div>
  ) : (
    <button type="button" className="botao botao-fantasma botao-pequeno" onClick={() => setConfirmando(true)}>
      <Trash2 size={14} aria-hidden="true" />
      Remover
    </button>
  );
}

export function DocumentoDetalhe() {
  const { id = "" } = useParams();
  const doc = useDados(() => obterDocumento(id), [id]);
  const notificar = useNotificar();

  if (doc.tipo === "carregando") {
    return (
      <div className="flex flex-col gap-4" role="status" aria-label="Carregando documento">
        <Esqueleto className="h-4 w-32" />
        <Esqueleto className="h-9 w-3/4" />
        <Esqueleto className="h-4 w-1/2" />
        <LinhasEsqueleto linhas={6} />
      </div>
    );
  }
  if (doc.tipo === "erro") {
    return (
      <div className="flex flex-col gap-6">
        <Link to="/documentos" className="inline-flex w-fit items-center gap-1.5 text-legenda text-texto-2 hover:text-texto">
          <ArrowLeft size={14} aria-hidden="true" />
          Documentos
        </Link>
        {doc.erro.status === 404 ? (
          <EstadoVazio titulo="Documento não encontrado">Ele pode ter sido removido. Volte à lista de documentos.</EstadoVazio>
        ) : (
          <ErroDeCarregamento erro={doc.erro} aoTentarDeNovo={doc.recarregar} />
        )}
      </div>
    );
  }

  const d = doc.dados;
  const { texto: titulo, ehNomeDeArquivo } = tituloDoDocumento(d);
  const fontes = d.metadata_sources ?? {};

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 border-b border-linha pb-6">
        <Link to="/documentos" className="inline-flex w-fit items-center gap-1.5 text-legenda text-texto-2 hover:text-texto">
          <ArrowLeft size={14} aria-hidden="true" />
          Documentos
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <SeloStatus status={d.status} />
          <Epistemico tipo="evidencia" rotulo="Fonte documental" />
          <span className="numeros text-micro text-texto-3">{contar(d.page_count ?? 0, "página", "páginas")} · {tamanho(d.size_bytes)}</span>
        </div>
        <h1 className={`max-w-[48ch] text-texto [overflow-wrap:anywhere] ${ehNomeDeArquivo ? "font-dados text-secao" : "font-editorial text-titulo font-medium tracking-[-0.01em]"}`}>{titulo}</h1>
        {d.authors?.length ? <p className="max-w-[70ch] text-leitura text-texto-2">{d.authors.join("; ")}</p> : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-legenda text-texto-2">
            {[d.journal, d.publisher, d.publication_year].filter(Boolean).join(" · ") || "Publicação não identificada"}
            {d.doi && (
              <>
                {" · "}
                <a href={`https://doi.org/${d.doi}`} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-dados text-ciano-texto hover:underline [overflow-wrap:anywhere]">
                  doi:{d.doi}
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <BotaoFavorito id={d.id} titulo={titulo} />
            <Remocao doc={d} />
          </div>
        </div>

        {d.status === "failed" && d.error && (
          <Aviso tom="erro" titulo="O processamento falhou">
            {d.error.message ?? "Sem detalhes."} <code className="font-dados text-micro">({d.error.code})</code>
          </Aviso>
        )}
        {(d.status === "pending" || d.status === "processing") && (
          <Aviso tom="neutro" titulo="Em processamento">
            <span className="flex flex-wrap items-center gap-3">
              O texto e os metadados aparecem quando o processamento terminar.
              <button type="button" className="botao botao-secundario botao-pequeno" onClick={doc.recarregar}>
                <RotateCw size={14} aria-hidden="true" />
                Atualizar
              </button>
            </span>
          </Aviso>
        )}
      </div>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-10">
        <section aria-labelledby="titulo-leitura" className="min-w-0">
          <h2 id="titulo-leitura" className="mb-4 font-editorial text-secao text-texto">
            Texto por página
          </h2>
          <Leitor doc={d} />
        </section>

        <aside className="flex min-w-0 flex-col gap-8">
          <section aria-labelledby="titulo-ficha">
            <h2 id="titulo-ficha" className="mb-1 font-editorial text-secao text-texto">
              Ficha bibliográfica
            </h2>
            <p className="mb-2 text-micro text-texto-3">Cada campo diz de onde veio. Nada é preenchido por suposição.</p>
            <dl className="m-0">
              <Campo rotulo="Título" valor={d.title} origem={fontes.title} />
              <Campo rotulo="Autores" valor={d.authors} origem={fontes.authors}>
                {d.authors?.join("; ")}
              </Campo>
              <Campo rotulo="Ano" valor={d.publication_year} origem={fontes.publication_year} />
              <Campo rotulo="Periódico" valor={d.journal} origem={fontes.journal} />
              <Campo rotulo="Editora" valor={d.publisher} origem={fontes.publisher} />
              <Campo rotulo="Instituição" valor={d.institution} origem={fontes.institution} />
              <Campo rotulo="DOI" valor={d.doi} origem={fontes.doi}>
                <span className="font-dados text-legenda">{d.doi}</span>
              </Campo>
              <Campo rotulo="URL de origem" valor={d.source_url} origem={fontes.source_url}>
                {d.source_url && (
                  <a href={d.source_url} target="_blank" rel="noreferrer noopener" className="text-ciano-texto hover:underline">
                    {d.source_url}
                  </a>
                )}
              </Campo>
              <Campo rotulo="Idioma" valor={d.language} origem={fontes.language}>
                <span className="capitalize">{idioma(d.language)}</span> <span className="font-dados text-micro text-texto-3">({d.language})</span>
              </Campo>
            </dl>
          </section>

          {d.warnings.length > 0 && (
            <section aria-labelledby="titulo-limitacoes">
              <h2 id="titulo-limitacoes" className="mb-3 font-editorial text-secao text-texto">
                Limitações
              </h2>
              <ul className="flex flex-col gap-3">
                {d.warnings.map((a) => (
                  <li key={a} className="grid grid-cols-[18px_minmax(0,1fr)] gap-2 text-legenda text-texto-2">
                    <span className="pt-0.5">
                      <Epistemico tipo="limitacao" compacto />
                    </span>
                    <span className="[overflow-wrap:anywhere]">{avisoLegivel(a)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="titulo-integridade">
            <h2 id="titulo-integridade" className="mb-3 font-editorial text-secao text-texto">
              Integridade e procedência
            </h2>
            <dl className="m-0 grid grid-cols-[8.5rem_minmax(0,1fr)] gap-x-4 gap-y-2 text-legenda">
              <dt className="text-texto-2">Arquivo original</dt>
              <dd className="m-0 truncate font-dados text-texto" title={d.original_filename}>
                {cortarNoMeio(d.original_filename, 40)}
              </dd>
              <dt className="text-texto-2">SHA-256</dt>
              <dd className="m-0 flex min-w-0 items-center gap-1">
                <code className="truncate font-dados text-texto" title={d.sha256}>
                  {cortarNoMeio(d.sha256, 23)}
                </code>
                <button
                  type="button"
                  className="shrink-0 rounded-fino p-1 text-texto-3 hover:text-texto"
                  aria-label="Copiar o SHA-256 do arquivo"
                  onClick={async () => {
                    const ok = await copiar(d.sha256);
                    notificar(ok ? "sucesso" : "erro", ok ? "SHA-256 do arquivo copiado." : "Não foi possível copiar.");
                  }}
                >
                  <Copy size={12} aria-hidden="true" />
                </button>
              </dd>
              <dt className="text-texto-2">Ingestão</dt>
              <dd className="numeros m-0 text-texto">{dataComHora(d.created_at)}</dd>
              <dt className="text-texto-2">Processado</dt>
              <dd className="numeros m-0 text-texto">{dataComHora(d.processed_at)}</dd>
              <dt className="text-texto-2">Identificador</dt>
              <dd className="m-0 truncate font-dados text-texto-3" title={d.id}>
                {d.id}
              </dd>
            </dl>
          </section>

          {d.pdf_metadata && Object.keys(d.pdf_metadata).length > 0 && (
            <details className="group">
              <summary className="cursor-pointer list-none text-legenda text-texto-2 hover:text-texto">
                <span className="inline-block w-4 transition-transform duration-150 group-open:rotate-90" aria-hidden="true">›</span>
                Metadados embutidos no PDF ({Object.keys(d.pdf_metadata).length})
              </summary>
              <dl className="mt-3 grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-micro">
                {Object.entries(d.pdf_metadata).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="truncate font-dados text-texto-3">{k}</dt>
                    <dd className="m-0 text-texto-2 [overflow-wrap:anywhere]">{v}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}
        </aside>
      </div>
    </div>
  );
}
