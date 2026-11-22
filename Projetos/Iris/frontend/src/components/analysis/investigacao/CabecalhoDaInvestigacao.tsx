import { ArrowLeft, Printer } from "lucide-react";
import { Link } from "react-router";
import { PREVIA } from "../../../config/env";
import { ROTAS } from "../../../config/rotas";
import { dataDoDia, Versao } from "../../common/Versao";
import { useResultado } from "./contexto";
import { versaoAtual } from "./versoes";

/**
 * Cabeçalho da investigação (tela "Investigação com o leque" do docs/design-system.md): a volta para a lista e as
 * ações numa linha; a pergunta como título; embaixo, a versão em vigor, a data da revisão e a próxima revisão (o
 * cenário é um objeto versionado). Ações só as que existem: o método, no painel, e a impressão/PDF.
 */
export function CabecalhoDaInvestigacao() {
  const { r, selecionar } = useResultado();
  return (
    <header className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Link to={ROTAS.investigacoes} className="inline-flex min-h-11 w-fit items-center gap-1.5 text-legenda text-texto-2 hover:text-texto print:hidden">
          <ArrowLeft size={14} aria-hidden="true" />
          Investigações
        </Link>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {PREVIA && <span className="rounded-fino bg-grafite px-2 py-1 text-micro text-texto-2">Dados de exemplo</span>}
          <button type="button" onClick={() => selecionar({ tipo: "metodo", id: "metodo" })} className="inline-flex min-h-11 items-center rounded-fino px-1 text-legenda text-ciano-texto underline-offset-4 hover:underline">
            Como esta análise foi feita
          </button>
          <button type="button" onClick={() => window.print()} className="botao botao-secundario botao-pequeno">
            <Printer size={15} aria-hidden="true" />
            Imprimir ou salvar PDF
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="m-0 max-w-[40ch] font-editorial text-[calc(1.5rem*var(--escala-titulo))] leading-[1.2] font-normal text-balance text-texto sm:text-titulo">
          {r.pergunta}
        </h1>
        <p className="m-0 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-micro text-texto-3">
          <Versao numero={versaoAtual(r)} />
          <span className="numeros font-dados">revisada em {dataDoDia(r.atualizadoEm)}</span>
          {r.proximaRevisao && (
            <>
              <span aria-hidden="true">·</span>
              <span className="numeros font-dados">próxima revisão {dataDoDia(r.proximaRevisao)}</span>
            </>
          )}
        </p>
      </div>
    </header>
  );
}
