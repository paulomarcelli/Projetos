import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Impacto, TipoCenario } from "../api/tipos";
import { CENARIO, NIVEL } from "../lib/rotulos";

const VAL = { baixo: 1, moderado: 2, alto: 3 } as const;
// tokens do tema (claro/escuro): o SVG resolve var() nos atributos de apresentação
const COR: Record<TipoCenario, string> = { continuidade: "rgb(var(--suave))", escalada: "rgb(var(--alto))", desescalada: "rgb(var(--baixo))" };
const GRADE = "rgb(var(--borda))";
const EIXO = "rgb(var(--suave))";
const NOMES = ["", "Baixo", "Moderado", "Alto"];

/** Barras qualitativas (1–3 = baixo/moderado/alto) por cenário. */
export function GraficoImpactos({ impactos }: { impactos: Impacto[] }) {
  const dados = impactos.map((i) => ({
    nome: i.titulo.length > 26 ? i.titulo.slice(0, 25) + "…" : i.titulo,
    completo: i.titulo,
    ...Object.fromEntries((Object.keys(CENARIO) as TipoCenario[]).map((c) => [c, i.por_cenario[c] ? VAL[i.por_cenario[c]!] : 0])),
  }));
  return (
    <div className="h-72 w-full" role="img" aria-label="Gráfico de impacto qualitativo por cenário; os mesmos dados aparecem na tabela abaixo.">
      <ResponsiveContainer>
        <BarChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="24%">
          <CartesianGrid vertical={false} stroke={GRADE} />
          <XAxis dataKey="nome" tick={{ fill: EIXO, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRADE }} interval={0} />
          <YAxis domain={[0, 3]} ticks={[1, 2, 3]} tickFormatter={(v) => NOMES[v] ?? ""} tick={{ fill: EIXO, fontSize: 11 }} tickLine={false} axisLine={false} width={68} />
          <Tooltip
            cursor={{ fill: "rgb(var(--painel-2) / .7)" }}
            contentStyle={{ background: "rgb(var(--painel))", border: `1px solid ${GRADE}`, borderRadius: 8, fontSize: 12, color: "rgb(var(--texto))" }}
            labelFormatter={(_, p) => (p?.[0]?.payload as { completo?: string })?.completo ?? ""}
            formatter={(v: number, n: string) => [NOMES[v] ?? "—", CENARIO[n as TipoCenario]?.rotulo ?? n]}
          />
          <Legend formatter={(n: string) => <span className="text-xs text-suave">{CENARIO[n as TipoCenario]?.rotulo ?? n}</span>} />
          {(Object.keys(CENARIO) as TipoCenario[]).map((c) => <Bar key={c} dataKey={c} fill={COR[c]} radius={[3, 3, 0, 0]} maxBarSize={28} animationDuration={500} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export const nivelTexto = (n?: keyof typeof NIVEL) => (n ? NIVEL[n] : "—");
