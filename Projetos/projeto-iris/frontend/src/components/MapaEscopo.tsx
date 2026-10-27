import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { useMemo, useState } from "react";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import mundoBruto from "world-atlas/countries-110m.json";
import { REGIAO_POR_PAIS } from "../geo/regioes";
import { NOME_REGIAO, REGIOES, type RegiaoId } from "../geo/regioes-def";

const LARGURA = 960;
const ALTURA = 470;

interface PaisDesenhado {
  id: string;
  d: string;
  regiao: RegiaoId | null;
}

function prepararMapa() {
  const mundo = mundoBruto as unknown as Topology<{ countries: GeometryCollection }>;
  const paises = feature(mundo, mundo.objects.countries) as unknown as FeatureCollection<Geometry>;
  const projecao = geoNaturalEarth1().fitExtent(
    [
      [8, 8],
      [LARGURA - 8, ALTURA - 8],
    ],
    { type: "Sphere" } as never,
  );
  const caminho = geoPath(projecao);
  const desenhados: PaisDesenhado[] = paises.features
    .filter((f: Feature<Geometry>) => String(f.id) !== "010") // Antártida: fora de qualquer escopo
    .map((f: Feature<Geometry>) => ({
      id: String(f.id ?? ""),
      d: caminho(f) ?? "",
      regiao: REGIAO_POR_PAIS[String(f.id)] ?? null,
    }));
  return {
    paises: desenhados,
    esfera: caminho({ type: "Sphere" } as never) ?? "",
    grade: caminho(geoGraticule10()) ?? "",
  };
}

/**
 * Seletor de escopo geográfico. O mapa é um atalho visual; as fichas abaixo dele são o
 * controle acessível (teclado e leitor de tela). Nenhuma seleção = escopo global.
 */
export function MapaEscopo({
  selecionadas,
  aoMudar,
}: {
  selecionadas: RegiaoId[];
  aoMudar: (regioes: RegiaoId[]) => void;
}) {
  const mapa = useMemo(prepararMapa, []);
  const [sobre, setSobre] = useState<RegiaoId | null>(null);
  const global = selecionadas.length === 0;

  const alternar = (r: RegiaoId) =>
    aoMudar(selecionadas.includes(r) ? selecionadas.filter((x) => x !== r) : [...selecionadas, r]);

  const resumo = global
    ? "Escopo global"
    : `Escopo: ${selecionadas.map((r) => NOME_REGIAO[r]).join(", ")}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-padrao border border-linha bg-abismo">
        <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} role="img" aria-label={resumo} className="block h-auto w-full">
          <path d={mapa.esfera} fill="none" stroke="var(--color-linha-forte)" strokeWidth="1" />
          <path d={mapa.grade} fill="none" stroke="var(--color-linha)" strokeWidth="0.6" />
          <g onPointerLeave={() => setSobre(null)}>
            {mapa.paises.map((p) => {
              const ativa = p.regiao !== null && (global || selecionadas.includes(p.regiao));
              const destacada = p.regiao !== null && p.regiao === sobre;
              return (
                <path
                  key={p.id || p.d.slice(0, 24)}
                  d={p.d}
                  className="transition-[fill,stroke] duration-150"
                  fill={
                    ativa
                      ? global
                        ? "rgb(82 199 232 / 0.14)"
                        : "rgb(82 199 232 / 0.32)"
                      : destacada
                        ? "#2c3e56"
                        : "var(--color-grafite-alto)"
                  }
                  stroke={ativa && !global ? "rgb(82 199 232 / 0.8)" : "rgb(154 170 192 / 0.38)"}
                  strokeWidth={0.6}
                  style={{ cursor: p.regiao ? "pointer" : "default" }}
                  onPointerEnter={() => p.regiao && setSobre(p.regiao)}
                  onClick={() => p.regiao && alternar(p.regiao)}
                />
              );
            })}
          </g>
        </svg>
        <p className="pointer-events-none absolute bottom-2 left-3 min-h-4 font-dados text-micro text-texto-3" aria-hidden="true">
          {sobre ? NOME_REGIAO[sobre] : "Clique numa região para incluí-la"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Regiões do escopo">
        <button type="button" className="ficha" aria-pressed={global} onClick={() => aoMudar([])}>
          Global
        </button>
        {REGIOES.map((r) => (
          <button
            key={r.id}
            type="button"
            className="ficha"
            aria-pressed={selecionadas.includes(r.id)}
            onClick={() => alternar(r.id)}
            onPointerEnter={() => setSobre(r.id)}
            onPointerLeave={() => setSobre(null)}
          >
            {r.nome}
          </button>
        ))}
      </div>
    </div>
  );
}
