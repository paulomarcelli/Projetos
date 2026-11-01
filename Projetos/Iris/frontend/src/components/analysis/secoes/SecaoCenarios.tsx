/**
 * 02 Cenários prospectivos — "Quais futuros podem surgir?"
 *
 * A seção de maior protagonismo: faixa em `institucional` com o filete de ouro (ouro = o núcleo da investigação,
 * sem significado epistêmico). Os três cenários lado a lado (TresCenarios/CartaoDeCenario), com o essencial
 * visível; "Explorar o cenário" abre os dez itens no painel lateral (400 px no desktop, folha no celular), sem
 * sair da página. Os nomes e arquétipos vêm da investigação; nenhuma probabilidade é inventada.
 */
import { SecaoDaInvestigacao } from "../blocos";
import { useResultado } from "../investigacao/contexto";
import { SECOES } from "../investigacao/secoes";
import { TresCenarios } from "../prospectiva/TresCenarios";

export function SecaoCenarios() {
  const { r } = useResultado();
  const principal = r.incertezas.find((i) => i.id === r.principalIncerteza);
  return (
    <SecaoDaInvestigacao
      secao={SECOES[1]}
      destaque
      acao={<p className="text-legenda text-texto-3">Trajetórias condicionais, sem probabilidade atribuída</p>}
    >
      {r.cenarios.length === 0 ? (
        <p className="max-w-[64ch] text-corpo text-texto-2">
          Esta investigação não reuniu dados suficientes para construir cenários. O diagnóstico continua válido; as lacunas
          estão em "Como esta análise foi feita".
        </p>
      ) : (
        <>
          <p className="flex max-w-[72ch] flex-wrap items-baseline gap-x-2 gap-y-1 text-corpo text-texto-2">
            <span className="text-micro font-medium tracking-[0.06em] text-ambar uppercase">O que separa os futuros</span>
            <span className="text-texto">{principal?.pergunta ?? r.incertezas[0]?.pergunta}</span>
            <span className="text-legenda text-texto-3">
              Futuros possíveis entre {r.horizonte.inicio} e {r.horizonte.fim}. Escolha um para destacá-lo no mapa e na linha do tempo; "Explorar o
              cenário" abre o detalhe ao lado.
            </span>
          </p>
          <TresCenarios />
        </>
      )}
    </SecaoDaInvestigacao>
  );
}
