/**
 * 03 Comparação estratégica — "O que diferencia os futuros possíveis?"
 *
 * Não repete os cartões da seção 02: mostra só o que separa uma trajetória da outra.
 *   1. fatores críticos: como cada fator determinante se move em cada futuro;
 *   2. onde cada futuro se posiciona (matriz 2×2), SÓ quando há duas incertezas críticas que a sustentem;
 *   3. condições que favorecem cada trajetória (do que cada uma depende e o que a desencadeia);
 *   4. consequências divergentes: as regiões em que os efeitos diferem entre os cenários;
 *   5. indicadores que favorecem ou enfraquecem cada cenário;
 *   6. o que levaria a Iris a revisar a interpretação.
 * Tudo qualitativo: nenhuma probabilidade, nota ou peso.
 */
import type { Cenario, Efeito } from "../../../types/cenario";
import { SecaoDaInvestigacao, Subtitulo } from "../blocos";
import { useResultado } from "../investigacao/contexto";
import { Letra } from "../investigacao/pecas";
import { SECOES } from "../investigacao/secoes";
import { DirecoesDosFatores, MatrizDasIncertezas, matrizAplicavel, SinaisDeAlerta } from "../prospectiva/ComparacaoDeCenarios";
import { TabelaComparativa } from "../prospectiva/TabelaComparativa";

const EFEITO: Record<Efeito, { rotulo: string; simbolo: string; cor: string }> = {
  aproximacao: { rotulo: "aproximação", simbolo: "+", cor: "text-ciano-texto" },
  atrito: { rotulo: "atrito", simbolo: "!", cor: "text-ambar" },
  misto: { rotulo: "misto", simbolo: "±", cor: "text-texto-2" },
  neutro: { rotulo: "sem mudança", simbolo: "=", cor: "text-texto-3" },
};

export function SecaoComparacao() {
  const { r } = useResultado();
  if (r.cenarios.length < 2) return null;
  const comMatriz = matrizAplicavel(r);
  return (
    <SecaoDaInvestigacao secao={SECOES[2]}>
      <p className="max-w-[72ch] border-l-2 border-linha-forte pl-4 text-legenda text-texto-2">
        Comparação qualitativa. A Iris não atribui probabilidade, nota nem peso aos cenários: as posições vêm das premissas de cada um, e os
        indicadores dizem o que observar, não o que vai acontecer.
      </p>

      <Parte id="t-fatores-criticos" titulo="Fatores críticos que alteram o resultado" texto="O mesmo fator, três direções: é aqui que os futuros se separam.">
        <DirecoesDosFatores />
      </Parte>

      {comMatriz ? (
        <Parte id="t-matriz" titulo="Onde cada futuro se posiciona" texto="As duas incertezas críticas formam os eixos; cada cenário está no quadrante das suas premissas.">
          <MatrizDasIncertezas />
        </Parte>
      ) : (
        <p className="max-w-[72ch] text-legenda text-texto-3">
          Sem matriz 2×2: ela só se aplica quando há duas incertezas críticas e todos os cenários têm posição nas duas. Esta investigação tem{" "}
          {r.incertezas.length} {r.incertezas.length === 1 ? "incerteza crítica" : "incertezas críticas"}.
        </p>
      )}

      <Parte id="t-condicoes" titulo="Condições que favorecem cada trajetória" texto="Do que cada futuro depende e o que o desencadearia.">
        <TabelaComparativa
          legenda="Condições e gatilhos de cada cenário"
          linhas={[
            { rotulo: "Depende de", valor: (c: Cenario) => <Lista itens={c.condicoes} /> },
            { rotulo: "Desencadeado por", valor: (c: Cenario) => <Lista itens={c.gatilhos} /> },
          ]}
        />
      </Parte>

      <ConsequenciasDivergentes />

      <Parte id="t-sinais" titulo="Indicadores que favorecem ou enfraquecem" texto="Se um destes sinais aparecer, ele dá força a uns futuros e tira de outros. Um sinal não confirma um cenário.">
        <SinaisDeAlerta />
      </Parte>

      <Parte id="t-revisao" titulo="Quando a Iris revisaria esta interpretação" texto="Condições que, observadas, obrigam a rever cada cenário.">
        <TabelaComparativa legenda="O que levaria a revisar cada cenário" linhas={[{ rotulo: "Rever se", valor: (c: Cenario) => <Lista itens={c.revisao} /> }]} />
      </Parte>
    </SecaoDaInvestigacao>
  );
}

function Parte({ id, titulo, texto, children }: { id: string; titulo: string; texto: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <Subtitulo id={id} titulo={titulo}>
        {texto}
      </Subtitulo>
      {children}
    </section>
  );
}

function Lista({ itens }: { itens: string[] }) {
  if (!itens.length) return <span className="text-texto-3">Nada declarado.</span>;
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {itens.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  );
}

/**
 * Consequências divergentes: só as regiões em que os efeitos NÃO são iguais nos três cenários (onde são iguais, não
 * há diferença a comparar). Cada célula traz símbolo e palavra.
 */
function ConsequenciasDivergentes() {
  const { r } = useResultado();
  const regioes = [...new Set(r.cenarios.flatMap((c) => c.consequencias.map((q) => q.regiao)))];
  const efeito = (c: Cenario, regiao: string) => c.consequencias.find((q) => q.regiao === regiao);
  const divergentes = regioes.filter((g) => new Set(r.cenarios.map((c) => efeito(c, g)?.efeito ?? "—")).size > 1);
  if (!divergentes.length) return null;
  return (
    <Parte id="t-consequencias" titulo="Consequências estratégicas divergentes" texto="Regiões em que os futuros produzem efeitos diferentes. Passe o cursor para ler o efeito descrito.">
      <TabelaComparativa
        legenda="Efeito de cada cenário em cada região, onde os efeitos divergem"
        linhas={divergentes.map((g) => ({
          rotulo: g,
          valor: (c: Cenario) => {
            const q = efeito(c, g);
            if (!q) return <span className="text-texto-3">Não analisado</span>;
            const e = EFEITO[q.efeito];
            return (
              <span className="flex flex-col gap-0.5" title={q.texto}>
                <span className={`inline-flex items-center gap-1.5 ${e.cor}`}>
                  <span aria-hidden="true" className="font-dados">
                    {e.simbolo}
                  </span>
                  {e.rotulo}
                </span>
                <span className="line-clamp-2 text-micro text-texto-3">{q.texto}</span>
              </span>
            );
          },
        }))}
      />
      <p className="flex flex-wrap items-center gap-x-3 text-micro text-texto-3">
        {r.cenarios.map((c) => (
          <span key={c.id} className="inline-flex items-center gap-1.5">
            <Letra id={c.id} /> {c.nome}
          </span>
        ))}
      </p>
    </Parte>
  );
}
