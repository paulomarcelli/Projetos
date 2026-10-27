import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { InvestigacoesRecentes } from "../components/Investigacoes";
import { NovaInvestigacao } from "../components/NovaInvestigacao";
import { ResumoBase } from "../components/ResumoBase";
import { Secao } from "../components/Secao";
import { ROTAS } from "../lib/rotas";

const HOJE = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

export function Inicio() {
  return (
    <div className="flex flex-col gap-10">
      <header className="surgir flex flex-col gap-3">
        <p className="rotulo first-letter:uppercase">{HOJE}</p>
        <h1 className="font-editorial text-[2rem] leading-[2.375rem] font-medium tracking-[-0.015em] text-texto sm:text-manchete">
          <span className="block">Entenda o presente.</span>
          <span className="block text-texto-2">Explore futuros possíveis.</span>
        </h1>
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
          <Secao id="titulo-base" titulo="Base científica" emPainel>
            <ResumoBase />
          </Secao>
        </div>
      </div>
    </div>
  );
}
