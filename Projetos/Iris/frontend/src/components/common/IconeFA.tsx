/**
 * Ícone do Font Awesome (pacote gratuito, licença CC BY 4.0) desenhado direto do seu caminho SVG.
 *
 * Por que não o componente oficial: ele injeta uma folha de estilo em tempo de execução e traz o
 * núcleo da biblioteca. Aqui só entra o desenho de cada ícone importado (tree-shaking), e o
 * tamanho segue a fonte do texto ao redor (1em), como os ícones da biblioteca.
 *
 * Usado na landing. A plataforma continua com o conjunto Lucide, que já está espalhado por ela.
 */
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";

export function IconeFA({ icone, className = "", titulo }: { icone: IconDefinition; className?: string; titulo?: string }) {
  const [largura, altura, , , caminho] = icone.icon;
  const caminhos = Array.isArray(caminho) ? caminho : [caminho];
  return (
    <svg
      viewBox={`0 0 ${largura} ${altura}`}
      className={`inline-block h-[1em] w-auto shrink-0 fill-current ${className}`}
      role={titulo ? "img" : undefined}
      aria-hidden={titulo ? undefined : true}
      aria-label={titulo}
    >
      {caminhos.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
