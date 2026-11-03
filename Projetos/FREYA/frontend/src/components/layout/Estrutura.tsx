import { Menu } from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Link, Outlet } from "react-router";
import { rotas } from "../../config/rotas";
import { usePreferencias } from "../../contexts/Preferencias";
import { Logo } from "../brand/Logo";
import { GavetaDoMenu, MenuLateral } from "../sidebar/MenuLateral";
import { BotaoTema } from "../theme/BotaoTema";

/**
 * Casca da aplicação: fundo ambiente + menu lateral de vidro + área principal com a barra do topo
 * (botão do menu no celular, controle de tema à direita) + a página (<Outlet/>).
 *
 * Ao recolher/expandir o menu, a área principal muda de posição na hora (layout) e desliza do lugar
 * antigo para o novo com transform (FLIP), em sincronia com a largura do menu — nada reflui por quadro.
 */
export function Estrutura() {
  const { menuRecolhido, movimentoReduzido } = usePreferencias();
  const [gaveta, setGaveta] = useState(false);
  const botaoDoMenu = useRef<HTMLButtonElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const esquerdaAnterior = useRef<number | null>(null);

  const fecharGaveta = useCallback(() => setGaveta(false), []);

  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    const agora = el.getBoundingClientRect().left;
    const antes = esquerdaAnterior.current;
    esquerdaAnterior.current = agora;
    if (antes === null || movimentoReduzido || typeof el.animate !== "function") return;
    const delta = antes - agora;
    if (Math.abs(delta) < 1) return;
    el.animate([{ transform: `translateX(${delta}px)` }, { transform: "translateX(0)" }], {
      duration: 260,
      easing: "cubic-bezier(0.77, 0, 0.175, 1)",
    });
  }, [menuRecolhido, movimentoReduzido]);

  return (
    <div className="fr-estrutura" data-recolhido={menuRecolhido || undefined}>
      <a href="#conteudo" className="fr-pular">
        Pular para o conteúdo
      </a>
      <div className="fr-ambiente" aria-hidden="true" />

      <MenuLateral />
      <GavetaDoMenu aberta={gaveta} aoFechar={fecharGaveta} retornoDoFoco={botaoDoMenu} />

      <div ref={area} className="fr-area" inert={gaveta || undefined}>
        <header className="fr-topo">
          <button
            ref={botaoDoMenu}
            type="button"
            className="fr-topo-menu"
            aria-label="Abrir menu"
            aria-expanded={gaveta}
            onClick={() => setGaveta(true)}
          >
            <Menu aria-hidden="true" size={22} strokeWidth={1.75} />
          </button>
          <Link to={rotas.inicio} className="fr-topo-marca" aria-label="F.R.E.Y.A. — ir para o início">
            <Logo variante="completa" tamanho={24} titulo="" />
          </Link>
          <div className="fr-topo-acoes">
            <BotaoTema />
          </div>
        </header>
        <main id="conteudo" className="fr-conteudo" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
