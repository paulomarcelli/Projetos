import { NovaInvestigacao } from "../../features/consulta/components/NovaInvestigacao";

/**
 * A pergunta com os seus parâmetros (horizonte, regiões, dimensões, profundidade): o ponto de entrada anterior à
 * conversa, mantido para quem quer delimitar a investigação antes de perguntar. Sem motor, vira rascunho.
 */
export function PaginaNovaComParametros() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 lg:pt-6">
      <header className="surgir flex flex-col gap-3">
        <p className="rotulo">Investigação com parâmetros</p>
        <h1 className="font-editorial text-[2rem] leading-[2.375rem] font-medium tracking-[-0.015em] text-texto sm:text-manchete">
          <span className="block">Delimite a pergunta.</span>
          <span className="block text-texto-2">Horizonte, regiões e dimensões.</span>
        </h1>
      </header>
      <NovaInvestigacao />
    </div>
  );
}
