/**
 * 02 Cenários prospectivos — "Quais futuros podem surgir?"
 *
 * A seção de maior protagonismo: faixa em `institucional` com o filete de ouro (ouro = o núcleo da investigação,
 * sem significado epistêmico). Os três cenários lado a lado em cartões curtos (TresCenarios/CartaoDeCenario);
 * "Explorar o cenário" abre os dez itens no painel lateral (400 px no desktop, folha no celular), sem sair da
 * página. O que separa os futuros já está no diagnóstico, logo acima, e não se repete aqui. Os nomes e arquétipos
 * vêm da investigação; nenhuma probabilidade é inventada.
 */
import { SecaoDaInvestigacao } from "../blocos";
import { useResultado } from "../investigacao/contexto";
import { SECOES } from "../investigacao/secoes";
import { TresCenarios } from "../prospectiva/TresCenarios";

export function SecaoCenarios() {
  const { r } = useResultado();
  return (
    <SecaoDaInvestigacao secao={SECOES[1]} destaque acao={<p className="text-legenda text-texto-3">Trajetórias condicionais, sem probabilidade atribuída</p>}>
      {r.cenarios.length === 0 ? (
        <p className="max-w-[64ch] text-corpo text-texto-2">
          Esta investigação não reuniu dados suficientes para construir cenários. O diagnóstico continua válido; as lacunas estão em "Como esta análise foi
          feita".
        </p>
      ) : (
        <>
          <p className="max-w-[72ch] text-legenda text-texto-3">
            Futuros possíveis entre {r.horizonte.inicio} e {r.horizonte.fim}. Clique num cartão para destacá-lo no mapa e na linha do tempo; "Explorar o
            cenário" abre o detalhe completo ao lado.
          </p>
          <TresCenarios />
        </>
      )}
    </SecaoDaInvestigacao>
  );
}
