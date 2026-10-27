import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useSearchParams } from "react-router";
import { EnvioDeDocumento } from "../components/EnvioDeDocumento";
import { ErroDeCarregamento, EstadoVazio } from "../components/Estados";
import { ListaDeDocumentos } from "../components/ListaDeDocumentos";
import { Secao } from "../components/Secao";
import { CabecalhoDePagina } from "../components/Shell";
import { ROTULO_STATUS } from "../components/StatusDocumento";
import { listarDocumentos, type StatusDocumento } from "../lib/api";
import { contar, numero } from "../lib/formato";
import { ROTAS } from "../lib/rotas";
import { useDados } from "../lib/useDados";

const POR_PAGINA = 20;
const FILTROS: (StatusDocumento | null)[] = [null, "completed", "processing", "pending", "failed"];

/** Gestão do acervo: envio, lista completa e (no detalhe) remoção de PDFs. Área de administração. */
export function Acervo() {
  const [params, setParams] = useSearchParams();
  const status = (params.get("status") as StatusDocumento | null) ?? null;
  const pagina = Math.max(1, Number(params.get("pagina")) || 1);
  const offset = (pagina - 1) * POR_PAGINA;

  const lista = useDados(() => listarDocumentos({ limit: POR_PAGINA, offset, status: status ?? undefined }), [status, offset]);

  const ir = (mudancas: Record<string, string | null>) => {
    const novo = new URLSearchParams(params);
    for (const [k, v] of Object.entries(mudancas)) {
      if (v === null) novo.delete(k);
      else novo.set(k, v);
    }
    setParams(novo);
  };

  const total = lista.dados?.total ?? 0;
  const ultimaPagina = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <div>
      <CabecalhoDePagina rotulo="Configurações" titulo="Gestão do acervo">
        Alimente a base científica: envie PDFs, acompanhe o processamento e remova documentos. Quem
        pesquisa consulta as fontes na Base científica; esta área é de administração.
      </CabecalhoDePagina>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <section aria-labelledby="titulo-lista" className="order-2 min-w-0 lg:order-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="titulo-lista" className="sr-only">
              Lista de documentos
            </h2>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
              {FILTROS.map((f) => (
                <button
                  key={f ?? "todos"}
                  type="button"
                  className="ficha"
                  aria-pressed={status === f}
                  onClick={() => ir({ status: f, pagina: null })}
                >
                  {f ? ROTULO_STATUS[f] : "Todos"}
                </button>
              ))}
            </div>
            {lista.tipo === "ok" && (
              <p className="numeros text-legenda text-texto-3" aria-live="polite">
                {contar(total, "documento", "documentos")}
              </p>
            )}
          </div>

          {lista.tipo === "erro" ? (
            <ErroDeCarregamento erro={lista.erro} aoTentarDeNovo={lista.recarregar} />
          ) : lista.tipo === "ok" && lista.dados.items.length === 0 ? (
            <div className="border-t border-linha pt-6">
              <EstadoVazio icone={<FileText size={22} strokeWidth={1.5} aria-hidden="true" />} titulo={status ? "Nenhum documento neste estado" : "Nenhum documento ainda"}>
                {status
                  ? "Troque o filtro para ver os outros documentos."
                  : "Envie o primeiro PDF. O texto de cada página e os metadados aparecem aqui."}
              </EstadoVazio>
            </div>
          ) : (
            <ListaDeDocumentos itens={lista.dados?.items ?? []} carregando={lista.tipo === "carregando"} destino={ROTAS.acervoDocumento} />
          )}

          {lista.tipo === "ok" && total > POR_PAGINA && (
            <nav aria-label="Paginação" className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="numeros text-legenda text-texto-3">
                {numero(offset + 1)}–{numero(Math.min(offset + POR_PAGINA, total))} de {numero(total)}
              </p>
              <div className="flex gap-2">
                <button type="button" className="botao botao-secundario botao-pequeno" disabled={pagina <= 1} onClick={() => ir({ pagina: String(pagina - 1) })}>
                  <ChevronLeft size={14} aria-hidden="true" />
                  Anterior
                </button>
                <button type="button" className="botao botao-secundario botao-pequeno" disabled={pagina >= ultimaPagina} onClick={() => ir({ pagina: String(pagina + 1) })}>
                  Próxima
                  <ChevronRight size={14} aria-hidden="true" />
                </button>
              </div>
            </nav>
          )}
        </section>

        <div className="order-1 lg:order-2">
          <Secao id="titulo-envio" titulo="Enviar PDF" emPainel>
            <EnvioDeDocumento aoConcluir={() => lista.recarregar()} />
          </Secao>
        </div>
      </div>
    </div>
  );
}
