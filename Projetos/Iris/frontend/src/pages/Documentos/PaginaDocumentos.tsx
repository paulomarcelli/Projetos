/**
 * Documentos (/app/documentos e /app/documentos/:id), tela "Editor de policy brief" do docs/design-system.md.
 *
 * - A folha é sempre clara (o que vai ser entregue), sobre a mesa escura (`.folha`, em styles/globais.css).
 * - Tipos: policy brief, boletim de conjuntura e dossiê temático.
 * - Texto sugerido pela IA fica em fundo âmbar-suave com filete âmbar até alguém aceitar, editar ou descartar; cada
 *   decisão atualiza o registro de uso de IA daquele pedido.
 * - Painel: as fontes (conferida ou não no texto) e o registro de uso de IA, exportável.
 * - "Exportar PDF com anexos" imprime a folha com o registro de IA e as fontes como anexo (folha de impressão).
 *
 * Ainda não há servidor de documentos (contrato em types/observatorio.ts): fora da prévia, a lista diz isso; na
 * prévia, o documento de exemplo abre marcado como exemplo, e as decisões valem só nesta aba.
 */
import { ArrowLeft, Check, Diamond, Download, FileText, Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { Epistemico } from "../../components/common/Epistemico";
import { EstadoVazio } from "../../components/common/EstadoVazio";
import { RegistroDeIA, quandoCurto } from "../../components/common/RegistroDeIA";
import { dataDoDia, Versao } from "../../components/common/Versao";
import { PREVIA } from "../../config/env";
import { ROTAS } from "../../config/rotas";
import { DOCUMENTO_EXEMPLO, HOJE_DO_EXEMPLO } from "../../previa/observatorio-exemplo";
import { NOME_DO_TIPO, type Documento, type DecisaoDeRevisao, type RegistroDeUsoDeIA, type TipoDeDocumento, type Trecho } from "../../types/observatorio";

const TIPOS: TipoDeDocumento[] = ["policy-brief", "boletim", "dossie"];
const citacoes = (ns: number[]) => (ns.length ? ` [${ns.join("], [")}]` : "");

/** O registro de IA e as fontes como texto, para anexar (o mesmo conteúdo do anexo do PDF). */
export function registroComoTexto(d: Documento, exemplo = false): string {
  const linhas = [...(exemplo ? [`> Dados de exemplo: equipes, fontes e registros fictícios, só para mostrar a interface.`, ``] : []), `# Registro de uso de IA e fontes`, ``, `${NOME_DO_TIPO[d.tipo]}: ${d.titulo}`, `${d.equipe} · cenário ${d.cenario.id}, v${d.cenario.versao}`, ``, `## Uso de IA`];
  for (const r of d.registros)
    linhas.push(
      ``,
      `- ${quandoCurto(r.quando)}: ${r.pedido}`,
      `  ${r.feito}`,
      `  ${r.modelo} · fontes ${r.fontes.map((n) => `[${n}]`).join(" ")}`,
      `  ${r.revisao.estado === "revisado" ? `Revisado por ${r.revisao.por} em ${dataDoDia(r.revisao.em)}${r.revisao.decisao ? ` (${r.revisao.decisao})` : ""}` : "Aguardando revisão humana"}`,
    );
  linhas.push(``, `## Fontes`);
  for (const f of d.fontes) linhas.push(``, `[${f.numero}] ${f.titulo}. ${f.origem}. ${f.conferida ? "Conferida no texto." : "Não conferida no texto."}`);
  return linhas.join("\n") + "\n";
}

function baixar(nome: string, texto: string) {
  const url = URL.createObjectURL(new Blob([texto], { type: "text/markdown;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  // revogar no mesmo tick cancela o download no Firefox e no Safari
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Um trecho sugerido pela IA, com as três decisões. */
type Decisao = { aceitar: string; editado: boolean } | { descartar: true };

function TrechoSugerido({ t, registro, aoDecidir }: { t: Trecho; registro?: RegistroDeUsoDeIA; aoDecidir: (d: Decisao) => void }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(t.texto);
  const campo = useRef<HTMLTextAreaElement>(null);
  // ao abrir a edição, o foco vai para o campo
  useEffect(() => {
    if (editando) campo.current?.focus();
  }, [editando]);
  return (
    // alvo do foco depois de uma decisão em outro trecho (o próximo sugerido)
    <div data-sugerido tabIndex={-1} aria-label="Trecho sugerido pela IA" className="trecho-sugerido flex flex-col gap-3 p-4 outline-offset-2 focus-visible:outline-2 focus-visible:outline-ciano">
      <p className="m-0 text-micro text-ambar">
        Sugerido pela IA · aguardando revisão{registro ? ` · a partir das fontes ${registro.fontes.map((n) => `[${n}]`).join("")}` : ""}
      </p>
      {editando ? (
        <label className="flex flex-col gap-1">
          <span className="sr-only">Editar o trecho sugerido</span>
          <textarea ref={campo} value={texto} onChange={(e) => setTexto(e.target.value)} rows={5} className="campo w-full resize-y bg-institucional text-[1rem] leading-[1.75]" />
        </label>
      ) : (
        <p className="m-0 text-[1rem] leading-[1.75] text-texto">
          {t.texto}
          {citacoes(t.citacoes)}.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => aoDecidir({ aceitar: editando ? texto : t.texto, editado: editando && texto !== t.texto })} className="botao botao-secundario botao-pequeno">
          {editando ? "Salvar e marcar como revisado" : "Aceitar e marcar como revisado"}
        </button>
        {!editando && (
          <button type="button" onClick={() => setEditando(true)} className="inline-flex min-h-11 items-center px-3 text-corpo text-ciano-texto hover:underline">
            Editar
          </button>
        )}
        <button type="button" onClick={() => aoDecidir({ descartar: true })} className="inline-flex min-h-11 items-center px-3 text-corpo text-ciano-texto hover:underline">
          Descartar
        </button>
      </div>
    </div>
  );
}

/** O editor (exportado para os testes). */
export function EditorDeDocumento({ inicial, hoje }: { inicial: Documento; hoje: string }) {
  const [d, setD] = useState(inicial);
  const [anuncio, setAnuncio] = useState("");
  const [focar, setFocar] = useState(0);
  const titulo = useRef<HTMLHeadingElement>(null);
  const folha = useRef<HTMLElement>(null);
  // Depois de aceitar ou descartar, o trecho some: o foco vai para o próximo trecho sugerido ou, sem nenhum, para o
  // título do documento.
  useEffect(() => {
    if (!focar) return;
    (folha.current?.querySelector<HTMLElement>("[data-sugerido]") ?? titulo.current)?.focus();
  }, [focar]);
  const decidir = (secao: string, trecho: Trecho, decisao: Decisao) => {
    const qual: DecisaoDeRevisao = "descartar" in decisao ? "descartado" : decisao.editado ? "editado" : "aceito";
    setAnuncio(`Trecho ${qual} e registrado como revisado no registro de uso de IA.`);
    setFocar((n) => n + 1);
    setD((x) => ({
      ...x,
      secoes: x.secoes.map((s) =>
        s.id !== secao
          ? s
          : {
              ...s,
              trechos:
                "descartar" in decisao
                  ? s.trechos.filter((t) => t.id !== trecho.id)
                  : s.trechos.map((t) => (t.id === trecho.id ? { ...t, texto: decisao.aceitar, sugerido: undefined } : t)),
            },
      ),
      registros: x.registros.map((r) =>
        r.id === trecho.sugerido?.registro
          ? {
              ...r,
              revisao: { estado: "revisado", por: x.equipe, em: hoje, decisao: qual },
            }
          : r,
      ),
    }));
  };
  const conferidas = d.fontes.filter((f) => f.conferida).length;
  const revisados = d.registros.filter((r) => r.revisao.estado === "revisado").length;

  return (
    <div className="flex flex-col gap-6">
      <p role="status" aria-live="polite" className="sr-only">
        {anuncio}
      </p>
      <header className="flex flex-col gap-4 border-b border-linha pb-4 lg:flex-row lg:items-center lg:justify-between print:hidden">
        <div className="flex min-w-0 flex-col gap-1">
          <Link to={ROTAS.observatorio} className="inline-flex w-fit items-center gap-1.5 text-legenda text-texto-2 hover:text-texto">
            <ArrowLeft size={14} aria-hidden="true" />
            Observatório · {d.equipe} · prazo {dataDoDia(d.prazo).slice(0, 5)}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="m-0 text-secao font-normal text-texto">{d.titulo.split(":")[0]}</h1>
            <Versao numero={d.versao} estado="rascunho" />
            {PREVIA && <span className="rounded-fino bg-grafite px-2 py-1 text-micro text-texto-2">Dados de exemplo</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Tipo de documento" className="flex flex-wrap gap-2">
            {TIPOS.map((t) => (
              <button key={t} type="button" aria-pressed={d.tipo === t} onClick={() => setD((x) => ({ ...x, tipo: t }))} className="ficha">
                {NOME_DO_TIPO[t]}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => window.print()} className="botao botao-primario">
            <Printer size={16} aria-hidden="true" />
            Exportar PDF com anexos
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[11rem_minmax(0,1fr)_20rem]">
        <nav aria-label="Estrutura do documento" className="hidden flex-col gap-1 lg:flex print:hidden">
          <p className="m-0 mb-1 text-micro text-texto-3">Estrutura</p>
          {d.secoes.map((s) => (
            <a key={s.id} href={`#doc-${s.id}`} className="py-1 text-legenda text-texto-2 hover:text-texto">
              {s.titulo}
            </a>
          ))}
          <a href="#doc-fontes" className="py-1 text-legenda text-texto-2 hover:text-texto">
            Fontes · {d.fontes.length}
          </a>
          <a href="#doc-registro" className="py-1 text-legenda text-texto-2 hover:text-texto">
            Anexo: uso de IA
          </a>
        </nav>

        {/* a mesa (mar) com a folha clara */}
        <div className="min-w-0 rounded-painel bg-mar p-2 sm:p-6 print:bg-transparent print:p-0">
          <article ref={folha} aria-label="Folha do documento" className="folha mx-auto flex max-w-[42rem] flex-col gap-6 rounded-fino px-5 py-8 shadow-elevado sm:px-10 sm:py-12">
            <p className="m-0 font-dados text-micro text-texto-3">
              {NOME_DO_TIPO[d.tipo]} · Observatório de Comércio Exterior · cenário {d.cenario.id}, v{d.cenario.versao}
            </p>
            <h2 ref={titulo} tabIndex={-1} className="m-0 text-[1.75rem] leading-[1.2] font-semibold text-texto outline-offset-4 focus-visible:outline-2 focus-visible:outline-ciano">
              {d.titulo}
            </h2>
            {d.secoes.map((s) => (
              <section key={s.id} id={`doc-${s.id}`} aria-labelledby={`t-doc-${s.id}`} className="flex scroll-mt-20 flex-col gap-4">
                <h3 id={`t-doc-${s.id}`} className="m-0 text-secao font-normal text-texto">
                  {s.titulo}
                </h3>
                {s.trechos.length === 0 && <p className="m-0 text-legenda text-texto-3 italic">Seção ainda vazia.</p>}
                {s.trechos.map((t) =>
                  t.sugerido ? (
                    <TrechoSugerido key={t.id} t={t} registro={d.registros.find((r) => r.id === t.sugerido?.registro)} aoDecidir={(x) => decidir(s.id, t, x)} />
                  ) : (
                    <div key={t.id} className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                      <span className="shrink-0 pt-1">
                        <Epistemico tipo="fato" />
                      </span>
                      <p className="m-0 text-[1rem] leading-[1.75] text-texto">
                        {t.texto}
                        {citacoes(t.citacoes)}.
                      </p>
                    </div>
                  ),
                )}
                {s.id === "cenarios" && (
                  <div className="flex items-center gap-3 rounded-padrao border border-linha-forte p-4">
                    <span aria-hidden="true" className="inline-grid size-7 shrink-0 place-items-center rounded-fino bg-ouro font-medium text-institucional">
                      {d.cenario.id}
                    </span>
                    <p className="m-0 font-dados text-micro text-texto-3">
                      Cenário {d.cenario.id} citado na versão v{d.cenario.versao}
                    </p>
                  </div>
                )}
              </section>
            ))}
          </article>
        </div>

        <aside aria-label="Fontes e uso de IA" className="flex min-w-0 flex-col gap-6">
          <section id="doc-fontes" aria-labelledby="t-fontes" className="flex scroll-mt-20 flex-col gap-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="t-fontes" className="m-0 text-corpo font-medium text-texto">
                Fontes
              </h2>
              <p className="numeros m-0 font-dados text-micro text-texto-3">
                {conferidas} de {d.fontes.length} conferidas
              </p>
            </div>
            <ol className="m-0 flex list-none flex-col gap-4 p-0">
              {d.fontes.map((f) => (
                <li key={f.numero} className="flex gap-3">
                  <span className="numeros shrink-0 font-dados text-micro text-ciano-texto">[{f.numero}]</span>
                  <div className="flex flex-col gap-0.5">
                    <p className="m-0 text-legenda text-texto">{f.titulo}</p>
                    <p className="m-0 font-dados text-micro text-texto-3">{f.origem}</p>
                    {f.conferida ? (
                      <p className="m-0 inline-flex items-center gap-1 text-micro text-positivo">
                        <Check size={13} aria-hidden="true" />
                        Conferida no texto
                      </p>
                    ) : (
                      <p className="m-0 inline-flex items-center gap-1 text-micro text-ambar">
                        <Diamond size={12} aria-hidden="true" />
                        Fonte não conferida no texto
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <section id="doc-registro" aria-labelledby="t-registro" className="flex scroll-mt-20 flex-col gap-3 border-t border-linha pt-5">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="t-registro" className="m-0 text-corpo font-medium text-texto">
                Registro de uso de IA
              </h2>
              <p className="numeros m-0 font-dados text-micro text-texto-3">
                {revisados} de {d.registros.length} revisados
              </p>
            </div>
            {d.registros.map((r) => (
              <RegistroDeIA key={r.id} r={r} />
            ))}
            <button type="button" onClick={() => baixar(`registro-ia-${d.id}.md`, registroComoTexto(d, PREVIA))} className="botao botao-secundario print:hidden">
              <Download size={16} aria-hidden="true" />
              Exportar registro de IA e fontes
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

export function PaginaDocumentos() {
  const { id } = useParams();
  const documentos = PREVIA ? [DOCUMENTO_EXEMPLO] : [];
  const doc = id ? documentos.find((x) => x.id === id) : undefined;
  if (doc) return <EditorDeDocumento inicial={doc} hoje={HOJE_DO_EXEMPLO} />;
  if (id)
    return (
      <EstadoVazio
        icone={<FileText size={22} strokeWidth={1.5} aria-hidden="true" />}
        titulo="Documento não encontrado"
        acao={
          <Link to={ROTAS.documentos} className="botao botao-secundario botao-pequeno">
            Ver os documentos
          </Link>
        }
      >
        O endereço pode estar errado, ou o documento ainda não existe neste navegador.
      </EstadoVazio>
    );
  if (documentos.length === 0)
    return (
      <EstadoVazio
        icone={<FileText size={22} strokeWidth={1.5} aria-hidden="true" />}
        titulo="Os documentos aparecem aqui"
        acao={
          <Link to={ROTAS.investigacoes} className="botao botao-secundario botao-pequeno">
            Ver as investigações
          </Link>
        }
      >
        Policy brief, boletim e dossiê escritos a partir de uma investigação, com as fontes e o registro de uso de IA. O servidor de documentos
        ainda não existe.
      </EstadoVazio>
    );
  return (
    <div className="mx-auto flex w-full max-w-[67.5rem] flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="m-0 text-titulo font-normal text-texto">Documentos</h1>
        <span className="rounded-fino bg-grafite px-2 py-1 text-micro text-texto-2">Dados de exemplo</span>
      </div>
      <ul className="m-0 list-none border-t border-linha p-0">
        {documentos.map((x) => (
          <li key={x.id} className="border-b border-linha">
            <Link to={ROTAS.documento(x.id)} className="flex flex-col gap-0.5 px-1 py-4 hover:bg-grafite">
              <span className="text-corpo text-texto">
                {NOME_DO_TIPO[x.tipo]} · {x.titulo}
              </span>
              <span className="text-legenda text-texto-3">
                {x.equipe} · cenário {x.cenario.id}, v{x.cenario.versao} · prazo {dataDoDia(x.prazo)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PaginaDocumentos;
