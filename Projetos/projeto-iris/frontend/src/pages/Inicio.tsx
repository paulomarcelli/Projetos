import { ArrowRight, GitBranch, Radar } from "lucide-react";
import { Link } from "react-router";
import { EstruturaDeCenario } from "../components/Diagramas";
import { Epistemico, type TipoEpistemico } from "../components/Epistemico";
import { EstadoVazio } from "../components/Estados";
import { InvestigacoesRecentes } from "../components/Investigacoes";
import { NovaInvestigacao } from "../components/NovaInvestigacao";
import { ResumoBase } from "../components/ResumoBase";
import { Secao } from "../components/Secao";
import { ROTAS } from "../lib/rotas";

const LEITURA: TipoEpistemico[] = ["fato", "evidencia", "inferencia", "hipotese", "cenario", "incerteza", "limitacao"];

const HOJE = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

export function Inicio() {
  return (
    <div className="flex flex-col gap-12">
      <header className="surgir flex flex-col gap-5">
        <p className="rotulo first-letter:uppercase">{HOJE}</p>
        <h1 className="font-editorial text-[2rem] leading-[2.375rem] font-medium tracking-[-0.015em] text-texto sm:text-manchete">
          <span className="block">Entenda o presente.</span>
          <span className="block text-texto-2">Explore futuros possíveis.</span>
        </h1>
        <p className="max-w-[62ch] text-leitura text-texto-2">
          Investigue acontecimentos internacionais a partir de evidências científicas rastreáveis e
          construa cenários condicionais para a ordem internacional, com premissas e incertezas
          explícitas.
        </p>
        <div className="flex flex-col gap-2 border-t border-linha pt-4">
          <p className="rotulo">Como ler cada afirmação</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {LEITURA.map((t) => (
              <li key={t}>
                <Epistemico tipo={t} />
              </li>
            ))}
          </ul>
        </div>
      </header>

      <NovaInvestigacao />

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <Secao
            id="titulo-recentes"
            titulo="Investigações recentes"
            acao={
              <Link to={ROTAS.investigacoes} className="inline-flex items-center gap-1 text-legenda text-ciano-texto hover:underline">
                Todas
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            }
          >
            <InvestigacoesRecentes limite={4} />
          </Secao>
        </div>
        <div className="lg:col-span-5">
          <Secao id="titulo-base" titulo="Base científica" subtitulo="Estado real do acervo documental." emPainel>
            <ResumoBase />
          </Secao>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
        <Secao
          id="titulo-cenarios"
          titulo="Cenários e relações"
          subtitulo="Comparação entre hipóteses, atores, variáveis críticas e consequências de diferentes trajetórias."
        >
          <div className="flex flex-col gap-5">
            <EstadoVazio
              icone={<GitBranch size={22} strokeWidth={1.5} aria-hidden="true" />}
              titulo="Nenhum cenário salvo"
              marcador={{ tipo: "limitacao", rotulo: "Depende do motor de investigação" }}
            >
              Cada cenário vai declarar suas premissas e mostrar, lado a lado, como diferentes
              trajetórias afetam os atores e as variáveis críticas.
            </EstadoVazio>
            <EstruturaDeCenario />
            <Link to={ROTAS.cenarios} className="inline-flex w-fit items-center gap-1 text-legenda text-ciano-texto hover:underline">
              Sobre os cenários prospectivos
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </Secao>

        <Secao
          id="titulo-sinais"
          titulo="Sinais antecipatórios"
          subtitulo="Indícios de mudança relevantes para os cenários acompanhados."
        >
          <EstadoVazio
            icone={<Radar size={22} strokeWidth={1.5} aria-hidden="true" />}
            titulo="Nenhum sinal monitorado"
            marcador={{ tipo: "incerteza", rotulo: "Sem cenários acompanhados, não há o que monitorar" }}
          >
            <p>Quando houver cenários acompanhados, cada sinal vai mostrar:</p>
            <ul className="mt-2 flex list-none flex-col gap-1.5 p-0">
              {[
                "a fonte e a data em que foi observado;",
                "a variável crítica a que se relaciona;",
                "por que ele é relevante para o cenário.",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <span aria-hidden="true" className="mt-2.5 h-px w-3 shrink-0 bg-texto-3" />
                  {t}
                </li>
              ))}
            </ul>
          </EstadoVazio>
        </Secao>
      </div>
    </div>
  );
}
