/**
 * Um turno da conversa: a pergunta e a resposta da Iris. A resposta de análise segue a lógica orientada ao futuro:
 * diagnóstico estratégico → dinâmicas geopolíticas → cenários prospectivos (o núcleo, com maior destaque) →
 * indicadores e monitoramento → explorar (mapa, timeline, fontes e método, recolhidos). Monitoramento e exploração
 * só aparecem quando a análise termina. Cada resposta tem o seu próprio
 * ProvedorDoResultado (vista, seleção e painel), como na página completa da investigação.
 */
import { AlertTriangle, ArrowUpRight, BookmarkPlus, RotateCcw } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Horizonte } from "../../../hooks/useArmazenamentoLocal";
import { Link } from "react-router";
import { LinhasEsqueleto } from "../../common/Carregando";
import { ROTAS } from "../../../config/rotas";
import { useRascunhos } from "../../../hooks/useArmazenamentoLocal";
import type { EstadoDosCenarios, Etapa, Intencao, Turno as TipoTurno } from "../../../types/conversa";
import { useNotificar } from "../../../app/provedores/ProvedorDeNotificacoes";
import { ProvedorDoResultado, useResultado } from "../investigacao/contexto";
import { PainelContextual } from "../investigacao/PainelContextual";
import { useInvestigacao } from "../investigacao/hooks/useInvestigacao";
import { tentarDeNovo, useEtapas } from "./motor";
import { nomeDoHorizonte } from "./CampoDePergunta";
import { Complemento } from "./Complemento";
import { Processando } from "./Processando";
import { Diagnostico } from "./resposta/Diagnostico";
import { Dinamicas } from "./resposta/Dinamicas";
import { Exploracao, type Visualizacao } from "./resposta/Exploracao";
import { Monitoramento } from "./resposta/Monitoramento";
import { ancora, type Parte } from "./resposta/partes";
import { Prospectiva } from "./resposta/Prospectiva";
import { Trilha } from "./resposta/Trilha";

const HORA = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function Turno({ conversaId, turno, complementar, horizonte }: { conversaId: string; turno: TipoTurno; complementar: boolean; horizonte?: Horizonte }) {
  return (
    <article aria-labelledby={`p-${turno.id}`} data-turno={turno.id} className="turno flex flex-col gap-6">
      <header className="relative flex flex-col gap-1 pl-7">
        <span aria-hidden="true" className="absolute top-[7px] left-0 size-[9px] rounded-full border border-texto-3" />
        <p className="text-micro text-texto-3">
          {complementar ? "Pergunta complementar" : "Pergunta"} · <time dateTime={turno.criadoEm}>{HORA.format(new Date(turno.criadoEm))}</time>
          {horizonte && (
            <>
              {" "}· <span className="text-ambar">horizonte de {nomeDoHorizonte(horizonte)}</span>
            </>
          )}
        </p>
        <h2 id={`p-${turno.id}`} className="font-editorial text-secao text-texto">
          {turno.pergunta}
        </h2>
      </header>
      <div className="relative pl-7">
        <span aria-hidden="true" className="absolute top-[9px] left-[3px] size-[3px] rounded-full bg-ouro shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-ouro)_18%,transparent)]" />
        <span aria-hidden="true" className="absolute top-6 bottom-0 left-[4px] w-px bg-gradient-to-b from-ouro/40 via-linha to-transparent" />
        <RespostaDoTurno conversaId={conversaId} turno={turno} complementar={complementar} horizonte={horizonte} />
      </div>
    </article>
  );
}

function RespostaDoTurno({ conversaId, turno, complementar, horizonte }: { conversaId: string; turno: TipoTurno; complementar: boolean; horizonte?: Horizonte }) {
  const { processando, etapas } = useEtapas(turno.id);
  const r = turno.resposta;
  switch (r.tipo) {
    case "processando":
      // sem processamento em curso, a página foi recarregada no meio: a pergunta ficou sem resposta
      return processando ? (
        <Processando etapas={etapas} complementar={complementar} />
      ) : (
        <Falha mensagem="A resposta foi interrompida quando a página foi fechada ou recarregada." aoTentar={() => tentarDeNovo(conversaId, turno.id)} />
      );
    case "analise":
      return (
        <ComResultado id={r.investigacaoId} demonstracao={r.demonstracao} perguntaFeita={turno.pergunta}>
          <RespostaAnalitica cenarios={r.cenarios} gerando={processando ? etapas : null} />
        </ComResultado>
      );
    case "complemento":
      return (
        <ComResultado id={r.investigacaoId} demonstracao={r.demonstracao}>
          <RespostaComplementar intencao={r.intencao} />
        </ComResultado>
      );
    case "indisponivel":
      return <Indisponivel pergunta={turno.pergunta} horizonte={horizonte} />;
    case "erro":
      return <Falha mensagem={r.mensagem} aoTentar={() => tentarDeNovo(conversaId, turno.id)} />;
  }
}

/** Carrega o resultado da investigação e o oferece às partes da resposta. */
function ComResultado({ id, demonstracao, perguntaFeita, children }: { id: string; demonstracao: boolean; perguntaFeita?: string; children: ReactNode }) {
  const estado = useInvestigacao(id);
  if (estado.tipo === "carregando") return <LinhasEsqueleto linhas={4} />;
  if (estado.tipo === "ausente")
    return <Falha mensagem="O resultado desta investigação não está disponível neste navegador." />;
  const outraPergunta = perguntaFeita && perguntaFeita.trim() !== estado.r.pergunta.trim();
  return (
    <ProvedorDoResultado r={estado.r}>
      {demonstracao && !perguntaFeita && (
        <p className="mb-3 text-micro text-ambar">Demonstração · a partir da investigação de exemplo</p>
      )}
      {demonstracao && perguntaFeita && (
        <p className="mb-5 rounded-padrao border border-ambar/40 bg-ambar/5 px-3.5 py-2.5 text-legenda text-texto-2">
          <span className="font-medium text-ambar">Demonstração.</span> Resposta montada com a investigação de exemplo, não pelo motor da Iris
          {outraPergunta ? (
            <>
              . Ela responde a outra pergunta: <em className="text-texto">“{estado.r.pergunta}”</em>
            </>
          ) : null}
          .
        </p>
      )}
      {children}
      <PainelContextual />
    </ProvedorDoResultado>
  );
}

function RespostaAnalitica({ cenarios, gerando }: { cenarios: EstadoDosCenarios; gerando: Etapa[] | null }) {
  const { r, setVista } = useResultado();
  const [aberta, setAberta] = useState<Visualizacao | null>(null);
  // a análise só está concluída com os cenários prontos e nada mais em processamento
  const concluida = cenarios === "prontos" && !gerando;
  const prontas: Parte[] = concluida ? ["diagnostico", "dinamicas", "cenarios", "monitoramento", "explorar"] : ["diagnostico", "dinamicas"];
  const verNoMapa = (id: "A" | "B" | "C") => {
    setVista(id);
    setAberta("mapa");
    requestAnimationFrame(() => document.getElementById(`${ancora(r.id, "explorar")}-mapa`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  return (
    <div className="flex flex-col gap-12">
      <Trilha rid={r.id} prontas={prontas} />
      <div className="flex max-w-[46rem] flex-col gap-12">
        <Diagnostico />
        <Dinamicas />
      </div>
      <div className="flex flex-col gap-3">
        <Prospectiva gerando={cenarios === "gerando"} aoVerNoMapa={(c) => verNoMapa(c.id)} />
        {gerando && cenarios === "gerando" && <Processando etapas={gerando} />}
      </div>
      {concluida && (
        <>
          <div className="max-w-[46rem]">
            <Monitoramento />
          </div>
          <Exploracao aberta={aberta} aoAbrir={setAberta} />
          <Link to={ROTAS.investigacao(r.id)} className="inline-flex w-fit items-center gap-1.5 text-legenda text-texto-2 underline-offset-4 hover:text-texto hover:underline">
            Abrir a investigação completa em página inteira
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </>
      )}
    </div>
  );
}

function RespostaComplementar({ intencao }: { intencao: Intencao }) {
  return (
    <div className="max-w-[46rem]">
      <Complemento intencao={intencao} />
    </div>
  );
}

function Indisponivel({ pergunta, horizonte = 5 }: { pergunta: string; horizonte?: Horizonte }) {
  const { salvar } = useRascunhos();
  const notificar = useNotificar();
  const [salvo, setSalvo] = useState<string | null>(null);
  const guardar = () => {
    const { rascunho, gravado } = salvar({ pergunta, horizonte, regioes: [], dimensoes: [], profundidade: "padrao" });
    if (gravado) setSalvo(rascunho.id);
    else notificar("erro", "Não foi possível salvar: o armazenamento do navegador está bloqueado.");
  };
  return (
    <div className="flex max-w-[46rem] flex-col gap-3 text-corpo leading-[1.7] text-texto-2">
      <p className="flex items-start gap-2.5 text-texto">
        <AlertTriangle size={17} aria-hidden="true" className="mt-1 shrink-0 text-ambar" />
        A Iris ainda não consegue responder: o motor de investigação não está disponível no servidor.
      </p>
      <p>
        A pergunta ficou registrada nesta conversa. Você pode guardá-la como rascunho de investigação e ajustar horizonte, regiões e
        dimensões; quando o motor existir, ela poderá ser processada.
      </p>
      {salvo ? (
        <Link to={ROTAS.rascunho(salvo)} className="botao botao-secundario botao-pequeno w-fit">
          Rascunho salvo · abrir e ajustar
        </Link>
      ) : (
        <button type="button" onClick={guardar} className="botao botao-secundario botao-pequeno w-fit">
          <BookmarkPlus size={14} aria-hidden="true" />
          Guardar como rascunho
        </button>
      )}
    </div>
  );
}

function Falha({ mensagem, aoTentar }: { mensagem: string; aoTentar?: () => void }) {
  return (
    <div className="flex max-w-[46rem] flex-col gap-3">
      <p className="flex items-start gap-2.5 text-corpo text-texto-2">
        <AlertTriangle size={17} aria-hidden="true" className="mt-1 shrink-0 text-ambar" />
        {mensagem}
      </p>
      {aoTentar && (
        <button type="button" onClick={aoTentar} className="botao botao-secundario botao-pequeno w-fit">
          <RotateCcw size={14} aria-hidden="true" />
          Tentar de novo
        </button>
      )}
    </div>
  );
}
