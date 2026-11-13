import { ChevronRight, PanelLeftClose, PanelLeftOpen, Plus, X } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { rotas } from "../../config/rotas";
import { usePreferencias } from "../../contexts/Preferencias";
import { Logo } from "../brand/Logo";
import { cx } from "../ui/classes";
import { Dica } from "../ui/Dica";
import { ITENS_PRINCIPAIS, ITENS_SECUNDARIOS, iniciais, type ItemDoMenu } from "./itens";

/* ── Conteúdo compartilhado (menu fixo e gaveta) ─────────────────── */

interface ConteudoProps {
  recolhido: boolean;
  /** Na gaveta: fechar ao navegar. */
  aoNavegar?: () => void;
  /** Botão do topo: recolher (fixo) ou fechar (gaveta). */
  acaoDoTopo?: ReactNode;
  /** Linha "Recolher menu" no fim (só no fixo). */
  aoAlternar?: () => void;
}

function ConteudoDoMenu({ recolhido, aoNavegar, acaoDoTopo, aoAlternar }: ConteudoProps) {
  const { perfil } = usePreferencias();

  const link = (item: ItemDoMenu) => (
    <li key={item.para}>
      <Dica texto={item.rotulo} lado="direita" desativada={!recolhido} redundante>
        <NavLink
          to={item.para}
          end={item.exato}
          className="fr-menu-item"
          aria-label={recolhido ? item.rotulo : undefined}
          onClick={aoNavegar}
        >
          <span className="fr-menu-indicador" aria-hidden="true" />
          <item.Icone className="fr-menu-item-icone" aria-hidden="true" strokeWidth={1.75} />
          <span className="fr-menu-rotulo">{item.rotulo}</span>
        </NavLink>
      </Dica>
    </li>
  );

  return (
    <div className="fr-menu-conteudo">
      <div className="fr-menu-topo">
        <Link to={rotas.inicio} className="fr-menu-marca" aria-label="F.R.E.Y.A. — ir para o início" onClick={aoNavegar}>
          <span className="fr-menu-marca-simbolo">
            <Logo variante="simbolo" tamanho={30} animada titulo="" />
          </span>
          <span className="fr-menu-marca-palavra" aria-hidden="true">
            F.R.E.Y.A.
          </span>
        </Link>
        {acaoDoTopo}
      </div>

      <Dica texto="Nova análise" lado="direita" desativada={!recolhido} redundante>
        <NavLink to={rotas.novaAnalise} className="fr-menu-nova" aria-label={recolhido ? "Nova análise" : undefined} onClick={aoNavegar}>
          <span className="fr-menu-nova-icone" aria-hidden="true">
            <Plus strokeWidth={2.25} />
          </span>
          <span className="fr-menu-rotulo">Nova análise</span>
        </NavLink>
      </Dica>

      <nav className="fr-menu-nav" aria-label="Navegação principal">
        <ul className="fr-menu-lista">{ITENS_PRINCIPAIS.map(link)}</ul>
        <hr className="fr-menu-divisor" />
        <ul className="fr-menu-lista">{ITENS_SECUNDARIOS.map(link)}</ul>
      </nav>

      <div className="fr-menu-rodape">
        <hr className="fr-menu-divisor" />
        {aoAlternar && (
          <Dica texto="Expandir menu" lado="direita" desativada={!recolhido} redundante>
            <button
              type="button"
              className="fr-menu-item fr-menu-alternar"
              onClick={aoAlternar}
              aria-label={recolhido ? "Expandir menu" : "Recolher menu"}
              aria-expanded={!recolhido}
            >
              <span className="fr-menu-indicador" aria-hidden="true" />
              {recolhido ? (
                <PanelLeftOpen className="fr-menu-item-icone" aria-hidden="true" strokeWidth={1.75} />
              ) : (
                <PanelLeftClose className="fr-menu-item-icone" aria-hidden="true" strokeWidth={1.75} />
              )}
              <span className="fr-menu-rotulo" aria-hidden="true">
                Recolher menu
              </span>
            </button>
          </Dica>
        )}
        <Dica texto={`${perfil.nome} — ${perfil.funcao}`} lado="direita" desativada={!recolhido} redundante>
          <NavLink to={rotas.perfil} className="fr-menu-perfil" aria-label={recolhido ? `Perfil: ${perfil.nome}` : undefined} onClick={aoNavegar}>
            <span className="fr-avatar" aria-hidden="true">
              {iniciais(perfil.nome)}
            </span>
            <span className="fr-menu-perfil-textos fr-menu-rotulo">
              <span className="fr-menu-perfil-nome">{perfil.nome}</span>
              <span className="fr-menu-perfil-funcao">{perfil.funcao}</span>
            </span>
            <ChevronRight className="fr-menu-perfil-seta fr-menu-rotulo" aria-hidden="true" size={16} strokeWidth={1.75} />
          </NavLink>
        </Dica>
      </div>
    </div>
  );
}

/* ── Menu fixo (≥ 768px) ─────────────────────────────────────────── */

/**
 * Menu lateral de vidro, flutuando à esquerda. Aberto (17,5rem) ou recolhido em trilho de ícones
 * (5,5rem) conforme `menuRecolhido` das preferências. Os ícones ficam na mesma coluna nos dois
 * estados, então nada salta sob o ponteiro ao alternar.
 */
export function MenuLateral({ className }: { className?: string }) {
  const { menuRecolhido, definir } = usePreferencias();
  return (
    <aside className={cx("fr-menu", className)} data-recolhido={menuRecolhido || undefined} data-dica-limite aria-label="Menu lateral">
      <ConteudoDoMenu recolhido={menuRecolhido} aoAlternar={() => definir({ menuRecolhido: !menuRecolhido })} />
    </aside>
  );
}

/* ── Gaveta (< 768px) ────────────────────────────────────────────── */

export interface GavetaDoMenuProps {
  aberta: boolean;
  aoFechar: () => void;
  /** Para onde o foco volta ao fechar (o botão que abriu). */
  retornoDoFoco?: React.RefObject<HTMLElement | null>;
}

const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Gaveta fora da tela para o celular: foco preso, Esc fecha, fundo escurecido fecha ao tocar. */
export function GavetaDoMenu({ aberta, aoFechar, retornoDoFoco }: GavetaDoMenuProps) {
  const painel = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const caminhoAnterior = useRef(pathname);

  // Fecha ao trocar de rota.
  useEffect(() => {
    if (caminhoAnterior.current !== pathname && aberta) aoFechar();
    caminhoAnterior.current = pathname;
  }, [pathname, aberta, aoFechar]);

  // Foco: entra no primeiro link ao abrir, volta para o botão ao fechar.
  const estavaAberta = useRef(false);
  useEffect(() => {
    if (aberta) {
      painel.current?.querySelector<HTMLElement>(FOCAVEIS)?.focus();
    } else if (estavaAberta.current) {
      retornoDoFoco?.current?.focus();
    }
    estavaAberta.current = aberta;
  }, [aberta, retornoDoFoco]);

  // Esc fecha, mesmo com o foco fora do painel.
  useEffect(() => {
    if (!aberta) return;
    const tecla = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        aoFechar();
      }
    };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [aberta, aoFechar]);

  function prenderFoco(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab" || !painel.current) return;
    const itens = Array.from(painel.current.querySelectorAll<HTMLElement>(FOCAVEIS));
    if (itens.length === 0) return;
    const primeiro = itens[0];
    const ultimo = itens[itens.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primeiro.focus();
    }
  }

  return (
    <div className="fr-gaveta" data-aberta={aberta || undefined} aria-hidden={!aberta} inert={!aberta}>
      <div className="fr-gaveta-fundo" onClick={aoFechar} aria-hidden="true" />
      <div ref={painel} className="fr-gaveta-painel" role="dialog" aria-modal="true" aria-label="Menu" onKeyDown={prenderFoco}>
        <ConteudoDoMenu
          recolhido={false}
          aoNavegar={aoFechar}
          acaoDoTopo={
            <button type="button" className="fr-menu-fechar" aria-label="Fechar menu" onClick={aoFechar}>
              <X aria-hidden="true" size={20} strokeWidth={1.75} />
            </button>
          }
        />
      </div>
    </div>
  );
}
