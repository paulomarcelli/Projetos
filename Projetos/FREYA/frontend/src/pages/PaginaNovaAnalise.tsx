import { ComposicaoDaAnalise } from "../components/chat";
import { CabecalhoDaPagina } from "../components/layout";
import { rotas } from "../config/rotas";

export function PaginaNovaAnalise() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col">
      <CabecalhoDaPagina
        titulo="Nova análise"
        subtitulo="Uma questão sobre o futuro de algo no MCU vira uma análise prospectiva: atores, incertezas, cenários e as evidências de cada afirmação."
        voltar={{ para: rotas.inicio, rotulo: "Início" }}
      />
      <ComposicaoDaAnalise variante="pagina" titulo="Sua questão" />
    </div>
  );
}
