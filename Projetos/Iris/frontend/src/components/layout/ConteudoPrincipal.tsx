/** Coluna de conteúdo da plataforma: recebe o foco ao trocar de página e limita a largura de leitura. */
import type { ReactNode, Ref } from "react";

export function ConteudoPrincipal({ ref, children }: { ref?: Ref<HTMLElement>; children: ReactNode }) {
  return (
    <main
      id="conteudo"
      ref={ref}
      tabIndex={-1}
      className="fundo-cartografico flex-1 outline-none focus:outline-none focus-visible:outline-none"
      style={{
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      {/* Coluna de leitura de 1200 px. Páginas com visualização marcam um descendente com
          data-largura="ampla" e a coluna se abre a 1600 px (o CSS usa :has, sem estado). */}
      <div className="coluna-pagina mx-auto w-full py-6 sm:px-2 lg:px-6 lg:py-10">{children}</div>
    </main>
  );
}
