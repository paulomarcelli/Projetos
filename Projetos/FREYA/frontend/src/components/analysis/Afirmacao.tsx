import type { ElementType } from "react";
import type { Afirmacao as TipoAfirmacao } from "../../types/api";
import { SeloEpistemico, cx } from "../ui";
import { ListaDeChips } from "./Evidencias";

export interface AfirmacaoProps {
  afirmacao: TipoAfirmacao;
  como?: ElementType;
  /** "normal" texto corrido; "destaque" um pouco maior (lógica do cenário) */
  tamanho?: "normal" | "destaque" | "pequeno";
  className?: string;
}

/** Uma afirmação da análise: o texto, o tipo epistêmico (selo) e as evidências citadas (chips que abrem a fonte). */
export function Afirmacao({ afirmacao, como: Como = "div", tamanho = "normal", className }: AfirmacaoProps) {
  return (
    <Como className={cx("flex flex-col gap-2", className)} data-tipo-epistemico={afirmacao.tipo}>
      <p className={cx("text-pretty", tamanho === "destaque" ? "text-base text-texto" : tamanho === "pequeno" ? "text-sm text-texto-suave" : "text-[0.9375rem] leading-relaxed text-texto")}>
        {afirmacao.texto}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <SeloEpistemico tipo={afirmacao.tipo} />
        <ListaDeChips ids={afirmacao.evidencias} />
      </div>
    </Como>
  );
}

/** Lista de afirmações com divisórias. */
export function ListaDeAfirmacoes({ itens, vazio = "Nada registrado nesta parte.", tamanho }: { itens: TipoAfirmacao[]; vazio?: string; tamanho?: AfirmacaoProps["tamanho"] }) {
  if (itens.length === 0) return <p className="rounded-xl border border-dashed border-borda-forte px-4 py-3 text-sm text-texto-fraco">{vazio}</p>;
  return (
    <ul className="flex flex-col divide-y divide-borda">
      {itens.map((a, i) => (
        <Afirmacao key={i} como="li" afirmacao={a} tamanho={tamanho} className="py-3 first:pt-0 last:pb-0" />
      ))}
    </ul>
  );
}
