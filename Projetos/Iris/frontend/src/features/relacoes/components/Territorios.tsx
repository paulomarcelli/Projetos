import { memo } from "react";
import { prepararMapa } from "../geo/mundo";

export const Territorios = memo(function Territorios({
  envolvidos,
  brasil,
  selecionado,
  bloco,
}: {
  envolvidos: Set<string>;
  brasil: string | null;
  selecionado: string | null;
  bloco: Set<string> | null;
}) {
  const mapa = prepararMapa();
  return (
    <g aria-hidden="true">
      <path d={mapa.grade} fill="none" stroke="color-mix(in srgb, var(--color-texto-3) 7%, transparent)" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
      {mapa.paises.map((p) => {
        const env = envolvidos.has(p.id);
        return (
          <path
            key={p.id || p.d.slice(0, 20)}
            d={p.d}
            className="territorio"
            fill={p.id === selecionado ? "color-mix(in srgb, var(--color-ciano) 22%, transparent)" : p.id === brasil ? "var(--color-terra-foco)" : env ? "var(--color-terra-envolvida)" : "var(--color-terra)"}
            stroke={env ? "color-mix(in srgb, var(--color-texto-3) 45%, transparent)" : "color-mix(in srgb, var(--color-texto-3) 16%, transparent)"}
            strokeWidth={env ? 0.8 : 0.5}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      {/* território dos membros do bloco em destaque (hachura), com transição de opacidade */}
      {mapa.paises
        .filter((p) => envolvidos.has(p.id))
        .map((p) => (
          <path
            key={`b-${p.id}`}
            d={p.d}
            fill="url(#hachura-bloco)"
            stroke="var(--color-texto-2)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            className="territorio-bloco"
            opacity={bloco?.has(p.id) ? 1 : 0}
          />
        ))}
    </g>
  );
});

// ------------------------------------------------------------------ mapa
