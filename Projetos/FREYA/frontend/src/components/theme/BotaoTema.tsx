import { useId, useRef, type MouseEvent } from "react";
import { cx } from "../ui/classes";
import { Dica } from "../ui/Dica";
import { useTrocaDeTema } from "./useTrocaDeTema";

export interface BotaoTemaProps {
  className?: string;
  tamanho?: "medio" | "grande";
}

/**
 * Alterna claro/escuro com o Scarlet Reality Shift saindo do centro do botão.
 * O ícone é um só SVG que se transforma: o sol (núcleo + 8 raios) vira lua crescente quando a sombra
 * (círculo da máscara) desliza sobre o núcleo e os raios recolhem. Só transform e opacity.
 * Semântica: o rótulo diz a ação ("Ativar modo escuro" / "Ativar modo claro"). Não usa aria-pressed de
 * propósito: com um rótulo que muda, "pressionado" seria lido em dobro e confundiria.
 */
export function BotaoTema({ className, tamanho = "medio" }: BotaoTemaProps) {
  const { tema, alternar } = useTrocaDeTema();
  const ref = useRef<HTMLButtonElement>(null);
  const mascara = `fr-tema-mascara-${useId().replace(/:/g, "")}`;
  const escuro = tema === "escuro";
  const rotulo = escuro ? "Ativar modo claro" : "Ativar modo escuro";

  function clicar(e: MouseEvent<HTMLButtonElement>) {
    const r = (ref.current ?? e.currentTarget).getBoundingClientRect();
    void alternar({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  }

  return (
    <Dica texto={rotulo} lado="baixo" redundante>
    <button
      ref={ref}
      type="button"
      className={cx("fr-tema", `fr-tema--${tamanho}`, className)}
      aria-label={rotulo}
      data-tema-atual={tema}
      onClick={clicar}
    >
      <svg className="fr-tema-icone" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
        <defs>
          <mask id={mascara}>
            <rect x="0" y="0" width="24" height="24" fill="#fff" />
            <circle className="fr-tema-sombra" cx="17" cy="7" r="6.6" fill="#000" />
          </mask>
        </defs>
        <circle className="fr-tema-nucleo" cx="12" cy="12" r="5" mask={`url(#${mascara})`} />
        <g className="fr-tema-raios">
          {Array.from({ length: 8 }, (_, i) => (
            <line key={i} x1="12" y1="2.4" x2="12" y2="4.4" transform={`rotate(${i * 45} 12 12)`} />
          ))}
        </g>
      </svg>
    </button>
    </Dica>
  );
}
