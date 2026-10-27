import { ArrowLeft, BookOpen, ScanSearch } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link, useParams } from "react-router";
import { Epistemico } from "../components/Epistemico";
import { EstadoVazio, LinhasEsqueleto } from "../components/Estados";
import { AreaDeCenarios } from "../components/resultado/Cenarios";
import { type Aba, ProvedorDoResultado, useResultado } from "../components/resultado/contexto";
import { AreaDeEvidencias } from "../components/resultado/Evidencias";
import { LinhaDoTempo } from "../components/resultado/LinhaDoTempo";
import { FaixaDeCenarios, MapaDeAtores } from "../components/resultado/MapaDeAtores";
import { PainelContextual } from "../components/resultado/PainelContextual";
import { Citacoes } from "../components/resultado/pecas";
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
    <div className="z-20 -mx-1 overflow-x-auto border-b border-linha bg-abismo/95 px-1 backdrop-blur-md lg:sticky lg:top-[var(--altura-topo,61px)]">
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
  const { r, irPara } = useResultado();
  const principal = r.incertezas.find((i) => i.id === r.principalIncerteza)!;
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem] xl:gap-6">
      {/* O mapa vem primeiro na leitura: é a principal ferramenta de exploração. */}
      <div className="min-w-0 xl:col-start-1 xl:row-span-2 xl:row-start-1">
        <MapaDeAtores />
      </div>
      <div className="flex flex-col gap-4 xl:col-start-2 xl:row-start-1">
        <div className="flex flex-col gap-2">
          <p className="rotulo">Em síntese</p>
          <p className="max-w-[66ch] font-editorial text-leitura text-texto">{r.sintese}</p>
        </div>
        <div className="flex flex-col gap-1.5 rounded-padrao border border-ambar/35 p-3">
          <p className="flex items-center gap-1.5 text-micro text-ambar">
            <Epistemico tipo="incerteza" compacto /> Principal incerteza
          </p>
          <p className="text-corpo text-texto">{principal.nome}</p>
          <p className="text-legenda text-texto-2">{principal.pergunta}</p>
          <button type="button" className="w-fit text-legenda text-ciano-texto hover:underline" onClick={() => irPara("cenarios")}>
            Como ela separa os cenários
          </button>
        </div>
      </div>
      <div className="xl:col-start-2 xl:row-start-2">
        <FaixaDeCenarios vertical />
      </div>
    </div>
  );
}

function Conteudo() {
  const { r, aba, selecao, selecionar } = useResultado();

  // Mede a altura do cabeçalho do app para a barra de abas grudar logo abaixo dele.
  useEffect(() => {
    const topo = document.querySelector("header");
    if (topo) document.documentElement.style.setProperty("--altura-topo", `${Math.round(topo.getBoundingClientRect().height)}px`);
  }, []);

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
export function PaginaDaInvestigacao() {
  const { id = "" } = useParams();
  const [estado, setEstado] = useState<{ tipo: "carregando" } | { tipo: "pronto"; r: ResultadoDeInvestigacao } | { tipo: "ausente" }>(
    carregarExemplo ? { tipo: "carregando" } : { tipo: "ausente" },
  );

  useEffect(() => {
    if (!carregarExemplo) return;
    let vivo = true;
    carregarExemplo().then(({ INVESTIGACAO_EXEMPLO }) => {
      if (vivo) setEstado(INVESTIGACAO_EXEMPLO.id === id ? { tipo: "pronto", r: INVESTIGACAO_EXEMPLO } : { tipo: "ausente" });
    });
    return () => {
      vivo = false;
    };
  }, [id]);

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
