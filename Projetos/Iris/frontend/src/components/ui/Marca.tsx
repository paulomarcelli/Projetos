import { MARCA } from "../../config/marca";
import { SIMBOLO, WORDMARK } from "../../config/marca-geometria";

/**
 * Marca Iris: um único componente para todos os usos (navegação, login, landing, rodapé).
 *
 * O símbolo é uma íris que olha para fora do próprio círculo: o anel aberto é o sistema
 * observado, a pupila voltada ao vão é o olhar analítico, e o nó em ciano é o que se investiga
 * (o outro ator, a relação, o futuro). Os SVGs em public/recursos/icones/marca/ têm a mesma geometria.
 *
 * Cores: em fundo escuro, tinta clara e o ciano da interface; em fundo claro, tinta abismo e um
 * ciano mais escuro (o ciano de interface não tem contraste suficiente sobre branco).
 */
const TONS = {
  escuro: { tinta: "var(--color-texto)", acento: "var(--color-ciano)" },
  claro: { tinta: "var(--color-abismo)", acento: "#0A6F91" },
} as const;

type Tom = keyof typeof TONS;

/** Só o símbolo (botão de menu, marca d'água). Decorativo: o nome vem de quem o usa. */
export function SimboloIris({ tamanho = 28, tom = "escuro" }: { tamanho?: number; tom?: Tom }) {
  const { tinta, acento } = TONS[tom];
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <path d={SIMBOLO.anel} fill="none" stroke={tinta} strokeWidth="2.6" strokeLinecap="round" />
      <circle {...SIMBOLO.pupila} fill={tinta} />
      <circle {...SIMBOLO.no} fill={acento} />
    </svg>
  );
}

/**
 * Versão horizontal (símbolo + wordmark). `altura` é a do conjunto em px; a largura segue a
 * proporção da grade. `compacta` mostra só o símbolo, para espaços estreitos.
 * O SVG tem `role="img"` e o nome da marca: o link que o envolve não precisa de outro rótulo.
 */
export function Marca({ compacta = false, altura = 26, tom = "escuro" }: { compacta?: boolean; altura?: number; tom?: Tom }) {
  if (compacta) return <SimboloIris tamanho={altura} tom={tom} />;
  const { tinta, acento } = TONS[tom];
  return (
    <svg
      height={altura}
      width={(altura * WORDMARK.largura) / 32}
      viewBox={`0 0 ${WORDMARK.largura} 32`}
      role="img"
      aria-label={MARCA.nomeCurto}
      className="block shrink-0"
    >
      <path d={SIMBOLO.anel} fill="none" stroke={tinta} strokeWidth="2.6" strokeLinecap="round" />
      <circle {...SIMBOLO.pupila} fill={tinta} />
      <circle {...SIMBOLO.no} fill={acento} />
      <path d={WORDMARK.d} transform={WORDMARK.transform} fill={tinta} />
    </svg>
  );
}
