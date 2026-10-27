import { ArrowLeft, ArrowRight, BookOpen, ScanSearch, Waypoints } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link, useParams } from "react-router";
import { Epistemico } from "../components/Epistemico";
import { EstadoVazio, LinhasEsqueleto } from "../components/Estados";
import { AreaDeCenarios } from "../components/resultado/Cenarios";
import { type Aba, ProvedorDoResultado, useResultado } from "../components/resultado/contexto";
import { AreaDeEvidencias } from "../components/resultado/Evidencias";
import { LinhaDoTempo } from "../components/resultado/LinhaDoTempo";
import { PainelContextual } from "../components/resultado/PainelContextual";
import { Citacoes, Letra } from "../components/resultado/pecas";
import type { ResultadoDeInvestigacao } from "../lib/investigacao";
import { ROTAS } from "../lib/rotas";

const ABAS: { id: Aba; nome: string }[] = [
  { id: "visao", nome: "Visão geral" },
  { id: "cenarios", nome: "Cenários" },
  { id: "tempo", nome: "Linha do tempo" },
  { id: "fontes", nome: "Fontes" },
];

function dataLegivel(d: string) {
  const [a, m, dia] = d.split("-");
  const meses = ["jan.", "fev.", "mar.", "abr.", "maio", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
  return dia ? `${Number(dia)} ${meses[Number(m) - 1]} ${a}` : a;
}

function BarraDeAbas() {
  const { aba, irPara } = useResultado();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const teclado = (e: KeyboardEvent, i: number) => {
    const n = ABAS.length;
    const alvo = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (alvo < 0) return;
    e.preventDefault();
    irPara(ABAS[alvo].id);
    refs.current[alvo]?.focus();
  };
  return (
    <div className="z-20 -mx-1 overflow-x-auto border-b border-linha bg-abismo/95 px-1 backdrop-blur-md lg:sticky lg:top-[var(--altura-topo,0px)]">
      <div role="tablist" aria-label="Áreas da investigação" className="flex w-max gap-1">
        {ABAS.map((a, i) => (
          <button
            key={a.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`aba-${a.id}`}
            aria-selected={aba === a.id}
            aria-controls="painel-aba"
            tabIndex={aba === a.id ? 0 : -1}
            onClick={() => irPara(a.id)}
            onKeyDown={(e) => teclado(e, i)}
            className={`relative flex min-h-11 items-center px-3 text-corpo whitespace-nowrap transition-colors duration-150 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors after:duration-150 ${
              aba === a.id ? "text-texto after:bg-ciano" : "text-texto-2 after:bg-transparent hover:text-texto"
            }`}
          >
            {a.nome}
          </button>
        ))}
      </div>
    </div>
  );
}

function VisaoGeral() {
  const { r, irPara, setVista } = useResultado();
  const principal = r.incertezas.find((i) => i.id === r.principalIncerteza)!;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <p className="rotulo">Em síntese</p>
          <p className="max-w-[66ch] font-editorial text-leitura text-texto">{r.sintese}</p>
        </div>
        <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label="Cenários">
          {r.cenarios.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  setVista(c.id);
                  irPara("cenarios");
                }}
                className="flex w-full items-start gap-3 rounded-padrao border border-linha p-3 text-left transition-colors duration-150 hover:border-linha-forte"
              >
                <Letra id={c.id} />
                <span className="min-w-0">
                  <span className="block text-corpo text-texto">
                    {c.nome} <span className="text-micro text-texto-3">· {c.arquetipo}</span>
                  </span>
                  <span className="block text-legenda text-texto-2">{c.ideia}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-4">
        <Link
          to={ROTAS.relacoesDe(r.id)}
          className="group flex flex-col gap-2 rounded-painel border border-ciano/30 bg-ciano-suave p-4 transition-colors duration-150 hover:border-ciano/60"
        >
          <span className="flex items-center gap-2 text-corpo text-texto">
            <Waypoints size={17} aria-hidden="true" className="text-ciano" /> Explorar as relações no mapa
          </span>
          <span className="text-legenda text-texto-2">
            {r.atores.filter((a) => a.tipo === "estado").length} países, {r.blocos.length} blocos e como as conexões mudam nos cenários A, B e C.
          </span>
          <span className="inline-flex items-center gap-1 text-legenda text-ciano-texto group-hover:underline">
            Abrir Relações <ArrowRight size={14} aria-hidden="true" />
          </span>
        </Link>
        <div className="flex flex-col gap-1.5 rounded-padrao border border-ambar/35 p-3">
          <p className="flex items-center gap-1.5 text-micro text-ambar">
            <Epistemico tipo="incerteza" compacto /> Principal incerteza
          </p>
          <p className="text-corpo text-texto">{principal.nome}</p>
          <p className="text-legenda text-texto-2">{principal.pergunta}</p>
        </div>
      </div>
    </div>
  );
}

function Conteudo() {
  const { r, aba, selecao, selecionar } = useResultado();

  return (
    <article className={`flex flex-col gap-5 transition-[margin] duration-300 ${selecao ? "lg:mr-[380px] xl:mr-[360px]" : ""}`}>
      <Link to={ROTAS.investigacoes} className="inline-flex w-fit items-center gap-1.5 text-legenda text-texto-2 hover:text-texto">
        <ArrowLeft size={14} aria-hidden="true" />
        Investigações
      </Link>

      <header className="flex flex-col gap-2.5">
        <p className="rotulo">Investigação prospectiva · {r.natureza}</p>
        <h1 className="max-w-[44ch] font-editorial text-titulo font-medium tracking-[-0.01em] text-balance text-texto">{r.pergunta}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-legenda text-texto-2">
          <span className="numeros font-dados text-ambar">
            {r.horizonte.inicio}–{r.horizonte.fim}
          </span>
          <span aria-hidden="true" className="hidden text-texto-3 sm:inline">·</span>
          <span className="hidden sm:inline">{r.escopo}</span>
          <span aria-hidden="true" className="hidden text-texto-3 sm:inline">·</span>
          <span>
            Versão {r.versao}, {dataLegivel(r.atualizadoEm)}
          </span>
          <button
            type="button"
            onClick={() => selecionar({ tipo: "metodo", id: "metodo" })}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-linha-forte px-3 text-legenda text-texto-2 transition-colors duration-150 hover:border-texto-2 hover:text-texto sm:ml-auto"
          >
            <BookOpen size={14} aria-hidden="true" />
            Como esta análise foi feita
          </button>
        </div>
        <p className="max-w-[90ch] text-legenda text-texto-2">
          <span className="font-medium text-ambar">Contrafactual. </span>
          {r.avisoDeContexto.texto}
          <Citacoes ids={r.avisoDeContexto.evidencias} />
          <span className="text-texto-3"> Exemplo elaborado por IA, não pelo motor do Iris.</span>
        </p>
      </header>

      <BarraDeAbas />

      <div id="painel-aba" role="tabpanel" aria-labelledby={`aba-${aba}`} className="flex min-w-0 flex-col">
        {aba === "visao" && <VisaoGeral />}
        {aba === "cenarios" && <AreaDeCenarios />}
        {aba === "tempo" && <LinhaDoTempo />}
        {aba === "fontes" && <AreaDeEvidencias />}
      </div>

      <PainelContextual />
    </article>
  );
}

export function ResultadoInvestigacao({ r }: { r: ResultadoDeInvestigacao }) {
  return (
    <ProvedorDoResultado r={r}>
      <Conteudo />
    </ProvedorDoResultado>
  );
}

// ------------------------------------------------------------------ rota

// A condição fica escrita aqui (e não via PREVIA) para o build normal descartar o exemplo.
const carregarExemplo = import.meta.env.MODE === "previa" ? () => import("../previa/investigacao-exemplo") : null;

/**
 * `/app/investigacoes/:id`. Ainda não há API de investigações: fora da prévia, todo endereço
 * leva a um estado vazio honesto. Na prévia, o exemplo é carregado sob demanda (e não entra no
 * build normal).
 */
/** Carrega uma investigação pelo id. Sem API: só a prévia tem um exemplo. */
export function useInvestigacao(id: string | undefined) {
  const [estado, setEstado] = useState<{ tipo: "carregando" } | { tipo: "pronto"; r: ResultadoDeInvestigacao } | { tipo: "ausente" }>(
    carregarExemplo ? { tipo: "carregando" } : { tipo: "ausente" },
  );
  useEffect(() => {
    if (!carregarExemplo) return;
    let vivo = true;
    carregarExemplo().then(({ INVESTIGACAO_EXEMPLO }) => {
      // Sem id, abre a investigação principal (na prévia, o exemplo).
      if (vivo) setEstado(!id || INVESTIGACAO_EXEMPLO.id === id ? { tipo: "pronto", r: INVESTIGACAO_EXEMPLO } : { tipo: "ausente" });
    });
    return () => {
      vivo = false;
    };
  }, [id]);
  return estado;
}

export function PaginaDaInvestigacao() {
  const { id = "" } = useParams();
  const estado = useInvestigacao(id);
  if (estado.tipo === "carregando") return <LinhasEsqueleto linhas={6} />;
  if (estado.tipo === "pronto") return <ResultadoInvestigacao r={estado.r} />;
  return (
    <EstadoVazio
      icone={<ScanSearch size={22} strokeWidth={1.5} aria-hidden="true" />}
      titulo="Investigação não encontrada"
      marcador={{ tipo: "limitacao", rotulo: "Motor de investigação ainda não implementado" }}
      acao={
        <Link to={ROTAS.investigacoes} className="botao botao-secundario botao-pequeno">
          Voltar às investigações
        </Link>
      }
    >
      Ainda não há investigações processadas. Quando o motor existir, cada resultado terá um endereço próprio como este.
    </EstadoVazio>
  );
}

export default PaginaDaInvestigacao;
