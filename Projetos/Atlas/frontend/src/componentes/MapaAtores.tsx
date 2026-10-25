import { geoCentroid, geoNaturalEarth1, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { useEffect, useMemo, useState } from "react";
import { feature } from "topojson-client";
import type { AnaliseAtor, Ator, Relacao } from "../api/tipos";
import { BLOCOS, ISO_NUM } from "../lib/paises";

type Pais = Feature<Geometry, { name: string }>;
const COR_REL: Record<Relacao["tipo"], string> = { tensao: "rgb(var(--alto))", cooperacao: "rgb(var(--baixo))", dependencia: "rgb(var(--acento))", neutra: "rgb(var(--suave))" };
const ROT_REL: Record<Relacao["tipo"], string> = { tensao: "Tensão", cooperacao: "Cooperação", dependencia: "Dependência", neutra: "Neutra" };
const COR_POSTURA: Record<AnaliseAtor["postura"], string> = { confrontacional: "rgb(var(--alto))", neutra: "rgb(var(--acento))", cooperativa: "rgb(var(--baixo))" };
const L = 900, A = 460;

function idsDoAtor(a: Ator): string[] {
  if (a.iso3 && ISO_NUM[a.iso3]) return [ISO_NUM[a.iso3]];
  return BLOCOS[a.id] ?? [];
}

export function MapaAtores({ atores, relacoes, analise }: { atores: Ator[]; relacoes: Relacao[]; analise?: AnaliseAtor[] }) {
  const [paises, setPaises] = useState<Pais[] | null>(null);
  const [erro, setErro] = useState(false);
  useEffect(() => {
    let vivo = true;
    import("world-atlas/countries-110m.json")
      .then((m) => {
        const topo = (m.default ?? m) as unknown as Parameters<typeof feature>[0] & { objects: { countries: Parameters<typeof feature>[1] } };
        const fc = feature(topo, topo.objects.countries) as unknown as FeatureCollection<Geometry, { name: string }>;
        if (vivo) setPaises(fc.features.filter((f) => f.properties.name !== "Antarctica"));
      })
      .catch(() => vivo && setErro(true));
    return () => { vivo = false; };
  }, []);

  const proj = useMemo(() => geoNaturalEarth1().fitSize([L, A], { type: "Sphere" }).translate([L / 2, A / 2 + 20]), []);
  const caminho = useMemo(() => geoPath(proj), [proj]);
  const postura = new Map(analise?.map((a) => [a.ator_id, a.postura]));

  const destaque = new Map<string, Ator>();
  atores.forEach((a) => idsDoAtor(a).forEach((id) => destaque.set(id, a)));

  const centro = useMemo(() => {
    const m = new Map<string, [number, number]>();
    if (!paises) return m;
    for (const a of atores) {
      const ids = idsDoAtor(a);
      const fs = paises.filter((p) => ids.includes(String(p.id)));
      if (!fs.length) continue;
      // blocos: centróide do país "âncora" (o primeiro de maior área visível)
      const alvo = a.id === "ue" ? fs.find((f) => String(f.id) === "276") ?? fs[0] : fs[0];
      const p = proj(geoCentroid(alvo));
      if (p) m.set(a.id, p as [number, number]);
    }
    return m;
  }, [paises, atores, proj]);

  const semMapa = atores.filter((a) => !idsDoAtor(a).length);
  if (erro) return <p className="text-sm text-suave">Não foi possível carregar o mapa.</p>;

  return (
    <figure className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-borda bg-fundo">
        <svg viewBox={`0 0 ${L} ${A}`} role="img" aria-label={`Mapa dos atores: ${atores.map((a) => a.nome).join(", ")}`} className="block h-auto w-full">
          <path d={caminho({ type: "Sphere" }) ?? ""} fill="rgb(var(--fundo))" />
          {paises?.map((p) => {
            const at = destaque.get(String(p.id));
            return <path key={String(p.id) + p.properties.name} d={caminho(p) ?? ""} fill={at ? "rgb(var(--acento) / .32)" : "rgb(var(--painel-2))"} stroke={at ? "rgb(var(--acento) / .8)" : "rgb(var(--borda))"} strokeWidth={at ? 0.8 : 0.4} />;
          })}
          {relacoes.map((r, i) => {
            const a = centro.get(r.origem), b = centro.get(r.destino);
            if (!a || !b) return null;
            const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.22;
            const w = r.intensidade === "alto" ? 2.6 : r.intensidade === "moderado" ? 1.8 : 1.1;
            return <path key={i} d={`M${a[0]},${a[1]} Q${mx},${my} ${b[0]},${b[1]}`} fill="none" stroke={COR_REL[r.tipo]} strokeWidth={w} strokeDasharray={r.tipo === "dependencia" ? "5 4" : undefined} opacity={0.9}><title>{`${r.origem} → ${r.destino}: ${ROT_REL[r.tipo]} (${r.intensidade})`}</title></path>;
          })}
          {atores.map((a) => {
            const p = centro.get(a.id);
            if (!p) return null;
            const cor = COR_POSTURA[postura.get(a.id) ?? "neutra"];
            return (
              <g key={a.id} transform={`translate(${p[0]},${p[1]})`}>
                <circle r={6} fill="rgb(var(--fundo))" stroke={cor} strokeWidth={2.4} />
                <text y={-11} textAnchor="middle" className="fill-texto text-[13px] font-medium" style={{ paintOrder: "stroke", stroke: "rgb(var(--fundo))", strokeWidth: 4 }}>{a.nome.length > 22 ? a.nome.slice(0, 21) + "…" : a.nome}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-suave">
        {(Object.keys(ROT_REL) as Relacao["tipo"][]).map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5"><span aria-hidden className="h-0.5 w-4" style={{ background: COR_REL[t] }} />{ROT_REL[t]}</span>
        ))}
        <span className="inline-flex items-center gap-1.5">Contorno do ponto = postura (vermelho confrontacional · azul neutra · verde cooperativa)</span>
        {semMapa.length > 0 && <span>Sem posição no mapa: {semMapa.map((a) => a.nome).join(", ")}</span>}
      </figcaption>
    </figure>
  );
}
