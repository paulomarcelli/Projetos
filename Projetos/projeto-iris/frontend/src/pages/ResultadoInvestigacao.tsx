import { ArrowLeft, ScanSearch } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link, useParams } from "react-router";
import { Epistemico } from "../components/Epistemico";
import { EstadoVazio, LinhasEsqueleto } from "../components/Estados";
import { FatoresDeMudanca, FLUXO, MetodoERevisao } from "../components/resultado/Analise";
import { AreaDeCenarios } from "../components/resultado/Cenarios";
import { type Aba, ProvedorDoResultado, useResultado } from "../components/resultado/contexto";
import { AreaDeEvidencias } from "../components/resultado/Evidencias";
import { LinhaDoTempo } from "../components/resultado/LinhaDoTempo";
import { MapaDeAtores } from "../components/resultado/MapaDeAtores";
import { PainelContextual } from "../components/resultado/PainelContextual";
import { Citacoes, SeletorDeVista } from "../components/resultado/pecas";
import type { ResultadoDeInvestigacao } from "../lib/investigacao";
import { ROTAS } from "../lib/rotas";

const ABAS: { id: Aba; nome: string }[] = [
  { id: "sistema", nome: "Sistema" },
  { id: "fatores", nome: "Fatores de mudança" },
  { id: "cenarios", nome: "Cenários" },
  { id: "tempo", nome: "Linha do tempo" },
  { id: "evidencias", nome: "Evidências" },
  { id: "metodo", nome: "Método e revisão" },
];

function dataLegivel(d: string) {
  const [a, m, dia] = d.split("-");
  const meses = ["jan.", "fev.", "mar.", "abr.", "maio", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
  return dia ? `${Number(dia)} ${meses[Number(m) - 1]} ${a}` : a;
}

function BarraDeAbas() {
  const { aba, irPara, selecao } = useResultado();
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
    <div className={`z-20 -mx-1 flex flex-col gap-3 border-y border-linha bg-abismo/95 px-1 py-2 backdrop-blur-md lg:sticky lg:top-[var(--altura-topo,61px)] ${selecao ? "" : "xl:flex-row xl:items-center xl:justify-between"}`}>
      <div className="relative -mx-1 overflow-x-auto px-1">
        <div role="tablist" aria-label="Áreas da investigação" className="flex w-max gap-0.5">
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
              className={`flex min-h-10 items-center gap-1.5 rounded-padrao px-3 text-legenda whitespace-nowrap transition-colors ${
                aba === a.id ? "bg-grafite-alto text-texto" : "text-texto-2 hover:bg-grafite hover:text-texto"
              }`}
            >
              <span className="numeros font-dados text-micro text-texto-3">{i + 1}</span>
              {a.nome}
            </button>
          ))}
        </div>
      </div>
      {aba !== "metodo" && aba !== "fatores" && <SeletorDeVista comPresente={aba !== "cenarios"} />}
    </div>
  );
}

function Conteudo() {
  const { r, ix, aba, irPara, selecao } = useResultado();
  const principal = r.incertezas.find((i) => i.id === r.principalIncerteza)!;
  const passo = FLUXO.find((f) => f.aba === aba)!;

  // Mede a altura do cabeçalho do app para a barra de abas grudar logo abaixo dele.
  useEffect(() => {
    const topo = document.querySelector("header");
    if (topo) document.documentElement.style.setProperty("--altura-topo", `${Math.round(topo.getBoundingClientRect().height)}px`);
  }, []);

  return (
    <article className={`flex flex-col gap-6 transition-[margin] duration-300 ${selecao ? "lg:mr-[380px] xl:mr-[360px]" : ""}`}>
      <Link to={ROTAS.investigacoes} className="inline-flex w-fit items-center gap-1.5 text-legenda text-texto-2 hover:text-texto">
        <ArrowLeft size={14} aria-hidden="true" />
        Investigações
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="rotulo">Investigação prospectiva · {r.natureza}</p>
          <Epistemico tipo="limitacao" rotulo="Exemplo ilustrativo, elaborado por IA, não pelo motor do Iris" />
        </div>
        <h1 className="max-w-[44ch] font-editorial text-titulo font-medium tracking-[-0.01em] text-balance text-texto">{r.pergunta}</h1>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-legenda text-texto-2">
          <span>
            Horizonte{" "}
            <span className="numeros font-dados text-ambar">
              {r.horizonte.inicio}–{r.horizonte.fim}
            </span>
          </span>
          <span>{r.escopo}</span>
          <span>{r.dimensoes.join(" · ")}</span>
          <span>
            Versão {r.versao} · {dataLegivel(r.atualizadoEm)}
          </span>
        </p>
        <p className="flex max-w-[80ch] flex-wrap items-start gap-2 rounded-padrao border border-ambar/35 bg-ambar-suave px-3 py-2 text-legenda text-texto">
          <span className="font-medium">Contrafactual.</span>
          <span className="min-w-0 flex-1">
            {r.avisoDeContexto.texto}
            <Citacoes ids={r.avisoDeContexto.evidencias} />
          </span>
        </p>
      </header>

      {/* primeira leitura: síntese curta e a principal incerteza; o mapa vem logo abaixo */}
      <section aria-label="Visão geral" className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-2">
          <p className="rotulo">Síntese</p>
          <p className="max-w-[66ch] font-editorial text-leitura text-texto">{r.sintese}</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-legenda">
            <button type="button" className="text-ciano-texto hover:underline" onClick={() => irPara("cenarios")}>
              {r.cenarios.length} cenários: {r.cenarios.map((c) => c.arquetipo.toLowerCase()).join(", ")}
            </button>
            <button type="button" className="text-ciano-texto hover:underline" onClick={() => irPara("evidencias")}>
              {r.evidencias.length} evidências · {r.fontes.length} fontes
            </button>
          </p>
        </div>
        <div className="flex flex-col gap-1.5 rounded-padrao border border-ambar/35 p-3.5">
          <p className="flex items-center gap-2 text-micro text-ambar">
            <Epistemico tipo="incerteza" compacto /> Principal incerteza estratégica
          </p>
          <p className="font-editorial text-corpo text-texto">{principal.nome}</p>
          <p className="text-legenda text-texto-2">{principal.pergunta}</p>
          <button type="button" className="w-fit text-legenda text-ciano-texto hover:underline" onClick={() => irPara("fatores")}>
            Ver fatores de mudança
          </button>
        </div>
      </section>

      <BarraDeAbas />

      <div id="painel-aba" role="tabpanel" aria-labelledby={`aba-${aba}`} className="flex min-w-0 flex-col gap-5">
        <p className="text-micro text-texto-3">
          Passo {FLUXO.indexOf(passo) + 1} de {FLUXO.length} · <span className="text-texto-2">{passo.titulo}</span>: {passo.texto}
        </p>
        {aba === "sistema" && <MapaDeAtores />}
        {aba === "fatores" && <FatoresDeMudanca />}
        {aba === "cenarios" && <AreaDeCenarios />}
        {aba === "tempo" && <LinhaDoTempo />}
        {aba === "evidencias" && <AreaDeEvidencias />}
        {aba === "metodo" && <MetodoERevisao />}
      </div>

      <p className="border-t border-linha pt-4 text-micro text-texto-3">
        {r.origem} {ix.fontes.size} fontes reais; nenhuma demonstrativa.
      </p>
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
