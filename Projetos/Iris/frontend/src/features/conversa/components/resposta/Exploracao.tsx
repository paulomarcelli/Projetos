/**
 * 05 Explorar a investigação: o mapa das relações, a timeline, as evidências e fontes e o método com os limites,
 * cada um numa linha que abre no lugar. Aprofundam o que sustenta os cenários sem competir com eles: ficam recolhidos
 * e só carregam quando abertos (o mapa e a timeline são pesados e a conversa pode ter várias respostas).
 */
import { BookOpenCheck, ChevronDown, GitBranch, History, ScrollText, type LucideIcon } from "lucide-react";
import { lazy, Suspense, type ReactNode } from "react";
import { LinhasEsqueleto } from "../../../../components/ui/Carregando";
import { Epistemico } from "../../../../components/ui/Epistemico";
import { useResultado } from "../../../investigacao/contexto";
import { Citacoes } from "../../../investigacao/components/pecas";
import { ancora, CabecalhoDeParte } from "./partes";

const MapaGeopolitico = lazy(() => import("../../../relacoes/components/MapaGeopolitico").then((m) => ({ default: m.MapaGeopolitico })));
const AreaDaTimeline = lazy(() => import("../../../linha-do-tempo/components/AreaDaTimeline").then((m) => ({ default: m.AreaDaTimeline })));
const AreaDeEvidencias = lazy(() => import("../../../evidencias/components/Evidencias").then((m) => ({ default: m.AreaDeEvidencias })));

export type Visualizacao = "mapa" | "timeline" | "fontes" | "metodo";

export function Exploracao({ aberta, aoAbrir }: { aberta: Visualizacao | null; aoAbrir: (v: Visualizacao | null) => void }) {
  const { r } = useResultado();
  const id = ancora(r.id, "explorar");
  const linha = (v: Visualizacao, icone: LucideIcon, nome: string, resumo: string, conteudo: ReactNode) => (
    <Linha key={v} id={`${id}-${v}`} icone={icone} nome={nome} resumo={resumo} aberta={aberta === v} aoAlternar={() => aoAbrir(aberta === v ? null : v)}>
      {conteudo}
    </Linha>
  );
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="flex scroll-mt-24 flex-col gap-4">
      <CabecalhoDeParte rid={r.id} parte="explorar" titulo="Explorar a investigação">
        Os elementos que sustentam os cenários: quem se relaciona com quem, o que aconteceu e pode acontecer, e de onde vem cada afirmação.
      </CabecalhoDeParte>
      <div className="flex flex-col">
        {linha(
          "mapa",
          GitBranch,
          "Mapa das relações",
          `${r.atores.length} atores · ${r.relacoes.length} relações`,
          <div className="h-[max(480px,min(680px,72dvh))]">
            <MapaGeopolitico />
          </div>,
        )}
        {linha("timeline", History, "Timeline", `${r.linhaDoTempo.length} acontecimentos · ${r.horizonte.inicio}–${r.horizonte.fim}`, <AreaDaTimeline />)}
        {linha("fontes", BookOpenCheck, "Evidências e fontes", `${r.evidencias.length} evidências · ${r.fontes.length} fontes`, <AreaDeEvidencias />)}
        {linha("metodo", ScrollText, "Método e limites", `${r.metodos.length} métodos · ${r.limitacoes.length} limites declarados`, <MetodoELimites />)}
      </div>
    </section>
  );
}

function Linha({ id, icone: Icone, nome, resumo, aberta, aoAlternar, children }: { id: string; icone: LucideIcon; nome: string; resumo: string; aberta: boolean; aoAlternar: () => void; children: ReactNode }) {
  return (
    <div id={id} className="scroll-mt-24 border-t border-linha last:border-b">
      <button type="button" aria-expanded={aberta} aria-controls={`${id}-c`} onClick={aoAlternar} className="group flex w-full items-center gap-3 py-3.5 text-left">
        <Icone size={16} aria-hidden="true" className={aberta ? "text-ouro" : "text-texto-3 group-hover:text-texto-2"} />
        <span className="text-corpo text-texto">{nome}</span>
        <span className="numeros ml-auto hidden font-dados text-micro text-texto-3 sm:inline">{resumo}</span>
        <ChevronDown size={16} aria-hidden="true" className={`shrink-0 text-texto-3 transition-transform duration-200 ${aberta ? "rotate-180" : ""}`} />
      </button>
      {aberta && (
        <div id={`${id}-c`} className="aparecer min-w-0 pb-5">
          <Suspense fallback={<LinhasEsqueleto linhas={5} />}>{children}</Suspense>
        </div>
      )}
    </div>
  );
}

/** Transparência metodológica: como cada método foi (ou não) aplicado e o que esta investigação não sustenta. */
function MetodoELimites() {
  const { r } = useResultado();
  const APLICACAO = { aplicado: "aplicado", parcial: "aplicado em parte", "nao-aplicado": "não aplicado" } as const;
  return (
    <div className="grid gap-6 text-legenda leading-relaxed text-texto-2 md:grid-cols-2">
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {r.metodos.map((m) => (
          <li key={m.nome}>
            <span className="text-texto">{m.nome}</span> <span className="text-micro text-texto-3">· {APLICACAO[m.aplicacao]}</span>
            <span className="block">{m.como}</span>
          </li>
        ))}
      </ul>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {r.limitacoes.map((a, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-0.5 shrink-0">
              <Epistemico tipo={a.tipo} compacto />
            </span>
            <span>
              {a.texto}
              <Citacoes ids={a.evidencias} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
