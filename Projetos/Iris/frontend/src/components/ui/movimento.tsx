/**
 * Base de movimento da landing e das telas de autenticação (biblioteca Motion).
 *
 * Por que Motion só aqui: a plataforma (/app) anima com CSS (transições curtas e tokens em
 * styles/globais.css), o que basta para ela. A landing e a autenticação precisam do que o CSS não
 * faz bem: saída animada de componentes desmontados (AnimatePresence entre login, cadastro e
 * recuperação), linhas desenhadas em sequência (pathLength) e revelação ao rolar (whileInView).
 * Essas páginas são carregadas sob demanda, então a biblioteca não entra no pacote da plataforma.
 *
 * `LazyMotion` + `m` com `domAnimation`: só o conjunto de recursos usado (animações, saída,
 * whileInView), menor que o pacote completo. `strict` impede usar `motion.*` por engano, o que
 * traria o pacote inteiro de volta.
 *
 * Movimento reduzido: `MotionConfig reducedMotion="user"` desliga transformações (deslocamento,
 * escala) e mantém opacidade. Para desenhos (pathLength), os componentes consultam
 * `useReducedMotion` e já nascem no estado final.
 */
import { domAnimation, LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** As mesmas curvas dos tokens CSS (--ease-saida e --ease-movimento), em formato do Motion. */
export const CURVA_SAIDA = [0.23, 1, 0.32, 1] as const;
export const CURVA_MOVIMENTO = [0.77, 0, 0.175, 1] as const;

export function Movimento({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.24, ease: CURVA_SAIDA }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

/**
 * Entrada em sequência dos elementos de um bloco: cada filho com `variants={ITEM}` aparece
 * 70 ms depois do anterior. Só opacidade e um deslocamento de 12 px (transform), nunca altura.
 */
export const SEQUENCIA = {
  oculto: {},
  visivel: { transition: { staggerChildren: 0.07 } },
};
export const ITEM = {
  oculto: { opacity: 0, transform: "translateY(12px)" },
  visivel: { opacity: 1, transform: "translateY(0px)", transition: { duration: 0.5, ease: CURVA_SAIDA } },
};
