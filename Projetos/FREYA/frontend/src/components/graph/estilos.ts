/**
 * Aparência dos nós por tipo (cor e ícone) e por papel (forma e contorno), sempre com tokens.
 * O escarlate fica de fora dos tipos: ele marca só foco, seleção e destaque.
 */
import {
  Building2,
  CalendarClock,
  Clapperboard,
  Cpu,
  Gem,
  Lightbulb,
  MapPin,
  Tv,
  User,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export interface EstiloDoTipo {
  rotulo: string;
  Icone: LucideIcon;
  /** classes para o corpo do nó (fill/stroke) */
  corpo: string;
  /** classe de cor do ícone e da amostra (text-*) */
  tinta: string;
  /** amostra da legenda (bg/border) */
  amostra: string;
}

const AZUL = { corpo: "fill-inferencia-tinta stroke-inferencia", tinta: "text-inferencia", amostra: "bg-inferencia-tinta border-inferencia" };
const VERDE_AZULADO = { corpo: "fill-confirmado-tinta stroke-confirmado", tinta: "text-confirmado", amostra: "bg-confirmado-tinta border-confirmado" };
const VERDE = { corpo: "fill-oficial-tinta stroke-oficial", tinta: "text-oficial", amostra: "bg-oficial-tinta border-oficial" };
const AMBAR = { corpo: "fill-hipotese-tinta stroke-hipotese", tinta: "text-hipotese", amostra: "bg-hipotese-tinta border-hipotese" };
const ARDOSIA = { corpo: "fill-enciclopedia-tinta stroke-enciclopedia", tinta: "text-enciclopedia", amostra: "bg-enciclopedia-tinta border-enciclopedia" };
const VIOLETA = { corpo: "fill-wiki-tinta stroke-wiki", tinta: "text-wiki", amostra: "bg-wiki-tinta border-wiki" };
const NEUTRO = { corpo: "fill-superficie-3 stroke-texto-fraco", tinta: "text-texto-suave", amostra: "bg-superficie-3 border-texto-fraco" };

export const TIPOS: Record<string, EstiloDoTipo> = {
  character: { rotulo: "Personagem", Icone: User, ...AZUL },
  person: { rotulo: "Pessoa", Icone: UserRound, ...AZUL },
  organization: { rotulo: "Organização", Icone: Building2, ...VERDE_AZULADO },
  company: { rotulo: "Empresa", Icone: Building2, ...VERDE_AZULADO },
  location: { rotulo: "Local", Icone: MapPin, ...VERDE },
  event: { rotulo: "Acontecimento", Icone: CalendarClock, ...AMBAR },
  film: { rotulo: "Filme", Icone: Clapperboard, ...ARDOSIA },
  series: { rotulo: "Série", Icone: Tv, ...ARDOSIA },
  artifact: { rotulo: "Artefato", Icone: Gem, ...VIOLETA },
  technology: { rotulo: "Tecnologia", Icone: Cpu, ...VIOLETA },
  concept: { rotulo: "Conceito", Icone: Lightbulb, ...NEUTRO },
};

export function estiloDoTipo(tipo: string): EstiloDoTipo {
  return TIPOS[tipo] ?? { ...TIPOS.concept, rotulo: tipo };
}

export const PAPEIS: Record<string, { rotulo: string; descricao: string }> = {
  focal: { rotulo: "Focal", descricao: "citada na questão" },
  ponte: { rotulo: "Ponte", descricao: "liga entidades focais" },
  contexto: { rotulo: "Contexto", descricao: "vizinhança relevante" },
  trajetoria: { rotulo: "Trajetória", descricao: "momento ou obra da trajetória" },
  expansao: { rotulo: "Expansão", descricao: "trazida por você ao expandir um nó" },
};

export function rotuloDoPapel(papel: string): string {
  return PAPEIS[papel]?.rotulo ?? papel;
}

/** Atributos conhecidos, em português; os outros saem com a chave legível. */
export const ATRIBUTOS: Record<string, string | null> = {
  nome_real: "Nome real",
  especie: "Espécie",
  cidadania: "Cidadania",
  nascimento: "Nascimento",
  morte: "Morte",
  estado: "Situação",
  titulos: "Títulos",
  ano: "Ano",
  ordem_na_trajetoria: "Ordem na trajetória",
  personagem: "Personagem",
  blip: "Atingido pelo Blip",
  url: "Página oficial",
  wiki_revid: null,
  wiki_titulo: null,
};

export function rotuloDoAtributo(chave: string): string | null {
  if (chave in ATRIBUTOS) return ATRIBUTOS[chave];
  const t = chave.replace(/_/g, " ");
  return t.charAt(0).toLocaleUpperCase("pt-BR") + t.slice(1);
}
