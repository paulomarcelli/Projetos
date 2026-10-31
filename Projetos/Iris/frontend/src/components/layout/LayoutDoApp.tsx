/**
 * Moldura da plataforma (/app): o menu lateral (MenuLateral, sobre o Dashboard Sidebar), a barra do topo, a gaveta do
 * celular e a coluna de conteúdo. CabecalhoDePagina (ao lado) é o cabeçalho padrão das páginas internas.
 *
 * - Desktop (≥ 1024 px): o menu fica preso à esquerda, na altura da tela; o botão do topo recolhe e abre (animado, a
 *   escolha fica guardada em store/preferencias.ts).
 *   A animação é FLIP: o layout muda de uma vez e o menu e o conteúdo deslizam por transform até o lugar novo. Animar a
 *   largura refazia o layout e a pintura da página inteira a cada quadro (travava em páginas longas e no mapa).
 * - Celular e tablet: o topo tem o botão que abre a gaveta com o mesmo menu; escolher um item fecha a gaveta.
 */
import { X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router";
import { useMidia } from "../../hooks/useMidia";
import { usePreferencias } from "../../store/preferencias";
import { Cabecalho } from "./Cabecalho";
import { ConteudoPrincipal } from "./ConteudoPrincipal";
import { MenuLateral } from "./MenuLateral";

export function LayoutDoApp({ children }: { children: ReactNode }) {
  const [gaveta, setGaveta] = useState(false);
  const [fechando, setFechando] = useState(false);
  const temporizador = useRef<number | undefined>(undefined);
  const local = useLocation();
  const principal = useRef<HTMLElement>(null);
  const topo = useRef<HTMLElement>(null);
  const { menu } = usePreferencias();
  const desktop = useMidia("(min-width: 1024px)");
  const aberto = !menu.recolhido;
  const menuFixo = useRef<HTMLDivElement>(null);
  const coluna = useRef<HTMLDivElement>(null);
  const abertoAntes = useRef(aberto);

  // Recolher/abrir o menu (FLIP). Roda depois de o layout mudar e antes da pintura: o conteúdo começa onde estava
  // (translate) e desliza até o lugar novo; ao recolher, o menu continua visível por cima enquanto sai.
  useLayoutEffect(() => {
    if (abertoAntes.current === aberto) return;
    abertoAntes.current = aberto;
    const fixo = menuFixo.current;
    const barra = fixo?.querySelector<HTMLElement>(".ds-sidebar");
    if (!desktop || !fixo || !barra || !coluna.current || typeof barra.animate !== "function") return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const largura = parseFloat(getComputedStyle(barra).getPropertyValue("--ds-width")) || 260;
    const opcoes = { duration: 300, easing: "cubic-bezier(0.32, 0.72, 0, 1)" };
    const fora = `translate3d(${-largura}px, 0, 0)`;
    for (const el of [barra, coluna.current]) el.getAnimations().forEach((a) => a.cancel());

    coluna.current.animate([{ transform: `translate3d(${aberto ? -largura : largura}px, 0, 0)` }, { transform: "none" }], opcoes);
    if (aberto) {
      delete fixo.dataset.saindo;
      barra.animate([{ transform: fora, opacity: 0 }, { transform: "none", opacity: 1 }], opcoes);
      return;
    }
    fixo.dataset.saindo = "";
    const saida = barra.animate([{ transform: "none", opacity: 1 }, { transform: fora, opacity: 0 }], opcoes);
    saida.onfinish = () => delete fixo.dataset.saindo;
  }, [aberto, desktop]);

  // Altura da barra do topo: as páginas encaixam as partes presas (abas, palco) abaixo dela.
  useEffect(() => {
    const el = topo.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty("--altura-topo", `${Math.round(el.getBoundingClientRect().height)}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fecha pela mesma borda por onde entrou; só desmonta quando a saída (200 ms) termina.
  const fecharGaveta = useCallback(() => {
    setFechando(true);
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => {
      setGaveta(false);
      setFechando(false);
    }, 200);
  }, []);
  const abrirGaveta = () => {
    window.clearTimeout(temporizador.current);
    setFechando(false);
    setGaveta(true);
  };
  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  // Ao trocar de página: fecha a gaveta e leva o foco ao conteúdo (leitores de tela).
  useEffect(() => {
    if (gaveta) fecharGaveta();
    principal.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local.pathname]);

  useEffect(() => {
    if (!gaveta) return;
    const aoTeclar = (e: globalThis.KeyboardEvent) => e.key === "Escape" && fecharGaveta();
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [gaveta, fecharGaveta]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:overflow-x-clip print:block">
      <a href="#conteudo" className="sr-only z-50 rounded-padrao bg-ciano px-3 py-2 text-abismo focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Pular para o conteúdo
      </a>

      {/* Desktop: o menu preso à esquerda, na altura da tela. Sempre montado, é o único que ouve o ⌘K e o ⌘,. */}
      <div ref={menuFixo} className="menu-fixo sticky top-0 hidden h-dvh lg:block print:hidden">
        <MenuLateral aberto={aberto} />
      </div>
      {/* Fora do desktop, o mesmo menu (sem os atalhos, que ficam na instância de cima) vai na gaveta. */}
      {gaveta && !desktop && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navegação">
          <button
            type="button"
            aria-label="Fechar navegação"
            className="gaveta-fundo absolute inset-0 bg-abismo/70"
            data-fechando={fechando || undefined}
            onClick={fecharGaveta}
          />
          <div data-fechando={fechando || undefined} className="gaveta absolute inset-y-0 left-0 flex border-r border-linha bg-abismo" style={{ paddingTop: "env(safe-area-inset-top)" }}>
            <MenuLateral atalhos={false} aoNavegar={fecharGaveta} />
            <button type="button" className="botao botao-fantasma botao-pequeno absolute top-4 right-3 px-2" aria-label="Fechar navegação" onClick={fecharGaveta}>
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <div ref={coluna} className="flex min-w-0 flex-col">
        <Cabecalho
          ref={topo}
          desktop={desktop}
          menuAberto={aberto}
          gavetaAberta={gaveta && !fechando}
          aoAbrirGaveta={abrirGaveta}
        />

        <ConteudoPrincipal ref={principal}>{children}</ConteudoPrincipal>
      </div>
    </div>
  );
}
