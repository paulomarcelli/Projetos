import type { ReactNode } from "react";
import { ALTURA, LARGURA, prepararMapa } from "../geo/mundo";

/**
 * Mapa-múndi estático, discreto (graticulado + países). Não carrega dados: serve de fundo
 * cartográfico para camadas que vêm por cima (`children`, desenhados no mesmo sistema 960×470).
 */
export function MapaMundo({
  children,
  rotulo,
  intensidade = "discreta",
}: {
  children?: ReactNode;
  rotulo: string;
  intensidade?: "discreta" | "minima";
}) {
  const mapa = prepararMapa();
  const preenchimento = intensidade === "minima" ? "rgb(36 52 73 / 0.55)" : "var(--color-grafite-alto)";
  const contorno = intensidade === "minima" ? "rgb(154 170 192 / 0.18)" : "rgb(154 170 192 / 0.34)";
  return (
    <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} role="img" aria-label={rotulo} className="block h-auto w-full">
      <path d={mapa.esfera} fill="none" stroke="var(--color-linha-forte)" strokeWidth="1" />
      <path d={mapa.grade} fill="none" stroke="var(--color-linha)" strokeWidth="0.6" />
      <g>
        {mapa.paises.map((p) => (
          <path key={p.id || p.d.slice(0, 24)} d={p.d} fill={preenchimento} stroke={contorno} strokeWidth={0.5} />
        ))}
      </g>
      {children}
    </svg>
  );
}

export default MapaMundo;
