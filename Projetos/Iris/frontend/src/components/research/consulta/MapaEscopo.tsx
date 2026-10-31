import { useMemo, useState } from "react";
import { ALTURA, LARGURA, prepararMapa } from "../../relations/geo/mundo";
import { NOME_REGIAO, REGIOES, type RegiaoId } from "../../relations/geo/regioes-def";

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
                        ? "color-mix(in srgb, var(--color-ciano) 14%, transparent)"
                        : "color-mix(in srgb, var(--color-ciano) 32%, transparent)"
                      : destacada
                        ? "var(--color-terra-foco)"
                        : "var(--color-grafite-alto)"
                  }
                  stroke={ativa && !global ? "color-mix(in srgb, var(--color-ciano) 80%, transparent)" : "color-mix(in srgb, var(--color-texto-3) 38%, transparent)"}
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
