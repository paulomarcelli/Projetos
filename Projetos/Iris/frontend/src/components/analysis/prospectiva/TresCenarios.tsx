/**
 * Os três cenários numa só tela: lado a lado (CartaoDeCenario) e depois comparados pelos
 * mesmos critérios (ComparacaoDeCenarios).
 *
 * De onde vem cada coisa (nada aqui é calculado nem estimado):
 *   - cartão          → campos do próprio cenário (ideia, mecanismos, atores decisivos,
 *                       condições, consequências, indicadores, incertezas, evidências);
 *   - matriz          → `posicao` de cada cenário nas incertezas críticas (polo 0, polo 1 ou
 *                       indiferente). É a matriz clássica de cenários: posição, não chance;
 *   - direções        → `direcao` de cada fator determinante em cada cenário (texto);
 *   - sinais de alerta→ `favorece` / `enfraquece` de cada sinal monitorado;
 *   - linha do tempo  → eventos com ano, comuns (agenda) ou de um cenário.
 * Não há probabilidade, nota nem peso: a comparação é qualitativa e diz isso na tela.
 *
 * Uma só fonte de verdade: o cenário em destaque é a `vista` do estado compartilhado (o mesmo
 * que o mapa e a timeline usam), e o detalhe completo abre no painel contextual, reaproveitando
 * o DetalheDoCenario da timeline. Os três cartões são o MESMO componente.
 */
import { CartaoDeCenario } from "./CartaoDeCenario";
import { useResultado } from "../investigacao/contexto";

/**
 * Os três lado a lado quando há largura (consulta de contêiner, não de tela: o menu lateral e o
 * painel mudam a largura útil). Em três colunas, a subgrade alinha as partes: "Lógica" de A fica
 * na altura de "Lógica" de B e C, e o olho compara em linha reta. Abaixo disso, empilham.
 */
export function TresCenarios() {
  const { r } = useResultado();
  return (
    <div className="@container">
      <ul className="m-0 grid list-none gap-4 p-0 @4xl:grid-cols-3">
        {r.cenarios.map((c, i) => (
          <CartaoDeCenario key={c.id} c={c} indice={i} />
        ))}
      </ul>
    </div>
  );
}
