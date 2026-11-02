import { BookOpen, CircleCheck, CircleHelp, Lightbulb, ShieldCheck, Users, Waypoints, type LucideIcon } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cx } from "./classes";

/* Tipos locais (espelham src/types/api.ts) para o design system não depender da camada de dados. */
export type TipoEpistemicoDoSelo = "confirmado" | "inferencia" | "hipotese";
export type ConfiabilidadeDoSelo = "oficial" | "enciclopedia" | "wiki_fas";

export const EPISTEMICO: Record<TipoEpistemicoDoSelo, { rotulo: string; descricao: string; Icone: LucideIcon }> = {
  confirmado: { rotulo: "Confirmado", descricao: "Afirmado diretamente pelas fontes", Icone: CircleCheck },
  inferencia: { rotulo: "Inferência", descricao: "Deduzido a partir das evidências", Icone: Waypoints },
  hipotese: { rotulo: "Hipótese", descricao: "Possibilidade ainda sem confirmação", Icone: Lightbulb },
};

export const CONFIABILIDADE: Record<ConfiabilidadeDoSelo, { rotulo: string; descricao: string; Icone: LucideIcon }> = {
  oficial: { rotulo: "Fonte oficial", descricao: "Material oficial da Marvel Studios", Icone: ShieldCheck },
  enciclopedia: { rotulo: "Enciclopédia", descricao: "Obra de referência editada", Icone: BookOpen },
  wiki_fas: { rotulo: "Wiki de fãs", descricao: "Wiki colaborativa de fãs", Icone: Users },
};

interface SeloBase extends HTMLAttributes<HTMLSpanElement> {
  /** Só o ícone (o rótulo vai para aria-label e title). */
  compacto?: boolean;
}

export interface SeloEpistemicoProps extends SeloBase {
  tipo: TipoEpistemicoDoSelo;
}

/** Selo do tipo epistêmico de uma afirmação. Cor + ícone + texto: nunca só a cor. */
export function SeloEpistemico({ tipo, compacto = false, className, ...resto }: SeloEpistemicoProps) {
  const info = EPISTEMICO[tipo] ?? EPISTEMICO.hipotese;
  const { Icone } = info;
  return (
    <span
      className={cx("fr-selo", `fr-selo--${tipo}`, compacto && "fr-selo--compacto", className)}
      title={info.descricao}
      aria-label={compacto ? info.rotulo : undefined}
      role={compacto ? "img" : undefined}
      data-tipo={tipo}
      {...resto}
    >
      <Icone aria-hidden="true" size={14} strokeWidth={2} />
      {!compacto && info.rotulo}
    </span>
  );
}

export interface SeloConfiabilidadeProps extends SeloBase {
  /** Aceita qualquer texto vindo da API; valores desconhecidos viram "Fonte não classificada". */
  confiabilidade: ConfiabilidadeDoSelo | (string & {});
}

/** Selo da confiabilidade da fonte de uma evidência. */
export function SeloConfiabilidade({ confiabilidade, compacto = false, className, ...resto }: SeloConfiabilidadeProps) {
  const conhecida = confiabilidade in CONFIABILIDADE;
  const info = conhecida
    ? CONFIABILIDADE[confiabilidade as ConfiabilidadeDoSelo]
    : { rotulo: "Fonte não classificada", descricao: "Confiabilidade não informada", Icone: CircleHelp };
  const { Icone } = info;
  const classe = conhecida ? `fr-selo--${confiabilidade === "wiki_fas" ? "wiki" : confiabilidade}` : "fr-selo--neutro";
  return (
    <span
      className={cx("fr-selo", classe, compacto && "fr-selo--compacto", className)}
      title={info.descricao}
      aria-label={compacto ? info.rotulo : undefined}
      role={compacto ? "img" : undefined}
      data-confiabilidade={confiabilidade}
      {...resto}
    >
      <Icone aria-hidden="true" size={14} strokeWidth={2} />
      {!compacto && info.rotulo}
    </span>
  );
}
