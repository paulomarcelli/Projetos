/**
 * Método e estado do projeto. As três camadas de toda resposta (fato, inferência, hipótese), ligadas por um fio de
 * ouro que se desenha ao chegar na tela; e o roteiro real da Iris (config/metodo.ts): o que está disponível, o que
 * é a próxima fase e o que está planejado. Nenhum número de marketing.
 */
import { m } from "motion/react";
import { ESTADO_ETAPA, METODO } from "../../../config/metodo";
import { CAMADAS } from "../conteudo";

const COR = { Fato: "#a9b5d4", Inferência: "#7fa2ff", Hipótese: "#f5c451" } as const;

export function Camadas() {
  return (
    <div className="relative">
      <svg aria-hidden="true" className="absolute top-[22px] left-0 hidden h-px w-full overflow-visible md:block" preserveAspectRatio="none" viewBox="0 0 100 1">
        <m.line x1="4" y1="0.5" x2="96" y2="0.5" stroke="#f5c451" strokeWidth="1" vectorEffect="non-scaling-stroke" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true, margin: "-20% 0px" }} transition={{ duration: 1.6, ease: [0.77, 0, 0.175, 1] }} />
      </svg>
      <ol className="relative m-0 grid list-none gap-8 p-0 md:grid-cols-3">
        {CAMADAS.map((c, i) => (
          <m.li
            key={c.rotulo}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20% 0px" }}
            transition={{ duration: 0.6, delay: 0.35 * i, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col gap-3"
          >
            <span className="grid size-11 place-items-center rounded-full border bg-[color:var(--lp-noite)] font-mono text-[0.875rem]" style={{ color: COR[c.rotulo as keyof typeof COR], borderColor: `${COR[c.rotulo as keyof typeof COR]}66` }}>
              {i + 1}
            </span>
            <p className="text-[0.75rem] tracking-[0.08em] uppercase" style={{ color: COR[c.rotulo as keyof typeof COR] }}>
              {c.rotulo}
            </p>
            <h3 className="text-[1.25rem] font-medium tracking-[-0.01em] text-[color:var(--lp-texto)]">{c.titulo}</h3>
            <p className="text-[0.9375rem] leading-relaxed text-[color:var(--lp-texto-2)]">{c.texto}</p>
          </m.li>
        ))}
      </ol>
    </div>
  );
}

export function EstadoDoProjeto() {
  return (
    <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {METODO.map((e, i) => {
        const disponivel = e.estado === "disponivel";
        const proxima = e.estado === "proxima";
        return (
          <m.li
            key={e.titulo}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.5, delay: 0.06 * i, ease: [0.23, 1, 0.32, 1] }}
            className={`lp-painel flex flex-col gap-3 p-5 ${disponivel ? "!border-[color:var(--lp-ouro)]/45" : ""}`}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="font-mono text-[0.75rem] text-[color:var(--lp-texto-3)]">{String(i + 1).padStart(2, "0")}</span>
              <span className={`lp-chip !py-0.5 !text-[0.75rem] ${disponivel ? "!border-[color:var(--lp-ouro)]/50 !text-[color:var(--lp-ouro)]" : proxima ? "!text-[color:var(--lp-texto)]" : ""}`}>
                {disponivel && <span className="lp-pulso size-1.5 rounded-full bg-[color:var(--lp-ouro)]" />}
                {ESTADO_ETAPA[e.estado]}
              </span>
            </span>
            <h3 className="text-[1.0625rem] font-medium text-[color:var(--lp-texto)]">{e.titulo}</h3>
            <p className="text-[0.875rem] leading-relaxed text-[color:var(--lp-texto-2)]">{e.texto}</p>
          </m.li>
        );
      })}
    </ol>
  );
}
