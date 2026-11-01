/**
 * 05 Exploração e evidências — "Como as informações se relacionam e de onde vieram as conclusões?"
 *
 * Os componentes de exploração que já existiam, juntos no fim da página, como três vistas:
 *   - Mapa de relações (MapaGeopolitico): atores, países, organizações, blocos e as relações entre eles, por cenário;
 *   - Linha do tempo (AreaDaTimeline): acontecimentos em ordem, ligados a evidências e cenários;
 *   - Evidências e fontes (AreaDeEvidencias): a rastreabilidade de cada afirmação até a fonte.
 * A vista aberta é `aba` do estado compartilhado: "Ver no mapa" e "Na linha do tempo", em outras seções, abrem a
 * vista e trazem a página até aqui. O mapa e a linha do tempo são pesados: só montam quando a seção chega perto da
 * tela, e a troca de vista renderiza em segundo plano (useDeferredValue) com a vista nova entrando por opacidade.
 */
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { MapaGeopolitico } from "../../relations/MapaGeopolitico";
import { AreaDaTimeline } from "../../timeline/AreaDaTimeline";
import { SecaoDaInvestigacao } from "../blocos";
import { AreaDeEvidencias } from "../evidencias/Evidencias";
import { BarraDeAbas } from "../investigacao/BarraDeAbas";
import { ABAS, useResultado } from "../investigacao/contexto";
import { SECOES } from "../investigacao/secoes";

/** Monta o conteúdo quando a seção está a até ~1 tela de distância, ou quando uma vista foi pedida. */
function usePerto<T extends HTMLElement>(pedida: boolean) {
  const ref = useRef<T>(null);
  const [perto, setPerto] = useState(pedida || typeof IntersectionObserver === "undefined");
  useEffect(() => {
    if (pedida) setPerto(true);
  }, [pedida]);
  useEffect(() => {
    if (perto || !ref.current) return;
    const obs = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && setPerto(true), { rootMargin: "100% 0px" });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [perto]);
  return { ref, perto };
}

export function SecaoExploracao() {
  const { r, aba: abaEscolhida, escolherAba, exploracaoPedida } = useResultado();
  const aba = useDeferredValue(abaEscolhida);
  const { ref, perto } = usePerto<HTMLDivElement>(exploracaoPedida);
  return (
    <SecaoDaInvestigacao secao={SECOES[2]}>
      <div ref={ref} className="flex min-w-0 flex-col gap-6">
        <BarraDeAbas itens={ABAS} ativa={abaEscolhida} aoEscolher={escolherAba} rotulo="Vistas de exploração" idBase="vista" painel="painel-exploracao" />
        <div id="painel-exploracao" role="tabpanel" aria-labelledby={`vista-${aba}`} key={aba} className="vista-entra flex min-w-0 flex-col">
          {!perto ? (
            <p className="text-legenda text-texto-3">Carregando a vista…</p>
          ) : aba === "relacoes" ? (
            <div className="h-[max(520px,calc(100dvh-var(--altura-topo,0px)-10rem))]">
              <MapaGeopolitico painelProprio={false} />
            </div>
          ) : aba === "timeline" ? (
            <AreaDaTimeline />
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-legenda text-texto-2">
                {r.evidencias.length} afirmações rastreadas até {r.fontes.length} fontes. Cada número entre colchetes no texto leva até aqui.
              </p>
              <AreaDeEvidencias />
            </div>
          )}
        </div>
      </div>
    </SecaoDaInvestigacao>
  );
}
