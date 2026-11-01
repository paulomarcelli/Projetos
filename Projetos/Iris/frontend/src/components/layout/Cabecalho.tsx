/** Barra do topo da plataforma: recolher/abrir o menu no desktop; botão da gaveta e marca no celular. */
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { Ref } from "react";
import { ajustarMenu } from "../../store/preferencias";
import { Marca } from "../common/Marca";

type Props = {
  ref?: Ref<HTMLElement>;
  desktop: boolean;
  menuAberto: boolean;
  gavetaAberta: boolean;
  aoAbrirGaveta: () => void;
};

export function Cabecalho({ ref, desktop, menuAberto, gavetaAberta, aoAbrirGaveta }: Props) {
  return (
    <header
      ref={ref}
      className="sticky top-0 z-30 flex items-center gap-3 border-b border-linha bg-abismo py-2.5 print:hidden"
      style={{
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      {desktop ? (
        <>
          <button
            type="button"
            className="botao botao-fantasma botao-pequeno -ml-1 px-2"
            aria-label={menuAberto ? "Recolher o menu lateral" : "Abrir o menu lateral"}
            aria-expanded={menuAberto}
            onClick={() => ajustarMenu({ recolhido: menuAberto })}
          >
            {menuAberto ? <PanelLeftClose size={18} aria-hidden="true" /> : <PanelLeftOpen size={18} aria-hidden="true" />}
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className="botao botao-fantasma botao-pequeno -ml-1 min-h-11 px-2.5"
            aria-label="Abrir navegação"
            aria-expanded={gavetaAberta}
            onClick={aoAbrirGaveta}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <Marca altura={22} />
        </>
      )}
    </header>
  );
}
