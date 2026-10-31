/**
 * Painel contextual da investigação: o detalhe do que está selecionado (ator, relação, evento,
 * evidência, cenário ou método), com histórico para voltar. Cada conteúdo vive em ./painel/.
 */
import { ArrowLeft, ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CartaoFonte } from "../../evidencias/components/CartaoFonte";
import { PainelAtor } from "./painel/PainelAtor";
import { PainelEvento } from "./painel/PainelEvento";
import { PainelEvidencia } from "./painel/PainelEvidencia";
import { PainelRelacao } from "./painel/PainelRelacao";
import { Compacto, NATUREZA } from "./painel/pecasDoPainel";
import type { CenarioId } from "../../../types/cenario";
import { useResultado, type Selecao } from "../contexto";
import { PainelMetodo } from "../../analise/components/Metodo";
import { DetalheDoCenario } from "../../prospectiva/components/DetalheDoCenario";

/** Cenário completo no painel: o mesmo detalhe da timeline, sem a moldura própria. */
function PainelCenario({ id }: { id: CenarioId }) {
  const { ix } = useResultado();
  const c = ix.cenarios.get(id);
  return c ? <DetalheDoCenario c={c} embutido /> : null;
}

// ------------------------------------------------------------------ painel

const TITULO: Record<NonNullable<Selecao>["tipo"], string> = {
  ator: "Ator",
  relacao: "Conexão",
  evento: "Linha do tempo",
  evidencia: "Rastreabilidade",
  cenario: "Cenário",
  metodo: "Como esta análise foi feita",
};

/**
 * Painel contextual. No desktop fica à direita; no celular é uma folha inferior que deixa o mapa
 * visível acima e pode ser recolhida. Guarda um histórico para voltar ao item anterior.
 */
export function PainelContextual({ variante = "lateral" }: { variante?: "lateral" | "flutuante" }) {
  const { selecao, selecionar } = useResultado();
  const [historico, setHistorico] = useState<NonNullable<Selecao>[]>([]);
  const [recolhido, setRecolhido] = useState(false);
  const anterior = useRef<Selecao>(null);
  const voltando = useRef(false);
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const prev = anterior.current;
    if (!selecao) setHistorico([]);
    else if (prev && !voltando.current && (prev.tipo !== selecao.tipo || prev.id !== selecao.id)) setHistorico((h) => [...h.slice(-9), prev]);
    voltando.current = false;
    anterior.current = selecao;
    if (selecao) {
      setRecolhido(false);
      titulo.current?.focus({ preventScroll: true });
      // No celular, a folha cobre a metade de baixo: traz o mapa para cima para não perder o contexto.
      if (variante === "lateral" && (selecao.tipo === "ator" || selecao.tipo === "relacao") && window.matchMedia?.("(max-width: 1023px)").matches) {
        document.getElementById("mapa-atores")?.scrollIntoView({ block: "start" });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selecao]);

  useEffect(() => {
    if (!selecao) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && selecionar(null);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [selecao, selecionar]);

  if (!selecao) return null;
  const voltar = () => {
    const h = [...historico];
    const prev = h.pop();
    setHistorico(h);
    voltando.current = true;
    selecionar(prev ?? null);
  };

  const painel = (
    <aside
      aria-label="Painel contextual"
      className={
        "print:hidden " +
        (variante === "flutuante"
          ? "painel-flutuante absolute inset-x-2 bottom-2 z-30 flex max-h-[58%] flex-col rounded-painel border border-linha-forte bg-abismo/95 shadow-[0_16px_48px_rgb(0_0_0/0.5)] sm:inset-x-auto sm:top-[3.75rem] sm:right-3 sm:bottom-3 sm:max-h-none sm:w-[340px]"
          : "aparecer fixed inset-x-0 bottom-0 z-40 flex max-h-[52dvh] flex-col rounded-t-painel border-t border-linha-forte bg-institucional shadow-[0_-12px_40px_rgb(0_0_0/0.45)] lg:inset-x-auto lg:top-0 lg:right-0 lg:bottom-0 lg:max-h-none lg:w-[400px] lg:rounded-none lg:border-t-0 lg:border-l")
      }
      style={variante === "flutuante" ? undefined : { paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center gap-1 border-b border-linha px-3 py-2" style={{ paddingRight: "max(0.75rem, env(safe-area-inset-right))" }}>
        {historico.length > 0 && (
          <button type="button" className="botao botao-fantasma botao-pequeno size-10 p-0" aria-label="Voltar ao item anterior" onClick={voltar}>
            <ArrowLeft size={17} aria-hidden="true" />
          </button>
        )}
        <h2 ref={titulo} tabIndex={-1} className="min-w-0 flex-1 truncate px-1 text-legenda font-medium text-texto outline-none">
          {TITULO[selecao.tipo]}
        </h2>
        <button
          type="button"
          className="botao botao-fantasma botao-pequeno size-10 p-0 lg:hidden"
          aria-label={recolhido ? "Expandir painel" : "Recolher painel"}
          aria-expanded={!recolhido}
          onClick={() => setRecolhido((x) => !x)}
        >
          <ChevronDown size={18} aria-hidden="true" className={recolhido ? "rotate-180" : ""} />
        </button>
        <button type="button" className="botao botao-fantasma botao-pequeno size-10 p-0" aria-label="Fechar painel" onClick={() => selecionar(null)}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      {!recolhido && (
        <div className="flex flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4" style={{ paddingRight: "max(1rem, env(safe-area-inset-right))" }}>
          <Compacto.Provider value={variante === "flutuante"}>
          {selecao.tipo === "ator" && <PainelAtor id={selecao.id} />}
          {selecao.tipo === "relacao" && <PainelRelacao id={selecao.id} />}
          {selecao.tipo === "evento" && <PainelEvento id={selecao.id} />}
          {selecao.tipo === "evidencia" && <PainelEvidencia id={selecao.id} />}
          {selecao.tipo === "cenario" && <PainelCenario id={selecao.id} />}
          {selecao.tipo === "metodo" && <PainelMetodo />}
          </Compacto.Provider>
        </div>
      )}
    </aside>
  );
  // O painel lateral é fixo na tela: vai num portal, para nenhum transform da página (o menu, ao recolher) o deslocar.
  return variante === "flutuante" ? painel : createPortal(painel, document.body);
}

// Reexportados para quem lista fontes fora do painel (Evidências e fontes, na análise).
export { CartaoFonte, NATUREZA };
