import { FileUp, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Link } from "react-router";
import { enviarDocumento, ErroApi } from "../../../services/api";
import { type MetadadosUpload, type RespostaUpload } from "../../../types/api";
import { tamanho, tituloDoDocumento } from "../../../utils/formatadores";
import { Aviso } from "../../common/Aviso";
import { useNotificar } from "../../../app/provedores/ProvedorDeNotificacoes";
import { ROTAS } from "../../../config/rotas";

const CAMPOS: { campo: keyof MetadadosUpload; rotulo: string; dica?: string; tipo?: string; largo?: boolean }[] = [
  { campo: "title", rotulo: "Título", largo: true },
  { campo: "authors", rotulo: "Autores", dica: "Separe com ponto e vírgula: Silva, Ana; Pérez, José", largo: true },
  { campo: "publication_year", rotulo: "Ano de publicação", tipo: "number" },
  { campo: "language", rotulo: "Idioma", dica: "pt, en, es…" },
  { campo: "journal", rotulo: "Periódico" },
  { campo: "publisher", rotulo: "Editora" },
  { campo: "institution", rotulo: "Instituição" },
  { campo: "doi", rotulo: "DOI", dica: "10.xxxx/…" },
  { campo: "source_url", rotulo: "URL de origem", tipo: "url", largo: true },
];

/** Envio de PDF com progresso real. A validação definitiva é sempre a do servidor. */
export function EnvioDeDocumento({ aoConcluir }: { aoConcluir: (doc: RespostaUpload) => void }) {
  const id = useId();
  const notificar = useNotificar();
  const entrada = useRef<HTMLInputElement>(null);
  const cancelador = useRef<AbortController | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [metadados, setMetadados] = useState<MetadadosUpload>({});
  const [progresso, setProgresso] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<RespostaUpload | null>(null);

  const escolher = (f: File | undefined | null) => {
    setResultado(null);
    setErro(null);
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      setErro("Escolha um arquivo .pdf.");
      return;
    }
    if (f.size === 0) {
      setErro("O arquivo está vazio.");
      return;
    }
    setArquivo(f);
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivo) {
      setErro("Escolha um PDF para enviar.");
      entrada.current?.focus();
      return;
    }
    setErro(null);
    setProgresso(0);
    cancelador.current = new AbortController();
    try {
      const doc = await enviarDocumento(arquivo, metadados, setProgresso, cancelador.current.signal);
      setResultado(doc);
      setArquivo(null);
      setMetadados({});
      if (entrada.current) entrada.current.value = "";
      if (doc.duplicate) notificar("info", "Este arquivo já estava no acervo; nada novo foi gravado.");
      else if (doc.status === "failed") notificar("erro", "O documento foi recebido, mas o processamento falhou.");
      else notificar("sucesso", "Documento recebido e processado.");
      aoConcluir(doc);
    } catch (falha) {
      setErro(falha instanceof ErroApi ? falha.message : "Não foi possível enviar o arquivo.");
    } finally {
      setProgresso(null);
      cancelador.current = null;
    }
  };

  const enviando = progresso !== null;

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <label
        htmlFor={`${id}-arquivo`}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          escolher(e.dataTransfer.files?.[0]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-padrao border border-dashed px-4 py-8 text-center transition-colors duration-150 ${
          arrastando ? "border-ciano bg-ciano-suave" : "border-linha-forte hover:border-texto-3 hover:bg-grafite/50"
        }`}
      >
        <FileUp size={22} strokeWidth={1.5} aria-hidden="true" className={arrastando ? "text-ciano" : "text-texto-3"} />
        <span className="text-corpo text-texto">
          {arquivo ? "Trocar o arquivo" : "Arraste um PDF aqui ou clique para escolher"}
        </span>
        <span className="text-micro text-texto-3">PDF com texto. PDFs escaneados são aceitos, mas sem OCR o texto não é extraído.</span>
        <input
          ref={entrada}
          id={`${id}-arquivo`}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={enviando}
          onChange={(e) => escolher(e.target.files?.[0])}
        />
      </label>

      {arquivo && (
        <div className="flex items-center gap-3 rounded-padrao border border-linha bg-abismo px-3 py-2">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-corpo text-texto" title={arquivo.name}>
              {arquivo.name}
            </span>
            <span className="numeros text-micro text-texto-3">{tamanho(arquivo.size)}</span>
          </span>
          {!enviando && (
            <button type="button" className="botao botao-fantasma botao-pequeno px-2" aria-label="Remover arquivo escolhido" onClick={() => setArquivo(null)}>
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <details className="group rounded-padrao border border-linha">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-legenda text-texto-2 select-none hover:text-texto">
          <span className="inline-block w-4 transition-transform duration-150 group-open:rotate-90" aria-hidden="true">›</span>
          Dados bibliográficos (opcional) — têm prioridade sobre os do PDF
        </summary>
        <div className="grid gap-3 border-t border-linha p-3 sm:grid-cols-2">
          {CAMPOS.map((c) => (
            <div key={c.campo} className={c.largo ? "sm:col-span-2" : undefined}>
              <label htmlFor={`${id}-${c.campo}`} className="mb-1 block text-legenda text-texto-2">
                {c.rotulo}
              </label>
              <input
                id={`${id}-${c.campo}`}
                type={c.tipo ?? "text"}
                inputMode={c.tipo === "number" ? "numeric" : undefined}
                className="campo"
                value={metadados[c.campo] ?? ""}
                disabled={enviando}
                aria-describedby={c.dica ? `${id}-${c.campo}-dica` : undefined}
                onChange={(e) => setMetadados((m) => ({ ...m, [c.campo]: e.target.value }))}
              />
              {c.dica && (
                <p id={`${id}-${c.campo}-dica`} className="mt-1 text-micro text-texto-3">
                  {c.dica}
                </p>
              )}
            </div>
          ))}
        </div>
      </details>

      {enviando && (
        <div className="flex flex-col gap-1.5" role="status" aria-live="polite">
          <div className="h-1 overflow-hidden rounded-full bg-grafite">
            <div className="h-full origin-left bg-ciano transition-transform duration-200 ease-linear" style={{ transform: `scaleX(${progresso ?? 0})` }} />
          </div>
          <p className="text-micro text-texto-3">
            {progresso !== null && progresso < 1
              ? `Enviando… ${Math.round((progresso ?? 0) * 100)}%`
              : "Validando, extraindo o texto e lendo os metadados…"}
          </p>
        </div>
      )}

      {erro && (
        <div className="aparecer">
          <Aviso tom="erro" titulo="Envio recusado">
            {erro}
          </Aviso>
        </div>
      )}

      {resultado && !enviando && (
        <div className="aparecer">
        <Aviso tom={resultado.status === "failed" ? "erro" : resultado.duplicate ? "neutro" : "sucesso"}>
          {resultado.duplicate ? "Já estava no acervo: " : resultado.status === "failed" ? "Recebido, mas falhou: " : "Processado: "}
          <Link to={ROTAS.acervoDocumento(resultado.id)} className="text-ciano-texto underline-offset-4 hover:underline [overflow-wrap:anywhere]">
            {tituloDoDocumento(resultado).texto}
          </Link>
        </Aviso>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="botao botao-primario" disabled={enviando}>
          {enviando ? "Processando…" : "Enviar documento"}
        </button>
        {enviando && (
          <button type="button" className="botao botao-fantasma" onClick={() => cancelador.current?.abort()}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
