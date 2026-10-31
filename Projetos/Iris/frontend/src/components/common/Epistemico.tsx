/**
 * Linguagem epistêmica do Iris: toda afirmação diz de que tipo ela é.
 * A distinção nunca depende só da cor — cada tipo tem uma forma própria e um rótulo.
 */

export type TipoEpistemico =
  | "fato"
  | "evidencia"
  | "inferencia"
  | "hipotese"
  | "cenario"
  | "incerteza"
  | "limitacao";

export const EPISTEMICO: Record<
  TipoEpistemico,
  { rotulo: string; descricao: string; cor: string }
> = {
  fato: {
    rotulo: "Fato observado",
    descricao: "Registrado diretamente pelo sistema ou pela fonte, sem interpretação.",
    cor: "var(--color-texto)",
  },
  evidencia: {
    rotulo: "Evidência documental",
    descricao: "Afirmação sustentada por um documento rastreável (documento e página).",
    cor: "var(--color-ciano-texto)",
  },
  inferencia: {
    rotulo: "Inferência analítica",
    descricao: "Conclusão derivada de evidências por um método explícito; pode ser revista.",
    cor: "var(--color-texto-2)",
  },
  hipotese: {
    rotulo: "Hipótese",
    descricao: "Proposição a investigar. Ainda não sustentada por evidências suficientes.",
    cor: "var(--color-ambar)",
  },
  cenario: {
    rotulo: "Cenário condicional",
    descricao: "Futuro possível que só vale se as premissas declaradas se confirmarem.",
    cor: "var(--color-ambar)",
  },
  incerteza: {
    rotulo: "Incerteza",
    descricao: "Ponto em que as evidências divergem ou não existem.",
    cor: "var(--color-ambar)",
  },
  limitacao: {
    rotulo: "Limitação metodológica",
    descricao: "Restrição do método, dos dados ou do sistema que limita a conclusão.",
    cor: "var(--color-texto-2)",
  },
};

export function GlifoEpistemico({ tipo, tamanho = 14 }: { tipo: TipoEpistemico; tamanho?: number }) {
  const cor = EPISTEMICO[tipo].cor;
  const comum = { width: tamanho, height: tamanho, viewBox: "0 0 16 16", "aria-hidden": true, className: "shrink-0" } as const;
  switch (tipo) {
    case "fato":
      return (
        <svg {...comum}>
          <circle cx="8" cy="8" r="4.5" fill={cor} />
        </svg>
      );
    case "evidencia":
      return (
        <svg {...comum} fill="none" stroke={cor} strokeWidth="1.4" strokeLinejoin="round">
          <path d="M4 2.5h5.5L12.5 5.5v8H4z" />
          <path d="M9.5 2.5v3h3" />
          <path d="M6 9h4.5M6 11.2h3" strokeLinecap="round" />
        </svg>
      );
    case "inferencia":
      return (
        <svg {...comum} fill="none" stroke={cor} strokeWidth="1.5">
          <circle cx="8" cy="8" r="5" strokeDasharray="2.4 2" />
        </svg>
      );
    case "hipotese":
      return (
        <svg {...comum} fill="none" stroke={cor} strokeWidth="1.5" strokeLinejoin="round">
          <path d="M8 2.5 13.5 8 8 13.5 2.5 8z" />
        </svg>
      );
    case "cenario":
      return (
        <svg {...comum} fill="none" stroke={cor} strokeWidth="1.5" strokeLinecap="round">
          <path d="M2.5 8h4M6.5 8l6-4.5M6.5 8l6 4.5M6.5 8h6" />
        </svg>
      );
    case "incerteza":
      return (
        <svg {...comum} fill="none" stroke={cor} strokeWidth="1.6" strokeLinecap="round">
          <path d="M2 6.5c1.5-1.6 3-1.6 4.5 0s3 1.6 4.5 0 2.5-1.2 3 -0.6" />
          <path d="M2 10.5c1.5-1.6 3-1.6 4.5 0s3 1.6 4.5 0 2.5-1.2 3 -0.6" opacity="0.6" />
        </svg>
      );
    case "limitacao":
      return (
        <svg {...comum} fill="none" stroke={cor} strokeWidth="1.5">
          <circle cx="8" cy="8" r="5" />
          <path d="M4.6 11.4 11.4 4.6" />
        </svg>
      );
  }
}

/** Marcador com glifo + rótulo. `rotulo` permite um texto próprio (ex.: "Metadado do PDF"). */
export function Epistemico({
  tipo,
  rotulo,
  compacto = false,
}: {
  tipo: TipoEpistemico;
  rotulo?: string;
  compacto?: boolean;
}) {
  const def = EPISTEMICO[tipo];
  return (
    <span
      className="inline-flex max-w-full items-start gap-1.5 text-micro text-texto-2"
      title={`${def.rotulo}: ${def.descricao}`}
    >
      <span className="mt-px shrink-0">
        <GlifoEpistemico tipo={tipo} />
      </span>
      {compacto ? <span className="sr-only">{rotulo ?? def.rotulo}</span> : <span className="min-w-0">{rotulo ?? def.rotulo}</span>}
    </span>
  );
}
